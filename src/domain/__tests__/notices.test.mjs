import test from 'node:test';
import assert from 'node:assert/strict';
import { NOTICES, NOTICE_KIND, activeNotice } from '../../content/notices.js';

const on = (ymd) => new Date(`${ymd}T12:00:00`);

test('a notice retires on its own day without anybody remembering', () => {
  // The reason `until` exists at all: a pilot banner still up in November is
  // the app telling everybody nobody is maintaining it.
  const only = [{ id: 'x', kr: 'ㄱ', en: 'g', until: '2026-09-01' }];
  assert.equal(activeNotice(only, on('2026-08-31'))?.id, 'x');
  assert.equal(activeNotice(only, on('2026-09-01')), null, 'until is exclusive');
  assert.equal(activeNotice(only, on('2026-12-25')), null);
});

test('a notice with no end date stands until it is deleted', () => {
  const standing = [{ id: 'y', kr: 'ㄱ', en: 'g' }];
  assert.equal(activeNotice(standing, on('2030-01-01'))?.id, 'y');
});

test('only one notice shows, and it is the first one still live', () => {
  // A banner stack is a banner nobody reads.
  const many = [
    { id: 'expired', kr: 'ㄱ', en: 'g', until: '2026-08-01' },
    { id: 'first-live', kr: 'ㄴ', en: 'n' },
    { id: 'also-live', kr: 'ㄷ', en: 'd' },
  ];
  const shown = activeNotice(many, on('2026-08-05'));
  assert.equal(shown.id, 'first-live');
});

test('an empty list is a quiet screen, not a crash', () => {
  assert.equal(activeNotice([], on('2026-08-05')), null);
  assert.equal(activeNotice(null, on('2026-08-05')), null);
  // Called with nothing it reads the shipped list — that is the form the
  // component uses, and it must not need to know the list's name.
  assert.doesNotThrow(() => activeNotice());
});

test('every notice the app ships reads in both languages', () => {
  const hangul = /[가-힣]/;
  for (const n of NOTICES) {
    assert.ok(n.id, 'a notice with no id cannot be dismissed or traced');
    assert.match(n.kr, hangul, `${n.id} has no Korean`);
    assert.ok(n.en.trim().length > 0, `${n.id} has no English`);
    assert.ok(!hangul.test(n.en), `${n.id}'s English half is not English`);
    assert.ok(Object.values(NOTICE_KIND).includes(n.kind), `${n.id} has no kind`);
  }
});

test('a notice says what it means for the reader, not what happened to us', () => {
  // The failure this rule exists for: "우리는 파일럿을 시작했습니다" is news
  // about the team. What a traveller needs is what it means for their week.
  for (const n of NOTICES) {
    assert.ok(n.en.length > 40, `${n.id} is too short to say what it means`);
    assert.ok(!/^we (are|have|launched)/i.test(n.en.trim()), `${n.id} leads with us`);
  }
});

test('the pilot notice does not outlast the pilot', () => {
  // Named explicitly because this is the one that will be forgotten.
  const pilot = NOTICES.find(n => n.id.startsWith('pilot'));
  assert.ok(pilot, 'the pilot notice is gone — delete this test with it');
  assert.ok(pilot.until, 'the pilot notice has no end date');
  assert.equal(activeNotice(NOTICES, on('2027-01-01')), null,
    'something is still shouting a year from now');
});
