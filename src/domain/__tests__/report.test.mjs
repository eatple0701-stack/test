import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPORT_REASONS, reportReasonById, REPORT_NOTE_MAX, cleanReportNote,
  validateReport, REPORT_RECEIPT,
} from '../policy/report.js';

// ReportPolicy — the door to the team.
//
// The stakes are asymmetric: a broken filter chip loses a click, a broken
// report loses the one message from the person the safety design exists for.
// So the tests hold the gate itself — what must be said, what may be left
// unsaid, and that the receipt never promises a process the pilot does not
// run.

test('every reason has both languages and a stable id', () => {
  assert.ok(REPORT_REASONS.length >= 3, 'fewer reasons than the form was designed around');
  for (const r of REPORT_REASONS) {
    assert.ok(r.id && r.kr && r.en, `${r.id ?? '?'} is missing a label`);
  }
  // Ids are looked up by value elsewhere; a rename is a schema change.
  assert.ok(reportReasonById('safety'), 'the safety reason is the one the design leans on');
  assert.equal(reportReasonById('nonsense'), null);
});

test('a report about a person is only its words, so the words are required', () => {
  assert.equal(validateReport({ reasonId: 'person', note: '' }).length, 1);
  assert.equal(validateReport({ reasonId: 'other', note: '   ' }).length, 1);
  assert.deepEqual(validateReport({ reasonId: 'person', note: 'The host asked guests for money.' }), []);
});

test('a safety report may be sent with no note at all', () => {
  // The person most in need of this button is the least likely to write an
  // essay first. The table id already says where to look.
  assert.deepEqual(validateReport({ reasonId: 'safety' }), []);
  assert.deepEqual(validateReport({ reasonId: 'fake', note: '' }), []);
});

test('no reason at all is not a sendable report', () => {
  assert.equal(validateReport({}).length, 1);
  assert.equal(validateReport({ reasonId: 'invented' }).length, 1);
});

test('the note is capped rather than refused', () => {
  const long = 'x'.repeat(REPORT_NOTE_MAX + 50);
  assert.equal(cleanReportNote(long).length, REPORT_NOTE_MAX);
  assert.equal(cleanReportNote('  hello  '), 'hello');
  assert.equal(cleanReportNote(null), '');
});

test('the receipt promises a reader, not a process', () => {
  // The pilot has no moderation queue and no response-time SLA. The receipt
  // must not grow words that claim one — this is the docsHonesty rule
  // applied to safety copy, where it matters most.
  const text = `${REPORT_RECEIPT.title} ${REPORT_RECEIPT.body}`.toLowerCase();
  for (const overclaim of ['within 24', 'immediately', 'will be removed', 'will be banned']) {
    assert.ok(!text.includes(overclaim), `receipt promises "${overclaim}", which nobody can keep`);
  }
  assert.ok(text.includes('read'), 'the one honest promise — a person reads it — is missing');
});

test('a report problem names its field and speaks both languages', () => {
  // The panel marks the box that is wrong, which it can only do if the
  // problem says which box that is — and somebody upset enough to open this
  // panel is the last person who should be handed English only.
  const cases = [validateReport({}), validateReport({ reasonId: 'person', note: '' })];
  for (const problems of cases) {
    assert.ok(problems.length > 0);
    for (const p of problems) {
      assert.ok(['reason', 'note'].includes(p.field), `unknown field ${p.field}`);
      assert.match(p.kr, /[가-힣]/, `${p.field} has no Korean`);
      assert.ok(p.en.trim().length > 0, `${p.field} has no English`);
    }
  }
});
