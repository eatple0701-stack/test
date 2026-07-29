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
 * DELIBERATELY EMPTY. Fill this in with the channel the 밥친구 team will be
 * watching during the pilot — an open KakaoTalk room, a monitored email, a
 * phone number somebody answers. Until it is set the app says reporting is
 * not wired up yet, which is true, instead of showing a button that quietly
 * goes nowhere. A report that vanishes is worse than no report button,
 * because somebody trusted it in the moment they needed it most.
 */
export const REPORT_CHANNEL = {
  label: '',   // e.g. '밥친구 운영팀 오픈채팅'
  href: '',    // e.g. 'https://open.kakao.com/o/...' or 'mailto:...'
};

export const reportingConfigured = () =>
  Boolean(REPORT_CHANNEL.label && REPORT_CHANNEL.href);

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
  'Blocking somebody so they cannot see your tables',
  'A reputation signal like 당근마켓’s 매너온도',
  'Reporting from inside the app rather than through a channel',
];
