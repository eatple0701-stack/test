// What a project built from supabase/schema.sql alone actually contains.
//
// Written to answer one question that could not be answered by reading:
// if the production database were lost tomorrow, does pasting schema.sql into
// a new project give back what was lost? Until 2026-09-01 the answer was no in
// the strongest possible sense — the file aborted on the first function that
// read a column declared eighty lines below it, and in the SQL editor's single
// transaction the whole thing rolled back. A new project came up empty.
//
//   node scripts/schema-catalog.mjs                 # print the catalogue
//   node scripts/schema-catalog.mjs out.tsv         # and write it
//   node scripts/schema-catalog.mjs --diff live.tsv # compare with production
//
// The production half cannot be read from here. docs/rls-baseline-2026-09-01.md
// carries a query that returns the same six lists in the same shape from the
// live database; export it as TSV and pass it to --diff. Anything else is a
// guess, and a guess about whether a backup restores is worth nothing.

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

// Only what the platform itself provides. Every line here is something a real
// Supabase project has before schema.sql is pasted, and nothing more —
// anything extra would be this script quietly supplying what the file should
// declare for itself.
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

// One row per catalogue entry, `kind<TAB>value`, sorted. The same six
// questions the live query asks, in the same order, so a plain line diff is a
// meaningful answer rather than a formatting comparison.
const QUERIES = [
  ['column', `select table_name || '.' || column_name || ':' || data_type as v
                from information_schema.columns where table_schema = 'public'`],
  ['function', `select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as v
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public'`],
  ['policy', `select tablename || '.' || policyname || ':' || cmd as v
                from pg_policies where schemaname = 'public'`],
  ['trigger', `select c.relname || '.' || t.tgname as v
                 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                 join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and not t.tgisinternal`],
  ['index', `select tablename || '.' || indexname as v
               from pg_indexes where schemaname = 'public'`],
  ['rls', `select c.relname || ':' || c.relrowsecurity as v
             from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r'`],
];

export async function catalogueFromSchema(schemaSql) {
  const db = new PGlite();
  await db.exec(SUPABASE);
  await db.exec(schemaSql);
  const lines = [];
  for (const [kind, sql] of QUERIES) {
    const { rows } = await db.query(`${sql} order by 1`);
    for (const r of rows) lines.push(`${kind}\t${r.v}`);
  }
  await db.close();
  return lines;
}

/** Two catalogues, as three lists: only here, only there, and the totals. */
export function compare(mine, theirs) {
  const a = new Set(mine);
  const b = new Set(theirs);
  return {
    onlyInSchema: [...a].filter(x => !b.has(x)).sort(),
    onlyInProduction: [...b].filter(x => !a.has(x)).sort(),
    inBoth: [...a].filter(x => b.has(x)).length,
  };
}

const readLines = (f) => fs.readFileSync(f, 'utf8')
  .replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);

// pathToFileURL rather than string-building the URL: this project lives under
// a path with spaces and Hangul in it, which percent-encodes, so the naive
// comparison was false on every run and the script printed nothing at all.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const schema = fs.readFileSync('supabase/schema.sql', 'utf8').replace(/\r\n/g, '\n');
  const mine = await catalogueFromSchema(schema);

  const counts = {};
  for (const l of mine) counts[l.split('\t')[0]] = (counts[l.split('\t')[0]] ?? 0) + 1;

  const diffAt = process.argv.indexOf('--diff');
  if (diffAt > 0) {
    const live = readLines(process.argv[diffAt + 1]);
    const d = compare(mine, live);
    console.log(`in both: ${d.inBoth}`);
    console.log(`only in schema.sql: ${d.onlyInSchema.length}`);
    d.onlyInSchema.forEach(x => console.log(`  + ${x}`));
    console.log(`only in production: ${d.onlyInProduction.length}`);
    d.onlyInProduction.forEach(x => console.log(`  - ${x}`));
    process.exitCode = d.onlyInSchema.length + d.onlyInProduction.length === 0 ? 0 : 1;
  } else {
    const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
    if (out) fs.writeFileSync(out, mine.join('\n') + '\n');
    console.log(JSON.stringify(counts, null, 2));
    console.log(`${mine.length} catalogue entries${out ? ` written to ${out}` : ''}`);
  }
}
