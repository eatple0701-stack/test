import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { restaurants } from '../../data/restaurants.js';
import { asPlace } from '../../data/nearbyPlaces.js';
import { isQuarantined } from '../../data/verification.js';
import { getOpenStatus, todaysHours, directionsUrl, naverMapUrl, kakaoMapUrl, coordsOf } from '../../utils.js';

// Two things a reviewer asked to be checked before the Places tab merged,
// and what came back when they were actually opened in a browser rather than
// reasoned about.
//
// The shared lesson: both of these were *working* code. The links resolved,
// the hours rendered, every existing test passed. They were wrong in ways
// only a person looking at the result would notice — a link that lands on a
// coordinate instead of a restaurant, a line that says "closed" twice.

const src = (f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8');
const active = restaurants.filter(r => !isQuarantined(r));
const utils = src('src/utils.js');

// ── The destination is a coordinate, never a name ────────────────────────

test('no map link lets a name string decide where the reader ends up', () => {
  // Names are written "Balwoo Gongyang (발우공양)" — brackets, spaces, Hangul.
  // As a search query that resolves correctly for a famous temple restaurant
  // and lands somewhere else entirely for a 왕족발 shop with fifty
  // namesakes. The coordinates were checked against Naver and Kakao on a
  // recorded date; a search string is checked against nothing.
  const origins = [null, [37.5540, 126.9880]];
  for (const place of active) {
    const { lat, lng } = coordsOf(place);
    for (const origin of origins) {
      for (const [who, url] of [
        ['google', directionsUrl(place, origin)],
        ['naver', naverMapUrl(place, origin)],
        ['kakao', kakaoMapUrl(place, origin)],
      ]) {
        assert.ok(
          url.includes(String(lat)) && url.includes(String(lng)),
          `${who} link for ${place.id} (origin ${origin ? 'set' : 'null'}) does not carry the coordinate: ${url}`,
        );
        assert.doesNotMatch(
          url, /\/p\/search\/|[?&]q=|[?&]query=(?!-?\d)/,
          `${who} link for ${place.id} resolves by search, not by coordinate: ${url}`,
        );
      }
    }
  }
});

test('the Google link asks for directions, because that is what the button says', () => {
  // Opened on 2026-08-30, the old no-origin form —
  // maps/search/?api=1&query=<lat>,<lng> — produced a page titled
  // 37°34'25.8"N 126°58'59.6"E: a plus code, no restaurant, no route. The
  // directions form with the same coordinate returned three live transit
  // options. Same accuracy, an answer instead of a pin.
  const url = directionsUrl(active[0]);
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
  assert.doesNotMatch(url, /maps\/search/);
});

test('kakaoMapUrl carries the note about what it does in a browser', () => {
  // It landed on Kakao's directions page with an empty destination for both
  // a Korean name and an ASCII one, and link/map/ landed on a plain map at
  // the viewer's own location. That is the documented mobile-app scheme, so
  // it probably works on a phone — probably is not verified, and the comment
  // has to say so or the next person will read the code and assume it does.
  assert.match(utils, /Known not to work in a desktop browser/);
  // Comment text wraps, so the claim is matched across the line break.
  assert.match(utils.replace(/\n\/\/ ?/g, ' '), /has not been tested on a phone/);
});

// ── Hours say something a reader can act on ──────────────────────────────

const AT = (h, day = 30) => new Date(2026, 7, day, h, 0);   // Aug 2026

test('a closed place says when it opens next, not that it is closed twice', () => {
  // `Closed · closed for today` is the label repeated as the detail, and it
  // is what the app said at 11pm — which is exactly when somebody is
  // planning tomorrow's lunch.
  for (const hour of [7, 23]) {
    for (const place of active) {
      const status = getOpenStatus(place.hours, AT(hour), 'en');
      if (!status || status.open) continue;
      assert.doesNotMatch(
        status.detail, /^closed/,
        `${place.id} at ${hour}:00 still says "${status.label} · ${status.detail}"`,
      );
      assert.match(
        status.detail, /^opens /,
        `${place.id} at ${hour}:00 says "${status.detail}" — not an opening time`,
      );
    }
  }
});

test('the look-ahead reads the record and never invents a day', () => {
  // Every day named must be a day the record actually holds an open slot on.
  const DAYS = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };
  let checked = 0;
  for (const place of active) {
    const weekly = place.hours?.value?.weekly;
    if (!weekly) continue;
    const status = getOpenStatus(place.hours, AT(23), 'en');
    const named = status?.detail?.match(/^opens (Sun|Mon|Tue|Wed|Thu|Fri|Sat) /)?.[1];
    if (!named) continue;
    const slots = weekly[DAYS[named]];
    assert.ok(slots && slots.length > 0, `${place.id} is sent to ${named}, which its record leaves closed`);
    checked += 1;
  }
  assert.ok(checked > 0, 'no place exercised the look-ahead — this test is asserting nothing');
});

test('the look-ahead stops at the edge of what the record knows', () => {
  // ggot-epida omits Wednesday from `weekly` on purpose — restaurants.js
  // says so on the line where it is missing: "the one Wednesday on file
  // opened at 17:00. A weekly rule from a single observation would be a
  // guess." getOpenStatus has always honoured that by returning null when
  // *today* is the unrecorded day. The first draft of the look-ahead read
  // straight past it and announced "opens Thu 11:30 AM" on a Tuesday
  // evening, which asserts a Wednesday closure the record refuses to
  // assert — the app inventing a fact out of a documented gap.
  const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  let exercised = 0;
  for (const place of active) {
    const weekly = place.hours?.value?.weekly;
    if (!weekly) continue;
    for (let day = 0; day < 7; day += 1) {
      for (const hour of [7, 13, 23]) {
        const status = getOpenStatus(place.hours, new Date(2026, 7, 30 + day, hour, 0), 'en');
        const named = status?.detail?.match(/^opens (Sun|Mon|Tue|Wed|Thu|Fri|Sat) /)?.[1];
        if (!named) continue;
        const from = new Date(2026, 7, 30 + day).getDay();
        const to = NAMES.indexOf(named);
        // Every day it skipped over to get there had to be a day the record
        // actually calls closed, not one it simply does not mention.
        for (let ahead = 1; (from + ahead) % 7 !== to; ahead += 1) {
          const key = KEYS[(from + ahead) % 7];
          assert.ok(
            key in weekly,
            `${place.id}: sent to ${named} across ${key}, which its record does not record`,
          );
        }
        exercised += 1;
      }
    }
  }
  assert.ok(exercised > 0, 'nothing reached the look-ahead — this test asserts nothing');
});

test('a place that opens only today is not told to come back today', () => {
  // Seven steps forward lands on today again. A single-day schedule is the
  // only shape that reaches the seventh step, so nothing in the real data
  // exercises it and a fixture has to.
  const mondayOnly = {
    value: { raw: 'Mon only', weekly: { sun: [], mon: [{ from: '11:00', to: '20:00' }], tue: [], wed: [], thu: [], fri: [], sat: [] } },
    confidence: 'confirmed', source: 'test', method: 'fixture', lastCheckedAt: '2026-08-31',
  };
  // Monday 2026-08-31, after closing.
  const status = getOpenStatus(mondayOnly, new Date(2026, 7, 31, 22, 0), 'en');
  assert.ok(status);
  assert.doesNotMatch(status.detail, /opens Mon/, `wrapped round to today: ${status.detail}`);
});

test('a register place carries real coordinates into every map link', () => {
  // asPlace emits a bare `{ lat, lng }` and coordsOf read only
  // `.coordinates.value`, so all 8,118 register places produced links
  // reading `,undefined,undefined`. Nothing failed and no test noticed:
  // the links opened a map app pointed at nowhere.
  const flat = { name: '말모아왕족발', coordinates: { lat: 37.56, lng: 126.98 } };
  const fact = { name: 'Balwoo', coordinates: { value: { lat: 37.57, lng: 126.98 } } };
  for (const [what, place] of [['register row', flat], ['curated fact', fact]]) {
    const { lat, lng } = coordsOf(place);
    assert.ok(Number.isFinite(lat) && Number.isFinite(lng), `${what}: coordsOf gave ${lat},${lng}`);
    for (const url of [directionsUrl(place), naverMapUrl(place), kakaoMapUrl(place)]) {
      assert.doesNotMatch(url, /undefined/, `${what}: ${url}`);
      assert.ok(url.includes(String(lat)), `${what}: ${url}`);
    }
  }
  // And the real thing, through the real converter.
  const row = JSON.parse(src('public/data/seoul/Jongno.json')).rows.find(r => r.y !== undefined);
  const place = asPlace(row);
  assert.doesNotMatch(kakaoMapUrl(place), /undefined/);
  assert.doesNotMatch(directionsUrl(place), /undefined/);
});

test('a place with no week to read still degrades to the old wording', () => {
  // One of the eighteen has a free-text `raw` range and no `weekly` map, and
  // three have no hours at all. Neither can be looked ahead, and neither may
  // crash or claim a day.
  const raws = active.filter(p => p.hours?.value && !p.hours.value.weekly);
  const nones = active.filter(p => !p.hours?.value);
  assert.ok(raws.length + nones.length > 0, 'no degraded case left to guard');
  for (const p of nones) assert.equal(getOpenStatus(p.hours, AT(23), 'en'), null);
  for (const p of raws) {
    const s = getOpenStatus(p.hours, AT(23), 'en');
    if (s) assert.doesNotMatch(s.detail, /Sun|Mon|Tue|Wed|Thu|Fri|Sat/, `${p.id} named a weekday it cannot know`);
  }
});

// ── The clock is written in the reader's language ────────────────────────

test('no English clock leaks into Korean, Chinese or Japanese', () => {
  // The map row never passed a locale, so the whole hours line was English
  // and its `AM` was invisible inside it. Translating the sentence exposed
  // the clock: 월 11:30 AM 영업 시작.
  for (const locale of ['ko', 'zh', 'ja']) {
    for (const hour of [7, 13, 23]) {
      for (const place of active) {
        const status = getOpenStatus(place.hours, AT(hour), locale);
        if (!status) continue;
        const line = `${status.label} · ${status.detail}`;
        assert.doesNotMatch(line, /\b(AM|PM)\b/, `${locale}/${place.id}@${hour}: ${line}`);
      }
      const printed = todaysHours(active[0].hours, AT(hour), locale);
      if (printed) assert.doesNotMatch(printed, /\b(AM|PM)\b/, `${locale} todaysHours: ${printed}`);
    }
  }
});

test('every language gets a clock, and es/fr/ar get a 24-hour one', () => {
  const place = active.find(p => p.hours?.value?.weekly);
  for (const locale of ['both', 'en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja']) {
    const status = getOpenStatus(place.hours, AT(13, 31), locale);
    assert.ok(status && status.detail.trim(), `${locale} produced no detail`);
  }
  // 15:00, not 3:00 — the languages that write it that way.
  for (const locale of ['es', 'fr', 'ar']) {
    const status = getOpenStatus(place.hours, AT(13, 31), locale);
    assert.match(status.detail, /1[45]:00/, `${locale} did not use a 24-hour clock: ${status.detail}`);
  }
  // And the meridiem is the local word, in front, where those languages put it.
  assert.match(getOpenStatus(place.hours, AT(13, 31), 'ko').detail, /오후/);
  assert.match(getOpenStatus(place.hours, AT(13, 31), 'ja').detail, /午後/);
  assert.match(getOpenStatus(place.hours, AT(13, 31), 'zh').detail, /下午/);
});

test('the weekday table lines up with the keys the records are written under', () => {
  // DAY_WORD is indexed by Date#getDay() and DAY_KEYS is the same order.
  // If one is ever reordered without the other, every closed place sends
  // people on the wrong day and nothing else in the app would notice.
  const dayWord = utils.slice(utils.indexOf('const DAY_WORD = ['), utils.indexOf('const hoursPhrase'));
  const order = [...dayWord.matchAll(/\['(\w{3})',/g)].map(m => m[1]);
  assert.deepEqual(order, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  assert.match(utils, /export const DAY_KEYS = \['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'\];/);
  // Seven languages each, like every other phrase table in this file.
  for (const row of dayWord.split('\n').filter(l => /^\s{2}\['/.test(l))) {
    assert.equal((row.match(/'/g) || []).length / 2, 7, `a weekday row is short of a language: ${row.trim()}`);
  }
});

test('every screen that prints hours tells the clock which language to use', () => {
  // getOpenStatus and todaysHours both default to English, and both are
  // called from four screens. Threading the locale through the function is
  // half the job; the half a reader actually meets is the call site, and
  // nothing asserted it — dropping the third argument put English times back
  // under Korean headings with the whole suite still green. That is how the
  // map row shipped `Open · closes 10:00 PM` to every reader for six weeks.
  for (const [file, fns] of [
    ['src/components/BottomSheetList.jsx', ['getOpenStatus']],
    ['src/components/RestaurantDetail.jsx', ['getOpenStatus', 'todaysHours']],
    ['src/components/RegistryPlaceSheet.jsx', ['getOpenStatus', 'todaysHours']],
    ['src/components/PlaceCard.jsx', ['getOpenStatus']],
  ]) {
    const lines = src(file).split('\n');
    for (const fn of fns) {
      // Call sites, not the import: a call has an open paren after the name.
      const calls = lines.filter(l => (
        l.includes(`${fn}(`)
        && !l.trimStart().startsWith('import')
        && !l.trimStart().startsWith('//')      // a comment naming the function
        && !l.trimStart().startsWith('*')
      ));
      assert.ok(calls.length > 0, `${file} never calls ${fn}`);
      for (const line of calls) {
        assert.match(
          line, new RegExp(`${fn}\\(.*,\\s*locale\\s*\\)`),
          `${file}: no locale passed — ${line.trim()}`,
        );
      }
    }
  }
});
