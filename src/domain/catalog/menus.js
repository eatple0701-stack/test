// Menu catalog — the Korean dishes you cannot order alone.
//
// This is the catalog the whole product turns on. The business plan's finding
// is that a solo foreign traveller is shut out of a large part of Korean food
// not by language or price but by portion: 삼겹살 starts at two servings,
// 감자탕 arrives in a pot sized for a table, 한정식 is booked for two. The
// traveller gives up and eats something they could have eaten anywhere.
//
// So `minPeople` is not a detail here, it is the reason the app exists, and
// `whyShared` is the sentence that has to earn a stranger's afternoon. Each
// one states a fact about how the dish is cooked or served — not a claim
// about how good it is, and not a claim about any particular restaurant.
//
// Deliberately absent: prices. They move, they differ by district, and this
// project does not assert things it cannot check. A traveller told "about
// 20,000 won" who is charged 34,000 has been misled by us, not by the shop.
//
// `contains` and `varies` carry the same rule into ingredients, where getting
// it wrong costs more than money. An empty `contains` used to be the app's
// only way of saying two very different things — "checked, and there is none
// of it" for a dish that is one cut of meat, and "nobody enumerated a spread
// of twelve side dishes" for 한상. On screen they were identical: no warning
// at all. A traveller avoiding pork read silence as safety.
//
// So `varies: true` marks a dish whose accompanying spread is chosen by the
// house, on the day. It never suppresses a warning — conflicts still show —
// it adds one the app could not otherwise give: this cannot be checked in
// advance, ask before you sit down. The two dishes carrying it say so in
// their own descriptions, which is where the contradiction was found.

/**
 * When a dish is actually eaten.
 *
 * Korean food has a clock. 감자탕 is a night-shift meal and a hangover
 * breakfast; 삼겹살 is the first round of a 회식 after work. The app showed
 * the same thing at three in the afternoon and three in the morning, and
 * defaulted every table anybody opened to 19:00 regardless of the dish.
 *
 * Set on three dishes out of ten, and deliberately not on the other seven.
 * The rule is the one this catalog already lives under: a field here may only
 * say what the dish's own prose says. 백반's record mentions a morning, but it
 * is the morning the kitchen cooked in — not a claim about when anybody eats
 * it — so 백반 has no time. Guessing the remaining seven would be inventing
 * facts about how a country eats, which is the one thing a public-diplomacy
 * app cannot afford to get casually wrong. A test enforces it.
 */
export const EATEN_AT = {
  MORNING: 'morning',
  LUNCH: 'lunch',
  EVENING: 'evening',
  LATE: 'late',
};

/** The hour a host opening this dish most likely means. */
export const DEFAULT_HOUR = {
  [EATEN_AT.MORNING]: '09:00',
  [EATEN_AT.LUNCH]: '12:30',
  [EATEN_AT.EVENING]: '19:00',
  [EATEN_AT.LATE]: '21:30',
};

export const EATEN_AT_LABEL = {
  [EATEN_AT.MORNING]: { kr: '아침', en: 'morning' },
  [EATEN_AT.LUNCH]: { kr: '점심', en: 'lunch' },
  [EATEN_AT.EVENING]: { kr: '저녁', en: 'evening' },
  [EATEN_AT.LATE]: { kr: '늦은 밤', en: 'late night' },
};

export const MENU_CATEGORY = {
  GRILL: 'grill',       // 구이 — cooked at the table
  STEW: 'stew',         // 찌개·전골 — one pot, many spoons
  SET: 'set',           // 한 상 — a spread of shared dishes
  PLATTER: 'platter',   // 접시 — served whole, carved or torn at the table
};

export const menus = [
  {
    id: 'samgyeopsal',
    name: 'Samgyeopsal',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Grilled pork belly",
    nameKo: '삼겹살',
    romanization: 'sam-gyeop-sal',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    // Why a stranger is worth finding for this dish.
    whyShared:
      'Almost every grill house prices pork belly from two servings up, and the meat is cooked in the middle of the table rather than in a kitchen — somebody has to turn it while somebody else cuts.',
    // What the table actually does, for a traveller who has never sat at one.
    howItWorks:
      'Raw pork belly comes to a grill set into the table. You cook it yourself, cut it with scissors, then wrap a piece in lettuce with garlic, ssamjang and rice.',
    themeId: 'seoul-after-dark',
    culture:
      "The grill in the middle is a job, not a decoration: somebody turns the meat, somebody cuts it, and wrapping a piece in lettuce and handing it to the person beside you is a small act of care Koreans do without mentioning it. This is the first round of a 회식 — the after-work dinner that built most Korean working relationships.",
    contains: ['pork'],
    // 'the first round of a 회식 — the after-work dinner', in its culture note.
    eatenAt: ['evening'],
    spice: 0,
    zones: ['Jongno, Seoul', 'Mapo, Seoul', 'Gangnam, Seoul'],
  },
  {
    id: 'dakgalbi',
    name: 'Dakgalbi',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Chicken stir-fried at the table",
    nameKo: '닭갈비',
    romanization: 'dak-gal-bi',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    whyShared:
      'It is stir-fried on one wide iron plate in the centre of the table, and the plate does not come in a one-person size.',
    howItWorks:
      'Marinated chicken, cabbage and rice cake are fried in front of you. When the meat is gone, rice is fried in what is left in the pan — that second course is the part regulars come for.',
    themeId: null,
    culture:
      "It comes from Chuncheon, where it started in the bars in the late 1960s and filled the back alleys through the 1970s — cheap enough by then that students called it 대학생갈비, student ribs. When the meat is gone the staff fry rice in what is left in the pan, and leaving before that second course is considered a waste of a good dinner.",
    contains: ['chicken'],
    // 'a waste of a good dinner', in its own culture note.
    eatenAt: ['evening'],
    spice: 3,
    zones: ['Sinchon, Seoul', 'Hongdae, Seoul'],
  },
  {
    id: 'gamjatang',
    name: 'Gamjatang',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Pork spine and potato stew",
    nameKo: '감자탕',
    romanization: 'gam-ja-tang',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'The pot sits on a burner in the middle of the table and is ladled out by whoever is nearest. Shops list it by pot size — small is still two people.',
    howItWorks:
      'Pork spine simmered with potato and perilla leaf. You pull the meat off the bone with chopsticks; it is expected to be slow and messy.',
    themeId: 'seoul-after-dark',
    culture:
      "Long a night-shift and market-worker meal, eaten late and slowly because the meat has to be worked off the bone by hand. It doubles as 해장 — the food Koreans eat the morning after drinking, which is its own recognised category here.",
    contains: ['pork'],
    // Both stated in its culture note: 'eaten late and slowly', and it
    // 'doubles as 해장 — the food Koreans eat the morning after drinking'.
    eatenAt: ['late', 'morning'],
    spice: 3,
    zones: ['Jongno, Seoul', 'Dongdaemun, Seoul'],
  },
  {
    id: 'budae-jjigae',
    name: 'Budae Jjigae',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Sausage and noodle army stew",
    nameKo: '부대찌개',
    romanization: 'bu-dae-jji-gae',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'Cooked at the table in a shallow pan everyone eats out of directly, and ordered by the number of people rather than by the bowl.',
    howItWorks:
      'A stew built after the Korean War from what American bases had to spare — spam, sausage, baked beans — over a Korean broth. Instant noodles go in near the end.',
    themeId: null,
    culture:
      "Built after the Korean War around Uijeongbu, from surplus the American bases had and Korean kitchens did not: spam, sausage, baked beans. A dish assembled out of scarcity became one the country now eats by choice, which is roughly the shape of post-war Korea in a single pan.",
    contains: ['pork', 'beef'],
    spice: 3,
    zones: ['Itaewon, Seoul', 'Uijeongbu'],
  },
  {
    id: 'bossam',
    name: 'Bossam',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Boiled pork you wrap in cabbage",
    nameKo: '보쌈',
    romanization: 'bo-ssam',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'It arrives as one platter of sliced pork with a pile of leaves and a bowl of kimchi to build from. The smallest platter on most menus feeds two.',
    howItWorks:
      'Boiled pork belly, served cool, that you wrap yourself in napa cabbage with radish salad and salted shrimp.',
    themeId: null,
    culture:
      "Traditionally eaten on 김장 day, when families gather to make a winter's worth of kimchi together — UNESCO lists that gathering as intangible cultural heritage. The pork is what the household eats standing up, wrapped in leaves, while the work is still going on.",
    contains: ['pork', 'shellfish'],
    spice: 1,
    zones: ['Jongno, Seoul', 'Mapo, Seoul'],
  },
  {
    id: 'jokbal',
    name: 'Jokbal',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Braised pig trotter, sliced",
    nameKo: '족발',
    romanization: 'jok-bal',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'Sold by the whole trotter. There is no half order, and a whole one defeats one person.',
    howItWorks:
      'Pig trotter braised in soy, cinnamon and ginger until the skin turns to gelatin, then sliced and eaten wrapped in leaves.',
    themeId: 'seoul-after-dark',
    culture:
      "The Jangchung-dong alley that made it famous was built by families displaced by the Korean War. It is 야식 food — the late meal ordered to a home or an office after everything else has closed, and almost never eaten by one person.",
    contains: ['pork'],
    spice: 0,
    zones: ['Jangchung, Seoul', 'Gongdeok, Seoul'],
  },
  {
    id: 'ganjang-gejang',
    name: 'Ganjang Gejang',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Raw crab cured in soy sauce",
    nameKo: '간장게장',
    romanization: 'gan-jang-ge-jang',
    category: MENU_CATEGORY.SET,
    minPeople: 2,
    whyShared:
      'Served as a set with rice and a spread of side dishes, priced per crab and usually listed from two people up.',
    howItWorks:
      'Raw crab cured in soy sauce. You eat it with your hands, and the shell is meant to be filled with rice at the end — that last mouthful is the point of the dish.',
    themeId: null,
    culture:
      "Koreans call it 밥도둑, the rice thief, because the salt in it makes you eat more rice than you meant to. The last step is filling the empty shell with rice and mixing it in — the dish is built around that final mouthful rather than the crab itself.",
    contains: ['shellfish'],
    spice: 0,
    zones: ['Sinsa, Seoul', 'Mapo, Seoul'],
  },
  {
    id: 'hanjeongsik',
    name: 'Hanjeongsik',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "A full Korean course, all at once",
    nameKo: '한정식',
    romanization: 'han-jeong-sik',
    category: MENU_CATEGORY.SET,
    minPeople: 2,
    whyShared:
      'A full course of shared dishes brought out together. Most houses take the booking for two or more, and many ask for it a day ahead.',
    howItWorks:
      'A formal spread — soups, grilled fish, jeon, a dozen or more banchan — laid across the table at once rather than in courses. Everything in the middle is for everyone.',
    themeId: null,
    culture:
      "It descends from the 반상, the formally counted Korean table: dishes were served in sets of three, five, seven or nine, and the number marked the household. Everything arrives at once rather than in courses, so nothing is anybody's alone.",
    // howItWorks two fields up names grilled fish. The record said this dish
    // contained nothing, so the app printed a description of fish and no
    // warning, on the same screen, to somebody who had said they avoid it.
    contains: ['fish'],
    // And the rest of the spread is a dozen banchan chosen by the house, so
    // what is *not* in it cannot be promised. See the note on `varies` at the
    // top of this file.
    varies: true,
    spice: 1,
    zones: ['Insadong, Seoul', 'Jongno, Seoul'],
  },
  {
    id: 'baekban',
    name: 'Baekban',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Rice, soup and the day's side dishes",
    nameKo: '백반',
    romanization: 'baek-ban',
    category: MENU_CATEGORY.SET,
    minPeople: 1,
    // The honest exception, and it earns its place: this one you *can* order
    // alone. It is here because the plan names it, and because eating it
    // alone misses what it is — a menu-less home meal whose whole character
    // is the shared middle of the table.
    whyShared:
      'You can order this one alone. It is here because the banchan in the middle are refilled for the table, not the plate — with two people the spread doubles and nothing is wasted.',
    howItWorks:
      'A home-style set: rice, soup, and whatever side dishes the kitchen made that morning. Often there is no menu — you sit down and it comes.',
    themeId: null,
    culture:
      "The everyday table — 집밥, home food, served in shops that often have no menu at all. What arrives is what the kitchen made that morning, and refills of the side dishes are free and expected, which is why asking for more is a compliment rather than an imposition.",
    // Rice and soup are the dish; everything else is whatever the kitchen made
    // that morning, which this catalog says itself two fields up. There is no
    // honest ingredient list for a meal decided at dawn.
    contains: [],
    varies: true,
    spice: 1,
    zones: ['Jongno, Seoul', 'Euljiro, Seoul'],
  },
  {
    id: 'gopchang',
    name: 'Gopchang',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Charcoal-grilled intestine",
    nameKo: '곱창',
    romanization: 'gop-chang',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    whyShared:
      'Priced by the serving with a two-serving minimum almost everywhere, and grilled at the table where it needs watching.',
    howItWorks:
      'Beef or pork intestine grilled over charcoal until the fat inside renders. Regulars finish with fried rice in the same pan.',
    themeId: 'seoul-after-dark',
    culture:
      "Offal was poverty food within living memory and is now among the more expensive things on a Korean grill — a change most people eating it can remember happening. It is drinking food, cooked slowly, and the table it belongs to is one nobody is in a hurry to leave.",
    contains: ['beef', 'pork'],
    spice: 1,
    zones: ['Wangsimni, Seoul', 'Euljiro, Seoul'],
  },
];

const byId = new Map(menus.map(m => [m.id, m]));

export const menuById = (id) => byId.get(id);

/** Dishes that genuinely cannot be ordered by one person. */
export const sharedOnlyMenus = () => menus.filter(m => m.minPeople > 1);

/**
 * The hour a host opening this dish most likely means, or null when the
 * catalog has no business guessing. Null keeps the form's own 19:00 rather
 * than inventing a time for a dish nobody said anything about.
 */
export function defaultHourFor(menuId) {
  const when = menuById(menuId)?.eatenAt?.[0];
  return when ? DEFAULT_HOUR[when] ?? null : null;
}

/** Every slot this dish is eaten in, resolved to labels. Empty when unknown. */
export function eatenAtLabels(menuId) {
  return (menuById(menuId)?.eatenAt ?? []).map(w => EATEN_AT_LABEL[w]).filter(Boolean);
}

/** Category label for a chip, in both languages the app speaks. */
export const CATEGORY_LABEL = {
  [MENU_CATEGORY.GRILL]: { en: 'Grilled at the table', ko: '구이' },
  [MENU_CATEGORY.STEW]: { en: 'One pot', ko: '찌개·전골' },
  [MENU_CATEGORY.SET]: { en: 'A full table', ko: '한 상' },
  [MENU_CATEGORY.PLATTER]: { en: 'One platter', ko: '접시' },
};
