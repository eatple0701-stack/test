// How a table works, said once.
//
// It was said twice. FirstRun on Explore taught three steps and the
// landing's how-strip taught three different steps, with no shared source —
// so the app answered "what happens here?" two ways depending on which tab
// somebody opened first. Neither was wrong; together they were a product
// that had not decided what it was.
//
// This is the merge, and it keeps the best line from each. The how-strip had
// the approval — the host says yes to you by name, which is what makes this
// not a booking form. FirstRun had the money, which is the more valuable
// fact and the one that was missing from the landing page entirely: 밥친구
// moves no money, so a stranger cannot be owed anything. Not knowing that is
// exactly what stops somebody from asking for a seat, and no amount of dish
// photography fixes it.
//
// Three steps, because a person deciding whether to eat with strangers can
// hold three things. The fourth thing worth saying — the record — lives in
// the Passport, which is where it can be shown rather than promised.

export const HOW_STEPS = [
  {
    id: 'find',
    kr: '밥상 찾기',
    en: 'Find a table serving a dish nobody can order alone.',
    es: 'Encuentra una mesa con un plato que nadie puede pedir solo.',
    fr: "Trouvez une table servant un plat que personne ne peut commander seul.",
    ar: 'اعثر على مائدة تقدّم طبقًا لا يستطيع أحد أن يطلبه وحده.',
    zh: '找一张饭桌，上面是一个人点不了的菜。',
    ja: '一人では頼めない料理が出ている食卓を見つける。',
  },
  {
    id: 'ask',
    kr: '자리 요청',
    en: 'Ask for the seat. The host reads who you are and says yes by name — your name is the whole form.',
    es: 'Pide el sitio. El anfitrión lee quién eres y dice que sí por tu nombre: tu nombre es todo el formulario.',
    fr: "Demandez la place. L'hôte lit qui vous êtes et dit oui par votre nom : votre nom est tout le formulaire.",
    ar: 'اطلب المقعد. يقرأ المضيف من أنت ويقول نعم باسمك: اسمك هو الاستمارة كلّها.',
    zh: '申请那个位子。主人会读你是谁，然后按名字答应：你的名字就是全部的表格。',
    ja: '席をリクエストする。ホストがあなたが誰かを読み、名前を見て承認します。あなたの名前がフォームのすべてです。',
  },
  {
    id: 'eat',
    // The money line, carried over from FirstRun because it is the fact that
    // removes the hesitation. Worded as what this app does, not as a promise
    // about what a restaurant charges — the app cannot know that.
    kr: '나눠 먹기',
    // The brand is written Eatple inside an English clause. It was 밥친구,
    // which no splitter can lift out of a sentence — the whole line read as
    // Korean to anything measuring script, so it stayed on an English-only
    // screen and this was one of the last Korean words a traveller saw.
    en: 'Meet and share the food. Eatple handles no money: you pay the restaurant for what you eat, so nobody at the table owes anybody.',
    es: 'Os veis y compartís la comida. Eatple no toca el dinero: pagas al restaurante lo que comes, así que nadie en la mesa le debe nada a nadie.',
    fr: "Vous vous retrouvez et vous partagez le repas. Eatple ne touche pas à l'argent : vous payez au restaurant ce que vous mangez, donc personne à table ne doit rien à personne.",
    ar: 'تلتقون وتتشاركون الطعام. لا يمسّ Eatple المال: تدفع للمطعم ثمن ما تأكل، فلا يكون على أحد في المائدة دَين لأحد.',
    zh: '见面，一起吃。Eatple 不经手钱：你吃了什么就付给饭馆多少，所以桌上没有谁欠谁。',
    ja: '会って、一緒に食べる。Eatple はお金を扱いません。食べた分をお店に払うので、卓の誰も誰かに借りをつくりません。',
  },
];

/** The cultural fact that makes the whole thing make sense. */
export const HOW_WHY = {
  kr: '한국 밥상은 나눠 먹도록 차려집니다',
  en: 'A Korean table is laid to be shared. Browsing every dish and tip is free; the seat is what an account is for.',
  es: 'Una mesa coreana se pone para compartirla. Mirar los platos y los consejos es gratis; la cuenta es para el sitio en la mesa.',
  fr: "Une table coréenne se dresse pour être partagée. Parcourir les plats et les conseils est gratuit ; le compte sert à avoir la place.",
  ar: 'تُمدّ المائدة الكورية لتُشارَك. تصفّح الأطباق والنصائح مجاني؛ والحساب إنما هو للمقعد.',
  zh: '韩国的饭桌是摆出来分着吃的。看菜、看攻略都免费；账号是为了那个位子。',
  ja: '韓国の食卓は分け合うために整えられます。料理も案内も見るのは無料で、アカウントは席のためにあります。',
};
