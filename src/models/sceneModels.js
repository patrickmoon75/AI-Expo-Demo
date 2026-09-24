import { getText } from '../utils/i18n.js';
import { V, C, color, rotateVector } from '../utils/math.js';
import { $ } from '../utils/helpers.js';
import { Geo } from '../render/geo.js';
import { Rpoint } from '../render/webglRenderer.js';
import { ringBox, rail, shuttle } from './geometries.js';
import {
  geos, labels, slots, dims, trackY, cfg, assets, bufferData, bufferColors,
  setGeos, setLabels, setSlots, setDims, setTrackY, setLiftCar, manualLift,
  setDirty, AINFO, halfBody, sim, liftCar
} from '../simulation/state.js';
import { addLabel } from '../ui/labels.js';
import { resetSimulation } from '../simulation/engine.js';
import { syncLayoutUI } from '../ui/domEvents.js';

const unit = V.norm, cross = V.cross, sub = V.sub;
const actorSource = "Pallet_Buffer_RevG1_Scenario_3D_Viewer.html / original specification-based concept geometry";

export function makeActorParts() {
  const bucket = new Map();
  function geo(cat, group, color, name) {
    const k = group + '|' + color;
    if (!bucket.has(k)) bucket.set(k, { id: 'actor_' + bucket.size, cat, group, color, name, v: [], f: [], n: [], edges: [], explode: [0, 0, 0], source: actorSource, detail: '', dynamic: true });
    return bucket.get(k);
  }
  function addMesh(p, vertices, faces, edgePairs) {
    const offset = p.v.length / 3;
    for (const v of vertices) p.v.push(...v);
    for (const ids of faces) {
      p.f.push(...ids.map(i => i + offset));
      p.n.push(...unit(cross(sub(vertices[ids[1]], vertices[ids[0]]), sub(vertices[ids[2]], vertices[ids[0]]))));
    }
    for (const [a, b] of edgePairs) p.edges.push(a + offset, b + offset);
  }
  function box(p, x, y, z, dx, dy, dz) {
    const v = [[x,y,z],[x+dx,y,z],[x+dx,y+dy,z],[x,y+dy,z],[x,y,z+dz],[x+dx,y,z+dz],[x+dx,y+dy,z+dz],[x,y+dy,z+dz]];
    const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]],
          edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    addMesh(p, v, faces, edges);
  }
  function prism(p, poly, z, h) {
    const v = [...poly.map(q => [q[0], q[1], z]), ...poly.map(q => [q[0], q[1], z + h])],
          n = poly.length, f = [], e = [];
    for (let i = 1; i < n - 1; i++) { f.push([0, i + 1, i], [n, n + i, n + i + 1]); }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      f.push([i, j, n + j], [i, n + j, n + i]);
      e.push([i, j], [n + i, n + j], [i, n + i]);
    }
    addMesh(p, v, f, e);
  }
  function roundBox(p, cx, cy, z, w, l, h, r) {
    const poly = [
      [cx - w / 2 + r, cy - l / 2], [cx + w / 2 - r, cy - l / 2],
      [cx + w / 2, cy - l / 2 + r], [cx + w / 2, cy + l / 2 - r],
      [cx + w / 2 - r, cy + l / 2], [cx - w / 2 + r, cy + l / 2],
      [cx - w / 2, cy + l / 2 - r], [cx - w / 2, cy - l / 2 + r]
    ];
    prism(p, poly, z, h);
  }
  function cylinder(p, cx, cy, cz, r, len, axis = 'z', N = 16) {
    const v = [];
    for (const b of [-.5, .5])
      for (let i = 0; i < N; i++) {
        const a = 2 * Math.PI * i / N, u = r * Math.cos(a), w = r * Math.sin(a);
        v.push(axis === 'y' ? [cx + u, cy + b * len, cz + w] : axis === 'x' ? [cx + b * len, cy + u, cz + w] : [cx + u, cy + w, cz + b * len]);
      }
    const f = [], e = [];
    for (let i = 1; i < N - 1; i++) f.push([0, i + 1, i], [N, N + i, N + i + 1]);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      f.push([i, j, N + j], [i, N + j, N + i]);
      e.push([i, j], [N + i, N + j]);
      if (i % 4 === 0) e.push([i, N + i]);
    }
    if (axis === 'y') for (const face of f) [face[1], face[2]] = [face[2], face[1]];
    addMesh(p, v, f, e);
  }

  const amr = geo('amr', 'amrBody', '#596e79', 'SEER 리프팅 AMR · 차체'),
        amrDark = geo('amr', 'amrBody', '#24323b', 'AMR 범퍼·바퀴'),
        amrLight = geo('amr', 'amrBody', '#b9c8cd', 'AMR 상부 프레임'),
        amrLed = geo('amr', 'amrBody', '#4ac3b0', 'AMR 상태등'),
        platform = geo('amr', 'amrLift', '#dfb95c', '850×600 리프트 플랫폼');
  roundBox(amr, 0, 0, 45, 650, 950, 174, 75);
  roundBox(amrDark, 0, 0, 25, 650, 950, 35, 65);
  roundBox(amrLight, 0, 0, 218, 635, 935, 16, 68);
  roundBox(platform, 0, 0, -16, 600, 850, 16, 24);
  box(amrLed, -170, 466, 112, 340, 7, 12);
  box(amrLed, -170, -473, 112, 340, 7, 12);
  box(amrDark, -54, 435, 177, 108, 39, 35);
  box(amrDark, -54, -474, 177, 108, 39, 35);
  for (const x of [-307, 307])
    for (const y of [-265, 265]) cylinder(amrDark, x, y, 62, 37, 28, 'x');

  function truck(cat, prefix, isHDX) {
    const b = geo(cat, prefix + 'Body', isHDX ? '#687986' : '#d6ad55', isHDX ? 'HDX 지게차 · 차체' : 'SEER 카운터밸런스 · 차체');
    const dark = geo(cat, prefix + 'Body', '#34414b', '차체 하부·마스트'),
          rubber = geo(cat, prefix + 'Body', '#263039', '차륜'),
          skin = geo(cat, prefix + 'Body', '#b4c1c8', '마스트 내부'),
          fork = geo(cat, prefix + 'Fork', '#8b9da8', '포크·승강 캐리지'),
          trim = geo(cat, prefix + 'Body', isHDX ? '#d9aa56' : '#45a99c', '차체 패널');
    const len = isHDX ? 590 : 1697, w = isHDX ? 985 : 1180, mh = isHDX ? 1990 : 2235;
    roundBox(dark, -len / 2 - 30, 0, 80, len - 90, w, 140, 70);
    roundBox(b, isHDX ? -405 : -1120, 0, isHDX ? 200 : 250, isHDX ? 350 : 920, isHDX ? 930 : 1060, isHDX ? 820 : 630, 80);
    if (!isHDX) {
      roundBox(skin, -370, 0, 240, 420, 970, 170, 45);
      box(trim, -1480, -488, 460, 28, 976, 210);
    } else {
      box(trim, -570, -305, 760, 10, 610, 120);
      box(dark, -485, -80, 1040, 60, 160, 360);
      roundBox(dark, -454, 0, 1350, 220, 380, 50, 70);
    }
    for (const y of [-240, 170]) {
      box(dark, -100, y, 70, 80, 70, mh - 70);
      box(skin, -81, y + 15, 130, 26, 25, mh - 180);
    }
    box(dark, -100, -240, mh - 65, 80, 480, 65);
    box(fork, -120, -325, -88, 120, 650, 90);
    const length = isHDX ? 1150 : 1070, fw = isHDX ? 180 : 122, ft = isHDX ? 60 : 40, cy = (570 - fw) / 2;
    for (const y of [-cy, cy]) {
      box(fork, 0, y - fw / 2, -ft, length - 55, fw, ft);
      prism(fork, [[length - 55, y - fw / 2], [length - 10, y - fw / 2 + 12], [length, y], [length - 10, y + fw / 2 - 12], [length - 55, y + fw / 2]], -ft, ft);
      box(fork, -35, y - fw / 2, -ft, 35, fw, 230);
    }
    if (!isHDX) {
      for (const y of [-515, 515]) {
        cylinder(rubber, -300, y, 205, 180, 120, 'y');
        cylinder(skin, -300, y, 205, 88, 126, 'y');
        cylinder(rubber, -1410, y, 170, 145, 115, 'y');
      }
      box(dark, -1260, -105, 882, 210, 210, 66);
      cylinder(trim, -1155, 0, 952, 80, 40, 'z');
    } else {
      const low = geo(cat, prefix + 'Body', '#80919a', 'HDX 하부 지지다리 · 개념형상');
      for (const y of [-195, 195]) {
        roundBox(low, 500, y, 44, 1010, 150, 60, 20);
        for (const x of [965, 1070]) cylinder(rubber, x, y, 40, 40, 70, 'y');
      }
      for (const y of [-350, 350]) cylinder(rubber, -410, y, 115, 115, 70, 'y');
    }
  }

  truck('seer', 'seer', false);
  truck('hdx', 'hdx', true);

  const pallet = geo('pallet', 'pallet', '#77a9c4', '팔레트 1100×1100×150'),
        palDark = geo('pallet', 'pallet', '#558eaa', '팔레트 하부 블록·러너');
  for (const y of [-450, 0, 450]) {
    box(palDark, -550, y - 75, 0, 1100, 150, 20);
    for (const x of [-450, 0, 450]) box(palDark, x - 75, y - 75, 20, 150, 150, 105);
  }
  for (let i = 0; i < 7; i++) box(pallet, -550 + i * 160, -550, 125, i === 6 ? 140 : 145, 1100, 25);
  const cargo = geo('cargo', 'cargo', '#cab895', '예시 화물'),
        tape = geo('cargo', 'cargo', '#ac9876', '포장 띠');
  box(cargo, -400, -400, 150, 800, 800, 480);
  box(tape, -12, -403, 150, 24, 806, 482);
  box(tape, -402, -12, 150, 804, 24, 482);
  return [...bucket.values()];
}

export const originalActors = makeActorParts();

export function geo(name, opt = {}) {
  const g = new Geo(name, opt);
  geos.push(g);
  return g;
}

export function bakeRack(g) {
  for (const arr of [g.vertices, g.lines])
    for (let i = 0; i < arr.length; i += 9) {
      const p = Rpoint(arr.slice(i, i + 3)), n = rotateVector(arr.slice(i + 3, i + 6), Math.PI / 2);
      for (let j = 0; j < 3; j++) {
        arr[i + j] = p[j];
        arr[i + 3 + j] = n[j];
      }
    }
  g.anchor = Rpoint(g.anchor);
}

export function buildRack() {
  const geoStart = geos.length, labelStart = labels.length;

  const bw = cfg.bayWidth, lw = cfg.liftWidth, F = cfg.frontDepth, R = cfg.rearDepth;
  const W = bw * 3 + lw + cfg.leftGap + cfg.rightGap, rackH = cfg.rackHeight, H = Math.max(rackH, cfg.liftHeight);
  const left = -W / 2, leftRackEnd = left + bw, liftLeft = leftRackEnd + cfg.leftGap, liftRight = liftLeft + lw;
  const rightRackStart = liftRight + cfg.rightGap, right = W / 2, LD = F + cfg.liftProtrusion;
  const xc = [left + bw / 2, (liftLeft + liftRight) / 2, rightRackStart + bw / 2, right - bw / 2];
  const edges = [left, leftRackEnd, rightRackStart, rightRackStart + bw, right];
  const rearEdges = Array.from({ length: 7 }, (_, i) => left + W * i / 6);
  const zf = F / 2, zr = -R / 2, zl = LD / 2;
  setDims({ W, F, R, H, rackH, LD, liftLeft, liftRight, leftRackEnd, rightRackStart, edges, rearEdges, xc, zf, zr, zl });
  setTrackY([0, 1, 2].map(i => cfg.baseHeight + i * cfg.levelPitch));
  const defs = [['X1', 0, 2, 'storage'], ['X2', 3, 2, 'storage'], ['X3', 0, 1, 'storage'], ['X4', 2, 1, 'storage'], ['X5', 3, 1, 'storage'], ['X6', 2, 0, 'storage'], ['D', 0, 0, 'inbound'], ['A', 3, 0, 'outbound'], ['CHG', 2, 2, 'storage'], ['LIFT', 1, -1, 'lift']];
  for (let [id, col, floor, kind] of defs)
    slots[id] = { id, col, floor, kind, x: xc[col], y: floor < 0 ? trackY[0] : trackY[floor], z: id === 'LIFT' ? zl : zf, charging: id === 'CHG', displayName: id === 'CHG' ? getText('nameCharger') : id };

  const postPoints = [];
  for (let x of edges) for (let z of [F, 0]) postPoints.push([x, z]);
  for (let x of rearEdges) {
    postPoints.push([x, -R]);
    if (x < liftLeft - .06 || x > liftRight + .06) postPoints.push([x, 0]);
  }
  const posts = [...new Map(postPoints.map(p => [p.map(x => x.toFixed(4)).join(','), p])).values()];
  let foot = geo('foundation-feet', { kind: 'structure' });
  for (let [x, z] of posts) {
    foot.box([x, .026, z], [.16, .05, .18], C.steelDark, true);
    for (let xx of [-.047, .047]) foot.cyl([x + xx, .052, z - .06], [x + xx, .07, z - .06], .012, C.light, 6);
  }
  for (let level = 0; level < 3; level++) {
    let y = trackY[level], lo = level === 0 ? .05 : trackY[level - 1] + .05, hi = level === 2 ? rackH : y + .05;
    let frame = geo('rack-frame-L' + (level + 1), { floor: level, kind: 'structure' });
    for (let [x, z] of posts) frame.box([x, (lo + hi) / 2, z], [.075, hi - lo, .075], C.blue, true);
    for (let col of [0, 2, 3]) {
      let x = xc[col];
      for (let z of [.02, F - .02]) frame.box([x, y - .11, z], [bw, .105, .06], C.steelDark, true);
      for (let xx of [-.42, .42]) rail(frame, [x + xx, .04], [x + xx, F - .06], y);
      for (let xx of [-.535, .535]) {
        frame.box([x + xx, y + .128, zf], [.065, .056, F - .07], C.steel, true);
        for (let z of [.15, F - .15]) frame.box([x + xx, y + .084, z], [.10, .074, .08], C.orange, true);
      }
      for (let z of [.15, F - .15]) for (let xx of [-.56, .56]) frame.box([x + xx, y + .19, z], [.028, .07, .036], C.orange, true);
    }
    rail(frame, [left + .04, zr - .39], [right - .04, zr - .39], y);
    rail(frame, [left + .04, zr + .39], [right - .04, zr + .39], y);
    for (let x of rearEdges) frame.box([x, y - .12, zr], [.065, .085, R], C.steelDark, true);
    for (let i = 0; i < 6; i++) {
      let x = (rearEdges[i] + rearEdges[i + 1]) / 2;
      for (let z of [-R, 0]) frame.box([x, y - .15, z], [W / 6, .08, .06], C.steelDark);
    }
    for (let x of [left, right]) {
      let yl = lo + .13, yh = hi - .12;
      frame.beam([x, yl, -R + .05], [x, yh, -.04], .03, C.steel);
      frame.beam([x, yh, -R + .05], [x, yl, -.04], .03, C.steel);
    }
    for (let x of edges) {
      let yl = lo + .13, yh = hi - .12;
      frame.beam([x, yl, .04], [x, yh, F - .04], .026, C.steel);
    }
    let lane = geo('rear-travel-lane-L' + (level + 1), { floor: level, kind: 'lane', alpha: .095, anchor: [0, y, zr] });
    lane.box([0, y + .015, zr], [W - .12, .012, R - .13], C.teal);
    let arrows = geo('rear-lane-arrows-L' + (level + 1), { floor: level, kind: 'lane' });
    for (let xx = left + .4; xx < right - .65; xx += 1.35) {
      arrows.arrow([xx, y + .026, zr - .08], [xx + .60, y + .026, zr - .08], C.teal, .09);
      arrows.arrow([xx + .60, y + .026, zr + .08], [xx, y + .026, zr + .08], C.teal, .09);
    }
  }
  for (let s of Object.values(slots)) {
    if (s.kind === 'lift') continue;
    const storage = s.kind === 'storage', kind = s.charging ? 'charger' : storage ? '' : 'port';
    const name = s.charging ? getText('nameCharger') : s.id === 'D' ? getText('nameInboundD') : s.id === 'A' ? getText('nameOutboundA') : s.id;
    addLabel(s.id, name, [s.x, s.y + .52, F + .10], kind, s.floor);
    let volume = geo('space-' + s.id, { floor: s.floor, kind: 'volume', alpha: .055, slot: s.id, anchor: [s.x, s.y + .7, zf] });
    volume.box([s.x, s.y + .88, zf], [bw - .15, 1.4, F - .15], storage ? C.blue : C.teal);
    let vb = geo('space-outline-' + s.id, { floor: s.floor, kind: 'volume', slot: s.id });
    ringBox(vb, [s.x, s.y + .88, zf], [bw - .15, 1.4, F - .15], storage ? color('#87b1d4') : C.teal);
  }
  const lx = xc[1], hw = lw / 2 - .13, top = cfg.liftHeight;
  let tower = geo('lift-tower', { kind: 'lift' });
  for (let x of [lx - hw, lx + hw])
    for (let z of [.13, LD - .13]) {
      tower.box([x, .06, z], [.24, .12, .25], C.steelDark, true);
      tower.box([x, top / 2, z], [.12, top, .12], C.steel, true);
      tower.box([x + (x < lx ? .07 : -.07), top / 2, z], [.028, top - .25, .045], C.steelDark);
    }
  for (let z of [.13, LD - .13]) {
    tower.box([lx, top - .065, z], [lw, .13, .17], C.steel, true);
    tower.box([lx, .13, z], [lw, .14, .16], C.steelDark, true);
  }
  for (let x of [lx - hw, lx + hw]) {
    tower.box([x, top - .065, zl], [.14, .13, LD], C.steel, true);
    tower.box([x, .13, zl], [.14, .14, LD], C.steelDark, true);
  }
  for (let x of [lx - .90, lx + .90]) {
    tower.box([x, top / 2, .34], [.10, top - .25, .16], C.steelDark, true);
    tower.box([x + .055, top / 2, .34], [.025, top - .30, .065], C.light);
  }
  tower.box([lx, top - .23, .35], [1.95, .13, .23], C.steel, true);
  let fence = geo('lift-safety-mesh', { kind: 'liftguard', alpha: .52 });
  for (let x of [lx - hw, lx + hw]) {
    for (let z = .19; z < LD - .15; z += .14) fence.line([x, .20, z], [x, top - .18, z], C.yellowDark);
    for (let y = .25; y < top - .1; y += .18) fence.line([x, y, .12], [x, y, LD - .12], C.yellowDark);
  }
  for (let x = lx - hw + .12; x < lx + hw - .05; x += .145) fence.line([x, .22, LD - .09], [x, top - .15, LD - .09], C.yellowDark);
  for (let y = .25; y < top - .15; y += .18) fence.line([lx - hw, y, LD - .09], [lx + hw, y, LD - .09], C.yellowDark);
  for (let y of [.22, 1.7, 3.3, 4.9, top - .17]) {
    tower.box([lx, y, LD - .09], [lw - .12, .045, .045], C.yellow, true);
    for (let x of [lx - hw, lx + hw]) tower.box([x, y, zl], [.045, .045, LD - .18], C.yellow, true);
  }
  const carW = Math.min(1.76, lw - .40), carD = Math.min(1.66, LD - .16), carBack = zl - carD / 2, carFront = zl + carD / 2;
  const createdLiftCar = geo('lift-carriage', { kind: 'carriage' });
  setLiftCar(createdLiftCar);
  for (let z of [carBack, carFront]) createdLiftCar.box([lx, -.10, z], [carW, .12, .13], C.steel, true);
  for (let x of [lx - carW / 2, lx + carW / 2]) createdLiftCar.box([x, -.10, zl], [.12, .12, carD], C.steel, true);
  for (let xx of [-.42, .42]) rail(createdLiftCar, [lx + xx, carBack], [lx + xx, carFront], 0);
  for (let xx of [-.535, .535]) createdLiftCar.box([lx + xx, .128, zl], [.065, .056, 1.25], C.steel);
  for (let x of [lx - carW / 2, lx + carW / 2]) createdLiftCar.box([x, .21, carBack], [.12, .58, .10], C.steelDark, true);
  createdLiftCar.off = [0, trackY[manualLift], 0];

  for (let i = 0; i < 3; i++) {
    let g = geo('lift-transfer-entry-L' + (i + 1), { kind: 'structure', floor: i });
    for (let xx of [-.42, .42]) rail(g, [lx + xx, zr], [lx + xx, Math.max(.05, carBack - .025)], trackY[i]);
  }
  let machine = geo('lift-machinery', { kind: 'lift' });
  machine.box([lx + .86, top - .4, .38], [.26, .33, .4], C.steelDark, true);
  machine.cyl([lx + .72, top - .39, .38], [lx + 1.10, top - .39, .38], .12, C.steel, 14);
  const controlX = liftRight + .12, controlZ = LD + .08;
  machine.box([controlX, .64, controlZ], [.05, 1.28, .05], C.steelDark);
  machine.box([controlX, 1.24, controlZ], [.29, .38, .12], C.steel, true);
  machine.box([controlX, 1.31, controlZ + .064], [.22, .16, .012], C.black);
  machine.box([controlX, 1.31, controlZ + .073], [.18, .12, .012], C.blueDark);
  machine.box([controlX - .09, 1.14, controlZ + .072], [.03, .03, .022], C.red);
  machine.box([controlX + .04, 1.14, controlZ + .072], [.027, .027, .019], C.green);
  for (let i = 0; i < 3; i++) machine.cyl([controlX, 1.48 + i * .062, controlZ], [controlX, 1.53 + i * .062, controlZ], .029, [C.green, C.yellow, C.red][i], 12);

  const cs = slots.CHG, cp = cfg.chargerProtrusion, cz = F + cp - .085;
  let chg = geo('external-charger-3F', { kind: 'charger', floor: 2 });
  chg.box([cs.x, cs.y + .11, cz], [1.004, .3585, .14], C.light, true);
  chg.box([cs.x, cs.y + .10, cz + .076], [.84, .24, .014], C.steel, true);
  chg.box([cs.x, cs.y + .072, cz - .076], [.22, .12, .021], C.black, true);
  chg.box([cs.x + .39, cs.y + .12, cz + .085], [.027, .025, .018], C.green);
  for (let x of [-.44, .44]) {
    chg.box([cs.x + x, cs.y - .10, F + cp / 2], [.055, .07, cp], C.steelDark, true);
    chg.box([cs.x + x, cs.y + .03, cz], [.045, .36, .06], C.steelDark);
  }


  const gcol = color('#daa552');
  let gaps = geo('lift-side-clearance-overlay', { kind: 'clearance', alpha: .16 });
  for (let [a, b] of [[leftRackEnd, liftLeft], [liftRight, rightRackStart]]) gaps.box([(a + b) / 2, .007, F / 2], [b - a, .015, F], gcol);
  let outset = geo('lift-front-projection-overlay', { kind: 'clearance', alpha: .10 });
  outset.box([lx, .009, F + cfg.liftProtrusion / 2], [lw, .017, cfg.liftProtrusion], gcol);
  let guides = geo('clearance-guides', { kind: 'clearance' });
  for (let [a, b] of [[leftRackEnd, liftLeft], [liftRight, rightRackStart]]) {
    guides.line([a, .035, F + .08], [b, .035, F + .08], gcol);
    for (let x of [a, b]) guides.line([x, .035, F - .02], [x, .035, F + .18], gcol);
  }
  for (let x = left; x < right; x += .36) guides.line([x, .021, F], [Math.min(x + .19, right), .021, F], gcol);
  addLabel('GAPL', '좌 여유 ' + Math.round(cfg.leftGap * 1000) + '†', [(leftRackEnd + liftLeft) / 2, .09, F + .16], 'gap');
  addLabel('GAPR', '우 여유 ' + Math.round(cfg.rightGap * 1000) + '†', [(liftRight + rightRackStart) / 2, .09, F + .16], 'gap');
  addLabel('PROJ', '전면 돌출 ' + Math.round(cfg.liftProtrusion * 1000) + '†', [lx, .09, LD + .15], 'gap');

  for (let g of geos.slice(geoStart)) { bakeRack(g); g.rack = true; }
  for (let l of labels.slice(labelStart)) { l.p = Rpoint(l.p); l.rack = true; }
  for (let s of Object.values(slots)) s.world = Rpoint([s.x, s.y + .156, s.z]);
}

export function importMesh(g, p, col, shift = 0) {
  const cv = (v, i) => [v[i] / 1000 + shift, v[i + 2] / 1000, -v[i + 1] / 1000];
  for (let i = 0; i < p.f.length; i += 3) {
    const a = cv(p.v, p.f[i] * 3), b = cv(p.v, p.f[i + 1] * 3), c = cv(p.v, p.f[i + 2] * 3),
          n = V.norm(V.cross(V.sub(b, a), V.sub(c, a)));
    g.tri(a, b, c, n, col);
  }
  if (!['bolt', 'pad', 'bracket'].includes(p.cat))
    for (let i = 0; i < p.edges.length; i += 2)
      g.line(cv(p.v, p.edges[i] * 3), cv(p.v, p.edges[i + 1] * 3), col.map(x => x * .73));
}

export function makeSourceBuffer(id) {
  const byCat = new Map();
  for (const p of bufferData.parts) {
    let g = byCat.get(p.cat);
    if (!g) {
      g = geo(id + ' / ' + p.cat, { kind: 'buffer', station: id });
      byCat.set(p.cat, g);
    }
    importMesh(g, p, color(bufferColors[p.cat]));
  }
  for (let g of byCat.values()) {
    g.off = [cfg.bufferX, 0, id === 'B' ? cfg.bZ : cfg.cZ];
    g.yaw = id === 'B' ? 0 : Math.PI;
  }
  slots[id] = { id, kind: 'buffer', floor: 0, world: [cfg.bufferX, .28, id === 'B' ? cfg.bZ : cfg.cZ], displayName: id };
  addLabel(id, id + ' · 고정 버퍼', [cfg.bufferX, .60, id === 'B' ? cfg.bZ - .65 : cfg.cZ + .68], 'buffer');
  addLabel(id + 'OPEN', id === 'B' ? '남측 AMR 진입' : '북측 AMR 진입', [cfg.bufferX, .055, id === 'B' ? cfg.bZ + .80 : cfg.cZ - .80], 'dimension');
}

export function makeSourceRobot(id, cat) {
  assets.robots[id] = [];
  for (const p of originalActors.filter(p => p.cat === cat)) {
    const lift = p.group.endsWith('Fork') || p.group.endsWith('Lift');
    let g = geo(id + ' / ' + p.name, { kind: 'robot', actor: id, part: lift ? 'lift' : 'body' });
    importMesh(g, p, color(p.color), halfBody[id] || 0);
    assets.robots[id].push(g);
  }
  if (id === 'SEER' || id === 'HDX') {
    let g = geo(id + ' / nominal rear plate', { kind: 'robot', actor: id, part: 'body' });
    g.box([-halfBody[id] + .006, .17, 0], [.012, .18, id === 'SEER' ? 1.18 : .985], color(id === 'SEER' ? '#34414b' : '#687986'));
    assets.robots[id].push(g);
  }
  const env = geo(id + ' / nominal envelope', { kind: 'envelope', actor: id });
  if (id === 'AMR') ringBox(env, [0, .125, 0], [.65, .25, .95], C.teal);
  else {
    const len = id === 'SEER' ? 2.767 : 1.74, H = id === 'SEER' ? 2.235 : 1.990, W = id === 'SEER' ? 1.18 : .985;
    ringBox(env, [(len - 2 * halfBody[id]) / 2, H / 2, 0], [len, H, W], id === 'SEER' ? C.yellow : C.blue);
  }
  assets.envelopes[id] = env;
  addLabel(id, AINFO[id].name, [0, 0, 0], 'robot', -1, { actor: id });
}

export function makeShuttle(id) {
  const g = geo(id + ' / PTR-H-C89', { kind: 'robot', actor: id, part: 'body', rack: true });
  shuttle(g);
  if (id === 'S2')
    for (let i = 6; i < g.vertices.length; i += 9) {
      if (Math.abs(g.vertices[i] - C.blue[0]) < 1e-6 && Math.abs(g.vertices[i + 1] - C.blue[1]) < 1e-6) {
        const c = color('#288f88');
        g.vertices[i] = c[0];
        g.vertices[i + 1] = c[1];
        g.vertices[i + 2] = c[2];
      }
    }
  const d = geo(id + ' / 40mm lifting pads', { kind: 'robot', actor: id, part: 'lift', rack: true });
  for (const z of [-.285, .285]) d.box([0, .122, z], [1.03, .008, .07], C.light, true);
  assets.robots[id] = [g, d];
  const env = geo(id + ' / nominal envelope', { kind: 'envelope', actor: id, rack: true });
  ringBox(env, [0, .063, 0], [1.135, .126, .87], id === 'S1' ? C.blue : C.teal);
  assets.envelopes[id] = env;
  addLabel(id, AINFO[id].name, [0, 0, 0], 'robot', -1, { actor: id });
}

export function makeTrackedPallet(id, i) {
  const g = geo(id + ' / pallet 1100×1100×150', { kind: 'pallet', palletId: id });
  for (const p of originalActors.filter(p => p.cat === 'pallet')) importMesh(g, p, color(p.color));
  assets.pallets[id] = g;
  const cg = geo(id + ' / optional display cargo', { kind: 'cargo', palletId: id });
  for (const p of originalActors.filter(p => p.cat === 'cargo')) importMesh(cg, p, color(p.color));
  assets.cargo[id] = cg;
  addLabel('PAL-' + id, id, [0, 0, 0], 'palletid', -1, { palletId: id });
}

export function makeBooth() {
  const g = geo('9000×9000 booth plane', { kind: 'ground' });
  g.box([4.5, -.055, 4.5], [9, .10, 9], color('#eef3f5'));
  const grid = geo('500mm grid', { kind: 'grid' });
  for (let x = 0; x <= 9; x += .5) grid.line([x, .001, 0], [x, .001, 9], color(Number.isInteger(x) ? '#cbd8df' : '#dfe7ec'));
  for (let z = 0; z <= 9; z += .5) grid.line([0, .001, z], [9, .001, z], color(Number.isInteger(z) ? '#cbd8df' : '#dfe7ec'));
  const edge = geo('9000mm exhibition boundary', { kind: 'boundary' });
  for (const [a, b] of [[[0, .008, 0], [9, .008, 0]], [[9, .008, 0], [9, .008, 9]], [[9, .008, 9], [0, .008, 9]], [[0, .008, 9], [0, .008, 0]]])
    edge.beam(a, b, .023, color('#607f90'));
  for (const [x, z] of [[0, 0], [0, 9], [9, 0], [9, 9]]) edge.cyl([x, .012, z], [x, .036, z], .056, color('#557788'), 12);
  const dd = geo('Booth dimensions', { kind: 'dimension' });
  for (const [a, b] of [[[0, .015, 9.18], [9, .015, 9.18]], [[9.18, .015, 0], [9.18, .015, 9]]]) dd.line(a, b, color('#597b8f'));
  for (const x of [0, 9]) dd.line([x, .015, 9.06], [x, .015, 9.3], C.steelDark);
  for (const z of [0, 9]) dd.line([9.06, .015, z], [9.3, .015, z], C.steelDark);
  addLabel('BOOTHX', '9000 mm', [4.5, .04, 9.23], 'dimension');
  addLabel('BOOTHZ', '9000 mm', [9.28, .04, 4.5], 'dimension');
  addLabel('NORTH', 'N ↑', [8.65, .03, .40], 'dimension');
  const panel = geo('Buffer / AMR demonstration floor strip', { kind: 'zone', alpha: .28 });
  panel.box([8, .003, 4.5], [1.63, .008, 7.4], color('#d7e9e3'));
  const width = 3 * cfg.bayWidth + cfg.liftWidth + cfg.leftGap + cfg.rightGap;
  const rd = geo('Rack footprint dimensions', { kind: 'dimension' });
  const z1 = 4.5 - width / 2, z2 = 4.5 + width / 2, x1 = cfg.rackBack, x2 = cfg.rackBack + cfg.rearDepth + cfg.frontDepth;
  rd.line([x1 - .08, .035, z1], [x1 - .08, .035, z2], C.steelDark);
  addLabel('RACKL', Math.round(width * 1000) + ' mm †', [x1 + .15, .12, (z1 + z2) / 2], 'dimension');
  rd.line([x1, .02, z2 + .18], [x2, .02, z2 + .18], C.steelDark);
  addLabel('RACKD', '2560 mm', [.5 * (x1 + x2), .045, z2 + .23], 'dimension');
}

export function makePaths() {
  const g = geo('Concept transfer routes', { kind: 'path', alpha: .65 });
  const route = (points, c) => {
    for (let i = 1; i < points.length; i++) {
      const a = [points[i - 1][0], .029, points[i - 1][1]], b = [points[i][0], .029, points[i][1]];
      g.line(a, b, c);
      if (Math.hypot(...V.sub(b, a)) > .9) {
        const mid = V.lerp(a, b, .54), end = V.lerp(a, b, .68);
        g.arrow(mid, end, c, .10);
      }
    }
  };
  const A = slots.A.world, D = slots.D.world;
  route([[A[0] + .6, A[2]], [5.3, A[2]], [5.3, cfg.bZ], [cfg.bufferX - .58, cfg.bZ]], color('#c49a4b'));
  route([[cfg.bufferX, cfg.bZ + .62], [cfg.bufferX, (cfg.bZ + cfg.cZ) / 2], [cfg.bufferX, cfg.cZ - .62]], C.teal);
  route([[cfg.bufferX - .65, cfg.cZ], [5.8, cfg.cZ], [5.8, D[2]], [D[0] + .62, D[2]]], color('#719ab2'));
  const mid = (cfg.bZ + cfg.cZ) / 2, r = .84;
  for (let i = 0; i < 50; i++) {
    const a = i / 50 * Math.PI * 2, b = (i + 1) / 50 * Math.PI * 2;
    g.line([cfg.bufferX + r * Math.cos(a), .03, mid + r * Math.sin(a)], [cfg.bufferX + r * Math.cos(b), .03, mid + r * Math.sin(b)], color('#70a69b'));
  }

  addLabel('ROUTE', '동선은 연출용 · 조향 궤적 아님', [5.5, .028, 4.7], 'dimension');
}

export function buildAll() {
  for (const g of geos) g.dispose();
  setGeos([]);
  setLabels([]);
  setSlots({});
  $('overlay').innerHTML = '';
  assets.robots = {}; assets.pallets = {}; assets.cargo = {}; assets.envelopes = {};
  makeBooth();
  buildRack();
  makeSourceBuffer('B');
  makeSourceBuffer('C');
  makeShuttle('S1');
  makeShuttle('S2');
  makeSourceRobot('SEER', 'seer');
  makeSourceRobot('HDX', 'hdx');
  makeSourceRobot('AMR', 'amr');
  ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10'].forEach(makeTrackedPallet);
  makePaths();
  for (const g of geos) g.upload();
  syncLayoutUI();
  resetSimulation();
  setDirty(true);
}
