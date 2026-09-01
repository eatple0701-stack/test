import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// A column the client asks for, that the database does not have.
//
// ── The twenty minutes this is here for ─────────────────────────────────
//
// 2026-09-01, during 2차 운영. A client that filters on
// `signups.cancelled_at` was deployed while the migration adding that column
// had not been applied. Every read of signups came back 400, the table page
// told a stranger "이 밥상은 사라졌어요" about a table two people were
// sitting at, and it stayed that way until Vercel's instant rollback.
//
// 776 tests passed before that deploy. They passed because PGlite had the
// migration applied and production did not — the suite was testing a
// database nobody was using.
//
// It was the third of its kind in a day: 42P17 (a policy written against the
// reads somebody remembered), the morning regression (a merge added to one
// of two read paths), and this. Writing the rule down was not enough the
// first two times.
//
// ── Why schema.sql and NOT the migrations ───────────────────────────────
//
// This is the whole design, and getting it wrong would make the check
// worthless. A migration FILE existing proves nothing about production — the
// broken deploy had the file. What the repo already does, by convention, is
// fold a migration into schema.sql once it has actually been applied: 01b
// and 01c are in there, 01e is not.
//
// So schema.sql means "what the live database has", and the rule is that the
// client may only name columns it contains. A column arrives in this order:
//
//     migration reviewed -> applied -> live check -> folded into schema.sql
//     -> and only then may the client read it
//
// which is exactly the order that was skipped.
//
// ── One direction only ──────────────────────────────────────────────────
//
// A column in the database that no client uses is fine — most of them are.
// Only the reverse breaks anything.

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

/** Every column schema.sql defines, per table. */
function schemaColumns() {
  const sql = read('supabase/schema.sql');
  const byTable = {};
  for (const m of sql.matchAll(/create table if not exists public\.(\w+) \(([\s\S]*?)\n\);/g)) {
    const [, table, block] = m;
    byTable[table] ??= new Set();
    for (const line of block.split('\n')) {
      const col = line.match(/^\s{2}(\w+)\s+\S/);
      // `unique (...)`, `check (...)` and friends are constraints, not columns.
      if (col && !['unique', 'check', 'primary', 'foreign', 'constraint'].includes(col[1])) {
        byTable[table].add(col[1]);
      }
    }
  }
  // Columns added after the table was created — the file's own idiom for
  // anything that arrived later.
  for (const m of sql.matchAll(/alter table public\.(\w+)\s+add column if not exists (\w+)/g)) {
    byTable[m[1]] ??= new Set();
    byTable[m[1]].add(m[2]);
  }
  return byTable;
}

/**
 * Every column the client names, per table.
 *
 * Two sources, because the client talks to Postgres in two shapes: query
 * builders in the backend, and the row mappers that read what comes back.
 */
function clientColumns() {
  const used = {};
  const note = (table, col) => {
    if (!col || /^[A-Z]/.test(col)) return;
    used[table] ??= new Set();
    used[table].add(col);
  };

  // ── supabaseBackend.js: .from('x') and the filters chained onto it ────
  const backend = read('src/data/supabaseBackend.js')
    .split('\n').map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n');
  const lines = backend.split('\n');
  lines.forEach((line, i) => {
    const from = line.match(/\.from\((['"])(\w+)\1\)/);
    if (!from) return;
    const table = from[2];
    // The statement, which may wrap over a few lines — but stops at the next
    // `.from(`, or a Promise.all with two queries in it hands one table's
    // filters to the other. hostRecord() does exactly that, and without this
    // the check reported `profiles.host_id`, which is a column of `tables`.
    const window = [];
    for (let j = i; j < Math.min(i + 6, lines.length); j += 1) {
      if (j > i && /\.from\(/.test(lines[j])) break;
      window.push(lines[j]);
    }
    const stmt = window.join(' ');
    // .eq('col', …) .is('col', …) .in('col', …) .order('col') .not('col', …)
    for (const m of stmt.matchAll(/\.(?:eq|is|in|order|not|gt|gte|lt|lte|neq|like|ilike)\((['"])(\w+)\1/g)) {
      note(table, m[2]);
    }
    // .select('a, b, c') — but not '*' and not an embed like `profiles (…)`
    for (const m of stmt.matchAll(/\.select\((['"])([^'"]*)\1/g)) {
      for (const piece of m[2].split(',')) {
        const col = piece.trim();
        if (col && col !== '*' && !col.includes('(')) note(table, col);
      }
    }
    // .update({ col: … }) — the keys are columns.
    const upd = stmt.match(/\.update\(\{([^}]*)\}/);
    if (upd) for (const m of upd[1].matchAll(/(\w+)\s*:/g)) note(table, m[1]);
  });

  // ── tableMapping.js: what the row shapes read and write ───────────────
  const mapping = read('src/data/tableMapping.js')
    .split('\n').map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n');
  const fnBody = (name) => {
    const at = mapping.indexOf(`export function ${name}(`);
    if (at < 0) return '';
    const next = mapping.indexOf('\nexport ', at + 1);
    return mapping.slice(at, next < 0 ? mapping.length : next);
  };
  for (const [name, table] of [
    ['tableFromRow', 'tables'], ['tableToRow', 'tables'],
    ['signupFromRow', 'signups'], ['signupToRow', 'signups'],
  ]) {
    const body = fnBody(name);
    for (const m of body.matchAll(/row\.(\w+)/g)) note(table, m[1]);
    if (name.endsWith('ToRow')) {
      for (const m of body.matchAll(/^\s{4}(\w+):/gm)) note(table, m[1]);
    }
  }
  return used;
}

// Columns the client names that are not columns at all: PostgREST embeds and
// the aggregate's own output shape. Listed rather than guessed at, so a real
// miss cannot hide behind a clever filter.
const NOT_COLUMNS = {
  signups: new Set(['profiles']),
};

test('the client never asks for a column the live database lacks', () => {
  const schema = schemaColumns();
  const client = clientColumns();
  const missing = [];
  for (const [table, cols] of Object.entries(client)) {
    if (!schema[table]) continue;          // not a table this file knows
    for (const col of cols) {
      if (NOT_COLUMNS[table]?.has(col)) continue;
      if (!schema[table].has(col)) missing.push(`${table}.${col}`);
    }
  }
  assert.deepEqual(missing, [],
    `the client reads ${missing.join(', ')}, which supabase/schema.sql does not have. `
    + 'A migration file is not enough: schema.sql is folded only once a migration has been '
    + 'applied to production and checked live, and the client may not ship before that. '
    + 'On 2026-09-01 skipping this order returned 400 to every read of signups for twenty '
    + 'minutes, during the pilot.');
});

/** The comparison itself, so the direction can be tested rather than hoped. */
const missingFrom = (schema, client) => {
  const out = [];
  for (const [table, cols] of Object.entries(client)) {
    if (!schema[table]) continue;
    for (const col of cols) {
      if (NOT_COLUMNS[table]?.has(col)) continue;
      if (!schema[table].has(col)) out.push(`${table}.${col}`);
    }
  }
  return out;
};

test('it looks one way: a column nobody reads is not a problem', () => {
  // Most columns in this database are read by nothing. A check that
  // complained about them would be noise nobody could act on, and a check
  // nobody can act on gets switched off — which is worse than not having it.
  const schema = { signups: new Set(['id', 'status', 'cancelled_at', 'diets']) };

  assert.deepEqual(missingFrom(schema, { signups: new Set(['id', 'status']) }), [],
    'reading fewer columns than exist was reported as a problem');
  assert.deepEqual(missingFrom(schema, { signups: new Set() }), [],
    'reading nothing at all was reported as a problem');

  // And the other way round is the one that breaks production.
  assert.deepEqual(missingFrom(schema, { signups: new Set(['id', 'nope']) }), ['signups.nope']);
});

test('the outage reproduces exactly', () => {
  // What twenty minutes of 400s looked like as a pair of sets: schema.sql
  // without cancelled_at, a client naming it.
  //
  // Written from fixed sets rather than from the real files, and that is the
  // point rather than convenience. Built from the live pair, this stopped
  // reproducing anything the moment 2026-09-01e was folded in — the scenario
  // it exists to pin would have quietly become "the current state, plus a
  // column already there", which is not an outage and asserts nothing. A
  // historical case has to stay the case it was.
  const schema = { signups: new Set(['id', 'table_id', 'user_id', 'status']) };
  const client = { signups: new Set(['id', 'table_id', 'user_id', 'status', 'cancelled_at']) };
  assert.deepEqual(missingFrom(schema, client), ['signups.cancelled_at'],
    'the check no longer notices the shape that took production down');

  // And the same pair with the column present is silent, so the assertion
  // above is about the column and not about the function always finding one.
  const applied = { signups: new Set([...schema.signups, 'cancelled_at']) };
  assert.deepEqual(missingFrom(applied, client), []);
});

test('both extractors still find something', () => {
  // The failure mode of a source-reading check: a regex stops matching, both
  // sets come back empty, and the comparison above passes vacuously. That is
  // how a guard becomes decoration.
  const schema = schemaColumns();
  const client = clientColumns();

  assert.ok(Object.keys(schema).length >= 5, 'schema.sql yielded almost no tables');
  assert.ok(schema.signups?.size >= 8, `signups has ${schema.signups?.size ?? 0} columns in schema.sql`);
  assert.ok(schema.tables?.size >= 10, `tables has ${schema.tables?.size ?? 0} columns in schema.sql`);

  assert.ok(client.signups?.size >= 3, `the client was found reading ${client.signups?.size ?? 0} signup columns`);
  assert.ok(client.profiles?.size >= 1, 'the client reads no profile columns, which cannot be true');

  // And the pair actually overlaps, so the two sides are talking about the
  // same tables rather than two disjoint vocabularies.
  const shared = [...(client.signups ?? [])].filter(c => schema.signups.has(c));
  assert.ok(shared.length >= 3, 'the two extractors agree on almost nothing — one of them is wrong');
});

test('the column that caused the outage is now declared, on both tables', () => {
  // This test used to assert the opposite — that schema.sql did NOT have
  // signups.cancelled_at — with a message saying to change it once
  // 2026-09-01e was applied and folded in. It was applied on 2026-09-01 and
  // verified live outside its transaction, so this is that change.
  //
  // Kept rather than deleted because it says something the general check
  // cannot: the general check only notices a column the CLIENT names, so a
  // release that dropped every reference to cancelled_at would pass it while
  // silently going back to hard deletes.
  const schema = schemaColumns();
  assert.equal(schema.signups.has('cancelled_at'), true);
  assert.equal(schema.tables.has('cancelled_at'), true,
    'tables.cancelled_at is the shape signups copied, and it is missing');
});
