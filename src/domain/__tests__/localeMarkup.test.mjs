import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// These read source rather than a rendered screen, which is a real limit and
// worth saying: they cannot prove the app looks right in Korean. What they
// can prove is the thing that actually broke on 2026-08-11 — the language
// setting was shipped, verified on a handful of labels, and reported as
// working, while the front page ignored it completely. Every screen the
// owner opened was one of the ones I had not measured: the headline, the
// dish blobs, the tab bar and the two buttons in the top corner were each
// written in a single language with no counterpart, so no filter could
// reduce them and the three settings rendered nearly the same page.
//
// The rule these enforce: a piece of text that a language setting is
// supposed to swap must have a sibling holding the other language. Absent
// that sibling there is nothing to switch to, and the setting is a lie no
// matter how well the filter works.

const SRC = path.join(process.cwd(), 'src');

function jsxFiles(dir = SRC, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) jsxFiles(p, out);
    else if (/\.jsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

test('a language class is the last class on its element', () => {
  // The stylesheet hides halves with [class$="__kr"] and friends, and that
  // selector matches the end of the whole class attribute, not one class
  // within it. So `className="main-hero__title-kr main-hero__title"` looks
  // identical in the editor and is invisible to every rule — the half never
  // hides, and the bug shows up as "the setting does nothing" rather than as
  // anything that points at this line.
  const offenders = [];
  for (const file of jsxFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /className=\{?["`]([^"`]*)["`]/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const parts = m[1].split(/\s+/).filter(Boolean);
      const at = parts.findIndex(p => /(__kr|__en|-kr|-en)$/.test(p));
      if (at >= 0 && at !== parts.length - 1) {
        offenders.push(`${path.relative(SRC, file)}: "${m[1]}"`);
      }
    }
  }
  assert.deepEqual(offenders, [], 'language class must come last in className');
});

test('the front page says every hero word in both languages', () => {
  const main = read('components/MainTab.jsx');

  // Four blobs, and each needs a Latin-script name and an English tag or the
  // English setting shows four Korean words at 46px.
  const blobs = main.slice(main.indexOf('const HERO_BLOBS'), main.indexOf('const TILE_TONES'));
  for (const field of ['word', 'roman', 'tag', 'tagEn']) {
    const count = blobs.split(`${field}:`).length - 1;
    assert.equal(count, 4, `HERO_BLOBS is missing ${field} on some dish`);
  }

  // The headline, the paragraph under it and the brand line above it: each a
  // pair. The headline is the one place the two do not show together — two
  // 44px headlines stacked is not a bilingual screen, it is two screens — so
  // the English one is l-en-only and the Korean one is the default.
  assert.match(main, /main-hero__title main-hero__title-kr/);
  assert.match(main, /main-hero__title l-en-only/);
  assert.match(main, /main-hero__sub main-hero__sub-kr/);
  assert.match(main, /main-hero__sub main-hero__sub-en/);
  assert.match(main, /main-hero__eyebrow-kr/);
  assert.match(main, /main-hero__eyebrow-en/);

  // Section headings were a bare Korean text node with an English span under
  // it. A bare text node has no element, so nothing could hide it.
  assert.equal(main.split('main-band__title-kr').length - 1, 2);
  assert.equal(main.split('main-band__title-en').length - 1, 2);
});

test('every tab in the bar is labelled in every language the app offers', () => {
  const bar = read('components/TabBar.jsx');
  const list = bar.slice(bar.indexOf('const tabs = ['), bar.indexOf('export default'));
  const ids = list.match(/id: '/g) ?? [];
  assert.equal(ids.length, 5, 'the bar should still be five tabs');
  for (const field of ['kr', 'es']) {
    const found = list.match(new RegExp(`${field}: '`, 'g')) ?? [];
    assert.equal(found.length, ids.length, `a tab without a ${field} label cannot follow the setting`);
  }
  // One element, not one per language. The two-span version was a CSS trick
  // that could hold exactly two; the bar has three languages now, and five
  // items sharing a 375px screen still have room for one word each.
  assert.ok(
    bar.includes('<span className="tab-label">{say(t.label, t.kr, t.es)}</span>'),
    'the label should be one element asking say() for the right language',
  );
  assert.equal(bar.includes('l-ko-only'), false, 'the CSS-pair version should be gone');
});

test('the three buttons in the top corner speak every setting', () => {
  // 로그인 and 가입하기 sat in every setting, including the English one, and
  // they are the first thing a traveller has to find. The corner fits one
  // word, so these pick rather than pair — chromeWord, not say().
  const app = read('App.jsx');
  for (const [korean, english, spanish] of [
    ['로그인', 'Sign in', 'Entrar'],
    ['가입하기', 'Join', 'Únete'],
    ['로그아웃', 'Sign out', 'Cerrar sesión'],
  ]) {
    assert.ok(
      app.includes(`chromeWord('${korean}', '${english}', '${spanish}')`),
      `${korean} is not offered in all three`,
    );
  }
  assert.ok(app.includes('const chromeWord = (kr, en, es) =>'));
});
