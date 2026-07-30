// What still needs a source, printed from the code rather than kept by hand.
//
// Run: node scripts/sources-report.mjs
//
// A hand-written checklist drifts the moment somebody edits the content. This
// reads the same arrays the app reads, so it cannot be out of date.

import { quiz, unsourcedQuestions } from '../src/content/quiz.js';
import { SOURCES } from '../src/content/sources.js';
import { menus } from '../src/domain/catalog/menus.js';

const sourced = quiz.filter(q => q.sources.length > 0);
const waiting = unsourcedQuestions();

console.log('# 출처 검수 현황 · Source review status\n');
console.log(`퀴즈 문제 ${quiz.length}개 — 출처 확인 ${sourced.length}, 대기 ${waiting.length}`);
console.log(`출처 등록 ${Object.keys(SOURCES).length}건\n`);

console.log('## 사용자에게 보이는 문제 (출처 있음)\n');
for (const q of sourced) {
  console.log(`- **${q.id}** — ${q.prompt}`);
  for (const id of q.sources) {
    const s = SOURCES[id];
    console.log(`  - ${s.publisher} · ${s.title}`);
    console.log(`    ${s.url}`);
  }
}

console.log('\n## 출처 대기 (앱에서 숨겨져 있음)\n');
console.log('아래 문제들은 `quizFor`가 걸러내므로 여행자에게 보이지 않습니다.');
console.log('출처를 찾아 `sources.js`에 등록하고 id를 넣으면 자동으로 노출됩니다.\n');
for (const q of waiting) {
  console.log(`- [ ] **${q.id}** ${q.menuId ? `(${q.menuId})` : '(general)'} — ${q.prompt}`);
}

console.log('\n## 메뉴 문화 설명 — 하드 클레임 점검 대상\n');
console.log('아래는 편집 산문이지만 검증 가능한 주장을 포함합니다. 검수 후');
console.log('필요하면 문장을 완화하거나 출처를 붙여야 합니다.\n');
const hard = /\d{4}|UNESCO|유네스코|처음|최초|originally|invented|first/i;
for (const m of menus) {
  if (m.culture && hard.test(m.culture)) {
    console.log(`- [ ] **${m.id}** (${m.nameKo})`);
    console.log(`      ${m.culture.slice(0, 120)}…`);
  }
}
