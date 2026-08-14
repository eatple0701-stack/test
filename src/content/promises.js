// What this app guarantees, and the file that guarantees it.
//
// Written after reading 당근 모임 on 2026-08-04. Every group description
// there is a hand-typed list of rules — "모임의 비용은 무조건 1/n", "가입후
// 한달안에 벙참여", "일정기간 미활동시 추방", "벙 중간에 가거나 늦참
// 예외없이 1/n" — because the platform gives the organiser no structure, so
// the organiser writes the structure in prose. Prose cannot enforce itself.
//
// Every one of those is a *feature* here. That is the strongest sentence
// this product has and it appeared nowhere on the screen, which is the
// 교수님's "무엇을 하느냐보다 어떻게 하느냐" landing exactly where it was
// aimed: the mechanism is the public-diplomacy content, not decoration
// around it.
//
// `backedBy` is not documentation. A promise on the landing page is a claim
// to a stranger, and this repository's rule is that claims are checked — so
// each line names the module that makes it true, and a test asserts that
// module exists. Delete the enforcement and the promise fails the suite
// rather than quietly becoming marketing.

export const PROMISES = [
  {
    id: 'approval',
    kr: '호스트가 이름을 보고 승인합니다',
    en: 'The host reads who you are and says yes to you, by name. No table fills itself.',
    ko: '호스트가 당신이 누구인지 읽고, 이름을 보고 승인합니다. 저절로 차는 밥상은 없습니다.',
    es: 'El anfitrión lee quién eres y te dice que sí, por tu nombre. Ninguna mesa se llena sola.',
    fr: "L'hôte lit qui vous êtes et vous dit oui, par votre nom. Aucune table ne se remplit toute seule.",
    ar: 'يقرأ المضيف من أنت ويقول لك نعم، باسمك. ولا تمتلئ مائدة من تلقاء نفسها.',
    zh: '主人会读你是谁，然后按名字答应你。没有哪张饭桌是自己坐满的。',
    backedBy: 'src/domain/policy/seatRequest.js',
  },
  {
    id: 'lapse',
    kr: '답이 없으면 식사 12시간 전에 자리가 풀립니다',
    en: 'An unanswered request releases its seat 12 hours before the meal, so nobody holds a chair by forgetting.',
    ko: '답이 없는 요청은 식사 12시간 전에 자리를 놓아줍니다. 깜빡했다는 이유로 자리를 붙잡고 있는 사람이 없도록요.',
    es: 'Una solicitud sin responder libera su sitio 12 horas antes de la comida, para que nadie retenga una silla por olvido.',
    fr: "Une demande restée sans réponse libère sa place 12 heures avant le repas, pour que personne ne garde une chaise par oubli.",
    ar: 'الطلب الذي يبقى بلا ردّ يُفرج عن مقعده قبل الوجبة باثنتي عشرة ساعة، حتى لا يحتجز أحد كرسيًّا نسيانًا.',
    zh: '没有回应的申请会在开饭前十二小时把位子放开，免得有人只是忘了就一直占着一把椅子。',
    backedBy: 'src/domain/policy/seatRequest.js',
  },
  {
    id: 'attendance',
    kr: '오지 않은 사람은 기록에 남습니다',
    en: 'A no-show is recorded — not as a score, but so the record stops calling somebody a person you met.',
    ko: '오지 않은 것은 기록에 남습니다. 점수를 매기려는 게 아니라, 만나지 않은 사람을 만난 사람이라고 부르지 않기 위해서예요.',
    es: 'Una ausencia queda registrada — no como puntuación, sino para que el registro deje de llamar conocido a alguien a quien no conociste.',
    fr: "Une absence est consignée — non comme une note, mais pour que le carnet cesse d'appeler « rencontré » quelqu'un que vous n'avez pas rencontré.",
    ar: 'يُسجَّل التخلّف عن الحضور — لا كدرجة، بل كي يكفّ السجلّ عن تسمية من لم تلتقِه لقاءً.',
    zh: '没来会被记下——不是为了打分，而是为了让记录别把没见过的人算成见过的人。',
    backedBy: 'src/domain/policy/attendance.js',
  },
  {
    id: 'diet',
    kr: '못 먹는 것은 자리를 요청할 때 미리 전달됩니다',
    en: 'What you cannot eat travels with your seat request. Halal, vegan, an allergy — the host reads it before choosing the shop.',
    ko: '못 드시는 것은 자리 요청과 함께 전달됩니다. 할랄, 비건, 알레르기 — 호스트가 가게를 고르기 전에 먼저 읽습니다.',
    es: 'Lo que no puedes comer viaja con tu solicitud. Halal, vegano, una alergia: el anfitrión lo lee antes de elegir el local.',
    fr: "Ce que vous ne pouvez pas manger voyage avec votre demande. Halal, végétalien, une allergie : l'hôte le lit avant de choisir l'adresse.",
    ar: 'ما لا تستطيع أكله يسافر مع طلبك. حلال، نباتي صرف، حساسية: يقرأه المضيف قبل أن يختار المحل.',
    zh: '你不能吃的东西会跟着你的申请一起过去。清真、纯素、过敏——主人在挑店之前就读到了。',
    backedBy: 'src/data/profile.js',
  },
  {
    id: 'safety',
    kr: '언제든 신고하고 차단할 수 있습니다',
    en: 'Report a table to the team, or block somebody so you never share a table again. Neither tells the other person.',
    ko: '밥상을 팀에 신고하거나, 특정한 사람을 차단해 다시는 같은 상에 앉지 않게 할 수 있습니다. 둘 다 상대에게 알려지지 않습니다.',
    es: 'Puedes reportar una mesa al equipo o bloquear a alguien para no volver a compartir mesa. Ninguna de las dos cosas se le comunica a la otra persona.',
    fr: "Vous pouvez signaler une table à l'équipe, ou bloquer quelqu'un pour ne plus jamais partager de table. Ni l'un ni l'autre n'est communiqué à la personne concernée.",
    ar: 'يمكنك إبلاغ الفريق عن مائدة، أو حظر شخص فلا تشاركه مائدة أبدًا. ولا يُبلَّغ الطرف الآخر بأيٍّ منهما.',
    zh: '你可以向团队举报一张饭桌，也可以拉黑某个人、从此不再同桌。两件事都不会通知对方。',
    backedBy: 'src/domain/policy/report.js',
  },
];

/** The line above the list. Says why the list is worth reading. */
export const PROMISES_LEAD = {
  kr: '밥친구가 다른 이유',
  // The heading in English. `en` below is the sentence under it, not a
  // translation of the heading — without this the block lost its title
  // entirely on an English-only screen and became a floating paragraph.
  titleEn: 'What makes Eatple different',
  en: 'Other apps leave these to a paragraph the organiser types out and nobody enforces. Here they are how the app works.',
  ko: '다른 앱들은 이걸 주최자가 직접 타이핑하고 아무도 지키게 하지 않는 문단에 맡깁니다. 여기서는 이것들이 앱이 작동하는 방식 그 자체입니다.',
  es: 'Otras apps dejan esto en un párrafo que el organizador escribe y que nadie hace cumplir. Aquí es el funcionamiento mismo de la app.',
  fr: "D'autres applications laissent cela à un paragraphe que l'organisateur tape et que personne ne fait respecter. Ici, c'est le fonctionnement même de l'application.",
  ar: 'تطبيقات أخرى تترك هذا لفقرة يكتبها المنظّم ولا يُلزم بها أحد. هنا هو طريقة عمل التطبيق نفسها.',
  zh: '别的应用把这些交给主办人自己敲的一段话，而没有人去执行。在这里，它们就是应用运作的方式本身。',
  titleZh: 'Eatple 不一样的地方',
  titleAr: 'ما الذي يجعل Eatple مختلفًا',
  titleFr: 'Ce qui rend Eatple différent',
  titleEs: 'Qué hace distinto a Eatple',
};
