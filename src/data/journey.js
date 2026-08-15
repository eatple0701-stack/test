// The journey layer: what turns a list of restaurants into a trip.
//
// Everything here is computed from state the app actually holds — visited
// bookmarks, matched companions, checked-off markets. Nothing invents a
// number. A challenge is "complete" only because the user's own records say
// so, which is what makes the Passport worth anything.

// Extensions are explicit so this module can be imported under plain Node,
// matching the convention restaurants.js sets for the same reason. Vite
// resolves extensionless specifiers; Node's native ESM loader does not.
import { restaurants } from './restaurants.js';
import { traditionalMarkets } from './experiences.js';

// Story-first entry points. A traveler picks "what Korean culture do I want
// to experience today?" before "what do I eat?" — each theme resolves to
// real records already in the dataset, never to a wish list.
export const CULTURAL_THEMES = [
  {
    id: 'temple-table',
    emoji: '🪷',
    title: 'Eat like a monk',
    blurb: 'Temple cuisine — no garlic, no onion, no hurry.',
    categories: ['temple'],
  },
  {
    id: 'noodle-road',
    emoji: '🍜',
    title: 'Follow the noodle road',
    blurb: "Jajangmyeon's journey from Incheon's docks to every Korean kitchen.",
    categories: ['korean-chinese'],
  },
  {
    id: 'open-table',
    emoji: '🌙',
    title: 'Seoul’s open table',
    blurb: 'Halal kitchens that made room for everyone at a Korean meal.',
    categories: ['halal-korean', 'world-halal'],
  },
  {
    id: 'nothing-wasted',
    emoji: '♻️',
    title: 'Nothing wasted',
    blurb: 'Zero-waste counters and plant-forward kitchens.',
    categories: ['zero-waste', 'vegan-dining'],
  },
  {
    id: 'seasons-turn',
    emoji: '🌾',
    title: 'The season’s turn',
    blurb: '제철 — menus that change before the printed version catches up.',
    categories: ['local-seasonal', 'brunch-bakery'],
  },
];

export function placesForTheme(theme) {
  return restaurants.filter(r => theme.categories.includes(r.category));
}

// "Continue Your Journey" — where a meal leads next. Steps point at real
// records where one exists (`placeCategory`, `marketId`); where the next
// step is an experience the dataset does not cover, it is phrased as a
// suggestion with the zone attached, never as a venue we vouch for.
const ROUTE_BY_CATEGORY = {
  temple: [
    { label: 'Tea house in Insadong', labelKo: "인사동 찻집", labelEs: "Casa de té en Insadong", labelFr: "Maison de thé à Insadong", labelAr: "بيت شاي في إنسا-دونغ", labelZh: "仁寺洞的茶馆", labelJa: "仁寺洞の茶館", note: 'Sit with a pot of jujube tea after the meal.', noteKo: "식사 뒤에 대추차 한 주전자를 놓고 앉아 보세요.", noteEs: "Siéntate con una tetera de té de azufaifa después de comer.", noteFr: "Asseyez-vous avec une théière de thé au jujube après le repas.", noteAr: "اجلس مع إبريق شاي العنّاب بعد الطعام.", noteZh: "饭后坐下来，配一壶枣茶。", noteJa: "食後にナツメ茶をひと壺、座って。", zone: 'Insadong, Seoul' },
    { label: 'Insadong Ssamziegil', labelKo: "인사동 쌈지길", labelEs: "Ssamziegil de Insadong", labelFr: "Ssamziegil à Insadong", labelAr: "سامزيغيل في إنسا-دونغ", labelZh: "仁寺洞人人街", labelJa: "仁寺洞サムジキル", note: 'A spiral of craft shops above the main street.', noteKo: "큰길 위로 올라가는 공예점들의 나선.", noteEs: "Una espiral de tiendas de artesanía sobre la calle principal.", noteFr: "Une spirale de boutiques d'artisanat au-dessus de la rue principale.", noteAr: "حلزون من محلات الحِرف فوق الشارع الرئيسي.", noteZh: "主街之上盘旋而起的一串手工艺店。", noteJa: "大通りの上へ螺旋に伸びる工芸店の連なり。", marketId: 'insadong-ssamzie' },
    { label: 'Another temple table', labelKo: "또 다른 절 밥상", labelEs: "Otra mesa de templo", labelFr: "Une autre table de temple", labelAr: "مائدة معبد أخرى", labelZh: "另一张寺院的饭桌", labelJa: "もう一軒の寺の食卓", note: 'Compare two kitchens working from the same doctrine.', noteKo: "같은 가르침에서 나온 두 주방을 견줘 보세요.", noteEs: "Compara dos cocinas que trabajan desde la misma doctrina.", noteFr: "Comparez deux cuisines qui travaillent depuis la même doctrine.", noteAr: "قارن مطبخين يعملان من العقيدة نفسها.", noteZh: "比一比两个从同一套教义里长出来的厨房。", noteJa: "同じ教えから出た二つの厨房を比べてみてください。", placeCategory: 'temple' },
  ],
  'korean-chinese': [
    { label: 'Sinpo International Market', labelKo: "신포국제시장", labelEs: "Mercado Internacional de Sinpo", labelFr: "Marché international de Sinpo", labelAr: "سوق سينبو الدولي", labelZh: "新浦国际市场", labelJa: "新浦国際市場", note: "Where Incheon's street food grew up beside Chinatown.", noteKo: "인천의 길거리 음식이 차이나타운 옆에서 자란 곳.", noteEs: "Donde creció la comida callejera de Incheon, junto al barrio chino.", noteFr: "Là où la cuisine de rue d'Incheon a grandi, à côté du quartier chinois.", noteAr: "حيث كبر طعام شارع إنتشون، بجوار الحي الصيني.", noteZh: "仁川的街头小吃在这里长大，就挨着中华街。", noteJa: "チャイナタウンの隣で、仁川の屋台の食べものが育った場所。", marketId: 'sinpo' },
    { label: 'Jajangmyeon Museum', labelKo: "짜장면 박물관", labelEs: "Museo del Jajangmyeon", labelFr: "Musée du jajangmyeon", labelAr: "متحف الجاجانغميون", labelZh: "炸酱面博物馆", labelJa: "チャジャンミョン博物館", note: "Next door to Gonghwachun — the dish's own birthplace.", noteKo: "공화춘 바로 옆 — 이 음식이 태어난 자리입니다.", noteEs: "Justo al lado de Gonghwachun: el lugar donde nació el plato.", noteFr: "À côté du Gonghwachun — le lieu de naissance du plat lui-même.", noteAr: "بجانب غونغهواتشون — مسقط رأس الطبق نفسه.", noteZh: "就在共和春隔壁——这道菜自己的出生地。", noteJa: "共和春のすぐ隣——この料理自身の生まれた場所です。", zone: 'Chinatown, Jemulpo-gu, Incheon' },
    { label: 'A plant-based version', labelKo: "식물성 버전", labelEs: "Una versión vegetal", labelFr: "Une version végétale", labelAr: "نسخة نباتية", labelZh: "一个植物性的版本", labelJa: "菜食の版", note: 'The same comfort classics, rebuilt without meat.', noteKo: "같은 위로의 음식들을, 고기 없이 다시 만든 것.", noteEs: "Los mismos clásicos reconfortantes, reconstruidos sin carne.", noteFr: "Les mêmes classiques réconfortants, refaits sans viande.", noteAr: "الكلاسيكيات المريحة نفسها، مُعاد بناؤها بلا لحم.", noteZh: "同样让人安心的经典，只是重做时不用肉。", noteJa: "同じ安心できる定番を、肉なしで組み直したもの。", placeCategory: 'vegan-dining' },
  ],
  'halal-korean': [
    { label: 'Seoul Central Mosque', labelKo: "서울중앙성원", labelEs: "Mezquita Central de Seúl", labelFr: "Grande Mosquée de Séoul", labelAr: "مسجد سول المركزي", labelZh: "首尔中央清真寺", labelJa: "ソウル中央聖院", note: 'The hillside the whole neighborhood grew around.', noteKo: "이 동네 전체가 그 언덕을 중심으로 자랐습니다.", noteEs: "La ladera alrededor de la que creció todo el barrio.", noteFr: "La colline autour de laquelle tout le quartier a poussé.", noteAr: "التلّة التي نما حولها الحيّ كلّه.", noteZh: "整个街区都是围着这面坡长起来的。", noteJa: "この界隈がまわりに育っていった坂。", zone: 'Itaewon, Seoul' },
    { label: 'Namdaemun Market', labelKo: "남대문시장", labelEs: "Mercado de Namdaemun", labelFr: "Marché de Namdaemun", labelAr: "سوق نامدايمون", labelZh: "南大门市场", labelJa: "南大門市場", note: 'Street food alleys and the old south gate.', noteKo: "먹자골목과 옛 남대문.", noteEs: "Callejones de comida callejera y la antigua puerta sur.", noteFr: "Des ruelles de cuisine de rue et l'ancienne porte sud.", noteAr: "أزقّة طعام الشارع والبوابة الجنوبية القديمة.", noteZh: "小吃巷子，和那座旧的南大门。", noteJa: "屋台の路地と、旧・南大門。", marketId: 'namdaemun' },
    { label: 'World halal in Incheon', labelKo: "인천의 세계 할랄", labelEs: "Halal del mundo en Incheon", labelFr: "Halal du monde à Incheon", labelAr: "حلال من العالم في إنتشون", labelZh: "仁川的各国清真", labelJa: "仁川の各国ハラール", note: 'Follow the same thread to a port-city kitchen.', noteKo: "같은 실을 따라 항구 도시의 주방으로.", noteEs: "Sigue el mismo hilo hasta una cocina de ciudad portuaria.", noteFr: "Suivez le même fil jusqu'à une cuisine de ville portuaire.", noteAr: "اتبع الخيط نفسه إلى مطبخ مدينة ميناء.", noteZh: "顺着同一条线，走到一间港口城市的厨房。", noteJa: "同じ糸をたどって、港町の厨房へ。", placeCategory: 'world-halal' },
  ],
  'world-halal': [
    { label: 'Sinpo International Market', labelKo: "신포국제시장", labelEs: "Mercado Internacional de Sinpo", labelFr: "Marché international de Sinpo", labelAr: "سوق سينبو الدولي", labelZh: "新浦国际市场", labelJa: "新浦国際市場", note: "Incheon's oldest market, minutes from Chinatown.", noteKo: "차이나타운에서 몇 분, 인천에서 가장 오래된 시장.", noteEs: "El mercado más antiguo de Incheon, a minutos del barrio chino.", noteFr: "Le plus vieux marché d'Incheon, à quelques minutes du quartier chinois.", noteAr: "أقدم أسواق إنتشون، على بُعد دقائق من الحي الصيني.", noteZh: "仁川最老的市场，离中华街几分钟。", noteJa: "仁川でもっとも古い市場、チャイナタウンから数分。", marketId: 'sinpo' },
    { label: 'Halal Korean in Seoul', labelKo: "서울의 할랄 한식", labelEs: "Cocina coreana halal en Seúl", labelFr: "Coréen halal à Séoul", labelAr: "كوري حلال في سول", labelZh: "首尔的清真韩餐", labelJa: "ソウルのハラール韓国料理", note: 'See how Korean home cooking adapts to the same rules.', noteKo: "한국의 집밥이 같은 규칙에 어떻게 맞춰지는지 보세요.", noteEs: "Mira cómo la cocina casera coreana se adapta a las mismas reglas.", noteFr: "Voyez comment la cuisine familiale coréenne s'adapte aux mêmes règles.", noteAr: "انظر كيف يتكيّف الطبخ البيتي الكوري مع القواعد نفسها.", noteZh: "看看韩国的家常菜怎么适应同一套规矩。", noteJa: "韓国の家庭料理が同じ規範にどう合わせるかを見てください。", placeCategory: 'halal-korean' },
    { label: 'Songdo waterfront', labelKo: "송도 워터프런트", labelEs: "El paseo marítimo de Songdo", labelFr: "Front de mer de Songdo", labelAr: "واجهة سونغدو البحرية", labelZh: "松岛海滨", labelJa: "松島のウォーターフロント", note: 'A built-from-nothing skyline worth an evening walk.', noteKo: "맨땅에서 세운 스카이라인, 저녁 산책으로 좋습니다.", noteEs: "Un horizonte levantado de la nada, digno de un paseo al atardecer.", noteFr: "Une skyline sortie de rien, qui vaut une promenade du soir.", noteAr: "أفق نشأ من لا شيء، يستحق نزهة مساء.", noteZh: "一条从无到有长出来的天际线，值得一个傍晚的散步。", noteJa: "何もないところから立ち上がった稜線。夕方の散歩に値します。", zone: 'Songdo, Incheon' },
  ],
  'vegan-dining': [
    { label: 'A zero-waste counter', labelKo: "제로웨이스트 가게", labelEs: "Un mostrador sin residuos", labelFr: "Un comptoir zéro déchet", labelAr: "منضدة بلا نفايات", labelZh: "一个零废弃的柜台", labelJa: "使い捨てのないカウンター", note: 'Take the idea one step further — nothing disposable.', noteKo: "한 걸음 더 — 일회용품이 아예 없습니다.", noteEs: "Un paso más allá: nada desechable.", noteFr: "Poussez l'idée d'un cran — rien de jetable.", noteAr: "ادفع الفكرة خطوة أبعد — لا شيء يُرمى.", noteZh: "把这个念头再往前推一步——什么都不扔。", noteJa: "その考えをもう一歩——使い捨てはひとつもなし。", placeCategory: 'zero-waste' },
    { label: 'Gwangjang Market', labelKo: "광장시장", labelEs: "Mercado de Gwangjang", labelFr: "Marché de Gwangjang", labelAr: "سوق غوانغجانغ", labelZh: "广藏市场", labelJa: "広蔵市場", note: 'Watch bindaetteok batter hit the pan.', noteKo: "빈대떡 반죽이 팬에 닿는 걸 지켜보세요.", noteEs: "Mira cómo la masa de bindaetteok cae en la sartén.", noteFr: "Regardez la pâte à bindaetteok tomber sur la plaque.", noteAr: "شاهد عجينة البينداتوك تلامس الصفيحة.", noteZh: "看着绿豆糊落到铁板上。", noteJa: "ピンデトクの生地が鉄板に落ちるのを見てください。", marketId: 'gwangjang' },
    { label: 'Temple cuisine', labelKo: "사찰음식", labelEs: "Cocina de templo", labelFr: "Cuisine de temple", labelAr: "مطبخ المعبد", labelZh: "寺院饮食", labelJa: "寺の料理", note: 'The centuries-old root of Korean plant-based cooking.', noteKo: "한국 식물성 요리의 수백 년 된 뿌리.", noteEs: "La raíz centenaria de la cocina vegetal coreana.", noteFr: "La racine, vieille de plusieurs siècles, de la cuisine végétale coréenne.", noteAr: "الجذر الذي يعود قرونًا للطبخ النباتي الكوري.", noteZh: "韩国植物性烹饪那条几百年的根。", noteJa: "韓国の菜食の、何百年もさかのぼる根。", placeCategory: 'temple' },
  ],
  'zero-waste': [
    { label: 'Namdaemun Market', labelKo: "남대문시장", labelEs: "Mercado de Namdaemun", labelFr: "Marché de Namdaemun", labelAr: "سوق نامدايمون", labelZh: "南大门市场", labelJa: "南大門市場", note: 'Bring your own bag and shop the old way.', noteKo: "장바구니를 들고 옛날 방식으로 장을 보세요.", noteEs: "Lleva tu bolsa y compra a la vieja usanza.", noteFr: "Apportez votre sac et faites vos courses à l'ancienne.", noteAr: "أحضِر كيسك وتسوّق على الطريقة القديمة.", noteZh: "自己带上袋子，用老办法买东西。", noteJa: "自分の袋を持って、昔ながらのやり方で買ってください。", marketId: 'namdaemun' },
    { label: 'Bukchon hanok alleys', labelKo: "북촌 한옥 골목", labelEs: "Callejones de hanok de Bukchon", labelFr: "Ruelles de hanok à Bukchon", labelAr: "أزقّة الهانوك في بوكتشون", labelZh: "北村的韩屋巷子", labelJa: "北村の韓屋の路地", note: 'Tiled roofs and quiet lanes on foot.', noteKo: "기와지붕과 조용한 골목을 걸어서.", noteEs: "Tejados de teja y callejones tranquilos, a pie.", noteFr: "Toits de tuiles et venelles tranquilles, à pied.", noteAr: "سقوف قرميد وأزقّة هادئة، سيرًا على الأقدام.", noteZh: "瓦顶和安静的小路，走着看。", noteJa: "瓦屋根と静かな小道を、歩いて。", zone: 'Bukchon, Seoul' },
    { label: 'A plant-based kitchen', labelKo: "식물성 주방", labelEs: "Una cocina vegetal", labelFr: "Une cuisine végétale", labelAr: "مطبخ نباتي", labelZh: "一间植物性厨房", labelJa: "菜食の厨房", note: 'Same instinct, applied to the plate.', noteKo: "같은 감각을, 접시 위에 적용한 것.", noteEs: "El mismo instinto, aplicado al plato.", noteFr: "Le même instinct, appliqué à l'assiette.", noteAr: "الغريزة نفسها، مطبَّقة على الصحن.", noteZh: "同一种本能，落在盘子上。", noteJa: "同じ本能を、皿の上に。", placeCategory: 'vegan-dining' },
  ],
  'brunch-bakery': [
    { label: 'A seasonal kitchen', note: 'Ask what the season turned up this week.', placeCategory: 'local-seasonal' },
    { label: 'Gwangjang Market', labelKo: "광장시장", labelEs: "Mercado de Gwangjang", labelFr: "Marché de Gwangjang", labelAr: "سوق غوانغجانغ", labelZh: "广藏市场", labelJa: "広蔵市場", note: 'Trade the quiet cafe for a loud market counter.', noteKo: "조용한 카페 대신 시끄러운 시장 좌판으로.", noteEs: "Cambia la cafetería tranquila por una ruidosa barra de mercado.", noteFr: "Échangez le café tranquille contre un comptoir de marché bruyant.", noteAr: "استبدل المقهى الهادئ بمنضدة سوق صاخبة.", noteZh: "把安静的咖啡馆换成吵闹的市场柜台。", noteJa: "静かなカフェを、騒がしい市場のカウンターと取り替えて。", marketId: 'gwangjang' },
    { label: 'Han River walk', labelKo: '한강 산책', labelEs: 'Paseo por el río Han', labelFr: "Promenade sur le Han", labelAr: "نزهة على نهر هان", labelZh: "汉江边散步", labelJa: "漢江の散歩", note: 'The city\'s default afternoon, and it costs nothing.', noteKo: '이 도시의 기본값 같은 오후이고, 돈이 들지 않습니다.', noteEs: 'La tarde por defecto de la ciudad, y no cuesta nada.', noteFr: "L'après-midi par défaut de la ville, et cela ne coûte rien.", noteAr: "بعد ظهر المدينة الافتراضي، ولا يكلّف شيئًا.", noteZh: "这座城市默认的下午，而且不花钱。", noteJa: "この街の既定の午後。しかもお金がかかりません。", zone: 'Seoul' },
  ],
  'local-seasonal': [
    { label: 'Gwangjang Market', labelKo: "광장시장", labelEs: "Mercado de Gwangjang", labelFr: "Marché de Gwangjang", labelAr: "سوق غوانغجانغ", labelZh: "广藏市场", labelJa: "広蔵市場", note: 'See the same seasonal produce at its source.', noteKo: "같은 제철 재료를 산지에서 보세요.", noteEs: "Ve el mismo producto de temporada en su origen.", noteFr: "Voyez les mêmes produits de saison à la source.", noteAr: "شاهد محاصيل الموسم نفسها في مصدرها.", noteZh: "在源头看看同样这些当季的东西。", noteJa: "同じ旬のものを、その出どころで見てください。", marketId: 'gwangjang' },
    { label: 'A temple table', labelKo: "절 밥상", labelEs: "Una mesa de templo", labelFr: "Une table de temple", labelAr: "مائدة معبد", labelZh: "一张寺院的饭桌", labelJa: "寺の食卓", note: 'Seasonality taken to its most disciplined form.', noteKo: "제철을 가장 엄격한 형태까지 밀고 간 자리.", noteEs: "La estacionalidad llevada a su forma más disciplinada.", noteFr: "La saisonnalité poussée à sa forme la plus disciplinée.", noteAr: "الموسمية مدفوعةً إلى أشدّ صورها انضباطًا.", noteZh: "把\"当季\"推到它最有纪律的形态。", noteJa: "旬というものを、もっとも規律のある形まで押し進めたもの。", placeCategory: 'temple' },
    { label: 'Weekend brunch', labelKo: "주말 브런치", labelEs: "Brunch de fin de semana", labelFr: "Brunch du week-end", labelAr: "فطور العطلة المتأخر", labelZh: "周末的早午饭", labelJa: "週末のブランチ", note: 'Slow baking, seasonal vegetables, no rush.', noteKo: "느린 베이킹, 제철 채소, 서두름 없음.", noteEs: "Horneado lento, verdura de temporada, sin prisa.", noteFr: "Cuisson lente, légumes de saison, aucune hâte.", noteAr: "خَبز بطيء، وخضار موسم، وبلا عجلة.", noteZh: "慢烘焙，时令蔬菜，不赶。", noteJa: "ゆっくりした焼き、季節の野菜、急ぎなし。", placeCategory: 'brunch-bakery' },
  ],
};

/**
 * Resolve the route for a place into concrete steps. A step that names a
 * category resolves to a real restaurant (never the one you're already on);
 * a step that names a market resolves to the market record. Steps that
 * resolve to nothing are dropped rather than rendered as dead ends.
 */
export function routeFor(place) {
  const steps = ROUTE_BY_CATEGORY[place.category] ?? ROUTE_BY_CATEGORY['local-seasonal'];
  return steps
    .map(step => {
      if (step.placeCategory) {
        const target = restaurants.find(
          r => r.category === step.placeCategory && r.id !== place.id && !r.lifecycle,
        );
        return target ? { ...step, place: target } : null;
      }
      if (step.marketId) {
        const market = traditionalMarkets.find(m => m.id === step.marketId);
        return market ? { ...step, market } : null;
      }
      return step;
    })
    .filter(Boolean);
}

// Short, practical guidance a local would actually give — kept at category
// level, like the rest of the culture content, because we have not sat in
// any individual dining room to say more than that.
export const LOCAL_TIPS = {
  temple: [
    { tag: 'Book ahead', tagKo: "미리 예약하세요", tagEs: "Reserva con antelación", tagFr: "Réservez à l'avance", tagAr: "احجز مسبقًا", tagZh: "提前订", tagJa: "先に予約する", detail: 'Dinner seatings are small and often reserved days out.', detailKo: "저녁 자리는 적고 며칠 전에 예약되는 경우가 많습니다.", detailEs: "Las mesas de cena son pocas y se reservan con días de antelación.", detailFr: "Les services du soir sont petits et souvent réservés plusieurs jours avant.", detailAr: "جلسات العشاء قليلة وتُحجز قبل أيام في الغالب.", detailZh: "晚饭的位子不多，常常提前好几天就订满了。", detailJa: "夜の席は数が少なく、何日も前に埋まることがよくあります。" },
    { tag: 'Go at lunch', tagKo: "점심에 가세요", tagEs: "Ve a la hora de comer", tagFr: "Allez-y au déjeuner", tagAr: "اذهب وقت الغداء", tagZh: "中午去", tagJa: "昼に行く", detail: 'The midday course costs noticeably less than dinner.', detailKo: "점심 코스가 저녁보다 눈에 띄게 저렴합니다.", detailEs: "El menú del mediodía cuesta bastante menos que el de la cena.", detailFr: "Le menu de midi coûte nettement moins cher que celui du soir.", detailAr: "قائمة الظهيرة أرخص بوضوح من قائمة المساء.", detailZh: "午市的套餐明显比晚上便宜。", detailJa: "昼のコースは夜よりはっきり安くなります。" },
    { tag: 'Leave time', tagKo: "시간을 넉넉히", tagEs: "Reserva tiempo", tagFr: "Prévoyez du temps", tagAr: "خصّص وقتًا", tagZh: "留出时间", tagJa: "時間をとる", detail: 'A full course runs 90 minutes. It is not a quick stop.', detailKo: "풀코스는 90분 걸립니다. 잠깐 들르는 곳이 아니에요.", detailEs: "Un menú completo dura 90 minutos. No es una parada rápida.", detailFr: "Un menu complet dure 90 minutes. Ce n'est pas une halte rapide.", detailAr: "المائدة الكاملة تستغرق تسعين دقيقة. ليست محطة عابرة.", detailZh: "一整套要九十分钟。这不是顺路一站。", detailJa: "フルコースは90分かかります。ちょっと寄る場所ではありません。" },
  ],
  'korean-chinese': [
    { tag: 'Avoid 12–1pm', tagKo: "12~1시는 피하세요", tagEs: "Evita de 12 a 13 h", tagFr: "Évitez 12h–13h", tagAr: "تجنّب 12–13", tagZh: "避开12点到1点", tagJa: "12〜13時は避ける", detail: 'Office lunch rush fills every table at once.', detailKo: "직장인 점심시간에 모든 자리가 한꺼번에 찹니다.", detailEs: "La hora de comer de las oficinas llena todas las mesas de golpe.", detailFr: "La ruée du déjeuner de bureau remplit toutes les tables d'un coup.", detailAr: "زحام غداء المكاتب يملأ كل الطاولات دفعة واحدة.", detailZh: "写字楼的午餐高峰会一下子把所有桌坐满。", detailJa: "オフィスの昼の波が、全部の卓を一度に埋めます。" },
    { tag: 'Order tangsuyuk to share', tagKo: "탕수육은 나눠 드세요", tagEs: "Pide tangsuyuk para compartir", tagFr: "Prenez un tangsuyuk à partager", tagAr: "اطلب تانغسويوك للمشاركة", tagZh: "点一份糖醋肉一起吃", tagJa: "タンスユクを取り分ける", detail: 'Locals rarely order noodles alone for two.', detailKo: "둘이서 면만 시키는 경우는 드뭅니다.", detailEs: "Los locales rara vez piden solo fideos para dos.", detailFr: "Les gens d'ici commandent rarement que des nouilles à deux.", detailAr: "نادرًا ما يطلب أهل المكان معكرونة وحدها لشخصين.", detailZh: "本地人很少两个人只点面。", detailJa: "二人で麺だけ、というのは地元ではあまりありません。" },
    { tag: 'Eat it fast', tagKo: "빨리 드세요", tagEs: "Cómelo rápido", tagFr: "Mangez vite", tagAr: "كُله بسرعة", tagZh: "快点吃", tagJa: "早めに食べる", detail: 'The noodles swell within minutes. That is the whole trick.', detailKo: "면은 몇 분이면 붇습니다. 그게 전부예요.", detailEs: "Los fideos se hinchan en minutos. Ese es todo el truco.", detailFr: "Les nouilles gonflent en quelques minutes. C'est là tout le truc.", detailAr: "تنتفخ المعكرونة خلال دقائق. وهذه كل الحيلة.", detailZh: "面几分钟就泡涨了。全部的诀窍就在这儿。", detailJa: "麺は数分でふやけます。要点はそこだけです。" },
  ],
  'vegan-dining': [
    { tag: 'Weekday lunch is calm', tagKo: "평일 점심이 한산합니다", tagEs: "El almuerzo entre semana es tranquilo", tagFr: "Le déjeuner en semaine est calme", tagAr: "غداء أيام الأسبوع هادئ", tagZh: "工作日中午很清静", tagJa: "平日の昼は静か", detail: 'Weekends fill up with the plant-based crowd.', detailKo: "주말에는 채식하는 손님들로 찹니다.", detailEs: "Los fines de semana se llena con el público vegetal.", detailFr: "Les week-ends se remplissent du public végétal.", detailAr: "العطلات تمتلئ بروّاد المطبخ النباتي.", detailZh: "周末会被吃植物性的人挤满。", detailJa: "週末は菜食の人たちで埋まります。" },
    { tag: 'Ask about the sauce', tagKo: "소스를 물어보세요", tagEs: "Pregunta por la salsa", tagFr: "Renseignez-vous sur la sauce", tagAr: "اسأل عن الصلصة", tagZh: "问一下酱", tagJa: "だしを訊く", detail: 'Anchovy stock hides in places you would not expect.', detailKo: "멸치 육수가 생각지 못한 곳에 들어 있습니다.", detailEs: "El caldo de anchoa se esconde donde no lo esperarías.", detailFr: "Le bouillon d'anchois se cache là où on ne l'attend pas.", detailAr: "مرق الأنشوجة يختبئ في مواضع لا تتوقّعها.", detailZh: "鳀鱼高汤会藏在你想不到的地方。", detailJa: "イワシのだしは思わぬところに隠れています。" },
    { tag: 'Refills are free', tagKo: "반찬 리필은 무료입니다", tagEs: "Las repeticiones son gratis", tagFr: "Les rab sont gratuits", tagAr: "إعادة التعبئة مجانية", tagZh: "续小菜是免费的", tagJa: "おかわりは無料", detail: 'Banchan comes back if you ask. Asking is a compliment.', detailKo: "말하면 반찬은 다시 나옵니다. 더 달라는 건 칭찬이에요.", detailEs: "El banchan vuelve si lo pides. Pedirlo es un cumplido.", detailFr: "Le banchan revient si vous le demandez. Le demander est un compliment.", detailAr: "يعود البانتشان إن طلبته. والطلب مجاملة.", detailZh: "开口就会再上。开口是恭维。", detailJa: "頼めばまた来ます。頼むことは褒め言葉です。" },
  ],
  'halal-korean': [
    { tag: 'Friday afternoons are busy', tagKo: "금요일 오후는 붐빕니다", tagEs: "Los viernes por la tarde hay lleno", tagFr: "Les vendredis après-midi sont chargés", tagAr: "بعد ظهر الجمعة مزدحم", tagZh: "周五下午很挤", tagJa: "金曜の午後は混む", detail: 'Prayer at the Central Mosque empties into the street.', detailKo: "중앙성원 예배가 끝나면 거리로 사람이 쏟아집니다.", detailEs: "La oración en la Mezquita Central vacía a la calle.", detailFr: "La prière à la Grande Mosquée se déverse dans la rue.", detailAr: "صلاة المسجد المركزي تتدفّق إلى الشارع.", detailZh: "中央清真寺的礼拜会涌到街上。", detailJa: "中央聖院の礼拝が通りへ流れ出します。" },
    { tag: 'Start with bulgogi', tagKo: "불고기로 시작하세요", tagEs: "Empieza por el bulgogi", tagFr: "Commencez par le bulgogi", tagAr: "ابدأ بالبولغوغي", tagZh: "从烤肉开始", tagJa: "プルコギから始める", detail: 'The gentlest way into Korean flavor — savory, not spicy.', detailKo: "한국 맛으로 들어가는 가장 부드러운 입구입니다. 짭조름하고 맵지 않아요.", detailEs: "La entrada más suave al sabor coreano: sabroso, no picante.", detailFr: "La porte la plus douce vers la saveur coréenne — savoureuse, pas piquante.", detailAr: "أرفق مدخل إلى النكهة الكورية — عميق الطعم لا حارّ.", detailZh: "进入韩国味道最温和的一条路——味厚，不辣。", detailJa: "韓国の味へのいちばん穏やかな入口——濃いけれど辛くない。" },
    { tag: 'Cash still helps', tagKo: "현금이 편할 수 있어요", tagEs: "El efectivo aún ayuda", tagFr: "Les espèces aident encore", tagAr: "النقد ما زال يساعد", tagZh: "带点现金还是有用", tagJa: "現金があると助かる", detail: 'Smaller family kitchens sometimes prefer it.', detailKo: "작은 가족 식당은 현금을 선호하기도 합니다.", detailEs: "Las cocinas familiares pequeñas a veces lo prefieren.", detailFr: "Les petites cuisines familiales les préfèrent parfois.", detailAr: "المطابخ العائلية الصغيرة تفضّله أحيانًا.", detailZh: "小的家庭厨房有时更愿意收现金。", detailJa: "小さな家族の厨房は現金を好むことがあります。" },
  ],
  'world-halal': [
    { tag: 'Order for the table', tagKo: "상 단위로 주문하세요", tagEs: "Pide para la mesa", tagFr: "Commandez pour la table", tagAr: "اطلب للطاولة", tagZh: "按桌点", tagJa: "卓ごとに頼む", detail: 'Portions are built for sharing, Korean style.', detailKo: "양이 나눠 먹도록 맞춰져 있습니다. 한국식으로요.", detailEs: "Las raciones están pensadas para compartir, al estilo coreano.", detailFr: "Les portions sont faites pour être partagées, à la coréenne.", detailAr: "الحصص مصنوعة للمشاركة، على الطريقة الكورية.", detailZh: "份量是给人分着吃的，按韩国的方式。", detailJa: "量は分け合う前提です。韓国式に。" },
    { tag: 'Ask for the pickles', tagKo: "절임을 달라고 하세요", tagEs: "Pide los encurtidos", tagFr: "Demandez les pickles", tagAr: "اطلب المخلّلات", tagZh: "要一碟泡菜", tagJa: "漬けものを頼む", detail: 'Korean-style banchan beside a curry is a local habit.', detailKo: "카레 옆에 한국식 반찬을 두는 건 현지 습관입니다.", detailEs: "El banchan coreano junto al curry es una costumbre local.", detailFr: "Du banchan coréen à côté d'un curry est une habitude locale.", detailAr: "بانتشان على الطريقة الكورية بجانب الكاري عادة محلية.", detailZh: "咖喱旁边配韩式小菜是本地的习惯。", detailJa: "カレーの横に韓国式のおかず、というのは土地の習慣です。" },
    { tag: 'Evenings are livelier', tagKo: "저녁이 더 활기찹니다", tagEs: "Las tardes son más animadas", tagFr: "Les soirées sont plus animées", tagAr: "الأمسيات أكثر حيوية", tagZh: "晚上更热闹", tagJa: "夜のほうが賑やか", detail: 'The international crowd arrives after work.', detailKo: "퇴근 후에 국제적인 손님들이 옵니다.", detailEs: "El público internacional llega después del trabajo.", detailFr: "Le public international arrive après le travail.", detailAr: "يصل الروّاد الدوليون بعد العمل.", detailZh: "国际面孔的客人下班之后才来。", detailJa: "国際的な客は仕事のあとに来ます。" },
  ],
  'zero-waste': [
    { tag: 'Bring a tumbler', tagKo: "텀블러를 들고 가세요", tagEs: "Lleva tu vaso", tagFr: "Apportez une gourde", tagAr: "أحضِر كوبًا", tagZh: "带个杯子", tagJa: "タンブラーを持っていく", detail: 'Most shops take a little off the price for it.', detailKo: "대부분의 가게가 값을 조금 깎아 줍니다.", detailEs: "La mayoría de las tiendas te quitan algo del precio.", detailFr: "La plupart des boutiques baissent un peu le prix pour cela.", detailAr: "معظم المحلات تخصم شيئًا من السعر لأجله.", detailZh: "多数店会为此少收你一点。", detailJa: "たいていの店が少し値引きしてくれます。" },
    { tag: 'Come before closing', tagKo: "마감 전에 오세요", tagEs: "Ven antes del cierre", tagFr: "Venez avant la fermeture", tagAr: "تعال قبل الإغلاق", tagZh: "打烊前来", tagJa: "閉店前に行く", detail: 'Baked goods are made in small batches and run out.', detailKo: "빵은 소량으로 굽고 금방 동납니다.", detailEs: "El pan se hornea en tandas pequeñas y se agota.", detailFr: "Les pâtisseries sont faites en petites fournées et partent vite.", detailAr: "المخبوزات تُصنع بدفعات صغيرة وتنفد.", detailZh: "烘焙是小批量做的，会卖完。", detailJa: "パンは少量ずつ焼くので、なくなります。" },
    { tag: 'Trust the vegetable', tagKo: "채소를 믿어 보세요", tagEs: "Fíate de la verdura", tagFr: "Faites confiance au légume", tagAr: "ثِق بالخضار", tagZh: "相信那盘蔬菜", tagJa: "野菜を信じる", detail: 'Root-to-leaf means unfamiliar parts land on the plate.', detailKo: "뿌리부터 잎까지 쓰기 때문에 낯선 부위가 접시에 올라옵니다.", detailEs: "De raíz a hoja significa que llegan al plato partes poco habituales.", detailFr: "De la racine à la feuille : des parties inhabituelles arrivent dans l'assiette.", detailAr: "من الجذر إلى الورقة: أجزاء غير مألوفة تصل إلى الصحن.", detailZh: "从根到叶：不常见的部位会出现在盘子里。", detailJa: "根から葉まで——見慣れない部位が皿に来ます。" },
  ],
  'brunch-bakery': [
    { tag: 'Before 11am on weekends', tagKo: "주말은 11시 전에", tagEs: "Fines de semana antes de las 11", tagFr: "Avant 11h le week-end", tagAr: "قبل 11 صباحًا في العطلة", tagZh: "周末11点前", tagJa: "週末は11時前に", detail: 'The best items sell out before noon.', detailKo: "제일 좋은 건 정오 전에 동납니다.", detailEs: "Lo mejor se agota antes del mediodía.", detailFr: "Les meilleures pièces partent avant midi.", detailAr: "أفضل الأصناف تنفد قبل الظهر.", detailZh: "最好的那几样中午之前就卖光了。", detailJa: "いちばんいいものは昼前に売り切れます。" },
    { tag: 'One drink buys the seat', tagKo: "한 잔이면 자리는 내 것", tagEs: "Una consumición te da el sitio", tagFr: "Une consommation achète la place", tagAr: "مشروب واحد يشتري المقعد", tagZh: "一杯就买下这个位子", tagJa: "一杯で席が買える", detail: 'Nobody will rush you out of a Korean cafe.', detailKo: "한국 카페에서 재촉하는 사람은 없습니다.", detailEs: "Nadie te echará de una cafetería coreana.", detailFr: "Personne ne vous poussera dehors dans un café coréen.", detailAr: "لن يستعجلك أحد في مقهى كوري.", detailZh: "在韩国的咖啡馆没人会催你走。", detailJa: "韓国のカフェで追い立てられることはありません。" },
    { tag: 'Ask what was baked today', tagKo: "오늘 구운 걸 물어보세요", tagEs: "Pregunta qué se ha horneado hoy", tagFr: "Demandez ce qui a été cuit aujourd'hui", tagAr: "اسأل ما الذي خُبز اليوم", tagZh: "问问今天烤了什么", tagJa: "今日焼いたものを訊く", detail: 'The lineup changes daily and is not always listed.', detailKo: "구성은 매일 바뀌고 늘 적혀 있지는 않습니다.", detailEs: "El surtido cambia a diario y no siempre está escrito.", detailFr: "L'assortiment change chaque jour et n'est pas toujours affiché.", detailAr: "الأصناف تتغيّر يوميًا وليست دائمًا مدرجة.", detailZh: "品项每天都变，也不一定写出来。", detailJa: "品揃えは毎日変わり、いつも書いてあるとは限りません。" },
  ],
  'local-seasonal': [
    { tag: 'Ask, don’t read', tagKo: "읽지 말고 물어보세요", tagEs: "Pregunta, no leas", tagFr: "Demandez, ne lisez pas", tagAr: "اسأل ولا تقرأ", tagZh: "用问的，别用看的", tagJa: "読まずに訊く", detail: 'The best dish is often not on the printed menu.', detailKo: "가장 좋은 요리는 인쇄된 메뉴판에 없는 경우가 많습니다.", detailEs: "El mejor plato muchas veces no está en la carta impresa.", detailFr: "Le meilleur plat n'est souvent pas sur la carte imprimée.", detailAr: "أفضل طبق غالبًا ليس على القائمة المطبوعة.", detailZh: "最好的那道菜常常不在印出来的菜单上。", detailJa: "いちばんいい一皿は、印刷された品書きにないことが多い。" },
    { tag: 'Lunch sets are better value', tagKo: "점심 세트가 낫습니다", tagEs: "Los menús del mediodía salen mejor", tagFr: "Les formules du midi sont plus avantageuses", tagAr: "قوائم الغداء أوفر", tagZh: "午市套餐更划算", tagJa: "昼のセットのほうが得", detail: 'Same kitchen, smaller bill.', detailKo: "같은 주방, 더 적은 값.", detailEs: "La misma cocina, menos cuenta.", detailFr: "Même cuisine, addition plus légère.", detailAr: "المطبخ نفسه، وفاتورة أخفّ.", detailZh: "同一个厨房，账单更轻。", detailJa: "同じ厨房で、勘定は軽くなります。" },
    { tag: 'Try it with makgeolli', tagKo: "막걸리와 함께", tagEs: "Pruébalo con makgeolli", tagFr: "Essayez-le avec du makgeolli", tagAr: "جرّبه مع الماكغولي", tagZh: "配马格利试试", tagJa: "マッコリと合わせる", detail: 'Rice wine is the traditional partner for seasonal food.', detailKo: "제철 음식에는 막걸리가 전통적인 짝입니다.", detailEs: "El vino de arroz es la pareja tradicional de la comida de temporada.", detailFr: "Le vin de riz est le partenaire traditionnel des produits de saison.", detailAr: "نبيذ الأرز هو الرفيق التقليدي لطعام الموسم.", detailZh: "米酒是时令菜传统的搭档。", detailJa: "米の酒は旬のものの伝統的な相手です。" },
  ],
};

export const tipsFor = (place) => place.localTips ?? LOCAL_TIPS[place.category] ?? LOCAL_TIPS['local-seasonal'];

/**
 * Challenges are defined by a predicate over journey state, so a challenge
 * completes the moment the underlying records support it — there is no
 * separate "completed" flag to drift out of sync with reality.
 */
export const CHALLENGES = [
  {
    id: 'three-kitchens',
    emoji: '🍽',
    title: 'Taste three kinds of Korean kitchen',
    hint: 'Temple, halal, plant-based, zero-waste — they count as different.',
    target: 3,
    measure: j => j.cuisineCount,
  },
  {
    id: 'market',
    emoji: '🏮',
    title: 'Visit a traditional market',
    hint: 'Where Korean food actually comes from.',
    target: 1,
    measure: j => j.marketCount,
  },
  {
    id: 'fermented',
    emoji: '🫙',
    title: 'Eat something fermented',
    hint: 'Kimchi, doenjang, makgeolli — the backbone of Korean flavor.',
    target: 1,
    measure: j => j.fermentedCount,
  },
  {
    id: 'districts',
    emoji: '🗺️',
    title: 'Explore three districts',
    hint: 'Each neighborhood eats differently.',
    target: 3,
    measure: j => j.districtCount,
  },
  {
    id: 'beyond-seoul',
    emoji: '⚓',
    title: 'Eat beyond Seoul',
    hint: "Incheon's port has fed Korea's food history for a century.",
    target: 1,
    measure: j => j.incheonCount,
  },
  {
    id: 'share-a-meal',
    emoji: '🤝',
    title: 'Share a meal with someone',
    hint: 'The whole point — food is how the conversation starts.',
    target: 1,
    measure: j => j.companionCount,
  },
];

/**
 * The single source of truth for "how far along is this trip".
 *
 * @param {{visitedPlaces: object[], markets: string[], companions: object[]}} state
 */
export function computeJourney({ visitedPlaces = [], markets = [], companions = [] }) {
  const districts = new Set(visitedPlaces.map(p => p.zone));
  const cuisines = new Set(visitedPlaces.map(p => p.category));
  const base = {
    foodCount: visitedPlaces.length,
    districtCount: districts.size,
    cuisineCount: cuisines.size,
    marketCount: markets.length,
    companionCount: companions.length,
    fermentedCount: visitedPlaces.filter(p => p.traits?.includes('Fermented')).length,
    incheonCount: visitedPlaces.filter(p => p.zone.includes('Incheon')).length,
    districts: Array.from(districts),
  };

  const challenges = CHALLENGES.map(c => {
    const current = Math.min(c.measure(base), c.target);
    return { ...c, current, done: current >= c.target, remaining: c.target - current };
  });

  return {
    ...base,
    challenges,
    doneCount: challenges.filter(c => c.done).length,
    // The next goal is the challenge closest to completion — it keeps the
    // suggestion reachable instead of always pointing at the hardest one.
    nextGoal: challenges.filter(c => !c.done).sort((a, b) => a.remaining - b.remaining)[0] ?? null,
  };
}
