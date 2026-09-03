process.env.TZ = 'Asia/Seoul';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// Lowering one consent on purpose, so the walkthrough has a v1 account.
//
// The guard from 2026-09-03a makes this impossible from the SQL editor, which
// is the point of it — so this file exercises the escape hatch that migration
// documents, on the real file, and checks the eleven values it prints.
//
// It is here for the same reason migrationProbe.test.mjs is: the numbers a
// human reads before deciding whether to commit are produced by code, and on
// 2026-09-03 a verification section printed three NULLs because its device
// was broken rather than its subject.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const HISTORY = 'supabase/migrations/2026-09-02a-rules-consents-history.sql';
const GUARD = 'supabase/migrations/2026-09-03a-consent-cannot-go-backwards.sql';
const REVERT = 'supabase/migrations/2026-09-03b-revert-one-consent-on-purpose.sql';

const changes = (sql) => sql.slice(
  sql.indexOf('\nbegin;') + '\nbegin;'.length, sql.indexOf('-- == Verification'));

/** Run a migration whole, as one transaction, and return the row it prints. */
async function runMigration(db, sql) {
  const results = await db.exec(sql.replace(/\nrollback;\s*$/, '\ncommit;\n'));
  const printed = results.filter(r => (r.fields ?? []).length > 0 && (r.rows ?? []).length > 0);
  if (printed.length !== 1) {
    throw new Error(`the migration printed ${printed.length} result sets; it should print exactly one`);
  }
  return printed[0].rows[0];
}

const INCIDENT = '00000000-0000-4000-8000-00000000000a';   // 10:11, reverted, restored by 03a — stays
const WALKTHROUGH = '00000000-0000-4000-8000-00000000000b'; // pressed the gate minutes ago — reverted
const THIRD = '00000000-0000-4000-8000-00000000000c';       // only for the more-than-two case
const THIRD_V2_AT = '2026-09-03T20:00:00+09:00';
const V1_AT = '2026-08-20T10:00:00+09:00';
const INCIDENT_V2_AT = '2026-09-03T19:11:30.25+09:00';
const WALKTHROUGH_V2_AT = '2026-09-03T21:40:00+09:00';

/**
 * Production as it stands: two profiles at v2, one of them the incident.
 *
 * Both have a v1 row from the backfill, and the incident's v2 was recorded
 * FIRST. That ordering is the whole identification rule — the target is the
 * LAST to agree — so the fixture has to carry it rather than assert it. The
 * first draft of the migration had the comparison the other way round and
 * would have reverted the incident, which is somebody else's valid
 * agreement; putting the mutation back turns two of these red.
 */
async function productionNow({ third = false } = {}) {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create table auth.users (id uuid primary key);
    grant usage on schema public to anon, authenticated;
    create table public.profiles (
      id uuid primary key, name text, rules_version integer, rules_agreed_at timestamptz);
    grant select, insert, update on public.profiles to authenticated;
    insert into auth.users (id) values ('${INCIDENT}'), ('${WALKTHROUGH}')${third ? `, ('${THIRD}')` : ''};
    insert into public.profiles (id, name, rules_version, rules_agreed_at) values
      ('${INCIDENT}', 'a', 1, '${V1_AT}'), ('${WALKTHROUGH}', 'b', 1, '${V1_AT}')${third ? `, ('${THIRD}', 'c', 1, '${V1_AT}')` : ''};
  `);
  await db.exec(changes(read(HISTORY)));                 // backfills both at v1
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`,
    [INCIDENT, INCIDENT_V2_AT]);
  await db.exec(changes(read(GUARD)));                   // the guard, and the restore
  if (third) {
    await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`,
      [THIRD, THIRD_V2_AT]);
  }
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`,
    [WALKTHROUGH, WALKTHROUGH_V2_AT]);
  return db;
}

test('the eleven values are the ones the file documents, and none is null', async () => {
  const db = await productionNow();
  const got = await runMigration(db, read(REVERT));
  assert.deepEqual(Object.entries(got).filter(([, v]) => v === null).map(([k]) => k), [],
    'a check measured nothing');
  assert.deepEqual(got, {
    target_profiles: 1,
    target_v2_is_the_latest: true,
    target_is_not_the_incident: true,
    target_v2_recorded_at: got.target_v2_recorded_at,
    incident_v2_recorded_at: got.incident_v2_recorded_at,
    reverted_to: 1,
    timestamp_is_the_logged_one: true,
    history_rows_added: 0,
    guard_enabled_again: true,
    profiles_at_v2_after: 1,
    remaining_v2_is_the_incident: true,
  });
  // The two timestamps are values to read, not checks — but they must be in
  // the order the identification depends on.
  assert.ok(got.target_v2_recorded_at > got.incident_v2_recorded_at,
    'the target is not later than the incident, so the wrong row was picked');
  await db.close();
});

test('it reverts the profile that agreed LAST and leaves the incident alone', async () => {
  const db = await productionNow();
  await runMigration(db, read(REVERT));
  const at = async (id) => (await db.query(
    `select rules_version, rules_agreed_at from public.profiles where id = $1`, [id])).rows[0];
  const incident = await at(INCIDENT);
  assert.equal(incident.rules_version, 2,
    'the incident profile was reverted, and that agreement belongs to somebody else');
  const w = await at(WALKTHROUGH);
  assert.equal(w.rules_agreed_at.toISOString(), new Date(V1_AT).toISOString(),
    'the reverted profile did not get its own original v1 timestamp back');
  assert.equal((await at(WALKTHROUGH)).rules_version, 1, 'the walkthrough profile was not reverted');
  await db.close();
});

test('the log gains nothing, and still holds the v2 that happened', async () => {
  // Restoring a pair the log already holds is absorbed. The v2 row stays
  // where it is: that agreement did happen, and removing it would be the
  // erasure this whole day's work exists to prevent.
  const db = await productionNow();
  const before = (await db.query(`select count(*)::int as n from public.rules_consents`)).rows[0].n;
  await runMigration(db, read(REVERT));
  const after = (await db.query(`select count(*)::int as n from public.rules_consents`)).rows[0].n;
  assert.equal(after, before, 'the deliberate revert invented a history row');
  const v2 = await db.query(
    `select count(*)::int as n from public.rules_consents where profile_id = $1 and version = 2`,
    [INCIDENT]);
  assert.equal(v2.rows[0].n, 1, 'the v2 agreement was erased from the log');
  await db.close();
});

test('the guard is on again afterwards, and still works', async () => {
  // The half people forget. Left disabled, the next stale client walks
  // straight through.
  const db = await productionNow();
  await runMigration(db, read(REVERT));
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`,
    [INCIDENT, INCIDENT_V2_AT]);
  await db.query(`update public.profiles set rules_version = 1, rules_agreed_at = now() where id = $1`,
    [INCIDENT]);
  const now = (await db.query(
    `select rules_version from public.profiles where id = $1`, [INCIDENT])).rows[0];
  assert.equal(now.rules_version, 2, 'the guard was left open');
  await db.close();
});

test('it opens the guard by name, and never with the blunt instrument', async () => {
  // Comments stripped first. The file's own header says "NOT `set
  // session_replication_role = replica`", so a search over the whole text
  // finds the words it is warning against and fails — the exact trap
  // CLAUDE.md names: a check that matched the comment explaining a rule
  // instead of the rule.
  const sql = read(REVERT).split('\n').filter(l => !/^\s*--/.test(l)).join('\n');
  assert.doesNotMatch(sql, /session_replication_role/,
    'that would silence the history writer as well as the guard');
  assert.match(sql, /disable trigger profiles_keep_highest_rules_consent/);
  assert.match(sql, /enable trigger profiles_keep_highest_rules_consent/);
  assert.doesNotMatch(sql, /rules_agreed_at\s*=\s*now\(\)/,
    'the timestamp must come from the log, not the clock');
  assert.match(read(REVERT), /\nrollback;\s*$/);
});

test('with nobody at v2 it matches nothing rather than reverting something', async () => {
  // The identification rule is "the profile at v2 whose v2 agreement was
  // recorded first". If production ever stops having such a row,
  // target_profiles must say 0 — and the pass criteria call 0 a failure, so
  // the file stops rather than picking somebody arbitrary.
  //
  // The fixture cannot get there by lowering the two v2 profiles: the guard
  // blocks exactly that, which is why it exists. It has to be a database
  // where nobody ever reached v2.
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create table auth.users (id uuid primary key);
    grant usage on schema public to anon, authenticated;
    create table public.profiles (
      id uuid primary key, name text, rules_version integer, rules_agreed_at timestamptz);
    grant select, insert, update on public.profiles to authenticated;
    insert into auth.users (id) values ('${INCIDENT}');
    insert into public.profiles (id, name, rules_version, rules_agreed_at)
      values ('${INCIDENT}', 'a', 1, '${V1_AT}');
  `);
  await db.exec(changes(read(HISTORY)));
  await db.exec(changes(read(GUARD)));

  const got = await runMigration(db, read(REVERT));
  assert.equal(got.target_profiles, 0, 'with nobody at v2 it should match nothing');
  assert.equal(got.profiles_at_v2_after, 0);
  assert.equal(got.history_rows_added, 0);
  await db.close();
});

test('with three at v2 it reports numbers rather than erroring', async () => {
  // remaining_v2_is_the_incident was a scalar subquery over "the profiles at
  // v2", which is exactly one row in production only because there are two of
  // them and one is reverted. A third would have raised 21000 and taken the
  // whole select down with it — the human reads none of the eleven values,
  // and the one thing they most need to see, that something unexpected is at
  // v2, is the thing that hid itself. Aggregated, the surprise arrives as a
  // number and a false.
  const db = await productionNow({ third: true });
  const got = await runMigration(db, read(REVERT));
  assert.equal(got.profiles_at_v2_after, 2, 'it should say how many are left');
  assert.equal(got.remaining_v2_is_the_incident, false,
    'not every remaining v2 is the incident, and the file should say so rather than throw');
  assert.deepEqual(Object.entries(got).filter(([, v]) => v === null).map(([k]) => k), []);
  // Still the right target: the walkthrough, not the third and not the incident.
  const v = async (id) => (await db.query(
    `select rules_version from public.profiles where id = $1`, [id])).rows[0].rules_version;
  assert.equal(await v(WALKTHROUGH), 1);
  assert.equal(await v(THIRD), 2);
  assert.equal(await v(INCIDENT), 2);
  await db.close();
});
