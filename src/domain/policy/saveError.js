// What a failed write says, in every language the app offers.
//
// The sibling of AuthErrorPolicy, for everything that is not a door: taking a
// seat, opening a table, saving a review, uploading a photo. Measured
// 2026-08-04, every one of those printed a bare English sentence — "Somebody
// just took the last seat." — under labels written in two languages.
//
// Unlike the auth path, this one classifies text that has already been
// through `friendlyError` in src/data/tableMapping.js, which turns a Postgres
// error into one of four sentences. That is deliberate rather than lazy: those
// four are a closed set, matching them is exact, and rewriting twenty-six call
// sites to carry raw errors would be a large change for the same result. The
// raw database signals are matched too, so this keeps working if a future
// caller stops translating first.
//
// The honesty rule from ReportPolicy applies here as well. "Somebody just
// took the last seat" is a fact about the table. "That did not save" is an
// admission that we do not know which end failed — and it must keep saying
// so rather than inventing a cause.

const KNOWN = [
  {
    id: 'full',
    match: /took the last seat|table_full/i,
    kr: '방금 마지막 자리가 나갔어요.',
    en: 'Somebody just took the last seat.',
    es: 'Acaban de ocupar el último sitio.',
    fr: 'Quelqu\'un vient de prendre la dernière place.',
    ar: 'أخذ أحدهم آخر مقعد للتوّ.',
    zh: '最后一个位子刚被人占了。',
    ja: '最後の一席が今しがた埋まりました。',
  },
  {
    id: 'duplicate',
    match: /already have a seat|duplicate key|unique/i,
    kr: '이미 이 밥상에 자리가 있어요.',
    en: 'You already have a seat at this table.',
    es: 'Ya tienes un sitio en esta mesa.',
    fr: 'Vous avez déjà une place à cette table.',
    ar: 'لديك مقعد في هذه المائدة بالفعل.',
    zh: '你在这张饭桌上已经有位子了。',
    ja: 'この食卓にはすでに席があります。',
  },
  {
    id: 'gone',
    match: /no longer here|table_not_found/i,
    kr: '이 밥상은 사라졌어요.',
    en: 'This table is no longer here.',
    es: 'Esta mesa ya no existe.',
    fr: "Cette table n'existe plus.",
    ar: 'لم تعد هذه المائدة موجودة.',
    zh: '这张饭桌已经没有了。',
    ja: 'この食卓はもうありません。',
  },
  {
    id: 'denied',
    // 42501 — RLS said no. Almost always a schema that has not caught up,
    // which is a thing the team can fix and the traveller cannot.
    match: /42501|insufficient_privilege|row-level security|violates row/i,
    kr: '지금은 이 작업을 할 수 없어요. 팀에 알려 주세요.',
    en: 'The server refused this one. Nothing you did wrong — tell the team.',
    es: 'El servidor lo ha rechazado. No has hecho nada mal: avisa al equipo.',
    fr: "Le serveur a refusé. Vous n'avez rien fait de mal — prévenez l'équipe.",
    ar: 'رفض الخادم هذه العملية. لم تخطئ في شيء — أخبر الفريق.',
    zh: '服务器拒绝了这次操作。不是你的问题——告诉团队一声。',
    ja: 'サーバーが受け付けませんでした。あなたのせいではありません——チームにお知らせください。',
  },
  {
    id: 'photos-off',
    match: /photos are not switched on|bucket/i,
    kr: '사진 기능이 아직 켜지지 않았어요.',
    en: 'Photo uploads are not switched on for this project yet.',
    es: 'La subida de fotos todavía no está activada en este proyecto.',
    fr: "L'envoi de photos n'est pas encore activé sur ce projet.",
    ar: 'رفع الصور غير مفعَّل في هذا المشروع بعد.',
    zh: '这个项目还没打开照片上传。',
    ja: 'この企画では写真のアップロードがまだ有効になっていません。',
  },
  {
    id: 'network',
    match: /failed to fetch|networkerror|network request failed|load failed|check your connection/i,
    kr: '연결이 끊겼어요. 인터넷을 확인하고 다시 시도해 주세요.',
    en: 'Could not reach the server. Check your connection and try again.',
    es: 'No se ha podido conectar. Comprueba tu conexión e inténtalo otra vez.',
    fr: 'Serveur injoignable. Vérifiez votre connexion et réessayez.',
    ar: 'تعذّر الوصول إلى الخادم. تحقّق من اتصالك وحاول مرّة أخرى.',
    zh: '连不上服务器。检查一下网络再试。',
    ja: 'サーバーに届きませんでした。接続を確認して、もう一度お試しください。',
  },
];

export const SAVE_FALLBACK = {
  id: 'unknown',
  kr: '저장되지 않았어요. 다시 시도해 주세요.',
  en: 'That did not save. Try again, or tell the team if it keeps happening.',
  es: 'No se ha guardado. Inténtalo otra vez, y avisa al equipo si sigue pasando.',
  fr: "Ça n'a pas été enregistré. Réessayez, et prévenez l'équipe si ça persiste.",
  ar: 'لم يُحفظ. حاول مرّة أخرى، وأخبر الفريق إن تكرّر الأمر.',
  zh: '没有保存成功。再试一次，要是一直这样就告诉团队。',
  ja: '保存できませんでした。もう一度お試しください。続くようならチームにお知らせください。',
};

/** A caught write failure, turned into two lines somebody can read. */
export function saveError(err) {
  if (err === null || err === undefined) return null;
  const text = [
    typeof err === 'string' ? err : '',
    err?.message ?? '',
    err?.details ?? '',
    err?.code ?? '',
  ].join(' ').trim();
  if (!text) return { ...SAVE_FALLBACK, raw: '' };
  const hit = KNOWN.find(k => k.match.test(text));
  return hit
    ? { id: hit.id, kr: hit.kr, en: hit.en, es: hit.es, fr: hit.fr, ar: hit.ar, zh: hit.zh, ja: hit.ja, raw: text }
    : { ...SAVE_FALLBACK, raw: text };
}

export const saveErrorText = (err) => {
  const e = saveError(err);
  return e ? `${e.kr} · ${e.en}` : null;
};

export const SAVE_ERROR_IDS = [...KNOWN.map(k => k.id), SAVE_FALLBACK.id];
