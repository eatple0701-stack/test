// Who the person using this browser is.
//
// A placeholder for auth, kept deliberately small. When Supabase logs people
// in, `userId` comes from the session and the rest becomes a profile row —
// the shape the screens read stays the same, so only this file changes.
//
// There is no verification here of any kind, and the plan's "인증 호스트"
// depends on real verification. Until that exists the badge must not appear:
// telling a traveller a stranger is vetted when nobody vetted them is the
// most damaging thing this app could get wrong.

const PROFILE_KEY = 'bapchingu-profile';

const newUserId = () => `u-${Math.random().toString(36).slice(2, 10)}`;

/**
 * What a traveller can rule out, in the exact vocabulary the menu catalog
 * uses in `contains`.
 *
 * Deliberately ingredients rather than diets. "Halal" and "Vegetarian" are
 * how people describe themselves, but they are not what the catalog records,
 * and translating between the two would mean this app deciding what somebody
 * else's rules permit — with a plate of pork riding on being right. Asking
 * which ingredients to flag is a question the data can actually answer.
 *
 * `fish` was missing, which mattered more here than the list length suggests:
 * the catalog's own description of 한정식 names grilled fish, and a traveller
 * had no way to say that was the thing they could not eat. Korean soup stock
 * is anchovy far more often than not, so it is also the ingredient hardest to
 * see coming from the name of a dish.
 */
export const RESTRICTIONS = ['pork', 'beef', 'chicken', 'fish', 'shellfish'];

export const restrictionLabel = (r) => `No ${r}`;

/**
 * How somebody describes their own eating, in their own word for it.
 *
 * The list above is ingredients on purpose, and that reasoning still holds
 * for anything the *app* asserts: this catalog cannot look at 한정식 and rule
 * on whether it is halal, and pretending otherwise puts a plate of pork on
 * the line. What the reasoning never justified was refusing to carry the word
 * at all — and refusing is what the app did.
 *
 * Three sources asked for the same thing. The business plan names 비건, 할랄,
 * 알레르기 as matching conditions. The reviewing 부장 asked for 사용자의 취향을
 * 입력받아 맞춤형. And a foreign tester, looking at the five ingredient boxes
 * that shipped this morning, wrote "Profile → add vegan, vegetarian".
 *
 * So this is a message, not a verdict. Nothing here filters a dish or clears
 * one. It travels with a seat request and is shown to the host, who is a
 * person who can answer a question the catalog cannot — which is exactly the
 * 문화 큐레이터 role the plan wrote for them.
 */
export const DIETS = [
  { id: 'vegetarian', kr: '베지테리언', en: 'Vegetarian' },
  { id: 'vegan', kr: '비건', en: 'Vegan' },
  { id: 'halal', kr: '할랄', en: 'Halal' },
  { id: 'kosher', kr: '코셔', en: 'Kosher' },
];

export const dietById = (id) => DIETS.find(d => d.id === id) ?? null;

/** Only ids this list knows, in list order so two profiles read alike. */
export const cleanDiets = (ids) =>
  Array.isArray(ids) ? DIETS.filter(d => ids.includes(d.id)).map(d => d.id) : [];

/**
 * The ingredients in this dish that the traveller has ruled out.
 * Empty means nothing to warn about.
 */
export function conflictsFor(menu, profile) {
  const avoids = profile?.avoids ?? [];
  if (avoids.length === 0 || !menu?.contains) return [];
  return menu.contains.filter(c => avoids.includes(c));
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.userId) return parsed;
    }
  } catch {
    // fall through to a fresh identity
  }
  const fresh = { userId: newUserId(), name: '', nationality: '', languages: [], gender: null };
  saveProfile(fresh);
  return fresh;
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Not durable in private mode; the session still works.
  }
  return profile;
}

export const hasName = (profile) => Boolean(profile?.name?.trim());
