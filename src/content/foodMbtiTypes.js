// The sixteen names, by code.
//
// The code is written in axis order — table, then Korean food, then flavour,
// then risk — so QNMS reads quiet, new to it, mild, safe. Nothing about the
// order is meaningful beyond that it is fixed: a code that reshuffled itself
// would stop being something a reader can carry around and compare.
//
// Written in Korean and translated from there, like tasteTypes.js. Every one
// of them describes the reader at a table and none of them claims anything
// about Korean food, which is what keeps this file out of content/sources.js
// — see the note at the top of foodMbti.js.
//
// Sixteen is a lot of names to keep distinct, and the risk is not that one is
// wrong but that two are the same sentence. They are grouped below by their
// first letter so that neighbours can be read against each other.
export const MBTI_TYPES = {
  // ── Q: eats quietly ──────────────────────────────────────────────────
  QNMS: {
    ko: '조심스러운 첫 끼', en: 'A careful first meal', es: 'Una primera comida prudente',
    fr: 'Un premier repas prudent', ar: 'وجبة أولى حذِرة', zh: '小心翼翼的第一顿',
    ja: '慎重な最初の一食',
  },
  QNMA: {
    ko: '말없는 첫 도전', en: 'A quiet first try', es: 'Un primer intento callado',
    fr: 'Un premier essai silencieux', ar: 'محاولة أولى صامتة', zh: '不声不响的第一次尝试',
    ja: '黙って挑む初めて',
  },
  QNBS: {
    ko: '매운 걸 아는 초심자', en: 'New here, but knows heat',
    es: 'Nuevo aquí, pero sabe de picante', fr: 'Nouveau ici, mais habitué au piquant',
    ar: 'جديد هنا، لكنه يعرف الحرارة', zh: '刚来，但吃得了辣',
    ja: '初めてだが辛さは知っている',
  },
  QNBA: {
    ko: '조용한 모험가', en: 'A quiet adventurer', es: 'Un aventurero callado',
    fr: 'Un aventurier silencieux', ar: 'مغامر صامت', zh: '安静的冒险者',
    ja: '静かな冒険者',
  },
  QKMS: {
    ko: '늘 먹던 자리', en: 'The usual seat', es: 'El sitio de siempre',
    fr: 'La place habituelle', ar: 'المقعد المعتاد', zh: '老位子',
    ja: 'いつもの席',
  },
  QKMA: {
    ko: '조용한 새 시도', en: 'Knows it, still orders new',
    es: 'La conoce y aun así pide algo nuevo',
    fr: 'La connaît et commande pourtant du nouveau',
    ar: 'يعرفه ومع ذلك يطلب الجديد', zh: '都熟了，还是点新的',
    ja: '知っていてなお新しいものを',
  },
  QKBS: {
    ko: '얼큰한 단골', en: 'A regular, and it is spicy', es: 'Un habitual, y del picante',
    fr: 'Un habitué, et du côté relevé', ar: 'زبون دائم، ومن جهة الحارّ',
    zh: '常客，而且吃辣', ja: '常連、それも辛い方の',
  },
  QKBA: {
    ko: '말없이 다 먹어본 사람', en: 'Has tried it all, says little',
    es: 'Lo ha probado todo y habla poco',
    fr: 'A tout goûté, et parle peu', ar: 'جرّب كلّ شيء ويتكلّم قليلًا',
    zh: '什么都吃过，话不多', ja: 'ひととおり食べていて、口数は少ない',
  },

  // ── T: eats talking ──────────────────────────────────────────────────
  TNMS: {
    ko: '물어보며 먹는 첫 끼', en: 'A first meal, full of questions',
    es: 'Una primera comida llena de preguntas',
    fr: 'Un premier repas plein de questions', ar: 'وجبة أولى مليئة بالأسئلة',
    zh: '边问边吃的第一顿', ja: '尋ねながらの最初の一食',
  },
  TNMA: {
    ko: '다 물어보고 다 시키는 사람', en: 'Asks about everything, orders everything',
    es: 'Pregunta por todo y lo pide todo',
    fr: 'Demande tout et commande tout', ar: 'يسأل عن كلّ شيء ويطلب كلّ شيء',
    zh: '什么都问，什么都点', ja: '何でも尋ね、何でも頼む',
  },
  TNBS: {
    ko: '매운 건 되는 초심자', en: 'Handles the heat, new to the rest',
    es: 'Aguanta el picante, nuevo en lo demás',
    fr: 'Supporte le piquant, découvre le reste',
    ar: 'يحتمل الحارّ، وجديد على الباقي', zh: '辣没问题，别的还生',
    ja: '辛さは平気、あとは初めて',
  },
  TNBA: {
    ko: '겁 없는 첫 손님', en: 'A fearless first-timer', es: 'Un novato sin miedo',
    fr: 'Un débutant sans peur', ar: 'وافد جديد بلا خوف', zh: '初来乍到，毫不胆怯',
    ja: '物おじしない初来店',
  },
  TKMS: {
    ko: '설명해주는 단골', en: 'The regular who explains',
    es: 'El habitual que te lo explica', fr: 'L’habitué qui explique',
    ar: 'الزبون الدائم الذي يشرح', zh: '会讲解的常客',
    ja: '説明してくれる常連',
  },
  TKMA: {
    ko: '같이 시켜보자는 사람', en: 'The one who says let us try it',
    es: 'El que dice: probémoslo', fr: 'Celui qui dit : essayons',
    ar: 'من يقول: لنجرّبه', zh: '会说“来试试”的那个',
    ja: '「頼んでみよう」と言う人',
  },
  TKBS: {
    ko: '매운 집 안내인', en: 'The guide to the hot places',
    es: 'El guía de los sitios picantes', fr: 'Le guide des adresses qui piquent',
    ar: 'دليلك إلى الأماكن الحارّة', zh: '带你去辣馆子的人',
    ja: '辛い店の案内役',
  },
  TKBA: {
    ko: '다 아는데 또 시키는 사람', en: 'Knows it all and orders more',
    es: 'Lo sabe todo y aun así pide más',
    fr: 'Connaît tout et commande encore', ar: 'يعرف كلّ شيء ويطلب المزيد',
    zh: '什么都懂，还要再点', ja: '何でも知っていて、まだ頼む',
  },
};

/** Every code, for the tests that walk them. */
export const MBTI_CODES = Object.keys(MBTI_TYPES);
