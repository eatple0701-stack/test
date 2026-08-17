import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon, ClockIcon, MapPinIcon, CompassIcon, BowlIcon, MenuIcon } from './Icons';
import { useText, useLocale } from './localeText.js';
import { DISH_KO, groupsOf } from '../domain/catalog/dishGroups.js';
import { menusFor, menuName, menuPrice, formatWon } from '../data/seoulMenus.js';
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
  // The register's menu for this place, fetched when the page opens. Null
  // while loading and null when the register has none — the section simply
  // is not there in either case, because "loading" a static file from the
  // same host is not a state worth a spinner.
  const [menu, setMenu] = useState(null);
  useEffect(() => {
    let alive = true;
    setMenu(null);
    if (restaurant) menusFor(restaurant).then(m => { if (alive) setMenu(m); });
    return () => { alive = false; };
    // The id is the identity; the object is rebuilt per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);
  if (!restaurant) return null;

  const cta = tableCtaFor(restaurant, locale);
  const mapLinks = mapLinksFor(restaurant);
  const status = getOpenStatus(restaurant.hours, new Date(), locale);
  const today = todaysHours(restaurant.hours);
  const coords = coordsOf(restaurant);
  const dishes = restaurant.registry?.dishes ?? [];
  const groups = groupsOf(dishes);
  const shownMenu = menu ? menu.slice(0, 14) : [];
  const restCount = menu ? menu.length - shownMenu.length : 0;

  return (
    <div className="dish-sheet sheet-page registry-sheet" role="dialog" aria-label={restaurant.name}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onClose} aria-label="Close">
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="dish-sheet__title" translate="no" data-no-locale>{restaurant.name}</h1>
      </header>

      <div className="registry-sheet__body">
        {restaurant.photo && (
          <figure className="registry-sheet__photo">
            <img src={restaurant.photo} alt="" loading="lazy" referrerPolicy="no-referrer" />
            <figcaption>
              {say('Photo from the Seoul Tourism Foundation register', '서울관광재단 등록 사진', 'Foto del registro de la Fundación de Turismo de Seúl', 'Photo du registre de la Fondation du tourisme de Séoul', 'صورة من سجلّ مؤسسة سول للسياحة', '首尔观光财团登记照片', 'ソウル観光財団の登録写真')}
            </figcaption>
          </figure>
        )}
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
          </section>
        )}

        {shownMenu.length > 0 && (
          <section className="detail-section">
            <div className="section-head">
              <span className="section-head__icon" aria-hidden="true"><MenuIcon size={17} /></span>
              <h3>{say('The menu, as the register recorded it', '등록부에 기록된 메뉴', 'La carta, tal como consta en el registro', "La carte, telle que le registre l'a notée", 'القائمة كما دوّنها السجلّ', '登记信息里记录的菜单', '登録に記録された品書き')}</h3>
            </div>
            {/* Every line the register holds for this place, in the reader's
                language where the register wrote one. The Korean original
                stays under the translation because the menu on the wall — the
                one they will point at — is the Korean one. */}
            <ul className="registry-sheet__menu-list" translate="no" data-no-locale>
              {shownMenu.map((m, i) => (
                <li key={i}>
                  <span className="registry-sheet__menu-main">{menuName(m, locale)}</span>
                  {locale !== 'ko' && m[0] !== menuName(m, locale) && (
                    <span className="registry-sheet__menu-orig">{m[0]}</span>
                  )}
                  {menuPrice(m) > 0 && (
                    <span className="registry-sheet__menu-price">{formatWon(menuPrice(m), locale)}</span>
                  )}
                </li>
              ))}
            </ul>
            {shownMenu.some(m => menuPrice(m) > 0) && (
              <p className="registry-sheet__menu-note">
                {say('Prices as the register recorded them (2021–22) — today’s may differ.',
                  '가격은 등록부 기록(2021–22) 기준이라 지금과 다를 수 있습니다.',
                  'Precios tal como los anotó el registro (2021–22): los de hoy pueden variar.',
                  "Prix tels que notés au registre (2021–22) — ceux d'aujourd'hui peuvent différer.",
                  'الأسعار كما دوّنها السجلّ (2021–22) — وقد تختلف اليوم.',
                  '价格以登记信息（2021–22）为准，现在可能不同。',
                  '価格は登録記録（2021–22）時点のもので、現在は異なる場合があります。')}
              </p>
            )}
            {restCount > 0 && (
              <p className="registry-sheet__menu-more">
                {say(`And ${restCount} more lines on the register.`, `외 ${restCount}개.`,
                  `Y ${restCount} líneas más en el registro.`, `Et ${restCount} autres lignes au registre.`,
                  `و${restCount} سطرًا آخر في السجلّ.`, `登记信息里还有 ${restCount} 条。`,
                  `登録にはあと${restCount}品あります。`)}
              </p>
            )}
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
