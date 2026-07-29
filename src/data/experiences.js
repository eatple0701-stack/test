// Reference content for the index: markets, courses, neighbourhoods and
// seasonal notes. The invented gatherings and travellers that used to live
// here are gone — this product does not show people who do not exist.


export const courses = [
  {
    id: 'c1',
    title: 'First Timer’s Seoul Food Day',
    duration: 'Half day · 3 stops',
    stopIds: ['osegyehyang', 'monks-butcher', 'plant-cafe'],
  },
  {
    id: 'c2',
    title: 'Halal-Friendly Seoul',
    duration: 'Half day · 3 stops',
    stopIds: ['eid', 'makan', 'kampungku'],
  },
  {
    id: 'c3',
    title: 'Temple Cuisine & Quiet Streets',
    duration: 'Full day · 2 stops',
    stopIds: ['balwoo', 'sanchon'],
  },
];

export const featuredZones = [
  { name: 'Insadong', zone: 'Insadong, Seoul', blurb: 'Tea houses, hanbok, temple food' },
  { name: 'Itaewon', zone: 'Itaewon, Seoul', blurb: 'The most international night in Seoul' },
  { name: 'Bukchon', zone: 'Bukchon, Seoul', blurb: 'Hanok alleys and quiet zero-waste kitchens' },
  { name: 'Myeongdong', zone: 'Myeongdong, Seoul', blurb: 'Street snacks, shopping, halal Korean' },
];

// Restaurants set aside from the main spotlight — quieter, regulars-only
// places worth surfacing on their own row rather than folded into the
// general "popular" picks.
export const hiddenGemIds = ['sanchon', 'nono-shop', 'maji', 'arabesque'];

// A slower-paced set for weekend browsing — brunch/bakery and zero-waste
// spots suit a lingering weekend visit better than a weekday lunch spot.
export const weekendPickIds = ['iryonghal', 'meat-morning', 'nono-shop', 'chaeyuk-songdo'];

// Markets are not restaurant records (no menu, hours or dietary facts to
// verify), so they live here as short editorial cards rather than in
// restaurants.js. Each `zone` matches a real restaurant zone so "Explore
// nearby" always lands on an actual, populated list.
export const traditionalMarkets = [
  {
    id: 'gwangjang',
    name: 'Gwangjang Market',
    nameKo: '광장시장',
    zone: 'Jongno, Seoul',
    blurb: "One of Korea's oldest markets — a maze of bindaetteok (mung bean pancake) stalls and raw-fish counters that's been feeding Seoul for over a century.",
  },
  {
    id: 'namdaemun',
    name: 'Namdaemun Market',
    nameKo: '남대문시장',
    zone: 'Hoehyeon, Seoul',
    blurb: "Seoul's largest traditional market, sprawling out from the old south gate — everything from street food alleys to wholesale kitchenware.",
  },
  {
    id: 'insadong-ssamzie',
    name: 'Insadong Ssamziegil',
    nameKo: '인사동 쌈지길',
    zone: 'Insadong, Seoul',
    blurb: 'A spiral of craft shops, tea houses and antique dealers built around Seoul\'s main street for traditional culture.',
  },
  {
    id: 'sinpo',
    name: 'Sinpo International Market',
    nameKo: '신포국제시장',
    zone: 'Chinatown, Jemulpo-gu, Incheon',
    blurb: "Incheon's oldest market, right by Chinatown — the birthplace street food of dakgangjeon (sweet fried chicken) and cheap, fast jajangmyeon.",
  },
];

// Static seasonal picks, tagged by month (1-12) so Home can surface
// whichever is in season right now without any backend.
export const seasonalFoods = [
  { id: 'ssukguk', name: 'Ssukguk', nameKo: '쑥국', season: 'Spring', months: [3, 4, 5], blurb: 'A mugwort soup that marks the first mild days — bitter-green and grassy, sold only for a few spring weeks.' },
  { id: 'samgyetang', name: 'Samgyetang', nameKo: '삼계탕', season: 'Summer', months: [6, 7, 8], blurb: "Ginseng chicken soup eaten on the hottest days of the year — Koreans call it 이열치열, fighting heat with heat." },
  { id: 'jeon', name: 'Autumn Jeon', nameKo: '전', season: 'Fall', months: [9, 10, 11], blurb: 'Pan-fried vegetable and fish pancakes, made for the harvest holiday Chuseok and the cooling weather after it.' },
  { id: 'kimjang', name: 'Kimjang Kimchi', nameKo: '김장', season: 'Winter', months: [12, 1, 2], blurb: "The once-a-year communal kimchi-making that stocks a family's fermented vegetables for the whole winter." },
];

// Well-known recurring Korean festivals, shown as general cultural context
// rather than dated listings — exact 2026 schedules are not something this
// app can verify, so months are given loosely.
export const festivals = [
  { id: 'boryeong-mud', name: 'Boryeong Mud Festival', nameKo: '보령머드축제', when: 'Mid-to-late July', blurb: 'A beach town given over to mud slides, mud wrestling and open-air concerts on the west coast.' },
  { id: 'andong-mask', name: 'Andong Mask Dance Festival', nameKo: '안동국제탈춤페스티벌', when: 'Late September – early October', blurb: 'Traditional Hahoe mask dances and folk performances in a UNESCO-listed village.' },
  { id: 'jinju-lantern', name: 'Jinju Namgang Yudeung Festival', nameKo: '진주남강유등축제', when: 'October', blurb: 'Thousands of floating lanterns lit across the Namgang River after dark.' },
  { id: 'seoul-lantern', name: 'Seoul Lantern Festival', nameKo: '서울빛초롱축제', when: 'November', blurb: "Giant illuminated lantern sculptures line the Cheonggyecheon stream through downtown Seoul." },
];
