import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// supabase/schema.sql runs on an empty database.
//
// ── Why this did not exist, and what that cost ──────────────────────────
//
// schema.sql says of itself, on line 3: "Run this once in the Supabase SQL
// editor after creating the project." That is its whole job — a fresh
// project, a restore, a second environment for 슬기님 — and until this file
// there was nothing that ever ran it.
//
// Three test files touch schema.sql and none of them could see the defect
// found on 2026-09-01:
//
//   profileExposure.test.mjs reads it as TEXT and compares policy and helper
//   bodies against the migration that was applied. Structurally blind to the
//   order the statements appear in, which is why it was green.
//
//   rlsPolicies.test.mjs and seatLapse.test.mjs execute real SQL, but they
//   execute the MIGRATIONS, against a fixture that declares the columns they
//   need. A migration runs against a database that already has a history.
//
//   schemaDrift.test.mjs compares the columns the client names against the
//   ones schema.sql declares. It sees names, not order, and not whether a
//   single statement in the file is valid.
//
// What was actually wrong: `alter table public.tables add column if not
// exists cancelled_at` sat eighty lines BELOW is_open_host(), which reads
// that column. is_open_host is `language sql`, and Postgres parse-analyses
// such a body when the function is created — so on an empty database the
// statement raised 42703 and, in the SQL editor's single transaction, rolled
// the entire file back. Every new project built from this file came up with
// nothing in it. The pilot never noticed because production was built
// incrementally, one applied migration at a time, and by the time each
// function was written its column already existed.
//
// So the check is the obvious one nobody had written: run it.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const SCHEMA = read('supabase/schema.sql');

// What Supabase provides and a bare Postgres does not. Kept as small as it
// can be: every line here is something the real platform genuinely has, and
// anything more would be this file quietly supplying what schema.sql should
// have declared for itself.
const SUPABASE = `
create role anon;
create role authenticated;
create role service_role;

create schema auth;
create table auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
$fn$;

create schema storage;
create table storage.buckets (
  id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text, owner uuid, created_at timestamptz default now()
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
  language sql immutable as $fn$ select string_to_array(name, '/') $fn$;

grant usage on schema auth, storage, public to anon, authenticated, service_role;
`;

/** A fresh database with only what the platform supplies. */
async function emptyProject() {
  const db = new PGlite();
  await db.exec(SUPABASE);
  return db;
}

test('the file Supabase is told to paste applies to an empty project', async () => {
  // The whole thing, in one transaction, exactly as the SQL editor runs it —
  // so a failure anywhere means a new project gets nothing, which is what
  // makes this the shape worth asserting rather than a per-statement tally.
  const db = await emptyProject();
  await db.exec('begin;');
  await db.exec(SCHEMA);
  await db.exec('commit;');

  const { rows } = await db.query(`
    select
      (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public') as functions,
      (select count(*)::int from pg_policies where schemaname = 'public') as policies,
      (select count(*)::int from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE') as tables`);

  // Positive floors rather than exact counts: this file is about the script
  // running, and pinning the numbers would make every ordinary addition to
  // schema.sql fail here for no reason.
  assert.ok(rows[0].tables >= 8, `only ${rows[0].tables} tables were created`);
  assert.ok(rows[0].functions >= 10, `only ${rows[0].functions} functions were created`);
  assert.ok(rows[0].policies >= 20, `only ${rows[0].policies} policies were created`);
  await db.close();
});

test('the objects the app cannot work without are all there', async () => {
  // Named one by one, because "the script ran" and "the app works" are not
  // the same claim. Each of these is reached on an ordinary screen: the seat
  // count on a card, the women-only filter, the guard on an insert, the lapse
  // clock behind both.
  const db = await emptyProject();
  await db.exec(SCHEMA);

  for (const fn of ['seat_holds', 'tables_with_woman', 'assert_seat_available',
    'lapse_window', 'lapse_at', 'is_open_host', 'assert_seat_decision_is_hosts',
    'notify_seat_requested', 'notify_seat_decided', 'notify_table_cancelled']) {
    const { rows } = await db.query(
      `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = $1`, [fn]);
    assert.equal(rows[0].n >= 1, true, `public.${fn}() was never created`);
  }

  for (const [table, policy] of [
    ['profiles', 'profiles_read'],
    ['tables', 'tables_read'],
    ['signups', 'signups_read'],
    ['signups', 'signups_decide_by_host'],
    ['signups', 'signups_cancel_own_or_host'],
  ]) {
    const { rows } = await db.query(
      `select count(*)::int as n from pg_policies
        where schemaname = 'public' and tablename = $1 and policyname = $2`, [table, policy]);
    assert.equal(rows[0].n, 1, `${policy} on ${table} was never created`);
  }
  await db.close();
});

// The two tables that are meant to have RLS on and no policy at all. Both say
// so in schema.sql: no client ever reads or writes them, the triggers write as
// definer and the Edge Function reads with the service role key, which bypasses
// RLS. Deny-everyone IS the design, and naming them here is what keeps the
// check below able to fail for anything else.
const DENY_ALL_ON_PURPOSE = ['notifications', 'pilot_team'];

test('no table is left with row level security on and nothing allowed', async () => {
  // The end state the ordering bug produced under a runner that continues
  // past errors: `enable row level security` had taken effect while the
  // policies that follow it had not. Postgres default-denies, so a signed-in
  // traveller's own Profile comes back blank and nothing says why.
  const db = await emptyProject();
  await db.exec(SCHEMA);

  const { rows } = await db.query(`
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
       and not exists (select 1 from pg_policies p
                        where p.schemaname = 'public' and p.tablename = c.relname)
     order by c.relname`);
  assert.deepEqual(rows.map(r => r.relname).sort(), [...DENY_ALL_ON_PURPOSE].sort(),
    'a table has RLS on and no policy, so every read of it returns nothing');
  await db.close();
});

test('the two that deny everybody really do have the lock on', async () => {
  // Asserted separately and positively, because the list above is an
  // exemption and an exemption that stopped being true would read as a pass.
  // What protects an outbox of people's email addresses is that RLS is ON and
  // no policy lets anybody through — not that it was left out of a query.
  const db = await emptyProject();
  await db.exec(SCHEMA);
  for (const name of DENY_ALL_ON_PURPOSE) {
    const { rows } = await db.query(`
      select c.relrowsecurity as rls,
             (select count(*)::int from pg_policies p
               where p.schemaname = 'public' and p.tablename = c.relname) as policies
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = $1`, [name]);
    assert.equal(rows.length, 1, `public.${name} does not exist`);
    assert.equal(rows[0].rls, true, `public.${name} has row level security switched off`);
    assert.equal(rows[0].policies, 0,
      `public.${name} gained a policy — decide whether a client may now read it`);
  }
  await db.close();
});

test('running it twice changes nothing and raises nothing', async () => {
  // Line 4 of the file: "It is written to be safe to run twice." Nobody had
  // checked, and the file is pasted by hand by a person who cannot always
  // tell whether the last paste went through.
  const db = await emptyProject();
  await db.exec(SCHEMA);
  const count = async () => (await db.query(
    `select count(*)::int as n from pg_policies where schemaname = 'public'`)).rows[0].n;
  const first = await count();

  await db.exec(SCHEMA);
  assert.equal(await count(), first, 'a second run left a different number of policies');
  await db.close();
});

test('this test can fail — the defect it was written for is caught', async () => {
  // The mutation, kept rather than performed once by hand. Move the ALTER
  // that adds tables.cancelled_at back below the function that reads it, the
  // arrangement that shipped, and the script must not survive.
  const ALTER = 'alter table public.tables add column if not exists cancelled_at timestamptz;';
  const READER = 'create or replace function public.is_open_host(p_user uuid)';
  assert.ok(SCHEMA.includes(ALTER), 'the statement this test mutates is no longer in the file');
  assert.ok(SCHEMA.indexOf(ALTER) < SCHEMA.indexOf(READER),
    'tables.cancelled_at is declared after is_open_host reads it — schema.sql will not run');

  const broken = SCHEMA.replace(ALTER, '').replace(READER, `${ALTER}\n${READER}`.replace(ALTER, ''))
    // Put it back where it used to live: just before the cancel policy.
    .replace('-- The host, and only the host, may call their own table off.',
      `${ALTER}\n-- The host, and only the host, may call their own table off.`);
  assert.ok(broken.indexOf(ALTER) > broken.indexOf(READER),
    'the mutation did not actually move the statement, so the assertion below proves nothing');

  const db = await emptyProject();
  await assert.rejects(() => db.exec(broken), /cancelled_at/,
    'schema.sql survived a column being declared after the function that reads it');
  await db.close();
});

// ── The tool that answers "is a restore the same as production" ─────────
//
// scripts/schema-catalog.mjs builds a project from schema.sql and diffs its
// catalogue against one exported from the live database. Its whole job is to
// report differences, so its worst failure is silence: a compare() that
// always returns nothing says "your backup restores perfectly" about a file
// that restores nothing at all. That is the one answer nobody would question.

test('the catalogue comparison reports differences in both directions', async () => {
  const { compare } = await import('../../../scripts/schema-catalog.mjs');

  const same = compare(['a\t1', 'b\t2'], ['a\t1', 'b\t2']);
  assert.deepEqual(same, { onlyInSchema: [], onlyInProduction: [], inBoth: 2 });

  const differs = compare(['a\t1', 'only-here\t9'], ['a\t1', 'only-there\t8']);
  assert.deepEqual(differs.onlyInSchema, ['only-here\t9']);
  assert.deepEqual(differs.onlyInProduction, ['only-there\t8']);
  assert.equal(differs.inBoth, 1);

  // The shape a restore that produced nothing would have. If this ever comes
  // back looking like agreement, the tool is lying in the direction that
  // matters.
  const empty = compare([], ['a\t1', 'b\t2']);
  assert.equal(empty.onlyInProduction.length, 2);
  assert.equal(empty.inBoth, 0);
});

test('the catalogue built from schema.sql is not empty', async () => {
  // The other way the tool could say "no differences": build nothing, compare
  // nothing, report agreement. A floor here means a diff of zero is a claim
  // about two real catalogues.
  const { catalogueFromSchema } = await import('../../../scripts/schema-catalog.mjs');
  const lines = await catalogueFromSchema(SCHEMA);
  assert.ok(lines.length >= 100, `only ${lines.length} catalogue entries were produced`);
  for (const kind of ['column', 'function', 'policy', 'trigger', 'index', 'rls']) {
    assert.ok(lines.some(l => l.startsWith(`${kind}\t`)), `no ${kind} entries at all`);
  }
});
