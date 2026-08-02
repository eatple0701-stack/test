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
  rule:
    '밥친구 seats people who want to eat a dish nobody can order alone. It is ' +
    'not a dating app, and a seat at a table is not an opening to ask somebody out.',
  ifBroken:
    'If somebody treats it as one: you can leave, and you can tell the team ' +
    'afterwards. A host who made somebody uncomfortable should not be hosting ' +
    'the next table.',
  /** One line, for places where a paragraph would be too much. */
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
  'This is a meal, not a date. A seat at a table is not an opening to ask somebody out.',
  'People at your table may have told the host what they cannot eat. Take it seriously.',
  'You can leave any meal at any point, and you owe nobody an explanation.',
  'If somebody makes you uncomfortable you can block them, and you can tell the team.',
];

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
