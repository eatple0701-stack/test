import React, { useEffect, useState } from 'react';
import { useText } from './localeText.js';

// What the app says when the signal goes.
//
// Being offline is not an error here, and the bar is worded so it does not
// read like one. A traveller in a basement 고깃집 has not done anything wrong,
// and most of what they came to this app for still works: the phrases, the
// emergency numbers, the dish pages, whatever tables were on screen already.
// What does not work is anything that has to reach another person — asking
// for a seat, opening a table, sending a report.
//
// So the bar names both halves. "You are offline" alone would be true and
// useless; the second sentence is the part somebody can act on.
//
// navigator.onLine is famously weak — it reports whether there is *a*
// network, not whether the internet is reachable, so a captive hotel wifi
// can read as online. It is still the right signal to show: it never misses
// airplane mode or a dead subway platform, which are the cases that matter,
// and the failures it misses are caught by SavePolicy's network message when
// a write actually fails. Two honest signals beat one clever one.

export default function OfflineBar() {
  const say = useText();
  const [offline, setOffline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-bar" role="status">
      <p className="offline-bar__kr">인터넷에 연결되어 있지 않아요.</p>
      <p className="offline-bar__en">
        {say('Phrases, the help numbers and dish pages still work. Asking for a seat or opening a table will have to wait for signal.',
          '회화, 도움 번호, 요리 페이지는 그대로 됩니다. 자리를 청하거나 상을 차리는 건 신호가 돌아와야 해요.',
          'Las frases, los números de ayuda y las páginas de platos siguen funcionando. Pedir sitio o abrir una mesa tendrá que esperar a la cobertura.')}
      </p>
    </div>
  );
}
