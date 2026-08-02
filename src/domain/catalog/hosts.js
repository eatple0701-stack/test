// Hosts — the half of this product that makes it public diplomacy.
//
// The business plan does not describe a host as somebody who books a table.
// It describes 문화 큐레이터: a vetted Korean user who, on the night, walks
// the table through 메뉴 추천과 식사 방법, 예절. The app had the first part and
// none of the second — a host typed a dish, a date and a place, and that was
// the entire role. That is a group-booking utility. The guiding is the thing
// that turns a stranger's dinner into an exchange, and it was missing.
//
// Two separate ideas live here and must not be confused:
//
//   VERIFICATION is a credential. It says a person was checked by the team
//   before the pilot. No screen and no client write can set it — see the note
//   on hostVerified in tableRepository and the RLS policy in schema.sql. An
//   unverified host gets no badge at all rather than a lesser one, because a
//   scale of trust invites reading the bottom of it as "checked, and poor".
//
//   GUIDING is a promise. It says what this host intends to explain tonight.
//   Anybody may make it, including a traveller hosting other travellers, and
//   it is shown as their own words rather than as an endorsement.

/**
 * Who the plan expects to be vetted, in its own words.
 *
 * Kept as data rather than free text so a badge cannot be invented by typing
 * one, and so the pilot's verification list has a fixed vocabulary to fill.
 */
export const HOST_KIND = {
  CLUB_FOOD: 'club-food',
  CLUB_EXCHANGE: 'club-exchange',
  STUDENT_FOOD: 'student-food',
  CREATOR: 'creator',
};

export const HOST_KIND_LABEL = {
  [HOST_KIND.CLUB_FOOD]: { kr: '미식 동아리', en: 'Food society' },
  [HOST_KIND.CLUB_EXCHANGE]: { kr: '국제교류 동아리', en: 'Student exchange society' },
  [HOST_KIND.STUDENT_FOOD]: { kr: '한식 전공', en: 'Studies Korean food' },
  [HOST_KIND.CREATOR]: { kr: '로컬 푸드 크리에이터', en: 'Local food creator' },
};

export const hostKindLabel = (kind) => HOST_KIND_LABEL[kind] ?? null;

/**
 * The four things a host can offer to walk the table through, taken from the
 * plan's list — 식사 예절, 음식 유래, 주문 방법, 먹는 방법.
 *
 * Deliberately four and not a free-text box. A traveller scanning tables
 * needs to compare them, and "I'll explain stuff" does not compare. It also
 * means the guest screen can render the promise in the guest's language
 * rather than the host's.
 */
export const GUIDES = [
  {
    id: 'order',
    kr: '주문 방법',
    en: 'How to order',
    hostAsk: 'I will order for the table and explain what I am asking for.',
  },
  {
    id: 'eat',
    kr: '먹는 방법',
    en: 'How it is eaten',
    hostAsk: 'I will show how this one is put together and eaten.',
  },
  {
    id: 'manners',
    kr: '식사 예절',
    en: 'Table manners',
    hostAsk: 'I will explain the table customs as they come up.',
  },
  {
    id: 'origin',
    kr: '음식 유래',
    en: 'Where the dish comes from',
    hostAsk: 'I will tell you where this dish comes from and when Koreans eat it.',
  },
];

export const guideById = (id) => GUIDES.find(g => g.id === id) ?? null;

/**
 * The two shapes of table the 8/2 meeting separated.
 *
 *   호스트 테이블 — a host gathering foreigners around a dish and walking them
 *   through it. This is where the public diplomacy actually happens; the
 *   professor's note is that without it the product is a useful travel app
 *   and not much else, and that the answer is in 어떻게 rather than 무엇.
 *
 *   테이블 메이트 — people splitting a dish none of them could order alone.
 *   Not a lesser table. A traveller who does not want to be taught anything
 *   tonight is a real traveller, and 삼겹살 for four is the product working.
 *
 * Derived from the guides a host actually promised rather than declared in a
 * field of its own. Two reasons. A label nobody has to earn gets claimed by
 * everybody and then means nothing — the same reasoning that keeps the
 * verification badge out of the client. And the host has already answered
 * this question by ticking boxes; asking it twice would be the form arguing
 * with itself about what those ticks meant.
 */
export const TABLE_KIND = {
  HOSTED: 'hosted',
  MATES: 'mates',
};

export const TABLE_KIND_LABEL = {
  [TABLE_KIND.HOSTED]: {
    kr: '호스트 테이블',
    en: 'Hosted table',
    blurb: 'The host walks the table through it.',
  },
  [TABLE_KIND.MATES]: {
    kr: '테이블 메이트',
    en: 'Table mates',
    blurb: 'Everyone works it out together.',
  },
};

export const tableKind = (table) =>
  cleanGuides(table?.guides).length > 0 ? TABLE_KIND.HOSTED : TABLE_KIND.MATES;

export const tableKindLabel = (table) => TABLE_KIND_LABEL[tableKind(table)];

/** Only ids this catalog knows. Anything else is dropped rather than shown. */
export const cleanGuides = (ids) =>
  Array.isArray(ids) ? ids.filter(id => GUIDES.some(g => g.id === id)) : [];
