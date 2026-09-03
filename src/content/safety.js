// Safety, for an app that puts strangers at a table together.
//
// 당근마켓 has 신고 and 차단 and a 매너온도 that visibly changes who will deal
// with you. Meetup lets an organiser remove somebody. This app had none of
// it — a traveller meeting a Korean host they have never seen had no button
// to press if the evening went wrong, which is not a missing feature so much
// as a missing duty.
//
// What can honestly be built without a server: the advice, and a route to a
// human. Blocking and reputation need shared storage and are listed at the
// bottom as what is still owed rather than faked.

/**
 * Where a report actually goes.
 *
 * Empty until the pilot had somewhere real to send one. The rule this file
 * was written around still holds: a report that vanishes is worse than no
 * report button, because somebody trusted it in the moment they needed it
 * most — so the screen said reporting was not connected rather than showing
 * a control that went nowhere.
 *
 * An open KakaoTalk room, because it is the one channel a traveller in Korea
 * can open without an account, an app store, or a phone number — and because
 * somebody on the team can watch it from their own phone during the pilot.
 *
 * What this now commits the team to: a person reading that room while tables
 * are running. The button says the message reaches somebody, and on the
 * evening it gets used that has to be true.
 */
export const REPORT_CHANNEL = {
  label: '밥친구 운영팀 오픈채팅',
  href: 'https://open.kakao.com/o/g4hMZTGi',
};

export const reportingConfigured = () =>
  Boolean(REPORT_CHANNEL.label && REPORT_CHANNEL.href);

/**
 * The languages this screen speaks, in the order say() reads them.
 *
 * Positional rather than named because say(en, ko, es, fr, ar, zh, ja) is
 * positional across 423 call sites. Every render site below spells its seven
 * arguments out — say(r.en, r.ko, r.es, …) — rather than spreading a helper,
 * because audit-i18n counts the arguments a say() call is written with and a
 * spread reads to it as one. A helper would have hidden a missing language
 * from the only tool that looks for one.
 */
export const LANGS = ['en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja'];

/**
 * The one sentence RULES[0] and PURPOSE.rule both end on.
 *
 * They ended on it because somebody typed it twice. A grep for "opening to
 * ask" on 2026-09-03 returned exactly two lines, in two different exports,
 * with nothing holding them together — and the host reads it on the consent
 * gate while the guest reads it under the seat button, so the two drifting
 * apart would be two different promises on two screens. Seven languages
 * would have made that seven times worse, so it is a constant and
 * consentLanguages.test.mjs asserts both users really read it.
 *
 * A note on the English punctuation, because it changed and the words did
 * not: this was "It is not a dating app, and a seat at a table is not an
 * opening…" — one sentence joined by a comma. It is two sentences now, in
 * every language, because a shared constant cannot be spliced into the
 * middle of a clause and still be the same string (English would need it
 * lowercased, Korean would need -고). Spanish, French, Chinese and Japanese
 * had already split it on their own for the same reason.
 *
 * Every language denies an OPPORTUNITY, and none of them denies permission.
 * That distinction was measured rather than assumed: Chinese 不等于可以 and
 * Japanese 〜てよいわけではありません both negate a permission, which is a rung
 * above the English, and Korean 「~해도 된다는 뜻은 아닙니다」 was the same shape.
 * All three now name the opportunity — 机会 / きっかけ / 기회 — which is what
 * "an opening" is. Korean deliberately does not use 계기 (the cause that
 * started something) or 빌미 (a pretext, which imputes bad faith the English
 * has not got).
 */
const NOT_AN_OPENING = {
  en: 'A seat at a table is not an opening to ask somebody out.',
  ko: '밥상에 앉는 것은 누군가에게 데이트를 청할 기회가 아닙니다.',
  es: 'Un sitio en una mesa no da pie a invitar a salir a nadie.',
  fr: "Une place à table n'est pas une occasion d'inviter quelqu'un à sortir.",
  ar: 'والمقعد على المائدة ليس فرصة لدعوة أحد إلى موعد غرامي.',
  zh: '坐到一张饭桌上，不是约人出去的机会。',
  ja: '食卓に着くことは、誰かをデートに誘うきっかけではありません。',
};

/**
 * What this app is for, and what it is not for.
 *
 * The business plan defines the product in its first line as 데이팅이 아닌
 * '목적형 밥친구' 매칭 — purpose-built meal matching, not dating. The app had
 * never said so anywhere. Not once, in any screen, in any language.
 *
 * On an app that seats strangers of any gender at a table together, saying
 * nothing is not neutrality. The traveller deciding whether to take a seat,
 * and whoever they told about it before leaving the hotel, both fill that
 * silence with the worst reading available. Stating the rule costs one
 * sentence and is the cheapest safety work in the whole product.
 *
 * Deliberately not promising enforcement we do not have. A comparable pilot
 * in this same team's plan advertises immediate permanent bans; there is no
 * moderation queue here and no reporting channel wired up yet — both named
 * in NOT_YET_BUILT below. So this says what the rule is and what a person
 * can actually do, which is leave, block, and tell the team, rather than
 * implying a system is watching.
 */
export const PURPOSE = {
  kr: '목적형 밥친구',
  en: 'Here for the food',
  /**
   * Bump when the rules below change in a way somebody who already agreed
   * would want to know about. `agreedToRules` (src/domain/policy/consent.js)
   * compares against this, so a bump asks everyone again rather than letting
   * an old agreement stand in for a rule nobody consented to. Wording fixes
   * that do not change what is being agreed to should NOT bump it — asking
   * a traveller to re-agree to a comma is how a consent step turns into
   * something people click through without reading.
   */
  version: 1,
  /**
   * What the app is for. Read by the guest under the seat button
   * (TableDetail) and by anyone who opens 도움이 필요하면 (SafetySheet).
   *
   * The first sentence used to say "a dish nobody can order alone", which is
   * a claim about what restaurants allow and is false for 10 of the 24
   * dishes in the catalogue — baekban through bibimbap all carry
   * minPeople: 1, and the catalogue says so in its own prose. The subject
   * moved from the shop to the person: a dish they would rather not eat
   * alone. Korean and Japanese say it as a positive comparison
   * (혼자보다 같이 / ひとりより誰かと) where the other five negate; that is
   * deliberate and came from settling Korean first, not from drift.
   */
  rule: {
    en: "Eatple seats people who want to eat a dish they'd rather not eat alone. It is not a dating app. " + NOT_AN_OPENING.en,
    ko: '밥친구는 혼자보다 같이 먹고 싶은 요리가 있는 사람들을 한 상에 앉힙니다. 데이팅 앱이 아닙니다. ' + NOT_AN_OPENING.ko,
    es: 'Eatple sienta a una misma mesa a personas con ganas de un plato que preferirían no comer solas. No es una app de citas. ' + NOT_AN_OPENING.es,
    fr: "Eatple réunit à une même table des gens qui ont envie d'un plat qu'ils préfèrent ne pas manger seuls. Ce n'est pas une application de rencontres. " + NOT_AN_OPENING.fr,
    ar: 'يُجلس Eatple إلى مائدة واحدة أشخاصًا لديهم طبق يفضّلون ألّا يأكلوه وحدهم. وهو ليس تطبيق مواعدة. ' + NOT_AN_OPENING.ar,
    zh: 'Eatple 把想吃某道菜、又不想一个人吃的人凑到一桌。这不是约会应用。' + NOT_AN_OPENING.zh,
    ja: 'Eatple は、ひとりより誰かと食べたい料理がある人たちを、ひとつの食卓に集めます。デートアプリではありません。' + NOT_AN_OPENING.ja,
  },
  /**
   * What a person can do, and what a host ought not do.
   *
   * The last sentence is a NORM, not an enforcement. The app does not stop
   * anybody hosting again — there is no moderation queue (NOT_YET_BUILT) and
   * the report channel is one open chat room a person watches. So every
   * language sits on the ought-not rung: should not / no debería / ne devrait
   * pas / لا ينبغي / 不该 / べきではありません / 열지 말아야 합니다.
   *
   * Korean was 「열어서는 안 됩니다」 until 2026-09-03. That is the standard
   * rendering of must not, one rung above the English, and it was approved
   * before a rung ladder existed. If the team ever does stop a host, the
   * order is the feature first and the wording second — raising the wording
   * without the feature promises something the app has not got.
   */
  ifBroken: {
    en: 'If somebody treats it as one: you can leave, and you can tell the team afterwards. A host who made somebody uncomfortable should not be hosting the next table.',
    ko: '누군가 그렇게 대한다면: 자리를 떠날 수 있고, 나중에 팀에 알릴 수 있습니다. 누군가를 불편하게 한 호스트는 다음 밥상을 열지 말아야 합니다.',
    es: 'Si alguien lo trata como una cita: puedes irte, y puedes avisar al equipo después. Un anfitrión que haya incomodado a alguien no debería abrir la siguiente mesa.',
    fr: "Si quelqu'un en fait un rendez-vous galant : vous pouvez partir, et prévenir l'équipe ensuite. Un hôte qui a mis quelqu'un mal à l'aise ne devrait pas tenir la prochaine table.",
    ar: 'إن تعامل أحد مع الأمر على هذا النحو فيمكنك المغادرة، ويمكنك إخبار الفريق بعد ذلك. والمضيف الذي أشعر أحدًا بعدم الارتياح لا ينبغي أن يستضيف المائدة التالية.',
    zh: '要是有人把这当成约会：你可以离席，事后也可以告诉团队。曾让人不舒服的主人，不该开下一张饭桌。',
    ja: '誰かがこの場をそう扱ってきたら：席を立つことも、あとでチームに知らせることもできます。誰かに不快な思いをさせたホストは、次の食卓を開くべきではありません。',
  },
  /** One line, for places where a paragraph would be too much. Unused today. */
  short: 'For eating together — not a dating app.',
};

/**
 * What somebody is actually agreeing to, as the list they see above the
 * button — 교수님's ask was that the no-dating rule live in 사용자 조항 with
 * 동의 받기, not only as a line on a screen.
 *
 * Kept to what this app can actually stand behind. Each line is either a
 * rule the reader is agreeing to keep, or a fact about what happens if
 * somebody else does not — nothing here promises moderation that does not
 * exist (see NOT_YET_BUILT), because a consent screen is exactly the wrong
 * place to overstate what is watching.
 */
export const RULES = [
  {
    en: 'This is a meal, not a date. ' + NOT_AN_OPENING.en,
    ko: '이 자리는 식사이지 데이트가 아닙니다. ' + NOT_AN_OPENING.ko,
    es: 'Esto es una comida, no una cita. ' + NOT_AN_OPENING.es,
    fr: "Il s'agit d'un repas, pas d'un rendez-vous galant. " + NOT_AN_OPENING.fr,
    ar: 'هذه وجبة لا موعد غرامي. ' + NOT_AN_OPENING.ar,
    zh: '这是一顿饭，不是约会。' + NOT_AN_OPENING.zh,
    ja: 'これは食事の場であって、デートではありません。' + NOT_AN_OPENING.ja,
  },
  {
    // "may have told", not "have told": the reader is not owed a list, they
    // are asked to expect one. Korean adds 미리 because English gets the
    // precedence free — "told the host" has a listener who is not the reader,
    // so it already reads as a separate, earlier act.
    en: 'People at your table may have told the host what they cannot eat. Take it seriously.',
    ko: '같은 밥상의 사람들이 못 먹는 것을 호스트에게 미리 알렸을 수 있습니다. 진지하게 받아들이세요.',
    es: 'Puede que las personas de tu mesa le hayan dicho al anfitrión lo que no pueden comer. Tómatelo en serio.',
    fr: "Les gens à votre table ont peut-être dit à l'hôte ce qu'ils ne peuvent pas manger. Prenez-le au sérieux.",
    ar: 'من يشاركونك المائدة ربّما أخبروا المضيف بما لا يستطيعون أكله. خذ ذلك على محمل الجدّ.',
    zh: '同桌的人可能已经把自己不能吃的东西告诉了主人。请认真对待。',
    ja: '同じ食卓の人が、食べられないものをホストに伝えているかもしれません。真剣に受け止めてください。',
  },
  {
    // "owe", not "need": the English denies a debt, not a chore. Chinese was
    // 不必 (need not) and Japanese 必要はありません for the same reason, and
    // both moved to the obligation word — 不欠 and 義務 — on 2026-09-03.
    en: 'You can leave any meal at any point, and you owe nobody an explanation.',
    ko: '어느 식사든 언제든 떠날 수 있고, 누구에게도 이유를 설명할 의무가 없습니다.',
    es: 'Puedes irte de cualquier comida en cualquier momento, y no le debes explicaciones a nadie.',
    fr: "Vous pouvez quitter n'importe quel repas à n'importe quel moment, et vous ne devez d'explication à personne.",
    ar: 'تستطيع مغادرة أي وجبة في أي لحظة، ولست مدينًا لأحد بتفسير.',
    zh: '任何一顿饭，你随时都可以离席，也不欠任何人一个解释。',
    ja: 'どの食事でも、いつでも席を立って構いません。誰にも理由を説明する義務はありません。',
  },
  {
    // Two separate cans, and nothing at all about what the team then does.
    // The line most likely to drift into promising moderation, which is why
    // consentLanguages.test.mjs carries an overclaim guard per language
    // rather than only for the English.
    en: 'If somebody makes you uncomfortable you can block them, and you can tell the team.',
    ko: '누군가 불편하게 하면 그 사람을 차단할 수 있고, 팀에 알릴 수 있습니다.',
    es: 'Si alguien te incomoda, puedes bloquear a esa persona y puedes avisar al equipo.',
    fr: "Si quelqu'un vous met mal à l'aise, vous pouvez le bloquer, et vous pouvez prévenir l'équipe.",
    ar: 'إن أشعرك أحد بعدم الارتياح فيمكنك حظره، ويمكنك إخبار الفريق.',
    zh: '要是有人让你不舒服，你可以拉黑对方，也可以告诉团队。',
    ja: '誰かに不快な思いをさせられたら、その人をブロックすることも、チームに知らせることもできます。',
  },
];

/**
 * Which door the consent gate is standing in front of.
 *
 * A key rather than the button's own words, because the words used to be the
 * prop: `action="open a table"` was interpolated into a translated frame, so
 * a Korean host read "동의하고 계속 — open a table" and a Japanese one read
 * "同意します — open a table". Four of these were found by hand over two days
 * and a fifth by scripts/audit-interpolation.mjs; this is the shape that
 * stops a sixth, because there is no English left in the call site to leak.
 */
export const AGREE_ACTION = {
  OPEN_TABLE: 'open-table',
  ASK_SEAT: 'ask-seat',
};

const AGREE_LABEL = {
  [AGREE_ACTION.OPEN_TABLE]: {
    en: 'I agree — open a table',
    ko: '동의하고 계속 — 상 차리기',
    es: 'Acepto — abrir una mesa',
    fr: "J'accepte — ouvrir une table",
    ar: 'أوافق — افتح مائدة',
    zh: '我同意 — 开一张饭桌',
    ja: '同意します — 食卓を開く',
  },
  [AGREE_ACTION.ASK_SEAT]: {
    en: 'I agree — ask for a seat',
    ko: '동의하고 계속 — 자리 요청',
    es: 'Acepto — pedir sitio',
    fr: "J'accepte — demander une place",
    ar: 'أوافق — اطلب مقعدًا',
    zh: '我同意 — 申请位子',
    ja: '同意します — 席をリクエストする',
  },
};

/**
 * The whole button label, in every language, for one door.
 *
 * Throws on an unknown key. The two call sites pass this by hand, and the
 * failure mode of a typo used to be English on screen for everybody — a
 * quiet one, because English is the say() fallback. Loud here instead.
 */
export function agreeLabel(action) {
  const label = AGREE_LABEL[action];
  if (!label) throw new Error(`unknown consent action: ${JSON.stringify(action)}`);
  return label;
}

/**
 * What to do now, in order of who can help fastest.
 *
 * Written for somebody reading it at a table with their phone under the
 * table, so it is short and it is imperative.
 */
export const SAFETY_STEPS = [
  {
    id: 'leave',
    title: 'You can leave at any point.',
    body: 'No explanation is owed to anybody. A meal you agreed to is not a commitment you are stuck with.',
  },
  {
    id: 'public',
    title: 'Stay where there are other people.',
    body: 'Korean restaurants are busy and staff are used to being asked for help. Do not move the evening anywhere quieter than where it started.',
  },
  {
    id: 'emergency',
    title: 'Emergencies: 112 for police, 119 for fire and ambulance.',
    body: 'Both take English. 1330 is the Korea Travel Helpline, staffed around the clock in English, Japanese, Chinese and more.',
  },
  {
    id: 'tell-us',
    title: 'Tell the team afterwards, even if it turned out fine.',
    body: 'A host who made somebody uncomfortable should not be hosting the next table, and that only works if we hear about it.',
  },
];

/** Still owed, and named here so nobody mistakes this screen for enough. */
export const NOT_YET_BUILT = [
  'A reputation signal like 당근마켓’s 매너온도',
  'Reporting from inside the app rather than through a channel',
];
