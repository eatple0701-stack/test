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
    titleAr: "نصف يوم على مائدة المعبد",
    titleZh: "在寺院饭桌前的半天",
    titleJa: "寺の食卓で過ごす半日",
    introKo:
      "반나절을 비우고, 그 뒤에 약속을 두지 마세요. 절 밥상의 핵심은 서두를 수 없다는 것이고, 뒤에서 기다리는 일정은 그것을 망칩니다.",
    introEs:
      "Reserva media jornada y no pongas nada detrás. El sentido de una comida de templo es que no se puede acelerar, y una cita esperando al otro lado la estropea.",
    introFr:
      "Accordez-lui une demi-journée, et aucun rendez-vous derrière. Le sens d'un repas de temple est qu'on ne peut pas le presser, et un horaire qui attend de l'autre côté le gâche.",
    introAr:
      "امنحه نصف يوم ولا تضع بعده موعدًا. معنى وجبة المعبد أنه لا يمكن استعجالها، وجدول ينتظر على الطرف الآخر يفسدها.",
    introZh:
      "给它半天，后面别排事。寺院这顿饭的意思就在于它急不得，而另一头等着的日程会把它毁掉。",
    introJa:
      "半日を空けて、そのあとに予定を置かないでください。寺の食事の要点は急げないことにあり、向こう側で待っている予定はそれを台無しにします。",
    outroKo:
      "메뉴판이 권하는 방식이 아니라 하나의 전통이 의도한 방식으로 드셨습니다. 다음에 무엇을 하시든, 천천히 하세요.",
    outroEs:
      "Has comido como pretende una tradición y no como sugiere una carta. Hagas lo que hagas después, hazlo despacio.",
    outroFr:
      "Vous avez mangé comme une tradition l'entend, et non comme une carte le suggère. Quoi que vous fassiez ensuite, faites-le lentement.",
    outroAr:
      "أكلتَ كما تقصد تقاليد، لا كما تقترح قائمة طعام. ومهما فعلت بعد ذلك، فافعله ببطء.",
    outroZh:
      "你按一种传统本来的意思吃了一顿，而不是按菜单的建议。接下来做什么都好，慢慢做。",
    outroJa:
      "品書きが勧めるやり方ではなく、ひとつの伝統が意図したやり方で食べました。次に何をするにせよ、ゆっくりどうぞ。",
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
    titleAr: "أول جولة في السوق",
    titleZh: "第一次逛市场",
    titleJa: "初めての市場めぐり",
    introKo:
      "배고픈 채로, 현금을 들고 오세요. 서서, 손가락으로 가리키며, 어깨를 맞대고 먹는 식사입니다. 순서를 미리 정하지 않는 편이 낫습니다.",
    introEs:
      "Llega con hambre y con efectivo. Es una comida de estar de pie, señalar y comer hombro con hombro, y funciona mejor si no planeas el orden.",
    introFr:
      "Arrivez affamé et avec des espèces. C'est un repas debout, du doigt, épaule contre épaule, et cela marche mieux si vous ne planifiez pas l'ordre à l'avance.",
    introAr:
      "تعال جائعًا ومعك نقد. هذه وجبة وقوف وإشارة وأكتاف متلاصقة، وتنجح أكثر إن لم ترتّب لها ترتيبًا مسبقًا.",
    introZh:
      "空着肚子来，带现金。这是一顿站着吃、用手指点、肩挨着肩的饭，而且最好别事先想好顺序。",
    introJa:
      "空腹で、現金を持って来てください。立って、指さして、肩を並べて食べる種類の食事で、順番を先に決めないほうがうまくいきます。",
    outroKo:
      "이 도시가 백 년 동안 먹어 온 방식으로 드셨습니다. 마음에 든 그 노점은 다음 주에도 거기 있습니다.",
    outroEs:
      "Has comido como come esta ciudad desde hace un siglo. El puesto que te gustó seguirá ahí la semana que viene.",
    outroFr:
      "Vous avez mangé comme la ville mange depuis un siècle. L'étal que vous avez aimé sera là la semaine prochaine.",
    outroAr:
      "أكلتَ كما تأكل المدينة منذ قرن. والبسطة التي أعجبتك ستكون هناك الأسبوع المقبل.",
    outroZh:
      "你按这座城市一百年来的方式吃了一顿。你喜欢的那个摊位，下周还在。",
    outroJa:
      "この街が百年ものあいだ食べてきたやり方で食べました。気に入った屋台は来週もそこにあります。",
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
    titleAr: "صباح على مهل",
    titleZh: "一个慢的早上",
    titleJa: "ゆっくりした午前",
    introKo:
      "열한 시 전에 가고, 끝내야 할 것은 아무것도 들고 가지 마세요. 그 자리가 원하는 만큼 당신 것이라는 게 전부입니다.",
    introEs:
      "Ve antes de las once y no lleves nada que tengas que terminar. Todo el sentido es que el sitio es tuyo el tiempo que quieras.",
    introFr:
      "Allez-y avant onze heures et n'emportez rien que vous deviez finir. Tout l'intérêt est que la place est à vous aussi longtemps que vous la voulez.",
    introAr:
      "اذهب قبل الحادية عشرة ولا تحمل شيئًا عليك أن تنهيه. كل الفكرة أن المقعد لك ما دمت تريده.",
    introZh:
      "十一点前去，别带任何必须做完的事。全部的意思就在于：只要你想坐，位子就是你的。",
    introJa:
      "十一時前に行って、終わらせなければならないものは持って行かないこと。席は望むだけ自分のもの——それがすべてです。",
    outroKo:
      "이 도시가 주말을 쓰는 방식으로 아침을 보내셨습니다. 아무도 다 드셨냐고 묻지 않았죠.",
    outroEs:
      "Has pasado una mañana como pasa esta ciudad sus fines de semana. Nadie te preguntó ni una vez si habías terminado.",
    outroFr:
      "Vous avez passé une matinée comme cette ville passe ses week-ends. Personne ne vous a demandé une seule fois si vous aviez fini.",
    outroAr:
      "قضيتَ صباحًا كما تقضي هذه المدينة عطلاتها. ولم يسألك أحد ولو مرة إن كنت قد انتهيت.",
    outroZh:
      "你按这座城市过周末的方式过了一个上午。没有一个人问过你是不是吃完了。",
    outroJa:
      "この街が週末を過ごすやり方で午前を過ごしました。終わったかと一度も訊かれずに。",
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
    titleAr: "الجولة الأولى، الجولة الثانية",
    titleZh: "一次，二次",
    titleJa: "一次、二次",
    introKo:
      "늦게 시작하고 끝을 정하지 마세요. 한국의 밤은 차수로 재고, 대화가 달라지는 건 2차입니다.",
    introEs:
      "Empieza tarde y no planees el final. Una noche coreana se mide en rondas, y es en la segunda donde cambia la conversación.",
    introFr:
      "Commencez tard et ne prévoyez pas la fin. Une nuit coréenne se mesure en tournées, et c'est à la deuxième que la conversation change.",
    introAr:
      "ابدأ متأخرًا ولا تخطّط للنهاية. تُقاس الليلة الكورية بالجولات، وعند الثانية يتغيّر الحديث.",
    introZh:
      "开始得晚一点，别计划几点结束。韩国的夜晚是按轮算的，而话在第二轮才会变。",
    introJa:
      "遅く始めて、終わりを決めないでください。韓国の夜は次で測られ、会話が変わるのは二次です。",
    outroKo:
      "열 시 이후의 상은 일곱 시의 상이 아닙니다. 이제 둘 다 앉아 보셨어요.",
    outroEs:
      "La mesa después de las diez no es la mesa de las siete. Ahora te has sentado a las dos.",
    outroFr:
      "La table après dix heures n'est pas la table de sept heures. Vous vous êtes maintenant assis aux deux.",
    outroAr:
      "المائدة بعد العاشرة ليست مائدة السابعة. وقد جلستَ الآن إلى كلتيهما.",
    outroZh:
      "十点以后的桌不是七点的那张桌。这两张，你现在都坐过了。",
    outroJa:
      "十時以降の卓は七時の卓ではありません。あなたはいま、その両方に座りました。",
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
    titleAr: "السوق أولًا، ثم المائدة",
    titleZh: "先市场，后饭桌",
    titleJa: "まず市場、それから食卓",
    introKo:
      "부산이 하는 순서 그대로의 바닷가 하루: 먹기 전에 그 생선을 두고 벌어지는 실랑이를 먼저 보세요.",
    introEs:
      "Un día de costa en el orden en que lo hace Busan: mira cómo se discute el pescado antes de comerte nada de él.",
    introFr:
      "Une journée côtière dans l'ordre où Busan la fait : voyez le poisson se disputer avant d'en manger.",
    introAr:
      "يوم ساحلي بالترتيب الذي تفعله به بوسان: شاهد الجدال حول السمك قبل أن تأكل منه.",
    introZh:
      "按釜山自己的顺序过一天海边：先看人为鱼争起来，再吃它。",
    introJa:
      "釜山の順番どおりの海辺の一日。魚をめぐって声が飛ぶのを見てから、それを食べます。",
    outroKo:
      "신선도가 메뉴판의 형용사이기를 멈추고, 눈앞에서 벌어지는 일이 되었습니다.",
    outroEs:
      "La frescura dejó de ser un adjetivo de carta y pasó a ser algo que viste ocurrir.",
    outroFr:
      "La fraîcheur a cessé d'être un adjectif de carte pour devenir quelque chose que vous avez vu se produire.",
    outroAr:
      "كفّت الطزاجة عن أن تكون صفةً في قائمة وصارت شيئًا رأيته يحدث.",
    outroZh:
      "新鲜不再是菜单上的一个形容词，而成了你亲眼看着发生的事。",
    outroJa:
      "鮮度は品書きの形容詞であることをやめて、あなたが起きるのを見たものになりました。",
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
    titleAr: "بعد ظهر تحت الأشجار",
    titleZh: "树下的一个下午",
    titleJa: "木の下の午後",
    introKo:
      "일 년에 두 주, 한국에서 할 수 있는 가장 좋은 일이고, 돈은 거의 들지 않습니다.",
    introEs:
      "Dos semanas al año esto es lo mejor que se puede hacer en Corea, y no cuesta casi nada.",
    introFr:
      "Deux semaines par an, c'est la meilleure chose à faire en Corée, et cela ne coûte presque rien.",
    introAr:
      "أسبوعان في السنة هذا أفضل ما يمكن فعله في كوريا، ولا يكلّف شيئًا يُذكر.",
    introZh:
      "一年里有两周，这是在韩国最值得做的事，而且几乎不花钱。",
    introJa:
      "年に二週間だけ、これが韓国でいちばんいい過ごし方で、しかもほとんどお金がかかりません。",
    outroKo:
      "두 주 안에 끝납니다. 그래서 다들 나갔던 거예요.",
    outroEs:
      "Se acabará en quince días. Por eso fue todo el mundo.",
    outroFr:
      "Ce sera fini dans une quinzaine. C'est pour cela que tout le monde y est allé.",
    outroAr:
      "سينتهي خلال أسبوعين. ولهذا ذهب الجميع.",
    outroZh:
      "两周之内就会结束。这正是所有人都去了的原因。",
    outroJa:
      "二週間のうちに終わります。だからみんな行ったのです。",
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
    titleAr: "من أين جاء الصحن",
    titleZh: "这只碗从哪儿来",
    titleJa: "この丼はどこから来たか",
    introKo:
      "음식 하나를, 그것을 만든 항구까지 거슬러 올라갑니다. 짧고, 점심에 하는 편이 낫습니다.",
    introEs:
      "Un solo plato, rastreado hasta el puerto que lo inventó. Corto, y mejor a la hora de comer.",
    introFr:
      "Un plat, remonté jusqu'au port qui l'a inventé. Court, et meilleur au déjeuner.",
    introAr:
      "طبق واحد، متتبَّعًا إلى الميناء الذي اخترعه. قصير، وأفضل وقته الغداء.",
    introZh:
      "一道菜，一路追回发明它的那个港口。很短，而且午饭时候做更好。",
    introJa:
      "一皿を、それを生んだ港までさかのぼります。短くて、昼にやるほうがいい。",
    outroKo:
      "중국 음식이고, 한국에서 만들어졌고, 모두가 먹습니다. 그게 국수의 길 전부입니다.",
    outroEs:
      "Un plato chino, inventado en Corea, que come todo el mundo. Esa es la historia entera de la ruta de los fideos.",
    outroFr:
      "Un plat chinois, inventé en Corée, mangé par tout le monde. C'est toute l'histoire de la route des nouilles.",
    outroAr:
      "طبق صيني، اختُرع في كوريا، ويأكله الجميع. تلك هي حكاية طريق المعكرونة كلّها.",
    outroZh:
      "一道中国菜，在韩国被发明，所有人都吃。这就是面条之路的全部故事。",
    outroJa:
      "中国の料理が、韓国で生まれ、みんなが食べている。それが麺の道の全部です。",
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
    titleAr: "ثلاثون دقيقة في السوق",
    titleZh: "在市场的三十分钟",
    titleJa: "市場での三十分",
    introKo:
      "짧은 판입니다. 한 노점, 한 가지, 서서 먹고 나오기 — 평일에 시장을 쓰는 방식이 이렇습니다.",
    introEs:
      "La versión corta. Un puesto, una cosa, de pie, y fuera: así se usa el mercado un día cualquiera entre semana.",
    introFr:
      "La version courte. Un étal, une chose, mangée debout, et on ressort — c'est ainsi qu'on utilise le marché un jour de semaine ordinaire.",
    introAr:
      "النسخة القصيرة. بسطة واحدة، وشيء واحد، يُؤكل واقفًا، ثم تخرج — هكذا يُستعمل السوق في يوم أسبوع عادي.",
    introZh:
      "短的那个版本。一个摊位，一样东西，站着吃完，然后出来——普通工作日里，市场就是这么用的。",
    introJa:
      "短いほうの版。屋台ひとつ、ひと品、立ったまま食べて出る——普通の平日に市場はこう使われます。",
    outroKo:
      "시장을 다 보지는 않으셨고, 그게 핵심입니다. 여기는 일정표가 아니라 잠깐 들르는 곳이에요.",
    outroEs:
      "No has visto el mercado entero, y ese es el sentido. Es un sitio en el que caer, no un itinerario.",
    outroFr:
      "Vous n'avez pas vu tout le marché, et c'est le but. C'est un endroit où l'on passe, pas un itinéraire.",
    outroAr:
      "لم ترَ السوق كلّه، وهذا هو المقصود. إنه مكان تمرّ به، لا برنامج رحلة.",
    outroZh:
      "你没有看完整个市场，而这正是重点。它是顺路进去的地方，不是一条行程。",
    outroJa:
      "市場を全部は見ていません。それが要点です。ここは立ち寄る場所であって、行程ではありません。",
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
    transitionAr:
      "ابدأ من المائدة. وكل ما بقي من هذا الطريق طريقة لإطالة الهدوء الذي تتركه.",
    transitionZh:
      "从这张桌子开始。这条路上其余的一切，都是在延长它留下的那份安静。",
    transitionJa:
      "食卓から始めてください。この道の残りはすべて、そこに残った静けさを引き延ばす方法です。",
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
    transitionAr:
      "حين تفرغ القصعة لا ترحل. فعند الإبريق الذي يليها يبدأ الحديث.",
    transitionZh:
      "碗空了别走。谈话是在随后那壶茶边开始的。",
    transitionJa:
      "器が空になっても立たないこと。会話が始まるのは、そのあとの一服のところです。",
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
    transitionAr:
      "ادخل السوق أولًا. لا شيء هنا يستقيم قبل أن ترى حجمه.",
    transitionZh:
      "先进市场。在你看见它的规模之前，这里别的都说不通。",
    transitionJa:
      "まず市場の中へ。その規模を見るまでは、ここのほかの何も筋が通りません。",
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
    transitionAr:
      "اتبع أعلى الصفائح صوتًا. الفطيرة التي تُسكب أمامك هي التي تُطلب.",
    transitionZh:
      "跟着声音最响的那块铁板。在你面前正被浇下去的那张饼，就是要点的那张。",
    transitionJa:
      "いちばん音の大きい鉄板を追ってください。目の前で流し込まれているそれが、頼むべき一枚です。",
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
    transitionAr:
      "المقالي تطلب الماكغولي. اطلب قصعة للطاولة لا كأسًا لنفسك.",
    transitionZh:
      "油炸的东西要配马格利。给这桌点一碗，别给自己点一杯。",
    transitionJa:
      "揚げものはマッコリを求めます。自分にグラスではなく、卓に器をひとつ頼んでください。",
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
    transitionAr:
      "قبل أن تخرج، امشِ الزقاق من طرف إلى طرف. رؤية حرفة كاملة في صفّ واحد هي ما يتذكّره الناس.",
    transitionZh:
      "走之前，把巷子从头走到尾。把一整个行当看成一条线，是人们记住的那部分。",
    transitionJa:
      "出る前に、路地を端から端まで。ひとつの商いが一列に並ぶのを見ることが、人の記憶に残る部分です。",
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
    transitionAr:
      "ادخل مباشرة واطلب من أول بسطة عليها زحام. الزحام يعني دورانًا سريعًا وطعامًا طازجًا.",
    transitionZh:
      "直接进去，在第一个看着忙的摊位点。忙意味着翻台快，东西新鲜。",
    transitionJa:
      "まっすぐ入って、混んでいる最初の屋台で頼んでください。混んでいるとは回転が速く、ものが新しいということです。",
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
    transitionAr:
      "ابدأ بما خرج من الفرن هذا الصباح. اسأل ولا تقرأ — فأفضل صنف نادرًا ما يكون على اللوح.",
    transitionZh:
      "从今早出炉的那样开始。用问的，别用看的——最好的那样很少写在牌子上。",
    transitionJa:
      "今朝オーブンから出たものから始めてください。読むより尋ねること——いちばんいいものが札に出ていることはめったにありません。",
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
    transitionAr:
      "إن كنت ما زلت تحمل كوبًا، فاقضِ نصف الصباح الثاني في مكان يكافئك عليه.",
    transitionZh:
      "要是你还拿着杯子，就把上午的后半段花在会为此奖励你的地方。",
    transitionJa:
      "まだカップを持っているなら、午前の後半はそれが報われる場所で過ごしてください。",
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
    transitionAr:
      "اوصل بعد أن ينقشع زحام العشاء. القاعة التي تريدها هي الأهدأ التي تليه.",
    transitionZh:
      "等晚饭的高峰散了再到。你要的是随之而来的那间更安静的屋子。",
    transitionJa:
      "夕食の混雑が引けてから着いてください。欲しいのは、そのあとに来る静かなほうの部屋です。",
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
    transitionAr:
      "الجولة الثانية. اطلب قصعة للطاولة واسكب لغيرك قبل نفسك.",
    transitionZh:
      "二次。给这桌点一碗，先倒给别人再倒自己。",
    transitionJa:
      "二次です。卓に器をひとつ頼んで、自分より先に人に注いでください。",
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
    transitionAr:
      "اذهب باكرًا والمزاد ما زال قائمًا. السوق أرض عمل قبل أن يكون أي شيء آخر.",
    transitionZh:
      "早点去，趁拍卖还在。市场首先是一个干活的场子，然后才是别的。",
    transitionJa:
      "まだせりが動いている早い時間に。市場は何よりもまず、働く床です。",
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
    transitionAr:
      "احمل ما اخترته إلى الأعلى ليُحضَّر. هاتان الخطوتان هما الطقس كلّه.",
    transitionZh:
      "把你挑好的拿到楼上去加工。这两步就是全部的仪式。",
    transitionJa:
      "選んだものを上へ持って上がって調理してもらってください。その二段構えが儀式のすべてです。",
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
    transitionAr:
      "احجز رقعة تحت الأشجار قبل الظهر. بعد ذلك تختار من بين ما تبقّى.",
    transitionZh:
      "中午之前在树下占住一块地。之后你就只能在剩下的里面挑了。",
    transitionJa:
      "正午までに木の下の一角を確保してください。そのあとは残りものから選ぶことになります。",
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
    transitionAr:
      "ابدأ بالصحن نفسه. يُقرأ التاريخ قراءةً أخرى بعد أن تذوق ما أنتجه.",
    transitionZh:
      "从碗本身开始。尝过它做出来的东西之后，那段历史读起来就不一样了。",
    transitionJa:
      "丼そのものから始めてください。それが生んだものを味わったあとでは、歴史の読み方が変わります。",
  },
];

const byId = new Map(narratives.map(n => [n.id, n]));

export const narrativeById = (id) => byId.get(id);

export const narrativesOfTheme = (themeId) => narratives.filter(n => n.themeId === themeId);

export const stepsOfNarrative = (narrativeId) =>
  narrativeSteps.filter(s => s.narrativeId === narrativeId).sort((a, b) => a.order - b.order);
