// Theme catalog — the cultural territory.
//
// A Theme owns a narrative and declares which Experiences belong to its
// territory. It does not own ordering: that is a Narrative's job, because a
// territory can be crossed by more than one path.
//
// Membership is N:M on purpose. `makgeolli` belongs to both Street Food and
// Noodle Road; forcing 1:N would make authors duplicate the Experience and
// turn every later edit into a synchronisation problem.

import { STATUS } from '../types.js';

// Every theme carries its Korean alongside its English (2026-08-11). The
// English was written first and for a foreign reader, which is the audience;
// the Korean is a translation of it rather than a second, different article,
// so the two say the same thing and neither is the "real" one.
//
// They are separate fields rather than one bilingual string because these are
// paragraphs. A label can carry both halves on one line — 밥상 · tables reads
// fine — but a 60-word narrative printed twice in a row is not a bilingual
// screen, it is the same screen twice. useText() in LocaleContext picks one.

export const themes = [
  {
    id: 'temple-life',
    emoji: '\u{1FAB7}',
    title: 'Temple Life',
    titleKo: '사찰의 밥상',
    titleEs: 'La mesa del templo',
    titleFr: 'La table du temple',
    titleAr: 'مائدة المعبد',
    titleZh: '寺院的饭桌',
    titleJa: '寺の食卓',
    tagline: 'Eat like a monk, at the pace of one.',
    taglineKo: '스님처럼, 스님의 속도로.',
    taglineEs: 'Comer como un monje, al ritmo de un monje.',
    taglineFr: "Manger comme un moine, au rythme d'un moine.",
    taglineAr: 'كُل كما يأكل الراهب، وعلى إيقاعه.',
    taglineZh: '像僧人那样吃，也按僧人的节奏。',
    taglineJa: '僧のように、僧の速さで食べる。',
    narrative:
      'Korean Buddhist temples kept a cuisine alive through centuries of war and industrialisation by refusing to hurry it. Sitting at a temple table is the closest a visitor gets to the country\'s idea of restraint as a pleasure rather than a denial.',
    narrativeKo:
      '한국의 절은 전쟁과 산업화를 지나오는 몇 백 년 동안, 서두르기를 거부하는 방식으로 하나의 음식 문화를 지켜냈습니다. 절의 밥상에 앉아 보는 것은 절제를 결핍이 아니라 즐거움으로 여기는 이 나라의 감각에 여행자가 가장 가까이 다가가는 방법입니다.',
    narrativeEs:
      'Los templos budistas coreanos mantuvieron viva una cocina a lo largo de siglos de guerra e industrialización negándose a acelerarla. Sentarse a una mesa de templo es lo más cerca que llega un visitante de la idea coreana de la contención como placer y no como privación.',
    narrativeFr:
      "Les temples bouddhistes coréens ont maintenu une cuisine vivante à travers des siècles de guerre et d'industrialisation en refusant de la presser. S'asseoir à une table de temple, c'est ce qui approche le plus un visiteur de l'idée coréenne de la retenue comme plaisir plutôt que comme privation.",
    narrativeAr:
      'أبقت المعابد البوذية الكورية مطبخًا حيًّا عبر قرون من الحرب والتصنيع، برفضها أن تستعجله. والجلوس إلى مائدة معبد أقرب ما يصل إليه زائر من الفكرة الكورية عن ضبط النفس بوصفه متعة لا حرمانًا.',
    narrativeZh:
      '韩国的寺院靠拒绝把它做快，让一种饮食在几百年的战争与工业化里活了下来。坐到寺院的饭桌前，是一个外来者最接近这个国家那种感觉的方式——把节制当作乐趣，而不是缺失。',
    narrativeJa:
      '韓国の寺は、急がせることを拒むというやり方で、戦争と工業化の数百年を通してひとつの食を生かしてきました。寺の食卓に座ることは、抑制を欠乏ではなく愉しみとして捉えるこの国の感覚に、訪れる人がいちばん近づける方法です。',
    region: 'seoul',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'street-food',
    emoji: '\u{1F95F}',
    title: 'Street Food Adventure',
    titleKo: '시장 먹거리',
    titleEs: 'Comer en el mercado',
    titleFr: 'Manger au marché',
    titleAr: 'الأكل في السوق',
    titleZh: '在市场吃饭',
    titleJa: '市場で食べる',
    tagline: 'The market is the restaurant.',
    taglineKo: '시장이 곧 식당입니다.',
    taglineEs: 'El mercado es el restaurante.',
    taglineFr: 'Le marché est le restaurant.',
    taglineAr: 'السوق هو المطعم.',
    taglineZh: '市场本身就是饭馆。',
    taglineJa: '市場そのものが食堂です。',
    narrative:
      'Before Seoul had dining rooms it had markets, and the markets never stopped being where the city actually eats. A stall is a kitchen with no walls: you watch the food being made, you eat it standing, and you talk to whoever is next to you because there is nowhere else to look.',
    narrativeKo:
      '서울에 번듯한 식당이 생기기 전에 시장이 있었고, 시장은 지금도 이 도시가 실제로 밥을 먹는 곳입니다. 노점은 벽이 없는 주방입니다. 음식이 만들어지는 걸 지켜보고, 서서 먹고, 달리 볼 데가 없으니 옆 사람과 이야기를 하게 됩니다.',
    narrativeEs:
      'Antes de que Seúl tuviera comedores tenía mercados, y los mercados nunca dejaron de ser donde la ciudad come de verdad. Un puesto es una cocina sin paredes: ves cómo se hace la comida, la comes de pie y hablas con quien tienes al lado porque no hay otro sitio donde mirar.',
    narrativeFr:
      "Avant d'avoir des salles à manger, Séoul avait des marchés, et les marchés n'ont jamais cessé d'être l'endroit où la ville mange vraiment. Un étal est une cuisine sans murs : vous regardez la nourriture se faire, vous la mangez debout, et vous parlez à votre voisin parce qu'il n'y a nulle part ailleurs où regarder.",
    narrativeAr:
      'قبل أن يكون لسول قاعات طعام كانت لها أسواق، ولم تكفّ الأسواق يومًا عن كونها المكان الذي تأكل فيه المدينة فعلًا. البسطة مطبخ بلا جدران: ترى الطعام يُصنع، وتأكله واقفًا، وتحدّث من بجانبك لأنه لا مكان آخر تنظر إليه.',
    narrativeZh:
      '首尔有饭厅之前先有市场，而市场从来没有不再是这座城市真正吃饭的地方。一个摊位就是一间没有墙的厨房：你看着饭被做出来，站着吃掉，然后跟旁边的人说话——因为再没有别处可看。',
    narrativeJa:
      'ソウルに食堂ができるより先に市場がありました。そして市場は、この街が実際に食べる場所であることをやめたことがありません。屋台は壁のない厨房です。料理ができるのを見て、立ったまま食べ、隣の人と話す——ほかに見るところがないからです。',
    region: 'seoul',
    status: STATUS.PREVIEW,
  },
  {
    id: 'noodle-road',
    emoji: '\u{1F35C}',
    title: 'The Noodle Road',
    titleKo: '국수의 길',
    titleEs: 'La ruta de los fideos',
    titleFr: 'La route des nouilles',
    titleAr: 'طريق المعكرونة',
    titleZh: '面条之路',
    titleJa: '麺の道',
    tagline: 'A Chinese dish that became the most Korean meal there is.',
    taglineKo: '중국 음식이 가장 한국적인 한 끼가 되기까지.',
    taglineEs: 'Un plato chino convertido en la comida más coreana que existe.',
    taglineFr: 'Un plat chinois devenu le repas le plus coréen qui soit.',
    taglineAr: 'طبق صيني صار أكثر الوجبات كوريّةً على الإطلاق.',
    taglineZh: '一道中国菜，成了最韩国的一顿饭。',
    taglineJa: '中国の料理が、いちばん韓国的な一食になるまで。',
    narrative:
      'Follow one bowl from the docks of Incheon\'s Chinatown to every delivery scooter in the country. Jajangmyeon is the clearest case of Korea absorbing a foreign food so completely that its origin survives only in the name.',
    narrativeKo:
      '그릇 하나를 따라가 봅니다. 인천 차이나타운의 부두에서 시작해 전국의 배달 오토바이까지. 짜장면은 한국이 외국 음식을 너무 완전히 흡수한 나머지 그 출신이 이름에만 남은, 가장 분명한 사례입니다.',
    narrativeEs:
      'Sigue un solo cuenco desde los muelles del barrio chino de Incheon hasta cada moto de reparto del país. El jajangmyeon es el caso más claro de Corea absorbiendo una comida extranjera tan por completo que su origen sobrevive solo en el nombre.',
    narrativeFr:
      "Suivez un bol depuis les quais du quartier chinois d'Incheon jusqu'à chaque scooter de livraison du pays. Le jajangmyeon est le cas le plus net d'une Corée absorbant un plat étranger si complètement que son origine ne survit que dans le nom.",
    narrativeAr:
      'اتبع صحنًا واحدًا من أرصفة الحي الصيني في إنتشون إلى كل درّاجة توصيل في البلاد. الجاجانغميون أوضح حالة استوعبت فيها كوريا طعامًا أجنبيًا استيعابًا تامًّا حتى لم يبقَ من أصله إلا الاسم.',
    narrativeZh:
      '跟着一只碗，从仁川中华街的码头一路到全国每一辆送餐摩托。炸酱面是韩国把一样外来食物吸收得最彻底的一例——彻底到它的来处只剩在名字里。',
    narrativeJa:
      '一杯の丼を追って、仁川チャイナタウンの埠頭から全国の配達バイクまで。チャジャンミョンは、韓国が外国の食べものをあまりに完全に取り込んだために、その出自が名前にしか残っていない、いちばんはっきりした例です。',
    region: 'nationwide',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'cafe-hopping',
    emoji: '☕',
    title: 'Cafe Hopping',
    titleKo: '카페 순례',
    titleEs: 'De café en café',
    titleFr: 'De café en café',
    titleAr: 'من مقهى إلى مقهى',
    titleZh: '一间间咖啡馆',
    titleJa: 'カフェを渡り歩く',
    tagline: 'One drink buys the afternoon.',
    taglineKo: '한 잔이면 오후가 통째로 내 것.',
    taglineEs: 'Una consumición te compra la tarde entera.',
    taglineFr: "Une consommation vous achète l'après-midi entier.",
    taglineAr: 'مشروب واحد يشتري لك بعد الظهر كلّه.',
    taglineZh: '一杯就买下一个下午。',
    taglineJa: '一杯で午後がまるごと手に入ります。',
    narrative:
      'Seoul has one of the highest cafe densities on earth, and the room is the product as much as the coffee. Nobody will rush you out after one cup, which is why the cafe became where this city works, meets and waits.',
    narrativeKo:
      '서울은 지구에서 카페 밀도가 가장 높은 도시 중 하나이고, 여기서는 커피만큼이나 공간 자체가 상품입니다. 한 잔 마셨다고 재촉하는 사람이 없고, 그래서 카페는 이 도시가 일하고, 만나고, 기다리는 곳이 되었습니다.',
    narrativeEs:
      'Seúl tiene una de las densidades de cafeterías más altas del mundo, y aquí la sala es tanto producto como el café. Nadie te echará después de una taza, y por eso la cafetería se convirtió en el sitio donde esta ciudad trabaja, queda y espera.',
    narrativeFr:
      "Séoul a l'une des plus fortes densités de cafés au monde, et ici la salle est autant le produit que le café. Personne ne vous poussera dehors après une tasse, et c'est pour cela que le café est devenu l'endroit où cette ville travaille, se retrouve et attend.",
    narrativeAr:
      'في سول واحدة من أعلى كثافات المقاهي في العالم، والقاعة هنا منتج بقدر القهوة نفسها. لن يستعجلك أحد بعد فنجان واحد، ولهذا صار المقهى المكان الذي تعمل فيه هذه المدينة وتلتقي وتنتظر.',
    narrativeZh:
      '首尔是地球上咖啡馆密度最高的城市之一，而在这里，那个空间和咖啡一样是商品。喝完一杯不会有人催你走，所以咖啡馆成了这座城市工作、见面和等待的地方。',
    narrativeJa:
      'ソウルは地上でもっともカフェの密度が高い都市のひとつで、ここでは空間そのものがコーヒーと同じくらい商品です。一杯で追い立てられることがない。だからカフェは、この街が働き、人と会い、待つ場所になりました。',
    region: 'nationwide',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'seoul-after-dark',
    emoji: '\u{1F376}',
    title: 'Seoul After Dark',
    titleKo: '밤의 서울',
    titleEs: 'Seúl después de medianoche',
    titleFr: 'Séoul après minuit',
    titleAr: 'سول بعد منتصف الليل',
    titleZh: '入夜后的首尔',
    titleJa: '夜のソウル',
    tagline: 'The city gets honest after ten.',
    taglineKo: '열 시가 넘으면 도시가 솔직해집니다.',
    taglineEs: 'A partir de las diez la ciudad se vuelve sincera.',
    taglineFr: 'Passé dix heures, la ville devient sincère.',
    taglineAr: 'بعد العاشرة تصير المدينة صادقة.',
    taglineZh: '过了十点，这座城市就诚实了。',
    taglineJa: '十時を過ぎると、街は正直になります。',
    narrative:
      'Korean nights move in rounds, and the conversation at the second one is not the conversation at the first. Late eating here is less about appetite than about the hours a working day leaves over.',
    narrativeKo:
      '한국의 밤은 차수로 흘러가고, 2차의 대화는 1차의 대화와 같지 않습니다. 여기서 늦은 시간에 먹는다는 건 식욕의 문제라기보다, 하루 일과가 남겨 놓은 시간을 어떻게 쓰느냐의 문제입니다.',
    narrativeEs:
      'Las noches coreanas avanzan por rondas, y la conversación de la segunda no es la de la primera. Comer tarde aquí tiene menos que ver con el apetito que con las horas que deja libres una jornada de trabajo.',
    narrativeFr:
      "Les nuits coréennes avancent par tournées, et la conversation de la deuxième n'est pas celle de la première. Manger tard ici tient moins de l'appétit que des heures qu'une journée de travail laisse en trop.",
    narrativeAr:
      'تمضي الليالي الكورية على جولات، وحديث الجولة الثانية ليس حديث الأولى. والأكل متأخرًا هنا شأنه بالساعات التي يفيضها يوم العمل أكثر منه بالشهية.',
    narrativeZh:
      '韩国的夜晚是按"차수"走的，二次的谈话和一次不是同一种。在这里吃得晚，与其说关乎胃口，不如说关乎一天工作之后剩下的那几个钟头。',
    narrativeJa:
      '韓国の夜は차수（次）で進み、二次の会話は一次の会話とは違います。ここで遅くに食べるのは、食欲というより、一日の仕事が余らせた時間の話です。',
    region: 'seoul',
    status: STATUS.PREVIEW,
  },
  {
    id: 'busan-seafood',
    emoji: '\u{1F30A}',
    title: 'Busan Seafood',
    titleKo: '부산 해산물',
    titleEs: 'El marisco de Busan',
    titleFr: 'Les fruits de mer de Busan',
    titleAr: 'مأكولات بوسان البحرية',
    titleZh: '釜山的海鲜',
    titleJa: '釜山の海のもの',
    tagline: 'A port city argues about freshness for a living.',
    taglineKo: '항구 도시는 신선도를 두고 매일 다툽니다.',
    taglineEs: 'Una ciudad portuaria discute de frescura para ganarse la vida.',
    taglineFr: 'Une ville portuaire discute de fraîcheur pour gagner sa vie.',
    taglineAr: 'مدينة ميناء تتجادل في الطزاجة لتكسب رزقها.',
    taglineZh: '一座港口城市，靠争论新鲜度过日子。',
    taglineJa: '港町が、鮮度をめぐる言い合いで生計を立てています。',
    narrative:
      'Busan built its identity on the sea and on the people the Korean War pushed south into it. The market that fed those refugees is still the largest seafood market in the country, and its habits — choose the fish live, wrap it rather than dip it — travel with the food wherever it goes.',
    narrativeKo:
      '부산은 바다 위에, 그리고 한국전쟁이 남쪽으로 밀어 보낸 사람들 위에 자기 정체성을 세웠습니다. 그 피란민들을 먹이던 시장은 지금도 전국에서 가장 큰 수산시장이고, 거기서 생긴 습관들 — 살아 있는 채로 고르고, 찍어 먹기보다 싸서 먹는 것 — 은 그 음식이 가는 곳마다 함께 따라갑니다.',
    narrativeEs:
      'Busan construyó su identidad sobre el mar y sobre la gente que la Guerra de Corea empujó hacia el sur. El mercado que alimentó a aquellos refugiados sigue siendo el mayor mercado de pescado del país, y sus costumbres — elegir el pescado vivo, envolverlo en vez de mojarlo — viajan con la comida allá donde va.',
    narrativeFr:
      "Busan a bâti son identité sur la mer et sur ceux que la guerre de Corée a poussés vers le sud. Le marché qui a nourri ces réfugiés reste le plus grand marché aux poissons du pays, et ses habitudes — choisir le poisson vivant, l'envelopper plutôt que le tremper — voyagent avec la nourriture partout où elle va.",
    narrativeAr:
      'بنت بوسان هويتها على البحر وعلى من دفعتهم الحرب الكورية جنوبًا. والسوق الذي أطعم أولئك اللاجئين ما زال أكبر سوق سمك في البلاد، وعاداته — اختيار السمك حيًّا، ولفّه لا غمسه — تسافر مع الطعام أينما ذهب.',
    narrativeZh:
      '釜山把自己的身份建在海上，也建在被朝鲜战争推向南方的人身上。当年养活那些难民的市场，如今仍是全国最大的鱼市，而它的规矩——挑活鱼、包着吃而不是蘸着吃——跟着这些食物走到哪儿算哪儿。',
    narrativeJa:
      '釜山は自らの輪郭を海の上に、そして朝鮮戦争が南へ押しやった人々の上に築きました。その避難民を食べさせた市場はいまも国内最大の魚市場で、その作法——魚を生きたまま選ぶ、つけるのではなく包む——は、この食べものが行くところどこへでも一緒に旅をします。',
    region: 'nationwide',
    status: STATUS.PREVIEW,
  },
  {
    id: 'spring-picnic',
    emoji: '\u{1F338}',
    title: 'Spring Picnic',
    titleKo: '봄 소풍',
    titleEs: 'Picnic de primavera',
    titleFr: 'Pique-nique de printemps',
    titleAr: 'نزهة الربيع',
    titleZh: '春天的野餐',
    titleJa: '春のピクニック',
    tagline: 'Two weeks a year, the country eats outdoors.',
    taglineKo: '일 년에 두 주, 온 나라가 밖에서 먹습니다.',
    taglineEs: 'Dos semanas al año, el país entero come al aire libre.',
    taglineFr: "Deux semaines par an, le pays entier mange dehors.",
    taglineAr: 'أسبوعان في السنة يأكل فيهما البلد كلّه في الخلاء.',
    taglineZh: '一年里有两周，整个国家都在户外吃饭。',
    taglineJa: '年に二週間、国じゅうが外で食べます。',
    narrative:
      'Blossom season is Korea\'s clearest seasonal ritual, and its shortness is the point. Parks fill with mats and shared bottles for a fortnight, and then it is over for a year.',
    narrativeKo:
      '벚꽃철은 한국에서 가장 뚜렷한 계절 의식이고, 짧다는 것이 바로 핵심입니다. 두 주 동안 공원이 돗자리와 나눠 마시는 술병으로 가득 찼다가, 그러고 나면 일 년 동안 끝입니다.',
    narrativeEs:
      'La temporada de los cerezos es el ritual estacional más claro de Corea, y su brevedad es justamente el sentido. Los parques se llenan de esterillas y botellas compartidas durante quince días, y después se acabó hasta el año que viene.',
    narrativeFr:
      "La saison des cerisiers est le rituel saisonnier le plus net de Corée, et sa brièveté en est précisément le sens. Les parcs se remplissent de nattes et de bouteilles partagées pendant quinze jours, puis c'est fini pour un an.",
    narrativeAr:
      'موسم أزهار الكرز أوضح طقس موسمي في كوريا، وقِصَره هو معناه بالضبط. تمتلئ الحدائق بالحُصر والزجاجات المشتركة خمسة عشر يومًا، ثم ينتهي الأمر إلى العام المقبل.',
    narrativeZh:
      '樱花季是韩国最清晰的一个季节仪式，而它的短暂正是它的意思所在。公园会被野餐垫和分着喝的酒瓶填满十五天，然后就结束了，等明年。',
    narrativeJa:
      '桜の季節は韓国のもっともはっきりした季節の儀式で、その短さこそが意味です。公園はレジャーシートと分け合う瓶で十五日ほど埋まり、それで来年まで終わりです。',
    region: 'nationwide',
    status: STATUS.PREVIEW,
  },
];

/**
 * Membership only — which Experiences fall inside this Theme's territory.
 * Order and necessity live on NarrativeStep, not here.
 */
export const themeExperiences = [
  { themeId: 'temple-life', experienceId: 'temple-cuisine' },
  { themeId: 'temple-life', experienceId: 'temple-tea' },

  { themeId: 'street-food', experienceId: 'gwangjang-market' },
  { themeId: 'street-food', experienceId: 'bindaetteok' },
  { themeId: 'street-food', experienceId: 'makgeolli' },
  { themeId: 'street-food', experienceId: 'market-alley' },

  { themeId: 'noodle-road', experienceId: 'jajangmyeon' },
  // Proves the N:M relationship: the same Experience, reached from two
  // different cultural angles.
  { themeId: 'noodle-road', experienceId: 'makgeolli' },

  { themeId: 'cafe-hopping', experienceId: 'weekend-brunch' },
  { themeId: 'cafe-hopping', experienceId: 'zero-waste-counter' },

  { themeId: 'seoul-after-dark', experienceId: 'late-night-table' },
  // Makgeolli again, from a third angle — a night drink rather than a
  // market one.
  { themeId: 'seoul-after-dark', experienceId: 'makgeolli' },

  { themeId: 'busan-seafood', experienceId: 'hoe-sashimi' },
  { themeId: 'busan-seafood', experienceId: 'jagalchi-morning' },

  { themeId: 'spring-picnic', experienceId: 'spring-picnic-set' },
];

const byId = new Map(themes.map(t => [t.id, t]));

export const themeById = (id) => byId.get(id);

export const experienceIdsOfTheme = (themeId) =>
  themeExperiences.filter(r => r.themeId === themeId).map(r => r.experienceId);

export const themeIdsOfExperience = (experienceId) =>
  themeExperiences.filter(r => r.experienceId === experienceId).map(r => r.themeId);
