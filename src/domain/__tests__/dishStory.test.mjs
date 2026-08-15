import test from 'node:test';
import assert from 'node:assert/strict';
import { menus } from '../catalog/menus.js';
import { sourceById } from '../../content/sources.js';

// The story card, and the rule that decides whether it exists.
//
// A review asked for history and folk tales beside each dish, and that is a
// good ask — it is the part of this app that is actually about culture rather
// than logistics. It is also the easiest place in the whole product to start
// making things up, because food history reads well and almost none of what
// circulates about it online has a source behind it.
//
// So the rule is the one the quiz already lives under: a claim with no source
// is not shown. A dish whose history nobody on this team has read keeps no
// `story` field, the deck renders one card fewer, and the absence is the
// honest state rather than a gap to fill with something that sounds right.
//
// These tests exist because the pressure to break that rule arrives exactly
// when the catalogue is being expanded in a hurry, which is the plan.

const withStory = menus.filter(m => m.story);

test('a dish only tells a story it can name a source for', () => {
  for (const m of withStory) {
    const ids = m.storySources ?? [];
    assert.ok(ids.length > 0, `${m.id} has a story and names no source for it`);
    for (const id of ids) {
      const src = sourceById(id);
      assert.ok(src, `${m.id} cites '${id}', which is not in src/content/sources.js`);
      assert.ok(src.url, `the source '${id}' has no link, so nobody can check it`);
      assert.ok(src.supports, `the source '${id}' does not say what it supports`);
    }
  }
});

test('a source named for a story is a source, not a placeholder', () => {
  // The failure this guards against is a real one from the quiz's history: an
  // id that reads like a citation, points at nothing, and passes review
  // because nobody clicked it.
  for (const m of menus) {
    for (const id of m.storySources ?? []) {
      assert.match(sourceById(id).url, /^https?:\/\//, `${m.id}'s source '${id}' is not a link`);
    }
  }
});

test('a story is told in every language, or it is not told', () => {
  // Same rule the rest of the catalogue lives under: English is the fallback,
  // so a missing translation is invisible to anybody who reads English.
  const LANGS = ['Ko', 'Es', 'Fr', 'Ar', 'Zh', 'Ja'];
  for (const m of withStory) {
    for (const l of LANGS) {
      const v = m['story' + l];
      assert.ok(typeof v === 'string' && v.trim() !== '', `${m.id} has no story${l}`);
      assert.notEqual(v, m.story, `${m.id}'s story${l} is the English text`);
    }
  }
});

test('naming a source is not optional in the other direction either', () => {
  // storySources without a story is a citation for nothing — usually the
  // wreckage of a half-finished entry, and worth catching while it is still
  // half-finished rather than after it ships empty.
  for (const m of menus) {
    if ((m.storySources ?? []).length > 0) {
      assert.ok(m.story, `${m.id} cites a source but tells no story`);
    }
  }
});
