// Experience catalog — the atom of progression.
//
// An Experience is a unit of culture, not a unit of venue. `bindaetteok` is a
// complete Experience with no restaurant attached: it has an origin, a place
// it is found, phrases to order it and a mission. Restaurants attach where
// they exist and are anchors, not prerequisites.
//
// This is a representative seed, not the full catalogue. It deliberately
// covers every structural case the model must support so the policies and
// projections built on top are exercised against real shapes.

import { STATUS, EXPERIENCE_KIND } from '../types.js';

export const experiences = [
  {
    id: 'temple-cuisine',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Temple Cuisine',
    titleKo: '사찰음식',
    titleEs: "Cocina de templo",
    status: STATUS.PUBLISHED,
    whyItMatters:
      "A cuisine built entirely without garlic, onion or haste — the only Korean table where what is left out matters more than what is put in.",
    whyItMattersKo:
      "마늘도 양파도 서두름도 없이 지어진 음식입니다. 무엇을 넣었는가보다 무엇을 뺐는가가 더 중요한, 한국에서 유일한 밥상이에요.",
    whyItMattersEs:
      "Una cocina construida entera sin ajo, sin cebolla y sin prisa: la única mesa coreana donde lo que se deja fuera importa más que lo que se pone.",
    culturalMeaning:
      "Temple food expresses a Buddhist philosophy of eating with awareness: nothing wasted, nothing indulgent, everything intentional.",
    culturalMeaningKo:
      "사찰음식은 알아차리며 먹는다는 불교의 태도를 담습니다. 버리는 것 없이, 탐하는 것 없이, 모든 것이 뜻을 가지고요.",
    culturalMeaningEs:
      "La comida de templo expresa una filosofía budista de comer con atención: nada se desperdicia, nada es exceso, todo es intencionado.",
    whenToExperience:
      "During a templestay, on a Buddhist holiday, or whenever the city has worn you down and you want a quiet reset.",
    whenToExperienceKo:
      "템플스테이 중에, 불교 명절에, 또는 도시에 지쳐 조용히 쉬어 가고 싶을 때.",
    whenToExperienceEs:
      "Durante un templestay, en una fiesta budista, o cuando la ciudad te ha agotado y quieres un respiro.",
    mission: {
      title: 'The Empty Bowl',
      detail: 'Finish every grain of rice, the way 발우공양 intends. Leaving nothing behind is the practice, not merely good manners.',
    },
    missionKo: { title: "빈 그릇", detail: "발우공양이 뜻하는 대로 밥알 하나까지 비우세요. 아무것도 남기지 않는 것이 예의가 아니라 수행입니다." },
    missionEs: { title: "El cuenco vacío", detail: "Termina hasta el último grano de arroz, como manda el 발우공양. No dejar nada es la práctica, no simple buena educación." },
    restaurantIds: ['balwoo', 'sanchon', 'maji'],
    marketIds: [],
    zones: ['Jongno, Seoul', 'Insadong, Seoul', 'Seochon, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'temple-tea',
    kind: EXPERIENCE_KIND.RITUAL,
    title: 'Tea After the Meal',
    titleKo: '차 한 잔',
    titleEs: "El té de después",
    status: STATUS.PREVIEW,
    whyItMatters:
      "The meal does not end when the bowl empties. The pot that follows is where the conversation actually happens.",
    whyItMattersKo:
      "식사는 그릇을 비운다고 끝나지 않습니다. 뒤이어 나오는 차 한 주전자가 실제로 대화가 일어나는 자리예요.",
    whyItMattersEs:
      "La comida no acaba cuando se vacía el cuenco. La tetera que viene después es donde pasa de verdad la conversación.",
    culturalMeaning:
      "Korean tea culture treats the pour as part of the hospitality, not an afterthought — the host keeps your cup filled without being asked.",
    culturalMeaningKo:
      "한국의 차 문화는 따라 주는 행위를 접대의 일부로 봅니다. 뒷일이 아니라요 — 주인은 묻지 않고 잔을 채웁니다.",
    culturalMeaningEs:
      "La cultura coreana del té trata el servir como parte de la hospitalidad, no como algo secundario: el anfitrión te llena la taza sin que se lo pidas.",
    whenToExperience:
      "Straight after a temple meal, while the quiet still holds.",
    whenToExperienceKo:
      "사찰 식사 직후, 그 고요가 아직 남아 있을 때.",
    whenToExperienceEs:
      "Justo después de una comida de templo, mientras aún dura el silencio.",
    mission: {
      title: 'Let Them Pour',
      detail: "Do not refill your own cup. Let your host do it, and return the favour — that exchange is the whole ritual.",
    },
    missionKo: { title: "따라 주게 두기", detail: "자기 잔을 직접 채우지 마세요. 주인이 채우게 두고, 그 다음엔 당신이 채워 주세요 — 그 주고받음이 곧 의식입니다." },
    missionEs: { title: "Deja que te sirvan", detail: "No te rellenes la taza. Deja que lo haga tu anfitrión y devuélvele el gesto: ese intercambio es el ritual entero." },
    restaurantIds: [],
    marketIds: [],
    zones: ['Insadong, Seoul'],
    acceptsSelfAttest: true,
  },
  {
    id: 'gwangjang-market',
    kind: EXPERIENCE_KIND.PLACE,
    title: 'Gwangjang Market',
    titleKo: '광장시장',
    titleEs: "Mercado de Gwangjang",
    status: STATUS.PUBLISHED,
    whyItMatters:
      "One of Korea's oldest markets, feeding Seoul for over a century from stalls barely wider than their griddles.",
    whyItMattersKo:
      "한국에서 가장 오래된 시장 중 하나로, 철판보다 조금 넓을 뿐인 노점들이 백 년 넘게 서울을 먹여 왔습니다.",
    whyItMattersEs:
      "Uno de los mercados más antiguos de Corea: lleva más de un siglo dando de comer a Seúl desde puestos apenas más anchos que sus planchas.",
    culturalMeaning:
      "The market is where Korean food is still transacted face to face — you order by pointing, and you eat at the counter beside whoever came before you.",
    culturalMeaningKo:
      "시장은 한국 음식이 아직 얼굴을 맞대고 오가는 곳입니다. 손가락으로 가리켜 주문하고, 먼저 온 사람 옆에서 서서 먹습니다.",
    culturalMeaningEs:
      "El mercado es donde la comida coreana todavía se intercambia cara a cara: pides señalando y comes en la barra junto a quien llegó antes.",
    whenToExperience:
      "Late afternoon, when the dinner crowd arrives and every griddle is running at once.",
    whenToExperienceKo:
      "늦은 오후, 저녁 손님이 몰리고 철판이 전부 돌아갈 때.",
    whenToExperienceEs:
      "A media tarde, cuando llega la gente de la cena y todas las planchas están en marcha a la vez.",
    mission: {
      title: 'Sit at the Counter',
      detail: 'Skip the tables. Take a stool at a stall and eat shoulder to shoulder with the regulars.',
    },
    missionKo: { title: "좌판에 앉기", detail: "테이블 말고 노점 앞 의자에 앉아, 단골들과 어깨를 맞대고 드세요." },
    missionEs: { title: "Siéntate en la barra", detail: "Salta las mesas. Coge un taburete en un puesto y come hombro con hombro con los habituales." },
    restaurantIds: [],
    marketIds: ['gwangjang'],
    zones: ['Jongno, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'bindaetteok',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Bindaetteok',
    titleKo: '빈대떡',
    titleEs: "Bindaetteok",
    status: STATUS.PREVIEW,
    whyItMatters:
      "A mung bean pancake ground on a stone mill in front of you and fried in enough oil to hear it from across the aisle.",
    whyItMattersKo:
      "눈앞의 맷돌에 녹두를 갈아, 통로 건너편에서도 소리가 들릴 만큼 기름을 넉넉히 두르고 부칩니다.",
    whyItMattersEs:
      "Una tortita de judía mungo molida en un molino de piedra delante de ti y frita en aceite suficiente para oírla desde el otro lado del pasillo.",
    culturalMeaning:
      "Once a food of scarcity made from what was left after the beans were pressed, now the dish people queue for. Korean cooking does that often.",
    culturalMeaningKo:
      "콩을 짜고 남은 것으로 만들던 궁핍의 음식이 이제는 줄을 서서 먹는 음식이 되었습니다. 한국 요리에는 그런 일이 자주 있어요.",
    culturalMeaningEs:
      "Antes comida de escasez hecha con lo que quedaba tras prensar la judía, ahora el plato por el que se hace cola. La cocina coreana hace eso a menudo.",
    whenToExperience:
      "On a cold day, with makgeolli, standing up.",
    whenToExperienceKo:
      "추운 날, 막걸리와 함께, 선 채로.",
    whenToExperienceEs:
      "Un día frío, con makgeolli, de pie.",
    mission: {
      title: 'Order It Hot',
      detail: 'Ask for one straight off the griddle rather than from the stack. Say 방금 나온 거 주세요.',
    },
    missionKo: { title: "갓 나온 걸로", detail: "쌓아 둔 것 말고 철판에서 막 나온 걸로 달라고 하세요. \"방금 나온 거 주세요.\"" },
    missionEs: { title: "Pídela recién hecha", detail: "Pide una recién salida de la plancha y no del montón. Di 방금 나온 거 주세요." },
    restaurantIds: [],
    marketIds: ['gwangjang'],
    zones: ['Jongno, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'makgeolli',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Makgeolli',
    titleKo: '막걸리',
    titleEs: "Makgeolli",
    status: STATUS.PREVIEW,
    whyItMatters:
      "Korea's oldest alcohol, cloudy and barely sweet, drunk from a bowl rather than a glass.",
    whyItMattersKo:
      "한국에서 가장 오래된 술입니다. 뿌옇고 살짝 달며, 잔이 아니라 사발로 마셔요.",
    whyItMattersEs:
      "El alcohol más antiguo de Corea: turbio, apenas dulce, y se bebe en cuenco y no en vaso.",
    culturalMeaning:
      "Makgeolli is a farmer's drink that survived into the cities. Pouring for others before yourself is the etiquette that carries the culture.",
    culturalMeaningKo:
      "막걸리는 도시까지 살아남은 농부의 술입니다. 자기 것보다 남의 것을 먼저 따르는 예절이 그 문화를 실어 나릅니다.",
    culturalMeaningEs:
      "El makgeolli es una bebida de campesinos que sobrevivió hasta las ciudades. Servir a los demás antes que a uno mismo es la etiqueta que sostiene la cultura.",
    whenToExperience:
      "With fried food, on a rainy evening — the pairing is close to a national reflex.",
    whenToExperienceKo:
      "튀김과 함께, 비 오는 저녁에 — 거의 국민적 반사에 가까운 조합입니다.",
    whenToExperienceEs:
      "Con fritos, una tarde de lluvia: el maridaje es casi un reflejo nacional.",
    mission: {
      title: 'Pour for Someone Else First',
      detail: "Never fill your own bowl first. Fill your companion's, and let them fill yours.",
    },
    missionKo: { title: "남의 잔부터", detail: "자기 사발을 먼저 채우지 마세요. 옆 사람 것을 채우고, 당신 것은 그 사람이 채우게 두세요." },
    missionEs: { title: "Sirve primero a otro", detail: "Nunca llenes tu cuenco primero. Llena el de quien tienes al lado y deja que él llene el tuyo." },
    restaurantIds: [],
    marketIds: [],
    zones: ['Jongno, Seoul'],
    acceptsSelfAttest: true,
  },
  {
    id: 'market-alley',
    kind: EXPERIENCE_KIND.SETTING,
    title: 'The Market Alley',
    titleKo: '시장 골목',
    titleEs: "El callejón del mercado",
    status: STATUS.PREVIEW,
    whyItMatters:
      "Not a dish but a place to stand: the narrow run between stalls where the whole market happens at once.",
    whyItMattersKo:
      "요리가 아니라 서 있을 자리입니다. 시장 전체가 한꺼번에 벌어지는, 노점 사이의 좁은 길이요.",
    whyItMattersEs:
      "No es un plato sino un sitio donde estar: el pasillo estrecho entre puestos donde el mercado entero ocurre a la vez.",
    culturalMeaning:
      "Korean markets are organised by trade, so an alley is a category — walk one and you have seen an entire supply chain.",
    culturalMeaningKo:
      "한국의 시장은 업종별로 묶여 있어서, 골목 하나가 곧 하나의 분류입니다. 한 골목을 걸으면 공급망 하나를 통째로 본 셈이에요.",
    culturalMeaningEs:
      "Los mercados coreanos se organizan por oficios, así que un callejón es una categoría: recorre uno y habrás visto una cadena de suministro entera.",
    whenToExperience:
      "Any time the market is open. Walk it once end to end before ordering anything.",
    whenToExperienceKo:
      "시장이 열려 있는 아무 때나. 무엇을 사기 전에 끝에서 끝까지 한 번 걸어 보세요.",
    whenToExperienceEs:
      "Cualquier momento en que el mercado esté abierto. Recórrelo entero antes de pedir nada.",
    mission: {
      title: 'Walk It First',
      detail: 'Walk the full alley before you buy. Deciding after seeing everything is how locals shop.',
    },
    missionKo: { title: "먼저 한 바퀴", detail: "사기 전에 골목 전체를 걸어 보세요. 다 보고 나서 정하는 것이 현지 사람들이 장 보는 방식입니다." },
    missionEs: { title: "Recórrelo primero", detail: "Camina el callejón entero antes de comprar. Decidir después de verlo todo es como compran los locales." },
    restaurantIds: [],
    marketIds: ['namdaemun'],
    zones: ['Jongno, Seoul', 'Hoehyeon, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'jajangmyeon',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Jajangmyeon',
    titleKo: '짜장면',
    titleEs: "Jajangmyeon",
    status: STATUS.PUBLISHED,
    whyItMatters:
      "Invented in Incheon's Chinatown by Chinese dockworkers far from home, and now the most Korean thing on any menu.",
    whyItMattersKo:
      "고향을 멀리 떠나온 중국인 부두 노동자들이 인천 차이나타운에서 만들었고, 지금은 어느 메뉴판에서든 가장 한국적인 음식입니다.",
    whyItMattersEs:
      "Lo inventaron estibadores chinos lejos de casa en el barrio chino de Incheon, y hoy es lo más coreano de cualquier carta.",
    culturalMeaning:
      "The dish carries the memory of Korea's Chinese immigrant community — fully naturalised while keeping its foreign name.",
    culturalMeaningKo:
      "이 음식은 한국 화교 사회의 기억을 품고 있습니다. 외국 이름을 그대로 단 채 완전히 귀화한 요리예요.",
    culturalMeaningEs:
      "El plato guarda la memoria de la comunidad china de Corea: completamente nacionalizado sin dejar de llevar su nombre extranjero.",
    whenToExperience:
      "Moving day, the day report cards come out, or any weeknight nobody wants to cook.",
    whenToExperienceKo:
      "이사하는 날, 성적표 나오는 날, 아니면 아무도 요리하기 싫은 평일 저녁.",
    whenToExperienceEs:
      "El día de la mudanza, el día de las notas, o cualquier noche entre semana en que nadie quiere cocinar.",
    mission: {
      title: 'Order Like a Local',
      detail: "Get one jjajangmyeon and one jjamppong for the table and swap halfway — the standard Korean answer to an unwinnable choice.",
    },
    missionKo: { title: "현지인처럼 주문하기", detail: "짜장면 하나와 짬뽕 하나를 시켜 놓고 중간에 바꿔 드세요 — 결론이 안 나는 선택에 대한 한국식 정답입니다." },
    missionEs: { title: "Pide como un local", detail: "Pide un jjajangmyeon y un jjamppong para la mesa e intercambiadlos a mitad: la respuesta coreana estándar a una elección imposible." },
    restaurantIds: ['osegyehyang', 'gonghwachun'],
    marketIds: [],
    zones: ['Insadong, Seoul', 'Chinatown, Jemulpo-gu, Incheon'],
    acceptsSelfAttest: false,
  },
  {
    id: 'weekend-brunch',
    kind: EXPERIENCE_KIND.DISH,
    title: 'The Weekend Brunch',
    titleKo: '주말 브런치',
    titleEs: "El brunch del fin de semana",
    status: STATUS.PUBLISHED,
    whyItMatters:
      'Seoul treats the weekend late morning as a destination rather than a meal, and will cross the city for a bakery that sold out by noon last week.',
    whyItMattersKo:
      "서울은 주말 늦은 아침을 끼니가 아니라 목적지로 여기고, 지난주 정오에 동난 빵집을 위해 도시를 가로지릅니다.",
    whyItMattersEs:
      "Seúl trata la mañana del fin de semana como un destino y no como una comida, y cruzará la ciudad por una panadería que agotó a mediodía la semana pasada.",
    culturalMeaning:
      'The Korean cafe is a social institution in its own right — a place to be seen, to work, to linger — built on baking traditions borrowed and then remade.',
    culturalMeaningKo:
      "한국의 카페는 그 자체로 사회적 제도입니다. 보이고, 일하고, 머무는 자리이며, 빌려 와 다시 만든 제빵 전통 위에 서 있어요.",
    culturalMeaningEs:
      "La cafetería coreana es una institución social por derecho propio — un sitio para dejarse ver, trabajar y quedarse — levantada sobre tradiciones de panadería tomadas prestadas y rehechas.",
    whenToExperience:
      'Saturday or Sunday before eleven, if you want the thing that sells out.',
    whenToExperienceKo:
      "토요일이나 일요일 열한 시 전, 동나는 그것을 먹고 싶다면요.",
    whenToExperienceEs:
      "Sábado o domingo antes de las once, si quieres lo que se agota.",
    mission: {
      title: 'Baked This Morning',
      detail: 'Ask what came out of the oven today and order that instead of what you planned. The lineup changes daily and rarely makes the menu.',
    },
    missionKo: { title: "오늘 아침에 구운 것", detail: "오늘 오븐에서 나온 게 뭔지 묻고, 원래 시키려던 것 대신 그걸 주문하세요. 구성은 매일 바뀌고 메뉴판에는 잘 오르지 않습니다." },
    missionEs: { title: "Horneado esta mañana", detail: "Pregunta qué ha salido hoy del horno y pide eso en lugar de lo que tenías pensado. El surtido cambia a diario y rara vez llega a la carta." },
    restaurantIds: ['iryonghal', 'meat-morning'],
    marketIds: [],
    zones: ['Guwol-dong, Incheon'],
    acceptsSelfAttest: false,
  },
  {
    id: 'zero-waste-counter',
    kind: EXPERIENCE_KIND.PLACE,
    title: 'The Zero-Waste Counter',
    titleKo: '제로웨이스트',
    titleEs: "El mostrador sin residuos",
    status: STATUS.PUBLISHED,
    whyItMatters:
      'Nothing disposable crosses the counter. Regulars bring their own containers without being asked, which makes it a habit rather than a marketing angle.',
    whyItMattersKo:
      "일회용품은 계산대를 넘어오지 않습니다. 단골들은 말하지 않아도 자기 용기를 들고 오고, 그래서 마케팅이 아니라 습관이 됩니다.",
    whyItMattersEs:
      "Nada desechable cruza el mostrador. Los habituales traen sus propios recipientes sin que nadie se lo pida, y eso lo convierte en costumbre y no en argumento de marketing.",
    culturalMeaning:
      'Korea recycles most of its food waste by law, and every household separates it. These counters take the next step and refuse to create the waste at all.',
    culturalMeaningKo:
      "한국은 법으로 음식물 쓰레기 대부분을 재활용하고, 모든 가정이 분리합니다. 이 가게들은 한 걸음 더 나아가 애초에 쓰레기를 만들기를 거부합니다.",
    culturalMeaningEs:
      "Corea recicla por ley la mayor parte de sus residuos de comida y todos los hogares los separan. Estos mostradores dan un paso más y se niegan a generarlos.",
    whenToExperience:
      'Any afternoon you can carry a cup. Bring one and most shops take a little off the price.',
    whenToExperienceKo:
      "컵을 들고 다닐 수 있는 아무 오후나. 가져가면 대부분의 가게가 값을 조금 깎아 줍니다.",
    whenToExperienceEs:
      "Cualquier tarde en que puedas llevar un vaso. Llévalo y la mayoría de las tiendas te quitan algo del precio.",
    mission: {
      title: 'Leave Nothing Behind',
      detail: 'Refuse one disposable item — cup, bag, straw. Ask what happens to the food scraps while you are at it.',
    },
    missionKo: { title: "아무것도 남기지 않기", detail: "일회용품 하나를 거절하세요 — 컵, 봉투, 빨대 중 하나. 겸사겸사 음식물 찌꺼기가 어디로 가는지도 물어보시고요." },
    missionEs: { title: "No dejes nada", detail: "Rechaza un desechable: un vaso, una bolsa, una pajita. Y ya que estás, pregunta qué pasa con los restos de comida." },
    restaurantIds: ['nono-shop', 'ggot-epida'],
    marketIds: [],
    zones: ['Hoehyeon, Seoul', 'Bukchon, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'late-night-table',
    kind: EXPERIENCE_KIND.SETTING,
    title: 'The Late Table',
    titleKo: '심야식당',
    titleEs: "La mesa de madrugada",
    status: STATUS.PREVIEW,
    whyItMatters:
      'Seoul does not really close. The table you sit at near midnight has a different crowd and a slower conversation than the same table at seven.',
    whyItMattersKo:
      "서울은 사실상 닫지 않습니다. 자정 무렵 앉은 그 자리는 저녁 일곱 시의 같은 자리와 손님도, 대화의 속도도 다릅니다.",
    whyItMattersEs:
      "Seúl no cierra del todo. La mesa a la que te sientas cerca de medianoche tiene otra gente y otra conversación que la misma mesa a las siete.",
    culturalMeaning:
      'Late eating is tied to Korea\'s long working hours: dinner is often the second half of the workday, and the meal after it is the first honest one.',
    culturalMeaningKo:
      "늦게 먹는 문화는 한국의 긴 노동시간과 이어져 있습니다. 저녁은 종종 근무의 후반부이고, 그 뒤의 끼니가 첫 솔직한 자리예요.",
    culturalMeaningEs:
      "Comer tarde va unido a las largas jornadas coreanas: la cena es a menudo la segunda mitad del trabajo, y la comida de después es la primera sincera.",
    whenToExperience:
      'After ten, when the dinner rush has cleared and nobody is waiting for your seat.',
    whenToExperienceKo:
      "열 시 이후, 저녁 손님이 빠지고 아무도 당신 자리를 기다리지 않을 때.",
    whenToExperienceEs:
      "Después de las diez, cuando ha pasado la hora punta y nadie espera tu sitio.",
    mission: {
      title: 'Stay for the Second Round',
      detail: 'Korean nights move in rounds — 1차, 2차. Do not leave after the first one.',
    },
    missionKo: { title: "2차까지 가기", detail: "한국의 밤은 차수로 흘러갑니다 — 1차, 2차. 1차에서 일어나지 마세요." },
    missionEs: { title: "Quédate a la segunda ronda", detail: "Las noches coreanas van por rondas: 1차, 2차. No te vayas después de la primera." },
    restaurantIds: ['camouflage'],
    marketIds: [],
    zones: ['Itaewon, Seoul'],
    acceptsSelfAttest: false,
  },
  {
    id: 'hoe-sashimi',
    kind: EXPERIENCE_KIND.DISH,
    title: 'Hoe',
    titleKo: '회',
    titleEs: "Hoe",
    status: STATUS.PREVIEW,
    whyItMatters:
      'Korean raw fish is served firm rather than melting, cut thick, and eaten wrapped in leaves with ssamjang instead of dipped in soy.',
    whyItMattersKo:
      "한국의 회는 녹는 식감이 아니라 단단하게, 두껍게 썰어 나오고, 간장에 찍기보다 잎에 쌈장과 함께 싸서 먹습니다.",
    whyItMattersEs:
      "El pescado crudo coreano se sirve firme en vez de fundente, cortado grueso, y se come envuelto en hojas con ssamjang en lugar de mojado en soja.",
    culturalMeaning:
      'Busan built its identity on the sea, and hoe is where that shows most plainly: the fish is chosen live, and freshness is the entire argument.',
    culturalMeaningKo:
      "부산은 바다 위에 정체성을 세웠고, 회에서 그것이 가장 분명히 드러납니다. 생선은 살아 있는 채로 고르고, 신선도가 논쟁의 전부예요.",
    culturalMeaningEs:
      "Busan construyó su identidad sobre el mar, y en el hoe se ve con más claridad: el pescado se elige vivo y la frescura es todo el argumento.",
    whenToExperience:
      'On the coast, in the evening, with company — it is ordered by the plate for a table, not by the portion.',
    whenToExperienceKo:
      "해안에서, 저녁에, 여럿이서 — 인분이 아니라 상 단위 접시로 주문합니다.",
    whenToExperienceEs:
      "En la costa, por la tarde, acompañado: se pide por plato para la mesa, no por ración.",
    mission: {
      title: 'Wrap It, Do Not Dip It',
      detail: 'Take a perilla leaf, add the fish and a little ssamjang, and eat it in one bite. Dipping it in soy sauce is the foreign habit.',
    },
    missionKo: { title: "찍지 말고 싸서", detail: "깻잎에 회 한 점과 쌈장 조금을 올려 한 입에 드세요. 간장에 찍는 건 외국인의 습관입니다." },
    missionEs: { title: "Envuélvelo, no lo mojes", detail: "Coge una hoja de perilla, pon el pescado y un poco de ssamjang, y cómelo de un bocado. Mojarlo en soja es la costumbre extranjera." },
    restaurantIds: [],
    marketIds: [],
    zones: ['Busan'],
    acceptsSelfAttest: true,
  },
  {
    id: 'jagalchi-morning',
    kind: EXPERIENCE_KIND.PLACE,
    title: 'A Morning at Jagalchi',
    titleKo: '자갈치시장',
    titleEs: "Una mañana en Jagalchi",
    status: STATUS.PREVIEW,
    whyItMatters:
      "Korea's largest seafood market, run largely by women whose trade passed mother to daughter — the jagalchi ajumma are the market's actual institution.",
    whyItMattersKo:
      "한국 최대의 수산시장이고, 대부분 어머니에서 딸로 이어진 여성들이 운영합니다. 자갈치 아지매가 이 시장의 진짜 제도예요.",
    whyItMattersEs:
      "El mayor mercado de pescado de Corea, llevado en su mayoría por mujeres cuyo oficio pasó de madre a hija: las jagalchi ajumma son la institución real del mercado.",
    culturalMeaning:
      'Busan absorbed waves of refugees during the Korean War, and the market fed them. Its scale is a direct inheritance of that history.',
    culturalMeaningKo:
      "부산은 한국전쟁 동안 피란민의 물결을 받아들였고, 이 시장이 그들을 먹였습니다. 시장의 규모는 그 역사의 직접적인 유산입니다.",
    culturalMeaningEs:
      "Busan absorbió oleadas de refugiados durante la Guerra de Corea y el mercado los alimentó. Su tamaño es herencia directa de esa historia.",
    whenToExperience:
      'Early, while the auction is still running and the day\'s catch is being argued over.',
    whenToExperienceKo:
      "이른 아침, 경매가 아직 돌아가고 그날의 어획을 두고 실랑이가 벌어질 때.",
    whenToExperienceEs:
      "Temprano, mientras la subasta sigue en marcha y se discute la captura del día.",
    mission: {
      title: 'Buy Upstairs',
      detail: 'Choose your fish at a stall downstairs and take it up to be prepared. That two-step is how the market is meant to be used.',
    },
    missionKo: { title: "위층에서 손질", detail: "아래층 좌판에서 생선을 고르고 위층으로 들고 올라가 손질을 맡기세요. 그 두 단계가 이 시장을 쓰는 방식입니다." },
    missionEs: { title: "Compra abajo, sube después", detail: "Elige el pescado en un puesto de abajo y súbelo para que lo preparen. Ese doble paso es como se usa el mercado." },
    restaurantIds: [],
    marketIds: [],
    zones: ['Busan'],
    acceptsSelfAttest: true,
  },
  {
    id: 'spring-picnic-set',
    kind: EXPERIENCE_KIND.SETTING,
    title: 'Cherry Blossom Picnic',
    titleKo: '봄 소풍',
    titleEs: "Picnic bajo los cerezos",
    status: STATUS.PREVIEW,
    whyItMatters:
      'For two weeks a year the whole country eats outdoors. Parks fill with mats, convenience-store chicken and shared bottles, and nobody treats it as remarkable.',
    whyItMattersKo:
      "일 년에 두 주 동안 온 나라가 밖에서 먹습니다. 공원은 돗자리와 편의점 치킨과 나눠 마시는 술병으로 차고, 아무도 그걸 특별하게 여기지 않아요.",
    whyItMattersEs:
      "Durante dos semanas al año el país entero come al aire libre. Los parques se llenan de esterillas, pollo de tienda 24 horas y botellas compartidas, y nadie lo considera extraordinario.",
    culturalMeaning:
      'Blossom season is Korea\'s clearest seasonal ritual — brief on purpose, and valued because it cannot be extended.',
    culturalMeaningKo:
      "벚꽃철은 한국에서 가장 뚜렷한 계절 의식입니다. 일부러 짧고, 늘릴 수 없기 때문에 귀합니다.",
    culturalMeaningEs:
      "La temporada de los cerezos es el ritual estacional más claro de Corea: breve a propósito, y valiosa porque no se puede alargar.",
    whenToExperience:
      'Early April, whichever week the blossom actually opens. It moves by a fortnight year to year.',
    whenToExperienceKo:
      "4월 초, 꽃이 실제로 피는 그 주. 해마다 두 주쯤 움직입니다.",
    whenToExperienceEs:
      "Principios de abril, la semana en que el cerezo abre de verdad. Se mueve un par de semanas de un año a otro.",
    mission: {
      title: 'Bring the Mat',
      detail: 'A picnic mat is the one non-negotiable item. Get one from any convenience store and claim a patch under the trees.',
    },
    missionKo: { title: "돗자리는 필수", detail: "돗자리 하나는 타협할 수 없는 준비물입니다. 아무 편의점에서 사서 나무 밑 한 자리를 차지하세요." },
    missionEs: { title: "Lleva la esterilla", detail: "La esterilla es el único objeto no negociable. Cómprala en cualquier tienda 24 horas y hazte con un trozo de suelo bajo los árboles." },
    restaurantIds: [],
    marketIds: [],
    zones: [],
    acceptsSelfAttest: true,
  },
];

const byId = new Map(experiences.map(e => [e.id, e]));

export const experienceById = (id) => byId.get(id);

/**
 * Does this experience have a real-world anchor to visit?
 *
 * The single definition of "anchored". Completion, playability and the
 * integrity gate all ask this rather than each spelling out the field
 * checks, so adding an anchor kind later is one edit here instead of three
 * that must stay in lockstep.
 */
export const hasAnchor = (e) => e.restaurantIds.length > 0 || e.marketIds.length > 0;
