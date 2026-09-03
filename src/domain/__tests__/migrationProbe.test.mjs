process.env.TZ = 'Asia/Seoul';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// The numbers a migration prints are produced by code too.
//
// ── The run that made this file necessary ───────────────────────────────
//
// 2026-09-03. 2026-09-03a was pasted into the SQL editor and printed
//
//     true · true · 2 · true · NULL · NULL · NULL · 1 · 0
//
// Three of nine were null. A null is not a false — it is a check that
// measured nothing — and the two values before them were no more trustworthy,
// because all five came out of the same broken device: a chain of
// data-modifying CTEs, four UPDATEs of one row, each with a RETURNING read by
// a scalar subquery. Sub-statements of one command share a snapshot and
// cannot see one another's effects, so exactly one of the four applied and
// the other three matched nothing and returned nothing. Which one survives is
// not defined.
//
// The other nine tests in consentFloor.test.mjs were green throughout. They
// apply the migration's CHANGES and then re-implement its checks as separate
// queries — sequential, so they worked. The migration's own verification had
// never been executed by anything.
//
// So this file runs the verification section of a migration verbatim, out of
// the file, and asserts every value is both non-null and the documented one.
// Any migration whose numbers a human is asked to read belongs here.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const HISTORY = 'supabase/migrations/2026-09-02a-rules-consents-history.sql';
const GUARD = 'supabase/migrations/2026-09-03a-consent-cannot-go-backwards.sql';

/** Everything between the opening `begin;` and the verification banner. */
const changes = (sql) => sql.slice(
  sql.indexOf('\nbegin;') + '\nbegin;'.length,
  sql.indexOf('-- == Verification'));

/**
 * Run a migration the way the SQL editor runs it: the WHOLE file, as one
 * transaction, and hand back the row it prints.
 *
 * One transaction is not a detail. The file captures a count into a temporary
 * table at the top and reads it at the bottom, and that table is `on commit
 * drop` — so a test that ran the changes and the verification as two separate
 * statements would find the table gone and report a failure that exists only
 * in the test. That happened while this file was being written, which is the
 * second time in one evening that the device measuring the migration was the
 * thing that was wrong.
 *
 * The trailing `rollback;` becomes `commit;` — the second paste, the one that
 * keeps.
 */
async function runMigration(db, sql) {
  const results = await db.exec(sql.replace(/\nrollback;\s*$/, '\ncommit;\n'));
  const printed = results.filter(r => (r.fields ?? []).length > 0 && (r.rows ?? []).length > 0);
  if (printed.length !== 1) {
    throw new Error(`the migration printed ${printed.length} result sets; it should print exactly one`);
  }
  return printed[0].rows[0];
}

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const T1 = '2026-08-20T10:00:00+09:00';
const V2_AT = '2026-09-03T10:11:30.25+09:00';

/**
 * Production as it stood when the guard was written: two profiles at v1, the
 * history backfilled, one of them agreed to v2 and then reverted by a client
 * that was behind. Twelve history rows and no profile at v2 — the shape the
 * migration's restore and its last two values are written against.
 */
async function productionAsItWas() {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    grant usage on schema public to anon, authenticated;
    create table public.profiles (
      id uuid primary key, name text, nationality text,
      rules_version integer, rules_agreed_at timestamptz
    );
    grant select, insert, update on public.profiles to authenticated;
    insert into auth.users (id) values ('${A}'), ('${B}');
    insert into public.profiles (id, name, rules_version, rules_agreed_at) values
      ('${A}', 'a', 1, '${T1}'), ('${B}', 'b', 1, '${T1}');
  `);
  await db.exec(changes(read(HISTORY)));
  // The incident: A agrees to v2, then a stale client sends 1 back.
  await db.query(`update public.profiles set rules_version = 2, rules_agreed_at = $2 where id = $1`, [A, V2_AT]);
  await db.query(`update public.profiles set rules_version = 1, rules_agreed_at = $2 where id = $1`,
    [A, '2026-09-03T10:18:24.808+09:00']);
  return db;
}

test('the guard migration prints nine values and not one of them is null', async () => {
  // The assertion that would have failed before the paste rather than after.
  const db = await productionAsItWas();
  const row = await runMigration(db, read(GUARD));

  const nulls = Object.entries(row).filter(([, v]) => v === null).map(([k]) => k);
  assert.deepEqual(nulls, [],
    `these checks measured nothing:\n  ${nulls.join('\n  ')}\n\nA null is not a false.`);
  assert.equal(Object.keys(row).length, 9,
    'the file no longer prints nine values — update the pass criteria in its header');
  await db.close();
});

test('the nine values are the ones the file documents', async () => {
  const db = await productionAsItWas();
  const got = await runMigration(db, read(GUARD));
  assert.deepEqual(got, {
    guard_trigger_before_update: true,
    guard_function_path_pinned: true,
    lowering_blocked: 2,
    lowering_kept_timestamp: true,
    nulling_blocked: 2,
    ordinary_update_still_works: true,
    raising_still_works: 3,
    restored_profiles_at_v2: 1,
    history_rows_added_by_restore: 0,
  });
  await db.close();
});

test('the probe leaves nothing behind — it runs twice, and the second is committed', async () => {
  // The file is pasted once with `rollback;` and again with `commit;`. A
  // fixture that survives the second run is an invented profile in
  // production, which is the mistake 2026-09-01c's first draft nearly made.
  const db = await productionAsItWas();
  await runMigration(db, read(GUARD));
  const left = await db.query(
    `select count(*)::int as n from public.profiles where id = '00000000-0000-4000-8000-0000000c0de0'`);
  assert.equal(left.rows[0].n, 0, 'the guard probe profile is still there');
  const users = await db.query(
    `select count(*)::int as n from auth.users where id = '00000000-0000-4000-8000-0000000c0de0'`);
  assert.equal(users.rows[0].n, 0, 'the guard probe auth user is still there');
  await db.close();
});

test('the probe would have caught a guard that does not work', async () => {
  // The device has to be able to report failure, or nine greens mean nothing.
  // The file is run with its guard body replaced by one that lets everything
  // through — a mutation of the real migration, not a hand-built substitute,
  // so the thing under test is still the thing that gets pasted.
  const db = await productionAsItWas();
  const file = read(GUARD);
  const body = file.slice(file.indexOf('as $$\nbegin'), file.indexOf('\n$$;'));
  // A FUNCTION replacement, not a string: `$$` inside a replacement string is
  // an escape for one `$`, which silently un-quotes the function body and
  // turns this into a syntax-error test instead of a broken-guard test. The
  // same trap cost an hour on 2026-09-02.
  const broken = file.replace(body, () => 'as $$\nbegin\n  return new;\nend');
  assert.notEqual(broken, file, 'the mutation matched nothing, so this proves nothing');
  assert.match(broken, /as \$\$\nbegin\n  return new;\nend\n\$\$;/,
    'the mutation mangled the dollar quoting instead of replacing the body');

  const got = await runMigration(db, broken);
  assert.equal(got.lowering_blocked, 1, 'a broken guard still reported the version held');
  assert.equal(got.nulling_blocked, null, 'a broken guard still reported the null blocked');
  assert.equal(got.lowering_kept_timestamp, false, 'a broken guard still reported the timestamp kept');
  await db.close();
});

test('a data-modifying CTE chain is why this file exists', async () => {
  // Kept as a runnable demonstration rather than a sentence in a comment,
  // because the next person to write a verification section will reach for
  // exactly this shape. Four updates of one row in one command: one applies,
  // three return nothing, and the row is not what any of them asked for.
  const db = new PGlite();
  await db.exec(`create table t (id int primary key, n int, name text);
                 insert into t values (1, 2, 'start');`);
  const { rows: [chain] } = await db.query(`
    with a as (update t set n = 1    where id = 1 returning n),
         b as (update t set n = null where id = 1 returning n),
         c as (update t set name = 'renamed' where id = 1 returning name),
         d as (update t set n = 3    where id = 1 returning n)
    select (select n from a) as a_n, (select n from b) as b_n,
           (select name from c) as c_name, (select n from d) as d_n`);
  assert.equal(chain.b_n, null);
  assert.equal(chain.c_name, null);
  assert.equal(chain.d_n, null);
  const { rows: [row] } = await db.query('select * from t');
  assert.equal(row.name, 'start', 'the rename did apply after all — the demonstration is stale');
  await db.close();
});
