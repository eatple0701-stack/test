// Korean food culture content, shared by category (restaurant.category).
// Written for curious first-time visitors: one hook that sparks curiosity,
// then short practical dining tips. Individual restaurants can override by
// adding `didYouKnow` / `diningTips` fields to their own data entry.

export const cultureByCategory = {
  temple: {
    didYouKnow:
      "Korean temple cuisine bans garlic, onions, chives, leeks and green onions — the 'five pungent vegetables' — because monks believe they stir up strong emotions. Every deep flavor you taste here comes from fermentation and slow patience instead.",
    diningTips: [
      'Eat like a monk: finishing everything in your bowl is the point — the practice called 발우공양 (balwoo gongyang) leaves not a single grain of rice behind.',
      'Taste the small dishes one by one. Each banchan is seasoned to be eaten with rice, not on its own.',
      'Meals here are quiet and unhurried — locals treat them as meditation, not just lunch.',
    ],
    whyLocalsLoveIt:
      "Regulars come back for the quiet as much as the food — a temple meal is one of the few places in Seoul where no one is checking their phone.",
    usefulKorean: [
      { ko: '잘 먹겠습니다', ro: 'jal meokkesseumnida', en: 'I will eat well (said before the meal)' },
      { ko: '공양', ro: 'gongyang', en: 'a temple meal offering' },
      { ko: '맛있어요', ro: 'masisseoyo', en: "It's delicious" },
    ],
    conversationTips: [
      'Ask the staff what 발우공양 means — most are happy to explain the empty-bowl ritual to curious travelers.',
      'Keep your voice low; a temple dining room is treated as an extension of the meditation hall.',
    ],
    passportMission: { title: 'The Empty Bowl', detail: 'Finish every grain of rice, the way 발우공양 intends. Leaving nothing behind is the whole practice, not just good manners.' },
    culturalMeaning: 'Temple food represents a Buddhist philosophy of eating with awareness — nothing wasted, nothing indulgent, everything intentional.',
    whenKoreansEatThis: 'During a templestay, on a Buddhist holiday, or whenever someone wants a quiet reset from city food.',
  },
  'korean-chinese': {
    didYouKnow:
      "Jajangmyeon was born in Incheon's Chinatown around 1905, invented by Chinese dockworkers far from home. Today Koreans eat millions of bowls a day — and it is still the traditional 'moving day' meal, delivered to your new apartment floor.",
    diningTips: [
      'Mix the black bean sauce into the noodles thoroughly before your first bite — and eat fast, before the noodles swell.',
      'The yellow pickled radish (danmuji) on the side is there to cut the richness. Alternate bites.',
      "Slurping is perfectly polite here — it cools the noodles and signals you're enjoying them.",
    ],
    whyLocalsLoveIt:
      "It's the food Seoul eats on moving day and lonely nights alike — jajangmyeon is comfort food first, cuisine second.",
    usefulKorean: [
      { ko: '곱빼기', ro: 'gopbaegi', en: 'double portion' },
      { ko: '단무지 더 주세요', ro: 'danmuji deo juseyo', en: 'More pickled radish, please' },
      { ko: '짜장면 하나요', ro: 'jjajangmyeon hanayo', en: 'One jajangmyeon, please' },
    ],
    conversationTips: [
      'Ask which noodle shop the staff grew up eating at — everyone in Korea has a childhood jjajangmyeon spot.',
      'Mention 짜장 vs 짬뽕 (black bean vs spicy seafood noodles) — the rivalry is a reliable icebreaker.',
    ],
    passportMission: { title: 'Order Like a Local', detail: 'Get one jjajangmyeon and one jjamppong for the table and swap halfway — the standard Korean solution to an unwinnable choice.' },
    culturalMeaning: "Jajangmyeon carries the memory of Korea's Chinese immigrant community — a dish that became fully Korean while keeping its foreign name.",
    whenKoreansEatThis: 'Moving day, the day report cards come out, or any weeknight nobody wants to cook.',
  },
  'vegan-dining': {
    didYouKnow:
      "Korea's plant-based scene is powered by a very old idea: 나물 (namul), the art of seasoning wild greens. Long before 'vegan' was a word, a proper Korean table was already built around dozens of vegetable dishes.",
    diningTips: [
      "Try the soy-meat dishes even if you're skeptical — Korean kitchens have refined the texture through decades of temple cooking.",
      'Side dishes (banchan) are usually refillable. Asking for more is a compliment to the kitchen, not a faux pas.',
    ],
    whyLocalsLoveIt:
      "Seoul's plant-based kitchens draw a mixed crowd of monks-in-training, athletes and skeptics — everyone leaves arguing about whether it tasted like meat.",
    usefulKorean: [
      { ko: '비건이에요', ro: 'bigeon-ieyo', en: "I'm vegan" },
      { ko: '고기 안 들어가요?', ro: 'gogi an deureogayo?', en: 'Does this have meat in it?' },
      { ko: '두부', ro: 'dubu', en: 'tofu' },
    ],
    conversationTips: [
      'Ask what the soy-meat is made from — most Seoul vegan kitchens are proud of the technique and love to explain it.',
      "Korean vegans are still a small, tight community — staff often know every other plant-based spot in the city.",
    ],
    passportMission: { title: 'Ask the Kitchen', detail: 'Ask what the soy-meat is made from. Korean plant-based kitchens are proud of the technique and will happily walk you through it.' },
    culturalMeaning: "Plant-based eating in Korea traces back centuries further than the word 'vegan' — modern kitchens are reviving a much older vegetable-forward table.",
    whenKoreansEatThis: "Increasingly, any day — Seoul's vegan scene has grown from a niche to a genuine dining category over the last decade.",
  },
  'halal-korean': {
    didYouKnow:
      "Seoul's halal Korean food scene grew up on Usadan-ro, the sloped street beside the Seoul Central Mosque — a neighborhood that has welcomed Muslim traders and travelers since the 1970s.",
    diningTips: [
      'Bulgogi and samgyetang are the gentlest introductions to Korean flavors — deeply savory, no spice shock.',
      'Korean dining is communal: dishes land in the middle of the table and everyone shares.',
      'Look for the KMF (Korea Muslim Federation) certificate near the counter for formal halal assurance.',
    ],
    whyLocalsLoveIt:
      "For Seoul's Muslim residents, these kitchens are less a novelty and more a lifeline — the one place a home-style Korean meal doesn't require a translated ingredient list.",
    usefulKorean: [
      { ko: '할랄 음식 있어요?', ro: 'hallal eumsik isseoyo?', en: 'Do you have halal food?' },
      { ko: '돼지고기 안 들어가요', ro: 'dwaejigogi an deureogayo', en: 'No pork in this' },
      { ko: '감사합니다', ro: 'gamsahamnida', en: 'Thank you' },
    ],
    conversationTips: [
      "Thank the kitchen for catering to halal diets — it's still rare enough outside Itaewon that staff notice and appreciate it.",
      'Ask how long the family has run the restaurant; several of these kitchens are first-generation, proud immigrant stories.',
    ],
    passportMission: { title: 'Hear the Family Story', detail: 'Ask how long the family has run this kitchen. Many are first-generation, and the answer is usually the best thing you take home.' },
    culturalMeaning: 'These kitchens represent a quiet negotiation between Korean home cooking and Islamic dietary law — proof the two were never as far apart as they seemed.',
    whenKoreansEatThis: "For Seoul's Muslim community, this is simply weekday dinner — for visitors, it's often a first bridge into Korean flavors.",
  },
  'world-halal': {
    didYouKnow:
      "Incheon has been Korea's gateway for global food for over a century — its port opened the country's first Chinatown, and today its halal kitchens feed one of Korea's most international districts.",
    diningTips: [
      'Portions are made for sharing — order a few dishes for the table, Korean style.',
      'Many shops serve Korean-style pickles alongside curry and kebab — a small local fusion habit worth trying.',
    ],
    whyLocalsLoveIt:
      "Incheon's halal kitchens feed a genuinely international neighborhood — order here and you're as likely to sit next to a Korean regular as a fellow traveler.",
    usefulKorean: [
      { ko: '이거 매워요?', ro: 'igeo maewoyo?', en: 'Is this spicy?' },
      { ko: '포장이요', ro: 'pojang-iyo', en: 'To go, please' },
      { ko: '물 좀 주세요', ro: 'mul jom juseyo', en: 'Water, please' },
    ],
    conversationTips: [
      "Ask what's different about the Incheon version of the dish versus back home — port-city kitchens often adapt recipes for local ingredients.",
      "Incheon's halal scene is small enough that owners often know each other — ask for another recommendation nearby.",
    ],
    passportMission: { title: 'Ask for the Next One', detail: "Incheon's halal owners tend to know each other. Ask where they eat on their day off, and follow it." },
    culturalMeaning: "Incheon's halal kitchens are living proof of a port city's job: absorbing the world's food and making room for it at the table.",
    whenKoreansEatThis: "Lunch break for the international workers and students who make up Incheon's most diverse districts.",
  },
  'zero-waste': {
    didYouKnow:
      // The one hard number in this file. Checked against
      // wikipedia-recycling-kr in src/content/sources.js: 95%, and separating
      // food waste has been mandatory since 2013. That source documents
      // biodegradable bags, with RFID bins in Seoul, so the sentence no longer
      // says every household uses bins.
      'Korea recycles about 95% of its food waste, and separating it has been mandatory since 2013 — households pay by weight, through designated bags or a card-operated bin. Zero-waste cafes take the next step: nothing disposable crosses the counter in the first place.',
    diningTips: [
      'Bring your own tumbler or container — most zero-waste shops offer a small discount for it.',
      'Root-to-leaf cooking means unfamiliar parts of vegetables may appear on your plate. Trust the kitchen.',
    ],
    whyLocalsLoveIt:
      "Regulars bring their own containers without being asked — it's less a marketing angle here and more an actual habit the neighborhood has picked up.",
    usefulKorean: [
      { ko: '텀블러 있어요', ro: 'teombeulleo isseoyo', en: 'I have my own tumbler/cup' },
      { ko: '일회용품 필요 없어요', ro: 'ilhoeyongpum piryo eopseoyo', en: "I don't need disposables" },
      { ko: '잘 먹었습니다', ro: 'jal meogeotseumnida', en: 'That was a good meal (said after eating)' },
    ],
    conversationTips: [
      "Ask what happens to the food scraps — Korea's food-waste recycling system surprises most first-time visitors.",
      'Bring a reusable cup if you have one; most zero-waste spots quietly reward it with a small discount.',
    ],
    passportMission: { title: 'Leave Nothing Behind', detail: 'Refuse one disposable item — cup, bag, straw. Ask what happens to the food scraps while you are at it.' },
    culturalMeaning: 'Zero-waste dining reflects a very Korean instinct for thrift and resourcefulness, now aimed at the climate instead of just the wallet.',
    whenKoreansEatThis: 'Whenever a diner wants their meal to leave as little behind as it can — a growing everyday choice, not a special occasion.',
  },
  'brunch-bakery': {
    didYouKnow:
      "Seoul has one of the highest cafe densities on earth, and the weekend brunch is closer to a ritual than a meal. Korea's version leans on seasonal vegetables and slow baking rather than heavy sauces.",
    diningTips: [
      'Cafes are lingering spaces in Korea — one drink comfortably buys you the seat for the afternoon.',
      'Ask what was baked today; small-batch bakeries sell out of their best items before noon.',
    ],
    whyLocalsLoveIt:
      "Seoul treats weekend brunch as a destination, not a meal — locals will cross the city for a bakery that sold out by noon last week.",
    usefulKorean: [
      { ko: '오늘 뭐가 맛있어요?', ro: 'oneul mwoga masisseoyo?', en: "What's good today?" },
      { ko: '여기서 먹을게요', ro: 'yeogiseo meogeulgeyo', en: "I'll eat here (not takeout)" },
      { ko: '커피 한 잔이요', ro: 'keopi han janiyo', en: 'One coffee, please' },
    ],
    conversationTips: [
      'Ask what was baked fresh this morning — small-batch bakeries change their lineup daily and love being asked.',
      "Cafes are a lingering culture here; nobody will rush you out after one drink.",
    ],
    passportMission: { title: 'Baked This Morning', detail: 'Ask what came out of the oven today and order that instead of what you planned. The lineup changes daily and rarely makes the menu.' },
    culturalMeaning: 'The Seoul cafe is a social institution in its own right — a place to be seen, to work, to linger, built around baking traditions borrowed and remade.',
    whenKoreansEatThis: "Weekend late mornings, almost ritually — it's when the week's slowest, most deliberate meal happens.",
  },
  'local-seasonal': {
    didYouKnow:
      "Korean cooking follows 제철 (jecheol) — 'the season's turn.' Menus quietly change as ingredients come into season, which is why locals ask 'what's good today?' instead of reading the menu.",
    diningTips: [
      'Ask what is seasonal — the best dish is often not on the printed menu.',
      'With food mileage this low, the vegetables on your plate were likely harvested within a day or two.',
    ],
    whyLocalsLoveIt:
      "Regulars don't ask for the menu — they ask what's in season, because the kitchen changes it before the printed version catches up.",
    usefulKorean: [
      { ko: '제철 음식이 뭐예요?', ro: 'jecheol eumsigi mwoyeyo?', en: "What's in season right now?" },
      { ko: '오늘의 메뉴', ro: 'oneurui menyu', en: "today's menu" },
      { ko: '잘 먹었습니다', ro: 'jal meogeotseumnida', en: 'That was a good meal (said after eating)' },
    ],
    conversationTips: [
      'Ask what\'s harvested nearby this week — 제철 (jecheol, "the season\'s turn") is a genuine point of local pride.',
      "If a dish isn't on the printed menu, ask anyway — the best seasonal item often isn't listed.",
    ],
    passportMission: { title: 'Let the Season Order', detail: 'Ask 제철 음식이 뭐예요? and order whatever comes back — even if you cannot pronounce it yet.' },
    culturalMeaning: '제철 (jecheol) dining treats the calendar as the real menu — eating in step with what the land is producing right now.',
    whenKoreansEatThis: "Whenever the season turns — the dish on your table this month won't be on it in six weeks.",
  },
};

// Short, scannable label for the category tag on cards. Kept separate from
// the category key itself so the key can stay code-shaped (kebab-case) while
// the label reads naturally.
export const CATEGORY_LABEL = {
  temple: 'Temple Cuisine',
  'korean-chinese': 'Korean-Chinese',
  'vegan-dining': 'Plant-Based',
  'halal-korean': 'Halal Korean',
  'world-halal': 'World Halal',
  'zero-waste': 'Zero-Waste',
  'brunch-bakery': 'Brunch & Bakery',
  'local-seasonal': 'Seasonal',
};

export function getCulture(place) {
  const base = cultureByCategory[place.category] ?? cultureByCategory['local-seasonal'];
  return {
    didYouKnow: place.didYouKnow ?? base.didYouKnow,
    diningTips: place.diningTips ?? base.diningTips,
    whyLocalsLoveIt: place.whyLocalsLoveIt ?? base.whyLocalsLoveIt,
    usefulKorean: place.usefulKorean ?? base.usefulKorean,
    conversationTips: place.conversationTips ?? base.conversationTips,
    passportMission: place.passportMission ?? base.passportMission,
    culturalMeaning: place.culturalMeaning ?? base.culturalMeaning,
    whenKoreansEatThis: place.whenKoreansEatThis ?? base.whenKoreansEatThis,
  };
}
