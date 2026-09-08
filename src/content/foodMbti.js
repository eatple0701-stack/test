// 음식 MBTI — twelve questions, four axes, sixteen types.
//
// Separate from the deck on purpose. The deck asks which dishes somebody
// wants and its answer is a list of tables; this asks who they are at a
// table and its answer is a name. The two can disagree, and that is not a
// bug: one is what you picked, the other is how you eat.
//
// Every question is about the reader. None of them says anything about
// Korea, which is why this file carries no sources — CLAUDE.md's fifth rule
// covers quiz and story content that makes a claim somebody would have had
// to read, and "do you talk while you eat" is not one. The moment a question
// here starts explaining Korean food it needs an entry in content/sources.js,
// and it should probably have been a story instead.
//
// Three questions to an axis, never two: two can tie 1–1, and a tie needs a
// tie-break that is arbitrary by construction. Three cannot tie.

/** The four axes, and the letter each pole writes into the code. */
export const MBTI_AXES = [
  {
    id: 'table',
    poles: { quiet: 'Q', talk: 'T' },
    label: {
      ko: '식탁에서', en: 'At the table', es: 'En la mesa', fr: 'À table',
      ar: 'على المائدة', zh: '在饭桌上', ja: '食卓で',
    },
    poleLabel: {
      quiet: {
        ko: '조용히 먹는', en: 'eats quietly', es: 'come en silencio',
        fr: 'mange en silence', ar: 'يأكل بهدوء', zh: '安静地吃', ja: '静かに食べる',
      },
      talk: {
        ko: '이야기하며 먹는', en: 'eats talking', es: 'come conversando',
        fr: 'mange en parlant', ar: 'يأكل وهو يتحدّث', zh: '边吃边聊', ja: '話しながら食べる',
      },
    },
  },
  {
    id: 'known',
    poles: { new: 'N', known: 'K' },
    label: {
      ko: '한식과의 거리', en: 'Korean food', es: 'La comida coreana',
      fr: 'La cuisine coréenne', ar: 'الطعام الكوري', zh: '韩餐', ja: '韓国料理',
    },
    poleLabel: {
      new: {
        ko: '거의 처음인', en: 'new to it', es: 'nuevo en ello',
        fr: 'nouveau venu', ar: 'جديد عليه', zh: '几乎是头一回', ja: 'ほぼ初めて',
      },
      known: {
        ko: '웬만큼 아는', en: 'knows it', es: 'la conoce',
        fr: 'la connaît', ar: 'يعرفه', zh: '大致都懂', ja: 'ひととおり知っている',
      },
    },
  },
  {
    id: 'flavour',
    poles: { mild: 'M', bold: 'B' },
    label: {
      ko: '평소 찾는 맛', en: 'The flavours sought', es: 'Los sabores que busca',
      fr: 'Les saveurs recherchées', ar: 'النكهات المطلوبة', zh: '平时找的味道',
      ja: 'ふだん求める味',
    },
    poleLabel: {
      mild: {
        ko: '순한 쪽', en: 'toward mild', es: 'hacia lo suave', fr: 'vers la douceur',
        ar: 'نحو اللطيف', zh: '偏清淡', ja: '穏やかな方へ',
      },
      bold: {
        ko: '센 쪽', en: 'toward bold', es: 'hacia lo intenso', fr: 'vers le corsé',
        ar: 'نحو القويّ', zh: '偏浓重', ja: '濃い方へ',
      },
    },
  },
  {
    id: 'risk',
    poles: { safe: 'S', adventurous: 'A' },
    label: {
      ko: '새로운 것 앞에서', en: 'Facing something new', es: 'Ante algo nuevo',
      fr: 'Devant la nouveauté', ar: 'أمام الجديد', zh: '面对没吃过的',
      ja: '初めてのものを前に',
    },
    poleLabel: {
      safe: {
        ko: '아는 것을 고르는', en: 'orders what is known', es: 'pide lo conocido',
        fr: 'commande ce qui est connu', ar: 'يطلب ما يعرفه', zh: '点熟悉的',
        ja: '知っているものを頼む',
      },
      adventurous: {
        ko: '안 먹어본 것을 고르는', en: 'orders the untried', es: 'pide lo no probado',
        fr: 'commande ce qu’il n’a jamais goûté', ar: 'يطلب ما لم يجرّبه', zh: '点没试过的',
        ja: '食べたことのないものを頼む',
      },
    },
  },
];

/** Twelve questions, three to an axis, each a choice between two poles. */
export const MBTI_QUESTIONS = [
  {
    id: 'm1', axis: 'table',
    stem: {
      ko: '밥을 먹을 때 나는', en: 'When I am eating', es: 'Cuando como',
      fr: 'Quand je mange', ar: 'حين آكل', zh: '吃饭的时候我', ja: '食べているとき私は',
    },
    options: [
      { pole: 'quiet', text: {
        ko: '조용히 먹는 편이다', en: 'mostly eat quietly', es: 'como en silencio',
        fr: 'mange plutôt en silence', ar: 'آكل بهدوء غالبًا', zh: '基本安静地吃',
        ja: 'たいてい静かに食べる',
      } },
      { pole: 'talk', text: {
        ko: '이야기하다 밥이 식는다', en: 'let the food go cold talking',
        es: 'dejo que se enfríe hablando', fr: 'laisse refroidir la nourriture en parlant',
        ar: 'أدع الطعام يبرد وأنا أتكلّم', zh: '聊到饭都凉了', ja: '話していて冷ましてしまう',
      } },
    ],
  },
  {
    id: 'm2', axis: 'table',
    stem: {
      ko: '처음 만난 사람과 한 상에 앉으면', en: 'Sitting down with someone I just met',
      es: 'Al sentarme con alguien que acabo de conocer',
      fr: 'Assis avec quelqu’un que je viens de rencontrer',
      ar: 'حين أجلس مع شخص قابلته للتوّ', zh: '和刚认识的人同桌时',
      ja: '初対面の人と同じ食卓につくと',
    },
    options: [
      { pole: 'quiet', text: {
        ko: '먼저 먹고 천천히 말한다', en: 'eat first, talk later',
        es: 'como primero y hablo después', fr: 'je mange d’abord, je parle ensuite',
        ar: 'آكل أوّلًا ثم أتحدّث', zh: '先吃，慢慢再聊', ja: 'まず食べて、あとで話す',
      } },
      { pole: 'talk', text: {
        ko: '먼저 말을 건다', en: 'say something first', es: 'digo algo primero',
        fr: 'je lance la conversation', ar: 'أبدأ الحديث', zh: '先开口',
        ja: '先に話しかける',
      } },
    ],
  },
  {
    id: 'm3', axis: 'table',
    stem: {
      ko: '식사 중에 말이 끊기면', en: 'When the table goes quiet',
      es: 'Cuando la mesa se queda en silencio', fr: 'Quand la table se tait',
      ar: 'حين تصمت المائدة', zh: '桌上安静下来时', ja: '食卓が静かになったら',
    },
    options: [
      { pole: 'quiet', text: {
        ko: '그 조용함이 편하다', en: 'the quiet is comfortable',
        es: 'ese silencio me resulta cómodo', fr: 'ce silence me convient',
        ar: 'أرتاح لذلك الصمت', zh: '那种安静挺舒服', ja: 'その静けさが心地よい',
      } },
      { pole: 'talk', text: {
        ko: '뭐라도 말을 꺼낸다', en: 'I find something to say', es: 'saco algún tema',
        fr: 'je trouve quelque chose à dire', ar: 'أجد ما أقوله', zh: '总要找点话说',
        ja: '何か話を出す',
      } },
    ],
  },
  {
    id: 'm4', axis: 'known',
    stem: {
      ko: '한국 음식은 나에게', en: 'Korean food, to me', es: 'La comida coreana, para mí',
      fr: 'La cuisine coréenne, pour moi', ar: 'الطعام الكوري بالنسبة لي',
      zh: '韩国菜对我来说', ja: '韓国料理は私にとって',
    },
    options: [
      { pole: 'new', text: {
        ko: '거의 처음이다', en: 'is nearly new', es: 'es casi nueva',
        fr: 'est presque nouvelle', ar: 'جديد تقريبًا', zh: '几乎是头一回',
        ja: 'ほとんど初めてだ',
      } },
      { pole: 'known', text: {
        ko: '웬만한 건 안다', en: 'I know most of it', es: 'conozco casi toda',
        fr: 'j’en connais l’essentiel', ar: 'أعرف معظمه', zh: '大致都懂',
        ja: 'たいていは知っている',
      } },
    ],
  },
  {
    id: 'm5', axis: 'known',
    stem: {
      ko: '메뉴판에 모르는 이름이 있으면', en: 'A name on the menu I do not know',
      es: 'Un nombre del menú que no conozco', fr: 'Un nom inconnu sur la carte',
      ar: 'اسم لا أعرفه في القائمة', zh: '菜单上有不认识的名字',
      ja: 'メニューに知らない名前があると',
    },
    options: [
      { pole: 'new', text: {
        ko: '사진을 보고 고른다', en: 'I go by the picture', es: 'me guío por la foto',
        fr: 'je me fie à la photo', ar: 'أعتمد على الصورة', zh: '看图片决定',
        ja: '写真で決める',
      } },
      { pole: 'known', text: {
        ko: '이름만 봐도 대충 안다', en: 'the name is usually enough',
        es: 'con el nombre me basta', fr: 'le nom me suffit en général',
        ar: 'يكفيني الاسم عادةً', zh: '看名字大概就知道', ja: '名前でだいたい分かる',
      } },
    ],
  },
  {
    id: 'm6', axis: 'known',
    stem: {
      ko: '반찬이 깔리면', en: 'When the side dishes arrive',
      es: 'Cuando llegan los acompañamientos', fr: 'Quand arrivent les accompagnements',
      ar: 'حين تصل الأطباق الجانبية', zh: '小菜端上来时', ja: '小皿が並ぶと',
    },
    options: [
      { pole: 'new', text: {
        ko: '뭔지 물어본다', en: 'I ask what they are', es: 'pregunto qué son',
        fr: 'je demande ce que c’est', ar: 'أسأل ما هي', zh: '会问那是什么',
        ja: '何かと尋ねる',
      } },
      { pole: 'known', text: {
        ko: '뭔지 안다', en: 'I know what they are', es: 'sé lo que son',
        fr: 'je sais ce que c’est', ar: 'أعرف ما هي', zh: '我知道那是什么',
        ja: '何かは分かる',
      } },
    ],
  },
  {
    id: 'm7', axis: 'flavour',
    stem: {
      ko: '평소 자주 먹는 맛은', en: 'The flavours I eat most',
      es: 'Los sabores que como más', fr: 'Les saveurs que je mange le plus',
      ar: 'النكهات التي آكلها أكثر', zh: '我平时吃得最多的味道',
      ja: 'ふだんよく食べる味は',
    },
    options: [
      { pole: 'mild', text: {
        ko: '순하고 담백한 쪽', en: 'mild and plain', es: 'suaves y sencillos',
        fr: 'doux et simples', ar: 'لطيفة وبسيطة', zh: '清淡的那种',
        ja: '穏やかであっさりした方',
      } },
      { pole: 'bold', text: {
        ko: '맵거나 짜거나 단 쪽', en: 'hot, salty or sweet',
        es: 'picantes, salados o dulces', fr: 'piquants, salés ou sucrés',
        ar: 'حارّة أو مالحة أو حلوة', zh: '辣的、咸的或甜的',
        ja: '辛いか、しょっぱいか、甘い方',
      } },
    ],
  },
  {
    id: 'm8', axis: 'flavour',
    stem: {
      ko: '국물이 나오면', en: 'When a broth comes', es: 'Cuando llega un caldo',
      fr: 'Quand arrive un bouillon', ar: 'حين يأتي المرق', zh: '上汤的时候',
      ja: 'スープが出てきたら',
    },
    options: [
      { pole: 'mild', text: {
        ko: '맑은 쪽이 좋다', en: 'I want it clear', es: 'lo prefiero claro',
        fr: 'je le préfère clair', ar: 'أفضّله صافيًا', zh: '喜欢清汤',
        ja: '澄んだ方がいい',
      } },
      { pole: 'bold', text: {
        ko: '진하고 얼큰한 쪽이 좋다', en: 'I want it thick and fiery',
        es: 'lo prefiero espeso y ardiente', fr: 'je le préfère épais et relevé',
        ar: 'أفضّله كثيفًا وحارًّا', zh: '喜欢浓的、够辣的',
        ja: '濃くてぴりっとした方がいい',
      } },
    ],
  },
  {
    id: 'm9', axis: 'flavour',
    stem: {
      ko: '양념은', en: 'Sauce and seasoning', es: 'La salsa y el aliño',
      fr: 'Sauce et assaisonnement', ar: 'الصلصة والتتبيلة', zh: '调味',
      ja: 'たれや味つけは',
    },
    options: [
      { pole: 'mild', text: {
        ko: '적게, 재료 맛으로', en: 'less, so the food tastes of itself',
        es: 'poca, que sepa al ingrediente', fr: 'peu, pour goûter l’ingrédient',
        ar: 'قليلة، ليظهر طعم المكوّن', zh: '少一点，吃食材本味',
        ja: '控えめに、素材の味で',
      } },
      { pole: 'bold', text: {
        ko: '넉넉히, 양념 맛으로', en: 'plenty — that is the point',
        es: 'abundante, ahí está la gracia', fr: 'généreusement, c’est tout l’intérêt',
        ar: 'بسخاء، فهذا هو المقصود', zh: '多来点，就是要那个味',
        ja: 'たっぷりと、それが目当て',
      } },
    ],
  },
  {
    id: 'm10', axis: 'risk',
    stem: {
      ko: '처음 가는 식당에서', en: 'At a restaurant I have never been to',
      es: 'En un restaurante al que no he ido nunca',
      fr: 'Dans un restaurant où je ne suis jamais allé',
      ar: 'في مطعم لم أدخله من قبل', zh: '在没去过的餐厅',
      ja: '行ったことのない店で',
    },
    options: [
      { pole: 'safe', text: {
        ko: '아는 메뉴를 시킨다', en: 'I order what I know', es: 'pido lo que conozco',
        fr: 'je commande ce que je connais', ar: 'أطلب ما أعرفه', zh: '点我知道的',
        ja: '知っているものを頼む',
      } },
      { pole: 'adventurous', text: {
        ko: '처음 보는 걸 시킨다', en: 'I order what I have not seen before',
        es: 'pido lo que no había visto', fr: 'je commande ce que je n’ai jamais vu',
        ar: 'أطلب ما لم أره من قبل', zh: '点没见过的',
        ja: '見たことのないものを頼む',
      } },
    ],
  },
  {
    id: 'm11', axis: 'risk',
    stem: {
      ko: '누가 “이거 좀 특이한데” 하면', en: 'When somebody says “this one is a bit odd”',
      es: 'Cuando alguien dice «este es un poco raro»',
      fr: 'Quand quelqu’un dit « celui-là est un peu bizarre »',
      ar: 'حين يقول أحدهم: «هذا غريب بعض الشيء»', zh: '有人说“这个有点怪”时',
      ja: '誰かが「これはちょっと変わってる」と言ったら',
    },
    options: [
      { pole: 'safe', text: {
        ko: '사양한다', en: 'I pass', es: 'paso', fr: 'je passe mon tour',
        ar: 'أعتذر', zh: '我不试', ja: '遠慮する',
      } },
      { pole: 'adventurous', text: {
        ko: '먼저 먹어본다', en: 'I try it first', es: 'lo pruebo el primero',
        fr: 'je goûte le premier', ar: 'أجرّبه أوّلًا', zh: '我先尝',
        ja: '真っ先に食べてみる',
      } },
    ],
  },
  {
    id: 'm12', axis: 'risk',
    stem: {
      ko: '이번 여행에서 먹고 싶은 것은', en: 'What I want to eat on this trip',
      es: 'Lo que quiero comer en este viaje',
      fr: 'Ce que je veux manger pendant ce voyage',
      ar: 'ما أريد أكله في هذه الرحلة', zh: '这趟旅行我想吃的',
      ja: 'この旅で食べたいのは',
    },
    options: [
      { pole: 'safe', text: {
        ko: '실패 없는 것', en: 'something that cannot go wrong',
        es: 'algo que no falle', fr: 'quelque chose qui ne rate pas',
        ar: 'شيء لا يخيب', zh: '不会踩雷的', ja: '外さないもの',
      } },
      { pole: 'adventurous', text: {
        ko: '여기서만 먹을 수 있는 것', en: 'something I can only eat here',
        es: 'algo que solo se come aquí', fr: 'quelque chose qu’on ne mange qu’ici',
        ar: 'شيء لا يؤكل إلا هنا', zh: '只有这里才吃得到的',
        ja: 'ここでしか食べられないもの',
      } },
    ],
  },
];
