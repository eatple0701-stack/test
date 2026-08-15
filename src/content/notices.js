// What the team needs to tell everybody, today.
//
// 제주항공 opens with a typhoon advisory — three rotating banners, all of them
// operational, above every fare and every new route. That is not a design
// quirk. A service people plan a day around leads with the thing that could
// break the day, and earns trust by doing it before it has to.
//
// This app had no such place at all. The offline bar appears when the network
// goes, and that was the whole of it: no way to say "we are in pilot", no way
// to say "heavy rain in Seoul tonight, message your host", no way to say
// "8/15 is a holiday and many restaurants close". Every one of those is a fact
// somebody standing in Jongno at 18:50 would want.
//
// Kept as a file rather than a table for now, deliberately. The notice that
// matters most in the pilot is a standing one — that this is a pilot — and a
// standing notice does not need a database. When the team wants to post one
// from a phone, this shape moves to a row with the same three fields and the
// component below stops caring where it came from.
//
// Rules, so this does not become a marketing surface:
//
//   One at a time. A banner stack is a banner nobody reads.
//   Say what it means for the reader, not what happened to us.
//   Every notice carries every language the app offers — a banner is the
//   one thing on screen that cannot be skipped, so it must not be the one
//   thing somebody cannot read.
//   A notice with an `until` disappears on its own; nobody has to remember.

export const NOTICE_KIND = {
  // Something about the app itself the reader should know before judging it.
  ABOUT: 'about',
  // Something happening out there that could change tonight's plan.
  CONDITIONS: 'conditions',
};

/**
 * The notices that exist. Order is priority: the first one still live wins.
 *
 * `until` is an ISO date, exclusive — the notice stops showing on that day.
 * Omit it for a standing notice.
 */
export const NOTICES = [
  {
    id: 'pilot-2026-08',
    kind: NOTICE_KIND.ABOUT,
    kr: '지금은 파일럿 기간이에요.',
    en: 'This is a pilot, so there are only a few tables yet — and opening one yourself is the fastest way to get a table on your week.',
    es: 'Esto es un piloto, así que todavía hay pocas mesas — y abrir una tú mismo es la forma más rápida de tener mesa esta semana.',
    fr: "C'est un pilote, il y a donc encore peu de tables — et en ouvrir une vous-même est le moyen le plus rapide d'avoir une table cette semaine.",
    ar: 'هذه تجربة أولى، فالموائد ما زالت قليلة — وأن تفتح واحدة بنفسك أسرع طريق إلى مائدة هذا الأسبوع.',
    zh: '这还是试运行，所以饭桌还不多——而自己开一张，是这周吃上饭最快的办法。',
    ja: 'これはパイロット運用なので食卓はまだ多くありません。自分で一つ開くのが、今週食卓につく最短の道です。',
    until: '2026-09-01',
  },
];

/**
 * The one notice to show now, or null.
 *
 * Dates are compared as YMD strings against the local day rather than as
 * instants: a notice that should end "on the first of September" means the
 * reader's first of September, and an instant comparison would retire it in
 * the middle of somebody's evening.
 */
export function activeNotice(notices = NOTICES, today = new Date()) {
  const ymd = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  return (notices ?? []).find(n => !n?.until || ymd < n.until) ?? null;
}
