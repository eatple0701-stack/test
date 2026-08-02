import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTENDANCE, attendanceOf, isNoShow, isRecorded, countsAsMet,
  canRecordAttendance, attendanceNote, attendees,
} from '../policy/attendance.js';

const HOST = 'host-1';
const table = (over = {}) => ({ id: 't1', hostId: HOST, seats: 4, date: '2026-08-10', time: '19:00', ...over });
const sign = (over = {}) => ({ id: 's1', userId: 'g1', name: 'Aya', ...over });

test('silence is not an accusation', () => {
  // The load-bearing default. Most meals happen and most hosts will never
  // open the app afterwards, so an unrecorded seat counts as a shared meal.
  assert.equal(attendanceOf(sign()), null);
  assert.equal(isRecorded(sign()), false);
  assert.equal(countsAsMet(sign()), true);
});

test('only what somebody said out loud removes a person from the record', () => {
  assert.equal(countsAsMet(sign({ attendance: ATTENDANCE.NO_SHOW })), false);
  assert.equal(countsAsMet(sign({ attendance: ATTENDANCE.CAME })), true);
  assert.equal(isNoShow(sign({ attendance: ATTENDANCE.NO_SHOW })), true);
});

test('a value nobody defined is treated as nothing said, not as absence', () => {
  // A junk value must fail towards counting somebody as present. The other
  // way round would let a bad write quietly delete a real memory.
  assert.equal(attendanceOf(sign({ attendance: 'banana' })), null);
  assert.equal(countsAsMet(sign({ attendance: 'banana' })), true);
  assert.equal(countsAsMet(null), true);
});

test('the Passport drops only the people recorded absent', () => {
  const rows = [
    sign({ id: 'a', name: 'Aya' }),
    sign({ id: 'b', name: 'Marco', attendance: ATTENDANCE.NO_SHOW }),
    sign({ id: 'c', name: 'Sam', attendance: ATTENDANCE.CAME }),
  ];
  assert.deepEqual(attendees(rows).map(s => s.name), ['Aya', 'Sam']);
});

test('attendance cannot be recorded before the meal', () => {
  // Marking somebody absent while the evening is still ahead is a guess.
  assert.equal(
    canRecordAttendance({ signup: sign(), table: table(), userId: HOST, isPastMeal: false, wasAccepted: true }),
    false,
  );
  assert.equal(
    canRecordAttendance({ signup: sign(), table: table(), userId: HOST, isPastMeal: true, wasAccepted: true }),
    true,
  );
});

test('only the host records it, and only for somebody who had a seat', () => {
  const t = table();
  assert.equal(
    canRecordAttendance({ signup: sign(), table: t, userId: 'someone-else', isPastMeal: true, wasAccepted: true }),
    false,
  );
  // Never expected, so being absent means nothing.
  assert.equal(
    canRecordAttendance({ signup: sign(), table: t, userId: HOST, isPastMeal: true, wasAccepted: false }),
    false,
  );
});

test('the person recorded absent is told, and told where to argue', () => {
  // The subject of a record is the one person who can explain it, so they
  // must not be the only one who cannot see it.
  const note = attendanceNote(sign({ attendance: ATTENDANCE.NO_SHOW }));
  assert.ok(note && note.length > 0);
  assert.match(note, /tell the team/);
  assert.equal(attendanceNote(sign()), null);
  assert.equal(attendanceNote(sign({ attendance: ATTENDANCE.CAME })), null);
});
