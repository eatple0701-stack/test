import React from 'react';

// The last line of defence, for an app whose users translate it.
//
// Every traveller this is built for arrives with a browser offering to render
// it in their own language, and Chrome's translator rewrites the DOM
// underneath React — it replaces text nodes with <font> wrappers instead of
// editing them in place. When React later removes a node it remembers, that
// node is gone and it throws NotFoundError, taking the whole screen with it.
//
// The fragile spots are worth fixing one by one, and one has been. But
// promising there are no others would be a promise about somebody else's
// software running in a browser we do not control. So a crash lands here
// instead of on a blank page, and the traveller gets a way back rather than
// losing the table they were about to join.

// This is a class component, so it cannot call useText() — and it is the one
// screen that must not depend on anything, because it is what renders when
// something else has already failed. It reads the attribute LocaleFilter puts
// on <html> instead: no context, no hook, no import that could itself throw.
// If the attribute is missing the crash screen is English, which is the same
// fallback everything else uses.
const crashText = (en, ko, es, fr, ar, zh, ja) => {
  const locale = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-locale')
    : null;
  if (locale === 'ko') return ko;
  if (locale === 'es') return es;
  if (locale === 'fr') return fr;
  if (locale === 'ar') return ar;
  if (locale === 'zh') return zh;
  if (locale === 'ja') return ja;
  return en;
};

// The translator conflict has a recognisable signature, and saying so is more
// use than "something went wrong" — the reader can act on it.
const isTranslationConflict = (error) => {
  const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
  return /NotFoundError/.test(text) && /removeChild|insertBefore/.test(text);
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Kept for the pilot: if this fires during a real table on 17 August, the
    // console is the only record of what happened.
    console.error('[밥친구] recovered from a crash', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const translated = isTranslationConflict(error);

    return (
      <div className="crash" role="alert">
        <div className="crash__card">
          <span className="crash__kr" aria-hidden="true">밥친구</span>
          <h1 className="crash__title">
            {crashText('This screen stopped responding.',
              '이 화면이 멈췄어요.',
              'Esta pantalla ha dejado de responder.', 'Cet écran ne répond plus.', 'توقّفت هذه الشاشة عن الاستجابة.', '这个页面没有反应了。', 'この画面が応答しなくなりました。')}
          </h1>

          {translated ? (
            <p className="crash__body">
              {crashText(
                'Your browser is translating this page, and its translation rewrites the page while the app is using it. Turning translation off for this site will stop it happening. Nothing you saved has been lost.',
                '브라우저가 이 페이지를 번역하고 있고, 그 번역이 앱이 쓰는 중인 화면을 다시 씁니다. 이 사이트에서 번역을 꺼 두시면 더 일어나지 않습니다. 저장하신 것은 아무것도 사라지지 않았어요.',
                'Tu navegador está traduciendo esta página, y su traducción reescribe la página mientras la app la está usando. Desactivar la traducción para este sitio lo evitará. No se ha perdido nada de lo que guardaste.',
                "Votre navigateur traduit cette page, et sa traduction réécrit la page pendant que l'application s'en sert. Désactiver la traduction pour ce site suffit à l'empêcher. Rien de ce que vous avez enregistré n'a été perdu.",
                'متصفّحك يترجم هذه الصفحة، وترجمته تعيد كتابة الصفحة بينما التطبيق يستعملها. وإيقاف الترجمة لهذا الموقع يكفي لمنع ذلك. ولم يضع شيء ممّا حفظته.',
                '你的浏览器正在翻译这个页面，而它的翻译会在应用正用着页面的时候把页面重写一遍。对这个网站关掉翻译就不会再发生。你保存过的东西一样都没丢。',
                'ブラウザがこのページを翻訳していて、その翻訳がアプリの使っている画面を書き換えています。このサイトで翻訳を切れば起きなくなります。保存したものは何も失われていません。',
              )}
            </p>
          ) : (
            <p className="crash__body">
              {crashText(
                'Something went wrong on this screen. Nothing you saved has been lost — your tables and your passport are still here.',
                '이 화면에서 문제가 생겼습니다. 저장하신 것은 아무것도 사라지지 않았어요 — 밥상도 여권도 그대로 있습니다.',
                'Algo ha fallado en esta pantalla. No se ha perdido nada de lo que guardaste: tus mesas y tu pasaporte siguen aquí.',
                "Quelque chose s'est mal passé sur cet écran. Rien de ce que vous avez enregistré n'a été perdu — vos tables et votre passeport sont toujours là.",
                'حدث خلل في هذه الشاشة. ولم يضع شيء ممّا حفظته — موائدك وجواز سفرك ما زالت هنا.',
                '这个页面出错了。你保存过的东西一样都没丢——你的饭桌和护照都还在。',
                'この画面で問題が起きました。保存したものは何も失われていません——食卓もパスポートもそのままです。',
              )}
            </p>
          )}

          <div className="crash__actions">
            {/* Back to a working screen without a reload where possible: the
                error is in one subtree, not in the stored data. */}
            <button className="crash__primary" onClick={() => this.setState({ error: null })}>
              {crashText('다시 시도 · Try again', '다시 시도', 'Reintentar', 'Réessayer', 'حاول مرة أخرى', '再试一次', 'もう一度試す')}
            </button>
            <button className="crash__secondary" onClick={() => window.location.reload()}>
              {crashText('Reload the app', '앱 새로고침', 'Recargar la app', "Recharger l'application", 'أعِد تحميل التطبيق', '重新加载应用', 'アプリを読み込み直す')}
            </button>
          </div>

          <details className="crash__details">
            <summary>{crashText('Technical detail', '기술적 상세', 'Detalle técnico', 'Détail technique', 'تفصيل تقني', '技术细节', '技術的な詳細')}</summary>
            <pre>{String(error?.stack ?? error?.message ?? error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}
