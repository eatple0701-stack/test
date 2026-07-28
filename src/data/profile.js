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
