// 문화 퀴즈 — the icebreaker at the table.
//
// The plan asks for OX questions about the food as 아이스브레이킹, and gives
// its own example: "비빔밥은 원래 전주에서 시작되었다. (O/X)". That example is
// in here, and the answer is X — which is the whole reason this file needs a
// note at the top.
//
// A quiz asserts. Every question below teaches a foreigner something about
// Korea and gets remembered, so a wrong one does more damage than a missing
// one. Two rules follow:
//
// 1. Nothing contested. 감자탕's name is a good example of what is excluded:
//    there is a real argument about whether 감자 means the potato or a cut of
//    pork spine, and a quiz has no room for "it depends". The dish is still
//    here, asked about something settled instead.
//
// 2. The reveal is the point, not the score. Nobody learns anything from
//    being right; they learn from the sentence after. The interface keeps the
//    score quiet for the same reason — this is a thing to read aloud at a
//    table, not a test to win.

/**
 * `menuId` ties a question to a dish so the table you are actually sitting at
 * asks first. `null` means it belongs to the general pool.
 */
export const quiz = [
  // ---- Tied to a dish -----------------------------------------------------
  {
    id: 'samgyeopsal-name',
    menuId: 'samgyeopsal',
    prompt: 'Samgyeopsal literally means "three-layer meat".',
    answer: true,
    reveal:
      '삼 (three) 겹 (layer) 살 (flesh). The name describes the banded fat and meat you can see in the raw slice before it hits the grill.',
  },
  {
    id: 'budae-origin',
    menuId: 'budae-jjigae',
    prompt: 'Budae jjigae was invented using surplus food from American army bases after the Korean War.',
    answer: true,
    reveal:
      '부대 means "military unit". Spam, hot dogs and baked beans came out of the bases around Uijeongbu and went into a Korean broth. A dish assembled out of scarcity is now ordered by choice.',
  },
  {
    id: 'bossam-kimjang',
    menuId: 'bossam',
    prompt: 'Bossam is traditionally eaten on the day a family makes its winter kimchi.',
    answer: true,
    reveal:
      'That day is 김장, and UNESCO lists it as intangible cultural heritage. The pork is what everyone eats standing up, wrapped in a fresh leaf, while the work is still going on.',
  },
  {
    id: 'gejang-nickname',
    menuId: 'ganjang-gejang',
    prompt: 'Ganjang gejang is nicknamed "the rice thief".',
    answer: true,
    reveal:
      '밥도둑 — it steals your rice. The salt in the soy-cured crab makes you eat far more rice than you meant to, and the last step is mixing rice into the empty shell.',
  },
  {
    id: 'jokbal-what',
    menuId: 'jokbal',
    prompt: 'Jokbal is made from pig trotters.',
    answer: true,
    reveal:
      '족 (foot) 발 (foot again, in plain Korean). Braised in soy, cinnamon and ginger until the skin turns to gelatin. The Jangchung-dong alley that made it famous was built by families displaced by the war.',
  },
  {
    id: 'dakgalbi-chuncheon',
    menuId: 'dakgalbi',
    prompt: 'Dakgalbi comes from Chuncheon, not Seoul.',
    answer: true,
    reveal:
      'Chuncheon in the 1960s, where it was cheap enough that students called it 대학생 갈비 — student ribs.',
  },
  {
    id: 'gamjatang-haejang',
    menuId: 'gamjatang',
    prompt: 'Gamjatang is often eaten the morning after drinking.',
    answer: true,
    reveal:
      '해장 is its own recognised category of food here — what you eat to undo last night. Gamjatang, with its long-simmered broth, is one of the classics.',
  },
  {
    id: 'gopchang-what',
    menuId: 'gopchang',
    prompt: 'Gopchang is a cut of grilled intestine.',
    answer: true,
    reveal:
      'Offal was poverty food within living memory and is now among the more expensive things on a Korean grill — a change most people eating it can remember happening.',
  },
  {
    id: 'hanjeongsik-count',
    menuId: 'hanjeongsik',
    prompt: 'A traditional Korean table was counted in sets of three, five, seven or nine dishes.',
    answer: true,
    reveal:
      'The 반상 system. The number of 첩 — side dishes beyond the rice and soup — marked the household, and only the royal table went to twelve.',
  },
  {
    id: 'baekban-refill',
    menuId: 'baekban',
    prompt: 'At a baekban restaurant you pay extra for more side dishes.',
    answer: false,
    reveal:
      'Refills are free and expected. Asking for more kimchi is closer to a compliment than an imposition — the banchan belong to the table, not to your plate.',
  },

  // ---- The general pool ---------------------------------------------------
  // Table manners, which is where a foreign guest is most likely to be quietly
  // unsure and least likely to ask.
  {
    id: 'bibimbap-jeonju',
    menuId: null,
    // The plan's own example question. Its answer is not the obvious one, and
    // saying so is better curation than repeating a tidy claim.
    prompt: 'Bibimbap originally started in Jeonju.',
    answer: false,
    reveal:
      'Jeonju bibimbap is the famous regional version, not the origin. The dish is older than that attribution and where it began is genuinely argued over — ancestral-rite food and royal-court leftovers are both proposed. "Jeonju made it famous" is the safe sentence.',
  },
  {
    id: 'rice-bowl',
    menuId: null,
    prompt: 'You should lift your rice bowl off the table while eating, as in Japan.',
    answer: false,
    reveal:
      'The opposite. In Korea the bowl stays on the table and the spoon goes to you. Lifting it reads as slightly childish — one of the clearest places Korean and Japanese table manners diverge.',
  },
  {
    id: 'pouring',
    menuId: null,
    prompt: 'It is normal to fill your own glass first.',
    answer: false,
    reveal:
      'You pour for the people around you and somebody pours for you. An empty glass in front of a guest is the host noticing too slowly — which is why the bottle moves around the table all evening.',
  },
  {
    id: 'turn-away',
    menuId: null,
    prompt: 'When drinking beside someone much older, you turn your head away from them.',
    answer: true,
    reveal:
      'And hold the glass with two hands when they pour. Both are small deferences, and a foreign guest doing either one is usually met with delight rather than indifference.',
  },
  {
    id: 'kimchi-red',
    menuId: null,
    prompt: 'All kimchi is red and spicy.',
    answer: false,
    reveal:
      '백김치 has no chilli at all, and 동치미 is a cold watery radish kimchi eaten in winter. Chilli only reached Korea in the 16th century — kimchi is older than the colour everyone associates with it.',
  },
];

/** Questions for this dish first, then the general pool. */
export function quizFor(menuId) {
  const mine = menuId ? quiz.filter(q => q.menuId === menuId) : [];
  const general = quiz.filter(q => q.menuId === null);
  return [...mine, ...general];
}
