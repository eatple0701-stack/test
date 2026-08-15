import React, { useEffect } from 'react';
import { LOCALE, localeText, isKorean, directionOf } from '../domain/policy/locale.js';

// Applies the interface-language setting to the whole app at once.
//
// The alternative was editing 187 call sites, and the reason not to is not
// effort — it is that 187 edits would each be a chance to change a string by
// hand while "translating" it, in an app whose whole discipline is that a
// screen may not say anything nobody checked. This touches no source string.
// It reads what the app already rendered and hides one half of it.
//
// How: every bilingual label in this app is written "한국어 · English", so
// the two halves are separable at the text-node level. This walks rendered
// text nodes, asks LocalePolicy to reduce each one, and writes the result
// back — keeping the original on the node so switching back is exact rather
// than reconstructed.
//
// Why a DOM pass rather than React state: the pairs live in catalogues,
// content files, policies and components alike (src/content/*, domain
// catalogs, 106 files in all). Threading a locale through every one of them
// is the proper fix and is weeks of mechanical edits; this is the same
// behaviour, reversible, and confined to one file that can be deleted the
// day those edits land.
//
// What it deliberately does not touch:
//
//   `both`, the default. The pass does not run at all, so the screens
//   everybody has reviewed are byte-for-byte what they were.
//
//   Anything inside [data-no-locale] — the language picker itself, which
//   has to stay readable in the language you cannot read, and the brand.
//   The stylesheet exempts the same attribute, at a specificity that beats
//   its own hide rules: a picker that hid half of itself in the setting it
//   was offering would be the joke version of this feature.
//
//   Inputs, textareas and anything a person is typing into. Rewriting a
//   value under somebody's cursor is not a translation, it is data loss.
//
//   Strings with no ' · ' at all, which is most of the app's prose, and
//   strings where the chosen language would leave nothing — see
//   localeText's own rules.

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION']);
const ORIGINAL = '__bapchingu_original__';

function reduceTextNodes(root, locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('[data-no-locale]')) return NodeFilter.FILTER_REJECT;
      if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);

  // Group by parent, because JSX splits a pair across nodes. `{c.kr} · {c.en}`
  // renders as three text nodes — "디폴트", " · ", "Default" — and none of
  // them holds both halves, so a per-node test finds nothing to do. The
  // decision is made on the parent's whole text; the writing is still
  // per-node, and only ever to '' or back, so the node count React is
  // reconciling against never changes.
  const byParent = new Map();
  for (const node of nodes) {
    const p = node.parentElement;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(node);
  }

  for (const [parent, group] of byParent) {
    if (parent[ORIGINAL] === undefined) {
      const whole = group.map(n => n.nodeValue).join('');
      if (!whole.includes(' · ')) continue;
      parent[ORIGINAL] = true;
      for (const n of group) n[ORIGINAL] = n.nodeValue;
    }

    if (locale === LOCALE.BOTH) {
      for (const n of group) {
        if (n[ORIGINAL] !== undefined && n.nodeValue !== n[ORIGINAL]) n.nodeValue = n[ORIGINAL];
      }
      continue;
    }

    // Nodes that are only whitespace carry no language, and must not be
    // blanked either — removing the space between a label and its icon
    // would join them.
    const meaningful = group.filter(n => String(n[ORIGINAL] ?? '').trim() !== '');

    // A node whose own text holds the separator *with a half on either side*
    // is a whole pair by itself, whatever else sits beside it, and is reduced
    // on its own terms.
    //
    // This used to be "the group has exactly one node", which is a different
    // claim and a wrong one: JSX puts a second text node beside a label
    // whenever anything follows it — a space before an icon, a trailing
    // arrow — and the group then fell through to the split-across-nodes
    // path below. There the label is tested as if it were one half of a
    // pair, which it fails, so an English screen either kept both halves or,
    // once the whitespace was excused, kept the arrow and lost the label.
    // Both were live on the front page.
    //
    // Testing for the separator alone was wrong in the opposite direction,
    // and shipped: `{link.kr} · {link.en}` renders the separator as its own
    // text node, " · " contains ' · ', so the group was declared a whole pair
    // and *nothing* was reduced — 네이버 지도 · Naver Map, both halves, on
    // every single-language screen. What makes a node a pair is having a
    // half on each side of the separator, which is what localeText splits on.
    const holdsBothHalves = (t) => {
      const at = t.indexOf(' · ');
      return at > 0 && t.slice(at + 3).trim() !== '';
    };
    const whole = meaningful.filter(n => holdsBothHalves(String(n[ORIGINAL] ?? '')));
    if (whole.length > 0) {
      for (const n of whole) {
        const next = localeText(n[ORIGINAL], locale);
        if (n.nodeValue !== next) n.nodeValue = next;
      }
      continue;
    }

    // Split across nodes: keep the ones in the chosen language, empty the
    // rest — including the separator, which belongs to neither.
    const keep = meaningful.filter(n => {
      const t = String(n[ORIGINAL] ?? '').trim();
      if (!t || t === '·') return false;
      return locale === LOCALE.KO ? isKorean(t) : !isKorean(t);
    });
    // Every node was the other language: leave the pair whole rather than
    // blank the label out. Same rule localeText follows.
    if (keep.length === 0) continue;
    for (const n of meaningful) {
      const next = keep.includes(n) ? n[ORIGINAL] : '';
      if (n.nodeValue !== next) n.nodeValue = next;
    }
  }
}

export default function LocaleFilter({ locale }) {
  // The stylesheet's half of the job. This app writes bilingual labels two
  // ways: one string with a middot (handled by the pass below) and a pair of
  // elements — .notice-bar__kr beside .notice-bar__en, 55 class names in all
  // — where no single text node holds both halves. Those are hidden by CSS
  // keyed off this attribute, so both conventions answer to one setting.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.documentElement.setAttribute('data-locale', locale);
    // The direction goes on the document too, because it is the browser that
    // mirrors a layout — not the stylesheet alone. dir also decides which end
    // of an input the caret starts at and which way the scrollbar sits, and
    // neither of those is something CSS can reach.
    document.documentElement.setAttribute('dir', directionOf(locale));
    return () => {
      document.documentElement.removeAttribute('data-locale');
      document.documentElement.setAttribute('dir', 'ltr');
    };
  }, [locale]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.body;

    // React rewrites text nodes as screens change, so a one-shot pass would
    // last until the first re-render. The observer re-reduces whatever
    // arrived; `both` still runs it, because it is what restores the
    // originals when somebody switches back.
    const apply = () => reduceTextNodes(root, locale);
    apply();

    const observer = new MutationObserver((records) => {
      // Skip the mutations this pass caused itself, or the observer and the
      // writer chase each other.
      const relevant = records.some(r =>
        r.type === 'childList' || (r.type === 'characterData' && r.target[ORIGINAL] === undefined));
      if (relevant) apply();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}
