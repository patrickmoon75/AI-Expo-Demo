import { C, V } from '../utils/math.js';
import { gl } from './webglRenderer.js';

export class Geo {
  constructor(name, opt = {}) {
    this.name = name;
    Object.assign(this, {
      vertices: [],
      lines: [],
      off: [0, 0, 0],
      floor: -1,
      kind: 'structure',
      alpha: 1,
      yaw: 0,
      visible: true,
      anchor: [0, 0, 0]
    }, opt);
  }

  v(p, n, c) {
    this.vertices.push(...p, ...n, ...c);
  }

  tri(a, b, c, n, col) {
    this.v(a, n, col);
    this.v(b, n, col);
    this.v(c, n, col);
  }

  quad(a, b, c, d, n, col) {
    this.tri(a, b, c, n, col);
    this.tri(a, c, d, n, col);
  }

  line(a, b, col = C.steelDark) {
    this.lines.push(...a, 0, 1, 0, ...col, ...b, 0, 1, 0, ...col);
  }

  box(p, s, c, edge = false) {
    let [x, y, z] = p, [w, h, d] = s.map(v => v / 2),
        a = [x - w, y - h, z - d], b = [x + w, y - h, z - d],
        cc = [x + w, y + h, z - d], dd = [x - w, y + h, z - d],
        e = [x - w, y - h, z + d], f = [x + w, y - h, z + d],
        g = [x + w, y + h, z + d], hh = [x - w, y + h, z + d];
    this.quad(e, f, g, hh, [0, 0, 1], c);
    this.quad(b, a, dd, cc, [0, 0, -1], c);
    this.quad(a, e, hh, dd, [-1, 0, 0], c);
    this.quad(f, b, cc, g, [1, 0, 0], c);
    this.quad(dd, hh, g, cc, [0, 1, 0], c);
    this.quad(a, b, f, e, [0, -1, 0], c);
    if (edge) {
      let col = c.map(v => v * .67);
      [[a, b], [b, cc], [cc, dd], [dd, a], [e, f], [f, g], [g, hh], [hh, e], [a, e], [b, f], [cc, g], [dd, hh]]
        .forEach(q => this.line(...q, col));
    }
    return this;
  }

  cyl(a, b, r, c, seg = 12, r2 = r) {
    let w = V.norm(V.sub(b, a)),
        u = V.norm(V.cross(w, Math.abs(w[1]) > .9 ? [1, 0, 0] : [0, 1, 0])),
        v = V.cross(w, u);
    for (let i = 0; i < seg; i++) {
      let t = i / seg * Math.PI * 2, t2 = (i + 1) / seg * Math.PI * 2,
          na = V.add(V.mul(u, Math.cos(t)), V.mul(v, Math.sin(t))),
          nb = V.add(V.mul(u, Math.cos(t2)), V.mul(v, Math.sin(t2))),
          aa = V.add(a, V.mul(na, r)), ab = V.add(a, V.mul(nb, r)),
          ba = V.add(b, V.mul(na, r2)), bb = V.add(b, V.mul(nb, r2));
      this.tri(a, ab, aa, V.mul(w, -1), c);
      this.tri(b, ba, bb, w, c);
      this.quad(aa, ab, bb, ba, V.norm(V.add(na, nb)), c);
    }
    return this;
  }

  beam(a, b, w, c) {
    this.cyl(a, b, w / 2, c, 6);
    return this;
  }

  arrow(a, b, c, size = .1) {
    this.cyl(a, b, .016, c, 7);
    let dir = V.norm(V.sub(b, a)), back = V.sub(b, V.mul(dir, size));
    this.cyl(back, b, size * .42, c, 9, 0);
  }

  upload() {
    this.data = new Float32Array(this.vertices);
    this.ld = new Float32Array(this.lines);
    this.vertices = null;
    this.lines = null;
    if (gl && gl.createBuffer) {
      this.buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
      this.lbuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lbuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.ld, gl.STATIC_DRAW);
    }
  }

  dispose() {
    if (gl && gl.deleteBuffer) {
      if (this.buf) gl.deleteBuffer(this.buf);
      if (this.lbuf) gl.deleteBuffer(this.lbuf);
    }
  }
}
