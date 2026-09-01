// send-notifications — the outbox's postman.
//
// Reads unsent rows from public.notifications and delivers them, stamping
// sent_at. The rows themselves are written by database triggers (see
// supabase/schema.sql, "Notifications"); this function decides nothing about
// content — it is a dumb sender on purpose, so the words live in one place.
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy new function →
// name it exactly `send-notifications`, paste this file, and turn OFF
// "Enforce JWT verification" (the pg_net nudge sends no JWT; the function
// leaks nothing — the worst an anonymous caller can do is deliver the mail
// early). Then set secrets under Edge Functions → Secrets:
//
//   Either  RESEND_API_KEY                (needs a verified domain at resend.com)
//   or      GMAIL_USER, GMAIL_APP_PASSWORD (a Gmail address + app password —
//           Google account → Security → 2-Step Verification → App passwords.
//           ~500 mails/day, plenty for the pilot.)
//
// Resend wins when both are set, because HTTP delivery is the more reliable
// path from an edge runtime than SMTP.
//
// Delivery is at-least-once: a row is stamped only after its send succeeds,
// so a crash between send and stamp can repeat an email. The other order
// would lose mail on failure instead, and a lost "table cancelled" is a
// person at an empty station exit — repetition is the cheaper wrong.
//
// ── The subject bug, 2026-09-01 ─────────────────────────────────────────
//
// Every Korean-subject mail arrived unreadable: the subject shown as a raw
// `=?utf-8?Q?…` fragment, and the body containing `From:`, `To:`, `Date:`,
// `Content-Type: multipart/mixed; boundary=attachment100` and then base64.
// It looked like a whole RFC822 message had been stuffed into a body.
//
// It had not. denomailer 1.6.0 encodes the subject with
// quotedPrintableEncodeInline(), which wraps the value in `=?utf-8?Q?…?=`
// and folds the inside at 74 characters using quoted-printable SOFT LINE
// BREAKS — `=\r\n`. A newline inside a header is a continuation only when
// the next line starts with whitespace. This one starts with the next hex
// digit, so the header block ends there and everything after it — the rest
// of the subject, From, To, Date, the MIME headers — becomes the body.
//
// A Korean character is nine characters of quoted-printable (`=ec=b0=a5`),
// so any subject with more than about eight of them crosses 74 and breaks.
// Ours are all longer than that; every Korean mail this outbox ever sent was
// malformed. 1.6.0 is the latest release, so there is no upgrade to take.
//
// encodeHeaderValue() below does the encoding properly and hands denomailer
// a value it will pass through untouched. See the note on it for how, and
// the tests in src/domain/__tests__/mailEncoding.test.mjs, which import THIS
// FILE and decode what it produces rather than reading it.

// ── RFC 2047 header encoding ────────────────────────────────────────────

const encoder = new TextEncoder();

const b64 = (bytes: Uint8Array): string => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  // btoa in Deno, Buffer in Node — the tests run this in Node.
  return typeof btoa === 'function'
    ? btoa(bin)
    // deno-lint-ignore no-explicit-any
    : (globalThis as any).Buffer.from(bin, 'binary').toString('base64');
};

// An encoded-word may be at most 75 characters INCLUDING `=?utf-8?B?` and
// `?=`, so the base64 payload has 63 to work with. Base64 comes in fours,
// and 52 characters carry 39 bytes — that leaves the first line
// (`Subject: ` + word) at 73, inside the 78 RFC 5322 asks for.
const BYTES_PER_WORD = 39;

/**
 * A header value that survives being written verbatim.
 *
 * Two things have to be true at once, and the second is what makes this
 * look odd:
 *
 *   1. Non-ASCII text must be RFC 2047 encoded-words, each at most 75
 *      characters, split on CHARACTER boundaries — an encoded-word may not
 *      contain a partial character — and continued with CRLF + a space,
 *      which is the only newline a header may contain.
 *
 *   2. denomailer must leave it alone. It re-encodes anything that either
 *      contains non-ASCII or STARTS WITH `=?`, and its encoder is the one
 *      that produced the broken mail. Encoded-words are pure ASCII, so the
 *      first test passes; the leading space is what fails the second. A
 *      header value may begin with whitespace and every reader strips it.
 *
 * Pure ASCII is returned untouched — denomailer would pass it through
 * anyway, and an unnecessary encoded-word only makes a subject harder to
 * read in a client that does not decode it.
 */
export function encodeHeaderValue(text: string): string {
  // Newlines are stripped rather than encoded. A header value cannot carry
  // one, and a subject arriving with a stray newline would otherwise let
  // whoever wrote the notification row add headers of their own.
  const value = String(text ?? '').replace(/[\r\n]+/g, ' ').trim();

  // Printable ASCII needs no encoded-word, and denomailer passes it through
  // untouched. An unnecessary one only makes the subject unreadable in a
  // client that does not decode.
  if (/^[ -~]*$/.test(value)) return value;

  const words: string[] = [];
  let chunk: string[] = [];
  let bytes = 0;
  for (const ch of value) {
    const size = encoder.encode(ch).length;
    if (bytes + size > BYTES_PER_WORD && chunk.length > 0) {
      words.push(`=?utf-8?B?${b64(encoder.encode(chunk.join('')))}?=`);
      chunk = [];
      bytes = 0;
    }
    chunk.push(ch);
    bytes += size;
  }
  if (chunk.length > 0) words.push(`=?utf-8?B?${b64(encoder.encode(chunk.join('')))}?=`);

  // CRLF + space is a fold; CRLF alone would end the header, which is the
  // whole bug this replaces.
  return ` ${words.join('\r\n ')}`;
}

/**
 * UTF-8 → base64, folded at 76 columns per MIME.
 *
 * Exists because of a bug seen in production on 2026-08-04: plain-text
 * bodies were folded by SMTP at a byte boundary, and a byte boundary is not
 * a character boundary in Korean — "포함" arrived as "d??함". Base64 makes
 * the body binary-safe; no fold can land inside a character again.
 *
 * The body was never the part that broke on 2026-09-01 — this worked, and
 * the base64 in that unreadable mail decoded cleanly.
 */
export function base64Body(text: string): string {
  return b64(encoder.encode(text)).replace(/(.{76})/g, '$1\r\n');
}

// ── delivery ────────────────────────────────────────────────────────────

type Row = {
  id: string;
  recipient: string;
  subject: string;
  body: string;
};

async function sendViaResend(row: Row, key: string) {
  // Resend takes fields, not a message, and does its own header encoding —
  // so the subject goes as-is here. Passing the encoded form would show the
  // reader `=?utf-8?B?…?=` in their inbox.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('MAIL_FROM') ?? 'Eatple <onboarding@resend.dev>',
      to: [row.recipient],
      subject: row.subject,
      text: row.body,
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
}

async function sendViaGmail(row: Row, user: string, pass: string) {
  const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');
  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: user, password: pass },
    },
  });
  try {
    await client.send({
      // ASCII display name on purpose: denomailer writes `From: ${name}
      // <${mail}>` and runs the name through the same broken encoder. A
      // Korean name here would break the From header the way the subject
      // broke. It also fixes the `From:  <addr>` double space, which was
      // an empty name.
      from: `Eatple <${user}>`,
      to: row.recipient,
      subject: encodeHeaderValue(row.subject),
      mimeContent: [{
        mimeType: 'text/plain; charset="utf-8"',
        content: base64Body(row.body),
        transferEncoding: 'base64',
      }],
    });
  } finally {
    await client.close();
  }
}

export async function handle(): Promise<Response> {
  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, recipient, subject, body')
    .is('sent_at', null)
    .order('created_at')
    .limit(20);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!resendKey && !(gmailUser && gmailPass)) {
    // Not an error: the outbox holding mail until the team configures a
    // sender is the designed state, and saying so beats a stack trace.
    return Response.json({ sent: 0, waiting: rows?.length ?? 0, note: 'no sender configured' });
  }

  let sent = 0;
  const failures: string[] = [];
  for (const row of (rows ?? []) as Row[]) {
    try {
      if (resendKey) await sendViaResend(row, resendKey);
      else await sendViaGmail(row, gmailUser!, gmailPass!);
      await supabase.from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', row.id);
      sent += 1;
    } catch (e) {
      // Leave the row unsent; the next nudge retries it. One bad address
      // must not dam the queue behind it, so the loop continues.
      failures.push(`${row.id}: ${(e as Error).message}`);
    }
  }
  // `to` is the count, never the addresses — this response is readable by
  // anyone who can call the function, and JWT verification is off.
  return Response.json({ sent, failed: failures.length, failures: failures.slice(0, 3) });
}

// Guarded so the encoders above can be imported and run by a test. Node
// imports this file directly; without the guard, importing it would try to
// start a server.
// deno-lint-ignore no-explicit-any
if (typeof (globalThis as any).Deno !== 'undefined') {
  Deno.serve(handle);
}
