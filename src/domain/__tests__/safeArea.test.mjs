import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// env(safe-area-inset-*) is not a feature you switch on in CSS. It reports 0
// unless the document asks to be laid out under the notch, and asking is a
// viewport meta directive in the HTML — viewport-fit=cover. The default,
// viewport-fit=auto, lays the page out inside the safe area and therefore has
// no inset to report.
//
// So the two files have to agree, and until 2026-09-10 they did not. Six CSS
// rules were written against those insets — the tab bar's bottom padding, two
// sheet footers, --tab-h itself — and every one of them computed against 0 on
// the phones they were written for. On a notched iPhone the bar sat under the
// home indicator while the arithmetic meant to lift it read `64px + 0`.
//
// Nothing in either file can see the other, which is why this is a test and
// not a comment.

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

/**
 * The viewport meta's directives, as a map. Returns null when the document
 * has no viewport meta at all — a different failure from having one that is
 * missing a directive, and worth telling apart.
 */
function viewportDirectives(html) {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const tag = withoutComments.match(/<meta\s[^>]*name=["']viewport["'][^>]*>/i);
  if (!tag) return null;
  const content = tag[0].match(/content=["']([^"']*)["']/i);
  if (!content) return null;
  const out = new Map();
  for (const part of content[1].split(',')) {
    const [k, v] = part.split('=');
    if (k) out.set(k.trim().toLowerCase(), (v ?? '').trim().toLowerCase());
  }
  return out;
}

const STYLESHEETS = ['src/index.css', 'src/custom.css'];

test('the helper reads a viewport meta, and says so when there is none', () => {
  const one = viewportDirectives('<meta name="viewport" content="width=device-width, viewport-fit=cover" />');
  assert.equal(one.get('width'), 'device-width');
  assert.equal(one.get('viewport-fit'), 'cover');

  // The shape this test exists to reject: a real viewport meta with the
  // directive missing. It must parse, and it must not claim cover.
  const before = viewportDirectives('<meta name="viewport" content="width=device-width, initial-scale=1.0" />');
  assert.equal(before.get('width'), 'device-width');
  assert.equal(before.has('viewport-fit'), false);

  assert.equal(viewportDirectives('<head><title>x</title></head>'), null);
  // A commented-out meta is not a meta.
  assert.equal(viewportDirectives('<!-- <meta name="viewport" content="viewport-fit=cover"> -->'), null);
});

test('a stylesheet that reads the safe area gets a document laid out under the notch', () => {
  const usesInsets = STYLESHEETS.filter((p) => {
    const css = read(p).replace(/\/\*[\s\S]*?\*\//g, '');
    return css.includes('env(safe-area-inset');
  });

  // If this ever goes empty the rule below has nothing to protect, and
  // somebody has quietly dropped the safe-area handling instead.
  assert.ok(usesInsets.length > 0, 'no stylesheet reads env(safe-area-inset-*) any more');

  const directives = viewportDirectives(read('index.html'));
  assert.ok(directives, 'index.html has no viewport meta');
  assert.equal(
    directives.get('viewport-fit'),
    'cover',
    `${usesInsets.join(' and ')} read env(safe-area-inset-*), which is 0 without viewport-fit=cover`,
  );
});
