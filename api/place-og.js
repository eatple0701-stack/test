// The link preview a shared place deserves.
//
// The dissemination plan names /places/:slug alongside /tables/:id, and
// until now a crawler asking for either a place or the Places tab got the
// same static index.html the homepage returns: one generic card, and an
// og:url claiming to be the site root. Twenty different restaurants, and
// twenty identical previews.
//
// This is the sibling of api/table-og.js, and it is deliberately duller.
// A table changes — seats fill, it gets cancelled — so that function calls
// Supabase on every request. A place does not: the twenty curated records
// and the 8,118 register rows are both in the build, so this reads them
// straight and never touches the network.
//
// ── The rule that shapes this file ──────────────────────────────────────
//
// CLAUDE.md rule 3: a register place (`seoul-` ids) renders only what the
// register holds, never curated prose. That rule exists because rendering
// register rows through the curated component printed invented café
// atmospherics for addresses nobody had visited. An OG card is exactly the
// surface where that would come back — it is a description field wanting a
// nice sentence — so the two kinds are answered separately below, and a
// register place gets its district and its dishes and nothing else.
//
// Language: a crawler sends no locale worth trusting, so this answers in
// English, which is the app's own say() fallback.

import { restaurants } from '../src/data/restaurants.js';
import { isQuarantined } from '../src/data/verification.js';
import { isRegistryPlace } from '../src/data/seoulRegistry.js';
import { groupsOf } from '../src/domain/catalog/dishGroups.js';
import { site, page, beginHtml, FALLBACK } from './_og.js';

/** The romanised half of "Balwoo Gongyang (발우공양)", as the app shows it. */
const roman = (name) => String(name ?? '').split('(')[0].trim();

const curatedCard = (p) => ({
  title: `${roman(p.name)} · ${p.zone} — 밥친구 Eatple`,
  // The place's own recorded line, verbatim. Nothing is written for the
  // card: an OG description is the easiest place in a codebase to slip an
  // unsourced sentence past a review, because nobody reads it on screen.
  description: p.vibe || FALLBACK.description,
});

const registryCard = (p) => {
  const groups = groupsOf(p.registry?.dishes ?? []);
  const dishes = groups.map(g => g.en).join(' · ');
  return {
    title: `${p.name} · ${p.zone} — 밥친구 Eatple`,
    // Where it is and what its own menu carries — the two things the
    // register actually knows. The provenance is said out loud, because a
    // card that reads like a recommendation from us would be one.
    description: dishes
      ? `${dishes}. From Seoul's public food-tourism register — nobody here has been to this one.`
      : "From Seoul's public food-tourism register — nobody here has been to this one.",
  };
};

/** The Places tab itself, when somebody shares the list rather than a place. */
const indexCard = () => {
  const kept = restaurants.filter(r => !isQuarantined(r)).length;
  return {
    title: 'Places · 밥친구 Eatple',
    description: `${kept} places we went to and wrote up, and thousands more from Seoul's public register — filtered to the dishes you cannot order alone.`,
  };
};

export default async function handler(req, res) {
  const id = req.query?.id;
  const url = id ? `${site()}/places/${encodeURIComponent(id)}` : `${site()}/places`;
  // A place does not change between deploys, so this may be cached hard —
  // unlike a table, whose seat count ages in minutes.
  beginHtml(res, 86400);

  let card = id ? FALLBACK : indexCard();
  try {
    if (id) {
      const p = restaurants.find(r => r.id === id);
      // A quarantined place is one the app itself refuses to open — see
      // openDetail in App.jsx. A link to it must not preview as though it
      // were there.
      if (p && !isQuarantined(p)) {
        card = isRegistryPlace(p) ? registryCard(p) : curatedCard(p);
      }
      // A `seoul-` id is not in the bundle — the register is 8,118 rows
      // fetched at runtime, and loading a quarter of a megabyte per preview
      // to name one restaurant is the wrong trade. It falls back to the
      // generic card, which is honest: the link still opens the right place
      // in the app, and the preview does not claim to know which.
    }
  } catch {
    // Never 500 at a chat app's scraper — a preview that errors shows
    // nothing at all, which is worse than showing the generic card.
  }
  res.status(200).send(page(card, url));
}
