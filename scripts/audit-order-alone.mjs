// Every place the app still says a dish cannot be ordered alone.
//
// That claim was the product's definition until 2026-09-02, and it is false
// for 10 of the 24 dishes in the catalogue (src/domain/catalog/menus.js,
// minPeople: 1 — baekban, tteokbokki, jeon, sundae, twigim, sannakji, yukhoe,
// dakbal, ssambap, bibimbap). The definition moved to the person's wish: a
// dish they would rather not eat alone. Fixing the hero and the consent text
// alone would leave the app making two different claims on adjacent screens,
// so this counts what is left rather than trusting anybody to remember.
//
// Four things it does that a grep does not, each added after the grep missed
// something on this exact sweep:
//
//   Seven languages. The claim is translated, and an English pattern finds
//   the `say()` line while saying nothing about its five other arms — the
//   Spanish "no se piden para uno" and the French "ne se commandent pas"
//   share no word with "cannot be ordered".
//
//   A two-line window. These sentences wrap: "a dish somebody cannot" ends
//   one line and "order alone is the product" begins the next, and four sites
//   including App.jsx and hosts.js were invisible to a line-at-a-time scan.
//
//   Arabic harakat stripped before matching. The hero writes لا تُطلَب with a
//   fatha and the map button writes لا تُطلب without one; they are the same
//   words and only one of them matched.
//
//   Two claim sets, not one. The catalogue also says, per dish and truthfully,
//   "this one you can order alone". Mixing that in with the false claim
//   reported the honest sentences as defects — and the Spanish `solo` in
//   "pedir solo por la etiqueta" means "only", not "alone", which is why that
//   pattern carries a lookahead instead of a bare word.
//
//   node scripts/audit-order-alone.mjs
//
// Exit code is always 0 — this is a report, not a gate. The number it prints
// belongs beside any claim that the definition has been fixed.

import fs from 'node:fs';
import path from 'node:path';

/** Arabic diacritics and tatweel, which vary between two writings of one word. */
const norm = (s) => s.replace(/[ً-ْـٰ]/g, '');

/** "A person cannot order this" — the definition that was dropped. */
const DENY = [
  [/cannot be ordered|cannot order (alone|삼겹살)|could not (have )?order(ed)? alone|nobody can order|none of them could order|a person\s+cannot order|dishes you cannot order/i, 'en'],
  [/주문할 수 없|주문 자체가 불가능|못 시켰|시킬 수 없/, 'ko'],
  [/no (puedes|podía|habrías podido) pedir solo(?!\s+por)|nadie puede pedir solo|no se piden\s*(<br\s*\/?>)?\s*para uno/, 'es'],
  [/(ne peut|ne pouvez pas|ne pouvais pas|pas pu) commander seul|ne commande pas seul|ne se commandent pas/, 'fr'],
  [/لا تطلب|لا تستطيع أن تطلبها|ما كنت ل[أت]طلبها|لا يستطيع أحد أن يطلبه/, 'ar'],
  [/点不了/, 'zh'],
  [/頼めない|頼めなかった/, 'ja'],
];

/** "This one you can order alone" — true per dish, and reported apart. */
const ALLOW = [
  [/you \*?can\*? order (it )?alone|honest exception/i, 'en'],
  [/혼자서도 시킬 수 있/, 'ko'],
  [/(sí lo|lo) puedes pedir solo/, 'es'],
  [/(le|la) commander seul/, 'fr'],
  [/يمكنك طلب (هذا|صحن واحد) وحدك/, 'ar'],
  [/可以一个人点|一个人也能点/, 'zh'],
  [/(ひとり|一人)でも(頼めます|注文できます)/, 'ja'],
];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') yield* walk(p); }
    else if (/\.(jsx?|mjs)$/.test(e.name)) yield p;
  }
}

/** Strip a line's comment opener, so a wrapped sentence rejoins cleanly. */
const bare = (l) => l.replace(/^\s*(\/\/+|\/\*+|\*+\/?)\s?/, '').trim();
const langsIn = (s, set) => set.filter(([re]) => re.test(norm(s))).map(([, l]) => l);

function scan(claims) {
  const rows = [];
  for (const file of [...walk('src')]) {
    const rel = path.relative('.', file).replaceAll(path.sep, '/');
    const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

    // Comment state per line, computed first so the window below can ask about
    // either half. A one-line `/** … */` opens and closes on the same line, so
    // the counts never differ and it has to be matched directly — the first
    // run of this reported menus.js:1857, a JSDoc line, as being on screen.
    const commented = [];
    let inBlock = false;
    for (const line of lines) {
      const wasBlock = inBlock;
      const opens = (line.match(/\/\*/g) || []).length;
      const closes = (line.match(/\*\//g) || []).length;
      if (opens > closes) inBlock = true; else if (closes > opens) inBlock = false;
      commented.push(wasBlock || inBlock || /^\s*(\/\/|\*|\/\*)/.test(line));
    }

    const solo = lines.map(l => langsIn(l, claims));
    const win = lines.map((l, i) =>
      langsIn(i + 1 < lines.length ? `${bare(l)} ${bare(lines[i + 1])}` : bare(l), claims));

    lines.forEach((line, i) => {
      // A claim on this line alone, or one that starts here and finishes on
      // the next — but not the leading half of a claim whose own line carries
      // it, or every wrapped sentence would be reported twice.
      const found = solo[i].length ? solo[i]
        : (win[i].length && !solo[i + 1]?.length ? win[i] : []);
      if (!found.length) return;
      rows.push({ file: rel, line: i + 1, langs: found, seen: !commented[i], text: line.trim() });
    });
  }

  // A content object writes one language per line and a say() call can too, so
  // neighbouring hits are one statement, not seven. Merged within two lines.
  const sites = [];
  for (const r of rows.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
    const last = sites[sites.length - 1];
    if (last && last.file === r.file && r.line - last.lastLine <= 2) {
      r.langs.forEach(l => last.langs.add(l));
      last.lastLine = r.line;
      last.seen = last.seen || r.seen;
      continue;
    }
    sites.push({ file: r.file, line: r.line, lastLine: r.line, langs: new Set(r.langs), seen: r.seen, text: r.text });
  }
  return sites;
}

/**
 * Sites that carry the words and are not the defect, each with the reason.
 *
 * Named rather than pattern-matched, the way schemaSqlRuns.test.mjs names the
 * tables that deny everybody on purpose: an exemption a person decided is
 * worth more than a heuristic, and a list can be argued with. Keyed by a
 * distinctive fragment so the entry survives the line moving.
 *
 * Without this the count never reaches zero and stops meaning anything — and
 * a script that always reports four problems is a script people stop reading.
 */
const KEEP = [
  ['신보람 교수님', 'a quotation of the professor\'s note on the plan — the record of what was said, not a claim the app makes'],
  ['The first sentence used to say', 'safety.js quoting the retired claim in order to explain why it went'],
  ['cannot order 삼겹살', 'true as written: samgyeopsal is minPeople 2 in the catalogue'],
  ['Dishes that genuinely cannot be ordered by one person', 'true as written: the JSDoc of sharedOnlyMenus(), which filters minPeople > 1'],
];

const ORDER = ['en', 'ko', 'es', 'fr', 'ar', 'zh', 'ja'];
const show = (list) => list.map(s => {
  const where = `${s.file}:${s.line}${s.lastLine > s.line ? `-${s.lastLine}` : ''}`;
  const langs = ORDER.filter(l => s.langs.has(l));
  return `  ${where.padEnd(36)} ${String(langs.length).padStart(2)}  ${langs.join(',').padEnd(23)} ${s.text.slice(0, 78)}`;
}).join('\n');

const all = scan(DENY);
const keptFor = (s) => {
  const line = fs.readFileSync(s.file, 'utf8').replace(/\r\n/g, '\n').split('\n')
    .slice(s.line - 1, s.lastLine + 1).join(' ');
  return KEEP.find(([frag]) => line.includes(frag))?.[1] ?? null;
};
const kept = all.filter(s => keptFor(s));
const sites = all.filter(s => !keptFor(s));
const seen = sites.filter(s => s.seen);
const hidden = sites.filter(s => !s.seen);

console.log(`ON SCREEN — ${seen.length} statements\n${show(seen)}`);
console.log(`\nIN COMMENTS — ${hidden.length} statements\n${show(hidden)}`);

console.log(`\nKEPT ON PURPOSE — ${kept.length}`);
for (const s of kept) console.log(`  ${`${s.file}:${s.line}`.padEnd(36)} ${keptFor(s)}`);

const allow = scan(ALLOW);
console.log(`\nAFFIRMATIVE — ${allow.length} statements saying a dish CAN be ordered alone`);
console.log(show(allow));

console.log(`\n${sites.length} statements still to fix — ${seen.length} on screen, ${hidden.length} in comments (${kept.length} kept on purpose)`);
if (seen.length) {
  console.log('\nAnything on screen is a claim a traveller reads. Fix those first.');
}
