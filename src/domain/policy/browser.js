// Which browser is holding the app, and what that costs the traveller.
//
// This app is shared by link. The link is pasted into KakaoTalk, and in Korea
// that means most first visits happen inside KakaoTalk's in-app browser
// rather than Safari or Chrome. That browser is not a lesser Safari — it is a
// WebView with things switched off, and two of them matter here:
//
//   1. A downloaded file is previewed, not handed to the OS. Pressing
//      캘린더에 추가 shows iOS's file preview with no Add button, so the event
//      is never saved. Reported from a real phone on 2026-08-04.
//   2. "Add to home screen" does not exist, so the manifest and the service
//      worker never come into play for anybody who stays inside the chat app.
//
// Neither is a bug we can fix in the WebView. What we can do is stop pretending
// it is not happening: offer the path that does work, and say plainly that
// the other one needs a real browser.
//
// Detection is by user agent, which is guesswork by nature — vendors change
// these strings and some in-app browsers deliberately look like Safari. So the
// rule everywhere this is used: never *remove* a capability because of what
// this returns. Only ever add a hint or an alternative. A false positive then
// costs somebody one extra line of text, and a false negative leaves them
// exactly where they are today.

/** The in-app browsers common on a Korean traveller's phone, plus the global ones. */
const IN_APP = [
  { id: 'kakaotalk', match: /KAKAOTALK/i, kr: '카카오톡', en: 'KakaoTalk' },
  { id: 'naver', match: /NAVER\(inapp|\bNAVER\b.*\bSearch\b/i, kr: '네이버 앱', en: 'the Naver app' },
  { id: 'line', match: /\bLine\/[\d.]/i, kr: '라인', en: 'LINE' },
  { id: 'instagram', match: /Instagram/i, kr: '인스타그램', en: 'Instagram' },
  { id: 'facebook', match: /FBAN|FBAV|FB_IAB/i, kr: '페이스북', en: 'Facebook' },
  { id: 'wechat', match: /MicroMessenger/i, kr: '위챗', en: 'WeChat' },
];

/**
 * The in-app browser holding this page, or null for a real browser.
 *
 * Returns the whole entry rather than a boolean so a screen can name the app
 * a person is actually looking at — "카카오톡에서는" reads as a fact about
 * their situation, where "in-app browser" reads as jargon about ours.
 */
export function inAppBrowser(userAgent) {
  const ua = String(userAgent ?? '');
  if (!ua) return null;
  const hit = IN_APP.find(b => b.match.test(ua));
  return hit ? { id: hit.id, kr: hit.kr, en: hit.en } : null;
}

/** Convenience for the common case. */
export const isInAppBrowser = (userAgent) => inAppBrowser(userAgent) !== null;

/**
 * What to tell somebody whose download will not land, or null when nothing
 * needs saying.
 *
 * Deliberately not a warning. Nothing has gone wrong yet, and the link they
 * followed to get here was the right one — this only exists because the file
 * button beside it may quietly do nothing.
 */
export function downloadNotice(userAgent) {
  const app = inAppBrowser(userAgent);
  if (!app) return null;
  return {
    kr: `${app.kr}에서는 파일이 캘린더로 넘어가지 않을 수 있어요.`,
    en: `${app.en}'s built-in browser often previews the file instead of adding it. Use the Google Calendar button, or open this page in Safari or Chrome.`,
    es: `El navegador integrado de ${app.en} suele mostrar el archivo en vez de añadirlo. Usa el botón de Google Calendar, o abre esta página en Safari o Chrome.`,
    fr: `Le navigateur intégré de ${app.en} affiche souvent le fichier au lieu de l'ajouter. Utilisez le bouton Google Agenda, ou ouvrez cette page dans Safari ou Chrome.`,
    ar: `متصفّح ${app.en} المدمج يعرض الملف غالبًا بدل إضافته. استخدم زرّ تقويم Google، أو افتح هذه الصفحة في Safari أو Chrome.`,
    zh: `${app.en} 自带的浏览器常常只是预览文件，而不是把它加进日历。用 Google 日历那个按钮，或者在 Safari、Chrome 里打开这个页面。`,
    ja: `${app.en} の内蔵ブラウザはファイルを追加せず表示するだけのことが多いです。Google カレンダーのボタンを使うか、この画面を Safari か Chrome で開いてください。`,
  };
}
