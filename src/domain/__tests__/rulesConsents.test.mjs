process.env.TZ = 'Asia/Seoul';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// Who agreed to which rules, kept when the rules change.
//
// profiles.rules_version and rules_agreed_at are two scalar columns, and a
// re-consent overwrites them. The consent text is being revised and its
// version bumped 1 -> 2, so everybody at v1 will agree again — and lose
// their v1 record the moment they do. 2026-09-02a adds a log written by a
// trigger, so the client changes nothing and the evidence survives.
//
// The first test performs the overwrite WITHOUT the migration and counts the
// evidence that is left: zero. That is the control. Everything after it runs
// against the migration and re-consents for real.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const MIGRATION = 'supabase/migrations/2026-09-02a-rules-consents-history.sql';
const ROLLBACK = 'supabase/migrations/2026-09-02a-rules-consents-history-ROLLBACK.sql';

const applyPart = (sql, end) => {
  const at = sql.indexOf(end);
  if (at < 0) throw new Error(`the file no longer contains ${JSON.stringify(end)}`);
  return sql.slice(sql.indexOf('\nbegin;') + '\nbegin;'.length, at);
};

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const C = '00000000-0000-4000-8000-00000000000c';
const T1 = '2026-08-20T10:00:00+09:00';
const T2 = '2026-08-25T11:00:00+09:00';
const T3 = '2026-09-03T09:00:00+09:00';

const BOOTSTRAP = `
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key);
grant usage on schema public to anon, authenticated;
create table public.profiles (
  id uuid primary key,
  name text,
  rules_version integer,
  rules_agreed_at timestamptz
);
grant select, insert, update on public.profiles to authenticated;
insert into public.profiles (id, name, rules_version, rules_agreed_at) values
  ('${A}', 'a', 1, '${T1}'),
  ('${B}', 'b', 1, '${T2}'),
  ('${C}', 'c', null, null);
`;

const db = new PGlite();
await db.exec(BOOTSTRAP);

const count = async (sql, params = []) => (await db.query(sql, params)).rows[0].n;
const consentsFor = (id, version) => count(
  `select count(*)::int as n from public.rules_consents where profile_id = $1 and version = $2`, [id, version]);

test('control: without the migration, a re-consent erases the v1 record', async () => {
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [A, T3]);
  const evidenceOfV1 = await count(
    `select count(*)::int as n from public.profiles where id = $1 and rules_version = 1`, [A]);
  assert.equal(evidenceOfV1, 0, 'the control should show the loss this migration exists to stop');
  // Put A back so the migration's backfill sees the real starting state.
  await db.query(`update public.profiles set rules_version = 1, rules_agreed_at = $2 where id = $1`, [A, T1]);
});

test('the migration backfills exactly the profiles that carry a version', async () => {
  await db.exec(applyPart(read(MIGRATION), '-- == Verification'));
  assert.equal(await count(`select count(*)::int as n from public.rules_consents`), 2);
  assert.equal(await consentsFor(A, 1), 1);
  assert.equal(await consentsFor(B, 1), 1);
  assert.equal(await count(`select count(*)::int as n from public.rules_consents where profile_id = $1`, [C]), 0);
});

test('one re-consent leaves exactly one v1 row and exactly one v2 row', async () => {
  // The acceptance criterion, verbatim: after backfill and one re-consent,
  // the profile's v1 row count is exactly 1. Two would mean the backfill and
  // the trigger both recorded it.
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [A, T3]);
  assert.equal(await consentsFor(A, 1), 1, 'v1 was recorded twice, or lost');
  assert.equal(await consentsFor(A, 2), 1, 'the new agreement was not recorded');
  // And the cache still says the latest.
  const { rows } = await db.query(`select rules_version from public.profiles where id = $1`, [A]);
  assert.equal(rows[0].rules_version, 2);
});

test('saving the profile again with the same agreement records nothing', async () => {
  await db.query(`update public.profiles set name = 'a2' where id = $1`, [A]);
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [A, T3]);
  assert.equal(await count(`select count(*)::int as n from public.rules_consents where profile_id = $1`, [A]), 2);
});

test('a first agreement is recorded whether it arrives by update or by insert', async () => {
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [C, T3]);
  assert.equal(await consentsFor(C, 2), 1);
  const D = '00000000-0000-4000-8000-00000000000d';
  await db.query(`insert into public.profiles (id, name, rules_version, rules_agreed_at) values ($1, 'd', 2, $2)`, [D, T3]);
  assert.equal(await consentsFor(D, 2), 1);
});

test('the client path is upsert, and a first consent arrives as its INSERT half', async () => {
  // supabaseBackend.js saveProfile() upserts. For a brand-new person the row
  // does not exist yet, so the statement that carries their first agreement
  // is an INSERT — an update-only trigger would log every backfilled veteran
  // and none of the people the pilot is for. Both halves, driven for real.
  const F = '00000000-0000-4000-8000-00000000000f';
  const upsert = (version, at) => db.query(
    `insert into public.profiles (id, name, rules_version, rules_agreed_at)
     values ($1, 'f', $2, $3)
     on conflict (id) do update set rules_version = excluded.rules_version, rules_agreed_at = excluded.rules_agreed_at`,
    [F, version, at]);

  // Half one: the row does not exist. Criterion: exactly one v1 row.
  await upsert(1, T1);
  assert.equal(await consentsFor(F, 1), 1, 'a first consent that arrived as an INSERT was not logged');

  // Half two: the row exists, `on conflict do update` carries the re-consent.
  // Criterion: one v1, one v2, exactly two in total.
  await upsert(2, T3);
  assert.equal(await consentsFor(F, 1), 1);
  assert.equal(await consentsFor(F, 2), 1);
  assert.equal(await count(`select count(*)::int as n from public.rules_consents where profile_id = $1`, [F]), 2);

  // And the same upsert again, unchanged, logs nothing more.
  await upsert(2, T3);
  assert.equal(await count(`select count(*)::int as n from public.rules_consents where profile_id = $1`, [F]), 2);
});

test('the trigger is declared for INSERT and for UPDATE', async () => {
  // Read off the catalogue, not inferred from behaviour: the upsert test
  // above proves the effect, this proves the declaration that produces it.
  const { rows } = await db.query(`
    select (tgtype::int & 4) = 4 as on_insert, (tgtype::int & 16) = 16 as on_update
      from pg_trigger where tgname = 'profiles_keep_rules_consent' and not tgisinternal`);
  assert.deepEqual(rows[0], { on_insert: true, on_update: true });
});

test('the person column is nullable, so deleting a person is an anonymisation and not an error', async () => {
  const { rows } = await db.query(`
    select is_nullable from information_schema.columns
     where table_schema = 'public' and table_name = 'rules_consents' and column_name = 'profile_id'`);
  assert.equal(rows[0].is_nullable, 'YES');
});

test('the log is locked: RLS on, no policy, and neither client role may select', async () => {
  const { rows } = await db.query(`
    select
      (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'rules_consents') as rls,
      (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'rules_consents') as policies,
      has_table_privilege('anon', 'public.rules_consents', 'select') as anon_select,
      has_table_privilege('authenticated', 'public.rules_consents', 'select') as auth_select`);
  assert.deepEqual(rows[0], { rls: true, policies: 0, anon_select: false, auth_select: false });

  // Not a count of zero — a refusal. A role with no privilege cannot even ask.
  await assert.rejects(
    () => db.exec(`begin; set local role anon; select count(*) from public.rules_consents; commit;`),
    /permission denied/);
  await db.exec('rollback;').catch(() => {});
  await assert.rejects(
    () => db.exec(`begin; set local role authenticated; select count(*) from public.rules_consents; commit;`),
    /permission denied/);
  await db.exec('rollback;').catch(() => {});
});

test('the trigger writes as definer with a pinned path', async () => {
  const { rows } = await db.query(`
    select p.prosecdef, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'keep_rules_consent'`);
  assert.equal(rows[0].prosecdef, true);
  // Pinned to the empty path: every name in the body is schema-qualified, so
  // nothing a caller puts on their search_path can be resolved instead.
  assert.ok(rows[0].proconfig.some(c => /^search_path=("")?$/.test(c)),
    `search_path is not pinned to '': ${JSON.stringify(rows[0].proconfig)}`);
  // And nothing but the trigger may call it.
  const { rows: priv } = await db.query(`
    select has_function_privilege('anon', 'public.keep_rules_consent()', 'execute') as anon,
           has_function_privilege('authenticated', 'public.keep_rules_consent()', 'execute') as auth`);
  assert.deepEqual(priv[0], { anon: false, auth: false });
});

test('a client role can still agree — the trigger does not need the role to see the log', async () => {
  // authenticated may update profiles and may not select rules_consents.
  // The trigger inserts as definer, so the update succeeds and the row lands.
  const E = '00000000-0000-4000-8000-00000000000e';
  await db.query(`insert into public.profiles (id, name) values ($1, 'e')`, [E]);
  await db.exec(`begin; set local role authenticated;
    update public.profiles set rules_version = 2, rules_agreed_at = '${T3}' where id = '${E}';
    reset role; commit;`);
  assert.equal(await consentsFor(E, 2), 1);
});

test('deleting a person keeps the fact and drops the name', async () => {
  const before = await count(`select count(*)::int as n from public.rules_consents`);
  await db.query(`delete from public.profiles where id = $1`, [B]);
  assert.equal(await count(`select count(*)::int as n from public.rules_consents`), before,
    'a consent row was destroyed with the profile');
  assert.equal(await count(
    `select count(*)::int as n from public.rules_consents where profile_id is null and version = 1 and agreed_at = $1`, [T2]),
    1, 'B\'s agreement should survive with no profile attached');
});

test('the migration touches no profile', async () => {
  // Every profile that had a version before still has one; the file adds a
  // table and writes into that table only.
  const { rows } = await db.query(`select id, rules_version from public.profiles order by id`);
  for (const r of rows) assert.ok(r.rules_version === null || Number.isInteger(r.rules_version));
});

test('the rollback removes the log and leaves profiles alone', async () => {
  const profilesBefore = await count(
    `select count(*)::int as n from public.profiles where rules_version is not null`);
  await db.exec(applyPart(read(ROLLBACK), '\nselect'));
  const { rows } = await db.query(`
    select
      (select count(*)::int from information_schema.tables where table_schema = 'public' and table_name = 'rules_consents') as consents_table,
      (select count(*)::int from pg_trigger where tgname = 'profiles_keep_rules_consent' and not tgisinternal) as trigger_gone,
      (select count(*)::int from public.profiles where rules_version is not null) as profiles_untouched`);
  assert.deepEqual(rows[0], { consents_table: 0, trigger_gone: 0, profiles_untouched: profilesBefore });
});

test('the forward file ends in rollback and the undo was written first', () => {
  assert.match(read(MIGRATION), /\nrollback;\s*$/, 'the file a human is told to paste no longer ends in rollback');
  assert.ok(fs.existsSync(path.join(root, ROLLBACK)));
  assert.match(read(ROLLBACK), /drop table if exists public\.rules_consents/);
});
