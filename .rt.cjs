const fs = require('fs');
const p = 'src/routes.js';
let s = fs.readFileSync(p, 'utf8');
const cut = (a, b) => { if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 60)); s = s.replace(a, () => b); };

cut(`    case 'match':
      if (tableView?.screen === 'detail' && tableView.tableId) return \`/tables/\${tableView.tableId}\`;
      if (tableView?.screen === 'create') return '/tables/new';
      if (tableView?.screen === 'request') return '/tables/find';
      return '/tables';`,
`    case 'match':
      if (tableView?.screen === 'detail' && tableView.tableId) return \`/tables/\${tableView.tableId}\`;
      if (tableView?.screen === 'create') return '/tables/new';
      if (tableView?.screen === 'request') return '/tables/find';
      // The landing again, from 2026-09-07. '/tables' still parses, so every
      // link shared while it was the canonical path still opens the list.
      return '/';`);

cut(`    case 'main':
      return '/';`, `    case 'main':
      return '/about';`);

cut(`    // The landing. '' is what splitting '/' produces, so a bare visit lands
    // on the Main page — see pathFor for the 8/6 reversal that put it there.
    case '':
    case 'main':
      return { ...base, activeTab: 'main' };`,
`    // The landing, and it has moved twice. '/' was the table list until
    // 2026-08-06, when the owner took it back for the Main page on the
    // grounds that with one real table a list is not a pitch. It returns to
    // the tables on 2026-09-07 because that objection is answered: the deck
    // that asks what somebody wants to eat lives on that screen now, so a
    // visitor arriving at '/' is asked a question rather than shown a short
    // list. What used to be Main is 소개 and keeps its own path.
    case '':
      return { ...base, activeTab: 'match' };
    // '/main' keeps parsing for links shared before the rename.
    case 'main':
    case 'about':
      return { ...base, activeTab: 'main' };`);

fs.writeFileSync(p, s);
console.log('routes reversed');
