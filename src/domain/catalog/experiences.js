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
    titleFr: "Cuisine de temple",
    titleAr: "مطبخ المعبد",
    titleZh: "寺院饮食",
    status: STATUS.PUBLISHED,
    whyItMatters:
      "A cuisine built entirely without garlic, onion or haste — the only Korean table where what is left out matters more than what is put in.",
    whyItMattersKo:
      "마늘도 양파도 서두름도 없이 지어진 음식입니다. 무엇을 넣었는가보다 무엇을 뺐는가가 더 중요한, 한국에서 유일한 밥상이에요.",
    whyItMattersEs:
      "Una cocina construida entera sin ajo, sin cebolla y sin prisa: la única mesa coreana donde lo que se deja fuera importa más que lo que se pone.",
    whyItMattersFr:
      "Une cuisine bâtie entièrement sans ail, sans oignon et sans hâte — la seule table coréenne où ce qu'on laisse dehors compte plus que ce qu'on met dedans.",
    whyItMattersAr:
      "مطبخ بُني كلّه بلا ثوم ولا بصل ولا عجلة — المائدة الكورية الوحيدة التي يكون فيها ما يُترك أهمّ ممّا يُوضع.",
    whyItMattersZh:
      "一种完全不用蒜、不用葱、也不赶时间做出来的饮食——韩国唯一一张\"少放了什么\"比\"多放了什么\"更要紧的饭桌。",
    culturalMeaning:
      "Temple food expresses a Buddhist philosophy of eating with awareness: nothing wasted, nothing indulgent, everything intentional.",
    culturalMeaningKo:
      "사찰음식은 알아차리며 먹는다는 불교의 태도를 담습니다. 버리는 것 없이, 탐하는 것 없이, 모든 것이 뜻을 가지고요.",
    culturalMeaningEs:
      "La comida de templo expresa una filosofía budista de comer con atención: nada se desperdicia, nada es exceso, todo es intencionado.",
    culturalMeaningFr:
      "La cuisine de temple exprime une philosophie bouddhiste du manger attentif : rien de gaspillé, rien de complaisant, tout est intentionnel.",
    culturalMeaningAr:
      "يعبّر طعام المعبد عن فلسفة بوذية في الأكل بانتباه: لا شيء يُهدر، ولا شيء فيه إفراط، وكل شيء مقصود.",
    culturalMeaningZh:
      "寺院的饭表达的是一种佛教式的、带着觉察的吃：不浪费，不纵容，每一样都有意思。",
    whenToExperience:
      "During a templestay, on a Buddhist holiday, or whenever the city has worn you down and you want a quiet reset.",
    whenToExperienceKo:
      "템플스테이 중에, 불교 명절에, 또는 도시에 지쳐 조용히 쉬어 가고 싶을 때.",
    whenToExperienceEs:
      "Durante un templestay, en una fiesta budista, o cuando la ciudad te ha agotado y quieres un respiro.",
    whenToExperienceFr:
      "Pendant un templestay, lors d'une fête bouddhiste, ou chaque fois que la ville vous a usé et que vous voulez souffler.",
    whenToExperienceAr:
      "أثناء إقامة في معبد، أو في عيد بوذي، أو كلّما أنهكتك المدينة وأردت راحة هادئة.",
    whenToExperienceZh:
      "在寺院寄宿时，佛教节日里，或者任何被城市磨累了、想安静地喘口气的时候。",
    mission: {
      title: 'The Empty Bowl',
      detail: 'Finish every grain of rice, the way 발우공양 intends. Leaving nothing behind is the practice, not merely good manners.',
    },
    missionKo: { title: "빈 그릇", detail: "발우공양이 뜻하는 대로 밥알 하나까지 비우세요. 아무것도 남기지 않는 것이 예의가 아니라 수행입니다." },
    missionEs: { title: "El cuenco vacío", detail: "Termina hasta el último grano de arroz, como manda el 발우공양. No dejar nada es la práctica, no simple buena educación." },
    missionFr: { title: "Le bol vide", detail: "Finissez jusqu'au dernier grain de riz, comme le veut le 발우공양. Ne rien laisser est la pratique, pas seulement la politesse." },
    missionAr: { title: "القصعة الفارغة", detail: "أنهِ كل حبّة أرز، كما يقصد الـ발우공양. ألّا تترك شيئًا هو الممارسة نفسها، لا مجرد حسن أدب." },
    missionZh: { title: "空碗", detail: "把每一粒米都吃完，像발우공양本来的意思那样。什么都不剩下不是礼貌，是修行本身。" },
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
    titleFr: "Le thé d'après",
    titleAr: "الشاي بعد الطعام",
    titleZh: "饭后的茶",
    status: STATUS.PREVIEW,
    whyItMatters:
      "The meal does not end when the bowl empties. The pot that follows is where the conversation actually happens.",
    whyItMattersKo:
      "식사는 그릇을 비운다고 끝나지 않습니다. 뒤이어 나오는 차 한 주전자가 실제로 대화가 일어나는 자리예요.",
    whyItMattersEs:
      "La comida no acaba cuando se vacía el cuenco. La tetera que viene después es donde pasa de verdad la conversación.",
    whyItMattersFr:
      "Le repas ne s'arrête pas quand le bol se vide. C'est autour de la théière qui suit que la conversation se passe vraiment.",
    whyItMattersAr:
      "لا تنتهي الوجبة حين تفرغ القصعة. فحول الإبريق الذي يليها يدور الحديث فعلًا.",
    whyItMattersZh:
      "碗空了，饭并没有结束。真正的谈话是在随后那壶茶边发生的。",
    culturalMeaning:
      "Korean tea culture treats the pour as part of the hospitality, not an afterthought — the host keeps your cup filled without being asked.",
    culturalMeaningKo:
      "한국의 차 문화는 따라 주는 행위를 접대의 일부로 봅니다. 뒷일이 아니라요 — 주인은 묻지 않고 잔을 채웁니다.",
    culturalMeaningEs:
      "La cultura coreana del té trata el servir como parte de la hospitalidad, no como algo secundario: el anfitrión te llena la taza sin que se lo pidas.",
    culturalMeaningFr:
      "La culture coréenne du thé fait du service une part de l'hospitalité, pas une arrière-pensée : l'hôte garde votre tasse pleine sans qu'on le lui demande.",
    culturalMeaningAr:
      "تجعل ثقافة الشاي الكورية السكب جزءًا من الضيافة لا فكرة لاحقة: يبقي المضيف كوبك ممتلئًا دون أن تطلب.",
    culturalMeaningZh:
      "韩国的茶文化把\"倒\"当作待客的一部分，不是事后的补充：主人会不等你开口就把你的杯子续满。",
    whenToExperience:
      "Straight after a temple meal, while the quiet still holds.",
    whenToExperienceKo:
      "사찰 식사 직후, 그 고요가 아직 남아 있을 때.",
    whenToExperienceEs:
      "Justo después de una comida de templo, mientras aún dura el silencio.",
    whenToExperienceFr:
      "Juste après un repas de temple, tant que le calme tient encore.",
    whenToExperienceAr:
      "مباشرة بعد وجبة معبد، ما دام الهدوء قائمًا.",
    whenToExperienceZh:
      "寺院用完饭之后马上，趁那份安静还在。",
    mission: {
      title: 'Let Them Pour',
      detail: "Do not refill your own cup. Let your host do it, and return the favour — that exchange is the whole ritual.",
    },
    missionKo: { title: "따라 주게 두기", detail: "자기 잔을 직접 채우지 마세요. 주인이 채우게 두고, 그 다음엔 당신이 채워 주세요 — 그 주고받음이 곧 의식입니다." },
    missionEs: { title: "Deja que te sirvan", detail: "No te rellenes la taza. Deja que lo haga tu anfitrión y devuélvele el gesto: ese intercambio es el ritual entero." },
    missionFr: { title: "Laissez-les vous servir", detail: "Ne remplissez pas votre propre tasse. Laissez votre hôte le faire, et rendez-lui le geste : cet échange est tout le rituel." },
    missionAr: { title: "دَعهم يسكبون لك", detail: "لا تملأ كوبك بنفسك. دع مضيفك يفعلها، وردّ له الصنيع: هذا التبادل هو الطقس كلّه." },
    missionZh: { title: "让别人给你倒", detail: "别自己续杯。让主人来，然后把这个动作还回去——这一来一往就是全部的仪式。" },
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
    titleFr: "Marché de Gwangjang",
    titleAr: "سوق غوانغجانغ",
    titleZh: "广藏市场",
    status: STATUS.PUBLISHED,
    whyItMatters:
      "One of Korea's oldest markets, feeding Seoul for over a century from stalls barely wider than their griddles.",
    whyItMattersKo:
      "한국에서 가장 오래된 시장 중 하나로, 철판보다 조금 넓을 뿐인 노점들이 백 년 넘게 서울을 먹여 왔습니다.",
    whyItMattersEs:
      "Uno de los mercados más antiguos de Corea: lleva más de un siglo dando de comer a Seúl desde puestos apenas más anchos que sus planchas.",
    whyItMattersFr:
      "L'un des plus vieux marchés de Corée, qui nourrit Séoul depuis plus d'un siècle depuis des étals à peine plus larges que leur plaque.",
    whyItMattersAr:
      "من أقدم أسواق كوريا، يطعم سول منذ أكثر من قرن من بسطات لا تكاد تزيد عرضًا عن صفائحها.",
    whyItMattersZh:
      "韩国最老的市场之一，一百多年来靠着比铁板宽不了多少的摊位喂饱首尔。",
    culturalMeaning:
      "The market is where Korean food is still transacted face to face — you order by pointing, and you eat at the counter beside whoever came before you.",
    culturalMeaningKo:
      "시장은 한국 음식이 아직 얼굴을 맞대고 오가는 곳입니다. 손가락으로 가리켜 주문하고, 먼저 온 사람 옆에서 서서 먹습니다.",
    culturalMeaningEs:
      "El mercado es donde la comida coreana todavía se intercambia cara a cara: pides señalando y comes en la barra junto a quien llegó antes.",
    culturalMeaningFr:
      "Le marché est l'endroit où la nourriture coréenne se négocie encore face à face : on commande du doigt et on mange au comptoir, à côté de celui qui est arrivé avant vous.",
    culturalMeaningAr:
      "السوق هو المكان الذي ما زالت تُتداول فيه الأطعمة الكورية وجهًا لوجه: تطلب بالإشارة، وتأكل على المنضدة إلى جانب من سبقك.",
    culturalMeaningZh:
      "市场是韩国食物仍然面对面交易的地方：你用手指点单，然后在柜台边、挨着比你先到的人吃。",
    whenToExperience:
      "Late afternoon, when the dinner crowd arrives and every griddle is running at once.",
    whenToExperienceKo:
      "늦은 오후, 저녁 손님이 몰리고 철판이 전부 돌아갈 때.",
    whenToExperienceEs:
      "A media tarde, cuando llega la gente de la cena y todas las planchas están en marcha a la vez.",
    whenToExperienceFr:
      "En fin d'après-midi, quand la foule du dîner arrive et que toutes les plaques tournent en même temps.",
    whenToExperienceAr:
      "في آخر العصر، حين يصل زحام العشاء وتشتغل كل الصفائح معًا.",
    whenToExperienceZh:
      "傍晚，晚饭的人群涌进来、所有铁板同时开工的时候。",
    mission: {
      title: 'Sit at the Counter',
      detail: 'Skip the tables. Take a stool at a stall and eat shoulder to shoulder with the regulars.',
    },
    missionKo: { title: "좌판에 앉기", detail: "테이블 말고 노점 앞 의자에 앉아, 단골들과 어깨를 맞대고 드세요." },
    missionEs: { title: "Siéntate en la barra", detail: "Salta las mesas. Coge un taburete en un puesto y come hombro con hombro con los habituales." },
    missionFr: { title: "Asseyez-vous au comptoir", detail: "Oubliez les tables. Prenez un tabouret à un étal et mangez épaule contre épaule avec les habitués." },
    missionAr: { title: "اجلس إلى المنضدة", detail: "اترك الطاولات. خذ مقعدًا عند بسطة وكُل كتفًا بكتف مع المداومين." },
    missionZh: { title: "坐到柜台边", detail: "别去桌子那边。在摊位上找张凳子，和常客肩挨肩地吃。" },
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
    titleFr: "Bindaetteok",
    titleAr: "بينداتوك",
    titleZh: "绿豆煎饼",
    status: STATUS.PREVIEW,
    whyItMatters:
      "A mung bean pancake ground on a stone mill in front of you and fried in enough oil to hear it from across the aisle.",
    whyItMattersKo:
      "눈앞의 맷돌에 녹두를 갈아, 통로 건너편에서도 소리가 들릴 만큼 기름을 넉넉히 두르고 부칩니다.",
    whyItMattersEs:
      "Una tortita de judía mungo molida en un molino de piedra delante de ti y frita en aceite suficiente para oírla desde el otro lado del pasillo.",
    whyItMattersFr:
      "Une galette de haricots mungo moulue à la meule de pierre devant vous et frite dans assez d'huile pour qu'on l'entende de l'autre côté de l'allée.",
    whyItMattersAr:
      "فطيرة فول مونغ تُطحن على رحى حجرية أمامك وتُقلى في زيت يكفي لتسمعها من الجهة الأخرى من الممرّ.",
    whyItMattersZh:
      "一张绿豆饼，在你面前用石磨磨出来，下的油多到隔着过道都听得见。",
    culturalMeaning:
      "Once a food of scarcity made from what was left after the beans were pressed, now the dish people queue for. Korean cooking does that often.",
    culturalMeaningKo:
      "콩을 짜고 남은 것으로 만들던 궁핍의 음식이 이제는 줄을 서서 먹는 음식이 되었습니다. 한국 요리에는 그런 일이 자주 있어요.",
    culturalMeaningEs:
      "Antes comida de escasez hecha con lo que quedaba tras prensar la judía, ahora el plato por el que se hace cola. La cocina coreana hace eso a menudo.",
    culturalMeaningFr:
      "Jadis un plat de disette fait avec ce qui restait après le pressage des haricots, aujourd'hui celui pour lequel on fait la queue. La cuisine coréenne fait souvent cela.",
    culturalMeaningAr:
      "كان طعام شحّ يُصنع ممّا يبقى بعد عصر الفول، وصار اليوم ما يقف الناس في طابور من أجله. والمطبخ الكوري يفعل ذلك كثيرًا.",
    culturalMeaningZh:
      "它曾经是用榨完豆子剩下的东西做的穷人吃食，如今是人们排队买的那一样。韩国菜常常这样。",
    whenToExperience:
      "On a cold day, with makgeolli, standing up.",
    whenToExperienceKo:
      "추운 날, 막걸리와 함께, 선 채로.",
    whenToExperienceEs:
      "Un día frío, con makgeolli, de pie.",
    whenToExperienceFr:
      "Un jour de froid, avec du makgeolli, debout.",
    whenToExperienceAr:
      "في يوم بارد، مع الماكغولي، واقفًا.",
    whenToExperienceZh:
      "冷天，配马格利，站着吃。",
    mission: {
      title: 'Order It Hot',
      detail: 'Ask for one straight off the griddle rather than from the stack. Say 방금 나온 거 주세요.',
    },
    missionKo: { title: "갓 나온 걸로", detail: "쌓아 둔 것 말고 철판에서 막 나온 걸로 달라고 하세요. \"방금 나온 거 주세요.\"" },
    missionEs: { title: "Pídela recién hecha", detail: "Pide una recién salida de la plancha y no del montón. Di 방금 나온 거 주세요." },
    missionFr: { title: "Demandez-la chaude", detail: "Demandez-en une sortie de la plaque plutôt que prise sur la pile. Dites 방금 나온 거 주세요." },
    missionAr: { title: "اطلبها ساخنة", detail: "اطلب واحدة خارجة توًّا من الصفيحة لا من الكومة. قل 방금 나온 거 주세요." },
    missionZh: { title: "要刚出锅的", detail: "要一张刚从铁板上下来的，不要摞好的那些。就说 방금 나온 거 주세요。" },
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
    titleFr: "Makgeolli",
    titleAr: "ماكغولي",
    titleZh: "马格利",
    status: STATUS.PREVIEW,
    whyItMatters:
      "Korea's oldest alcohol, cloudy and barely sweet, drunk from a bowl rather than a glass.",
    whyItMattersKo:
      "한국에서 가장 오래된 술입니다. 뿌옇고 살짝 달며, 잔이 아니라 사발로 마셔요.",
    whyItMattersEs:
      "El alcohol más antiguo de Corea: turbio, apenas dulce, y se bebe en cuenco y no en vaso.",
    whyItMattersFr:
      "Le plus vieil alcool de Corée, trouble et à peine sucré, bu dans un bol plutôt que dans un verre.",
    whyItMattersAr:
      "أقدم مشروب كحولي في كوريا، عكِر وحلو بالكاد، يُشرب في قصعة لا في كأس.",
    whyItMattersZh:
      "韩国最老的酒，浑浊，几乎不甜，用碗喝而不是用杯子。",
    culturalMeaning:
      "Makgeolli is a farmer's drink that survived into the cities. Pouring for others before yourself is the etiquette that carries the culture.",
    culturalMeaningKo:
      "막걸리는 도시까지 살아남은 농부의 술입니다. 자기 것보다 남의 것을 먼저 따르는 예절이 그 문화를 실어 나릅니다.",
    culturalMeaningEs:
      "El makgeolli es una bebida de campesinos que sobrevivió hasta las ciudades. Servir a los demás antes que a uno mismo es la etiqueta que sostiene la cultura.",
    culturalMeaningFr:
      "Le makgeolli est une boisson de paysans qui a survécu jusque dans les villes. Servir les autres avant soi est l'étiquette qui porte la culture.",
    culturalMeaningAr:
      "الماكغولي شراب فلاحين نجا إلى المدن. وسكبه للآخرين قبل نفسك هو الأدب الذي يحمل الثقافة.",
    culturalMeaningZh:
      "马格利是一种活到城市里的农家酒。先给别人倒、再倒自己，是承载着这份文化的礼数。",
    whenToExperience:
      "With fried food, on a rainy evening — the pairing is close to a national reflex.",
    whenToExperienceKo:
      "튀김과 함께, 비 오는 저녁에 — 거의 국민적 반사에 가까운 조합입니다.",
    whenToExperienceEs:
      "Con fritos, una tarde de lluvia: el maridaje es casi un reflejo nacional.",
    whenToExperienceFr:
      "Avec des fritures, un soir de pluie — l'accord tient du réflexe national.",
    whenToExperienceAr:
      "مع المقالي، في مساء ماطر — الاقتران يكاد يكون ردّ فعل وطنيًّا.",
    whenToExperienceZh:
      "配油炸的东西，在下雨的傍晚——这个搭配几乎是全国性的条件反射。",
    mission: {
      title: 'Pour for Someone Else First',
      detail: "Never fill your own bowl first. Fill your companion's, and let them fill yours.",
    },
    missionKo: { title: "남의 잔부터", detail: "자기 사발을 먼저 채우지 마세요. 옆 사람 것을 채우고, 당신 것은 그 사람이 채우게 두세요." },
    missionEs: { title: "Sirve primero a otro", detail: "Nunca llenes tu cuenco primero. Llena el de quien tienes al lado y deja que él llene el tuyo." },
    missionFr: { title: "Servez d'abord quelqu'un d'autre", detail: "Ne remplissez jamais votre bol en premier. Remplissez celui de votre voisin, et laissez-le remplir le vôtre." },
    missionAr: { title: "اسكب لغيرك أولًا", detail: "لا تملأ قصعتك أولًا أبدًا. املأ قصعة من بجانبك، ودعه يملأ قصعتك." },
    missionZh: { title: "先给别人倒", detail: "永远别先满上自己的碗。先倒给身边的人，再让他给你倒。" },
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
    titleFr: "L'allée du marché",
    titleAr: "زقاق السوق",
    titleZh: "市场的巷子",
    status: STATUS.PREVIEW,
    whyItMatters:
      "Not a dish but a place to stand: the narrow run between stalls where the whole market happens at once.",
    whyItMattersKo:
      "요리가 아니라 서 있을 자리입니다. 시장 전체가 한꺼번에 벌어지는, 노점 사이의 좁은 길이요.",
    whyItMattersEs:
      "No es un plato sino un sitio donde estar: el pasillo estrecho entre puestos donde el mercado entero ocurre a la vez.",
    whyItMattersFr:
      "Pas un plat mais un endroit où se tenir : l'étroit passage entre les étals où tout le marché a lieu d'un coup.",
    whyItMattersAr:
      "ليس طبقًا بل موضعًا تقف فيه: الممرّ الضيّق بين البسطات حيث يحدث السوق كلّه دفعة واحدة.",
    whyItMattersZh:
      "这不是一道菜，而是一个站的地方：摊位之间那条窄道，整个市场在那里同时发生。",
    culturalMeaning:
      "Korean markets are organised by trade, so an alley is a category — walk one and you have seen an entire supply chain.",
    culturalMeaningKo:
      "한국의 시장은 업종별로 묶여 있어서, 골목 하나가 곧 하나의 분류입니다. 한 골목을 걸으면 공급망 하나를 통째로 본 셈이에요.",
    culturalMeaningEs:
      "Los mercados coreanos se organizan por oficios, así que un callejón es una categoría: recorre uno y habrás visto una cadena de suministro entera.",
    culturalMeaningFr:
      "Les marchés coréens sont organisés par métier, donc une allée est une catégorie : parcourez-en une et vous avez vu toute une filière.",
    culturalMeaningAr:
      "تُنظَّم الأسواق الكورية بالحِرف، فالزقاق صنف: امشِ زقاقًا واحدًا وتكون قد رأيت سلسلة توريد كاملة.",
    culturalMeaningZh:
      "韩国的市场按行当排布，所以一条巷子就是一个门类——走完一条，你就看完了一整条供应链。",
    whenToExperience:
      "Any time the market is open. Walk it once end to end before ordering anything.",
    whenToExperienceKo:
      "시장이 열려 있는 아무 때나. 무엇을 사기 전에 끝에서 끝까지 한 번 걸어 보세요.",
    whenToExperienceEs:
      "Cualquier momento en que el mercado esté abierto. Recórrelo entero antes de pedir nada.",
    whenToExperienceFr:
      "À n'importe quelle heure d'ouverture. Faites-la une fois d'un bout à l'autre avant de commander quoi que ce soit.",
    whenToExperienceAr:
      "في أي وقت يكون السوق مفتوحًا. امشِه مرة من طرف إلى طرف قبل أن تطلب شيئًا.",
    whenToExperienceZh:
      "市场开着的任何时候。点任何东西之前，先从头到尾走一遍。",
    mission: {
      title: 'Walk It First',
      detail: 'Walk the full alley before you buy. Deciding after seeing everything is how locals shop.',
    },
    missionKo: { title: "먼저 한 바퀴", detail: "사기 전에 골목 전체를 걸어 보세요. 다 보고 나서 정하는 것이 현지 사람들이 장 보는 방식입니다." },
    missionEs: { title: "Recórrelo primero", detail: "Camina el callejón entero antes de comprar. Decidir después de verlo todo es como compran los locales." },
    missionFr: { title: "Parcourez-la d'abord", detail: "Faites toute l'allée avant d'acheter. Décider après avoir tout vu, c'est ainsi que les gens d'ici font leurs courses." },
    missionAr: { title: "امشِه أولًا", detail: "امشِ الزقاق كلّه قبل أن تشتري. القرار بعد رؤية كل شيء هو طريقة أهل المكان في التسوّق." },
    missionZh: { title: "先走一遍", detail: "买之前把整条巷子走完。看完了再决定，才是本地人买东西的方式。" },
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
    titleFr: "Jajangmyeon",
    titleAr: "جاجانغميون",
    titleZh: "炸酱面",
    status: STATUS.PUBLISHED,
    whyItMatters:
      "Invented in Incheon's Chinatown by Chinese dockworkers far from home, and now the most Korean thing on any menu.",
    whyItMattersKo:
      "고향을 멀리 떠나온 중국인 부두 노동자들이 인천 차이나타운에서 만들었고, 지금은 어느 메뉴판에서든 가장 한국적인 음식입니다.",
    whyItMattersEs:
      "Lo inventaron estibadores chinos lejos de casa en el barrio chino de Incheon, y hoy es lo más coreano de cualquier carta.",
    whyItMattersFr:
      "Inventé dans le quartier chinois d'Incheon par des dockers chinois loin de chez eux, et aujourd'hui la chose la plus coréenne de n'importe quelle carte.",
    whyItMattersAr:
      "اختُرع في الحي الصيني بإنتشون على يد عمّال مرفأ صينيين بعيدين عن ديارهم، وصار اليوم أكثر ما في أي قائمة كوريّة.",
    whyItMattersZh:
      "由远离家乡的中国码头工人在仁川中华街发明，如今是任何一张菜单上最韩国的东西。",
    culturalMeaning:
      "The dish carries the memory of Korea's Chinese immigrant community — fully naturalised while keeping its foreign name.",
    culturalMeaningKo:
      "이 음식은 한국 화교 사회의 기억을 품고 있습니다. 외국 이름을 그대로 단 채 완전히 귀화한 요리예요.",
    culturalMeaningEs:
      "El plato guarda la memoria de la comunidad china de Corea: completamente nacionalizado sin dejar de llevar su nombre extranjero.",
    culturalMeaningFr:
      "Le plat porte la mémoire de la communauté immigrée chinoise de Corée : entièrement naturalisé tout en gardant son nom étranger.",
    culturalMeaningAr:
      "يحمل الطبق ذاكرة الجالية الصينية المهاجرة في كوريا — تجنّس تمامًا وأبقى اسمه الأجنبي.",
    culturalMeaningZh:
      "这道菜承载着韩国华人社群的记忆——完全归化了，却留着一个外来的名字。",
    whenToExperience:
      "Moving day, the day report cards come out, or any weeknight nobody wants to cook.",
    whenToExperienceKo:
      "이사하는 날, 성적표 나오는 날, 아니면 아무도 요리하기 싫은 평일 저녁.",
    whenToExperienceEs:
      "El día de la mudanza, el día de las notas, o cualquier noche entre semana en que nadie quiere cocinar.",
    whenToExperienceFr:
      "Le jour du déménagement, le jour des bulletins, ou n'importe quel soir de semaine où personne n'a envie de cuisiner.",
    whenToExperienceAr:
      "يوم الانتقال، أو يوم صدور شهادات المدرسة، أو أي ليلة أسبوع لا يريد أحد فيها أن يطبخ.",
    whenToExperienceZh:
      "搬家那天，成绩单发下来那天，或者任何一个谁都不想做饭的工作日晚上。",
    mission: {
      title: 'Order Like a Local',
      detail: "Get one jjajangmyeon and one jjamppong for the table and swap halfway — the standard Korean answer to an unwinnable choice.",
    },
    missionKo: { title: "현지인처럼 주문하기", detail: "짜장면 하나와 짬뽕 하나를 시켜 놓고 중간에 바꿔 드세요 — 결론이 안 나는 선택에 대한 한국식 정답입니다." },
    missionEs: { title: "Pide como un local", detail: "Pide un jjajangmyeon y un jjamppong para la mesa e intercambiadlos a mitad: la respuesta coreana estándar a una elección imposible." },
    missionFr: { title: "Commandez comme un habitué", detail: "Prenez un jjajangmyeon et un jjamppong pour la table et échangez à mi-chemin — la réponse coréenne standard à un choix impossible." },
    missionAr: { title: "اطلب كأهل المكان", detail: "خذ جاجانغميون واحدًا وجامبونغ واحدًا للطاولة وتبادلوهما في المنتصف — الجواب الكوري المعتاد عن اختيار لا يُحسم." },
    missionZh: { title: "像本地人那样点", detail: "给这桌点一份炸酱面和一份炒码面，吃到一半互换——面对一个选不出来的选择，韩国人的标准答案。" },
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
    titleFr: "Le brunch du week-end",
    titleAr: "فطور متأخّر في العطلة",
    titleZh: "周末的早午饭",
    status: STATUS.PUBLISHED,
    whyItMatters:
      'Seoul treats the weekend late morning as a destination rather than a meal, and will cross the city for a bakery that sold out by noon last week.',
    whyItMattersKo:
      "서울은 주말 늦은 아침을 끼니가 아니라 목적지로 여기고, 지난주 정오에 동난 빵집을 위해 도시를 가로지릅니다.",
    whyItMattersEs:
      "Seúl trata la mañana del fin de semana como un destino y no como una comida, y cruzará la ciudad por una panadería que agotó a mediodía la semana pasada.",
    whyItMattersFr:
      "Séoul traite la fin de matinée du week-end comme une destination plutôt que comme un repas, et traversera la ville pour une boulangerie qui était en rupture à midi la semaine dernière.",
    whyItMattersAr:
      "تعامل سول ضحى العطلة كوجهة لا كوجبة، وتعبر المدينة من أجل مخبز نفد ما فيه قبل الظهر الأسبوع الماضي.",
    whyItMattersZh:
      "首尔把周末的上午当作目的地而不是一顿饭，会为了一家上周中午就卖光的面包房横穿整座城市。",
    culturalMeaning:
      'The Korean cafe is a social institution in its own right — a place to be seen, to work, to linger — built on baking traditions borrowed and then remade.',
    culturalMeaningKo:
      "한국의 카페는 그 자체로 사회적 제도입니다. 보이고, 일하고, 머무는 자리이며, 빌려 와 다시 만든 제빵 전통 위에 서 있어요.",
    culturalMeaningEs:
      "La cafetería coreana es una institución social por derecho propio — un sitio para dejarse ver, trabajar y quedarse — levantada sobre tradiciones de panadería tomadas prestadas y rehechas.",
    culturalMeaningFr:
      "Le café coréen est une institution sociale à part entière — un lieu où être vu, où travailler, où s'attarder — bâti sur des traditions de boulangerie empruntées puis refaites.",
    culturalMeaningAr:
      "المقهى الكوري مؤسسة اجتماعية قائمة بذاتها — مكان لتُرى فيه، ولتعمل، ولتتمهّل — بُني على تقاليد خَبز استُعيرت ثم أُعيدت صناعتها.",
    culturalMeaningZh:
      "韩国的咖啡馆本身就是一种社会机构——一个被看见、工作、消磨时间的地方——建立在借来又重新做过的烘焙传统之上。",
    whenToExperience:
      'Saturday or Sunday before eleven, if you want the thing that sells out.',
    whenToExperienceKo:
      "토요일이나 일요일 열한 시 전, 동나는 그것을 먹고 싶다면요.",
    whenToExperienceEs:
      "Sábado o domingo antes de las once, si quieres lo que se agota.",
    whenToExperienceFr:
      "Samedi ou dimanche avant onze heures, si vous voulez ce qui part en premier.",
    whenToExperienceAr:
      "السبت أو الأحد قبل الحادية عشرة، إن أردت ما ينفد أولًا.",
    whenToExperienceZh:
      "周六或周日十一点之前，如果你想吃到那样会卖光的东西。",
    mission: {
      title: 'Baked This Morning',
      detail: 'Ask what came out of the oven today and order that instead of what you planned. The lineup changes daily and rarely makes the menu.',
    },
    missionKo: { title: "오늘 아침에 구운 것", detail: "오늘 오븐에서 나온 게 뭔지 묻고, 원래 시키려던 것 대신 그걸 주문하세요. 구성은 매일 바뀌고 메뉴판에는 잘 오르지 않습니다." },
    missionEs: { title: "Horneado esta mañana", detail: "Pregunta qué ha salido hoy del horno y pide eso en lugar de lo que tenías pensado. El surtido cambia a diario y rara vez llega a la carta." },
    missionFr: { title: "Sorti du four ce matin", detail: "Demandez ce qui est sorti du four aujourd'hui et prenez cela plutôt que ce que vous aviez prévu. L'assortiment change chaque jour et figure rarement sur la carte." },
    missionAr: { title: "خُبز هذا الصباح", detail: "اسأل ما الذي خرج من الفرن اليوم واطلبه بدل ما كنت تنوي. الأصناف تتغيّر كل يوم ونادرًا ما تصل إلى القائمة." },
    missionZh: { title: "今早烤的", detail: "问问今天出炉的是什么，点那个，而不是你原本打算点的。品项每天都变，而且很少写进菜单。" },
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
    titleFr: "Le comptoir zéro déchet",
    titleAr: "منضدة بلا نفايات",
    titleZh: "零废弃的柜台",
    status: STATUS.PUBLISHED,
    whyItMatters:
      'Nothing disposable crosses the counter. Regulars bring their own containers without being asked, which makes it a habit rather than a marketing angle.',
    whyItMattersKo:
      "일회용품은 계산대를 넘어오지 않습니다. 단골들은 말하지 않아도 자기 용기를 들고 오고, 그래서 마케팅이 아니라 습관이 됩니다.",
    whyItMattersEs:
      "Nada desechable cruza el mostrador. Los habituales traen sus propios recipientes sin que nadie se lo pida, y eso lo convierte en costumbre y no en argumento de marketing.",
    whyItMattersFr:
      "Rien de jetable ne passe le comptoir. Les habitués apportent leurs propres contenants sans qu'on le leur demande, ce qui en fait une habitude plutôt qu'un argument marketing.",
    whyItMattersAr:
      "لا يعبر شيء يُرمى هذه المنضدة. والمداومون يحضرون أوعيتهم دون أن يُطلب منهم، وهذا يجعلها عادة لا زاوية تسويق.",
    whyItMattersZh:
      "没有一次性的东西越过这个柜台。常客不用人说就自己带容器来，所以这是习惯，不是营销角度。",
    culturalMeaning:
      'Korea recycles most of its food waste by law, and every household separates it. These counters take the next step and refuse to create the waste at all.',
    culturalMeaningKo:
      "한국은 법으로 음식물 쓰레기 대부분을 재활용하고, 모든 가정이 분리합니다. 이 가게들은 한 걸음 더 나아가 애초에 쓰레기를 만들기를 거부합니다.",
    culturalMeaningEs:
      "Corea recicla por ley la mayor parte de sus residuos de comida y todos los hogares los separan. Estos mostradores dan un paso más y se niegan a generarlos.",
    culturalMeaningFr:
      "La Corée recycle l'essentiel de ses déchets alimentaires par la loi, et chaque foyer les trie. Ces comptoirs vont un cran plus loin et refusent de produire le déchet.",
    culturalMeaningAr:
      "تعيد كوريا تدوير معظم نفاياتها الغذائية بحكم القانون، وكل بيت يفرزها. وهذه المناضد تخطو خطوة أبعد فترفض إنتاج النفاية أصلًا.",
    culturalMeaningZh:
      "韩国依法回收绝大部分厨余，每家每户都要分类。这些柜台再往前走一步：干脆不制造那份垃圾。",
    whenToExperience:
      'Any afternoon you can carry a cup. Bring one and most shops take a little off the price.',
    whenToExperienceKo:
      "컵을 들고 다닐 수 있는 아무 오후나. 가져가면 대부분의 가게가 값을 조금 깎아 줍니다.",
    whenToExperienceEs:
      "Cualquier tarde en que puedas llevar un vaso. Llévalo y la mayoría de las tiendas te quitan algo del precio.",
    whenToExperienceFr:
      "N'importe quel après-midi où vous pouvez porter une tasse. Apportez-en une : la plupart des boutiques baissent un peu le prix.",
    whenToExperienceAr:
      "أي بعد ظهر تستطيع فيه حمل كوب. أحضِر واحدًا وتخصم معظم المحلات شيئًا من السعر.",
    whenToExperienceZh:
      "任何一个你拿得动杯子的下午。带一个来，多数店会少收你一点。",
    mission: {
      title: 'Leave Nothing Behind',
      detail: 'Refuse one disposable item — cup, bag, straw. Ask what happens to the food scraps while you are at it.',
    },
    missionKo: { title: "아무것도 남기지 않기", detail: "일회용품 하나를 거절하세요 — 컵, 봉투, 빨대 중 하나. 겸사겸사 음식물 찌꺼기가 어디로 가는지도 물어보시고요." },
    missionEs: { title: "No dejes nada", detail: "Rechaza un desechable: un vaso, una bolsa, una pajita. Y ya que estás, pregunta qué pasa con los restos de comida." },
    missionFr: { title: "Ne laissez rien", detail: "Refusez un objet jetable — gobelet, sac, paille. Et tant que vous y êtes, demandez ce que deviennent les restes." },
    missionAr: { title: "لا تترك شيئًا", detail: "ارفض شيئًا واحدًا يُرمى — كوبًا أو كيسًا أو قشّة. واسأل ما مصير بقايا الطعام ما دمت هناك." },
    missionZh: { title: "什么都别留下", detail: "拒绝一样一次性的东西——杯子、袋子或吸管。顺便问问厨余最后去了哪儿。" },
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
    titleFr: "La table de fin de nuit",
    titleAr: "مائدة آخر الليل",
    titleZh: "深夜的那张桌",
    status: STATUS.PREVIEW,
    whyItMatters:
      'Seoul does not really close. The table you sit at near midnight has a different crowd and a slower conversation than the same table at seven.',
    whyItMattersKo:
      "서울은 사실상 닫지 않습니다. 자정 무렵 앉은 그 자리는 저녁 일곱 시의 같은 자리와 손님도, 대화의 속도도 다릅니다.",
    whyItMattersEs:
      "Seúl no cierra del todo. La mesa a la que te sientas cerca de medianoche tiene otra gente y otra conversación que la misma mesa a las siete.",
    whyItMattersFr:
      "Séoul ne ferme pas vraiment. La table où vous vous asseyez vers minuit a un autre public et une conversation plus lente que la même table à sept heures.",
    whyItMattersAr:
      "سول لا تغلق فعلًا. المائدة التي تجلس إليها قرب منتصف الليل لها روّاد آخرون وحديث أبطأ من المائدة نفسها في السابعة.",
    whyItMattersZh:
      "首尔并不真的打烊。你在接近午夜时坐的那张桌，人和话都跟七点钟的同一张桌不一样。",
    culturalMeaning:
      'Late eating is tied to Korea\'s long working hours: dinner is often the second half of the workday, and the meal after it is the first honest one.',
    culturalMeaningKo:
      "늦게 먹는 문화는 한국의 긴 노동시간과 이어져 있습니다. 저녁은 종종 근무의 후반부이고, 그 뒤의 끼니가 첫 솔직한 자리예요.",
    culturalMeaningEs:
      "Comer tarde va unido a las largas jornadas coreanas: la cena es a menudo la segunda mitad del trabajo, y la comida de después es la primera sincera.",
    culturalMeaningFr:
      "Manger tard tient aux longues journées de travail coréennes : le dîner est souvent la seconde moitié de la journée de bureau, et le repas d'après est le premier repas sincère.",
    culturalMeaningAr:
      "يرتبط الأكل المتأخر بساعات العمل الطويلة في كوريا: العشاء غالبًا نصف يوم العمل الثاني، والوجبة التي تليه أول وجبة صادقة.",
    culturalMeaningZh:
      "吃得晚，跟韩国漫长的工作时间连在一起：晚饭常常是工作日的下半场，而那之后的一顿，才是第一顿诚实的饭。",
    whenToExperience:
      'After ten, when the dinner rush has cleared and nobody is waiting for your seat.',
    whenToExperienceKo:
      "열 시 이후, 저녁 손님이 빠지고 아무도 당신 자리를 기다리지 않을 때.",
    whenToExperienceEs:
      "Después de las diez, cuando ha pasado la hora punta y nadie espera tu sitio.",
    whenToExperienceFr:
      "Après dix heures, quand la ruée du dîner est passée et que personne n'attend votre place.",
    whenToExperienceAr:
      "بعد العاشرة، حين ينقشع زحام العشاء ولا ينتظر أحد مقعدك.",
    whenToExperienceZh:
      "十点以后，晚饭的高峰散了、没人等你位子的时候。",
    mission: {
      title: 'Stay for the Second Round',
      detail: 'Korean nights move in rounds — 1차, 2차. Do not leave after the first one.',
    },
    missionKo: { title: "2차까지 가기", detail: "한국의 밤은 차수로 흘러갑니다 — 1차, 2차. 1차에서 일어나지 마세요." },
    missionEs: { title: "Quédate a la segunda ronda", detail: "Las noches coreanas van por rondas: 1차, 2차. No te vayas después de la primera." },
    missionFr: { title: "Restez pour la deuxième tournée", detail: "Les nuits coréennes avancent par tournées — 1차, 2차. Ne partez pas après la première." },
    missionAr: { title: "ابقَ للجولة الثانية", detail: "تمضي الليالي الكورية على جولات — 1차 ثم 2차. لا تغادر بعد الأولى." },
    missionZh: { title: "留下来吃二次", detail: "韩国的夜晚按차수走——1차、2차。别在第一轮之后就走。" },
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
    titleFr: "Hoe",
    titleAr: "هويه",
    titleZh: "生鱼片",
    status: STATUS.PREVIEW,
    whyItMatters:
      'Korean raw fish is served firm rather than melting, cut thick, and eaten wrapped in leaves with ssamjang instead of dipped in soy.',
    whyItMattersKo:
      "한국의 회는 녹는 식감이 아니라 단단하게, 두껍게 썰어 나오고, 간장에 찍기보다 잎에 쌈장과 함께 싸서 먹습니다.",
    whyItMattersEs:
      "El pescado crudo coreano se sirve firme en vez de fundente, cortado grueso, y se come envuelto en hojas con ssamjang en lugar de mojado en soja.",
    whyItMattersFr:
      "Le poisson cru coréen se sert ferme plutôt que fondant, coupé épais, et se mange enveloppé dans une feuille avec du ssamjang au lieu d'être trempé dans le soja.",
    whyItMattersAr:
      "يُقدَّم السمك النيء الكوري متماسكًا لا ذائبًا، مقطوعًا سميكًا، ويُؤكل ملفوفًا في ورق مع السامجانغ بدل أن يُغمس في الصويا.",
    whyItMattersZh:
      "韩国的生鱼片是弹的而不是化的，切得厚，用叶子包着配包饭酱吃，而不是蘸酱油。",
    culturalMeaning:
      'Busan built its identity on the sea, and hoe is where that shows most plainly: the fish is chosen live, and freshness is the entire argument.',
    culturalMeaningKo:
      "부산은 바다 위에 정체성을 세웠고, 회에서 그것이 가장 분명히 드러납니다. 생선은 살아 있는 채로 고르고, 신선도가 논쟁의 전부예요.",
    culturalMeaningEs:
      "Busan construyó su identidad sobre el mar, y en el hoe se ve con más claridad: el pescado se elige vivo y la frescura es todo el argumento.",
    culturalMeaningFr:
      "Busan a bâti son identité sur la mer, et le hoe est là où cela se voit le plus nettement : le poisson est choisi vivant, et la fraîcheur est tout l'argument.",
    culturalMeaningAr:
      "بنت بوسان هويتها على البحر، والهويه أوضح موضع يظهر فيه ذلك: يُختار السمك حيًّا، والطزاجة هي الحجّة كلّها.",
    culturalMeaningZh:
      "釜山把身份建在海上，而生鱼片是这一点显得最直白的地方：鱼是活着挑的，新鲜就是全部的理由。",
    whenToExperience:
      'On the coast, in the evening, with company — it is ordered by the plate for a table, not by the portion.',
    whenToExperienceKo:
      "해안에서, 저녁에, 여럿이서 — 인분이 아니라 상 단위 접시로 주문합니다.",
    whenToExperienceEs:
      "En la costa, por la tarde, acompañado: se pide por plato para la mesa, no por ración.",
    whenToExperienceFr:
      "Sur la côte, le soir, à plusieurs — cela se commande au plateau pour une table, pas à la portion.",
    whenToExperienceAr:
      "على الساحل، مساءً، بصحبة — يُطلب بالطبق للمائدة لا بالحصة.",
    whenToExperienceZh:
      "在海边，傍晚，有人一起——它是按盘给一桌点的，不是按份点的。",
    mission: {
      title: 'Wrap It, Do Not Dip It',
      detail: 'Take a perilla leaf, add the fish and a little ssamjang, and eat it in one bite. Dipping it in soy sauce is the foreign habit.',
    },
    missionKo: { title: "찍지 말고 싸서", detail: "깻잎에 회 한 점과 쌈장 조금을 올려 한 입에 드세요. 간장에 찍는 건 외국인의 습관입니다." },
    missionEs: { title: "Envuélvelo, no lo mojes", detail: "Coge una hoja de perilla, pon el pescado y un poco de ssamjang, y cómelo de un bocado. Mojarlo en soja es la costumbre extranjera." },
    missionFr: { title: "Enveloppez, ne trempez pas", detail: "Prenez une feuille de périlla, ajoutez le poisson et un peu de ssamjang, et mangez en une bouchée. Le tremper dans la sauce soja est l'habitude étrangère." },
    missionAr: { title: "لُفّه ولا تغمسه", detail: "خذ ورقة بريلا، وضع السمك وقليلًا من السامجانغ، وكُلها بلقمة واحدة. غمسه في صلصة الصويا هو العادة الأجنبية." },
    missionZh: { title: "要包着，别蘸着", detail: "拿一片紫苏叶，放上鱼和一点包饭酱，一口吃掉。蘸酱油是外来的习惯。" },
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
    titleFr: "Un matin à Jagalchi",
    titleAr: "صباح في جاغالتشي",
    titleZh: "札嘎其的一个早上",
    status: STATUS.PREVIEW,
    whyItMatters:
      "Korea's largest seafood market, run largely by women whose trade passed mother to daughter — the jagalchi ajumma are the market's actual institution.",
    whyItMattersKo:
      "한국 최대의 수산시장이고, 대부분 어머니에서 딸로 이어진 여성들이 운영합니다. 자갈치 아지매가 이 시장의 진짜 제도예요.",
    whyItMattersEs:
      "El mayor mercado de pescado de Corea, llevado en su mayoría por mujeres cuyo oficio pasó de madre a hija: las jagalchi ajumma son la institución real del mercado.",
    whyItMattersFr:
      "Le plus grand marché aux produits de la mer de Corée, tenu en grande partie par des femmes dont le métier est passé de mère en fille — les jagalchi ajumma sont la véritable institution du marché.",
    whyItMattersAr:
      "أكبر سوق للمأكولات البحرية في كوريا، تديره في معظمه نساء انتقلت حرفتهنّ من أمّ إلى ابنة — وجاغالتشي أجومّا هنّ مؤسسة السوق الحقيقية.",
    whyItMattersZh:
      "韩国最大的海鲜市场，很大程度上由母女相传的女摊主经营——札嘎其阿姨才是这个市场真正的机构。",
    culturalMeaning:
      'Busan absorbed waves of refugees during the Korean War, and the market fed them. Its scale is a direct inheritance of that history.',
    culturalMeaningKo:
      "부산은 한국전쟁 동안 피란민의 물결을 받아들였고, 이 시장이 그들을 먹였습니다. 시장의 규모는 그 역사의 직접적인 유산입니다.",
    culturalMeaningEs:
      "Busan absorbió oleadas de refugiados durante la Guerra de Corea y el mercado los alimentó. Su tamaño es herencia directa de esa historia.",
    culturalMeaningFr:
      "Busan a absorbé des vagues de réfugiés pendant la guerre de Corée, et le marché les a nourris. Son ampleur est l'héritage direct de cette histoire.",
    culturalMeaningAr:
      "استوعبت بوسان موجات لاجئين أثناء الحرب الكورية، وأطعمهم السوق. وحجمه اليوم إرث مباشر من ذلك التاريخ.",
    culturalMeaningZh:
      "朝鲜战争期间釜山接纳了一波又一波难民，而这个市场喂饱了他们。它今天的规模是那段历史的直接遗产。",
    whenToExperience:
      'Early, while the auction is still running and the day\'s catch is being argued over.',
    whenToExperienceKo:
      "이른 아침, 경매가 아직 돌아가고 그날의 어획을 두고 실랑이가 벌어질 때.",
    whenToExperienceEs:
      "Temprano, mientras la subasta sigue en marcha y se discute la captura del día.",
    whenToExperienceFr:
      "Tôt, pendant que la criée tourne encore et qu'on se dispute la pêche du jour.",
    whenToExperienceAr:
      "باكرًا، والمزاد ما زال قائمًا ويُتجادل على صيد اليوم.",
    whenToExperienceZh:
      "早点去，趁拍卖还在进行、当天的渔获还在被争来争去。",
    mission: {
      title: 'Buy Upstairs',
      detail: 'Choose your fish at a stall downstairs and take it up to be prepared. That two-step is how the market is meant to be used.',
    },
    missionKo: { title: "위층에서 손질", detail: "아래층 좌판에서 생선을 고르고 위층으로 들고 올라가 손질을 맡기세요. 그 두 단계가 이 시장을 쓰는 방식입니다." },
    missionEs: { title: "Compra abajo, sube después", detail: "Elige el pescado en un puesto de abajo y súbelo para que lo preparen. Ese doble paso es como se usa el mercado." },
    missionFr: { title: "Achetez en bas, montez ensuite", detail: "Choisissez votre poisson à un étal du bas et montez-le pour le faire préparer. Ce double geste est la façon dont le marché est fait pour être utilisé." },
    missionAr: { title: "اشترِ في الأسفل ثم اصعد", detail: "اختر سمكك عند بسطة في الأسفل واحمله إلى الأعلى ليُحضَّر. هذه الخطوتان هما الطريقة التي وُضع السوق ليُستعمل بها." },
    missionZh: { title: "楼下买，再上楼", detail: "在楼下的摊位挑好鱼，拿到楼上去加工。这两步，才是这个市场原本要人怎么用的方式。" },
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
    titleFr: "Pique-nique sous les cerisiers",
    titleAr: "نزهة تحت أزهار الكرز",
    titleZh: "樱花树下的野餐",
    status: STATUS.PREVIEW,
    whyItMatters:
      'For two weeks a year the whole country eats outdoors. Parks fill with mats, convenience-store chicken and shared bottles, and nobody treats it as remarkable.',
    whyItMattersKo:
      "일 년에 두 주 동안 온 나라가 밖에서 먹습니다. 공원은 돗자리와 편의점 치킨과 나눠 마시는 술병으로 차고, 아무도 그걸 특별하게 여기지 않아요.",
    whyItMattersEs:
      "Durante dos semanas al año el país entero come al aire libre. Los parques se llenan de esterillas, pollo de tienda 24 horas y botellas compartidas, y nadie lo considera extraordinario.",
    whyItMattersFr:
      "Deux semaines par an, le pays entier mange dehors. Les parcs se remplissent de nattes, de poulet de supérette et de bouteilles partagées, et personne ne trouve cela remarquable.",
    whyItMattersAr:
      "أسبوعان في السنة يأكل فيهما البلد كلّه في الخلاء. تمتلئ الحدائق بالحُصر ودجاج المتاجر الصغيرة والزجاجات المشتركة، ولا يرى أحد في ذلك أمرًا لافتًا.",
    whyItMattersZh:
      "一年里有两周，整个国家都在户外吃饭。公园被野餐垫、便利店炸鸡和分着喝的酒瓶填满，而没有人觉得这值得一提。",
    culturalMeaning:
      'Blossom season is Korea\'s clearest seasonal ritual — brief on purpose, and valued because it cannot be extended.',
    culturalMeaningKo:
      "벚꽃철은 한국에서 가장 뚜렷한 계절 의식입니다. 일부러 짧고, 늘릴 수 없기 때문에 귀합니다.",
    culturalMeaningEs:
      "La temporada de los cerezos es el ritual estacional más claro de Corea: breve a propósito, y valiosa porque no se puede alargar.",
    culturalMeaningFr:
      "La saison des fleurs est le rituel saisonnier le plus net de Corée — brève à dessein, et précieuse parce qu'on ne peut pas la prolonger.",
    culturalMeaningAr:
      "موسم الأزهار أوضح طقس موسمي في كوريا — قصير عن قصد، وثمين لأنه لا يمكن تمديده.",
    culturalMeaningZh:
      "花季是韩国最清晰的季节仪式——它短是故意的，也正因为延长不了才珍贵。",
    whenToExperience:
      'Early April, whichever week the blossom actually opens. It moves by a fortnight year to year.',
    whenToExperienceKo:
      "4월 초, 꽃이 실제로 피는 그 주. 해마다 두 주쯤 움직입니다.",
    whenToExperienceEs:
      "Principios de abril, la semana en que el cerezo abre de verdad. Se mueve un par de semanas de un año a otro.",
    whenToExperienceFr:
      "Début avril, la semaine où les fleurs s'ouvrent vraiment. Cela bouge d'une quinzaine d'une année à l'autre.",
    whenToExperienceAr:
      "أوائل نيسان، في الأسبوع الذي تتفتّح فيه الأزهار فعلًا. ويتقدّم ويتأخّر أسبوعين من سنة إلى أخرى.",
    whenToExperienceZh:
      "四月初，具体是花真正开的那一周。它每年会前后差上半个月。",
    mission: {
      title: 'Bring the Mat',
      detail: 'A picnic mat is the one non-negotiable item. Get one from any convenience store and claim a patch under the trees.',
    },
    missionKo: { title: "돗자리는 필수", detail: "돗자리 하나는 타협할 수 없는 준비물입니다. 아무 편의점에서 사서 나무 밑 한 자리를 차지하세요." },
    missionEs: { title: "Lleva la esterilla", detail: "La esterilla es el único objeto no negociable. Cómprala en cualquier tienda 24 horas y hazte con un trozo de suelo bajo los árboles." },
    missionFr: { title: "Apportez la natte", detail: "La natte de pique-nique est le seul objet non négociable. Prenez-en une dans n'importe quelle supérette et revendiquez un bout de sol sous les arbres." },
    missionAr: { title: "أحضِر الحصيرة", detail: "حصيرة النزهة هي الشيء الوحيد غير القابل للتفاوض. خذ واحدة من أي متجر يفتح على مدار الساعة واحجز رقعة أرض تحت الأشجار." },
    missionZh: { title: "带上垫子", detail: "野餐垫是唯一没得商量的东西。在任意一家便利店买一张，然后在树下占住一块地。" },
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
