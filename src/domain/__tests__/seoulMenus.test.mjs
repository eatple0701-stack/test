import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { menuName } from '../../data/seoulMenus.js';

// The register's menus, shipped next to the register's restaurants. The
// join between the two files was made by name because the id spaces of the
// download and the API are unrelated — so these tests hold the shipped
// artefacts to each other, which is the only ground truth there is.

const DIR = path.join(process.cwd(), 'public/data/seoul');
const MENUS = path.join(DIR, 'menus');
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const menuFiles = fs.readdirSync(MENUS);

test('every menu belongs to a restaurant the app actually ships', () => {
  // A menu keyed to an id no district file holds would be the name-join
  // failing silently — somebody's menu attached to nobody's restaurant.
  for (const f of menuFiles) {
    const { slug, m } = JSON.parse(fs.readFileSync(path.join(MENUS, f), 'utf8'));
    const ids = new Set(JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), 'utf8')).rows.map(r => r.i));
    for (const id of Object.keys(m)) {
      assert.ok(ids.has(Number(id)), `${slug}: menu for ${id}, which the district does not hold`);
    }
  }
});

test('most kept restaurants have their menu, and the gap is bounded', () => {
  // 100% is impossible — 43 restaurants joined the dish filter through a
  // name the download spells ambiguously — but a big drop here means the
  // join broke, not that Seoul changed.
  let withMenu = 0;
  for (const f of menuFiles) {
    withMenu += JSON.parse(fs.readFileSync(path.join(MENUS, f), 'utf8')).count;
  }
  assert.ok(withMenu / index.total > 0.95,
    `only ${withMenu} of ${index.total} restaurants have a menu on file`);
});

test('an item is four names and nothing else — no prices came along', () => {
  // The download has no price column, so nothing had to be refused; this
  // pins that a future rebuild cannot quietly add one.
  const { m } = JSON.parse(fs.readFileSync(path.join(MENUS, 'Jongno.json'), 'utf8'));
  let items = 0;
  for (const list of Object.values(m)) {
    assert.ok(Array.isArray(list) && list.length > 0 && list.length <= 60);
    for (const item of list) {
      assert.equal(item.length, 4, 'an item is [ko, en, ja, zh]');
      assert.ok(item[0].length > 0, 'the Korean name is the anchor and cannot be empty');
      for (const name of item) {
        assert.equal(typeof name, 'string');
        assert.ok(!/[₩￦]|\d{4,}원/.test(name), `"${name}" looks like it carries a price`);
      }
      items += 1;
    }
  }
  assert.ok(items > 1000, 'Jongno should hold thousands of menu lines');
});

test('the reader gets their language when the register wrote it, Korean when not', () => {
  const item = ['삼겹살', 'Samgyeopsal', 'サムギョプサル', '五花肉'];
  assert.equal(menuName(item, 'ko'), '삼겹살');
  assert.equal(menuName(item, 'en'), 'Samgyeopsal');
  assert.equal(menuName(item, 'ja'), 'サムギョプサル');
  assert.equal(menuName(item, 'zh'), '五花肉');
  // Spanish, French, Arabic read the English column — the register has no
  // other, and English is the one a menu is most likely to carry.
  assert.equal(menuName(item, 'es'), 'Samgyeopsal');
  const bare = ['된장찌개', '', '', ''];
  for (const loc of ['en', 'es', 'ja', 'zh']) assert.equal(menuName(bare, loc), '된장찌개');
});

test('every menu file names its source', () => {
  for (const f of menuFiles) {
    const { source } = JSON.parse(fs.readFileSync(path.join(MENUS, f), 'utf8'));
    assert.match(source ?? '', /서울관광재단/);
  }
});
