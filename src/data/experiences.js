// Reference content for the index: markets, courses, neighbourhoods and
// seasonal notes. The invented gatherings and travellers that used to live
// here are gone — this product does not show people who do not exist.
//
// Every card carries `*Ko` beside its English (2026-08-11), because the
// Places tab was 651 English words with a Korean heading on top, and the
// language setting could not touch a single one of them. Korean-only reads
// the Ko fields; the bilingual default and English-only read the originals.
// `nameKo` was already here for the markets and the seasonal dishes and is
// reused rather than duplicated.


export const courses = [
  {
    id: 'c1',
    title: 'First Timer’s Seoul Food Day',
    titleKo: '서울 첫날, 음식으로 하루',
    titleEs: 'Primer día en Seúl, comiendo',
    titleFr: "Premier jour à Séoul, en mangeant",
    titleAr: "أول يوم في سول، أكلًا",
    duration: 'Half day · 3 stops',
    durationKo: '반나절 · 3곳',
    durationEs: 'Media jornada · 3 paradas',
    durationFr: "Une demi-journée · 3 étapes",
    durationAr: "نصف يوم · 3 محطات",
    stopIds: ['osegyehyang', 'monks-butcher', 'plant-cafe'],
  },
  {
    id: 'c2',
    title: 'Halal-Friendly Seoul',
    titleKo: '할랄로 걷는 서울',
    titleEs: 'Seúl apto para halal',
    titleFr: "Séoul version halal",
    titleAr: "سول على الطريقة الحلال",
    duration: 'Half day · 3 stops',
    durationKo: '반나절 · 3곳',
    durationEs: 'Media jornada · 3 paradas',
    durationFr: "Une demi-journée · 3 étapes",
    durationAr: "نصف يوم · 3 محطات",
    stopIds: ['eid', 'makan', 'kampungku'],
  },
  {
    id: 'c3',
    title: 'Temple Cuisine & Quiet Streets',
    titleKo: '사찰음식과 조용한 거리',
    titleEs: 'Cocina de templo y calles tranquilas',
    titleFr: "Cuisine de temple et rues calmes",
    titleAr: "مطبخ المعبد والشوارع الهادئة",
    duration: 'Full day · 2 stops',
    durationKo: '하루 종일 · 2곳',
    durationEs: 'Día completo · 2 paradas',
    durationFr: "Journée entière · 2 étapes",
    durationAr: "يوم كامل · محطتان",
    stopIds: ['balwoo', 'sanchon'],
  },
];

export const featuredZones = [
  { name: 'Insadong', nameKo: '인사동', nameEs: 'Insadong', nameFr: "Insadong", nameAr: "إنسا-دونغ", zone: 'Insadong, Seoul', blurb: 'Tea houses, hanbok, temple food', blurbKo: '찻집과 한복, 사찰음식', blurbEs: 'Casas de té, hanbok, cocina de templo', blurbFr: "Maisons de thé, hanbok, cuisine de temple", blurbAr: "بيوت شاي، وهانبوك، وطعام معبد", },
  { name: 'Itaewon', nameKo: '이태원', nameEs: 'Itaewon', nameFr: "Itaewon", nameAr: "إيتايوون", zone: 'Itaewon, Seoul', blurb: 'The most international night in Seoul', blurbKo: '서울에서 가장 국제적인 밤', blurbEs: 'La noche más internacional de Seúl', blurbFr: "La nuit la plus internationale de Séoul", blurbAr: "أكثر ليالي سول عالميّة", },
  { name: 'Bukchon', nameKo: '북촌', nameEs: 'Bukchon', nameFr: "Bukchon", nameAr: "بوكتشون", zone: 'Bukchon, Seoul', blurb: 'Hanok alleys and quiet zero-waste kitchens', blurbKo: '한옥 골목과 조용한 제로웨이스트 주방들', blurbEs: 'Callejones de hanok y cocinas discretas sin residuos', blurbFr: "Ruelles de hanok et cuisines zéro déchet", blurbAr: "أزقّة هانوك ومطابخ هادئة بلا نفايات", },
  { name: 'Myeongdong', nameKo: '명동', nameEs: 'Myeongdong', nameFr: "Myeongdong", nameAr: "ميونغ-دونغ", zone: 'Myeongdong, Seoul', blurb: 'Street snacks, shopping, halal Korean', blurbKo: '길거리 간식과 쇼핑, 할랄 한식', blurbEs: 'Puestos callejeros, compras y cocina coreana halal', blurbFr: "Snacks de rue, shopping, coréen halal", blurbAr: "وجبات شارع، وتسوّق، وكوري حلال", },
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
    zoneKo: '서울 종로',
    zoneEs: 'Jongno, Seúl',
    zoneFr: "Jongno, Séoul",
    zoneAr: "جونغنو، سول",
    nameEs: 'Mercado de Gwangjang',
    nameFr: "Marché de Gwangjang",
    nameAr: "سوق غوانغجانغ",
    blurb: "One of Korea's oldest markets — a maze of bindaetteok (mung bean pancake) stalls and raw-fish counters that's been feeding Seoul for over a century.",
    blurbKo: '한국에서 가장 오래된 시장 중 하나입니다. 빈대떡 노점과 회 좌판이 미로처럼 얽혀 백 년 넘게 서울을 먹여 왔어요.',
    blurbEs: 'Uno de los mercados más antiguos de Corea: un laberinto de puestos de bindaetteok (tortita de judía mungo) y mostradores de pescado crudo que lleva más de un siglo dando de comer a Seúl.',
    blurbFr: "L'un des plus vieux marchés de Corée : un labyrinthe d'étals de bindaetteok (galette de haricots mungo) et de comptoirs de poisson cru qui nourrit Séoul depuis plus d'un siècle.",
    blurbAr: "من أقدم أسواق كوريا: متاهة من بسطات البينداتوك (فطيرة فول المونغ) ومناضد السمك النيء، تطعم سول منذ أكثر من قرن.",
  },
  {
    id: 'namdaemun',
    name: 'Namdaemun Market',
    nameKo: '남대문시장',
    zone: 'Hoehyeon, Seoul',
    zoneKo: '서울 회현',
    zoneEs: 'Hoehyeon, Seúl',
    zoneFr: "Hoehyeon, Séoul",
    zoneAr: "هويهيون، سول",
    nameEs: 'Mercado de Namdaemun',
    nameFr: "Marché de Namdaemun",
    nameAr: "سوق نامدايمون",
    blurb: "Seoul's largest traditional market, sprawling out from the old south gate — everything from street food alleys to wholesale kitchenware.",
    blurbKo: '옛 남대문에서부터 뻗어 나간 서울 최대의 전통시장입니다. 먹자골목부터 주방용품 도매까지 없는 게 없어요.',
    blurbEs: 'El mayor mercado tradicional de Seúl, extendido desde la antigua puerta sur: desde callejones de comida callejera hasta menaje de cocina al por mayor.',
    blurbFr: "Le plus grand marché traditionnel de Séoul, étalé depuis l'ancienne porte sud : des ruelles de cuisine de rue jusqu'au matériel de cuisine en gros.",
    blurbAr: "أكبر سوق تقليدي في سول، ممتدّ من البوابة الجنوبية القديمة: من أزقّة طعام الشارع إلى أدوات المطبخ بالجملة.",
  },
  {
    id: 'insadong-ssamzie',
    name: 'Insadong Ssamziegil',
    nameKo: '인사동 쌈지길',
    zone: 'Insadong, Seoul',
    zoneKo: '서울 인사동',
    zoneEs: 'Insadong, Seúl',
    zoneFr: "Insadong, Séoul",
    zoneAr: "إنسا-دونغ، سول",
    nameEs: 'Ssamziegil de Insadong',
    nameFr: "Ssamziegil à Insadong",
    nameAr: "سامزيغيل في إنسا-دونغ",
    blurb: 'A spiral of craft shops, tea houses and antique dealers built around Seoul\'s main street for traditional culture.',
    blurbKo: '전통문화의 거리 인사동에 나선형으로 올라가는 공예점과 찻집, 골동품 가게들이 모여 있습니다.',
    blurbEs: 'Una espiral de tiendas de artesanía, casas de té y anticuarios construida sobre la principal calle de cultura tradicional de Seúl.',
    blurbFr: "Une spirale de boutiques d'artisanat, de maisons de thé et d'antiquaires bâtie sur la principale rue de culture traditionnelle de Séoul.",
    blurbAr: "حلزون من محلات الحِرف وبيوت الشاي وتجّار التحف، مبنيّ على شارع سول الرئيسي للثقافة التقليدية.",
  },
  {
    id: 'sinpo',
    name: 'Sinpo International Market',
    nameKo: '신포국제시장',
    zone: 'Chinatown, Jemulpo-gu, Incheon',
    zoneKo: '인천 제물포구 차이나타운',
    zoneEs: 'Barrio chino, Jemulpo-gu, Incheon',
    zoneFr: "Quartier chinois, Jemulpo-gu, Incheon",
    zoneAr: "الحي الصيني، جيمولبو-غو، إنتشون",
    nameEs: 'Mercado Internacional de Sinpo',
    nameFr: "Marché international de Sinpo",
    nameAr: "سوق سينبو الدولي",
    blurb: "Incheon's oldest market, right by Chinatown — the birthplace street food of dakgangjeon (sweet fried chicken) and cheap, fast jajangmyeon.",
    blurbKo: '차이나타운 바로 옆, 인천에서 가장 오래된 시장입니다. 닭강정이 태어난 곳이고 싸고 빠른 짜장면의 동네이기도 해요.',
    blurbEs: 'El mercado más antiguo de Incheon, junto al barrio chino: la calle donde nació el dakgangjeong (pollo frito dulce) y donde el jajangmyeon es barato y rápido.',
    blurbFr: "Le plus vieux marché d'Incheon, juste à côté du quartier chinois : la rue où est né le dakgangjeong (poulet frit sucré) et où le jajangmyeon est bon marché et rapide.",
    blurbAr: "أقدم أسواق إنتشون، ملاصق للحي الصيني: الشارع الذي وُلد فيه الداكغانغجونغ (دجاج مقلي حلو) وحيث الجاجانغميون رخيص وسريع.",
  },
];

// Static seasonal picks, tagged by month (1-12) so Home can surface
// whichever is in season right now without any backend.
export const seasonalFoods = [
  {
    id: 'ssukguk', name: 'Ssukguk', nameKo: '쑥국', season: 'Spring', seasonKo: '봄', seasonEs: 'Primavera', seasonFr: 'Printemps', seasonAr: "شوربة شيح تعلن أول الأيام المعتدلة: مُرّة وخضراء وعشبية، لا تُباع إلا أسابيع قليلة في الربيع.", months: [3, 4, 5],
    blurb: 'A mugwort soup that marks the first mild days — bitter-green and grassy, sold only for a few spring weeks.',
    blurbKo: '처음 날이 풀릴 무렵을 알리는 쑥국입니다. 쌉싸름하고 풀 향이 나며, 봄의 몇 주 동안만 팝니다.',
    blurbEs: 'Una sopa de artemisa que marca los primeros días templados: amarga, verde y herbácea, a la venta solo unas semanas de primavera.',
    blurbFr: "Une soupe d'armoise qui marque les premiers jours doux : amère, verte et herbacée, vendue seulement quelques semaines au printemps.",
    blurbAr: "شوربة دجاج بالجينسنغ تُؤكل في أشدّ أيام السنة حرًّا: يسمّيها الكوريون 이열치열، مقاومة الحرّ بالحرّ.",
  },
  {
    id: 'samgyetang', name: 'Samgyetang', nameKo: '삼계탕', season: 'Summer', seasonKo: '여름', seasonEs: 'Verano', seasonFr: 'Été', seasonAr: "فطائر خضار وسمك تُقلى في المقلاة، تُصنع لعيد الحصاد تشوسوك وللبرودة التي تليه.", months: [6, 7, 8],
    blurb: "Ginseng chicken soup eaten on the hottest days of the year — Koreans call it 이열치열, fighting heat with heat.",
    blurbKo: '일 년 중 가장 더운 날에 먹는 인삼 닭국입니다. 이열치열, 더위를 더위로 이긴다고 하죠.',
    blurbEs: 'Sopa de pollo con ginseng que se come los días más calurosos del año: los coreanos lo llaman 이열치열, combatir el calor con calor.',
    blurbFr: "Une soupe de poulet au ginseng qu'on mange les jours les plus chauds de l'année : les Coréens appellent cela 이열치열, combattre le chaud par le chaud.",
    blurbAr: "صناعة الكيمتشي الجماعية مرة في السنة، تملأ مؤونة العائلة المخمّرة للشتاء كلّه.",
  },
  {
    id: 'jeon', name: 'Autumn Jeon', nameKo: '전', season: 'Fall', seasonKo: '가을', seasonEs: 'Otoño', seasonFr: 'Automne', seasonAr: "من منتصف تموز إلى أواخره", months: [9, 10, 11],
    blurb: 'Pan-fried vegetable and fish pancakes, made for the harvest holiday Chuseok and the cooling weather after it.',
    blurbKo: '채소와 생선을 부쳐 낸 전입니다. 추석에 맞춰, 그리고 그 뒤로 선선해지는 날씨에 맞춰 부칩니다.',
    blurbEs: 'Tortitas de verdura y pescado a la sartén, hechas para Chuseok, la fiesta de la cosecha, y para el fresco que llega después.',
    blurbFr: "Des galettes de légumes et de poisson poêlées, faites pour Chuseok, la fête des récoltes, et pour la fraîcheur qui suit.",
    blurbAr: "بلدة شاطئية على الساحل الغربي تُسلَّم لزلّاقات الطين والمصارعة في الطين والحفلات في الهواء الطلق.",
  },
  {
    id: 'kimjang', name: 'Kimjang Kimchi', nameKo: '김장', season: 'Winter', seasonKo: '겨울', seasonEs: 'Invierno', seasonFr: 'Hiver', seasonAr: "من أواخر أيلول إلى أوائل تشرين الأول", months: [12, 1, 2],
    blurb: "The once-a-year communal kimchi-making that stocks a family's fermented vegetables for the whole winter.",
    blurbKo: '한 해에 한 번, 온 가족이 모여 겨우내 먹을 김치를 담그는 일입니다.',
    blurbEs: 'La elaboración comunitaria de kimchi que se hace una vez al año y llena la despensa de fermentados de una familia para todo el invierno.',
    blurbFr: "La fabrication collective du kimchi, une fois l'an, qui remplit les réserves fermentées d'une famille pour tout l'hiver.",
    blurbAr: "رقصات أقنعة هاهوي التقليدية وعروض فولكلورية في قرية مدرجة على قائمة اليونسكو.",
  },
];

// Well-known recurring Korean festivals, shown as general cultural context
// rather than dated listings — exact 2026 schedules are not something this
// app can verify, so months are given loosely.
export const festivals = [
  {
    id: 'boryeong-mud', name: 'Boryeong Mud Festival', nameKo: '보령머드축제',
    when: 'Mid-to-late July', whenKo: '7월 중순~하순',
    whenEs: 'De mediados a finales de julio',
    whenFr: "De mi-juillet à fin juillet",
    whenAr: "تشرين الأول",
    blurb: 'A beach town given over to mud slides, mud wrestling and open-air concerts on the west coast.',
    blurbKo: '서해안의 해수욕장 하나가 통째로 머드 슬라이드와 머드 씨름, 야외 공연장이 됩니다.',
    blurbEs: 'Un pueblo de playa de la costa oeste entregado a toboganes de barro, lucha en el barro y conciertos al aire libre.',
    blurbFr: "Une station balnéaire de la côte ouest livrée aux toboggans de boue, à la lutte dans la boue et aux concerts en plein air.",
    blurbAr: "آلاف الفوانيس العائمة تُضاء على نهر نامغانغ بعد المغيب.",
  },
  {
    id: 'andong-mask', name: 'Andong Mask Dance Festival', nameKo: '안동국제탈춤페스티벌',
    when: 'Late September – early October', whenKo: '9월 말~10월 초',
    whenEs: 'De finales de septiembre a principios de octubre',
    whenFr: "De fin septembre à début octobre",
    whenAr: "تشرين الثاني",
    blurb: 'Traditional Hahoe mask dances and folk performances in a UNESCO-listed village.',
    blurbKo: '유네스코에 등재된 마을에서 하회탈춤과 민속 공연이 열립니다.',
    blurbEs: 'Danzas tradicionales con máscaras de Hahoe y espectáculos folclóricos en un pueblo declarado por la UNESCO.',
    blurbFr: "Danses masquées traditionnelles de Hahoe et spectacles folkloriques dans un village classé à l'UNESCO.",
    blurbAr: "منحوتات فوانيس ضخمة مضاءة على امتداد جدول تشونغيتشون في قلب سول.",
  },
  {
    id: 'jinju-lantern', name: 'Jinju Namgang Yudeung Festival', nameKo: '진주남강유등축제',
    when: 'October', whenKo: '10월',
    whenEs: 'Octubre',
    whenFr: "Octobre",
    whenAr: "الربيع",
    blurb: 'Thousands of floating lanterns lit across the Namgang River after dark.',
    blurbKo: '해가 지면 남강 위로 수천 개의 유등에 불이 들어옵니다.',
    blurbEs: 'Miles de faroles flotantes encendidos sobre el río Namgang al caer la noche.',
    blurbFr: "Des milliers de lanternes flottantes allumées sur la rivière Namgang à la tombée de la nuit.",
    blurbAr: "الصيف",
  },
  {
    id: 'seoul-lantern', name: 'Seoul Lantern Festival', nameKo: '서울빛초롱축제',
    when: 'November', whenKo: '11월',
    whenEs: 'Noviembre',
    whenFr: "Novembre",
    whenAr: "الخريف",
    blurb: "Giant illuminated lantern sculptures line the Cheonggyecheon stream through downtown Seoul.",
    blurbKo: '도심 청계천을 따라 거대한 등 조형물에 불이 켜집니다.',
    blurbEs: 'Enormes esculturas de faroles iluminadas a lo largo del arroyo Cheonggyecheon, en pleno centro de Seúl.',
    blurbFr: "De gigantesques sculptures de lanternes illuminées le long du ruisseau Cheonggyecheon, en plein centre de Séoul.",
    blurbAr: "الشتاء",
  },
];
