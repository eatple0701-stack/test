import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// The notification mail, in one language.
//
// ── What went out ───────────────────────────────────────────────────────
//
// The first mail the fixed sender actually delivered, 2026-09-01 19:55:
//
//     조강민 asked to sit at your table — 2026-09-03 19:00, sd.
//     요청에 답해 주세요. …
//     Please answer — unanswered requests lapse …
//
// English first line, then both languages one after the other, and nothing
// looked at who was reading. The app has had each person's languages since
// the Profile screen was built; the outbox never asked.
//
// ── What "one language" is allowed to mean ──────────────────────────────
//
// The app's own words are in one language. The DATA is whatever people
// wrote: a guest called 조강민, a place typed "sd". So a Korean name in an
// English mail is correct, and "no Hangul in an English body" would be the
// wrong assertion — it would fail on somebody's name.
//
// So these compare PHRASES. A Korean body must contain none of the English
// sentences the outbox knows, and the reverse. That is checkable, and it is
// what the complaint was actually about.

process.env.TZ = 'Asia/Seoul';

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const MIGRATION = 'supabase/migrations/2026-09-01d-notify-in-one-language.sql';
const ROLLBACK = 'supabase/migrations/2026-09-01d-notify-in-one-language-ROLLBACK.sql';

/** Everything the file applies, without its own transaction or check block. */
const applyPart = (sql, endMarker) =>
  sql.slice(sql.indexOf('\nbegin;') + '\nbegin;'.length, sql.indexOf(endMarker));

const BOOTSTRAP = `
create table public.profiles (
  id uuid primary key, name text, languages text[] default '{}'
);
create table public.member_details (
  id uuid primary key references public.profiles(id), email text not null default ''
);
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id), host_name text, menu_id text,
  date date, time time, place text, seats int, cancelled_at timestamptz
);
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references public.tables(id), user_id uuid references public.profiles(id),
  name text, status text
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null, recipient text not null, subject text not null,
  body text not null, table_id uuid, created_at timestamptz default now(), sent_at timestamptz
);

-- Three readers: one Korean, one English, one who never said.
insert into public.profiles (id, name, languages) values
  ('00000000-0000-4000-8000-0000000000k1'::uuid, '한국호스트', array['한국어']),
  ('00000000-0000-4000-8000-0000000000e1'::uuid, 'English host', array['English']),
  ('00000000-0000-4000-8000-0000000000n1'::uuid, 'Silent host', array[]::text[]);
insert into public.member_details (id, email) values
  ('00000000-0000-4000-8000-0000000000k1'::uuid, 'ko@example.com'),
  ('00000000-0000-4000-8000-0000000000e1'::uuid, 'en@example.com'),
  ('00000000-0000-4000-8000-0000000000n1'::uuid, 'both@example.com');

-- A guest, with a Korean name on purpose: it has to survive into the
-- English mail, because it is data and not wording.
insert into public.profiles (id, name, languages) values
  ('00000000-0000-4000-8000-0000000000g1'::uuid, '조강민', array['한국어']);
insert into public.member_details (id, email) values
  ('00000000-0000-4000-8000-0000000000g1'::uuid, 'guest@example.com');
`;

const db = new PGlite();
await db.exec(BOOTSTRAP.replace(/0000000000(k1|e1|n1|g1)/g,
  (_, k) => ({ k1: '000000000001', e1: '000000000002', n1: '000000000003', g1: '000000000004' }[k])));
await db.exec(applyPart(read(MIGRATION), '-- == Verification'));

// The trigger definitions live in schema.sql; the migration only replaces the
// function bodies, exactly as it does in production.
await db.exec(`
create trigger trg_notify_seat_requested after insert on public.signups
  for each row execute function public.notify_seat_requested();
create trigger trg_notify_seat_decided after update on public.signups
  for each row execute function public.notify_seat_decided();
create trigger trg_notify_table_cancelled after update on public.tables
  for each row execute function public.notify_table_cancelled();`);

const HOST = { ko: '000000000001', en: '000000000002', both: '000000000003' };
const GUEST = '00000000-0000-4000-8000-000000000004';
const uid = (tail) => `00000000-0000-4000-8000-${tail}`;

/** A table hosted by the reader of `lang`, and a request on it. */
async function requestAt(lang, place = 'sd') {
  const t = await db.query(
    `insert into public.tables (host_id, host_name, menu_id, date, time, place, seats)
     values ($1,'h','samgyeopsal', current_date + 3, time '19:00', $2, 4) returning id`,
    [uid(HOST[lang]), place]);
  const id = t.rows[0].id;
  await db.query(
    `insert into public.signups (table_id, user_id, name, status) values ($1,$2,'조강민','pending')`,
    [id, GUEST]);
  const n = await db.query(
    `select subject, body from public.notifications
      where kind = 'seat_requested' and table_id = $1`, [id]);
  return { tableId: id, ...n.rows[0] };
}

/** Every sentence the outbox knows, in one language. */
async function phrases(lang) {
  const keys = ['req_answer', 'yes_meet', 'no_lead', 'no_other', 'off_dont', 'yes_lead', 'off_lead'];
  const { rows } = await db.query(
    `select k, public.notify_line(k, $1) as line from unnest($2::text[]) as k`, [lang, keys]);
  return rows.map(r => r.line);
}

test('a Korean reader gets no English sentence', async () => {
  const mail = await requestAt('ko');
  for (const line of await phrases('en')) {
    assert.equal(mail.body.includes(line), false,
      `an English sentence reached a Korean reader: ${line}`);
  }
  assert.match(mail.body, /요청에 답해 주세요/, 'the Korean sentence is missing');
  assert.equal(mail.subject, '[밥친구] 자리 요청이 왔어요');
});

test('an English reader gets no Korean sentence', async () => {
  const mail = await requestAt('en');
  for (const line of await phrases('ko')) {
    assert.equal(mail.body.includes(line), false,
      `a Korean sentence reached an English reader: ${line}`);
  }
  assert.match(mail.body, /Please answer/, 'the English sentence is missing');
  assert.equal(mail.subject, '[Eatple] Somebody asked for a seat');
});

test('a guest’s Korean name still reaches an English reader', async () => {
  // The distinction the whole file rests on. "No Hangul in an English body"
  // would be the wrong assertion: it would strip the name of the person
  // asking, which is the one thing the host most needs.
  const mail = await requestAt('en');
  assert.match(mail.body, /조강민/, 'the guest’s name was lost from the English mail');
  // And a place somebody typed in Korean survives too.
  const withKoreanPlace = await requestAt('en', '종로3가역 4번 출구');
  assert.match(withKoreanPlace.body, /종로3가역 4번 출구/);
});

test('somebody who never said which language gets both', async () => {
  const mail = await requestAt('both');
  assert.match(mail.body, /요청에 답해 주세요/);
  assert.match(mail.body, /Please answer/);
  assert.equal(mail.subject, '[밥친구] 자리 요청이 왔어요 · Somebody asked for a seat');
});

test('the answer to a request is written to the guest, in the guest’s language', async () => {
  // The recipient changes: this one goes to whoever asked, not to the host.
  // Reading the host's language here would send a Korean guest an English
  // answer because the host happened to be English.
  const { tableId } = await requestAt('en');
  await db.query(`update public.signups set status = 'accepted' where table_id = $1`, [tableId]);
  const { rows } = await db.query(
    `select recipient, subject, body from public.notifications
      where kind = 'seat_decided' and table_id = $1`, [tableId]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].recipient, 'guest@example.com');
  assert.equal(rows[0].subject, '[밥친구] 자리 확정!', 'the guest speaks Korean and was answered in English');
  for (const line of await phrases('en')) assert.equal(rows[0].body.includes(line), false);
});

test('a cancellation reaches each person in their own language', async () => {
  // One event, several readers, and the loop has to ask each time rather
  // than once. Getting this wrong sends everybody the first guest's language.
  const t = await db.query(
    `insert into public.tables (host_id, host_name, menu_id, date, time, place, seats)
     values ($1,'h','samgyeopsal', current_date + 3, time '19:00', 'sd', 4) returning id`,
    [uid(HOST.ko)]);
  const id = t.rows[0].id;
  for (const who of [HOST.ko, HOST.en, HOST.both]) {
    await db.query(
      `insert into public.signups (table_id, user_id, name, status) values ($1,$2,'x','accepted')`,
      [id, uid(who)]);
  }
  await db.query(`update public.tables set cancelled_at = now() where id = $1`, [id]);

  const { rows } = await db.query(
    `select recipient, body from public.notifications
      where kind = 'table_cancelled' and table_id = $1 order by recipient`, [id]);
  assert.equal(rows.length, 3, 'not everybody with a seat was told');
  const by = Object.fromEntries(rows.map(r => [r.recipient, r.body]));

  assert.match(by['ko@example.com'], /만나기로 한 곳에 가지 마세요/);
  assert.equal(by['ko@example.com'].includes('Do not go to the meeting point'), false);

  assert.match(by['en@example.com'], /Do not go to the meeting point/);
  assert.equal(by['en@example.com'].includes('만나기로 한 곳에 가지 마세요'), false);

  assert.match(by['both@example.com'], /만나기로 한 곳에 가지 마세요/);
  assert.match(by['both@example.com'], /Do not go to the meeting point/);
});

test('every sentence exists in all three languages', async () => {
  // A missing key would fall through to the signature and quietly drop a
  // sentence out of the mail — the failure would be an email that reads fine
  // and is missing the instruction.
  const keys = ['req_subject', 'req_asked', 'req_answer', 'yes_subject', 'yes_lead', 'yes_meet',
    'no_subject', 'no_lead', 'no_other', 'off_subject', 'off_lead', 'off_dont'];
  const { rows } = await db.query(
    `select k, public.notify_line(k, l) as line
       from unnest($1::text[]) as k, unnest(array['ko','en','both']) as l`, [keys]);
  assert.equal(rows.length, keys.length * 3);
  for (const r of rows) {
    assert.notEqual(r.line, '— 밥친구 · Eatple',
      `${r.k} fell through to the signature — the key is missing for one language`);
  }
});

test('the reader’s language is read from the profile the app already has', async () => {
  const { rows } = await db.query(
    `select public.notify_lang($1::uuid) as ko, public.notify_lang($2::uuid) as en,
            public.notify_lang($3::uuid) as none,
            public.notify_lang('00000000-0000-4000-8000-0000000000ff'::uuid) as missing`,
    [uid(HOST.ko), uid(HOST.en), uid(HOST.both)]);
  assert.equal(rows[0].ko, 'ko');
  assert.equal(rows[0].en, 'en');
  assert.equal(rows[0].none, 'both');
  assert.equal(rows[0].missing, null, 'an unknown person must fall to the bilingual default');
});

test('somebody who speaks both is written to in both', async () => {
  await db.query(
    `update public.profiles set languages = array['한국어','English'] where id = $1`, [uid(HOST.ko)]);
  const { rows } = await db.query(`select public.notify_lang($1::uuid) as l`, [uid(HOST.ko)]);
  assert.equal(rows[0].l, 'both');
  await db.query(`update public.profiles set languages = array['한국어'] where id = $1`, [uid(HOST.ko)]);
});

test('the rollback puts the bilingual bodies back', async () => {
  // Written before the forward file was applied, and run here rather than
  // trusted. On 2026-09-01 a policy went in with no undo prepared and the
  // minutes spent writing one were minutes production spent broken.
  await db.exec(applyPart(read(ROLLBACK), '\ndrop function if exists'));
  await db.exec('drop function if exists public.notify_line(text, text);');
  await db.exec('drop function if exists public.notify_lang(uuid);');

  const mail = await requestAt('ko');
  assert.match(mail.body, /Please answer/, 'the rollback did not restore the bilingual body');
  assert.match(mail.subject, /· Somebody asked for a seat/);

  const { rows } = await db.query(
    `select count(*)::int as n from pg_proc where proname in ('notify_lang','notify_line')`);
  assert.equal(rows[0].n, 0, 'a helper survived the rollback');

  // Forward again, so the file leaves the database in the state it applies.
  await db.exec(applyPart(read(MIGRATION), '-- == Verification'));
});

test.after(async () => { await db.close(); });
