// What to say at the table.
//
// The plan calls the thing this removes the 진입장벽 — the barrier that stops
// a traveller ordering food they actually want. It is rarely the price and
// rarely the menu. It is not knowing how to ask whether there is meat in the
// broth, and not wanting to hold up a busy room while working it out.
//
// So these are not phrasebook filler. Every line is one a person actually
// needs mid-meal and cannot mime: an allergy, a dietary rule, how many people
// a dish feeds. The four the business plan names are all here.
//
// `ko` is what the phone says out loud. `read` is how to say it yourself —
// written for an English speaker reading aloud, not IPA and not Revised
// Romanization, because neither helps somebody who has thirty seconds and a
// waiter standing there.

export const PHRASE_GROUP = {
  ORDER: 'order',
  DIETARY: 'dietary',
  TABLE: 'table',
  TALK: 'talk',
};

export const GROUP_LABEL = {
  [PHRASE_GROUP.ORDER]: { en: 'Ordering', ko: '주문할 때' },
  [PHRASE_GROUP.DIETARY]: { en: 'What you cannot eat', ko: '못 먹는 것' },
  [PHRASE_GROUP.TABLE]: { en: 'During the meal', ko: '식사 중' },
  [PHRASE_GROUP.TALK]: { en: 'Talking to the table', ko: '대화' },
};

export const phrases = [
  // The four named in the business plan.
  {
    id: 'less-spicy',
    group: PHRASE_GROUP.ORDER,
    en: 'Could you make it less spicy?',
    ko: '덜 맵게 해주세요.',
    read: 'dol MEP-ge hae-ju-se-yo',
  },
  {
    id: 'meat-in-broth',
    group: PHRASE_GROUP.DIETARY,
    en: 'Is there meat in the broth?',
    ko: '육수에 고기가 들어가나요?',
    read: 'YUK-su-e go-gi-ga deu-ro-ga-na-yo',
    // Worth knowing rather than guessing: a dish with no visible meat can
    // still be built on an anchovy or beef stock.
    note: 'Most Korean soup bases are made from anchovy or beef, even when nothing on the plate looks like meat.',
  },
  {
    id: 'how-many-people',
    group: PHRASE_GROUP.ORDER,
    en: 'How many people is this for?',
    ko: '이 음식은 몇 명이 먹을 수 있나요?',
    read: 'i EUM-shik-eun myeot-myeong-i mo-geul su it-na-yo',
  },
  {
    id: 'allergy',
    group: PHRASE_GROUP.DIETARY,
    en: 'Does this contain anything I might be allergic to?',
    ko: '알레르기가 있는 재료가 들어가나요?',
    read: 'al-le-reu-gi-ga it-neun jae-ryo-ga deu-ro-ga-na-yo',
  },

  // Ordering
  {
    id: 'one-portion',
    group: PHRASE_GROUP.ORDER,
    en: 'Can I order one portion?',
    ko: '1인분도 주문할 수 있나요?',
    read: 'i-RIN-bun-do ju-mun-hal su it-na-yo',
    note: 'Worth asking. Some places will do it on a quiet weekday even when the menu says two.',
  },
  {
    id: 'recommend',
    group: PHRASE_GROUP.ORDER,
    en: 'What do you recommend?',
    ko: '뭐가 맛있어요?',
    read: 'MWO-ga ma-shi-sso-yo',
  },
  {
    id: 'same-again',
    group: PHRASE_GROUP.ORDER,
    en: 'One more of these, please.',
    ko: '이거 하나 더 주세요.',
    read: 'i-go ha-na do ju-se-yo',
  },

  // Dietary
  {
    id: 'no-pork',
    group: PHRASE_GROUP.DIETARY,
    en: 'I cannot eat pork.',
    ko: '돼지고기를 못 먹어요.',
    read: 'dwae-ji-go-gi-reul mot mo-go-yo',
  },
  {
    id: 'no-meat',
    group: PHRASE_GROUP.DIETARY,
    en: 'I do not eat meat at all.',
    ko: '고기를 전혀 안 먹어요.',
    read: 'go-gi-reul jon-hyo an mo-go-yo',
  },
  {
    id: 'no-seafood',
    group: PHRASE_GROUP.DIETARY,
    en: 'I am allergic to shellfish.',
    ko: '갑각류 알레르기가 있어요.',
    read: 'gap-gang-nyu al-le-reu-gi-ga i-sso-yo',
  },

  // During the meal
  {
    id: 'how-to-eat',
    group: PHRASE_GROUP.TABLE,
    en: 'How do I eat this?',
    ko: '이거 어떻게 먹어요?',
    read: 'i-go o-tto-ke mo-go-yo',
    note: 'A good question, not an embarrassing one. Most Koreans enjoy being asked.',
  },
  {
    id: 'delicious',
    group: PHRASE_GROUP.TABLE,
    en: 'This is delicious.',
    ko: '진짜 맛있어요.',
    read: 'jin-jja ma-shi-sso-yo',
  },
  {
    id: 'water',
    group: PHRASE_GROUP.TABLE,
    en: 'Could I have some water?',
    ko: '물 좀 주세요.',
    read: 'mul jom ju-se-yo',
  },
  {
    id: 'full',
    group: PHRASE_GROUP.TABLE,
    en: 'I am full, thank you.',
    ko: '배불러요. 잘 먹었습니다.',
    read: 'bae-bul-lo-yo. jal mo-go-sseum-ni-da',
    note: '잘 먹었습니다 is said at the end of a meal to whoever fed you. It closes the table.',
  },
  {
    id: 'separate-bill',
    group: PHRASE_GROUP.TABLE,
    en: 'Can we pay separately?',
    ko: '따로 계산할 수 있나요?',
    read: 'tta-ro gye-san-hal su it-na-yo',
  },
];

/**
 * Conversation openers for the table itself.
 *
 * The plan asks for 문화교류 질문 카드 — a way past the first silence. These
 * are two-way on purpose: each one a foreign guest and a Korean host can both
 * answer, because a card that only interrogates the visitor makes the meal an
 * interview rather than an exchange.
 */
export const tableQuestions = [
  'What did you eat growing up that no restaurant gets right?',
  'What is the one dish from your country you would put on this table?',
  'Is there a food here you were warned about before you came?',
  'What do people at home think Korean food is?',
  'What is a meal you only eat with certain people?',
  'What did you expect about eating here that turned out wrong?',
];

export const phrasesInGroup = (group) => phrases.filter(p => p.group === group);
