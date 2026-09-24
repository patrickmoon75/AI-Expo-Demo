import { V, M, clamp, rotateVector } from '../utils/math.js';
import { $ } from '../utils/helpers.js';
import { vs, fs, shader } from './shaders.js';
import {
  geos, cam, eye, setEye, vp, setVp, viewWidth, viewHeight,
  setViewWidth, setViewHeight, dirty, setDirty,
  cameraMode, setCameraMode, sim, cfg, trackY
} from '../simulation/state.js';
import { positionLabels } from '../ui/labels.js';

export const canvas = $('view');
export const main = $('main');

export let gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true }) ||
                canvas.getContext('experimental-webgl');

export const webglActive = !!gl;
export let ctx2d = null;

if (!webglActive) {
  ctx2d = canvas.getContext('2d', { alpha: true });
  if (!ctx2d) {
    $('error').style.display = 'flex';
    $('error').textContent = '브라우저의 그래픽 컨텍스트를 초기화할 수 없습니다.';
    throw Error('No graphics context');
  }
  gl = new Proxy({}, {
    get: (o, key) => /^[A-Z_0-9]+$/.test(key) ? 0 :
      (key === 'getShaderParameter' || key === 'getProgramParameter' ? () => true : () => null)
  });
}

export let prog = null;
export let loc = {};

if (webglActive) {
  prog = gl.createProgram();
  gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  loc = {
    P: gl.getAttribLocation(prog, 'aP'),
    N: gl.getAttribLocation(prog, 'aN'),
    C: gl.getAttribLocation(prog, 'aC'),
    VP: gl.getUniformLocation(prog, 'uVP'),
    off: gl.getUniformLocation(prog, 'uOffset'),
    rot: gl.getUniformLocation(prog, 'uRot'),
    alpha: gl.getUniformLocation(prog, 'uAlpha'),
    lit: gl.getUniformLocation(prog, 'uLit')
  };

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);
}

export function view() {
  let vw = (main && main.clientWidth) ? main.clientWidth : (canvas && canvas.clientWidth) ? canvas.clientWidth : 800;
  let vh = (main && main.clientHeight) ? main.clientHeight : (canvas && canvas.clientHeight) ? canvas.clientHeight : 600;
  if (vw <= 0) vw = 800;
  if (vh <= 0) vh = 600;
  setViewWidth(vw);
  setViewHeight(vh);

  const dpr = Math.min(devicePixelRatio || 1, 2),
        w = Math.round(vw * dpr),
        h = Math.round(vh * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    if (webglActive) gl.viewport(0, 0, w, h);
  }

  cam.pitch = clamp(cam.pitch, .008, Math.PI / 2 - .001);
  const co = Math.cos(cam.pitch);
  const calculatedEye = V.add(cam.target, [
    Math.sin(cam.yaw) * co * 30,
    Math.sin(cam.pitch) * 30,
    Math.cos(cam.yaw) * co * 30
  ]);
  setEye(calculatedEye);

  const hs = cam.span * vw / vh;
  const calculatedVp = M.mul(
    M.ortho(-hs / 2, hs / 2, -cam.span / 2, cam.span / 2, .1, 100),
    M.look(calculatedEye, cam.target)
  );
  setVp(calculatedVp);

  if (webglActive) gl.uniformMatrix4fv(loc.VP, false, calculatedVp);
}

export function drawGeo(g, alpha, lines = false) {
  const data = lines ? g.ld : g.data;
  if (!data || !data.length) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, lines ? g.lbuf : g.buf);
  for (const [l, size, off] of [[loc.P, 3, 0], [loc.N, 3, 12], [loc.C, 3, 24]]) {
    gl.enableVertexAttribArray(l);
    gl.vertexAttribPointer(l, size, gl.FLOAT, false, 36, off);
  }
  gl.uniform3fv(loc.off, g.off);
  gl.uniform2f(loc.rot, Math.cos(g.yaw || 0), Math.sin(g.yaw || 0));
  gl.uniform1f(loc.alpha, alpha);
  gl.uniform1f(loc.lit, lines ? 0 : 1);
  gl.drawArrays(lines ? gl.LINES : gl.TRIANGLES, 0, data.length / 9);
}

export function alphaOf(g) {
  return g.alpha * ($('ghostFrame').checked && ['structure', 'lift', 'liftguard'].includes(g.kind) ? .18 : 1);
}

export function screenPoint(p) {
  const q = M.point(vp, p);
  return [
    (q[0] / q[3] * .5 + .5) * viewWidth,
    (-q[1] / q[3] * .5 + .5) * viewHeight
  ];
}

export function renderSoftware() {
  view();
  const dpr = canvas.width / viewWidth;
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx2d.clearRect(0, 0, viewWidth, viewHeight);
  const ground = [], objects = [], dir = V.norm(V.sub(eye, cam.target));
  const key = V.norm([-.5, 1, .8]), fill = V.norm([.75, .4, -.55]);

  for (const g of geos) {
    if (!g.visible) continue;
    let a = g.data, alpha = alphaOf(g),
        events = ['ground', 'grid', 'boundary', 'zone', 'path'].includes(g.kind) ? ground : objects;
    for (let i = 0; i < a.length; i += 27) {
      const n = rotateVector([a[i + 3], a[i + 4], a[i + 5]], g.yaw),
            pts = [i, i + 9, i + 18].map(j => V.add(rotateVector([a[j], a[j + 1], a[j + 2]], g.yaw), g.off));
      if (V.dot(n, dir) < -.01 && alpha > .9) continue;
      const s = pts.map(screenPoint);
      if (s.every(p => p[0] < 0) || s.every(p => p[0] > viewWidth) || s.every(p => p[1] < 0) || s.every(p => p[1] > viewHeight)) continue;
      const shade = .66 + .24 * Math.max(V.dot(n, key), 0) + .12 * Math.max(V.dot(n, fill), 0);
      const col = [a[i + 6], a[i + 7], a[i + 8]].map(v => Math.round(clamp(v * shade, 0, 1) * 255));
      events.push({ s, d: V.dot(V.mul(pts.reduce((sum, p) => V.add(sum, p), [0, 0, 0]), 1 / 3), dir), c: 'rgb(' + col.join(',') + ')', alpha, layer: g.kind === 'ground' ? 0 : g.kind === 'zone' ? 1 : 2 });
    }
    if (['boundary', 'dimension', 'grid', 'path', 'clearance', 'liftguard', 'envelope'].includes(g.kind)) {
      a = g.ld;
      for (let i = 0; i < a.length; i += 18) {
        const p = V.add(rotateVector([a[i], a[i + 1], a[i + 2]], g.yaw), g.off),
              q = V.add(rotateVector([a[i + 9], a[i + 10], a[i + 11]], g.yaw), g.off);
        events.push({ s: [screenPoint(p), screenPoint(q)], d: V.dot(V.mul(V.add(p, q), .5), dir) + .001, c: 'rgb(' + [a[i + 6], a[i + 7], a[i + 8]].map(v => Math.round(v * 255)).join(',') + ')', alpha, line: true, layer: 3 });
      }
    }
  }

  function paint(events, isGround) {
    events.sort(isGround ? (a, b) => a.layer - b.layer || a.d - b.d : (a, b) => a.d - b.d);
    for (const f of events) {
      ctx2d.globalAlpha = f.alpha;
      ctx2d.beginPath();
      ctx2d.moveTo(...f.s[0]);
      for (let i = 1; i < f.s.length; i++) ctx2d.lineTo(...f.s[i]);
      if (f.line) {
        ctx2d.strokeStyle = f.c;
        ctx2d.lineWidth = .65;
        ctx2d.stroke();
      } else {
        ctx2d.closePath();
        ctx2d.fillStyle = f.c;
        ctx2d.fill();
      }
    }
  }

  paint(ground, true);
  paint(objects, false);
  ctx2d.globalAlpha = 1;
  positionLabels();
  setDirty(false);
}

export function render() {
  if (!webglActive) {
    renderSoftware();
    return;
  }
  view();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.depthMask(true);
  for (const g of geos) if (g.visible && alphaOf(g) >= .995) drawGeo(g, 1);
  gl.depthMask(false);
  const ts = geos.filter(g => g.visible && alphaOf(g) < .995);
  ts.sort((a, b) => Math.hypot(...V.sub(b.off, eye)) - Math.hypot(...V.sub(a.off, eye)));
  for (const g of ts) drawGeo(g, alphaOf(g));
  gl.depthMask(true);
  for (const g of geos) if (g.visible && g.ld.length) drawGeo(g, Math.max(alphaOf(g), g.kind === 'liftguard' ? .35 : .15), true);
  positionLabels();
  setDirty(false);
}

export function geoCorners(g) {
  if (!g.localBounds) {
    let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    const a = g.data;
    for (let i = 0; i < a.length; i += 9)
      for (let j = 0; j < 3; j++) {
        mn[j] = Math.min(mn[j], a[i + j]);
        mx[j] = Math.max(mx[j], a[i + j]);
      }
    g.localBounds = { mn, mx };
  }
  const { mn, mx } = g.localBounds, pts = [];
  if (!Number.isFinite(mn[0])) return pts;
  for (const x of [mn[0], mx[0]])
    for (const y of [mn[1], mx[1]])
      for (const z of [mn[2], mx[2]])
        pts.push(V.add(rotateVector([x, y, z], g.yaw), g.off));
  return pts;
}

export function Rpoint(p) {
  return V.add(rotateVector(p, Math.PI / 2), [cfg.rearDepth + cfg.rackBack, 0, cfg.rackCenter]);
}

export function fitScene(rackOnly = false) {
  const dir = V.norm([Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)]),
        right = V.norm(V.cross([0, 1, 0], dir)),
        up = V.cross(dir, right);
  let mn = [Infinity, Infinity], mx = [-Infinity, -Infinity];
  for (const g of geos) {
    if (!g.visible || !g.data.length || ['path', 'lane', 'volume', 'dimension', 'clearance', 'envelope', 'zone'].includes(g.kind) || rackOnly && !g.rack) continue;
    for (const p of geoCorners(g)) {
      const vals = [V.dot(p, right), V.dot(p, up)];
      for (let i = 0; i < 2; i++) {
        mn[i] = Math.min(mn[i], vals[i]);
        mx[i] = Math.max(mx[i], vals[i]);
      }
    }
  }
  const w = main.clientWidth || 800, h = main.clientHeight || 600,
        padX = w < 600 ? 30 : 65, padTop = 105, padBottom = 155,
        scale = Math.min((w - padX * 2) / (mx[0] - mn[0]), (h - padTop - padBottom) / (mx[1] - mn[1]));
  cam.span = Math.max(1, h / scale);
  const ref = rackOnly ? Rpoint([0, 3, 0]) : [4.5, 2, 4.5];
  cam.target = V.add(ref, V.add(V.mul(right, (mx[0] + mn[0]) / 2 - V.dot(ref, right)), V.mul(up, (mx[1] + mn[1]) / 2 - V.dot(ref, up) + (padTop - padBottom) / 2 / scale)));
  setDirty(true);
}

export function setCamera(mode) {
  setCameraMode(mode);
  if (mode === 'iso') { cam.yaw = .83; cam.pitch = .53; fitScene(); }
  if (mode === 'top') { cam.yaw = 0; cam.pitch = Math.PI / 2 - .001; fitScene(); }
  if (mode === 'rack') { cam.yaw = 1.10; cam.pitch = .40; fitScene(true); }
  if (mode === 'front') { cam.yaw = Math.PI / 2; cam.pitch = .008; fitScene(true); }
  if (mode === 'rear') { cam.yaw = -Math.PI / 2 - .22; cam.pitch = .38; fitScene(true); }
  if (mode === 'bufferB' || mode === 'bufferC') {
    const z = mode === 'bufferB' ? cfg.bZ : cfg.cZ;
    cam.target = [cfg.bufferX - .65, .55, z];
    cam.yaw = mode === 'bufferB' ? -.78 : -2.3;
    cam.pitch = .53;
    cam.span = Math.max(3.2, 4.8 * main.clientHeight / main.clientWidth);
  }
  document.querySelectorAll('[data-camera]').forEach(b => b.classList.toggle('active', b.dataset.camera === mode));
  setDirty(true);
}

export function updateVisibility() {
  const getChecked = (id, def = true) => {
    const el = $(id);
    return el ? el.checked : def;
  };
  for (const g of geos) {
    if (g.kind === 'lane') g.visible = getChecked('showLane');
    else if (g.kind === 'path') g.visible = getChecked('showPaths');
    else if (g.kind === 'volume') g.visible = getChecked('showVolumes', false);
    else if (g.kind === 'dimension') g.visible = getChecked('showDimensions', false);
    else if (g.kind === 'envelope') g.visible = getChecked('showEnvelopes', false);
    else if (g.kind === 'grid') g.visible = getChecked('showGrid');
    else if (g.kind === 'cargo') g.visible = getChecked('showCargo');
    else if (g.palletId) {
      const p = sim.pallets[g.palletId];
      g.visible = !!p && p.location !== 'NONE';
    }
  }
}

export function makeGLB() {
  const positions = [];
  const normals = [];
  const colors = [];

  for (const g of geos) {
    if (!g.visible || !g.data || !g.data.length) continue;
    const a = g.data;
    const cosY = Math.cos(g.yaw || 0), sinY = Math.sin(g.yaw || 0);
    for (let i = 0; i < a.length; i += 9) {
      const px = a[i], py = a[i + 1], pz = a[i + 2];
      const nx = a[i + 3], ny = a[i + 4], nz = a[i + 5];
      const r = a[i + 6], gCol = a[i + 7], b = a[i + 8];

      const rx = px * cosY - pz * sinY + g.off[0];
      const ry = py + g.off[1];
      const rz = px * sinY + pz * cosY + g.off[2];

      const rnx = nx * cosY - nz * sinY;
      const rny = ny;
      const rnz = nx * sinY + nz * cosY;

      positions.push(rx, ry, rz);
      normals.push(rnx, rny, rnz);
      colors.push(r, gCol, b, 1.0);
    }
  }

  const posBuf = new Float32Array(positions);
  const normBuf = new Float32Array(normals);
  const colBuf = new Float32Array(colors);

  const posByteLength = posBuf.byteLength;
  const normByteLength = normBuf.byteLength;
  const colByteLength = colBuf.byteLength;

  const totalBinLength = posByteLength + normByteLength + colByteLength;
  const binBuffer = new Uint8Array(totalBinLength);
  binBuffer.set(new Uint8Array(posBuf.buffer), 0);
  binBuffer.set(new Uint8Array(normBuf.buffer), posByteLength);
  binBuffer.set(new Uint8Array(colBuf.buffer), posByteLength + normByteLength);

  const count = posBuf.length / 3;

  const gltf = {
    asset: { version: "2.0", generator: "Novatek WebGL Exporter" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: {
          POSITION: 0,
          NORMAL: 1,
          COLOR_0: 2
        }
      }]
    }],
    buffers: [{ byteLength: totalBinLength }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posByteLength, target: 34962 },
      { buffer: 0, byteOffset: posByteLength, byteLength: normByteLength, target: 34962 },
      { buffer: 0, byteOffset: posByteLength + normByteLength, byteLength: colByteLength, target: 34962 }
    ],
    accessors: [
      { bufferView: 0, byteOffset: 0, componentType: 5126, count, type: "VEC3" },
      { bufferView: 1, byteOffset: 0, componentType: 5126, count, type: "VEC3" },
      { bufferView: 2, byteOffset: 0, componentType: 5126, count, type: "VEC4" }
    ]
  };

  let jsonStr = JSON.stringify(gltf);
  while (jsonStr.length % 4 !== 0) jsonStr += ' ';

  const jsonEncoder = new TextEncoder();
  const jsonBytes = jsonEncoder.encode(jsonStr);

  const totalGlbLength = 12 + 8 + jsonBytes.length + 8 + totalBinLength;
  const glbBuffer = new ArrayBuffer(totalGlbLength);
  const dataView = new DataView(glbBuffer);

  dataView.setUint32(0, 0x46544C67, true);
  dataView.setUint32(4, 2, true);
  dataView.setUint32(8, totalGlbLength, true);

  dataView.setUint32(12, jsonBytes.length, true);
  dataView.setUint32(16, 0x4E4F534A, true);
  new Uint8Array(glbBuffer, 20, jsonBytes.length).set(jsonBytes);

  const binHeaderOffset = 20 + jsonBytes.length;
  dataView.setUint32(binHeaderOffset, totalBinLength, true);
  dataView.setUint32(binHeaderOffset + 4, 0x0042494E, true);
  new Uint8Array(glbBuffer, binHeaderOffset + 8, totalBinLength).set(binBuffer);

  return glbBuffer;
}

