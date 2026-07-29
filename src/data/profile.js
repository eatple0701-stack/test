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
 */
export const RESTRICTIONS = ['pork', 'beef', 'chicken', 'shellfish'];

export const restrictionLabel = (r) => `No ${r}`;

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
  const fresh = { userId: newUserId(), name: '', nationality: '', languages: [] };
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
