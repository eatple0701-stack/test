// delete-account — the door out.
//
// Once an app holds a phone number and a date of birth, leaving has to be as
// available as joining. No client can do this: deleting a row in auth.users
// needs the service role, and handing that key to a browser would let anybody
// delete anybody. So the deletion happens here, where the key stays on the
// server, and the caller proves who they are with their own session token.
//
// What goes: the auth user, and through `on delete cascade` from profiles —
// contact details, tables they hosted, seats they took, reviews they wrote,
// reports they filed. Nothing of theirs is kept.
//
// What stays, said plainly because it is the honest part: reviews and seats
// are removed with the account, so a table somebody else hosted will lose the
// line this person wrote about it. That is the correct trade — the words were
// theirs — and it is why the confirmation in the app spells it out.
//
// Deploy: Edge Functions → Deploy a new function → name it exactly
// `delete-account`, file `index.ts`, paste this. Leave "Verify JWT" ON or
// OFF, either works — this function does its own check, and it is deliberately
// stricter than the toggle: it requires a real user token in the
// Authorization header and refuses anonymous sessions.

import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return Response.json({ error: 'Sign in first.' }, { status: 401, headers: cors });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Whose token is this? Asked of the auth server rather than trusted from
  // the request body — the body is whatever the caller typed, the token is
  // what the caller can prove.
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) {
    return Response.json({ error: 'That session is not valid.' }, { status: 401, headers: cors });
  }
  // An anonymous session has nothing to delete and no account to close;
  // letting one through would only be a way to burn other people's rows if a
  // token were ever mixed up.
  if (user.is_anonymous) {
    return Response.json({ error: 'No account to close.' }, { status: 400, headers: cors });
  }

  const { error: delError } = await admin.auth.admin.deleteUser(user.id);
  if (delError) {
    return Response.json({ error: delError.message }, { status: 500, headers: cors });
  }
  return Response.json({ deleted: true }, { headers: cors });
});
