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
import { isSourced, sourcesFor } from './sources.js';

export const quiz = [
  // ---- Tied to a dish -----------------------------------------------------
  {
    id: 'samgyeopsal-name',
    sources: ['encykorea-samgyeopsal'],
    menuId: 'samgyeopsal',
    prompt: 'Samgyeopsal literally means "three-layer meat".',
    answer: true,
    reveal:
      '삼 (three) 겹 (layer) 살 (flesh) — lean and fat banded together, which you can see in the raw slice before it hits the grill. Korean called it 세겹살 first, using the native word for three.',
  },
  {
    id: 'budae-origin',
    sources: ['encykorea-budae'],
    menuId: 'budae-jjigae',
    prompt: 'Budae jjigae was invented using surplus food from American army bases after the Korean War.',
    answer: true,
    reveal:
      '부대 means "military unit". Ham, sausage and bacon came out of the bases around Uijeongbu and went into a Korean broth. A dish assembled out of scarcity is now ordered by choice.',
  },
  {
    id: 'bossam-kimjang',
    sources: ['unesco-kimjang'],
    menuId: 'bossam',
    prompt: 'Bossam is traditionally eaten on the day a family makes its winter kimchi.',
    answer: true,
    reveal:
      'That day is 김장, and UNESCO lists it as intangible cultural heritage. The pork is what everyone eats standing up, wrapped in a fresh leaf, while the work is still going on.',
  },
  {
    id: 'gejang-nickname',
    sources: ['wikipedia-gejang-ko'],
    menuId: 'ganjang-gejang',
    prompt: 'Ganjang gejang is nicknamed "the rice thief".',
    answer: true,
    reveal:
      '밥도둑 — it steals your rice, meaning it is good enough to make you eat far more than you meant to. The last step is mixing rice into the empty shell.',
  },
  {
    id: 'jokbal-what',
    sources: ['encykorea-jokbal'],
    menuId: 'jokbal',
    prompt: 'Jokbal is made from pig trotters.',
    answer: true,
    reveal:
      '족 is the Sino-Korean word for foot and 발 is the plain Korean one, so the name says it twice. Boiled with garlic and ginger, then braised in soy until the skin turns to gelatin. The Jangchung-dong alley that made it famous was built by refugees from the North after the war.',
  },
  {
    id: 'dakgalbi-chuncheon',
    sources: ['encykorea-dakgalbi'],
    menuId: 'dakgalbi',
    prompt: 'Dakgalbi comes from Chuncheon, not Seoul.',
    answer: true,
    reveal:
      'Chuncheon, from the late 1960s. By the 1970s the back alleys were full of it and it was cheap enough that students called it 대학생갈비 — student ribs.',
  },
  {
    id: 'gamjatang-haejang',
    sources: ['wikipedia-gamjatang-ko', 'encykorea-haejangguk'],
    menuId: 'gamjatang',
    prompt: 'Gamjatang is often eaten the morning after drinking.',
    answer: true,
    reveal:
      '해장 is its own recognised category of food here — from 해정(解酲), undoing the drink. Gamjatang, with its long-simmered broth, is one of the ones people reach for.',
  },
  {
    id: 'gopchang-what',
    sources: ['wikipedia-gopchang-ko'],
    menuId: 'gopchang',
    prompt: 'Gopchang is a cut of grilled intestine.',
    answer: true,
    reveal:
      'The small intestine, of beef or pork. The 곱 inside it is the point — that is where the name comes from and what people order it for.',
  },
  {
    id: 'hanjeongsik-count',
    sources: ['encykorea-bansang', 'encykorea-surasang'],
    menuId: 'hanjeongsik',
    prompt: 'A traditional Korean table was counted in sets of three, five, seven or nine dishes.',
    answer: true,
    reveal:
      'The 반상 system, counted in 첩 — the side dishes beyond the rice, soup and kimchi, which are never counted. It ran from three to twelve, and the king’s 수라상 was set at twelve.',
  },
  {
    id: 'baekban-refill',
    sources: ['koreatimes-banchan'],
    menuId: 'baekban',
    prompt: 'At a baekban restaurant you pay extra for more side dishes.',
    answer: false,
    reveal:
      'Refills are free and expected. Asking for more kimchi is closer to a compliment than an imposition — the banchan belong to the table, not to your plate. Worth knowing that this is being argued about: with food prices up, some owners have started saying out loud that endless refills cannot last.',
  },

  {
    id: 'bossam-word',
    sources: ['encykorea-bossam-kimchi'],
    menuId: 'bossam',
    prompt: 'The word bossam originally named a kind of kimchi, not a pork dish.',
    answer: true,
    reveal:
      '보쌈김치 was a luxury kimchi from Kaesong — radish, pine nuts, jujube and chestnut tied up in a leaf like a bundle — and the encyclopedia traces it to royal court cooking. The pork platter borrowed the name later.',
  },

  // ---- The general pool ---------------------------------------------------
  // Table manners, which is where a foreign guest is most likely to be quietly
  // unsure and least likely to ask.
  {
    id: 'bibimbap-jeonju',
    sources: ['wikipedia-bibimbap-ko', 'khan-bibimbap-invented'],
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
    sources: ['facts-korea-dining'],
    menuId: null,
    prompt: 'You should lift your rice bowl off the table while eating, as in Japan.',
    answer: false,
    reveal:
      'The opposite. In Korea the bowl stays on the table and the spoon goes to you. Lifting it reads as slightly childish — one of the clearest places Korean and Japanese table manners diverge.',
  },
  {
    id: 'pouring',
    sources: ['facts-korea-dining'],
    menuId: null,
    prompt: 'It is normal to fill your own glass first.',
    answer: false,
    reveal:
      'You pour for the people around you and somebody pours for you. An empty glass in front of a guest is the host noticing too slowly — which is why the bottle moves around the table all evening.',
  },
  {
    id: 'turn-away',
    sources: ['facts-korea-dining'],
    menuId: null,
    prompt: 'When drinking beside someone much older, you turn your head away from them.',
    answer: true,
    reveal:
      'And hold the glass with two hands when they pour. Both are small deferences, and a foreign guest doing either one is usually met with delight rather than indifference.',
  },
  {
    id: 'kimchi-red',
    sources: ['encykorea-kimchi'],
    menuId: null,
    prompt: 'All kimchi is red and spicy.',
    answer: false,
    reveal:
      '백김치 has no chilli at all, and 동치미 is a cold watery radish kimchi eaten in winter. Chilli only reached Korea partway through the Joseon dynasty — kimchi is older than the colour everyone associates with it.',
  },
];

/**
 * Questions for this dish first, then the general pool — and nothing that
 * has not been sourced.
 *
 * The filter is the whole point. A question with an empty `sources` array is
 * one nobody has checked, and an unchecked assertion about Korea taught to a
 * foreigner inside a foundation-funded project is exactly the failure this
 * app keeps trying not to commit. It stays in the file so it can be sourced;
 * it does not reach a table until it is.
 */
export function quizFor(menuId) {
  const asked = quiz.filter(isSourced);
  const mine = menuId ? asked.filter(q => q.menuId === menuId) : [];
  const general = asked.filter(q => q.menuId === null);
  return [...mine, ...general];
}

/** Everything still waiting on a source, for the review worklist. */
export const unsourcedQuestions = () => quiz.filter(q => !isSourced(q));

export { sourcesFor };
