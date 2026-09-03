process.env.TZ = 'Asia/Seoul';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// An agreement cannot be un-agreed by a client that is behind.
//
// 2026-09-03, six hours after PURPOSE.version went 1 -> 2 and forty minutes
// after it deployed: rules_consents held 11 v1 rows and one v2, profiles held
// ten v1 and NO v2. One profile had gone 1 -> 2 -> 1, and the reverting row
// carried a fresh agreed_at half a second before it was recorded — so it was
// not an old value being replayed, it was rulesAgreement() running again on a
// client whose PURPOSE.version was still 1. A tab opened before the deploy.
//
// The client fixes shipped with this: `>=` in agreedToRules, so an old bundle
// stops asking somebody who is ahead of it, and a consent write that touches
// only its own two columns. This is the floor under both, because the tab
// that did it was one nobody could reach and the next one will be too.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const HISTORY = 'supabase/migrations/2026-09-02a-rules-consents-history.sql';
const GUARD = 'supabase/migrations/2026-09-03a-consent-cannot-go-backwards.sql';
const ROLLBACK = 'supabase/migrations/2026-09-03a-consent-cannot-go-backwards-ROLLBACK.sql';

/** The part of a migration that changes things, without its verification. */
const applyPart = (sql, end) => {
  const at = sql.indexOf(end);
  if (at < 0) throw new Error(`the file no longer contains ${JSON.stringify(end)}`);
  return sql.slice(sql.indexOf('\nbegin;') + '\nbegin;'.length, at);
};

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const T1 = '2026-08-20T10:00:00+09:00';
const V2_AT = '2026-09-03T10:11:30.25+09:00';

const BOOTSTRAP = `
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key);
grant usage on schema public to anon, authenticated;
create table public.profiles (
  id uuid primary key,
  name text,
  nationality text,
  rules_version integer,
  rules_agreed_at timestamptz
);
grant select, insert, update on public.profiles to authenticated;
insert into auth.users (id) values ('${A}'), ('${B}');
insert into public.profiles (id, name, rules_version, rules_agreed_at) values
  ('${A}', 'a', 1, '${T1}'),
  ('${B}', 'b', 1, '${T1}');
`;

const db = new PGlite();
await db.exec(BOOTSTRAP);
const one = async (sql, params = []) => (await db.query(sql, params)).rows[0];
const versionOf = async (id) => (await one(`select rules_version, rules_agreed_at from public.profiles where id = $1`, [id]));
const historyCount = async () => (await one(`select count(*)::int as n from public.rules_consents`)).n;

test('control: without the guard, a client that is behind un-agrees somebody', async () => {
  // The incident, reproduced. The history table is applied first because it
  // is what made the incident visible at all; the guard is not yet.
  await db.exec(applyPart(read(HISTORY), '-- == Verification'));
  assert.equal(await historyCount(), 2, 'the backfill should have copied both v1 profiles');

  // A agrees to v2 the way the app writes it.
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [A, V2_AT]);
  assert.equal((await versionOf(A)).rules_version, 2);
  assert.equal(await historyCount(), 3, 'the v2 agreement was not logged');

  // Then the stale tab presses its own gate.
  await db.query(`update public.profiles set rules_version = 1, rules_agreed_at = now() where id = $1`, [A]);
  assert.equal((await versionOf(A)).rules_version, 1,
    'the control should show the revert this migration exists to stop');
  assert.equal(await historyCount(), 4,
    'and the revert should be in the log, which is the only reason anybody could see it');
});

test('with the guard, the same update leaves the agreement alone', async () => {
  await db.exec(applyPart(read(GUARD), '-- == Verification'));
  // The restore inside the migration puts A back to v2 from the log.
  const restored = await versionOf(A);
  assert.equal(restored.rules_version, 2, 'the reverted profile was not restored');

  const before = await historyCount();
  await db.query(`update public.profiles set rules_version = 1, rules_agreed_at = now() where id = $1`, [A]);
  assert.equal((await versionOf(A)).rules_version, 2, 'a lower version got through');
  assert.equal(await historyCount(), before, 'a blocked revert wrote a history row');
});

test('the timestamp is held with the version, not just the number', async () => {
  // Keeping the version and letting the clock through would record the older
  // agreement as having happened at the moment somebody was sent backwards.
  const before = await versionOf(A);
  await db.query(`update public.profiles set rules_version = 1, rules_agreed_at = '2030-01-01T00:00:00+09:00' where id = $1`, [A]);
  const after = await versionOf(A);
  assert.equal(after.rules_version, 2);
  assert.equal(after.rules_agreed_at.getTime(), before.rules_agreed_at.getTime(),
    'the version was held but the timestamp moved');
});

test('a client that sends null for consent does not erase it either', async () => {
  // Every profile save used to carry these two columns whether or not it
  // meant to, so `null` here is a save that was talking about a name.
  const before = await versionOf(A);
  await db.query(`update public.profiles set rules_version = null, rules_agreed_at = null where id = $1`, [A]);
  const after = await versionOf(A);
  assert.equal(after.rules_version, 2);
  assert.equal(after.rules_agreed_at.getTime(), before.rules_agreed_at.getTime());
});

test('the guard does not block the things it must not block', async () => {
  // A first agreement, a rise, and an ordinary edit on a row that has one.
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [B, V2_AT]);
  assert.equal((await versionOf(B)).rules_version, 2, 'a first agreement was blocked');

  await db.query(`update public.profiles set rules_version = 3, rules_agreed_at = '2026-10-01T00:00:00+09:00' where id = $1`, [B]);
  assert.equal((await versionOf(B)).rules_version, 3, 'a rise was blocked');

  await db.query(`update public.profiles set name = 'b renamed', nationality = 'KR' where id = $1`, [B]);
  const row = await one(`select name, nationality, rules_version from public.profiles where id = $1`, [B]);
  assert.deepEqual(row, { name: 'b renamed', nationality: 'KR', rules_version: 3 },
    'an ordinary edit was refused or lost its consent');
});

test('the guard never throws, whatever the client sends', async () => {
  // The rule 2026-09-02a was written under, and the reason this corrects
  // rather than rejects: a trigger on the row every app launch upserts must
  // never fail the save it rides on.
  for (const [v, t] of [[0, 'now()'], [-1, 'now()'], [null, 'null'], [1, 'null']]) {
    await db.query(
      `update public.profiles set rules_version = $2, rules_agreed_at = ${t} where id = $1`,
      [A, v]);
  }
  assert.equal((await versionOf(A)).rules_version, 2, 'something got through the guard');
});

test('the restore uses the timestamp the log holds, not the clock', async () => {
  // Inventing a fresh one would record an agreement at a moment nobody
  // agreed — and it would add a history row, because the unique constraint
  // would see a different event.
  const row = await one(
    `select rules_agreed_at from public.profiles where id = $1`, [A]);
  const logged = await one(
    `select agreed_at from public.rules_consents where profile_id = $1 and version = 2`, [A]);
  assert.equal(row.rules_agreed_at.getTime(), logged.agreed_at.getTime(),
    'the restored timestamp is not the one the log recorded');
});

test('the rollback removes the guard and leaves the restored row restored', async () => {
  // Deliberate: taking the guard off must not re-apply the bug. The log holds
  // the evidence that the v2 agreement happened.
  const sql = read(ROLLBACK);
  await db.exec(sql.slice(sql.indexOf('\nbegin;') + '\nbegin;'.length, sql.indexOf('select\n')));
  const gone = await one(`select count(*)::int as n from pg_trigger
    where tgname = 'profiles_keep_highest_rules_consent' and not tgisinternal`);
  assert.equal(gone.n, 0);
  assert.equal((await versionOf(A)).rules_version, 2, 'the rollback undid the restore as well');

  // And with it gone, the revert is possible again — which is what makes the
  // guard the thing doing the work above rather than something else.
  await db.query(`update public.profiles set rules_version = 1, rules_agreed_at = now() where id = $1`, [A]);
  assert.equal((await versionOf(A)).rules_version, 1);
});

test('the forward file ends in rollback and the undo was written first', async () => {
  assert.match(read(GUARD), /\nrollback;\s*$/,
    'the file a human is told to paste no longer ends in rollback');
  assert.ok(fs.existsSync(path.join(root, ROLLBACK)), 'the undo does not exist');
  await db.close();
});

// ── The way out, for the day the team means to lower a version ───────────
//
// A guard with no documented escape gets dropped in a hurry and never put
// back. If the consent text has to be withdrawn — v2 published by mistake,
// everybody sent back to v1 — this is the command, and it is in the
// migration's own header so somebody in a hurry finds it there.
//
// `alter table ... disable trigger <name>` and not `set
// session_replication_role = replica`: the second one silences EVERY trigger
// on the table, including 2026-09-02a's history writer, so the deliberate
// lowering would leave no record of itself. The point of lowering on purpose
// is that it is on the record.

test('the guard can be opened deliberately, and the lowering is still logged', async () => {
  const db2 = new PGlite();
  await db2.exec(BOOTSTRAP);
  await db2.exec(applyPart(read(HISTORY), '-- == Verification'));
  await db2.exec(applyPart(read(GUARD), '-- == Verification'));
  const at = async (id) => (await db2.query(
    `select rules_version from public.profiles where id = $1`, [id])).rows[0].rules_version;
  const logged = async () => (await db2.query(
    `select count(*)::int as n from public.rules_consents`)).rows[0].n;

  await db2.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [A, V2_AT]);
  assert.equal(await at(A), 2);
  const before = await logged();

  // The escape hatch, exactly as the header spells it.
  await db2.exec(`
    begin;
    alter table public.profiles disable trigger profiles_keep_highest_rules_consent;
    update public.profiles set rules_version = 1, rules_agreed_at = '${T1}' where id = '${A}';
    alter table public.profiles enable trigger profiles_keep_highest_rules_consent;
    commit;
  `);
  assert.equal(await at(A), 1, 'the deliberate lowering did not go through');

  // No new history row, and that is right rather than a miss: putting
  // somebody back to the v1 they already agreed to restores a pair the log
  // already holds, so 2026-09-02a's `on conflict do nothing` absorbs it.
  // Nothing new was agreed to, so nothing new is recorded — and their v2 row
  // stays, which is the record that they did agree to it before it was
  // withdrawn.
  assert.equal(await logged(), before, 'restoring a recorded agreement invented a new one');

  // The history trigger is still live through all of this, which is the half
  // that would be silently lost by reaching for `session_replication_role`
  // instead. A lowering to a pair the log has NOT seen is recorded.
  await db2.exec(`
    begin;
    alter table public.profiles disable trigger profiles_keep_highest_rules_consent;
    update public.profiles set rules_version = 1, rules_agreed_at = '2026-08-21T09:00:00+09:00' where id = '${A}';
    alter table public.profiles enable trigger profiles_keep_highest_rules_consent;
    commit;
  `);
  assert.equal(await logged(), before + 1,
    'the history trigger was disabled too — the deliberate lowering left no record of itself');

  // And the guard is back on afterwards, which is the half people forget.
  await db2.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [A, V2_AT]);
  await db2.query(`update public.profiles set rules_version = 1, rules_agreed_at = now() where id = $1`, [A]);
  assert.equal(await at(A), 2, 'the guard was left open');
  await db2.close();
});
