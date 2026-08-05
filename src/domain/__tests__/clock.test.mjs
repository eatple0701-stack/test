import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KST_OFFSET_MINUTES, KST_LABEL, onKoreanTime, timeText, localEcho, clockWarning,
} from '../policy/clock.js';

// Offsets as minutes ahead of UTC, the way this policy counts them.
const SEOUL = 540;
const TOKYO = 540;      // same as Seoul — the echo must stay quiet
const OSAKA = 540;
const BEIJING = 480;    // one hour behind
const LONDON = 60;      // BST
const NEW_YORK = -240;  // EDT

test('a printed time always says which clock it is on', () => {
  assert.equal(timeText('19:00'), `19:00 ${KST_LABEL}`);
  assert.equal(timeText('9:30'), '9:30 KST');
});

test('a time this policy cannot read is handed back rather than mangled', () => {
  // Better a bare string than "undefined KST" on somebody's card.
  assert.equal(timeText(''), '');
  assert.equal(timeText(null), '');
  assert.equal(timeText('저녁'), '저녁');
  assert.equal(timeText('19:00:00'), '19:00:00');
});

test('a device already on Korean time is told nothing', () => {
  // The whole point of deriving this is that it stays silent for the people
  // who do not need it. A permanent "KST is UTC+9" banner is noise.
  assert.equal(onKoreanTime(SEOUL), true);
  assert.equal(localEcho('2026-08-06', '19:00', SEOUL), null);
  assert.equal(clockWarning('2026-08-06', '19:00', SEOUL), null);
  assert.equal(onKoreanTime(TOKYO), true, 'Japan shares the offset');
  assert.equal(clockWarning('2026-08-06', '19:00', OSAKA), null);
});

test('an hour out is still an hour late', () => {
  // Beijing is the near miss — close enough that nobody double-checks, far
  // enough to arrive after the food is ordered.
  const echo = localEcho('2026-08-06', '19:00', BEIJING);
  assert.deepEqual(echo, { time: '18:00', date: '2026-08-06', sameDay: true });
  assert.match(clockWarning('2026-08-06', '19:00', BEIJING), /18:00/);
});

test('a dinner in Seoul is the same afternoon in London', () => {
  const echo = localEcho('2026-08-06', '19:00', LONDON);
  assert.deepEqual(echo, { time: '11:00', date: '2026-08-06', sameDay: true });
});

test('a dinner in Seoul is the previous morning in New York', () => {
  // The case that makes the date matter: same instant, different day. A
  // warning that printed only a time here would be worse than none.
  const echo = localEcho('2026-08-06', '19:00', NEW_YORK);
  assert.deepEqual(echo, { time: '06:00', date: '2026-08-06', sameDay: true });

  // And a late table crosses the line properly.
  const late = localEcho('2026-08-06', '09:00', NEW_YORK);
  assert.deepEqual(late, { time: '20:00', date: '2026-08-05', sameDay: false });
  assert.match(clockWarning('2026-08-06', '09:00', NEW_YORK), /2026-08-05/);
});

test('the warning names the phone, not the person', () => {
  // It is a fact about a device, not advice about what they should have done.
  // Somebody may be keeping home time on purpose, to call their family.
  const line = clockWarning('2026-08-06', '19:00', NEW_YORK);
  assert.match(line, /Your device is not on Korean time/);
  assert.ok(!/should|must|please|change your/i.test(line), 'the warning is telling them off');
});

test('Korea has no daylight saving, so the offset is the same in January', () => {
  // KST has been a flat UTC+9 since 1988. Summer and winter must agree, or
  // every table booked across a season boundary is wrong by an hour.
  assert.equal(KST_OFFSET_MINUTES, 540);
  assert.deepEqual(
    localEcho('2026-01-15', '19:00', BEIJING),
    { time: '18:00', date: '2026-01-15', sameDay: true },
  );
});

test('a broken date or time produces no echo rather than a wrong one', () => {
  assert.equal(localEcho(null, '19:00', LONDON), null);
  assert.equal(localEcho('2026-08-06', null, LONDON), null);
  assert.equal(localEcho('저녁', '19:00', LONDON), null);
  assert.equal(clockWarning(undefined, undefined, LONDON), null);
});
