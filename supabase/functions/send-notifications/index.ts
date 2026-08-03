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

import { createClient } from 'npm:@supabase/supabase-js@2';

type Row = {
  id: string;
  recipient: string;
  subject: string;
  body: string;
};

async function sendViaResend(row: Row, key: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('MAIL_FROM') ?? 'bapchingu <onboarding@resend.dev>',
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
      from: user,
      to: row.recipient,
      subject: row.subject,
      content: row.body,
    });
  } finally {
    await client.close();
  }
}

Deno.serve(async () => {
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
  return Response.json({ sent, failed: failures.length, failures: failures.slice(0, 3) });
});
