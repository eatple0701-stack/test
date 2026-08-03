import React, { useMemo, useRef, useState } from 'react';
import {
  signUpMember, signInMember, signInWithGoogle, saveMemberDetails, saveAvatar,
} from '../data/tableRepository.js';
import { validateSignup, gateText } from '../domain/policy/access.js';
import { XIcon, ChevronLeftIcon } from './Icons';
// Shared with the meal photos on a table page — one canvas, two sets of
// rules, so quality and bugs cannot drift apart between them.
import { downscale, AVATAR } from '../data/image.js';
import ProfileFields from './ProfileFields';

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

export default function AuthSheet({ door, initialMode, profile, onProfileChange, onClose, onAuthed }) {
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
  const fileRef = useRef(null);

  const gate = door ? gateText(door) : null;
  const problems = useMemo(
    () => validateSignup({ email, password, name, phone, birthdate }),
    [email, password, name, phone, birthdate],
  );

  const finish = async () => {
    onAuthed?.();
    onClose?.();
  };

  const submitSignup = async () => {
    setSubmitted(true);
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
      setError(e.message);
    }
    setBusy(false);
  };

  const submitSignin = async () => {
    setError(null);
    if (busy) return;
    setBusy(true);
    try {
      await signInMember({ email, password });
      await finish();
    } catch (e) {
      setError(e.message);
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
      setError(e.message);
    }
  };

  const submitDetails = async () => {
    setError(null);
    if (busy) return;
    if (!phone.trim() || !birthdate) {
      setError('The team needs a phone number and a date of birth to run matching.');
      return;
    }
    setBusy(true);
    try {
      await saveMemberDetails({ phone, birthdate });
      setMode('profile');
    } catch (e) {
      setError(e.message);
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
      setError(e.message);
      setBusy(false);
    }
  };

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
            <h2 className="auth-title">{gate ? gate.title : '회원가입'}</h2>
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
            {error && <p className="auth-error">{error}</p>}
            <p className="auth-foot">
              이미 계정이 있으신가요?
              <button className="auth-foot__link" onClick={() => { setMode('signin'); setError(null); }}>
                로그인
              </button>
            </p>
          </div>
        )}

        {mode === 'signup-email' && (
          <div className="auth-form">
            <h2 className="auth-title">가입을 완료해 주세요</h2>

            <label className="field">
              <span className="field__label">이메일 · Email — this is your login ID</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            <label className="field">
              <span className="field__label">비밀번호 · Password</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ characters" autoComplete="new-password" />
            </label>
            <label className="field">
              <span className="field__label">이름 · Name — what a table calls you</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Aya" autoComplete="name" />
            </label>
            <label className="field">
              <span className="field__label">전화번호 · Phone</span>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+82 10-0000-0000" autoComplete="tel" />
            </label>
            <label className="field">
              <span className="field__label">생년월일 · Date of birth</span>
              <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
            </label>
            <p className="auth-note">
              No code is sent to your email or phone — they are contact details for the team
              running the pilot, seen by nobody else at any table. Type them carefully;
              nothing checks them for you.
            </p>
            {submitted && problems.length > 0 && (
              <ul className="auth-problems">{problems.map(p => <li key={p}>{p}</li>)}</ul>
            )}
            {error && <p className="auth-error">{error}</p>}
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
            <h2 className="auth-title">로그인</h2>
            <button className="auth-google" onClick={google} translate="no">
              Google로 계속 · Continue with Google
            </button>
            <p className="auth-or"><span>또는 · or</span></p>
            <label className="field">
              <span className="field__label">이메일 · Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="field">
              <span className="field__label">비밀번호 · Password</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
            {error && <p className="auth-error">{error}</p>}
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
            {error && <p className="auth-error">{error}</p>}
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
            {error && <p className="auth-error">{error}</p>}
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
