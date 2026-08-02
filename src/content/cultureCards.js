// The eight one-line culture cards, shared by the CultureCards viewer and by
// the Places teaser row that links into it — kept in one place so the two
// surfaces cannot drift into contradicting each other.
//
// Split out of CultureCards.jsx because a module that exports both a component
// and a constant breaks fast refresh: editing the copy reloaded the whole tree
// instead of the component.
//
// Deliberately qualitative. Nothing here carries a number, a date or a
// superlative, because this file has no source registry behind it the way
// quiz.js does — see src/content/sources.js. If a card ever needs to make a
// checkable claim, source it there first.
export const CULTURE_CARDS = [
  { title: 'Kimchi', desc: 'A staple in Korean cuisine, is a traditional side dish of salted and fermented vegetables.' },
  { title: 'Hanjeongsik', desc: 'A full-course Korean meal with an array of savory side dishes.' },
  { title: 'Temple Cuisine', desc: 'Buddhist temple food that is vegan and avoids five pungent vegetables.' },
  { title: 'Makgeolli', desc: 'A traditional slightly sweet and milky Korean rice wine.' },
  { title: 'Korean BBQ Etiquette', desc: 'Usually the youngest grills. Pour drinks with two hands.' },
  { title: 'Drinking Culture', desc: 'When clinking glasses, the younger person keeps their glass slightly lower.' },
  { title: 'Street Food', desc: 'Tteokbokki, Hotteok, Odeng — good late-night food, and usually eaten standing up.' },
  // "Jeonju for Bibimbap" is about where to eat the famous local version, not
  // about where the dish began — the quiz answers that second question with a
  // flat no, and the two must not be read as contradicting each other.
  { title: 'Regional Foods', desc: 'Jeonju for its bibimbap, Jeju for black pork, Busan for seafood.' },
];
