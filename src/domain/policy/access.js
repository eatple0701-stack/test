// AccessPolicy — what needs an account, and what never should.
//
// The decision, made 2026-08-03: browsing is free, participating is not.
// The map, the dishes, the culture prose, the quiz, the phrases — a traveller
// standing in a station reading about 감자탕 owes this app nothing, and asking
// them to register before showing them a tip would lose exactly the people
// the pilot most wants to reach. But a seat at a table with strangers, and a
// Passport that remembers evenings, belong to somebody the team can reach —
// 매칭 시스템 관리 측면에서, in the words of the meeting that asked for this.
//
// Deliberately NOT verification. Email and phone are collected as contact
// information for running the pilot, not confirmed with codes — an SMS
// verification pipeline needs a paid provider and a business registration,
// and an email round-trip adds a step that filters out tired travellers.
// The team can see who signed up; that is the requirement, and this is the
// smallest thing that meets it.
//
// Three kinds of person can be holding the phone:
//
//   NONE       no session at all. Can browse everything client-side.
//   ANONYMOUS  a throwaway session the backend mints so table lists can be
//              read (RLS is `to authenticated`). Same powers as NONE from
//              the product's point of view — browsing.
//   MEMBER     signed up, with contact details on file. Can participate.

export const AUTH_KIND = {
  NONE: 'none',
  ANONYMOUS: 'anonymous',
  MEMBER: 'member',
};

export const isMember = (auth) => auth?.kind === AUTH_KIND.MEMBER;

/**
 * The doors that need a membership card.
 *
 * One list, so a new surface added next month can look up whether it gates
 * rather than each screen deciding for itself and drifting. Browsing surfaces
 * are deliberately absent — absence from this list is what "open to everyone"
 * means, and a test holds the list so it cannot grow silently.
 */
export const MEMBER_ONLY = [
  'join-table',      // asking for a seat
  'open-table',      // hosting one
  'request-table',   // 찾는 밥상 — asking the app to find one
  'passport',        // the record of evenings and people
];

export const requiresMember = (door) => MEMBER_ONLY.includes(door);

/** May this person walk through this door? */
export const canPass = (door, auth) =>
  !requiresMember(door) || isMember(auth);

/**
 * What the closed door says.
 *
 * Written once here rather than per-screen, and written as an invitation
 * rather than a refusal — the person reading it just tried to do the most
 * valuable thing in the app, and "log in required" is how products talk when
 * they have stopped imagining the person. The browsing reassurance is in
 * every variant on purpose: the professor's whole point about the front door
 * was that nobody should feel locked out of looking.
 *
 * The heading is `titleKr` + `titleEn` rather than one `title`, and that is a
 * repair rather than a style. There was a single `title`, in Korean, and the
 * signup sheet rendered it alone — so somebody who does not read Korean met
 * one Korean sentence at the exact moment the app asked them to hand over a
 * phone number, with the English reason sitting unrendered in this file. A
 * lone `title` is what made that easy; two named halves make a call site say
 * out loud that it is dropping one.
 */
export const GATE_TEXT = {
  'join-table': {
    titleKr: '자리를 요청하려면 가입이 필요해요',
    titleEn: 'Asking for a seat needs an account',
    titleEs: 'Pedir sitio requiere una cuenta',
    titleFr: "Demander une place demande un compte",
    body: 'A seat at a table is a promise to real people, so the team needs a way to reach you if plans change. Browsing every table, dish and tip stays open without an account.',
    bodyKo: '밥상의 한 자리는 실제 사람들에게 하는 약속이라, 일정이 바뀌면 연락할 방법이 필요합니다. 밥상과 요리와 정보를 둘러보는 건 계정 없이도 계속 열려 있어요.',
    bodyEs: 'Un sitio en una mesa es una promesa a personas reales, así que el equipo necesita una forma de avisarte si los planes cambian. Mirar las mesas, los platos y los consejos sigue abierto sin cuenta.',
    bodyFr: "Une place à table est une promesse faite à de vraies personnes, et l'équipe a donc besoin d'un moyen de vous joindre si les plans changent. Parcourir les tables, les plats et les conseils reste ouvert sans compte.",
    cta: '가입하고 계속 · Join and continue',
    ctaEs: 'Únete y continúa',
    ctaFr: "Rejoignez et continuez",
  },
  'open-table': {
    titleKr: '상을 차리려면 가입이 필요해요',
    titleEn: 'Opening a table needs an account',
    titleEs: 'Abrir una mesa requiere una cuenta',
    titleFr: "Ouvrir une table demande un compte",
    body: 'Hosting means strangers plan their evening around you, so hosts sign up first. Looking around does not need an account.',
    bodyKo: '호스트가 된다는 건 처음 보는 사람들이 당신을 기준으로 저녁 계획을 세운다는 뜻이라, 호스트는 먼저 가입합니다. 둘러보는 데는 계정이 필요 없어요.',
    bodyEs: 'Ser anfitrión significa que gente desconocida organiza su noche a tu alrededor, así que los anfitriones se registran primero. Mirar no necesita cuenta.',
    bodyFr: "Être hôte veut dire que des inconnus organisent leur soirée autour de vous : les hôtes s'inscrivent donc d'abord. Regarder ne demande pas de compte.",
    cta: '가입하고 계속 · Join and continue',
    ctaEs: 'Únete y continúa',
    ctaFr: "Rejoignez et continuez",
  },
  'request-table': {
    titleKr: '찾는 밥상은 가입 후에 쓸 수 있어요',
    titleEn: 'Telling us what you are after needs an account',
    titleEs: 'Decirnos qué buscas requiere una cuenta',
    titleFr: "Nous dire ce que vous cherchez demande un compte",
    body: 'When the app opens a table for you, somebody has to be reachable when a match lands. Browsing stays open without an account.',
    bodyKo: '앱이 대신 밥상을 열어 줄 때, 연결이 성사되면 연락이 닿는 사람이 있어야 합니다. 둘러보기는 계정 없이도 열려 있어요.',
    bodyEs: 'Cuando la app abre una mesa por ti, alguien tiene que estar localizable cuando llegue el encuentro. Mirar sigue abierto sin cuenta.',
    bodyFr: "Quand l'application ouvre une table pour vous, il faut que quelqu'un soit joignable au moment où la rencontre tombe. Parcourir reste ouvert sans compte.",
    cta: '가입하고 계속 · Join and continue',
    ctaEs: 'Únete y continúa',
    ctaFr: "Rejoignez et continuez",
  },
  // The one door that guards writing rather than looking. The Passport's
  // whole structure renders for a guest — profile on top, record below —
  // because seeing what the record would hold is the best argument for
  // keeping one. This gate stands where the keeping starts.
  passport: {
    titleKr: '나만의 프로필 · 패스포트 만들기',
    titleEn: 'Make your own profile and Passport',
    titleEs: 'Crea tu perfil y tu Pasaporte',
    titleFr: "Créez votre profil et votre Passeport",
    body: 'Your profile — name, languages, what you eat — is written once, while joining, and every table reads it from then on. The Passport below fills with your evenings as they happen. Looking around stays open without an account; making yours is one signup.',
    bodyKo: '프로필 — 이름, 쓰는 언어, 먹는 것 — 은 가입할 때 한 번만 적으면 그 뒤로 모든 밥상이 그것을 읽습니다. 아래 여권은 저녁이 하나씩 지나갈 때마다 채워져요. 둘러보기는 계정 없이도 되고, 내 것을 만드는 건 가입 한 번입니다.',
    bodyEs: 'Tu perfil — nombre, idiomas, lo que comes — se escribe una vez, al registrarte, y a partir de ahí lo lee cada mesa. El Pasaporte de abajo se va llenando con tus noches según ocurren. Mirar sigue abierto sin cuenta; hacerte el tuyo es un registro.',
    bodyFr: "Votre profil — nom, langues, ce que vous mangez — s'écrit une fois, à l'inscription, et chaque table le lit ensuite. Le Passeport ci-dessous se remplit de vos soirées à mesure qu'elles arrivent. Regarder reste ouvert sans compte ; avoir le vôtre tient à une inscription.",
    cta: '만들기 · Create mine',
    ctaEs: 'Crear el mío',
    ctaFr: "Créer le mien",
  },
};

export const gateText = (door) => GATE_TEXT[door] ?? GATE_TEXT['join-table'];

/**
 * What signing up asks for, and why each field is there.
 *
 * The list the meeting settled on — email, phone, name, birthdate — carried
 * here so the form and the storage cannot disagree about what exists.
 * `contact: true` marks the fields that are personal contact information:
 * they go to the members-only details table the RLS lets nobody else read,
 * never onto anything another traveller can see.
 */
export const SIGNUP_FIELDS = [
  { id: 'email', contact: true, label: '이메일 · Email' },
  { id: 'phone', contact: true, label: '전화번호 · Phone' },
  { id: 'name', contact: false, label: '이름 · Name' },
  { id: 'birthdate', contact: true, label: '생년월일 · Date of birth' },
];

/**
 * Problems with a signup, in the order the form shows its fields.
 *
 * Validation is shallow on purpose. The email is not verified and the phone
 * is not either — that is the product decision, not an oversight — so
 * checking anything beyond "looks like one" would be pretending to a rigour
 * the system does not have.
 *
 * Each problem carries the `field` it belongs to, so the form can put the
 * complaint next to the box that caused it. It used to return bare English
 * sentences and the sheet printed them as a bulleted list at the bottom:
 * measured 2026-08-04, an empty signup produced five lines naming five fields
 * with none of the five marked, on a sheet 849px tall inside a 721px window.
 * A person then had to match sentence to box by reading. Both languages are
 * here for the same reason the labels above the boxes have both.
 */
export function validateSignup({ email, phone, name, birthdate, password } = {}) {
  const problems = [];
  const bad = (field, kr, en) => problems.push({ field, kr, en });
  if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    bad('email', '이메일 주소를 입력해 주세요. 로그인 아이디로도 씁니다.',
      'Enter an email address — it doubles as your login ID.');
  }
  if (!password || password.length < 8) {
    bad('password', '비밀번호는 8자 이상이어야 해요.',
      'A password needs at least 8 characters.');
  }
  if (!name || !name.trim()) {
    bad('name', '밥상에서 부를 이름을 적어 주세요.',
      'Add the name people at a table should call you.');
  }
  if (!phone || !/^[+\d][\d\s-]{7,}$/.test(phone.trim())) {
    bad('phone', '연락받을 전화번호를 입력해 주세요.',
      'Enter a phone number the team could reach you on.');
  }
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    bad('birthdate', '생년월일을 골라 주세요.', 'Pick your date of birth.');
  } else {
    const at = new Date(`${birthdate}T00:00`);
    const now = new Date();
    if (!Number.isFinite(at.getTime()) || at.getTime() > now.getTime()) {
      bad('birthdate', '아직 오지 않은 날짜예요.', 'That date of birth has not happened yet.');
    }
  }
  return problems;
}

/** The fields a signin needs before it is worth a network round trip. */
export function validateSignin({ email, password } = {}) {
  const problems = [];
  // Shallower still than signup on purpose: an existing account's email was
  // already checked for shape the day it was made, and refusing to *send* a
  // login because the address looks odd would lock out anybody whose real
  // address this regex has not imagined. Empty is the only certain mistake —
  // and it was the one the backend answered with `missing email or phone`.
  if (!email || !email.trim()) {
    problems.push({ field: 'email', kr: '이메일을 입력해 주세요.', en: 'Enter your email.' });
  }
  if (!password) {
    problems.push({ field: 'password', kr: '비밀번호를 입력해 주세요.', en: 'Enter your password.' });
  }
  return problems;
}

/** Which boxes to mark, from a problem list. */
export const problemFields = (problems = []) =>
  Object.fromEntries(problems.map(p => [p.field, true]));
