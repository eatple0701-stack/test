import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { menuName, menuPrice, formatWon } from '../../data/registryMenus.js';
import { REGISTRY_CITIES } from '../policy/registryCity.js';

// The registers' menus, shipped next to the registers' restaurants.
//
// In Seoul the join between the two files was made by name, because the menu
// download and the API are unrelated id spaces; in Incheon all three files
// are one publisher's export of one database and the join is the id. Either
// way these tests hold the shipped artefacts to each other, which is the only
// ground truth there is.

const cityDir = (city) => path.join(process.cwd(), 'public/data', city);
const menusDir = (city) => path.join(cityDir(city), 'menus');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const indexOf = (city) => readJson(path.join(cityDir(city), 'index.json'));
const menuFilesOf = (city) => fs.readdirSync(menusDir(city));

/** The publisher each city's menu files must name, and the file to sample. */
const CITY = {
  seoul: { publisher: /서울관광재단/, sample: 'Jongno.json' },
  incheon: { publisher: /인천관광공사/, sample: 'Seo-gu.json' },
};

test('every menu belongs to a restaurant the app actually ships', () => {
  // A menu keyed to an id no district file holds would be a join failing
  // silently — somebody's menu attached to nobody's restaurant.
  for (const city of REGISTRY_CITIES) {
    for (const f of menuFilesOf(city)) {
      const { slug, m } = readJson(path.join(menusDir(city), f));
      const ids = new Set(readJson(path.join(cityDir(city), `${slug}.json`)).rows.map(r => r.i));
      for (const id of Object.keys(m)) {
        assert.ok(ids.has(Number(id)), `${city}/${slug}: menu for ${id}, which the district does not hold`);
      }
    }
  }
});

test('most kept restaurants have their menu, and the gap is bounded', () => {
  // Seoul cannot reach 100% — 43 restaurants joined the dish filter through a
  // name the download spells ambiguously — but a big drop means a join broke,
  // not that a city changed. Incheon joins on the id and has them all.
  for (const city of REGISTRY_CITIES) {
    const withMenu = menuFilesOf(city)
      .reduce((n, f) => n + readJson(path.join(menusDir(city), f)).count, 0);
    const total = indexOf(city).total;
    assert.ok(withMenu / total > 0.95,
      `${city}: only ${withMenu} of ${total} restaurants have a menu on file`);
  }
});

test('an item is four names and a register price, nothing else', () => {
  // The price rides as its own numeric field with the register as its
  // source; it must never leak into a name, and nothing score-like may join
  // it. 0 means "the register recorded none".
  for (const city of REGISTRY_CITIES) {
    const { m } = readJson(path.join(menusDir(city), CITY[city].sample));
    let items = 0;
    let priced = 0;
    for (const list of Object.values(m)) {
      assert.ok(Array.isArray(list) && list.length > 0 && list.length <= 60,
        `${city}: a menu of ${list.length} lines is a database dump, not a menu`);
      for (const item of list) {
        assert.equal(item.length, 5, 'an item is [ko, en, ja, zh, price]');
        assert.ok(item[0].length > 0, 'the Korean name is the anchor and cannot be empty');
        for (const name of item.slice(0, 4)) {
          assert.equal(typeof name, 'string');
          assert.ok(!/[₩￦]|\d{4,}원/.test(name), `"${name}" looks like it carries a price`);
        }
        const price = item[4];
        assert.ok(Number.isFinite(price) && price >= 0 && price < 2_000_000, `price ${price} is out of band`);
        if (price > 0) priced += 1;
        items += 1;
      }
    }
    assert.ok(items > 1000, `${city}: ${CITY[city].sample} should hold thousands of menu lines`);
    assert.ok(priced / items > 0.25, `${city}: the register priced far more lines than this`);
  }
});

test('a reader gets their own language where the register wrote one', () => {
  // Incheon's four languages come out of one workbook, Seoul's out of four
  // CSVs, and both land in the same four columns.
  for (const city of REGISTRY_CITIES) {
    const { m } = readJson(path.join(menusDir(city), CITY[city].sample));
    const translated = Object.values(m).flat().filter(item => item[1] && item[2] && item[3]);
    const all = Object.values(m).flat().length;
    assert.ok(translated.length / all > 0.5,
      `${city}: only ${translated.length} of ${all} lines carry every language`);
  }
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

test('every menu file names the register it came from', () => {
  for (const city of REGISTRY_CITIES) {
    for (const f of menuFilesOf(city)) {
      const { source } = readJson(path.join(menusDir(city), f));
      assert.match(source ?? '', CITY[city].publisher,
        `${city}/${f} does not say which register wrote it`);
    }
  }
});

test('a price is spoken in the reader own convention', () => {
  assert.equal(formatWon(22000, 'ko'), '22,000원');
  assert.equal(formatWon(22000, 'en'), '₩22,000');
  assert.equal(menuPrice(['삼겹살', '', '', '', 15000]), 15000);
  assert.equal(menuPrice(['삼겹살', '', '', '']), 0);
});
