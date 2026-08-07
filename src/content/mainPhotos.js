// The Main page's photographs — currently none, and honestly so.
//
// The Meetup landing this page is styled on fills its hero with photographs
// of real people at real gatherings. We have no such photographs yet: the
// stock ones this repo once shipped were somebody else's travel, loaded from
// somebody else's server, and they were removed on 2026-08-05 for both
// reasons. Until the team's own photos exist, the hero renders the dish
// names as typography — which is at least true.
//
// To put photos in (the owner intends to supply them):
//
//   1. Drop the image files into  public/photos/   (create the folder).
//      Keep them under ~300 kB each — this app boots in basements.
//   2. Add one entry per photo below, e.g.
//        { src: '/photos/table-0806.jpg', alt: 'Six people sharing samgyeopsal', label: '삼겹살' },
//   3. Nothing else. The hero switches from typography to the collage the
//      moment this array is non-empty.
//
// `alt` is not optional decoration: it is what a screen reader speaks and
// what renders if a file goes missing. `label` is the chip pinned on the
// photo, the way Meetup pins 당신 근처 on its collage — omit it and no chip
// renders. Local files only; the service worker passes external hosts
// straight through, so a hotlinked photo is a broken image on exactly the
// connection that needs the cache.

export const MAIN_PHOTOS = [];
