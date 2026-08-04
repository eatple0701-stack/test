import test from 'node:test';
import assert from 'node:assert/strict';
import { inAppBrowser, isInAppBrowser, downloadNotice } from '../policy/browser.js';

// Real user-agent strings. KakaoTalk's is the one that matters most: this app
// is shared by link and in Korea that link is pasted into a KakaoTalk chat.
const KAKAO_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.5.0';
const KAKAO_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 KAKAOTALK';
const SAFARI_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 331.0.0.37.90';

test('KakaoTalk is recognised on both phones', () => {
  assert.equal(inAppBrowser(KAKAO_IOS).id, 'kakaotalk');
  assert.equal(inAppBrowser(KAKAO_ANDROID).id, 'kakaotalk');
});

test('a real browser is not mistaken for an in-app one', () => {
  // KakaoTalk's Android string contains "Chrome" and "Safari" in full, so a
  // naive check for the absence of those would flag every real browser too.
  assert.equal(inAppBrowser(SAFARI_IOS), null);
  assert.equal(inAppBrowser(CHROME_ANDROID), null);
  assert.equal(isInAppBrowser(SAFARI_IOS), false);
});

test('the other apps a link gets pasted into are covered', () => {
  assert.equal(inAppBrowser(INSTAGRAM).id, 'instagram');
  assert.equal(inAppBrowser('… FBAN/FBIOS …').id, 'facebook');
  assert.equal(inAppBrowser('… MicroMessenger/8.0 …').id, 'wechat');
});

test('the notice names the app the person is looking at', () => {
  const notice = downloadNotice(KAKAO_IOS);
  assert.match(notice.kr, /카카오톡/);
  assert.match(notice.en, /KakaoTalk/);
  // Both languages, like every other message in this app.
  assert.match(notice.kr, /[가-힣]/);
  assert.ok(notice.en.trim().length > 0);
});

test('the notice points somewhere that works, not just at the problem', () => {
  const notice = downloadNotice(KAKAO_IOS);
  assert.match(notice.en, /Google Calendar|Safari|Chrome/);
});

test('a real browser is told nothing', () => {
  assert.equal(downloadNotice(SAFARI_IOS), null);
  assert.equal(downloadNotice(CHROME_ANDROID), null);
});

test('a missing or junk user agent is treated as a real browser', () => {
  // The rule this module lives by: never remove a capability on a guess. An
  // unknown agent must fall through to "say nothing", never to "warn".
  assert.equal(inAppBrowser(undefined), null);
  assert.equal(inAppBrowser(''), null);
  assert.equal(inAppBrowser(null), null);
  assert.equal(downloadNotice(''), null);
});
