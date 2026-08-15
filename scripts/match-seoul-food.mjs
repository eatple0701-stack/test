// Which of this app's twenty curated places exist in the Seoul dataset.
//
// The dataset has 167,659 restaurants. This app has twenty, each with a
// hand-written story, a checked address and a provenance record. Importing
// 167,659 would not expand the app — it would destroy the only thing it
// has, which is that somebody read about every place on it.
//
// So the dataset is used the other way round: as *enrichment* for places
// that are already curated. Match ours against theirs, and take the few
// facts they hold and we do not — a photograph, opening hours, whether the
// kitchen offers a foreign-language menu.
//
// Matching is on the Korean name plus the building number, and both have to
// agree. Name alone is not enough: 만족오향족발 has branches, and 김밥천국 has
// hundreds. A wrong match here would attach a stranger's photograph to a
// place we vouched for, which is worse than having no photograph.

import fs from 'node:fs';
import { fetchAll } from './seoul-food-api.mjs';
import { restaurants } from '../src/data/restaurants.js';

/** The Korean half of "Sanchon (산촌)", or null when the name has none. */
const koreanName = (name) => {
  const m = /\(([^)]*[가-힣][^)]*)\)/.exec(String(name ?? ''));
  return m ? m[1].trim() : null;
};

/** Comparable form: no spaces, no branch suffix in brackets. */
const normalise = (s) => String(s ?? '').replace(/\([^)]*\)/g, '').replace(/\s+/g, '');

/**
 * The building number of a road address, from either language.
 *
 * "56 Ujeongguk-ro, Jongno-gu" -> 56, and "서울특별시 종로구 우정국로 56" -> 56.
 * A romanised road name cannot be compared to a Korean one without a
 * gazetteer; the number can, and it is what separates two branches on the
 * same street.
 */
const buildingNo = (addr) => {
  const s = String(addr ?? '');
  const ko = /([0-9]+(?:-[0-9]+)?)\s*$/.exec(s.trim());
  if (ko) return ko[1];
  // The comma matters: "14-5, Insadong 12-gil" is how half of these are
  // written, and requiring whitespace after the number missed every one of
  // them — including 오세계향, which is in the dataset at the same number.
  const en = /\b([0-9]+(?:-[0-9]+)?)\s*,?\s+[A-Za-z][A-Za-z-]*\s*[0-9]*\s*(?:-ro|-gil|-daero|gil)/.exec(s);
  return en ? en[1] : null;
};

const rows = await fetchAll('restaurants');
const images = await fetchAll('restaurantImages');
const imageOf = new Map(images.map(i => [i.RSTR_ID, i.RSTR_IMG_URL]));

// A restaurant is Seoul-only data; ours in Incheon cannot be in here, and
// saying so is more useful than a silent miss.
const seoul = (r) => /Seoul$/.test(String(r.zone ?? ''));

const report = [];
for (const ours of restaurants) {
  const ko = koreanName(ours.name);
  const ourNo = buildingNo(ours.address?.value);
  const wanted = normalise(ko ?? ours.name);

  // Containment has to run both ways. Ours carry a district in the name —
  // 꽃밥에피다 북촌 — where the registry has only 꽃밥에피다, so testing one
  // direction missed a place that is in there at the same address.
  const byName = rows.filter(r => {
    const theirs = normalise(r.RSTR_NM);
    if (theirs === wanted) return true;
    if (wanted.length < 3 || theirs.length < 3) return false;
    return theirs.includes(wanted) || wanted.includes(theirs);
  });
  const confirmed = byName.filter(r => ourNo && buildingNo(r.RSTR_RDNMADR) === ourNo);
  // A name match at a different building number is not a match — but it is
  // worth seeing, because it means either our address or theirs is wrong.
  const nearMiss = byName.filter(r => !confirmed.includes(r)).slice(0, 3);

  report.push({
    id: ours.id,
    name: ours.name,
    inSeoul: seoul(ours),
    korean: ko,
    ourNo,
    nameHits: byName.length,
    matched: confirmed[0] ?? null,
    ambiguous: confirmed.length > 1,
    nearMiss: nearMiss.map(r => ({ id: r.RSTR_ID, nm: r.RSTR_NM, addr: r.RSTR_RDNMADR })),
    photo: confirmed[0] ? imageOf.get(confirmed[0].RSTR_ID) ?? null : null,
  });
}

const hit = report.filter(r => r.matched);
const missSeoul = report.filter(r => !r.matched && r.inSeoul);
const missOther = report.filter(r => !r.matched && !r.inSeoul);

console.log('── matched ──');
for (const r of hit) {
  console.log(`  ${r.id.padEnd(16)} #${r.matched.RSTR_ID}  ${r.matched.RSTR_NM}  ${r.matched.RSTR_RDNMADR}`);
  console.log(`  ${' '.repeat(16)} photo: ${r.photo ?? '(none in dataset)'}${r.ambiguous ? '  ⚠ several candidates' : ''}`);
}
console.log('\n── in Seoul, not found ──');
for (const r of missSeoul) {
  console.log(`  ${r.id.padEnd(16)} ${r.korean ?? r.name}  — our building no. ${r.ourNo ?? '?'} , name hits ${r.nameHits}`);
  for (const n of r.nearMiss) console.log(`  ${' '.repeat(16)} near: #${n.id} ${n.nm} — ${n.addr}`);
}
console.log('\n── outside Seoul, so not in this dataset ──');
for (const r of missOther) console.log(`  ${r.id.padEnd(16)} ${r.name}`);
console.log(`\nmatched ${hit.length} of ${restaurants.length}; ${report.filter(r => r.photo).length} have a photograph.`);

fs.writeFileSync('scripts/.cache.local/match.json', JSON.stringify(report, null, 1));
