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
          <h1 className="crash__title">This screen stopped responding.</h1>

          {translated ? (
            <p className="crash__body">
              Your browser is translating this page, and its translation rewrites
              the page while the app is using it. Turning translation off for this
              site will stop it happening. Nothing you saved has been lost.
            </p>
          ) : (
            <p className="crash__body">
              Something went wrong on this screen. Nothing you saved has been lost —
              your tables and your passport are still here.
            </p>
          )}

          <div className="crash__actions">
            {/* Back to a working screen without a reload where possible: the
                error is in one subtree, not in the stored data. */}
            <button className="crash__primary" onClick={() => this.setState({ error: null })}>
              다시 시도 · Try again
            </button>
            <button className="crash__secondary" onClick={() => window.location.reload()}>
              Reload the app
            </button>
          </div>

          <details className="crash__details">
            <summary>Technical detail</summary>
            <pre>{String(error?.stack ?? error?.message ?? error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}
