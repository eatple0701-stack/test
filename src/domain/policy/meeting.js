// MeetingPolicy — how strangers find each other at Exit 4.
//
// The app arranges a meal between people who have never met, tells them a
// station exit and a time, and then stops. There is no chat, no phone number
// and — deliberately, see HANDOFF §4 — no plan to collect one. So the last
// hundred metres, the part where somebody stands at Sinsa Exit 4 at 19:00
// among forty other people, was left to luck.
//
// TableCreate had `placeholder="What people should look for"` on the host's
// *name* field, which is the app hinting at this problem and then not solving
// it. A host who answered that placeholder honestly would have called
// themselves "red jacket by the stairs".
//
// What can be built without contacts: the host says what to look for, once,
// in their own words. Nothing here is clever. The value is entirely in it
// being shown at the right moment to the right people.
//
// Who sees it, and why it is not simply public: "I will be in a yellow coat
// by the convenience store" is a description of where a specific person will
// physically be at a specific time. On the table's public page that is
// available to anybody browsing, including somebody the host has already
// turned down. It belongs to the people actually eating together.

/** Long enough for a landmark and a jacket, short enough to read standing up. */
export const MEETING_NOTE_MAX = 140;

export const cleanMeetingNote = (text) =>
  typeof text === 'string' ? text.trim().slice(0, MEETING_NOTE_MAX) : '';

/**
 * May this person read how to recognise the host?
 *
 * The host wrote it, so they see it. A confirmed guest is going to the meal,
 * so they need it. Everybody else — browsers, people still waiting on an
 * answer, people who were declined — does not, and a pending request is
 * deliberately on that side of the line: the note is for people who are
 * going, and until the host answers, nobody knows whether they are.
 */
export function canSeeMeetingNote({ isHost, mySignupAccepted }) {
  return Boolean(isHost || mySignupAccepted);
}

/**
 * What to tell somebody who has a seat, given whatever the host wrote.
 *
 * Never returns nothing. A blank note is the common case — most hosts will
 * not think to fill it in — and "no information" is exactly the state this
 * file exists to remove. The fallback is not a placeholder; it is the thing
 * that is actually true and actually works: the host is holding a list with
 * your name on it, so say your name.
 */
export function meetingGuidance(table, { isHost } = {}) {
  const note = cleanMeetingNote(table?.meetingNote);
  if (isHost) {
    return note
      ? { kind: 'written', title: 'What your table is looking for', body: note }
      : {
        kind: 'ask-host',
        title: 'Nobody knows what you look like',
        body: 'Say where exactly you will stand and one thing to spot you by — a jacket, a bag, the convenience store on the corner. Everyone with a seat sees it; nobody else does.',
      };
  }
  return note
    ? { kind: 'written', title: 'Finding the host', body: note }
    : {
      kind: 'ask-host',
      title: 'Finding the host',
      body: 'The host has not said what to look for. They do have your name on the seat list, so walking up and saying it works — that is all anybody there is expecting.',
    };
}
