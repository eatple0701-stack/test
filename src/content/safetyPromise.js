// What the app already does to keep a table safe, said where a stranger
// can read it.
//
// A beta tester on 2026-08-30 searched the whole site for "verified",
// "safety", "report", "block", "review", "cancel" and found nothing, and
// wrote: "I am being asked to meet strangers for dinner in a country I
// don't know, and nothing on the page tells me who they are or what happens
// if something goes wrong."
//
// Every one of those things exists. Reporting is in report.js and reaches
// the team's inbox; blocking is in blocking.js and hides that person's
// tables; the host's record of tables held is on every card; a one-line
// review is collected after the meal; the rules have to be agreed to before
// anybody can sit down. None of it was visible before somebody had already
// joined a table — which is the wrong way round, because it is the thing
// that decides whether they join at all.
//
// ── The rule this file lives under ───────────────────────────────────────
//
// It may only describe what the app actually does today. Nothing here is
// aspirational: an unkept safety promise is worse than no promise, and this
// is the file where that mistake would be easiest to make. Each item names
// the module that implements it so the next person can check.

export const SAFETY_POINTS = [
  {
    id: 'who',
    icon: 'user',
    // src/components/TablesTab.jsx — hostRecord() on every card
    en: 'You see who is hosting before you ask',
    ko: '청하기 전에 호스트가 누구인지 봅니다',
    es: 'Ves quién es el anfitrión antes de pedir sitio',
    fr: "Vous voyez qui reçoit avant de demander une place",
    ar: 'ترى من يستضيف قبل أن تطلب مقعدًا',
    zh: '在申请之前就看得到主人是谁',
    ja: '席を頼む前に、誰がホストかが見えます',
    bodyEn: 'Their name, the languages they speak, and how many tables they have actually held. A first-time host says so.',
    bodyKo: '이름, 할 수 있는 언어, 그리고 지금까지 실제로 연 밥상 수. 처음이면 처음이라고 적혀 있습니다.',
    bodyEs: 'Su nombre, los idiomas que habla y cuántas mesas ha organizado de verdad. Si es su primera vez, lo dice.',
    bodyFr: "Son nom, les langues qu'il parle, et combien de tables il a réellement tenues. Une première fois est annoncée comme telle.",
    bodyAr: 'اسمه، واللغات التي يتكلمها، وكم مائدة أقام فعلًا. وإن كانت أولى مرة فذلك مكتوب.',
    bodyZh: '名字、会说的语言，以及他实际办过几次饭桌。第一次就写着第一次。',
    bodyJa: '名前、話せる言語、そしてこれまで実際に開いた食卓の数。初めてなら初めてと書いてあります。',
  },
  {
    id: 'rules',
    icon: 'shield',
    // src/components/RulesConsent.jsx — agreed before a first table
    en: 'Everyone agrees to the same rules first',
    ko: '모두가 같은 규칙에 먼저 동의합니다',
    es: 'Todo el mundo acepta las mismas reglas primero',
    fr: "Chacun accepte d'abord les mêmes règles",
    ar: 'يوافق الجميع على القواعد نفسها أولًا',
    zh: '所有人都先同意同一份规则',
    ja: '全員が先に同じ約束に同意します',
    bodyEn: 'Nobody can sit at a table without agreeing to them, and this is a meal, not a date.',
    bodyKo: '동의하지 않으면 밥상에 앉을 수 없습니다. 그리고 이곳은 소개팅이 아니라 밥자리입니다.',
    bodyEs: 'Nadie se sienta a una mesa sin aceptarlas, y esto es una comida, no una cita.',
    bodyFr: "Personne ne s'assoit sans les accepter, et il s'agit d'un repas, pas d'un rendez-vous galant.",
    bodyAr: 'لا أحد يجلس إلى المائدة دون الموافقة عليها، وهذه وجبة لا موعد غرامي.',
    bodyZh: '不同意就坐不到桌上。而且这是吃饭，不是相亲。',
    bodyJa: '同意しなければ食卓に着けません。そしてここは食事の場であって、デートではありません。',
  },
  {
    id: 'report',
    icon: 'flag',
    // src/domain/policy/report.js + blocking.js
    en: 'You can report or block anyone, at any point',
    ko: '언제든 신고하거나 차단할 수 있습니다',
    es: 'Puedes reportar o bloquear a cualquiera, en cualquier momento',
    fr: "Vous pouvez signaler ou bloquer n'importe qui, à tout moment",
    ar: 'يمكنك الإبلاغ عن أي شخص أو حظره في أي وقت',
    zh: '任何时候都可以举报或屏蔽任何人',
    ja: 'いつでも誰でも、通報もブロックもできます',
    bodyEn: 'A report reaches the team directly. Blocking someone hides their tables from you immediately, and they are not told.',
    bodyKo: '신고는 팀에게 바로 갑니다. 차단하면 그 사람의 밥상이 즉시 안 보이고, 상대에게는 알려지지 않습니다.',
    bodyEs: 'El reporte llega directo al equipo. Al bloquear, sus mesas desaparecen de inmediato y esa persona no lo sabe.',
    bodyFr: "Un signalement arrive directement à l'équipe. Bloquer masque aussitôt ses tables, et la personne n'en est pas informée.",
    bodyAr: 'يصل البلاغ إلى الفريق مباشرة. والحظر يُخفي موائد ذلك الشخص فورًا دون أن يُعلم بذلك.',
    bodyZh: '举报直接送到团队。屏蔽之后对方的饭桌立刻消失，而且对方不会知道。',
    bodyJa: '通報はチームに直接届きます。ブロックすればその人の食卓はすぐに見えなくなり、相手には知らされません。',
  },
  {
    id: 'money',
    icon: 'wallet',
    // src/domain/policy/venue.js — the app never handles payment
    en: 'No money moves through Eatple',
    ko: '잇플을 통해 돈이 오가지 않습니다',
    es: 'Por Eatple no pasa dinero',
    fr: "Aucun argent ne passe par Eatple",
    ar: 'لا يمرّ أي مال عبر Eatple',
    zh: '没有钱经过 Eatple',
    ja: 'Eatple を通じてお金は動きません',
    bodyEn: 'You pay the restaurant for what you eat, so nobody at the table owes anybody.',
    bodyKo: '먹은 만큼 식당에 직접 냅니다. 그래서 밥상에서 누가 누구에게 빚지는 일이 없습니다.',
    bodyEs: 'Pagas al restaurante lo que comes, así nadie en la mesa le debe nada a nadie.',
    bodyFr: "Vous payez le restaurant pour ce que vous mangez ; personne à table ne doit rien à personne.",
    bodyAr: 'تدفع للمطعم ثمن ما أكلت، فلا يبقى أحد على المائدة مدينًا لأحد.',
    bodyZh: '你吃多少就付给餐厅多少，所以桌上没人欠谁。',
    bodyJa: '食べた分をお店に直接払います。だから食卓で誰かが誰かに借りをつくることがありません。',
  },
];
