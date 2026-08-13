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
    { label: 'Tea house in Insadong', labelKo: "인사동 찻집", labelEs: "Casa de té en Insadong", labelFr: "Maison de thé à Insadong", note: 'Sit with a pot of jujube tea after the meal.', noteKo: "식사 뒤에 대추차 한 주전자를 놓고 앉아 보세요.", noteEs: "Siéntate con una tetera de té de azufaifa después de comer.", noteFr: "Asseyez-vous avec une théière de thé au jujube après le repas.", zone: 'Insadong, Seoul' },
    { label: 'Insadong Ssamziegil', labelKo: "인사동 쌈지길", labelEs: "Ssamziegil de Insadong", labelFr: "Ssamziegil à Insadong", note: 'A spiral of craft shops above the main street.', noteKo: "큰길 위로 올라가는 공예점들의 나선.", noteEs: "Una espiral de tiendas de artesanía sobre la calle principal.", noteFr: "Une spirale de boutiques d'artisanat au-dessus de la rue principale.", marketId: 'insadong-ssamzie' },
    { label: 'Another temple table', labelKo: "또 다른 절 밥상", labelEs: "Otra mesa de templo", labelFr: "Une autre table de temple", note: 'Compare two kitchens working from the same doctrine.', noteKo: "같은 가르침에서 나온 두 주방을 견줘 보세요.", noteEs: "Compara dos cocinas que trabajan desde la misma doctrina.", noteFr: "Comparez deux cuisines qui travaillent depuis la même doctrine.", placeCategory: 'temple' },
  ],
  'korean-chinese': [
    { label: 'Sinpo International Market', labelKo: "신포국제시장", labelEs: "Mercado Internacional de Sinpo", labelFr: "Marché international de Sinpo", note: "Where Incheon's street food grew up beside Chinatown.", noteKo: "인천의 길거리 음식이 차이나타운 옆에서 자란 곳.", noteEs: "Donde creció la comida callejera de Incheon, junto al barrio chino.", noteFr: "Là où la cuisine de rue d'Incheon a grandi, à côté du quartier chinois.", marketId: 'sinpo' },
    { label: 'Jajangmyeon Museum', labelKo: "짜장면 박물관", labelEs: "Museo del Jajangmyeon", labelFr: "Musée du jajangmyeon", note: "Next door to Gonghwachun — the dish's own birthplace.", noteKo: "공화춘 바로 옆 — 이 음식이 태어난 자리입니다.", noteEs: "Justo al lado de Gonghwachun: el lugar donde nació el plato.", noteFr: "À côté du Gonghwachun — le lieu de naissance du plat lui-même.", zone: 'Chinatown, Jemulpo-gu, Incheon' },
    { label: 'A plant-based version', labelKo: "식물성 버전", labelEs: "Una versión vegetal", labelFr: "Une version végétale", note: 'The same comfort classics, rebuilt without meat.', noteKo: "같은 위로의 음식들을, 고기 없이 다시 만든 것.", noteEs: "Los mismos clásicos reconfortantes, reconstruidos sin carne.", noteFr: "Les mêmes classiques réconfortants, refaits sans viande.", placeCategory: 'vegan-dining' },
  ],
  'halal-korean': [
    { label: 'Seoul Central Mosque', labelKo: "서울중앙성원", labelEs: "Mezquita Central de Seúl", labelFr: "Grande Mosquée de Séoul", note: 'The hillside the whole neighborhood grew around.', noteKo: "이 동네 전체가 그 언덕을 중심으로 자랐습니다.", noteEs: "La ladera alrededor de la que creció todo el barrio.", noteFr: "La colline autour de laquelle tout le quartier a poussé.", zone: 'Itaewon, Seoul' },
    { label: 'Namdaemun Market', labelKo: "남대문시장", labelEs: "Mercado de Namdaemun", labelFr: "Marché de Namdaemun", note: 'Street food alleys and the old south gate.', noteKo: "먹자골목과 옛 남대문.", noteEs: "Callejones de comida callejera y la antigua puerta sur.", noteFr: "Des ruelles de cuisine de rue et l'ancienne porte sud.", marketId: 'namdaemun' },
    { label: 'World halal in Incheon', labelKo: "인천의 세계 할랄", labelEs: "Halal del mundo en Incheon", labelFr: "Halal du monde à Incheon", note: 'Follow the same thread to a port-city kitchen.', noteKo: "같은 실을 따라 항구 도시의 주방으로.", noteEs: "Sigue el mismo hilo hasta una cocina de ciudad portuaria.", noteFr: "Suivez le même fil jusqu'à une cuisine de ville portuaire.", placeCategory: 'world-halal' },
  ],
  'world-halal': [
    { label: 'Sinpo International Market', labelKo: "신포국제시장", labelEs: "Mercado Internacional de Sinpo", labelFr: "Marché international de Sinpo", note: "Incheon's oldest market, minutes from Chinatown.", noteKo: "차이나타운에서 몇 분, 인천에서 가장 오래된 시장.", noteEs: "El mercado más antiguo de Incheon, a minutos del barrio chino.", noteFr: "Le plus vieux marché d'Incheon, à quelques minutes du quartier chinois.", marketId: 'sinpo' },
    { label: 'Halal Korean in Seoul', labelKo: "서울의 할랄 한식", labelEs: "Cocina coreana halal en Seúl", labelFr: "Coréen halal à Séoul", note: 'See how Korean home cooking adapts to the same rules.', noteKo: "한국의 집밥이 같은 규칙에 어떻게 맞춰지는지 보세요.", noteEs: "Mira cómo la cocina casera coreana se adapta a las mismas reglas.", noteFr: "Voyez comment la cuisine familiale coréenne s'adapte aux mêmes règles.", placeCategory: 'halal-korean' },
    { label: 'Songdo waterfront', labelKo: "송도 워터프런트", labelEs: "El paseo marítimo de Songdo", labelFr: "Front de mer de Songdo", note: 'A built-from-nothing skyline worth an evening walk.', noteKo: "맨땅에서 세운 스카이라인, 저녁 산책으로 좋습니다.", noteEs: "Un horizonte levantado de la nada, digno de un paseo al atardecer.", noteFr: "Une skyline sortie de rien, qui vaut une promenade du soir.", zone: 'Songdo, Incheon' },
  ],
  'vegan-dining': [
    { label: 'A zero-waste counter', labelKo: "제로웨이스트 가게", labelEs: "Un mostrador sin residuos", labelFr: "Un comptoir zéro déchet", note: 'Take the idea one step further — nothing disposable.', noteKo: "한 걸음 더 — 일회용품이 아예 없습니다.", noteEs: "Un paso más allá: nada desechable.", noteFr: "Poussez l'idée d'un cran — rien de jetable.", placeCategory: 'zero-waste' },
    { label: 'Gwangjang Market', labelKo: "광장시장", labelEs: "Mercado de Gwangjang", labelFr: "Marché de Gwangjang", note: 'Watch bindaetteok batter hit the pan.', noteKo: "빈대떡 반죽이 팬에 닿는 걸 지켜보세요.", noteEs: "Mira cómo la masa de bindaetteok cae en la sartén.", noteFr: "Regardez la pâte à bindaetteok tomber sur la plaque.", marketId: 'gwangjang' },
    { label: 'Temple cuisine', labelKo: "사찰음식", labelEs: "Cocina de templo", labelFr: "Cuisine de temple", note: 'The centuries-old root of Korean plant-based cooking.', noteKo: "한국 식물성 요리의 수백 년 된 뿌리.", noteEs: "La raíz centenaria de la cocina vegetal coreana.", noteFr: "La racine, vieille de plusieurs siècles, de la cuisine végétale coréenne.", placeCategory: 'temple' },
  ],
  'zero-waste': [
    { label: 'Namdaemun Market', labelKo: "남대문시장", labelEs: "Mercado de Namdaemun", labelFr: "Marché de Namdaemun", note: 'Bring your own bag and shop the old way.', noteKo: "장바구니를 들고 옛날 방식으로 장을 보세요.", noteEs: "Lleva tu bolsa y compra a la vieja usanza.", noteFr: "Apportez votre sac et faites vos courses à l'ancienne.", marketId: 'namdaemun' },
    { label: 'Bukchon hanok alleys', labelKo: "북촌 한옥 골목", labelEs: "Callejones de hanok de Bukchon", labelFr: "Ruelles de hanok à Bukchon", note: 'Tiled roofs and quiet lanes on foot.', noteKo: "기와지붕과 조용한 골목을 걸어서.", noteEs: "Tejados de teja y callejones tranquilos, a pie.", noteFr: "Toits de tuiles et venelles tranquilles, à pied.", zone: 'Bukchon, Seoul' },
    { label: 'A plant-based kitchen', labelKo: "식물성 주방", labelEs: "Una cocina vegetal", labelFr: "Une cuisine végétale", note: 'Same instinct, applied to the plate.', noteKo: "같은 감각을, 접시 위에 적용한 것.", noteEs: "El mismo instinto, aplicado al plato.", noteFr: "Le même instinct, appliqué à l'assiette.", placeCategory: 'vegan-dining' },
  ],
  'brunch-bakery': [
    { label: 'A seasonal kitchen', note: 'Ask what the season turned up this week.', placeCategory: 'local-seasonal' },
    { label: 'Gwangjang Market', labelKo: "광장시장", labelEs: "Mercado de Gwangjang", labelFr: "Marché de Gwangjang", note: 'Trade the quiet cafe for a loud market counter.', noteKo: "조용한 카페 대신 시끄러운 시장 좌판으로.", noteEs: "Cambia la cafetería tranquila por una ruidosa barra de mercado.", noteFr: "Échangez le café tranquille contre un comptoir de marché bruyant.", marketId: 'gwangjang' },
    { label: 'Han River walk', labelKo: '한강 산책', labelEs: 'Paseo por el río Han', labelFr: "Promenade sur le Han", note: 'The city\'s default afternoon, and it costs nothing.', noteKo: '이 도시의 기본값 같은 오후이고, 돈이 들지 않습니다.', noteEs: 'La tarde por defecto de la ciudad, y no cuesta nada.', noteFr: "L'après-midi par défaut de la ville, et cela ne coûte rien.", zone: 'Seoul' },
  ],
  'local-seasonal': [
    { label: 'Gwangjang Market', labelKo: "광장시장", labelEs: "Mercado de Gwangjang", labelFr: "Marché de Gwangjang", note: 'See the same seasonal produce at its source.', noteKo: "같은 제철 재료를 산지에서 보세요.", noteEs: "Ve el mismo producto de temporada en su origen.", noteFr: "Voyez les mêmes produits de saison à la source.", marketId: 'gwangjang' },
    { label: 'A temple table', labelKo: "절 밥상", labelEs: "Una mesa de templo", labelFr: "Une table de temple", note: 'Seasonality taken to its most disciplined form.', noteKo: "제철을 가장 엄격한 형태까지 밀고 간 자리.", noteEs: "La estacionalidad llevada a su forma más disciplinada.", noteFr: "La saisonnalité poussée à sa forme la plus disciplinée.", placeCategory: 'temple' },
    { label: 'Weekend brunch', labelKo: "주말 브런치", labelEs: "Brunch de fin de semana", labelFr: "Brunch du week-end", note: 'Slow baking, seasonal vegetables, no rush.', noteKo: "느린 베이킹, 제철 채소, 서두름 없음.", noteEs: "Horneado lento, verdura de temporada, sin prisa.", noteFr: "Cuisson lente, légumes de saison, aucune hâte.", placeCategory: 'brunch-bakery' },
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
    { tag: 'Book ahead', tagKo: "미리 예약하세요", tagEs: "Reserva con antelación", tagFr: "Réservez à l'avance", detail: 'Dinner seatings are small and often reserved days out.', detailKo: "저녁 자리는 적고 며칠 전에 예약되는 경우가 많습니다.", detailEs: "Las mesas de cena son pocas y se reservan con días de antelación.", detailFr: "Les services du soir sont petits et souvent réservés plusieurs jours avant." },
    { tag: 'Go at lunch', tagKo: "점심에 가세요", tagEs: "Ve a la hora de comer", tagFr: "Allez-y au déjeuner", detail: 'The midday course costs noticeably less than dinner.', detailKo: "점심 코스가 저녁보다 눈에 띄게 저렴합니다.", detailEs: "El menú del mediodía cuesta bastante menos que el de la cena.", detailFr: "Le menu de midi coûte nettement moins cher que celui du soir." },
    { tag: 'Leave time', tagKo: "시간을 넉넉히", tagEs: "Reserva tiempo", tagFr: "Prévoyez du temps", detail: 'A full course runs 90 minutes. It is not a quick stop.', detailKo: "풀코스는 90분 걸립니다. 잠깐 들르는 곳이 아니에요.", detailEs: "Un menú completo dura 90 minutos. No es una parada rápida.", detailFr: "Un menu complet dure 90 minutes. Ce n'est pas une halte rapide." },
  ],
  'korean-chinese': [
    { tag: 'Avoid 12–1pm', tagKo: "12~1시는 피하세요", tagEs: "Evita de 12 a 13 h", tagFr: "Évitez 12h–13h", detail: 'Office lunch rush fills every table at once.', detailKo: "직장인 점심시간에 모든 자리가 한꺼번에 찹니다.", detailEs: "La hora de comer de las oficinas llena todas las mesas de golpe.", detailFr: "La ruée du déjeuner de bureau remplit toutes les tables d'un coup." },
    { tag: 'Order tangsuyuk to share', tagKo: "탕수육은 나눠 드세요", tagEs: "Pide tangsuyuk para compartir", tagFr: "Prenez un tangsuyuk à partager", detail: 'Locals rarely order noodles alone for two.', detailKo: "둘이서 면만 시키는 경우는 드뭅니다.", detailEs: "Los locales rara vez piden solo fideos para dos.", detailFr: "Les gens d'ici commandent rarement que des nouilles à deux." },
    { tag: 'Eat it fast', tagKo: "빨리 드세요", tagEs: "Cómelo rápido", tagFr: "Mangez vite", detail: 'The noodles swell within minutes. That is the whole trick.', detailKo: "면은 몇 분이면 붇습니다. 그게 전부예요.", detailEs: "Los fideos se hinchan en minutos. Ese es todo el truco.", detailFr: "Les nouilles gonflent en quelques minutes. C'est là tout le truc." },
  ],
  'vegan-dining': [
    { tag: 'Weekday lunch is calm', tagKo: "평일 점심이 한산합니다", tagEs: "El almuerzo entre semana es tranquilo", tagFr: "Le déjeuner en semaine est calme", detail: 'Weekends fill up with the plant-based crowd.', detailKo: "주말에는 채식하는 손님들로 찹니다.", detailEs: "Los fines de semana se llena con el público vegetal.", detailFr: "Les week-ends se remplissent du public végétal." },
    { tag: 'Ask about the sauce', tagKo: "소스를 물어보세요", tagEs: "Pregunta por la salsa", tagFr: "Renseignez-vous sur la sauce", detail: 'Anchovy stock hides in places you would not expect.', detailKo: "멸치 육수가 생각지 못한 곳에 들어 있습니다.", detailEs: "El caldo de anchoa se esconde donde no lo esperarías.", detailFr: "Le bouillon d'anchois se cache là où on ne l'attend pas." },
    { tag: 'Refills are free', tagKo: "반찬 리필은 무료입니다", tagEs: "Las repeticiones son gratis", tagFr: "Les rab sont gratuits", detail: 'Banchan comes back if you ask. Asking is a compliment.', detailKo: "말하면 반찬은 다시 나옵니다. 더 달라는 건 칭찬이에요.", detailEs: "El banchan vuelve si lo pides. Pedirlo es un cumplido.", detailFr: "Le banchan revient si vous le demandez. Le demander est un compliment." },
  ],
  'halal-korean': [
    { tag: 'Friday afternoons are busy', tagKo: "금요일 오후는 붐빕니다", tagEs: "Los viernes por la tarde hay lleno", tagFr: "Les vendredis après-midi sont chargés", detail: 'Prayer at the Central Mosque empties into the street.', detailKo: "중앙성원 예배가 끝나면 거리로 사람이 쏟아집니다.", detailEs: "La oración en la Mezquita Central vacía a la calle.", detailFr: "La prière à la Grande Mosquée se déverse dans la rue." },
    { tag: 'Start with bulgogi', tagKo: "불고기로 시작하세요", tagEs: "Empieza por el bulgogi", tagFr: "Commencez par le bulgogi", detail: 'The gentlest way into Korean flavor — savory, not spicy.', detailKo: "한국 맛으로 들어가는 가장 부드러운 입구입니다. 짭조름하고 맵지 않아요.", detailEs: "La entrada más suave al sabor coreano: sabroso, no picante.", detailFr: "La porte la plus douce vers la saveur coréenne — savoureuse, pas piquante." },
    { tag: 'Cash still helps', tagKo: "현금이 편할 수 있어요", tagEs: "El efectivo aún ayuda", tagFr: "Les espèces aident encore", detail: 'Smaller family kitchens sometimes prefer it.', detailKo: "작은 가족 식당은 현금을 선호하기도 합니다.", detailEs: "Las cocinas familiares pequeñas a veces lo prefieren.", detailFr: "Les petites cuisines familiales les préfèrent parfois." },
  ],
  'world-halal': [
    { tag: 'Order for the table', tagKo: "상 단위로 주문하세요", tagEs: "Pide para la mesa", tagFr: "Commandez pour la table", detail: 'Portions are built for sharing, Korean style.', detailKo: "양이 나눠 먹도록 맞춰져 있습니다. 한국식으로요.", detailEs: "Las raciones están pensadas para compartir, al estilo coreano.", detailFr: "Les portions sont faites pour être partagées, à la coréenne." },
    { tag: 'Ask for the pickles', tagKo: "절임을 달라고 하세요", tagEs: "Pide los encurtidos", tagFr: "Demandez les pickles", detail: 'Korean-style banchan beside a curry is a local habit.', detailKo: "카레 옆에 한국식 반찬을 두는 건 현지 습관입니다.", detailEs: "El banchan coreano junto al curry es una costumbre local.", detailFr: "Du banchan coréen à côté d'un curry est une habitude locale." },
    { tag: 'Evenings are livelier', tagKo: "저녁이 더 활기찹니다", tagEs: "Las tardes son más animadas", tagFr: "Les soirées sont plus animées", detail: 'The international crowd arrives after work.', detailKo: "퇴근 후에 국제적인 손님들이 옵니다.", detailEs: "El público internacional llega después del trabajo.", detailFr: "Le public international arrive après le travail." },
  ],
  'zero-waste': [
    { tag: 'Bring a tumbler', tagKo: "텀블러를 들고 가세요", tagEs: "Lleva tu vaso", tagFr: "Apportez une gourde", detail: 'Most shops take a little off the price for it.', detailKo: "대부분의 가게가 값을 조금 깎아 줍니다.", detailEs: "La mayoría de las tiendas te quitan algo del precio.", detailFr: "La plupart des boutiques baissent un peu le prix pour cela." },
    { tag: 'Come before closing', tagKo: "마감 전에 오세요", tagEs: "Ven antes del cierre", tagFr: "Venez avant la fermeture", detail: 'Baked goods are made in small batches and run out.', detailKo: "빵은 소량으로 굽고 금방 동납니다.", detailEs: "El pan se hornea en tandas pequeñas y se agota.", detailFr: "Les pâtisseries sont faites en petites fournées et partent vite." },
    { tag: 'Trust the vegetable', tagKo: "채소를 믿어 보세요", tagEs: "Fíate de la verdura", tagFr: "Faites confiance au légume", detail: 'Root-to-leaf means unfamiliar parts land on the plate.', detailKo: "뿌리부터 잎까지 쓰기 때문에 낯선 부위가 접시에 올라옵니다.", detailEs: "De raíz a hoja significa que llegan al plato partes poco habituales.", detailFr: "De la racine à la feuille : des parties inhabituelles arrivent dans l'assiette." },
  ],
  'brunch-bakery': [
    { tag: 'Before 11am on weekends', tagKo: "주말은 11시 전에", tagEs: "Fines de semana antes de las 11", tagFr: "Avant 11h le week-end", detail: 'The best items sell out before noon.', detailKo: "제일 좋은 건 정오 전에 동납니다.", detailEs: "Lo mejor se agota antes del mediodía.", detailFr: "Les meilleures pièces partent avant midi." },
    { tag: 'One drink buys the seat', tagKo: "한 잔이면 자리는 내 것", tagEs: "Una consumición te da el sitio", tagFr: "Une consommation achète la place", detail: 'Nobody will rush you out of a Korean cafe.', detailKo: "한국 카페에서 재촉하는 사람은 없습니다.", detailEs: "Nadie te echará de una cafetería coreana.", detailFr: "Personne ne vous poussera dehors dans un café coréen." },
    { tag: 'Ask what was baked today', tagKo: "오늘 구운 걸 물어보세요", tagEs: "Pregunta qué se ha horneado hoy", tagFr: "Demandez ce qui a été cuit aujourd'hui", detail: 'The lineup changes daily and is not always listed.', detailKo: "구성은 매일 바뀌고 늘 적혀 있지는 않습니다.", detailEs: "El surtido cambia a diario y no siempre está escrito.", detailFr: "L'assortiment change chaque jour et n'est pas toujours affiché." },
  ],
  'local-seasonal': [
    { tag: 'Ask, don’t read', tagKo: "읽지 말고 물어보세요", tagEs: "Pregunta, no leas", tagFr: "Demandez, ne lisez pas", detail: 'The best dish is often not on the printed menu.', detailKo: "가장 좋은 요리는 인쇄된 메뉴판에 없는 경우가 많습니다.", detailEs: "El mejor plato muchas veces no está en la carta impresa.", detailFr: "Le meilleur plat n'est souvent pas sur la carte imprimée." },
    { tag: 'Lunch sets are better value', tagKo: "점심 세트가 낫습니다", tagEs: "Los menús del mediodía salen mejor", tagFr: "Les formules du midi sont plus avantageuses", detail: 'Same kitchen, smaller bill.', detailKo: "같은 주방, 더 적은 값.", detailEs: "La misma cocina, menos cuenta.", detailFr: "Même cuisine, addition plus légère." },
    { tag: 'Try it with makgeolli', tagKo: "막걸리와 함께", tagEs: "Pruébalo con makgeolli", tagFr: "Essayez-le avec du makgeolli", detail: 'Rice wine is the traditional partner for seasonal food.', detailKo: "제철 음식에는 막걸리가 전통적인 짝입니다.", detailEs: "El vino de arroz es la pareja tradicional de la comida de temporada.", detailFr: "Le vin de riz est le partenaire traditionnel des produits de saison." },
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
