const fs = require('fs');
const cutF = (file, a, b) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(a)) throw new Error('missing in ' + file + ': ' + a.slice(0, 55));
  fs.writeFileSync(file, s.replace(a, () => b));
};

// ── out of 소개 ────────────────────────────────────────────────────────
const mt = 'src/components/MainTab.jsx';
let m = fs.readFileSync(mt, 'utf8');
const from = m.indexOf('      {/* ---- 입맛 지도');
const deckStart = from >= 0 ? from : m.indexOf('      <DishSwipe');
const deckEnd = m.indexOf('      />', m.indexOf('      <DishSwipe')) + '      />\n'.length;
if (deckStart < 0 || deckEnd <= 0) throw new Error('deck block not found in MainTab');
m = m.slice(0, deckStart) + m.slice(deckEnd);
m = m.replace("import DishSwipe from './DishSwipe';\n", () => '');
m = m.replace('  onRequestTable, onTasteChange,', () => '  onRequestTable,');
fs.writeFileSync(mt, m);

// ── into 밥상, under the head ──────────────────────────────────────────
cutF('src/components/TablesTab.jsx',
  "export default function TablesTab({ onOpenTable, onCreateTable, onRequestTable, profile, auth, onOpenAuth, initialGroup = null, initialMenu = null, preferredMenus = [] }) {",
  "export default function TablesTab({ onOpenTable, onCreateTable, onRequestTable, profile, auth, onOpenAuth, onTasteChange, initialGroup = null, initialMenu = null, preferredMenus = [] }) {");

cutF('src/components/TablesTab.jsx',
  "import TablesMap from './TablesMap';",
  "import TablesMap from './TablesMap';\nimport DishSwipe from './DishSwipe';");

cutF('src/components/TablesTab.jsx', '      </header>\n',
`      </header>

      {/* ---- 입맛 지도, moved here from 소개 on 2026-09-07 ----

              '/' opens on this screen now, so this is the first thing a
              visitor meets: a question rather than a list. That is the whole
              argument for the move — the front page had grown past what one
              screen can ask, and the deck's answer is read on this screen
              anyway, three blocks below, where the tables it names are.

              Its CTA scrolls rather than navigates. On 소개 it sent the reader
              to the tables; here the tables are already underneath it, and a
              button that navigates to the screen you are on does nothing a
              reader can see. ---- */}
      <DishSwipe
        inline
        auth={auth}
        onOpenAuth={onOpenAuth}
        onTasteChange={onTasteChange}
        onOpenTables={() => document.querySelector('.table-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />
`);

// ── App hands the handler to the screen that now owns the deck ────────
cutF('src/App.jsx', '            onTasteChange={() => setTaste(getStoredTaste())}\n', '');
cutF('src/App.jsx', '            preferredMenus={preferredMenus}',
  '            preferredMenus={preferredMenus}\n            onTasteChange={() => setTaste(getStoredTaste())}');

console.log('deck moved to 밥상');
