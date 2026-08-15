import React, { useState } from 'react';
import { getStoredTheme, setTheme } from '../data/theme.js';
import { isMember } from '../domain/policy/access.js';
import { deleteAccount } from '../data/tableRepository.js';
import { authError } from '../domain/policy/authError.js';
import { LOCALES, LOCALE_LABEL } from '../domain/policy/locale.js';
import { useText } from './localeText.js';

// The fifth tab (2026-08-04). Appearance lived inside the profile form,
// which put a device preference in the middle of fields a host actually
// reads — the user's call was to give it its own place in the bar instead.
//
// Two choices, not three. The old System/Light/Dark trio made somebody who
// had never thought about it pick between abstractions; 디폴트 is simply how
// the app looks, 다크 is the night version, and that is the entire decision.
// Choosing 디폴트 pins light rather than re-following the OS, because a
// person who tapped a button expects the button to win over a sensor.
const CHOICES = [
  { id: 'light', kr: '디폴트', en: 'Default' },
  { id: 'dark', kr: '다크', en: 'Dark' },
];

export default function SettingsTab({ auth, onSignedOut, onSignOut, locale, onLocaleChange }) {
  const say = useText();
  const [theme, setThemeState] = useState(getStoredTheme);
  // Anything that is not explicitly dark reads as 디폴트 — including the
  // 'system' value older devices stored back when three choices existed.
  const active = theme === 'dark' ? 'dark' : 'light';
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const close = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      onSignedOut?.();
    } catch (e) {
      setError(authError(e));
      setBusy(false);
    }
  };

  return (
    <section className="journal-panel settings-tab" aria-label="Settings">
      <header className="screen-head screen-head--dark">
        <span className="screen-head__kr" translate="no">설정</span>
        <h1 className="screen-head__title">Settings</h1>
        <p className="screen-head__sub">{say('How the app looks on this device.', '이 기기에서 앱이 보이는 방식.', 'Cómo se ve la app en este dispositivo.', "À quoi ressemble l'application sur cet appareil.", 'كيف يبدو التطبيق على هذا الجهاز.', '这个应用在这台设备上是什么样子。', 'この端末でアプリがどう見えるか。')}</p>
      </header>

      {/* The language of the interface. data-no-locale on the whole block:
          this is the one control somebody reaches for *because* the app is
          in a language they cannot read, so it has to stay bilingual no
          matter what it is set to. LocaleFilter honours that attribute. */}
      <div className="journal-settings" data-no-locale>
        <div className="journal-section-header">
          <h3>언어 · Language</h3>
        </div>
        <p className="journal-settings__hint">
          한국어와 영어를 함께 보거나, 하나만 보이게 할 수 있어요. 스페인어,
          프랑스어, 아랍어, 중국어도 됩니다. Korean and English together, one of
          them on its own, Spanish, French, Arabic, or Chinese. Stays on
          this device.
        </p>
        <div className="chip-row">
          {LOCALES.map(l => (
            <button
              key={l}
              className={`chip${locale === l ? ' active' : ''}`}
              aria-pressed={locale === l}
              onClick={() => onLocaleChange?.(l)}
            >
              <span className="chip__native" translate="no">{LOCALE_LABEL[l].kr}</span>
              <span className="chip__en">{LOCALE_LABEL[l].en}</span>
            </button>
          ))}
        </div>
        {/* This used to say Español was not offered, because offering it
            and serving English would have been the app claiming a
            translation nobody wrote. The translation exists now — the
            articles, the dishes, the places — so the note says what is
            still true instead: a few corners fall back to English rather
            than to a blank. */}
        <p className="journal-settings__hint settings-lang__note">
          스페인어·프랑스어·아랍어·중국어는 본문·요리·장소까지 전부 번역되어
          있고, 아랍어는 화면 방향까지 오른쪽에서 왼쪽으로 바뀝니다. 번역이 없는
          자리는 빈칸 대신 영어로 나옵니다.
          Spanish, French, Arabic and Chinese cover the articles, the dishes
          and the places; Arabic also lays the screen out right to left.
          Anything without a translation falls back to English rather than
          to a blank.
        </p>
      </div>

      <div className="journal-settings">
        <div className="journal-section-header">
          <h3>{say('화면 모드 · Appearance', '화면 모드', 'Apariencia', 'Apparence', 'المظهر', '外观', '画面の見え方')}</h3>
        </div>
        <p className="journal-settings__hint">
          {say('Stays on this device — it changes your screen and nobody else\u2019s.',
            '이 기기에만 저장됩니다 — 당신 화면만 바뀌고 다른 사람 것은 그대로예요.',
            'Se queda en este dispositivo: cambia tu pantalla y la de nadie más.', "Reste sur cet appareil : cela change votre écran et celui de personne d'autre.", 'يبقى على هذا الجهاز: يغيّر شاشتك أنت لا شاشة أحد غيرك.', '只留在这台设备上：它改的是你的屏幕，不是别人的。', 'この端末にとどまります。変わるのはあなたの画面だけで、ほかの誰の画面でもありません。')}
        </p>
        <div className="chip-row">
          {CHOICES.map(c => (
            <button
              key={c.id}
              className={`chip${active === c.id ? ' active' : ''}`}
              aria-pressed={active === c.id}
              onClick={() => setThemeState(setTheme(c.id))}
            >
              {c.kr} · {c.en}
            </button>
          ))}
        </div>
      </div>

      {/* The door out. Only a member has one to walk through, and it lives
          here rather than on the Passport because the Passport is a record
          somebody keeps — putting "delete everything" beside it invites the
          tap nobody meant to make. Quiet by default, specific when opened:
          the confirmation names what actually disappears, including the part
          people do not expect (their lines on other people's tables). */}
      {isMember(auth) && (
        <div className="journal-settings danger-zone">
          <div className="journal-section-header">
            <h3>{say('계정 · Your account', '계정', 'Tu cuenta', 'Votre compte', 'حسابك', '你的账号', 'あなたのアカウント')}</h3>
          </div>
          {!confirming ? (
            <>
              {/* Signing out belongs here, above the door that cannot be
                  reopened. Measured 2026-08-04: this tab offered exactly one
                  account action — 회원 탈퇴 — while 로그아웃 was 15px tall and
                  813px down the Passport. Settings is where a person looks to
                  sign out of a borrowed phone, and the only button they found
                  here deleted the account. The reversible action goes first,
                  in the ordinary weight; the permanent one keeps its own
                  colour and its confirmation. */}
              <p className="journal-settings__hint">
                {say('Signing out leaves everything where it is — your Passport, your seats, the tables you host.',
                  '로그아웃해도 계정과 기록은 그대로 있어요. 여권도, 잡아 둔 자리도, 차린 밥상도요.',
                  'Cerrar sesión deja todo donde está: tu Pasaporte, tus sitios y las mesas que organizas.', 'Se déconnecter laisse tout en place : votre Passeport, vos places, les tables que vous organisez.', 'تسجيل الخروج يترك كل شيء في مكانه: جواز سفرك ومقاعدك والموائد التي تستضيفها.', '退出登录不会动任何东西：你的护照、你的位子、你主持的饭桌都在。', 'ログアウトしても何も動きません。パスポートも、席も、あなたがホストの食卓もそのままです。')}
              </p>
              <button className="settings-signout" translate="no" onClick={onSignOut}>
                {say('로그아웃 · Sign out', '로그아웃', 'Cerrar sesión', 'Se déconnecter', 'تسجيل الخروج', '退出登录', 'ログアウト')}
              </button>
              <p className="journal-settings__hint danger-zone__hint">
                {say('Closing your account is different: it removes everything you gave us — your name, email, phone and date of birth — and everything you made here.',
                  '회원 탈퇴는 다릅니다. 주신 것 전부 — 이름, 이메일, 전화번호, 생년월일 — 과 여기서 만드신 것 전부가 사라집니다.',
                  'Cerrar la cuenta es otra cosa: borra todo lo que nos diste — nombre, correo, teléfono y fecha de nacimiento — y todo lo que has creado aquí.', 'Fermer votre compte est autre chose : cela supprime tout ce que vous nous avez donné — nom, e-mail, téléphone et date de naissance — et tout ce que vous avez créé ici.', 'إغلاق حسابك أمر آخر: يحذف كل ما أعطيتنا — الاسم والبريد والهاتف وتاريخ الميلاد — وكل ما صنعته هنا.', '注销账号是另一回事：它会删掉你给我们的一切——名字、邮箱、手机号和出生日期——以及你在这里做过的一切。', 'アカウントを閉じるのは別のことです。いただいたもの——名前、メール、電話番号、生年月日——と、ここでつくったものをすべて消します。')}
              </p>
              <button className="danger-open" translate="no" onClick={() => setConfirming(true)}>
                {say('회원 탈퇴 · Close my account', '회원 탈퇴', 'Cerrar mi cuenta', 'Fermer mon compte', 'أغلِق حسابي', '注销我的账号', 'アカウントを閉じる')}
              </button>
            </>
          ) : (
            <div className="cancel-confirm">
              <p className="cancel-confirm__title">{say('계정을 지울까요? · Close this account?', '계정을 지울까요?', '¿Cerrar esta cuenta?', 'Fermer ce compte ?', 'أتغلق هذا الحساب؟', '要注销这个账号吗？', 'このアカウントを閉じますか？')}</p>
              <p className="cancel-confirm__body">
                {say('Gone for good, right away: your contact details, your Passport, any tables you host and the seats you hold — people going to them will see the table disappear. The lines you left on other people\u2019s tables go too. This cannot be undone, and signing up again starts an empty account.',
                  '즉시, 영구히 사라집니다. 연락처, 여권, 차리신 밥상과 잡아 두신 자리까지 — 그 밥상에 가려던 사람들에게는 밥상이 없어진 것으로 보입니다. 다른 사람 밥상에 남기신 한 줄도 함께 사라집니다. 되돌릴 수 없고, 다시 가입하시면 빈 계정으로 시작합니다.',
                  'Desaparece para siempre y al instante: tus datos de contacto, tu Pasaporte, las mesas que organizas y los sitios que ocupas — quien iba a ellas verá que la mesa desaparece. Las líneas que dejaste en mesas de otros también se van. No se puede deshacer, y registrarse de nuevo empieza una cuenta vacía.', "Perdu pour de bon, immédiatement : vos coordonnées, votre Passeport, les tables que vous organisez et les places que vous occupez — ceux qui devaient y aller verront la table disparaître. Les lignes que vous avez laissées sur les tables des autres partent aussi. C'est irréversible, et se réinscrire ouvre un compte vide.", 'يزول نهائيًّا وفورًا: بيانات تواصلك، وجواز سفرك، والموائد التي تستضيفها والمقاعد التي تشغلها — وسيرى من كانوا ذاهبين إليها أن المائدة اختفت. وتذهب معها السطور التي تركتها على موائد الآخرين. لا يمكن التراجع عن هذا، والتسجيل من جديد يبدأ حسابًا فارغًا.', '立刻永久消失：你的联系方式、你的护照、你主持的饭桌和你占着的位子——本来要去的人会看到那张饭桌不见了。你留在别人饭桌上的那些话也一起走。这件事无法撤销，重新注册开始的是一个空账号。', 'すぐに、そして完全に消えます：連絡先、パスポート、あなたがホストの食卓と押さえている席——行く予定だった人には食卓が消えたように見えます。ほかの人の食卓に残した言葉も一緒に消えます。取り消せませんし、登録し直しても空のアカウントから始まります。')}
              </p>
              {error && (
                <div className="auth-error" role="alert">
                  <p className="auth-error__kr">{error.kr}</p>
                  <p className="auth-error__en">{error.en}</p>
                </div>
              )}
              <div className="cancel-confirm__row">
                <button className="cancel-confirm__no" onClick={() => setConfirming(false)} disabled={busy}>
                  {say('그냥 둘게요 · Keep it', '그냥 둘게요', 'Dejarla', 'La garder', 'أبقِه', '留着', 'そのままにする')}
                </button>
                <button className="cancel-confirm__yes" onClick={close} disabled={busy}>
                  {busy
                    ? say('Closing…', '탈퇴하는 중…', 'Cerrando…', 'Fermeture…', 'جارٍ الإغلاق…', '正在注销…', '退会しています…')
                    : say('Close it', '탈퇴', 'Cerrarla', 'Le fermer', 'أغلقه', '注销', '退会する')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
