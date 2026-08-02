// AttendancePolicy — who actually turned up.
//
// 신보람 교수님 asked what happens on a no-show. The honest answer today was
// that the app does not notice, and worse than not noticing: JournalPanel
// reads every past table and files everybody at it under "people you met".
// A guest who confirmed a seat and never came is written into a traveller's
// Passport as somebody they had dinner with. The record is the one thing in
// this app that is supposed to be a memory rather than a claim, and it was
// quietly inventing one.
//
// So the point of this file is not punishment. There is no reputation score
// here and NOT_YET_BUILT still says so — a 매너온도 needs history, appeals and
// somebody to run it, and a pilot inventing one would be worse than a pilot
// admitting it has none. The point is that the diary stops asserting things
// nobody checked.
//
// The default is the load-bearing decision. Most meals happen and most hosts
// will never open the app afterwards to say so, so:
//
//   unrecorded  -> counts as met. Silence means the ordinary thing happened.
//   no-show     -> does not count, because somebody said it out loud.
//
// The other way round — nothing counts until confirmed — would empty almost
// every Passport to be technically careful, and be wrong more often than the
// version it replaced. This is the smallest change that stops the app being
// certain about something it has no way to know.

/** What the host said about somebody after the meal. */
export const ATTENDANCE = {
  CAME: 'came',
  NO_SHOW: 'no_show',
};

/** Nobody said anything. The common case, and not a failure. */
export const attendanceOf = (signup) =>
  signup?.attendance && Object.values(ATTENDANCE).includes(signup.attendance)
    ? signup.attendance
    : null;

export const isNoShow = (signup) => attendanceOf(signup) === ATTENDANCE.NO_SHOW;
export const isRecorded = (signup) => attendanceOf(signup) !== null;

/**
 * Did this person share the meal, as far as anyone can tell?
 *
 * True when nothing was recorded — see the note above on why silence reads as
 * yes rather than as unknown-so-no.
 */
export const countsAsMet = (signup) => !isNoShow(signup);

/**
 * Can the host mark attendance for this seat yet?
 *
 * Only after the meal, and only for somebody who actually had a seat. Marking
 * a pending or declined request absent is meaningless — they were never
 * expected — and marking anybody before the meal is a guess.
 */
export function canRecordAttendance({ signup, table, userId, isPastMeal, wasAccepted }) {
  if (!table || !userId || table.hostId !== userId) return false;
  if (!isPastMeal) return false;
  if (!wasAccepted) return false;
  return Boolean(signup);
}

/**
 * What the host is asked, once the meal is behind them.
 *
 * One question per guest and two answers, because anything longer will not be
 * filled in and a half-filled record is worse than an unfilled one — a gap
 * that looks deliberate reads as an accusation.
 */
export const ATTENDANCE_PROMPT = {
  title: 'Who made it?',
  body: 'Only what you say here changes the record. Leaving it alone is fine — everyone is counted as having come unless you say otherwise.',
  came: 'Came',
  noShow: 'Did not come',
};

/**
 * The line a traveller sees on their own past seat.
 *
 * A no-show is stated plainly to the person who did not come. Softening it
 * into nothing would mean the only person who cannot see the record is its
 * subject, and they are the one who can explain it.
 */
export function attendanceNote(signup) {
  if (isNoShow(signup)) {
    return 'The host recorded that you did not come to this meal. If that is wrong, tell the team — the record is theirs to correct, not the host’s to hold over you.';
  }
  return null;
}

/**
 * People from one past table, minus anyone recorded absent.
 *
 * Used by the Passport, which files a table's other names under "people you
 * met" the moment the clock passes the meal.
 */
export const attendees = (signups = []) => signups.filter(countsAsMet);
