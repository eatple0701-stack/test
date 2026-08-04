// ReportPolicy — telling the team, as distinct from telling the host.
//
// 김훈 부장님's review named the gap directly: a hosting-and-matching service
// needs 신고, 차단, 후기. Blocking exists (policy/blocking.js) and is a
// private act — it changes what *you* see and who can sit with *you*. A
// report is the opposite kind of act: it changes nothing on your screen and
// asks a person on the team to look at something. The two must not be merged,
// because somebody blocking a creep quietly is not the same somebody asking
// for help, and a UI that conflates them loses the second one.
//
// What a report is in this pilot, honestly: a row the team reads in the
// dashboard. There is no moderation queue, no automatic action, no promised
// response time — inventing any of those in the UI would be the app claiming
// a process that does not exist. The receipt text below says exactly what
// happens, which is that a person will read it.
//
// Reports are deliberately open to anyone with a session, member or not.
// Every other participation door checks membership; this one must not,
// because the person most likely to need it is a guest who came to look at a
// table somebody sent them and saw something wrong on it.

/**
 * Why somebody is writing to the team. Four, not a taxonomy — the reason is
 * a routing hint for whoever reads the row, and the note carries the truth.
 */
export const REPORT_REASONS = [
  {
    id: 'safety',
    kr: '불안하게 느껴져요',
    en: 'Something here feels unsafe',
  },
  {
    id: 'person',
    kr: '특정 사람에 대한 신고',
    en: 'About a specific person',
  },
  {
    id: 'fake',
    kr: '가짜 또는 스팸 같아요',
    en: 'Looks fake or spam',
  },
  {
    id: 'other',
    kr: '다른 문제',
    en: 'Something else',
  },
];

export const reportReasonById = (id) => REPORT_REASONS.find(r => r.id === id) ?? null;

/** Long enough to say what happened, short enough to be read as one report. */
export const REPORT_NOTE_MAX = 300;

export const cleanReportNote = (text) =>
  typeof text === 'string' ? text.trim().slice(0, REPORT_NOTE_MAX) : '';

/**
 * Reasons where the note is required rather than optional.
 *
 * "About a specific person" with no words is a row nobody can act on — it
 * does not even say who. "Something else" with no words is empty by
 * definition. The other two reasons stand on their own: a table reported as
 * unsafe or fake is already pointing at the thing the team should open.
 */
const NOTE_REQUIRED = ['person', 'other'];

/**
 * Problems with a report, in the order the form shows them.
 * An empty array means it can be sent.
 */
export function validateReport({ reasonId, note } = {}) {
  const problems = [];
  // Both languages, and named by field, for the same reason the signup form
  // carries both: somebody reaching this panel is upset, and an English-only
  // sentence is the worst moment for the app to stop speaking their language.
  if (!reportReasonById(reasonId)) {
    problems.push({
      field: 'reason',
      kr: '어떤 문제인지 골라 주세요.',
      en: 'Pick what kind of problem this is.',
    });
  }
  if (NOTE_REQUIRED.includes(reasonId) && !cleanReportNote(note)) {
    problems.push({
      field: 'note',
      kr: '무슨 일이 있었는지 적어 주세요. 이 신고는 적어 주신 내용이 전부예요.',
      en: 'Say what happened — this kind of report is only the words you write.',
    });
  }
  return problems;
}

/**
 * What the reporter is told after sending. Precise about what a report is —
 * a person will read it — and about what it is not: nothing on the screen
 * changes, and nobody at the table is told.
 */
export const REPORT_RECEIPT = {
  title: '접수됐어요 · The team will read this',
  body: 'Reports go to the people running the pilot, not to anyone at the table. Nothing changes on your screen, and nobody is told you wrote one. If you feel unsafe right now, use the help sheet below — it has the numbers that matter.',
};

/** The door itself, worded once so every screen says the same thing. */
export const REPORT_DOOR = {
  open: '신고하기 · Report this table to the team',
  title: '무엇이 문제인가요?',
  hint: 'Goes to the team running the pilot. Not visible to the host or anyone at the table.',
  send: '보내기 · Send report',
};
