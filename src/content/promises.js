// What this app guarantees, and the file that guarantees it.
//
// Written after reading 당근 모임 on 2026-08-04. Every group description
// there is a hand-typed list of rules — "모임의 비용은 무조건 1/n", "가입후
// 한달안에 벙참여", "일정기간 미활동시 추방", "벙 중간에 가거나 늦참
// 예외없이 1/n" — because the platform gives the organiser no structure, so
// the organiser writes the structure in prose. Prose cannot enforce itself.
//
// Every one of those is a *feature* here. That is the strongest sentence
// this product has and it appeared nowhere on the screen, which is the
// 교수님's "무엇을 하느냐보다 어떻게 하느냐" landing exactly where it was
// aimed: the mechanism is the public-diplomacy content, not decoration
// around it.
//
// `backedBy` is not documentation. A promise on the landing page is a claim
// to a stranger, and this repository's rule is that claims are checked — so
// each line names the module that makes it true, and a test asserts that
// module exists. Delete the enforcement and the promise fails the suite
// rather than quietly becoming marketing.

export const PROMISES = [
  {
    id: 'approval',
    kr: '호스트가 이름을 보고 승인합니다',
    en: 'The host reads who you are and says yes to you, by name. No table fills itself.',
    backedBy: 'src/domain/policy/seatRequest.js',
  },
  {
    id: 'lapse',
    kr: '답이 없으면 식사 12시간 전에 자리가 풀립니다',
    en: 'An unanswered request releases its seat 12 hours before the meal, so nobody holds a chair by forgetting.',
    backedBy: 'src/domain/policy/seatRequest.js',
  },
  {
    id: 'attendance',
    kr: '오지 않은 사람은 기록에 남습니다',
    en: 'A no-show is recorded — not as a score, but so the record stops calling somebody a person you met.',
    backedBy: 'src/domain/policy/attendance.js',
  },
  {
    id: 'diet',
    kr: '못 먹는 것은 자리를 요청할 때 미리 전달됩니다',
    en: 'What you cannot eat travels with your seat request. Halal, vegan, an allergy — the host reads it before choosing the shop.',
    backedBy: 'src/data/profile.js',
  },
  {
    id: 'safety',
    kr: '언제든 신고하고 차단할 수 있습니다',
    en: 'Report a table to the team, or block somebody so you never share a table again. Neither tells the other person.',
    backedBy: 'src/domain/policy/report.js',
  },
];

/** The line above the list. Says why the list is worth reading. */
export const PROMISES_LEAD = {
  kr: '밥친구가 다른 이유',
  // The heading in English. `en` below is the sentence under it, not a
  // translation of the heading — without this the block lost its title
  // entirely on an English-only screen and became a floating paragraph.
  titleEn: 'What makes Eatple different',
  en: 'Other apps leave these to a paragraph the organiser types out and nobody enforces. Here they are how the app works.',
};
