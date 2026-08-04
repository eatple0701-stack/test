// 밥친구 화면 감사기 v3
//
// v1/v2가 왜 틀렸는지 두 가지를 고쳤다.
//
// 1) 범위. 계속 '.content-region'을 감사했는데, 장소 상세는 그 바깥에 뜨는
//    .detail-sheet 모달이다. 즉 모달 뒤에 깔린 목록을 재고 "장소 상세 검증
//    완료"라고 보고했다. 이제 열려 있는 최상단 레이어를 스스로 찾는다.
// 2) 색. color-mix()는 color(srgb 0.96 …) 0~1 값을 내는데 255로 나눴다.
//
// 그리고 v3는 하나를 더 본다: 깊이. 기능이 있느냐가 아니라 닿을 수 있느냐다.

(() => {
  const rgb = (c) => {
    if (!c) return null;
    const n = (c.match(/-?[\d.]+/g) || []).map(Number);
    return /^color\(/.test(c)
      ? [n[0] * 255, n[1] * 255, n[2] * 255, n.length > 3 ? n[3] : 1]
      : [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n.length > 3 ? n[3] : 1];
  };
  const lum = (r, g, b) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (fg, bg) => {
    const a = lum(fg[0], fg[1], fg[2]), b = lum(bg[0], bg[1], bg[2]);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };

  // offsetParent 는 position:fixed 요소에서 null 이다. .detail-sheet 이 바로
  // 그래서, 이걸로 보이는지 판정하면 모달이 통째로 없는 것처럼 보인다 —
  // v3 첫 판이 그 이유로 또 목록을 감사했다.
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // 화면에서 실제로 보이는 최상단 레이어. 모달이 열려 있으면 모달을,
  // 아니면 탭 본문을. 이걸 사람이 고르게 두면 또 틀린다.
  const surface = () => {
    const layers = [
      '.auth-sheet', '.report-panel', '.map-overlay',
      '.detail-sheet', '.sheet-page', '.auth-backdrop',
      '[role="dialog"]', '.content-region',
    ];
    for (const sel of layers) {
      const el = document.querySelector(sel);
      if (el && visible(el) && el.getBoundingClientRect().height > 100) {
        return { el, name: sel };
      }
    }
    return { el: document.body, name: 'body' };
  };

  const bgOf = (el) => {
    let e = el, stack = [];
    while (e && e !== document.documentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== 'none') return null;      // 그라디언트는 판정 불가
      const c = rgb(s.backgroundColor);
      if (c[3] > 0) { stack.push(c); if (c[3] >= 1) break; }
      e = e.parentElement;
    }
    if (!stack.length) return [255, 255, 255];
    let out = stack.pop().slice(0, 3);
    while (stack.length) {
      const [r, g, b, a] = stack.pop();
      out = [a * r + (1 - a) * out[0], a * g + (1 - a) * out[1], a * b + (1 - a) * out[2]];
    }
    return out;
  };

  // ::before/::after 로 넓힌 히트 영역을 인정한다 (index.css의 Touch targets 절).
  const hit = (el) => {
    const r = el.getBoundingClientRect();
    let h = r.height;
    for (const p of ['::before', '::after']) {
      const s = getComputedStyle(el, p);
      if (!s.content || s.content === 'none') continue;
      if (s.position !== 'absolute' && s.position !== 'fixed') continue;
      const t = parseFloat(s.top), b = parseFloat(s.bottom);
      if (Number.isFinite(t) && Number.isFinite(b)) h = Math.max(h, r.height - t - b);
    }
    return h;
  };

  window.__audit = (scopeOverride) => {
    document.getAnimations?.().forEach(a => { try { a.finish(); } catch {} });
    const { el: root, name } = scopeOverride
      ? { el: document.querySelector(scopeOverride), name: scopeOverride }
      : surface();
    if (!root) return { 오류: '요소 없음: ' + scopeOverride };

    const scroller = root.querySelector('.detail-scroll') || root;
    const vh = window.innerHeight;
    const depthOf = (el) =>
      Math.round(el.getBoundingClientRect().top + scroller.scrollTop - scroller.getBoundingClientRect().top);

    const fails = [];
    root.querySelectorAll('*').forEach(el => {
      if (!visible(el) || !el.textContent.trim() || el.children.length > 0) return;
      const s = getComputedStyle(el), bg = bgOf(el);
      if (!bg) return;
      const size = parseFloat(s.fontSize), bold = parseInt(s.fontWeight) >= 700;
      const need = (size >= 18.66 || (size >= 14 && bold)) ? 3 : 4.5;
      const r = contrast(rgb(s.color), bg);
      if (r < need) fails.push(`${el.className.toString().split(' ')[0] || el.tagName} ${r.toFixed(2)}/${need} "${el.textContent.trim().slice(0, 20)}"`);
    });

    const taps = [...root.querySelectorAll('button,a,[role=button],input,select,textarea')]
      .filter(e => visible(e) && !e.closest('.leaflet-control-attribution'))
      .filter(e => { const h = hit(e); return h > 0 && h < 43.5; })
      .map(e => `${e.className.toString().split(' ')[0] || e.tagName} ${hit(e).toFixed(0)}px`);

    // 주요 행동이 몇 화면 아래에 있나. "만들었다"와 "닿는다"는 다르다.
    const actions = [...root.querySelectorAll('button, a[href], .place-table-cta, .map-links__btn')]
      .filter(e => visible(e) && e.textContent.trim())
      .map(e => ({ 글자: e.textContent.trim().slice(0, 26), 깊이: depthOf(e) }))
      .filter(a => a.깊이 > vh * 2)
      .sort((a, b) => b.깊이 - a.깊이)
      .slice(0, 6)
      .map(a => `${a.글자} @${(a.깊이 / vh).toFixed(1)}화면`);

    return {
      감사한_레이어: name,
      높이: `${scroller.scrollHeight}px (${(scroller.scrollHeight / vh).toFixed(1)}화면)`,
      대비: [...new Set(fails)],
      탭44미만: [...new Set(taps)],
      '2화면_아래_묻힌_행동': actions,
      가로넘침: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  };
  return 'audit v3 — 레이어 자동탐지 + color(srgb) + 깊이';
})()
