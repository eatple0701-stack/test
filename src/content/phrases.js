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

  // Dietary.
  //
  // `restriction` ties a sentence to the box a traveller ticks in the Profile,
  // and three of the five boxes had no sentence at all. The app would warn
  // somebody who avoids beef that a table conflicted, and then hand them no
  // way to say so to a waiter — answering the question it had invented and
  // not the one they actually had to ask. The link is a field rather than a
  // string match so a test can hold the two lists together.
  {
    id: 'no-pork',
    group: PHRASE_GROUP.DIETARY,
    restriction: 'pork',
    en: 'I cannot eat pork.',
    ko: '돼지고기를 못 먹어요.',
    read: 'dwae-ji-go-gi-reul mot mo-go-yo',
  },
  {
    id: 'no-beef',
    group: PHRASE_GROUP.DIETARY,
    restriction: 'beef',
    en: 'I cannot eat beef.',
    ko: '소고기를 못 먹어요.',
    read: 'so-go-gi-reul mot mo-go-yo',
  },
  {
    id: 'no-chicken',
    group: PHRASE_GROUP.DIETARY,
    restriction: 'chicken',
    en: 'I cannot eat chicken.',
    ko: '닭고기를 못 먹어요.',
    read: 'dak-go-gi-reul mot mo-go-yo',
  },
  {
    id: 'no-fish',
    group: PHRASE_GROUP.DIETARY,
    restriction: 'fish',
    en: 'I cannot eat fish.',
    ko: '생선을 못 먹어요.',
    read: 'saeng-son-eul mot mo-go-yo',
    // No note here on purpose. The anchovy-stock warning already sits on
    // 육수에 고기가 들어가나요, three cards away in this same tab, and saying it
    // twice in one list is noise rather than emphasis.
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
    restriction: 'shellfish',
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
 * Conversation openers for the table itself — the plan's 문화교류 질문 카드.
 *
 * Two things were wrong with the first version of this list, and both came
 * from writing it in English for an English reader.
 *
 * It had no Korean. Every other card in this sheet is built around one idea,
 * stated at the top of PhraseSheet: turning the phone around is the fastest
 * way through a language gap. That is exactly what a conversation card is
 * for, and these were the only cards in the sheet a Korean host could not
 * read. The one you most want to hand across the table was the one you could
 * not.
 *
 * And it claimed to be two-way while three of six only pointed one way —
 * "before you came", "at home", "about eating here". A Korean host has no
 * answer to any of those, so the visitor gets interviewed and the exchange
 * the plan asked for does not happen. Now the ones that genuinely work both
 * ways say so, and the ones that do not are labelled by who can answer,
 * paired so the deck keeps turning back.
 *
 * `who` is phrased as where somebody grew up rather than what passport they
 * hold. It is the thing the question actually depends on, and it keeps the
 * app from deciding who counts as Korean.
 */
export const ASK_WHO = {
  ANYONE: 'anyone',
  VISITOR: 'visitor',
  LOCAL: 'local',
};

export const ASK_WHO_LABEL = {
  [ASK_WHO.ANYONE]: { ko: '누구나', en: 'anyone' },
  [ASK_WHO.VISITOR]: { ko: '처음 온 사람에게', en: 'for whoever is visiting' },
  [ASK_WHO.LOCAL]: { ko: '여기서 자란 사람에게', en: 'for whoever grew up here' },
};

export const tableQuestions = [
  {
    id: 'grew-up',
    who: ASK_WHO.ANYONE,
    en: 'What did you eat growing up that no restaurant gets right?',
    ko: '어릴 때 먹던 것 중에 식당에서는 그 맛이 안 나는 음식이 있어요?',
  },
  {
    id: 'one-dish',
    who: ASK_WHO.ANYONE,
    en: 'What is the one dish from where you are from that you would put on this table?',
    ko: '고향 음식 중에 이 상에 하나 올린다면 뭘 올리고 싶어요?',
  },
  {
    id: 'warned',
    who: ASK_WHO.ANYONE,
    en: 'Is there a dish somebody warned you about before you first tried it?',
    ko: '처음 먹기 전에 누가 겁준 음식이 있어요?',
  },
  {
    id: 'certain-people',
    who: ASK_WHO.ANYONE,
    en: 'Is there a meal you only eat with certain people?',
    ko: '특정한 사람하고만 먹게 되는 음식이 있어요?',
  },
  {
    id: 'alone-hard',
    who: ASK_WHO.ANYONE,
    en: 'What food from your country is hard to eat alone?',
    ko: '그 나라 음식 중에 혼자 먹기 어려운 건 뭐예요?',
  },
  {
    id: 'learned-late',
    who: ASK_WHO.ANYONE,
    en: 'What food did you dislike as a child and eat happily now?',
    ko: '어릴 땐 싫어했는데 지금은 잘 먹는 음식이 있어요?',
  },

  // One-sided, and paired — each of these has a counterpart aimed the other
  // way, so a table working through the deck keeps handing the question back.
  {
    id: 'expected',
    who: ASK_WHO.VISITOR,
    en: 'What did you expect about eating in Korea that turned out wrong?',
    ko: '한국에서 밥 먹는 게 생각했던 거랑 뭐가 달랐어요?',
  },
  {
    id: 'thought-it-was',
    who: ASK_WHO.VISITOR,
    en: 'What do people where you grew up think Korean food is?',
    ko: '그쪽 사람들은 한식이 어떤 음식이라고 생각해요?',
  },
  {
    id: 'still-strange',
    who: ASK_WHO.VISITOR,
    en: 'Is there anything on this table you still find strange?',
    ko: '이 상에서 아직 낯선 게 있어요?',
  },
  {
    id: 'get-wrong',
    who: ASK_WHO.LOCAL,
    en: 'What do visitors most often get wrong about Korean food?',
    ko: '외국인들이 한식에 대해 제일 많이 오해하는 게 뭐예요?',
  },
  {
    id: 'one-day',
    who: ASK_WHO.LOCAL,
    en: 'If somebody had one day here, what would you feed them?',
    ko: '딱 하루 있는 사람한테 뭘 먹이고 싶어요?',
  },
  {
    id: 'had-to-learn',
    who: ASK_WHO.LOCAL,
    en: 'Was there a rule at the table you had to learn as a child?',
    ko: '어릴 때 식탁에서 배워야 했던 규칙이 있었어요?',
  },
];

/**
 * Openers tied to the dish actually in front of everybody.
 *
 * A question about *this* pot lands harder than a general one, and the app
 * already knows what was ordered. These ask about experience rather than
 * fact, so none of them asserts anything the catalog would have to source.
 */
export const dishQuestions = {
  samgyeopsal: [
    {
      id: 'sam-scissors',
      who: ASK_WHO.ANYONE,
      en: 'Who was the person who always cut the meat, growing up?',
      ko: '어릴 때 고기 자르는 건 항상 누구 담당이었어요?',
    },
  ],
  gamjatang: [
    {
      id: 'gam-hangover',
      who: ASK_WHO.ANYONE,
      en: 'What do people eat where you are from after a long night?',
      ko: '그쪽에서는 늦게까지 논 다음 날 뭘 먹어요?',
    },
  ],
  bossam: [
    {
      id: 'bos-wrap',
      who: ASK_WHO.ANYONE,
      en: 'Is there a food you eat with your hands at home that you would not in public?',
      ko: '집에서는 손으로 먹는데 밖에서는 안 그러는 음식이 있어요?',
    },
  ],
  gopchang: [
    {
      id: 'gop-first',
      who: ASK_WHO.ANYONE,
      en: 'What went through your head the first time you saw this?',
      ko: '이거 처음 봤을 때 무슨 생각 들었어요?',
    },
  ],
  hanjeongsik: [
    {
      id: 'han-many',
      who: ASK_WHO.ANYONE,
      en: 'Which of these would you go back for?',
      ko: '이 중에 다시 먹으러 올 만한 건 뭐예요?',
    },
  ],
  baekban: [
    {
      id: 'bae-home',
      who: ASK_WHO.ANYONE,
      en: 'What does a plain weekday dinner look like where you grew up?',
      ko: '자란 곳에서 평일 저녁 밥상은 보통 어땠어요?',
    },
  ],
};

/** The dish's own openers first, then the general deck. */
export const questionsFor = (menuId) => [
  ...(dishQuestions[menuId] ?? []),
  ...tableQuestions,
];

export const phrasesInGroup = (group) => phrases.filter(p => p.group === group);

/**
 * The group, with this traveller's own rules lifted to the top.
 *
 * The plan asks for 개인 조건에 적합한 한식 메뉴 우선 제시, and the same logic
 * belongs on the phrases: somebody who ticked "no pork" should not have to
 * scroll past four sentences that are not theirs while a waiter waits. Only
 * the order changes — nothing is hidden, because a traveller may need to say
 * something they never declared, and a phrasebook that quietly shortened
 * itself would be worse than one that is merely long.
 */
export function phrasesFor(group, avoids = []) {
  const inGroup = phrasesInGroup(group);
  if (!Array.isArray(avoids) || avoids.length === 0) return inGroup;
  const mine = (p) => (p.restriction && avoids.includes(p.restriction) ? 0 : 1);
  return inGroup.slice().sort((a, b) => mine(a) - mine(b));
}
