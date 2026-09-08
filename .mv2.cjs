const fs = require('fs');
const cutF = (file, a, b) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(a)) throw new Error('missing in ' + file + ': ' + a.slice(0, 55));
  fs.writeFileSync(file, s.replace(a, () => b));
};
const tt = 'src/components/TablesTab.jsx';

cutF(tt, "export default function TablesTab({ onOpenTable, onCreateTable, onRequestTable, profile, auth, onOpenAuth, initialGroup = null, initialMenu = null, preferredMenus = [] }) {",
  "export default function TablesTab({ onOpenTable, onCreateTable, onRequestTable, profile, auth, onOpenAuth, onTasteChange, initialGroup = null, initialMenu = null, preferredMenus = [] }) {");

cutF(tt, "import { conflictsFor } from '../data/profile';",
  "import { conflictsFor } from '../data/profile';\nimport DishSwipe from './DishSwipe';");

cutF(tt, '      </header>\n',
`      </header>

      {/* ---- 입맛 지도, moved here from 소개 on 2026-09-07 ----

              '/' opens on this screen now, so this is the first thing a
              visitor meets: a question rather than a list. That is the whole
              argument for the move — the front page had grown past what one
              screen can ask, and the deck's answer is read on this screen
              anyway, further down, where the tables it names are.

              Its CTA scrolls rather than navigates. On 소개 it sent the reader
              to the tables; here the tables are already underneath it, and a
              button that navigates to the screen you are already on does
              nothing a reader can see. ---- */}
      <DishSwipe
        inline
        auth={auth}
        onOpenAuth={onOpenAuth}
        onTasteChange={onTasteChange}
        onOpenTables={() => document.querySelector('.table-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />
`);

// App: the handler follows the deck
cutF('src/App.jsx', '            onTasteChange={() => setTaste(getStoredTaste())}\n', '');
cutF('src/App.jsx', '            preferredMenus={preferredMenus}',
  '            preferredMenus={preferredMenus}\n            onTasteChange={() => setTaste(getStoredTaste())}');

console.log('deck now lives on 밥상');
