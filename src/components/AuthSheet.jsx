import React, { useMemo, useRef, useState } from 'react';
import {
  signUpMember, signInMember, signInWithGoogle, saveMemberDetails, saveAvatar,
} from '../data/tableRepository.js';
import { validateSignup, gateText } from '../domain/policy/access.js';
import { XIcon } from './Icons';

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
 * Shrink a chosen image to avatar size on a canvas.
 *
 * 256px is plenty for a face in a circle, uploads fast on venue wifi, and
 * keeps the localStorage backend (which stores the data URL itself) from
 * eating its quota. JPEG at 0.85 because photos are photos.
 */
function downscale(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      // Centre-crop to a square, because the app renders avatars round and a
      // stretched face helps nobody get recognised.
      ctx.drawImage(
        img,
        (img.width - side) / 2, (img.height - side) / 2, side, side,
        0, 0, 256, 256,
      );
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
    img.src = url;
  });
}

export default function AuthSheet({ door, initialMode, profile, onProfileChange, onClose, onAuthed }) {
  // 'choose' → 'signup' | 'signin' → ('details') → 'avatar' → done
  const [mode, setMode] = useState(initialMode ?? 'choose');
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
      setMode('avatar');
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
      setMode('avatar');
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
      const dataUrl = await downscale(file);
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

        {gate && mode !== 'avatar' && (
          <header className="auth-gate">
            <h2 className="auth-gate__title">{gate.title}</h2>
            <p className="auth-gate__body">{gate.body}</p>
          </header>
        )}

        {mode === 'choose' && (
          <div className="auth-choose">
            <button className="auth-primary" onClick={() => setMode('signup')}>
              가입하기 · Create an account
            </button>
            <button className="auth-secondary" onClick={() => setMode('signin')}>
              로그인 · I already have one
            </button>
            <button className="auth-google" onClick={google}>
              Google로 계속 · Continue with Google
            </button>
            {error && <p className="auth-error">{error}</p>}
          </div>
        )}

        {mode === 'signup' && (
          <div className="auth-form">
            <h2 className="form-label">가입 · Join 밥친구</h2>
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
            <button className="auth-primary" onClick={submitSignup} disabled={busy}>
              {busy ? 'Joining…' : '가입 · Join'}
            </button>
            <button className="auth-switch" onClick={() => { setMode('signin'); setError(null); }}>
              이미 계정이 있어요 · Sign in instead
            </button>
          </div>
        )}

        {mode === 'signin' && (
          <div className="auth-form">
            <h2 className="form-label">로그인 · Sign in</h2>
            <label className="field">
              <span className="field__label">이메일 · Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="field">
              <span className="field__label">비밀번호 · Password</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-primary" onClick={submitSignin} disabled={busy}>
              {busy ? 'Signing in…' : '로그인 · Sign in'}
            </button>
            <button className="auth-google" onClick={google}>
              Google로 계속 · Continue with Google
            </button>
            <button className="auth-switch" onClick={() => { setMode('signup'); setError(null); }}>
              처음이에요 · Create an account
            </button>
          </div>
        )}

        {mode === 'details' && (
          <div className="auth-form">
            {/* A Google account arrives with a name and an email and nothing
                else. The pilot's requirement is reachability, so the two
                missing pieces are asked once, here, before the door opens. */}
            <h2 className="form-label">거의 다 됐어요 · Almost there</h2>
            <p className="auth-note">
              Google gave us your name and email. The team also needs a phone number and a
              date of birth to run matching — nobody at a table ever sees either.
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
