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
    contains: ['pork'],
    spice: 0,
    zones: ['Jongno, Seoul', 'Mapo, Seoul', 'Gangnam, Seoul'],
  },
  {
    id: 'dakgalbi',
    name: 'Dakgalbi',
    nameKo: '닭갈비',
    romanization: 'dak-gal-bi',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    whyShared:
      'It is stir-fried on one wide iron plate in the centre of the table, and the plate does not come in a one-person size.',
    howItWorks:
      'Marinated chicken, cabbage and rice cake are fried in front of you. When the meat is gone, rice is fried in what is left in the pan — that second course is the part regulars come for.',
    contains: ['chicken'],
    spice: 3,
    zones: ['Sinchon, Seoul', 'Hongdae, Seoul'],
  },
  {
    id: 'gamjatang',
    name: 'Gamjatang',
    nameKo: '감자탕',
    romanization: 'gam-ja-tang',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'The pot sits on a burner in the middle of the table and is ladled out by whoever is nearest. Shops list it by pot size — small is still two people.',
    howItWorks:
      'Pork spine simmered with potato and perilla leaf. You pull the meat off the bone with chopsticks; it is expected to be slow and messy.',
    contains: ['pork'],
    spice: 3,
    zones: ['Jongno, Seoul', 'Dongdaemun, Seoul'],
  },
  {
    id: 'budae-jjigae',
    name: 'Budae Jjigae',
    nameKo: '부대찌개',
    romanization: 'bu-dae-jji-gae',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'Cooked at the table in a shallow pan everyone eats out of directly, and ordered by the number of people rather than by the bowl.',
    howItWorks:
      'A stew built after the Korean War from what American bases had to spare — spam, sausage, baked beans — over a Korean broth. Instant noodles go in near the end.',
    contains: ['pork', 'beef'],
    spice: 3,
    zones: ['Itaewon, Seoul', 'Uijeongbu'],
  },
  {
    id: 'bossam',
    name: 'Bossam',
    nameKo: '보쌈',
    romanization: 'bo-ssam',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'It arrives as one platter of sliced pork with a pile of leaves and a bowl of kimchi to build from. The smallest platter on most menus feeds two.',
    howItWorks:
      'Boiled pork belly, served cool, that you wrap yourself in napa cabbage with radish salad and salted shrimp.',
    contains: ['pork', 'shellfish'],
    spice: 1,
    zones: ['Jongno, Seoul', 'Mapo, Seoul'],
  },
  {
    id: 'jokbal',
    name: 'Jokbal',
    nameKo: '족발',
    romanization: 'jok-bal',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'Sold by the whole trotter. There is no half order, and a whole one defeats one person.',
    howItWorks:
      'Pig trotter braised in soy, cinnamon and ginger until the skin turns to gelatin, then sliced and eaten wrapped in leaves.',
    contains: ['pork'],
    spice: 0,
    zones: ['Jangchung, Seoul', 'Gongdeok, Seoul'],
  },
  {
    id: 'ganjang-gejang',
    name: 'Ganjang Gejang',
    nameKo: '간장게장',
    romanization: 'gan-jang-ge-jang',
    category: MENU_CATEGORY.SET,
    minPeople: 2,
    whyShared:
      'Served as a set with rice and a spread of side dishes, priced per crab and usually listed from two people up.',
    howItWorks:
      'Raw crab cured in soy sauce. You eat it with your hands, and the shell is meant to be filled with rice at the end — that last mouthful is the point of the dish.',
    contains: ['shellfish'],
    spice: 0,
    zones: ['Sinsa, Seoul', 'Mapo, Seoul'],
  },
  {
    id: 'hanjeongsik',
    name: 'Hanjeongsik',
    nameKo: '한정식',
    romanization: 'han-jeong-sik',
    category: MENU_CATEGORY.SET,
    minPeople: 2,
    whyShared:
      'A full course of shared dishes brought out together. Most houses take the booking for two or more, and many ask for it a day ahead.',
    howItWorks:
      'A formal spread — soups, grilled fish, jeon, a dozen or more banchan — laid across the table at once rather than in courses. Everything in the middle is for everyone.',
    contains: [],
    spice: 1,
    zones: ['Insadong, Seoul', 'Jongno, Seoul'],
  },
  {
    id: 'baekban',
    name: 'Baekban',
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
    contains: [],
    spice: 1,
    zones: ['Jongno, Seoul', 'Euljiro, Seoul'],
  },
  {
    id: 'gopchang',
    name: 'Gopchang',
    nameKo: '곱창',
    romanization: 'gop-chang',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    whyShared:
      'Priced by the serving with a two-serving minimum almost everywhere, and grilled at the table where it needs watching.',
    howItWorks:
      'Beef or pork intestine grilled over charcoal until the fat inside renders. Regulars finish with fried rice in the same pan.',
    contains: ['beef', 'pork'],
    spice: 1,
    zones: ['Wangsimni, Seoul', 'Euljiro, Seoul'],
  },
];

const byId = new Map(menus.map(m => [m.id, m]));

export const menuById = (id) => byId.get(id);

/** Dishes that genuinely cannot be ordered by one person. */
export const sharedOnlyMenus = () => menus.filter(m => m.minPeople > 1);

/** Category label for a chip, in both languages the app speaks. */
export const CATEGORY_LABEL = {
  [MENU_CATEGORY.GRILL]: { en: 'Grilled at the table', ko: '구이' },
  [MENU_CATEGORY.STEW]: { en: 'One pot', ko: '찌개·전골' },
  [MENU_CATEGORY.SET]: { en: 'A full table', ko: '한 상' },
  [MENU_CATEGORY.PLATTER]: { en: 'One platter', ko: '접시' },
};
