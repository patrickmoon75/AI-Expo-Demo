export const TAU = Math.PI * 2;

export const V = {
  add: (a, b) => a.map((v, i) => v + b[i]),
  sub: (a, b) => a.map((v, i) => v - b[i]),
  mul: (a, s) => a.map(v => v * s),
  dot: (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
  cross: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ],
  norm: a => {
    let l = Math.hypot(...a) || 1;
    return a.map(v => v / l);
  },
  lerp: (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
};

export const M = {
  id: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  mul: (a, b) => {
    let o = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 4; k++)
          o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return o;
  },
  ortho: (l, r, b, t, n, f) => new Float32Array([
    2 / (r - l), 0, 0, 0,
    0, 2 / (t - b), 0, 0,
    0, 0, -2 / (f - n), 0,
    -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1
  ]),
  persp: (fov, a, n, f) => {
    let s = 1 / Math.tan(fov / 2);
    return new Float32Array([
      s / a, 0, 0, 0,
      0, s, 0, 0,
      0, 0, (f + n) / (n - f), -1,
      0, 0, 2 * f * n / (n - f), 0
    ]);
  },
  look: (eye, target) => {
    let z = V.norm(V.sub(eye, target)),
        x = V.norm(V.cross([0, 1, 0], z)),
        y = V.cross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -V.dot(x, eye), -V.dot(y, eye), -V.dot(z, eye), 1
    ]);
  },
  point: (m, v) => {
    let a = [...v, 1], o = [0, 0, 0, 0];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        o[r] += m[c * 4 + r] * a[c];
    return o;
  }
};

export function rotateVector(p, yaw = 0) {
  let c = Math.cos(yaw), s = Math.sin(yaw);
  return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]];
}

export const color = hex => {
  let s = hex.replace('#', '');
  return [
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255
  ];
};

export const C = {
  blue: color('#2671ae'),
  blueDark: color('#194c7b'),
  steel: color('#b9c8d1'),
  steelDark: color('#667b8b'),
  light: color('#dee5e9'),
  orange: color('#e34f35'),
  yellow: color('#e2ae35'),
  yellowDark: color('#aa7a1d'),
  green: color('#69a84f'),
  teal: color('#39b29d'),
  black: color('#293945'),
  wood: color('#c6a579'),
  woodTop: color('#dfc39b'),
  hdx: color('#d69142'),
  seer: color('#5b8eaf'),
  red: color('#d85e51'),
  white: color('#f5f8fa')
};

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const copy = x => JSON.parse(JSON.stringify(x));

