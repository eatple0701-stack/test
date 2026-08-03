import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { PROMISES, PROMISES_LEAD } from '../../content/promises.js';

// The landing page's promises, checked against the code that keeps them.
//
// This block exists because 당근 모임 organisers type their rules into a
// description box and nothing enforces them. Ours are enforced — and the
// moment that stops being true, this list becomes the same empty paragraph
// with better typography. So the enforcement is named per promise and
// checked here.

const root = new URL('../../../', import.meta.url);

test('every promise names a module that actually exists', () => {
  // The failure this prevents: somebody deletes or moves the policy and the
  // landing page keeps promising what it did. A stranger reads that line
  // before deciding to eat with people they have never met.
  const broken = PROMISES
    .filter(p => !existsSync(new URL(p.backedBy, root)))
    .map(p => `${p.id} -> ${p.backedBy}`);
  assert.deepEqual(broken, [], 'promised on the landing page, enforced by nothing');
});

test('every promise is written in both languages', () => {
  for (const p of PROMISES) {
    assert.ok(p.kr && p.kr.trim(), `${p.id} has no Korean line`);
    assert.ok(p.en && p.en.trim(), `${p.id} has no English line`);
  }
  assert.ok(PROMISES_LEAD.kr && PROMISES_LEAD.en);
});

test('the promises cover the four things a stranger is actually afraid of', () => {
  // Named rather than counted, so dropping one fails with the reason. These
  // are the fears the feedback documents raised: 부장님 asked for 신고 and
  // 차단, 교수님 asked what happens on a no-show and how long matching takes,
  // and the 8/1 reviewers asked about diet and safety.
  const ids = PROMISES.map(p => p.id);
  for (const required of ['approval', 'lapse', 'attendance', 'safety']) {
    assert.ok(ids.includes(required), `the ${required} promise is missing`);
  }
});

test('no promise claims a reputation score, because there is not one', () => {
  // attendance.js is explicit that this app has no 매너온도 and will not
  // pretend to. Copy drifts toward that language on its own — "믿을 수 있는",
  // "검증된 회원" — so the drift is held here.
  const text = PROMISES.map(p => `${p.kr} ${p.en}`).join(' ').toLowerCase();
  for (const overclaim of ['매너온도', 'verified member', 'trust score', '평점', '신원 확인']) {
    assert.ok(!text.includes(overclaim), `a promise claims "${overclaim}", which nothing backs`);
  }
});
