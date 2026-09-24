import { C, V } from '../utils/math.js';

export function ringBox(g, p, s, c) {
  let [x, y, z] = p, [w, h, d] = s.map(v => v / 2),
      pts = [
        [x - w, y - h, z - d], [x + w, y - h, z - d],
        [x + w, y - h, z + d], [x - w, y - h, z + d],
        [x - w, y + h, z - d], [x + w, y + h, z - d],
        [x + w, y + h, z + d], [x - w, y + h, z + d]
      ];
  [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
    .forEach(([a, b]) => g.line(pts[a], pts[b], c));
}

export function rail(g, a, b, y, w = .065) {
  let x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2,
      dx = Math.abs(a[0] - b[0]), dz = Math.abs(a[1] - b[1]);
  g.box([x, y - .022, z], [dx || w, .045, dz || w], C.steel, true);
  g.box([x, y - .065, z], [dx || .012, .055, dz || .012], C.steelDark);
}

export function oldPallet(g) {
  for (let x of [-.44, 0, .44]) {
    g.box([x, .0125, 0], [.11, .025, 1.1], C.wood, true);
    for (let z of [-.44, 0, .44]) g.box([x, .075, z], [.11, .1, .11], C.wood, true);
  }
  for (let z of [-.48, -.32, -.16, 0, .16, .32, .48])
    g.box([0, .1375, z], [1.1, .025, .14], C.woodTop, true);
}

export function shuttle(g) {
  g.box([0, .064, 0], [1.115, .105, .835], C.blue, true);
  g.box([0, .12, 0], [1.05, .012, .82], C.blueDark);
  for (let x of [-.5445, .5445])
    for (let z of [-.265, .265]) {
      g.cyl([x - .021, .05, z], [x + .021, .05, z], .05, C.black, 16);
      g.cyl([x - .023, .05, z], [x + .023, .05, z], .036, C.light, 12);
    }
  for (let z of [-.417, .417])
    for (let x of [-.37, .37]) {
      g.cyl([x, .05, z - .016], [x, .05, z + .016], .048, C.black, 16);
      g.cyl([x, .05, z - .018], [x, .05, z + .018], .033, C.light, 12);
    }
  g.box([0, .071, .427], [.20, .061, .006], C.black);
  for (let x of [-.07, .07]) g.box([x, .076, .431], [.022, .026, .008], C.green);
  for (let x of [-.48, .48]) g.box([x, .065, .430], [.026, .08, .008], C.teal);
  for (let x of [-.2, -.16, -.12, .12, .16, .2]) g.box([x, .053, -.426], [.014, .036, .006], C.black);
}
