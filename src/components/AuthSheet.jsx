import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  signUpMember, signInMember, signInWithGoogle, saveMemberDetails, saveAvatar,
} from '../data/tableRepository.js';
import {
  validateSignup, validateSignin, problemFields, gateText,
} from '../domain/policy/access.js';
import { authError, AUTH_ACTION } from '../domain/policy/authError.js';
import { XIcon, ChevronLeftIcon } from './Icons';
// Shared with the meal photos on a table page — one canvas, two sets of
// rules, so quality and bugs cannot drift apart between them.
import { downscale, AVATAR } from '../data/image.js';
import ProfileFields from './ProfileFields';
import { useText } from './localeText.js';

// The door between browsing and belonging.
//
// Opens in two moods. From a gate — somebody just pressed 자리 요청 without an
// account — it leads with why this particular door needs a name, in the gate's
// own words from AccessPolicy. From the front door it is a plain choice
// between joining and signing in, with no lecture attached.
//
// The signup order is the meeting's: email, phone, name, birthdate, then the
// photo as its own step. The photo is skippable and the details are not,
// because the details are the reason accounts exist at all — 매칭 시스템 관리
// — and a photo is a courtesy to the people trying to spot you at Exit 4.
//
// Nothing is verified. No code is sent to the email or the phone; they are
// contact information, collected as typed. The one honest consequence is
// written under the form rather than hidden: typos are yours to avoid,
// because nothing will catch them.

/**
 * A labelled box that says what is wrong with itself.
 *
 * The complaint sits under the box that caused it rather than in a list at the
 * bottom of the sheet, in both languages, because the labels above are in both
 * and an error that only speaks English is the app changing its mind about who
 * it is talking to at the worst possible moment.
 */
function Field({ id, label, bad, problems, markRef, children }) {
  const wrong = !!bad?.[id];
  const said = wrong ? problems.find(p => p.field === id) : null;
  return (
    <label className={`field${wrong ? ' is-bad' : ''}`} ref={markRef?.(id)}>
      <span className="field__label">{label}</span>
      {React.cloneElement(children, { 'aria-invalid': wrong || undefined })}
      {said && <span className="field__error">{said.kr} · {said.en}</span>}
    </label>
  );
}

export default function AuthSheet({ door, initialMode, profile, onProfileChange, onClose, onAuthed }) {
  const say = useText();
  // 'signup' → 'signup-email' ┐
  // 'signin' ─────────────────┴→ ('details') → 'profile' → 'avatar' → done
  //
  // Two doors, kept apart, each with the shape Meetup gives it (studied
  // 2026-08-04 at the user's direction): signing in shows its two fields
  // immediately, because the person already has a password in their head;
  // signing up shows Google and a single 이메일로 가입 line, because five
  // inputs on arrival is a wall, and the fields belong on the other side of
  // one deliberate tap. Each door links to the other at the bottom rather
  // than making anybody guess which modal they are in.
  const [mode, setMode] = useState(initialMode ?? 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [signinBad, setSigninBad] = useState({});
  const fileRef = useRef(null);

  const gate = door ? gateText(door) : null;
  const problems = useMemo(
    () => validateSignup({ email, password, name, phone, birthdate }),
    [email, password, name, phone, birthdate],
  );
  // Only after a press. Marking a box red the moment somebody tabs into it is
  // how a form calls you wrong for typing slowly.
  const bad = submitted ? problemFields(problems) : {};

  // Scroll to the first complaint, for the reason the create form scrolls to
  // one: this sheet is 849px inside a 721px window, so the list of problems
  // could sit below the fold of the very screen that printed it. Claimed on
  // each render, in DOM order, so "first" means first on screen.
  const firstBad = useRef(null);
  const claimed = useRef(false);
  claimed.current = false;
  const markRef = (key) => (node) => {
    if (!bad[key] || claimed.current || !node) return;
    claimed.current = true;
    firstBad.current = node;
  };
  useEffect(() => {
    if (attempt === 0) return;
    firstBad.current?.scrollIntoView({ block: 'center' });
  }, [attempt]);

  const finish = async () => {
    onAuthed?.();
    onClose?.();
  };

  const submitSignup = async () => {
    setSubmitted(true);
    setAttempt(n => n + 1);
    setError(null);
    if (problems.length > 0 || busy) return;
    setBusy(true);
    try {
      await signUpMember({ email, password, name, phone, birthdate });
      // The name typed here is the name tables will call you — one write, so
      // the seat form never has to ask again.
      onProfileChange?.({ ...profile, name: name.trim() });
      // Then the profile a table actually reads — languages, gender, what
      // you cannot eat — written as part of joining (8/4's structure), so
      // the Passport shows values from the first day instead of blanks.
      setMode('profile');
    } catch (e) {
      setError(authError(e));
    }
    setBusy(false);
  };

  const submitSignin = async () => {
    setError(null);
    if (busy) return;
    // Asked here rather than let through, because the backend's answer to an
    // empty form was `missing email or phone` — lowercase, English, and the
    // first thing this app ever said to somebody who mistyped nothing at all.
    const missing = validateSignin({ email, password });
    setSigninBad(problemFields(missing));
    if (missing.length > 0) return;
    setBusy(true);
    try {
      await signInMember({ email, password });
      await finish();
    } catch (e) {
      setError(authError(e));
    }
    setBusy(false);
  };

  const google = async () => {
    setError(null);
    try {
      // Redirects the whole page on success; only the failure to leave comes
      // back here — an unconfigured provider, or the device-only backend.
      await signInWithGoogle();
    } catch (e) {
      setError(authError(e));
    }
  };

  const submitDetails = async () => {
    setError(null);
    if (busy) return;
    if (!phone.trim() || !birthdate) {
      setError({
        kr: '매칭에 전화번호와 생년월일이 필요해요.',
        en: 'The team needs a phone number and a date of birth to run matching.',
      });
      return;
    }
    setBusy(true);
    try {
      await saveMemberDetails({ phone, birthdate });
      setMode('profile');
    } catch (e) {
      setError(authError(e));
    }
    setBusy(false);
  };

  const pickPhoto = async (file) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await downscale(file, AVATAR);
      const url = await saveAvatar(dataUrl);
      onProfileChange?.({ ...profile, avatarUrl: url });
      await finish();
    } catch (e) {
      setError(authError(e));
      setBusy(false);
    }
  };

  // One error line for all six steps, so a message can never appear in one
  // mood on one screen and another somewhere else. When the failure is really
  // "you are at the wrong door" it carries the door with it — an already
  // registered email is the commonest signup failure there is, and leaving
  // somebody to find 로그인 at the bottom of the sheet themselves is a
  // needless dead end.
  const errorLine = error && (
    <div className="auth-error" role="alert">
      <p className="auth-error__kr">{error.kr}</p>
      <p className="auth-error__en">{error.en}</p>
      {error.action === AUTH_ACTION.SIGNIN && (
        <button className="auth-error__go" onClick={() => { setMode('signin'); setError(null); }}>
          로그인하기 · Go to sign in
        </button>
      )}
      {error.action === AUTH_ACTION.SIGNUP && (
        <button className="auth-error__go" onClick={() => { setMode('signup'); setError(null); }}>
          회원가입하기 · Create an account
        </button>
      )}
    </div>
  );

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="auth-sheet">
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <XIcon size={18} />
        </button>

        {/* Back, on the steps that have somewhere to go back to. Meetup's
            signup form carries one in the same corner, and without it the
            only way out of a form somebody opened by mistake is closing the
            whole modal and starting again. */}
        {(mode === 'signup-email') && (
          <button className="auth-back" onClick={() => { setMode('signup'); setError(null); }} aria-label="Back">
            <ChevronLeftIcon size={20} />
          </button>
        )}

        {/* Signing up and signing in are two doors, not two tabs of one form.
            Meetup keeps them as separate modals with their own titles, and
            the reason shows on the screen: a person who came to sign in
            should never be looking at a phone-number field. */}
        {mode === 'signup' && (
          <div className="auth-choose">
            {/* Both halves of the heading, and the reason under it. The gate's
                body was written to be read here — an invitation with the
                browsing reassurance in it — and for a while it was not
                rendered anywhere, leaving one Korean sentence in front of a
                traveller who does not read Korean. */}
            <h2 className="auth-title">
              <span className="auth-title__kr">{gate ? gate.titleKr : '회원가입'}</span>
              <span className="auth-title__en">{gate ? gate.titleEn : 'Join 밥친구'}</span>
            </h2>
            {gate && <p className="auth-gate__body">{say(gate.body, gate.bodyKo)}</p>}
            <button className="auth-google" onClick={google} translate="no">
              Google로 계속 · Continue with Google
            </button>
            <p className="auth-or"><span>또는 · or</span></p>
            {/* The email path is a step, not a wall of fields. Five inputs
                on arrival is what the 8/4 review called 존나 불편 — and it is
                also what Meetup avoids by putting one line here instead. */}
            <button className="auth-email-link" onClick={() => setMode('signup-email')} translate="no">
              이메일로 가입 · Sign up with email
            </button>
            {errorLine}
            <p className="auth-foot">
              <span className="auth-foot__ask">이미 계정이 있으신가요? · Already have an account?</span>
              <button className="auth-foot__link" onClick={() => { setMode('signin'); setError(null); }}>
                로그인 · Sign in
              </button>
            </p>
          </div>
        )}

        {mode === 'signup-email' && (
          <div className="auth-form">
            <h2 className="auth-title">
              <span className="auth-title__kr">가입을 완료해 주세요</span>
              <span className="auth-title__en">Finish signing up</span>
            </h2>

            <Field id="email" bad={bad} problems={problems} markRef={markRef}
              label="이메일 · Email — this is your login ID">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </Field>
            <Field id="password" bad={bad} problems={problems} markRef={markRef}
              label="비밀번호 · Password">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ characters" autoComplete="new-password" />
            </Field>
            <Field id="name" bad={bad} problems={problems} markRef={markRef}
              label="이름 · Name — what a table calls you">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Aya" autoComplete="name" />
            </Field>
            <Field id="phone" bad={bad} problems={problems} markRef={markRef}
              label="전화번호 · Phone">
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+82 10-0000-0000" autoComplete="tel" />
            </Field>
            <Field id="birthdate" bad={bad} problems={problems} markRef={markRef}
              label="생년월일 · Date of birth">
              <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
            </Field>
            <p className="auth-note">
              No code is sent to your email or phone — they are contact details for the team
              running the pilot, seen by nobody else at any table. Type them carefully;
              nothing checks them for you.
            </p>
            {errorLine}
            <button className="auth-primary" onClick={submitSignup} disabled={busy} translate="no">
              {busy ? 'Joining…' : '가입 · Join'}
            </button>
          </div>
        )}

        {/* Its own door, with its own two fields. Unlike signup, the email
            form is right here rather than a step away — Meetup does the same
            asymmetry, and it is the correct one: somebody signing in has a
            password in their head right now, while somebody signing up is
            deciding whether to spend two minutes. */}
        {mode === 'signin' && (
          <div className="auth-form">
            <h2 className="auth-title">
              <span className="auth-title__kr">로그인</span>
              <span className="auth-title__en">Sign in</span>
            </h2>
            <button className="auth-google" onClick={google} translate="no">
              Google로 계속 · Continue with Google
            </button>
            <p className="auth-or"><span>또는 · or</span></p>
            <Field id="email" bad={signinBad} problems={validateSignin({ email, password })}
              label="이메일 · Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field id="password" bad={signinBad} problems={validateSignin({ email, password })}
              label="비밀번호 · Password">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            {errorLine}
            <button className="auth-primary" onClick={submitSignin} disabled={busy} translate="no">
              {busy ? 'Signing in…' : '로그인 · Sign in'}
            </button>
            <p className="auth-foot">
              아직 계정이 없으신가요?
              <button className="auth-foot__link" onClick={() => { setMode('signup'); setError(null); }}>
                회원가입
              </button>
            </p>
          </div>
        )}

        {mode === 'details' && (
          <div className="auth-form">
            {/* Whoever arrives missing contact details — a Google account by
                nature, or a signup the first deploy cut in half — is asked
                once, here, before the doors open. */}
            <h2 className="form-label">거의 다 됐어요 · Almost there</h2>
            <p className="auth-note">
              Your account exists but two details are missing — Google sign-ins arrive without them, and an interrupted signup can too. The team needs a phone number and a
              date of birth to run matching; nobody at a table ever sees either.
            </p>
            <label className="field">
              <span className="field__label">전화번호 · Phone</span>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+82 10-0000-0000" autoComplete="tel" />
            </label>
            <label className="field">
              <span className="field__label">생년월일 · Date of birth</span>
              <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
            </label>
            {errorLine}
            <button className="auth-primary" onClick={submitDetails} disabled={busy}>
              {busy ? 'Saving…' : '저장하고 계속 · Save and continue'}
            </button>
          </div>
        )}

        {mode === 'profile' && (
          <div className="auth-form">
            {/* The fields every table reads, filled while joining — the 8/4
                structure. Saved on every tap through onProfileChange exactly
                as they are when edited later on the Passport, so skipping
                ahead loses nothing that was already touched. */}
            <h2 className="form-label">프로필 · Your profile</h2>
            <p className="auth-note">
              This is what a table sees and what the app cooks with — languages, what you
              cannot eat, how you eat. Change any of it later on your Passport.
            </p>
            <ProfileFields profile={profile} onProfileChange={onProfileChange} />
            <button className="auth-primary" onClick={() => setMode('avatar')}>
              계속 · Continue
            </button>
          </div>
        )}

        {mode === 'avatar' && (
          <div className="auth-form auth-avatar">
            <h2 className="form-label">프로필 사진 · A photo to be recognised by</h2>
            <p className="auth-note">
              This is how a table spots you at the station exit — the app has no chat, so a
              face does real work here. Square-cropped, shrunk small, shown beside your name.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => pickPhoto(e.target.files?.[0])}
            />
            {errorLine}
            <button className="auth-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? 'Uploading…' : '사진 고르기 · Choose a photo'}
            </button>
            <button className="auth-switch" onClick={finish} disabled={busy}>
              나중에 · Later — you can add one any time
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
