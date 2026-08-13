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

// `questionKo` is the same question, not a different one. The two constraints
// above apply to it identically — it has to be answerable from the theme's
// own narrative, and it has to be a question rather than a headline dressed
// as one. A translation that quietly promises more than the English does
// would break the first rule while looking like housekeeping.

export const EDITORIAL = {
  'temple-life': {
    question: 'Why does a monk leave nothing on the plate?',
    questionKo: '스님은 왜 그릇에 아무것도 남기지 않을까요?',
    questionEs: '¿Por qué un monje no deja nada en el plato?',
    word: '사찰음식',
  },
  'street-food': {
    question: 'What does a city eat before it builds dining rooms?',
    questionKo: '식당이 생기기 전, 도시는 무엇을 먹었을까요?',
    questionEs: '¿Qué come una ciudad antes de construir comedores?',
    word: '시장',
  },
  'noodle-road': {
    question: 'Which Korean dish is Chinese in name only?',
    questionKo: '이름만 중국인 한국 음식은 무엇일까요?',
    questionEs: '¿Qué plato coreano solo es chino en el nombre?',
    word: '짜장면',
  },
  'cafe-hopping': {
    question: 'Why will nobody ask you to leave after one cup?',
    questionKo: '한 잔만 시켜도 왜 아무도 나가라고 하지 않을까요?',
    questionEs: '¿Por qué nadie te pedirá que te vayas tras una sola taza?',
    word: '한 잔',
  },
  'seoul-after-dark': {
    question: 'Why is the second round a different conversation?',
    questionKo: '2차의 대화는 왜 1차와 다를까요?',
    questionEs: '¿Por qué la segunda ronda es otra conversación?',
    word: '이차',
  },
  'busan-seafood': {
    question: 'Why wrap the fish instead of dipping it?',
    questionKo: '회를 찍어 먹지 않고 왜 싸서 먹을까요?',
    questionEs: '¿Por qué se envuelve el pescado en vez de mojarlo?',
    word: '자갈치',
  },
  'spring-picnic': {
    question: 'What does a country do with two weeks of blossom?',
    questionKo: '두 주뿐인 벚꽃철에 온 나라는 무엇을 할까요?',
    questionEs: '¿Qué hace un país con dos semanas de flor de cerezo?',
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
