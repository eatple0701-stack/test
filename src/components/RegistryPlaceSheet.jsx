import React from 'react';
import { ChevronLeftIcon, ClockIcon, MapPinIcon, CompassIcon, BowlIcon } from './Icons';
import { useText, useLocale } from './localeText.js';
import { DISH_KO, groupsOf } from '../domain/catalog/dishGroups.js';
import { tableCtaFor, mapLinksFor } from '../domain/policy/venue.js';
import { getOpenStatus, todaysHours, naverMapUrl, kakaoMapUrl, coordsOf } from '../utils';

// A place from the 서울관광재단 register, shown as exactly what it is.
//
// ── Why this is not RestaurantDetail ─────────────────────────────────────
//
// RestaurantDetail builds most of its page from `getCulture(restaurant)` —
// the category's origin story, its etiquette, its useful phrases, a Passport
// mission, a route to somewhere else. For the twenty curated places that is
// right, because somebody chose the category knowing what it would print.
//
// A register row's category is derived from its 업태 field, mechanically.
// Rendered through the same component, 치보치마 — an address nobody on this
// team has visited — printed "The best items sell out before noon", "One
// drink buys the seat", a mission telling a traveller to ask what came out
// of the oven this morning, and a walking route on to Gwangjang Market.
// Every line of it generated for that address by a category lookup, and
// every line of it reading as though somebody had checked.
//
// That is the exact failure this app's honesty rules exist to prevent, and
// gating a dozen sections inside an 800-line component would have left the
// next new section to inherit the bug. So the register gets its own sheet,
// and it can only render what the register actually holds.
//
// What it does keep: the address, the hours as recorded, the phone, the two
// map apps, and 상 차리기 — opening a table here is a real thing a person
// can do at any restaurant, and it is the one action that does not depend on
// us having been there.

export default function RegistryPlaceSheet({ restaurant, onClose, onOpenTable }) {
  const say = useText();
  const locale = useLocale();
  if (!restaurant) return null;

  const cta = tableCtaFor(restaurant, locale);
  const mapLinks = mapLinksFor(restaurant);
  const status = getOpenStatus(restaurant.hours, new Date(), locale);
  const today = todaysHours(restaurant.hours);
  const coords = coordsOf(restaurant);
  const dishes = restaurant.registry?.dishes ?? [];
  const groups = groupsOf(dishes);

  return (
    <div className="dish-sheet sheet-page registry-sheet" role="dialog" aria-label={restaurant.name}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onClose} aria-label="Close">
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="dish-sheet__title" translate="no" data-no-locale>{restaurant.name}</h1>
      </header>

      <div className="registry-sheet__body">
        {/* First, and not in small print at the bottom. Somebody who opened
            this expecting the page 발우공양 has needs to know in the first
            line why this one is shorter. */}
        <p className="registry-sheet__origin">
          {say(
            'This one is from a public register, not from us. It is here because the menu the Seoul Tourism Foundation recorded for it carries a dish you cannot order for one. Nobody here has eaten at it, so there is no story below — only what the register holds, which can be out of date, and menus change.',
            '이 장소는 저희가 쓴 것이 아니라 공공 등록 정보입니다. 서울관광재단이 기록한 메뉴에 혼자서는 주문할 수 없는 음식이 있어서 여기 있습니다. 저희가 가본 곳이 아니어서 아래에 이야기가 없고, 등록부에 있는 사실만 있으며 그마저 오래됐을 수 있고 메뉴는 바뀝니다.',
            'Este viene de un registro público, no de nosotros. Está aquí porque la carta que registró la Fundación de Turismo de Seúl incluye un plato que no se puede pedir para uno. Nadie de aquí ha comido en él, así que no hay historia debajo: solo lo que consta en el registro, que puede estar desactualizado, y las cartas cambian.',
            "Celui-ci vient d'un registre public, pas de nous. Il est là parce que la carte enregistrée par la Fondation du tourisme de Séoul comporte un plat qu'on ne commande pas pour une personne. Personne ici n'y a mangé : il n'y a donc pas de récit ci-dessous, seulement ce que contient le registre, qui peut dater, et les cartes changent.",
            'هذا المكان من سجلّ عامّ لا منّا. هو هنا لأنّ القائمة التي سجّلتها مؤسسة سول للسياحة تضمّ طبقًا لا يُطلب لشخص واحد. لم يأكل أحد منّا فيه، فلا حكاية أدناه — فقط ما في السجلّ، وقد يكون قديمًا، والقوائم تتغيّر.',
            '这一处来自公开登记信息，不是我们写的。它在这里，是因为首尔观光财团登记的菜单上有一道一个人点不了的菜。我们没有人在这里吃过，所以下面没有故事——只有登记信息，可能已经过时，菜单也会变。',
            'この店は私たちが書いたものではなく、公開されている登録情報です。ソウル観光財団が記録した品書きに、ひとりでは頼めない料理があるので載っています。私たちの誰も食べに行っていないので、以下に物語はありません。登録にある事実だけで、それも古くなっている場合があり、品書きは変わります。')}
        </p>

        {dishes.length > 0 && (
          <section className="detail-section">
            <div className="section-head">
              <span className="section-head__icon" aria-hidden="true"><BowlIcon size={17} /></span>
              <h3>{say('Why this one is here', '이 집이 여기 있는 이유', 'Por qué está aquí', 'Pourquoi il est ici', 'لماذا هو هنا', '它为什么在这里', 'この店がここにある理由')}</h3>
            </div>
            <div className="registry-sheet__groups">
              {groups.map(g => (
                <span key={g.id} className="registry-sheet__group" style={{ background: g.tint }}>
                  {g.emoji} {say(g.en, g.ko, g.es, g.fr, g.ar, g.zh, g.ja)}
                </span>
              ))}
            </div>
            <p className="registry-sheet__menu" translate="no" data-no-locale>
              {dishes.map(d => DISH_KO[d]).filter(Boolean).join(' · ')}
            </p>
            <p className="registry-sheet__menu-note">
              {say('On its menu in the register — not a recommendation, and not checked this week.',
                '등록부의 메뉴에 있는 항목입니다. 추천이 아니고, 이번 주에 확인한 것도 아닙니다.',
                'Consta en su carta en el registro: no es una recomendación, y no se ha comprobado esta semana.',
                "Figure à sa carte dans le registre — ce n'est pas une recommandation, et ce n'a pas été vérifié cette semaine.",
                'مذكور في قائمته بالسجلّ — ليس ترشيحًا، ولم يُتحقَّق منه هذا الأسبوع.',
                '登记信息的菜单上有——这不是推荐，也不是本周核实过的。',
                '登録の品書きに載っています。おすすめではなく、今週確認したものでもありません。')}
            </p>
          </section>
        )}

        <section className="detail-section">
          <div className="section-head">
            <span className="section-head__icon" aria-hidden="true"><ClockIcon size={17} /></span>
            <h3>{say('What the register holds', '등록부에 있는 것', 'Lo que consta en el registro', 'Ce que contient le registre', 'ما في السجلّ', '登记信息里有的', '登録にあること')}</h3>
          </div>
          <ul className="registry-sheet__facts">
            <li>
              <span className="registry-sheet__key">{say('Address', '주소', 'Dirección', 'Adresse', 'العنوان', '地址', '住所')}</span>
              <span translate="no">{restaurant.address?.value}</span>
            </li>
            {restaurant.hours?.value?.raw && (
              <li>
                <span className="registry-sheet__key">{say('Hours', '영업시간', 'Horario', 'Horaires', 'أوقات العمل', '营业时间', '営業時間')}</span>
                <span translate="no">{restaurant.hours.value.raw}</span>
              </li>
            )}
            {status?.label && (
              <li>
                <span className="registry-sheet__key">{say('Right now', '지금', 'Ahora mismo', 'En ce moment', 'الآن', '现在', '今')}</span>
                <span>{status.label}{today ? ` · ${today}` : ''}</span>
              </li>
            )}
            {restaurant.phone?.value && (
              <li>
                <span className="registry-sheet__key">{say('Phone', '전화', 'Teléfono', 'Téléphone', 'الهاتف', '电话', '電話')}</span>
                <a className="practical-link" href={`tel:${restaurant.phone.value}`} translate="no">{restaurant.phone.value}</a>
              </li>
            )}
            {restaurant.registry?.kind && (
              <li>
                <span className="registry-sheet__key">{say('Listed as', '등록 업태', 'Registrado como', 'Enregistré comme', 'مسجَّل بوصفه', '登记类别', '登録の業態')}</span>
                <span translate="no">{restaurant.registry.kind}</span>
              </li>
            )}
          </ul>
        </section>

        <section className="detail-section">
          <div className="section-head">
            <span className="section-head__icon" aria-hidden="true"><MapPinIcon size={17} /></span>
            <h3>{say('Getting there', '가는 길', 'Cómo llegar', 'Y aller', 'الوصول إليه', '怎么去', '行き方')}</h3>
          </div>
          {/* The same handover the curated pages make: the reviews, the
              photographs and the walking directions are in the map apps,
              kept current by somebody else. */}
          <div className="registry-sheet__links">
            <a className="registry-sheet__link" href={naverMapUrl(restaurant)} target="_blank" rel="noreferrer">
              {say('Naver Map', '네이버 지도', 'Naver Map', 'Naver Map', 'خرائط نيفر', 'Naver 地图', 'Naver 地図')}
            </a>
            <a className="registry-sheet__link" href={kakaoMapUrl(restaurant)} target="_blank" rel="noreferrer">
              {say('Kakao Map', '카카오맵', 'Kakao Map', 'Kakao Map', 'خرائط كاكاو', 'Kakao 地图', 'Kakao マップ')}
            </a>
          </div>
          {mapLinks.length === 0 && !Number.isFinite(coords.lat) && (
            <p className="section-note">
              {say('The register gave no usable coordinates for this one.', '이 장소는 등록부에 쓸 만한 좌표가 없습니다.', 'El registro no da coordenadas utilizables para este.', "Le registre ne donne pas de coordonnées exploitables pour celui-ci.", 'لم يعطِ السجلّ إحداثيات صالحة لهذا المكان.', '登记信息里没有可用的坐标。', 'この店については使える座標が登録にありません。')}
            </p>
          )}
        </section>

        {/* The one action that does not need us to have been here. */}
        <button className="dish-sheet__cta" onClick={() => onOpenTable?.(restaurant)}>
          <CompassIcon size={16} /> {cta.title}
        </button>
        <p className="registry-sheet__source">
          {say('Source', '출처', 'Fuente', 'Source', 'المصدر', '来源', '出典')}{': '}
          <a className="practical-link" href={restaurant.address?.url ?? 'https://www.data.go.kr/data/15097605/openapi.do'} target="_blank" rel="noreferrer">
            {restaurant.address?.source}
          </a>
        </p>
      </div>
    </div>
  );
}
