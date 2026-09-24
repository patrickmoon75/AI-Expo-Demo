export function formatTimeHMS(t) {
  const whole = Math.floor(Math.max(0, t) + 1e-6);
  const h = String(Math.floor(whole / 3600)).padStart(2, '0'),
        m = String(Math.floor((whole % 3600) / 60)).padStart(2, '0'),
        s = String(whole % 60).padStart(2, '0');
  return h + ':' + m + ':' + s;
}

export function formatTime(t) {
  const whole = Math.floor(Math.max(0, t) + 1e-6);
  return String(Math.floor(whole / 60)).padStart(2, '0') + ':' + String(whole % 60).padStart(2, '0');
}

export const createDummy = () => {
  const dummyFn = () => createDummy();
  return new Proxy(dummyFn, {
    get: (t, p) => {
      if (p === 'classList') return { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false };
      if (p === 'style') return {};
      if (p === 'addEventListener' || p === 'removeEventListener') return () => {};
      if (p === 'querySelector') return () => createDummy();
      if (p === 'querySelectorAll') return () => [];
      if (p === 'children') return [createDummy(), createDummy(), createDummy(), createDummy()];
      if (p === 'options') return [];
      if (p === 'dataset') return {};
      if (p === 'value') return '';
      if (p === 'textContent' || p === 'innerHTML' || p === 'innerText') return '';
      if (p === 'append' || p === 'appendChild' || p === 'setAttribute' || p === 'removeAttribute') return () => {};
      return createDummy();
    },
    set: () => true,
    apply: () => createDummy()
  });
};

export const $ = id => {
  const el = document.getElementById(id);
  if (el) return el;
  return createDummy();
};

export const copy = x => JSON.parse(JSON.stringify(x));
