import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEETING_NOTE_MAX, cleanMeetingNote, canSeeMeetingNote, meetingGuidance,
} from '../policy/meeting.js';

const table = (over = {}) => ({ id: 't1', hostId: 'h1', place: 'Exit 4, Sinsa', ...over });

test('a description of where a person will be is not public', () => {
  // "Yellow coat by the convenience store at 19:00" is a physical location
  // for a specific human. On a public table page that is available to
  // anybody browsing, including somebody the host already turned down.
  assert.equal(canSeeMeetingNote({ isHost: true, mySignupAccepted: false }), true);
  assert.equal(canSeeMeetingNote({ isHost: false, mySignupAccepted: true }), true);
  assert.equal(canSeeMeetingNote({ isHost: false, mySignupAccepted: false }), false);
  assert.equal(canSeeMeetingNote({}), false);
});

test('somebody still waiting on an answer is not yet somebody who is going', () => {
  // Pending sits on the browsing side of the line on purpose: until the host
  // answers, nobody knows whether this person will be at the meal at all.
  assert.equal(canSeeMeetingNote({ isHost: false, mySignupAccepted: false }), false);
});

test('a guest is never told nothing', () => {
  // The blank note is the common case — most hosts will not think to write
  // one — and "no information" is the exact state this policy exists to
  // remove. The fallback has to be something that actually works.
  const g = meetingGuidance(table(), { isHost: false });
  assert.equal(g.kind, 'ask-host');
  assert.ok(g.body.length > 0);
  // The thing that is actually true: the host is holding a list with your
  // name on it.
  assert.match(g.body, /name/);
});

test('a host with no note is told what to write and who will see it', () => {
  const g = meetingGuidance(table(), { isHost: true });
  assert.equal(g.kind, 'ask-host');
  assert.match(g.body, /Everyone with a seat sees it; nobody else does/);
});

test('what the host wrote is what both sides read', () => {
  const t = table({ meetingNote: 'Green jacket, by the CU on the corner' });
  assert.equal(meetingGuidance(t, { isHost: false }).body, 'Green jacket, by the CU on the corner');
  assert.equal(meetingGuidance(t, { isHost: true }).body, 'Green jacket, by the CU on the corner');
  assert.equal(meetingGuidance(t, { isHost: false }).kind, 'written');
});

test('the note is trimmed and capped, because it is read standing up', () => {
  assert.equal(cleanMeetingNote('   red bag   '), 'red bag');
  assert.equal(cleanMeetingNote('x'.repeat(500)).length, MEETING_NOTE_MAX);
  assert.equal(cleanMeetingNote(null), '');
  assert.equal(cleanMeetingNote(undefined), '');
  assert.equal(cleanMeetingNote(42), '');
});

test('whitespace alone is not a note', () => {
  // Otherwise a host who tabbed through the field would silently replace the
  // fallback guidance with an empty box.
  assert.equal(meetingGuidance(table({ meetingNote: '   ' }), { isHost: false }).kind, 'ask-host');
});
