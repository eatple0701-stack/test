import { isCancelled } from './cancellation.js';

// SeatRequestPolicy — what happens between asking for a seat and having one.
//
// Until now there was no between. Asking for a seat put you at the table,
// finally, immediately, and the host found out afterwards. HostBrief said so
// out loud — "승인 절차는 아직 없습니다" — which was honest and is not a
// design anyone chose.
//
// Two reviews landed on the same gap from opposite directions. 김훈 부장님:
// 초기에는 호스팅, 매칭 관련 관리자의 승인 절차 기능을 구현하여 해당 서비스의
// 안정성을 확보할 필요가 있음. 신보람 교수님 asked the traveller's version of
// it: 매칭 확정은 얼마나 걸리며, 혹 상대가 No-Show일때는 어떻게 해야할까요?
//
// The approver is the host, not staff. A pilot has no moderation desk, and a
// host who is about to share a grill with three strangers is the person with
// both the standing and the motive to look at who is coming. Saying "admin
// approval" and meaning "an inbox nobody reads" would be worse than the
// instant seat it replaces.
//
// The seat-arithmetic decision, which is the one that can put somebody on a
// pavement in Jongno: a PENDING request holds its seat. A host sitting on
// four requests for two seats cannot accept them all, and nobody else can
// queue behind a table that is already spoken for. The cost is that a silent
// host freezes a table; that is why requests lapse — see hasLapsed below —
// and it is the cheaper failure. Overbooking sends a real person to a
// restaurant that has no room for them.

/** Where a request is between asking and eating. */
export const SEAT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};

/**
 * Statuses that occupy one of the host's seats.
 *
 * Pending is in here deliberately. See the note at the top: a held seat that
 * later frees up is recoverable, a seat promised twice is not.
 */
export const SEAT_HOLDING = [SEAT_STATUS.PENDING, SEAT_STATUS.ACCEPTED];

/**
 * A row written before this policy existed has no status, and it was a
 * confirmed seat under the rules of its own day. Reading it as pending would
 * retroactively un-invite people who were already going.
 */
export const statusOf = (signup) =>
  signup?.status && Object.values(SEAT_STATUS).includes(signup.status)
    ? signup.status
    : SEAT_STATUS.ACCEPTED;

export const isHolding = (signup) => SEAT_HOLDING.includes(statusOf(signup));
export const isPending = (signup) => statusOf(signup) === SEAT_STATUS.PENDING;
export const isAccepted = (signup) => statusOf(signup) === SEAT_STATUS.ACCEPTED;
export const isDeclined = (signup) => statusOf(signup) === SEAT_STATUS.DECLINED;

/** Only the requests that still count against capacity. */
export const holdingSignups = (signups = []) => signups.filter(isHolding);

/**
 * Seats actually given.
 *
 * The count a stranger deciding whether to sit down is really asking for.
 * Screens used to read `signups.length`, which climbed every time anybody
 * asked — so a table where the host had turned two people away advertised
 * them as company.
 */
export const acceptedSignups = (signups = []) => signups.filter(isAccepted);

/**
 * Everybody a cancelled table lands on.
 *
 * Confirmed seats, plus requests still waiting for an answer that will now
 * never come. Not the people already declined: telling a host they are about
 * to inconvenience somebody they refused last week is noise, and it used to
 * inflate the number they were shown before calling a table off.
 */
export const affectedByCancellation = (signups = [], table, now = new Date()) =>
  signups.filter(s => isAccepted(s) || (isPending(s) && !hasLapsed(s, table, now)));

/** What the host has to answer, oldest first — the order they arrived. */
export const pendingSignups = (signups = []) =>
  signups
    .filter(isPending)
    .slice()
    .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));

/**
 * How long before the meal an unanswered request gives up.
 *
 * Twelve hours, so somebody who asked for a Friday dinner knows by Friday
 * morning whether to make other plans. Shorter would punish a host who works
 * a day job; longer leaves a traveller with a whole evening and nothing
 * arranged, which is the exact position this app exists to fix.
 */
export const LAPSE_HOURS_BEFORE_MEAL = 12;

/** When a request stops waiting, or null if the meal has no time yet. */
export function lapseAt(table) {
  if (!table?.date) return null;
  const at = new Date(`${table.date}T${table.time || '00:00'}`);
  if (!Number.isFinite(at.getTime())) return null;
  return new Date(at.getTime() - LAPSE_HOURS_BEFORE_MEAL * 60 * 60 * 1000);
}

/**
 * Has this request run out of time?
 *
 * Computed rather than stored. A lapsed request is not a fourth status and
 * nothing writes to the database when the clock passes — the row stays
 * pending and simply stops being treated as one. That way a host who opens
 * the app late still sees what was asked of them, and there is no scheduled
 * job this pilot has nowhere to run.
 */
export function hasLapsed(signup, table, now = new Date()) {
  if (!isPending(signup)) return false;
  const at = lapseAt(table);
  return Boolean(at) && at.getTime() <= now.getTime();
}

/** Still waiting on the host, and still worth waiting. */
export const isWaiting = (signup, table, now = new Date()) =>
  isPending(signup) && !hasLapsed(signup, table, now);

/**
 * Seats a lapsed request gives back.
 *
 * Capacity has to agree with hasLapsed or a table can sit frozen forever
 * behind a request nobody will ever answer.
 */
export const stillHolding = (signups = [], table, now = new Date()) =>
  signups.filter(s => isHolding(s) && !hasLapsed(s, table, now));

/** Reasons a host cannot answer a request, so the button can say which. */
export const DECIDE_BLOCK = {
  NOT_HOST: 'not-host',
  ALREADY_DECIDED: 'already-decided',
  PAST: 'past',
  NO_SEATS: 'no-seats',
  CANCELLED: 'cancelled',
};

/**
 * Why this host cannot accept this request, or null if they can.
 *
 * NO_SEATS can happen even though pending holds a seat: a host may accept
 * two of three requests and then find the third has nowhere to go. Declining
 * is deliberately never blocked by capacity — a host must always be able to
 * clear a request, and refusing somebody is the one answer that cannot make
 * a table more crowded than it was.
 */
export function acceptBlocker({ signup, signups = [], table, userId, seatsLeft, now = new Date() }) {
  if (!table || !userId || table.hostId !== userId) return DECIDE_BLOCK.NOT_HOST;
  // Giving somebody a seat at a meal that is not happening. Checked here
  // rather than only hidden on screen, because CancellationPolicy's whole
  // point is that a cancelled table stays reachable — so every action on it
  // has to refuse on its own rather than rely on never being reached.
  if (isCancelled(table)) return DECIDE_BLOCK.CANCELLED;
  if (!isPending(signup)) return DECIDE_BLOCK.ALREADY_DECIDED;
  const at = new Date(`${table.date}T${table.time || '00:00'}`);
  if (Number.isFinite(at.getTime()) && at.getTime() < now.getTime()) return DECIDE_BLOCK.PAST;
  // The requester's own seat is one of the held ones, so it is already
  // counted; what matters is whether accepting takes the table past capacity.
  const held = seatsLeft ?? stillHolding(signups, table, now).length;
  if (typeof table.seats === 'number' && 1 + held > table.seats) return DECIDE_BLOCK.NO_SEATS;
  return null;
}

export const canAccept = (args) => acceptBlocker(args) === null;

/** Declining needs the host and an undecided request, and nothing else. */
export function canDecline({ signup, table, userId }) {
  if (!table || !userId || table.hostId !== userId) return false;
  return isPending(signup);
}

export const DECIDE_BLOCK_TEXT = {
  [DECIDE_BLOCK.NOT_HOST]: 'Only the host can answer this',
  [DECIDE_BLOCK.ALREADY_DECIDED]: 'You already answered this request',
  [DECIDE_BLOCK.PAST]: 'This meal has already happened',
  [DECIDE_BLOCK.NO_SEATS]: 'There is no seat left to give',
  [DECIDE_BLOCK.CANCELLED]: 'This table was called off',
};

/**
 * What a traveller is told about their own request.
 *
 * One sentence each, written to be read by somebody deciding whether to keep
 * the evening free. The pending line names the deadline rather than saying
 * "soon", because 교수님's question — 매칭 확정은 얼마나 걸리며 — is a question
 * about planning, and "soon" does not let anybody plan.
 */
export function requestState(signup, table, now = new Date()) {
  const status = statusOf(signup);
  // Before the status, because cancellation overrules it. "Your seat is
  // confirmed — the host is expecting you" is still technically true of the
  // row and completely false of the evening, and it was rendering directly
  // beneath a notice saying the table had been called off. The seat is not
  // held either: there is nothing left to hold it at.
  if (isCancelled(table)) {
    return {
      kind: 'cancelled',
      seatHeld: false,
      title: 'This meal is not happening',
      body: 'The host called the table off. Your seat went with it — there is nothing to cancel and nowhere to turn up to.',
    };
  }
  if (status === SEAT_STATUS.DECLINED) {
    return { kind: SEAT_STATUS.DECLINED, seatHeld: false, title: 'Not this table', body: 'The host could not fit you in. Nothing stops you asking at another table — most hosts are answering a few people at once.' };
  }
  if (status === SEAT_STATUS.ACCEPTED) {
    return { kind: SEAT_STATUS.ACCEPTED, seatHeld: true, title: 'Your seat is confirmed', body: 'The host is expecting you. If anything changes, cancel here rather than not turning up — somebody else can still take the seat.' };
  }
  if (hasLapsed(signup, table, now)) {
    return { kind: 'lapsed', seatHeld: false, title: 'No answer in time', body: 'The host did not answer before the cut-off, so the seat is free again. Make other plans for this evening.' };
  }
  return { kind: SEAT_STATUS.PENDING, seatHeld: true, title: 'Waiting for the host', body: `The host has until ${LAPSE_HOURS_BEFORE_MEAL} hours before the meal to answer. If they do not, this lapses and the seat goes back — you will not be left guessing on the night.` };
}

/**
 * How long is left to ask for a seat at this table, in words.
 *
 * The 12-hour lapse has been a real rule since the approval batch and has
 * never once appeared on a screen. Somebody browsing on Thursday evening for
 * a Friday dinner is inside the window and cannot tell; a host wondering why
 * their table went quiet cannot tell either.
 *
 * This is 야놀자's countdown with the dishonesty removed. Theirs invents a
 * deadline to hurry people — "1일 18시간 7분 후 혜택 종료" on an offer that
 * will be back tomorrow. Ours already exists, is enforced in code, and gives
 * the seat back when it passes. Printing a real deadline is the opposite of
 * manufacturing urgency: it is telling somebody the thing they would want to
 * know if they knew to ask.
 *
 * Returns null when there is nothing true to say — a table with no time, a
 * meal already past, a cancelled evening, or a deadline further out than a
 * day, where a countdown would be noise rather than information.
 *
 * @returns {{ hours: number, kr: string, en: string, urgent: boolean } | null}
 */
export function askDeadline(table, now = new Date()) {
  if (!table || isCancelled(table)) return null;
  const at = lapseAt(table);
  if (!at) return null;

  const ms = at.getTime() - now.getTime();
  if (ms <= 0) return null;

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  // Beyond a day the number stops being a decision aid. "Ask within 3 days"
  // is not something anybody acts on, and a permanent ticking clock on every
  // card is exactly the manufactured pressure this file refuses.
  if (hours >= 24) return null;

  const left = hours >= 1 ? `${hours}시간` : `${minutes}분`;
  const leftEn = hours >= 1
    ? `${hours} hour${hours === 1 ? '' : 's'}`
    : `${minutes} minute${minutes === 1 ? '' : 's'}`;

  return {
    hours,
    minutes,
    kr: `자리 요청 마감까지 ${left}`,
    en: `${leftEn} left to ask — after that the host cannot answer and the seat reopens`,
    // Under three hours the wording earns emphasis; above it, a plain line.
    urgent: hours < 3,
  };
}
