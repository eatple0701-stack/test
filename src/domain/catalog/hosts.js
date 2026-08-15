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
 * What this host said they would do, short enough for a card.
 *
 * 신보람 교수님's heaviest note on the plan was that splitting a dish nobody
 * can order alone is "실용적인 여행 앱일 뿐, 공공외교성은 잘 드러나지 않는다",
 * with the direction: 「"무엇을 하느냐"보다 "어떻게 하느냐"」.
 *
 * The 어떻게 has been in the data since 8/2 — these four guides, ticked by the
 * host themselves — and it rendered one screen too deep. The list card carried
 * 호스트 테이블, which is a category, and the detail page carried 문화 가이드,
 * which is the answer. Somebody scanning a list to choose an evening never saw
 * the difference between a host who will walk them through ordering and a
 * table that splits a bill.
 *
 * Deliberately not a slogan. HANDOFF records that a public-diplomacy line at
 * the front door "read as decoration there", which is the correct reading: the
 * app claiming cultural exchange is a claim. This is not a claim — it is the
 * host's own commitment, ticked by them, and the label 호스트 테이블 is
 * derived from the same array, so a table cannot show the badge and an empty
 * promise.
 *
 * Returns null rather than an empty string for a table with no guides, so a
 * 테이블 메이트 card renders nothing at all instead of an apology.
 */
export function guideSummary(table) {
  const ticked = new Set(table?.guides ?? []);
  // Catalogue order, not the order the host happened to tick them in — which
  // is what the column stores and what read as scrambled on the card:
  // "Table manners · Where the dish comes from · How it is eaten · How to
  // order". GUIDES is already in the order an evening happens: you order, it
  // arrives, you eat it, and somewhere in there somebody says where it comes
  // from. Reading it in that order is the difference between a list and a
  // sentence.
  const offered = GUIDES.filter(g => ticked.has(g.id));
  if (offered.length === 0) return null;
  return {
    guides: offered,
    // English carries the meaning because the person choosing cannot read
    // Korean yet — that is the whole premise of the product. The Korean names
    // are on the detail page beside these, where there is room for both.
    en: offered.map(g => g.en).join(' · '),
    kr: offered.map(g => g.kr).join(' · '),
  };
}

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
    es: 'Mesa con anfitrión',
    fr: 'Table avec hôte',
    ar: 'مائدة بمضيف',
    zh: '有主人的饭桌',
    ja: 'ホストのいる食卓',
    blurb: 'The host walks the table through it.',
    // The professor's review, answered in one sentence where a guest is
    // actually deciding whether to choose this table over a 테이블 메이트
    // one. Not a slogan for the front door — the front door already tried
    // that and the professor's note was that it read as decoration there.
    // This is the specific claim the exchange rests on: a Korean host,
    // teaching their own food, in the guest's language.
    why: 'A Korean host explaining their own food, in your language — this is the exchange the app exists for.',
  },
  [TABLE_KIND.MATES]: {
    kr: '테이블 메이트',
    en: 'Table mates',
    es: 'Compañeros de mesa',
    fr: 'Compagnons de table',
    ar: 'رفاق مائدة',
    zh: '同桌的人',
    ja: 'テーブルメイト',
    blurb: 'Everyone works it out together.',
  },
};

export const tableKind = (table) =>
  cleanGuides(table?.guides).length > 0 ? TABLE_KIND.HOSTED : TABLE_KIND.MATES;

export const tableKindLabel = (table) => TABLE_KIND_LABEL[tableKind(table)];

/** Only ids this catalog knows. Anything else is dropped rather than shown. */
export const cleanGuides = (ids) =>
  Array.isArray(ids) ? ids.filter(id => GUIDES.some(g => g.id === id)) : [];
