// What counts as a dish you would rather not eat alone, and how a menu line
// is read for one.
//
// Lifted out of scripts/dish-match.mjs on 2026-09-14, unchanged, when Incheon
// arrived. Two cities' registers are built by two scripts, and a dish list
// that drifted between them would mean the same restaurant is on one list and
// not the other — for a reason nobody could see. One file, imported by both.
//
// The patterns are written narrowly and were tested by counting; the traps
// are named where they sit. See scripts/dish-match.mjs for the Seoul join and
// scripts/build-incheon-places.mjs for the Incheon one.

/**
 * The six groups, and the dishes under them.
 *
 * `any` matches if present. `not` vetoes the row — a single-serving soup
 * wearing the same word, most often. Both are tested against the menu name
 * with spaces removed, because the register writes 닭 한마리 and 닭한마리.
 */
export const DISH_GROUPS = [
  {
    id: 'kbbq', emoji: '🔥', en: 'K-BBQ', ko: 'K-BBQ',
    dishes: [
      { id: 'samgyeopsal', ko: '삼겹살', any: ['삼겹살', '생삼겹', '오겹살'] },
      { id: 'galbi', ko: '갈비', any: ['갈비'], not: ['갈비탕', '갈비찜', '닭갈비', '갈비만두', '갈빗국'] },
      { id: 'dakgalbi', ko: '닭갈비', any: ['닭갈비'] },
      { id: 'gopchang', ko: '곱창', any: ['곱창', '막창', '대창'], not: ['곱창전골'] },
    ],
  },
  {
    id: 'hotpot', emoji: '🥘', en: 'HOT POT', ko: '전골·탕',
    dishes: [
      { id: 'budae', ko: '부대찌개', any: ['부대찌개', '부대찌게', '부대전골'] },
      { id: 'gamjatang', ko: '감자탕', any: ['감자탕'] },
      { id: 'dakhanmari', ko: '닭한마리', any: ['닭한마리', '닭한마리칼국수'] },
      { id: 'jeongol', ko: '전골', any: ['전골'] },
    ],
  },
  {
    id: 'sharing', emoji: '🥢', en: 'SHARING TABLE', ko: '나눠 먹는 상',
    dishes: [
      { id: 'bossam', ko: '보쌈', any: ['보쌈'] },
      { id: 'jokbal', ko: '족발', any: ['족발'] },
      { id: 'jjimdak', ko: '찜닭', any: ['찜닭'] },
      { id: 'haemuljjim', ko: '해물찜', any: ['해물찜', '아구찜', '대게찜'] },
    ],
  },
  {
    id: 'adventure', emoji: '🦀', en: 'KOREAN ADVENTURE', ko: '용기가 필요한 것',
    dishes: [
      { id: 'gejang', ko: '간장게장', any: ['간장게장', '양념게장', '게장'] },
      { id: 'sannakji', ko: '산낙지', any: ['산낙지'] },
      { id: 'yukhoe', ko: '육회', any: ['육회'], not: ['육회비빔밥'] },
      { id: 'dakbal', ko: '닭발', any: ['닭발'] },
    ],
  },
  {
    id: 'table', emoji: '🥬', en: 'KOREAN TABLE', ko: '한 상',
    dishes: [
      { id: 'hanjeongsik', ko: '한정식', any: ['한정식'] },
      { id: 'baekban', ko: '백반', any: ['백반'] },
      { id: 'ssambap', ko: '쌈밥', any: ['쌈밥'] },
      { id: 'bibimbap', ko: '비빔밥', any: ['비빔밥'] },
    ],
  },
  {
    id: 'street', emoji: '🥞', en: 'STREET & SNACKS', ko: '분식·전',
    dishes: [
      { id: 'tteokbokki', ko: '떡볶이', any: ['떡볶이', '떡볶기'] },
      // `전` alone matches 전주비빔밥, 전복죽, 전기구이. Only the pancakes.
      { id: 'jeon', ko: '전', any: ['파전', '김치전', '해물파전', '모둠전', '모듬전', '부침개', '녹두전', '감자전'] },
      { id: 'sundae', ko: '순대', any: ['순대'], not: ['순댓국', '순대국'] },
      // '튀김' alone matched 10,156 lines, and the sample was 감자튀김추가,
      // 왕새우튀김, 복튀김 — side orders and add-ons, which pulled in every
      // burger place with fries. The 분식 tray is what the list means.
      { id: 'twigim', ko: '튀김', any: ['모둠튀김', '모듬튀김', '야채튀김', '오징어튀김', '김말이', '튀김세트', '튀김만두'], not: ['감자튀김', '튀김추가', '튀김우동'] },
    ],
  },
];

const ALL_DISHES = DISH_GROUPS.flatMap(g => g.dishes);

const matchDish = (name, dish) => {
  if (dish.not?.some(v => name.includes(v))) return false;
  return dish.any.some(v => name.includes(v));
};

/** Spaces, and the punctuation a name is written with on one side only. */
const norm = (s) => String(s ?? '').replace(/\s+/g, '').replace(/[()（）·・.,'"“”‘’\-_/]/g, '');

/** One CSV line into fields, honouring the quoting the file actually uses. */
function splitCsv(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Every dish a menu name names, by id. The order is the catalogue's. */
export function dishesIn(menuName) {
  const name = norm(menuName);
  if (!name) return [];
  return ALL_DISHES.filter(dish => matchDish(name, dish)).map(dish => dish.id);
}

export { ALL_DISHES, matchDish, norm, splitCsv };
