// Narrative catalog — a path through a Theme's territory.
//
// Narrative is what makes a Theme executable. Ordering, necessity and the
// connective prose between steps all live here rather than on the Theme,
// because one territory can be crossed several ways: a half-day version, a
// rainy-evening version, a vegetarian version.
//
// `required` sits on the step rather than on Theme membership: being
// essential is a property of the path, not of the culture.

import { STATUS } from '../types.js';

export const narratives = [
  {
    id: 'temple-half-day',
    themeId: 'temple-life',
    title: 'A Half Day at the Temple Table',
    intro:
      'Give this half a day and no appointments afterwards. The point of a temple meal is that it cannot be rushed, and a schedule waiting on the other side will spoil it.',
    outro:
      'You have eaten the way a tradition intends rather than the way a menu suggests. Whatever you do next, do it slowly.',
    titleKo: "절 밥상에서 보내는 반나절",
    titleEs: "Media jornada en la mesa del templo",
    titleFr: "Une demi-journée à la table du temple",
    introKo:
      "반나절을 비우고, 그 뒤에 약속을 두지 마세요. 절 밥상의 핵심은 서두를 수 없다는 것이고, 뒤에서 기다리는 일정은 그것을 망칩니다.",
    introEs:
      "Reserva media jornada y no pongas nada detrás. El sentido de una comida de templo es que no se puede acelerar, y una cita esperando al otro lado la estropea.",
    introFr:
      "Accordez-lui une demi-journée, et aucun rendez-vous derrière. Le sens d'un repas de temple est qu'on ne peut pas le presser, et un horaire qui attend de l'autre côté le gâche.",
    outroKo:
      "메뉴판이 권하는 방식이 아니라 하나의 전통이 의도한 방식으로 드셨습니다. 다음에 무엇을 하시든, 천천히 하세요.",
    outroEs:
      "Has comido como pretende una tradición y no como sugiere una carta. Hagas lo que hagas después, hazlo despacio.",
    outroFr:
      "Vous avez mangé comme une tradition l'entend, et non comme une carte le suggère. Quoi que vous fassiez ensuite, faites-le lentement.",
    pacing: 'half-day',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'street-first-timer',
    themeId: 'street-food',
    title: "First Timer's Market Crawl",
    intro:
      'Arrive hungry and with cash. This is a standing, pointing, shoulder-to-shoulder kind of meal, and it works best if you do not plan the order in advance.',
    outro:
      'You have eaten the way the city has eaten for a century. The stall you liked will be there next week.',
    titleKo: "처음이라면, 시장 한 바퀴",
    titleEs: "Primera vuelta al mercado",
    titleFr: "Premier tour de marché",
    introKo:
      "배고픈 채로, 현금을 들고 오세요. 서서, 손가락으로 가리키며, 어깨를 맞대고 먹는 식사입니다. 순서를 미리 정하지 않는 편이 낫습니다.",
    introEs:
      "Llega con hambre y con efectivo. Es una comida de estar de pie, señalar y comer hombro con hombro, y funciona mejor si no planeas el orden.",
    introFr:
      "Arrivez affamé et avec des espèces. C'est un repas debout, du doigt, épaule contre épaule, et cela marche mieux si vous ne planifiez pas l'ordre à l'avance.",
    outroKo:
      "이 도시가 백 년 동안 먹어 온 방식으로 드셨습니다. 마음에 든 그 노점은 다음 주에도 거기 있습니다.",
    outroEs:
      "Has comido como come esta ciudad desde hace un siglo. El puesto que te gustó seguirá ahí la semana que viene.",
    outroFr:
      "Vous avez mangé comme la ville mange depuis un siècle. L'étal que vous avez aimé sera là la semaine prochaine.",
    pacing: 'evening',
    status: STATUS.PREVIEW,
  },
  {
    id: 'cafe-slow-morning',
    themeId: 'cafe-hopping',
    title: 'A Slow Morning',
    intro:
      'Go before eleven and bring nothing you need to finish. The whole point is that the seat is yours for as long as you want it.',
    outro:
      'You spent a morning the way this city spends its weekends. Nobody once asked whether you were done.',
    titleKo: "느린 아침",
    titleEs: "Una mañana lenta",
    titleFr: "Une matinée lente",
    introKo:
      "열한 시 전에 가고, 끝내야 할 것은 아무것도 들고 가지 마세요. 그 자리가 원하는 만큼 당신 것이라는 게 전부입니다.",
    introEs:
      "Ve antes de las once y no lleves nada que tengas que terminar. Todo el sentido es que el sitio es tuyo el tiempo que quieras.",
    introFr:
      "Allez-y avant onze heures et n'emportez rien que vous deviez finir. Tout l'intérêt est que la place est à vous aussi longtemps que vous la voulez.",
    outroKo:
      "이 도시가 주말을 쓰는 방식으로 아침을 보내셨습니다. 아무도 다 드셨냐고 묻지 않았죠.",
    outroEs:
      "Has pasado una mañana como pasa esta ciudad sus fines de semana. Nadie te preguntó ni una vez si habías terminado.",
    outroFr:
      "Vous avez passé une matinée comme cette ville passe ses week-ends. Personne ne vous a demandé une seule fois si vous aviez fini.",
    pacing: 'half-day',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'after-dark-first-round',
    themeId: 'seoul-after-dark',
    title: 'First Round, Second Round',
    intro:
      'Start late and do not plan the end. A Korean night is measured in rounds, and the second one is where the conversation changes.',
    outro:
      'The table after ten is not the table at seven. You have now sat at both.',
    titleKo: "1차, 그리고 2차",
    titleEs: "Primera ronda, segunda ronda",
    titleFr: "Première tournée, deuxième tournée",
    introKo:
      "늦게 시작하고 끝을 정하지 마세요. 한국의 밤은 차수로 재고, 대화가 달라지는 건 2차입니다.",
    introEs:
      "Empieza tarde y no planees el final. Una noche coreana se mide en rondas, y es en la segunda donde cambia la conversación.",
    introFr:
      "Commencez tard et ne prévoyez pas la fin. Une nuit coréenne se mesure en tournées, et c'est à la deuxième que la conversation change.",
    outroKo:
      "열 시 이후의 상은 일곱 시의 상이 아닙니다. 이제 둘 다 앉아 보셨어요.",
    outroEs:
      "La mesa después de las diez no es la mesa de las siete. Ahora te has sentado a las dos.",
    outroFr:
      "La table après dix heures n'est pas la table de sept heures. Vous vous êtes maintenant assis aux deux.",
    pacing: 'evening',
    status: STATUS.PREVIEW,
  },
  {
    id: 'busan-market-day',
    themeId: 'busan-seafood',
    title: 'Market First, Table After',
    intro:
      'A coastal day in the order Busan does it: see the fish argued over before you eat any of it.',
    outro:
      'Freshness stopped being a menu adjective and became something you watched happen.',
    titleKo: "시장 먼저, 상은 그 다음",
    titleEs: "Primero el mercado, después la mesa",
    titleFr: "D'abord le marché, la table ensuite",
    introKo:
      "부산이 하는 순서 그대로의 바닷가 하루: 먹기 전에 그 생선을 두고 벌어지는 실랑이를 먼저 보세요.",
    introEs:
      "Un día de costa en el orden en que lo hace Busan: mira cómo se discute el pescado antes de comerte nada de él.",
    introFr:
      "Une journée côtière dans l'ordre où Busan la fait : voyez le poisson se disputer avant d'en manger.",
    outroKo:
      "신선도가 메뉴판의 형용사이기를 멈추고, 눈앞에서 벌어지는 일이 되었습니다.",
    outroEs:
      "La frescura dejó de ser un adjetivo de carta y pasó a ser algo que viste ocurrir.",
    outroFr:
      "La fraîcheur a cessé d'être un adjectif de carte pour devenir quelque chose que vous avez vu se produire.",
    pacing: 'full-day',
    status: STATUS.PREVIEW,
  },
  {
    id: 'blossom-afternoon',
    themeId: 'spring-picnic',
    title: 'An Afternoon Under the Trees',
    intro:
      'Two weeks a year this is the best thing to do in Korea, and it costs almost nothing.',
    outro:
      'It will be over within a fortnight. That is why everyone went.',
    titleKo: "나무 아래에서의 오후",
    titleEs: "Una tarde bajo los árboles",
    titleFr: "Un après-midi sous les arbres",
    introKo:
      "일 년에 두 주, 한국에서 할 수 있는 가장 좋은 일이고, 돈은 거의 들지 않습니다.",
    introEs:
      "Dos semanas al año esto es lo mejor que se puede hacer en Corea, y no cuesta casi nada.",
    introFr:
      "Deux semaines par an, c'est la meilleure chose à faire en Corée, et cela ne coûte presque rien.",
    outroKo:
      "두 주 안에 끝납니다. 그래서 다들 나갔던 거예요.",
    outroEs:
      "Se acabará en quince días. Por eso fue todo el mundo.",
    outroFr:
      "Ce sera fini dans une quinzaine. C'est pour cela que tout le monde y est allé.",
    pacing: 'half-day',
    status: STATUS.PREVIEW,
  },
  {
    id: 'noodle-origin',
    themeId: 'noodle-road',
    title: 'Where the Bowl Came From',
    intro:
      'One dish, traced back to the port that invented it. Short, and better done at lunch.',
    outro:
      'A Chinese dish, invented in Korea, eaten by everyone. That is the whole story of the noodle road.',
    titleKo: "그 그릇은 어디서 왔나",
    titleEs: "De dónde vino el cuenco",
    titleFr: "D'où vient le bol",
    introKo:
      "음식 하나를, 그것을 만든 항구까지 거슬러 올라갑니다. 짧고, 점심에 하는 편이 낫습니다.",
    introEs:
      "Un solo plato, rastreado hasta el puerto que lo inventó. Corto, y mejor a la hora de comer.",
    introFr:
      "Un plat, remonté jusqu'au port qui l'a inventé. Court, et meilleur au déjeuner.",
    outroKo:
      "중국 음식이고, 한국에서 만들어졌고, 모두가 먹습니다. 그게 국수의 길 전부입니다.",
    outroEs:
      "Un plato chino, inventado en Corea, que come todo el mundo. Esa es la historia entera de la ruta de los fideos.",
    outroFr:
      "Un plat chinois, inventé en Corée, mangé par tout le monde. C'est toute l'histoire de la route des nouilles.",
    pacing: 'half-day',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'street-quick-bite',
    themeId: 'street-food',
    title: 'Thirty Minutes at the Market',
    intro:
      'The short version. One stall, one thing, eaten standing up, and back out — this is how the market is used on an ordinary weekday.',
    outro:
      'You did not see the whole market, and that is the point. It is a place to drop into, not an itinerary.',
    titleKo: "시장에서 30분",
    titleEs: "Treinta minutos en el mercado",
    titleFr: "Trente minutes au marché",
    introKo:
      "짧은 판입니다. 한 노점, 한 가지, 서서 먹고 나오기 — 평일에 시장을 쓰는 방식이 이렇습니다.",
    introEs:
      "La versión corta. Un puesto, una cosa, de pie, y fuera: así se usa el mercado un día cualquiera entre semana.",
    introFr:
      "La version courte. Un étal, une chose, mangée debout, et on ressort — c'est ainsi qu'on utilise le marché un jour de semaine ordinaire.",
    outroKo:
      "시장을 다 보지는 않으셨고, 그게 핵심입니다. 여기는 일정표가 아니라 잠깐 들르는 곳이에요.",
    outroEs:
      "No has visto el mercado entero, y ese es el sentido. Es un sitio en el que caer, no un itinerario.",
    outroFr:
      "Vous n'avez pas vu tout le marché, et c'est le but. C'est un endroit où l'on passe, pas un itinéraire.",
    pacing: 'evening',
    status: STATUS.PREVIEW,
  },
];

export const narrativeSteps = [
  {
    narrativeId: 'temple-half-day',
    experienceId: 'temple-cuisine',
    order: 1,
    required: true,
    transition:
      'Start at the table. Everything else in this path is a way of extending the quiet it leaves behind.',
    transitionKo:
      "상에서 시작하세요. 이 길의 나머지는 전부 그 상이 남긴 고요를 늘리는 방법입니다.",
    transitionEs:
      "Empieza en la mesa. Todo lo demás en este camino es una forma de alargar el silencio que deja.",
    transitionFr:
      "Commencez par la table. Tout le reste de ce chemin est une façon de prolonger le calme qu'elle laisse.",
  },
  {
    narrativeId: 'temple-half-day',
    experienceId: 'temple-tea',
    order: 2,
    required: false,
    transition:
      'When the bowl is empty, do not leave. The pot that follows is where the conversation starts.',
    transitionKo:
      "그릇이 비어도 일어나지 마세요. 뒤이어 나오는 차 주전자에서 대화가 시작됩니다.",
    transitionEs:
      "Cuando el cuenco esté vacío, no te vayas. La tetera que viene después es donde empieza la conversación.",
    transitionFr:
      "Quand le bol est vide, ne partez pas. C'est autour de la théière qui suit que la conversation commence.",
  },

  {
    narrativeId: 'street-first-timer',
    experienceId: 'gwangjang-market',
    order: 1,
    required: true,
    transition:
      'Get inside the market first. Nothing else here makes sense until you have seen the scale of it.',
    transitionKo:
      "먼저 시장 안으로 들어가세요. 그 규모를 보기 전에는 나머지가 이해되지 않습니다.",
    transitionEs:
      "Métete primero en el mercado. Nada de esto tiene sentido hasta que has visto su tamaño.",
    transitionFr:
      "Entrez d'abord dans le marché. Rien d'autre ici n'a de sens tant que vous n'en avez pas vu l'ampleur.",
  },
  {
    narrativeId: 'street-first-timer',
    experienceId: 'bindaetteok',
    order: 2,
    required: true,
    transition:
      'Follow the loudest griddle. The pancake being poured in front of you is the one to order.',
    transitionKo:
      "소리가 가장 큰 철판을 따라가세요. 눈앞에서 붓고 있는 그 전이 시킬 것입니다.",
    transitionEs:
      "Sigue la plancha que más suena. La tortita que están echando delante de ti es la que hay que pedir.",
    transitionFr:
      "Suivez la plaque la plus bruyante. La galette qu'on verse devant vous est celle qu'il faut commander.",
  },
  {
    narrativeId: 'street-first-timer',
    experienceId: 'makgeolli',
    order: 3,
    required: false,
    transition:
      'Fried food asks for makgeolli. Order a bowl for the table rather than a glass for yourself.',
    transitionKo:
      "튀김에는 막걸리입니다. 혼자 마실 잔이 아니라 상에 놓을 한 통을 시키세요.",
    transitionEs:
      "La fritura pide makgeolli. Pide un cuenco para la mesa en vez de un vaso para ti.",
    transitionFr:
      "La friture appelle le makgeolli. Commandez un bol pour la table plutôt qu'un verre pour vous.",
  },
  {
    narrativeId: 'street-first-timer',
    experienceId: 'market-alley',
    order: 4,
    required: false,
    transition:
      'Before you leave, walk the alley end to end. Seeing the whole trade in one line is the part people remember.',
    transitionKo:
      "나가기 전에 골목을 끝에서 끝까지 걸으세요. 한 줄에 늘어선 업종 전체를 보는 것이 사람들이 기억하는 부분입니다.",
    transitionEs:
      "Antes de irte, recorre el callejón de punta a punta. Ver todo el oficio en una sola línea es lo que la gente recuerda.",
    transitionFr:
      "Avant de partir, faites l'allée d'un bout à l'autre. Voir tout un métier aligné est ce dont les gens se souviennent.",
  },

  {
    narrativeId: 'street-quick-bite',
    experienceId: 'gwangjang-market',
    order: 1,
    required: true,
    transition:
      'Go straight in and order at the first stall that looks busy. Busy means the turnover is fast and the food is fresh.',
    transitionKo:
      "곧장 들어가서 붐비는 첫 노점에 주문하세요. 붐빈다는 건 회전이 빠르고 음식이 신선하다는 뜻입니다.",
    transitionEs:
      "Entra directo y pide en el primer puesto que se vea lleno. Lleno significa que rota rápido y la comida está fresca.",
    transitionFr:
      "Entrez tout droit et commandez au premier étal qui a du monde. Du monde veut dire que ça tourne vite et que c'est frais.",
  },

  {
    narrativeId: 'cafe-slow-morning',
    experienceId: 'weekend-brunch',
    order: 1,
    required: true,
    transition:
      'Start with whatever came out of the oven this morning. Ask rather than read — the best item is rarely on the board.',
    transitionKo:
      "오늘 아침 오븐에서 나온 것으로 시작하세요. 읽지 말고 물어보세요 — 제일 좋은 건 칠판에 잘 없습니다.",
    transitionEs:
      "Empieza por lo que haya salido hoy del horno. Pregunta en vez de leer: lo mejor rara vez está en la pizarra.",
    transitionFr:
      "Commencez par ce qui est sorti du four ce matin. Demandez plutôt que lire — le meilleur est rarement au tableau.",
  },
  {
    narrativeId: 'cafe-slow-morning',
    experienceId: 'zero-waste-counter',
    order: 2,
    required: false,
    transition:
      'If you are still carrying a cup, spend the second half of the morning somewhere that rewards it.',
    transitionKo:
      "컵을 아직 들고 계시다면, 아침의 후반은 그걸 알아주는 곳에서 보내세요.",
    transitionEs:
      "Si todavía llevas el vaso, pasa la segunda mitad de la mañana en un sitio que lo premie.",
    transitionFr:
      "Si vous portez encore une tasse, passez la seconde moitié de la matinée là où cela vous est rendu.",
  },

  {
    narrativeId: 'after-dark-first-round',
    experienceId: 'late-night-table',
    order: 1,
    required: true,
    transition:
      'Arrive after the dinner rush has cleared. The room you want is the quieter one that follows it.',
    transitionKo:
      "저녁 손님이 빠진 뒤에 도착하세요. 원하는 방은 그 다음에 오는 조용한 쪽입니다.",
    transitionEs:
      "Llega cuando haya pasado la hora punta. La sala que quieres es la más tranquila que viene después.",
    transitionFr:
      "Arrivez une fois la ruée du dîner passée. La salle que vous voulez est la plus calme qui suit.",
  },
  {
    narrativeId: 'after-dark-first-round',
    experienceId: 'makgeolli',
    order: 2,
    required: false,
    transition:
      'Second round. Order a bowl for the table and pour for someone else before yourself.',
    transitionKo:
      "2차입니다. 상에 놓을 한 통을 시키고, 자기 것보다 남의 것을 먼저 따르세요.",
    transitionEs:
      "Segunda ronda. Pide un cuenco para la mesa y sirve a otro antes que a ti.",
    transitionFr:
      "Deuxième tournée. Commandez un bol pour la table et servez quelqu'un d'autre avant vous.",
  },

  {
    narrativeId: 'busan-market-day',
    experienceId: 'jagalchi-morning',
    order: 1,
    required: true,
    transition:
      'Go early, while the auction is still running. The market is a working floor before it is anything else.',
    transitionKo:
      "경매가 아직 돌아가는 이른 시간에 가세요. 시장은 무엇이기 이전에 일하는 바닥입니다.",
    transitionEs:
      "Ve temprano, mientras la subasta sigue. El mercado es una nave de trabajo antes que ninguna otra cosa.",
    transitionFr:
      "Allez-y tôt, pendant que la criée tourne encore. Le marché est un lieu de travail avant d'être autre chose.",
  },
  {
    narrativeId: 'busan-market-day',
    experienceId: 'hoe-sashimi',
    order: 2,
    required: false,
    transition:
      'Take what you chose upstairs to be prepared. That two-step is the whole ritual.',
    transitionKo:
      "고른 것을 위층으로 들고 올라가 손질을 맡기세요. 그 두 단계가 의식의 전부입니다.",
    transitionEs:
      "Sube lo que has elegido para que te lo preparen. Ese doble paso es el ritual entero.",
    transitionFr:
      "Montez ce que vous avez choisi pour le faire préparer. Ce double geste est tout le rituel.",
  },

  {
    narrativeId: 'blossom-afternoon',
    experienceId: 'spring-picnic-set',
    order: 1,
    required: true,
    transition:
      'Claim a patch under the trees before noon. After that you are choosing between the leftovers.',
    transitionKo:
      "정오 전에 나무 밑 한 자리를 차지하세요. 그 뒤에는 남은 자리들 중에서 고르게 됩니다.",
    transitionEs:
      "Hazte con un trozo de suelo bajo los árboles antes del mediodía. Después eliges entre las sobras.",
    transitionFr:
      "Revendiquez un bout de sol sous les arbres avant midi. Après, vous choisissez parmi les restes.",
  },

  {
    narrativeId: 'noodle-origin',
    experienceId: 'jajangmyeon',
    order: 1,
    required: true,
    transition:
      'Begin with the bowl itself. The history reads differently once you have tasted what it produced.',
    transitionKo:
      "그릇 자체에서 시작하세요. 그것이 무엇을 낳았는지 맛본 뒤에는 역사가 다르게 읽힙니다.",
    transitionEs:
      "Empieza por el cuenco. La historia se lee distinta una vez has probado lo que produjo.",
    transitionFr:
      "Commencez par le bol lui-même. L'histoire se lit autrement une fois qu'on a goûté ce qu'elle a produit.",
  },
];

const byId = new Map(narratives.map(n => [n.id, n]));

export const narrativeById = (id) => byId.get(id);

export const narrativesOfTheme = (themeId) => narratives.filter(n => n.themeId === themeId);

export const stepsOfNarrative = (narrativeId) =>
  narrativeSteps.filter(s => s.narrativeId === narrativeId).sort((a, b) => a.order - b.order);
