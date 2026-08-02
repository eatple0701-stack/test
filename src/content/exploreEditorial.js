// Editorial copy for Explore — the questions that open each culture.
//
// This is presentation content, not domain data. It lives outside src/domain
// on purpose: the catalog describes what a Theme *is*, and this describes how
// a Theme is *introduced* to someone who has never heard of it. Changing a
// question changes a cover line, not a rule.
//
// Two constraints on every question here:
//
// 1. It must be answered by the Theme's own narrative, which is already in the
//    catalog. Nothing below asserts a fact the app does not already hold — a
//    question is a claim that an answer exists, and an unanswerable one is the
//    same fabrication as an invented statistic.
//
// 2. It must be a real question. The temptation is to write a headline that
//    only sounds like curiosity ("Discover the secrets of temple food"). A
//    question you cannot answer without opening the culture is what stops a
//    scroll; a headline is what people scroll past.
//
// `word` is the Korean the card is built around. It is set enormous and
// cropped by the card edge — the artwork of this feed is Hangul, because this
// product has no photography and a placeholder illustration repeated across
// four cultures would say less than one honest word does.

export const EDITORIAL = {
  'temple-life': {
    question: 'Why does a monk leave nothing on the plate?',
    word: '사찰음식',
  },
  'street-food': {
    question: 'What does a city eat before it builds dining rooms?',
    word: '시장',
  },
  'noodle-road': {
    question: 'Which Korean dish is Chinese in name only?',
    word: '짜장면',
  },
  'cafe-hopping': {
    question: 'Why will nobody ask you to leave after one cup?',
    word: '한 잔',
  },
  'seoul-after-dark': {
    question: 'Why is the second round a different conversation?',
    word: '이차',
  },
  'busan-seafood': {
    question: 'Why wrap the fish instead of dipping it?',
    word: '자갈치',
  },
  'spring-picnic': {
    question: 'What does a country do with two weeks of blossom?',
    word: '벚꽃',
  },
};

/**
 * The editorial dressing for a theme, or null where none is authored.
 *
 * Returns null rather than inventing a question, so a theme added to the
 * catalog tomorrow renders as a plain card instead of a card with a hole in
 * it — and the missing question is visible to whoever adds the theme.
 */
export const editorialFor = (themeId) => EDITORIAL[themeId] ?? null;
