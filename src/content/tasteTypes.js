// The eight types the deck can produce, and the three axes they are made of.
//
// Named rather than described. Each type carries one name; what it is made of
// is shown beside it as the three poles it came from, because those are the
// thing that was actually measured. A paragraph explaining a type would be a
// paragraph nobody asked for in a screen whose whole argument is that reading
// is what a traveller cannot be relied on to do.
//
// Korean first here because the names were written in Korean. The other six
// are translations of those, not separate inventions — a reader in Spanish
// and a reader in Korean are being told the same thing about themselves.
//
// Nothing here claims anything about Korea, which is why this file carries no
// sources: a type is a reading of somebody's own fourteen answers, not a fact
// about a dish. The dishes' own facts stay in menus.js, where they are cited.

/** The poles, in the order the code writes them. */
export const TASTE_POLES = {
  hot: { ko: '매운 쪽', en: 'toward heat', es: 'hacia el picante', fr: 'vers le piquant',
    ar: 'نحو الحرّ', zh: '偏辣', ja: '辛い方へ' },
  mild: { ko: '순한 쪽', en: 'toward mild', es: 'hacia lo suave', fr: 'vers la douceur',
    ar: 'نحو اللطيف', zh: '偏温和', ja: '穏やかな方へ' },
  table: { ko: '식탁에서 익히는', en: 'cooked at the table', es: 'cocinado en la mesa',
    fr: 'cuit à table', ar: 'يُطهى على المائدة', zh: '在桌上煮', ja: '食卓で火を通す' },
  served: { ko: '차려 나오는', en: 'brought ready', es: 'servido ya hecho',
    fr: 'servi tout prêt', ar: 'يُقدَّم جاهزًا', zh: '端上桌即食', ja: '出来上がって出てくる' },
  open: { ko: '폭넓게', en: 'widely', es: 'con amplitud', fr: 'largement',
    ar: 'باتّساع', zh: '来者不拒', ja: '幅広く' },
  picky: { ko: '가려서', en: 'selectively', es: 'con criterio', fr: 'avec sélection',
    ar: 'بانتقاء', zh: '有挑选', ja: '選んで' },
};

/**
 * The eight names, by code.
 *
 * "~하는 사람" throughout, because that is what the deck answered: not what
 * somebody is, but what they did with fourteen cards.
 */
export const TASTE_TYPES = {
  HTO: {
    ko: '불 앞에 앉아 다 굽는 사람',
    en: 'Sits at the fire and grills all of it',
    es: 'Se sienta al fuego y lo asa todo',
    fr: 'S’installe au feu et fait tout griller',
    ar: 'يجلس عند النار ويشوي كلّ شيء',
    zh: '坐在火前，什么都烤',
    ja: '火の前に座って何でも焼く人',
  },
  HTP: {
    ko: '매운 불판만 찾는 사람',
    en: 'Comes for the hot grill and nothing else',
    es: 'Viene por la parrilla picante y nada más',
    fr: 'Vient pour le gril piquant et rien d’autre',
    ar: 'يأتي من أجل المشواة الحارّة وحدها',
    zh: '只奔着辣的铁板来',
    ja: '辛い鉄板だけを探す人',
  },
  HSO: {
    ko: '매운 상이면 다 좋은 사람',
    en: 'Happy with any spread, so long as it bites',
    es: 'Feliz con cualquier mesa, si pica',
    fr: 'Content de toute table, pourvu qu’elle pique',
    ar: 'يرضى بأيّ مائدة ما دامت حارّة',
    zh: '只要够辣，什么桌都好',
    ja: '辛ければどんな一膳でもいい人',
  },
  HSP: {
    ko: '매운 한 접시를 고르는 사람',
    en: 'Picks one hot dish and means it',
    es: 'Elige un plato picante y lo dice en serio',
    fr: 'Choisit un plat piquant, et le pense',
    ar: 'يختار طبقًا حارًّا واحدًا ويعنيه',
    zh: '挑一道辣的，认真的',
    ja: '辛い一皿を選びとる人',
  },
  MTO: {
    ko: '같이 익히면 뭐든 좋은 사람',
    en: 'In for anything that cooks between you',
    es: 'Se apunta a todo lo que se cocina entre ambos',
    fr: 'Partant pour tout ce qui cuit entre vous',
    ar: 'يقبل كلّ ما يُطهى بينكم',
    zh: '只要是一起煮的，都行',
    ja: '一緒に火を通すなら何でもいい人',
  },
  MTP: {
    ko: '순한 불판을 고르는 사람',
    en: 'Wants the grill, not the heat',
    es: 'Quiere la parrilla, no el picante',
    fr: 'Veut le gril, pas le piquant',
    ar: 'يريد المشواة لا الحرارة',
    zh: '要铁板，不要辣',
    ja: '鉄板は好き、辛さは別の人',
  },
  MSO: {
    ko: '차려주면 다 먹는 사람',
    en: 'Eats whatever arrives at the table',
    es: 'Come lo que llegue a la mesa',
    fr: 'Mange tout ce qui arrive sur la table',
    ar: 'يأكل كلّ ما يصل إلى المائدة',
    zh: '端上来什么都吃',
    ja: '出されたものは何でも食べる人',
  },
  MSP: {
    ko: '조용한 한 상을 고르는 사람',
    en: 'Chooses one quiet spread',
    es: 'Elige una mesa tranquila',
    fr: 'Choisit une table tranquille',
    ar: 'يختار مائدة هادئة',
    zh: '挑一桌安静的',
    ja: '静かな一膳を選ぶ人',
  },
};

/** Every code the deck can produce, for the test that walks them. */
export const TASTE_CODES = Object.keys(TASTE_TYPES);
