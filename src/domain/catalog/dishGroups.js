// The six groups, and the twenty-four dishes under them.
//
// This is the app's premise written as a filter. A traveller alone in Seoul
// is not blocked by the language on the sign — they are blocked because
// samgyeopsal is priced from two servings, gamjatang arrives by the pot, and
// a 한정식 set is a two-person reservation. These are those dishes.
//
// The register's own 업태 field cannot express this: it says 한식 for 51,282
// places, the same word for a 김밥천국 and for a place that only sells 족발
// by the platter. So `scripts/dish-match.mjs` reads the register's *menus*
// instead and keeps a restaurant only if it serves one of these. The ids
// here are the ids that end up on each place's `d` field, which is how a
// screen can say why a restaurant is on the list.
//
// Kept in the domain rather than in the build script because the app reads
// them too — the map colours by group, and the filter bar offers them.

export const DISH_GROUPS = [
  {
    id: 'kbbq',
    emoji: '🔥',
    tint: '#F97316',
    en: 'K-BBQ',
    ko: 'K-BBQ',
    es: 'Barbacoa coreana',
    fr: 'Barbecue coréen',
    ar: 'شواء كوري',
    zh: '韩式烤肉',
    ja: '韓国焼肉',
    dishes: ['samgyeopsal', 'galbi', 'dakgalbi', 'gopchang'],
    ko_dishes: '삼겹살 · 갈비 · 닭갈비 · 곱창',
  },
  {
    id: 'hotpot',
    emoji: '🥘',
    tint: '#DC2626',
    en: 'HOT POT',
    ko: '전골·탕',
    es: 'Olla caliente',
    fr: 'Marmite',
    ar: 'قِدر ساخنة',
    zh: '一锅',
    ja: '鍋もの',
    dishes: ['budae', 'gamjatang', 'dakhanmari', 'jeongol'],
    ko_dishes: '부대찌개 · 감자탕 · 닭한마리 · 전골',
  },
  {
    id: 'sharing',
    emoji: '🥢',
    tint: '#0E9F6E',
    en: 'SHARING TABLE',
    ko: '나눠 먹는 상',
    es: 'Mesa para compartir',
    fr: 'Table à partager',
    ar: 'مائدة للمشاركة',
    zh: '分着吃的桌',
    ja: '分け合う食卓',
    dishes: ['bossam', 'jokbal', 'jjimdak', 'haemuljjim'],
    ko_dishes: '보쌈 · 족발 · 찜닭 · 해물찜',
  },
  {
    id: 'adventure',
    emoji: '🦀',
    tint: '#7C3AED',
    en: 'KOREAN ADVENTURE',
    ko: '용기가 필요한 것',
    es: 'Aventura coreana',
    fr: 'Aventure coréenne',
    ar: 'مغامرة كورية',
    zh: '需要一点勇气',
    ja: '勇気がいる一皿',
    dishes: ['gejang', 'sannakji', 'yukhoe', 'dakbal'],
    ko_dishes: '간장게장 · 산낙지 · 육회 · 닭발',
  },
  {
    id: 'table',
    emoji: '🥬',
    tint: '#0369A1',
    en: 'KOREAN TABLE',
    ko: '한 상',
    es: 'Mesa coreana',
    fr: 'Table coréenne',
    ar: 'المائدة الكورية',
    zh: '一整桌',
    ja: '一膳',
    dishes: ['hanjeongsik', 'baekban', 'ssambap', 'bibimbap'],
    ko_dishes: '한정식 · 백반 · 쌈밥 · 비빔밥',
  },
  {
    id: 'street',
    emoji: '🥞',
    tint: '#B45309',
    en: 'STREET & SNACKS',
    ko: '분식·전',
    es: 'Calle y picoteo',
    fr: 'Rue et en-cas',
    ar: 'الشارع والوجبات الخفيفة',
    zh: '街头小吃',
    ja: '屋台と軽食',
    dishes: ['tteokbokki', 'jeon', 'sundae', 'twigim'],
    ko_dishes: '떡볶이 · 전 · 순대 · 튀김',
  },
];

/** Every dish id, in the order the groups list them. */
export const DISH_IDS = DISH_GROUPS.flatMap(g => g.dishes);

/** The Korean name of each dish, for a tag on a card. */
export const DISH_KO = {
  samgyeopsal: '삼겹살', galbi: '갈비', dakgalbi: '닭갈비', gopchang: '곱창',
  budae: '부대찌개', gamjatang: '감자탕', dakhanmari: '닭한마리', jeongol: '전골',
  bossam: '보쌈', jokbal: '족발', jjimdak: '찜닭', haemuljjim: '해물찜',
  gejang: '간장게장', sannakji: '산낙지', yukhoe: '육회', dakbal: '닭발',
  hanjeongsik: '한정식', baekban: '백반', ssambap: '쌈밥', bibimbap: '비빔밥',
  tteokbokki: '떡볶이', jeon: '전', sundae: '순대', twigim: '튀김',
};

const GROUP_OF = new Map(DISH_GROUPS.flatMap(g => g.dishes.map(d => [d, g])));

/** The group a dish belongs to, or null for an id nothing knows. */
export const groupOfDish = (dishId) => GROUP_OF.get(dishId) ?? null;

/**
 * The menu catalog's ids, into the groups.
 *
 * domain/catalog/menus.js predates the groups and spells two ids
 * differently — 부대찌개 is `budae-jjigae` there and `budae` here,
 * 간장게장 is `ganjang-gejang` and `gejang`. This is the bridge, and a
 * test walks the whole catalog through it so a new dish cannot arrive
 * without a group.
 */
const MENU_ALIAS = { 'budae-jjigae': 'budae', 'ganjang-gejang': 'gejang' };

/** The group a table's menuId belongs to, or null. */
export const groupOfMenu = (menuId) => GROUP_OF.get(MENU_ALIAS[menuId] ?? menuId) ?? null;

/**
 * The same bridge, walked the other way: the id the menu catalog files a
 * dish under. For handing a register place's dish to the open-a-table form,
 * whose menu picker speaks catalog ids. The caller still checks the catalog
 * actually has it — 14 of the 24 dishes have no catalog entry yet.
 */
const DISH_TO_MENU = { budae: 'budae-jjigae', gejang: 'ganjang-gejang' };
export const menuIdOfDish = (dishId) => DISH_TO_MENU[dishId] ?? dishId;

/**
 * The groups a place belongs to, from the dish ids on its `d` field.
 *
 * A place can be in several — a 고깃집 with 된장찌개 and 파전 is K-BBQ and
 * STREET both, which is true of the place and useful to a reader deciding
 * where to go.
 */
export function groupsOf(dishIds = []) {
  const seen = new Map();
  for (const d of dishIds) {
    const g = GROUP_OF.get(d);
    if (g && !seen.has(g.id)) seen.set(g.id, g);
  }
  return [...seen.values()];
}

/** The group a map pin takes its colour from: the first one the place has. */
export const primaryGroup = (dishIds = []) => groupsOf(dishIds)[0] ?? null;
