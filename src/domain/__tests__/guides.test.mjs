import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GUIDES, guideById, guideSummary, tableKind, TABLE_KIND, TABLE_KIND_LABEL,
} from '../catalog/hosts.js';

// 문화 가이드 — the 어떻게 in 신보람 교수님's note.
//
// The professor's heaviest line on the plan was that a dish-splitting app is
// "실용적인 여행 앱일 뿐, 공공외교성은 잘 드러나지 않는다", and the direction
// was 「"무엇을 하느냐"보다 "어떻게 하느냐"」. These four guides are the 어떻게,
// and they are the host's own words rather than the app's claim. The tests
// below hold the two properties that keeps true.

test('a hosted table says what the host will actually do', () => {
  const table = { guides: ['order', 'manners'] };
  const summary = guideSummary(table);
  assert.ok(summary, 'a table with guides produced no summary');
  assert.equal(summary.guides.length, 2);
  assert.equal(summary.en, 'How to order · Table manners');
  assert.equal(summary.kr, '주문 방법 · 식사 예절');
});

test('the summary and the badge cannot disagree', () => {
  // 호스트 테이블 is derived from the same array the summary reads, so a card
  // can never show the badge beside an empty promise — or a promise beside a
  // 테이블 메이트 badge. This is the property that keeps the framing honest:
  // the app is not asserting cultural exchange, it is reporting a tick.
  for (const guides of [[], ['order'], ['order', 'eat', 'manners', 'origin']]) {
    const table = { guides };
    const hosted = tableKind(table) === TABLE_KIND.HOSTED;
    const summary = guideSummary(table);
    assert.equal(hosted, summary !== null,
      `guides=${JSON.stringify(guides)}: badge says ${hosted}, summary says ${summary !== null}`);
  }
});

test('a table with no guides renders nothing rather than an apology', () => {
  // 테이블 메이트 is a real table on its own terms, not a lesser one — the
  // card must not print "no cultural guide offered" under it.
  assert.equal(guideSummary({ guides: [] }), null);
  assert.equal(guideSummary({}), null);
  assert.equal(guideSummary(null), null);
});

test('a guide id nobody knows is dropped, not printed', () => {
  const summary = guideSummary({ guides: ['order', 'invented-guide'] });
  assert.equal(summary.guides.length, 1);
  assert.ok(!summary.en.includes('invented'));
  // And a table whose *only* guide is unknown is not a hosted table.
  assert.equal(guideSummary({ guides: ['invented-guide'] }), null);
});

test('every guide carries both languages and a first-person promise', () => {
  for (const g of GUIDES) {
    assert.match(g.kr, /[가-힣]/, `${g.id} has no Korean`);
    assert.ok(g.en.trim().length > 0, `${g.id} has no English`);
    // hostAsk is what the host is agreeing to, in their voice — the reason
    // this is a commitment rather than a category.
    assert.match(g.hostAsk, /^I will /, `${g.id}'s promise is not in the host's voice`);
    assert.equal(guideById(g.id), g);
  }
});

test('the framing never claims more than a tick', () => {
  // The front door tried a public-diplomacy slogan once and HANDOFF records
  // that it "read as decoration". Nothing in this catalogue may make the claim
  // on the host's behalf — no "cultural ambassador", no "certified", no
  // vouching. What it may do is repeat what the host said they would do.
  const text = [
    ...GUIDES.flatMap(g => [g.kr, g.en, g.hostAsk]),
    TABLE_KIND_LABEL[TABLE_KIND.HOSTED].blurb,
  ].join(' ').toLowerCase();
  for (const overclaim of ['ambassador', 'certified', 'verified', 'expert', 'official', '공인', '전문가']) {
    assert.ok(!text.includes(overclaim), `the catalogue claims "${overclaim}"`);
  }
});

test('the guides read in the order the evening happens', () => {
  // The column stores whatever order the host ticked, and the card showed it
  // raw: "Table manners · Where the dish comes from · How it is eaten · How
  // to order". GUIDES is ordered as a meal is — order, eat, manners, origin —
  // so the line reads as a sentence rather than a set.
  const scrambled = guideSummary({ guides: ['manners', 'origin', 'eat', 'order'] });
  assert.equal(scrambled.en, 'How to order · How it is eaten · Table manners · Where the dish comes from');
  assert.deepEqual(scrambled.guides.map(g => g.id), ['order', 'eat', 'manners', 'origin']);

  // And the same array in any other order lands identically.
  const other = guideSummary({ guides: ['origin', 'order'] });
  assert.deepEqual(other.guides.map(g => g.id), ['order', 'origin']);
});

test('a duplicate tick is not printed twice', () => {
  const summary = guideSummary({ guides: ['order', 'order', 'eat'] });
  assert.equal(summary.guides.length, 2);
});
