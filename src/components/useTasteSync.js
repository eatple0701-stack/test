import { useEffect, useRef } from 'react';
import { isMember } from '../domain/policy/access.js';
import { syncOnce, parseAccountRecord, toAccountRecord } from '../domain/policy/tasteSync.js';
import { readAccountTaste, writeAccountTaste } from '../data/tableRepository.js';
import { getStoredTaste, adoptTaste } from '../data/taste.js';
import { getStoredMbti, adoptMbti } from '../data/foodMbti.js';
import { stampOf, setStamp, announce, TASTE_STORED, TASTE_SYNCED } from '../data/tasteStamp.js';

// Keeps a member's taste map and 음식 MBTI on their account. How the two
// copies are decided between is in domain/policy/tasteSync.js; this is the
// wiring — the real storage and the real account handed to it.
//
// Runs once when somebody is recognised as a member (a returning session, a
// sign-in, Google landing back) and again shortly after they stop answering:
// every swipe writes, and fourteen swipes should be one trip to the server,
// not fourteen. A guest never reaches any of it.
//
// A failure is silent on purpose. The copy in this browser is untouched by
// one, and the next answer or the next visit tries again — there is nothing a
// person could do with a message about it.
const QUIET_MS = 1500;

export function useTasteSync(auth, onPulled) {
  const me = isMember(auth) ? auth.userId : null;
  const pulledRef = useRef(onPulled);
  useEffect(() => { pulledRef.current = onPulled; });

  useEffect(() => {
    if (!me) return undefined;
    let alive = true;
    let timer = null;
    let running = false;
    let again = false;

    const run = async () => {
      if (running) { again = true; return; }
      running = true;
      try {
        const { pulled } = await syncOnce({
          me,
          readRemote: async () => parseAccountRecord(await readAccountTaste()),
          writeRemote: (next) => writeAccountTaste(toAccountRecord(next)),
          local: {
            taste: () => ({ value: getStoredTaste(), ...stampOf('taste') }),
            mbti: () => ({ value: getStoredMbti(), ...stampOf('mbti') }),
          },
          adopt: { taste: adoptTaste, mbti: adoptMbti },
          mark: {
            taste: (at, owner) => setStamp('taste', { at, owner }),
            mbti: (at, owner) => setStamp('mbti', { at, owner }),
          },
        });
        if (alive && pulled.length > 0) {
          announce(TASTE_SYNCED, { parts: pulled });
          pulledRef.current?.(pulled);
        }
      } catch {
        // Offline, or the account could not be read or written. See above.
      } finally {
        running = false;
        if (again && alive) { again = false; run(); }
      }
    };

    run();
    const onStored = () => {
      clearTimeout(timer);
      timer = setTimeout(run, QUIET_MS);
    };
    window.addEventListener(TASTE_STORED, onStored);
    return () => {
      alive = false;
      clearTimeout(timer);
      window.removeEventListener(TASTE_STORED, onStored);
    };
  }, [me]);
}
