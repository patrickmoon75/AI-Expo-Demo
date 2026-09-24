import { V, rotateVector } from '../utils/math.js';
import { $ } from '../utils/helpers.js';
import {
  sim, cfg, slots, trackY, assets, palletReach, halfBody, setDirty, liftCar,
  metricsBlank
} from './state.js';
import { Rpoint, updateVisibility } from '../render/webglRenderer.js';

export function log(event, detail, palletId = '') {
  sim.logs.push({ time: +sim.time.toFixed(2), event, detail, palletId });
  if (sim.logs.length > 1600) sim.logs.shift();
}

export function ready(id) {
  return !!sim.inventory[id] && !sim.reservations[id];
}

export function empty(id) {
  return !sim.inventory[id] && !sim.reservations[id];
}

export function reserve(ids, owner) {
  for (const id of ids)
    if (sim.reservations[id]) throw Error(id + ' 중복 예약');
  for (const id of ids)
    sim.reservations[id] = owner;
}

export function unlock(id, owner) {
  if (sim.reservations[id] === owner) delete sim.reservations[id];
}

export function worldStatic(id) {
  const s = slots[id];
  if (!s) throw Error('Unknown station ' + id);
  return s.world.slice();
}

export function actorWorld(a) {
  return a.id[0] === 'S' && a.id.length === 2 ? Rpoint(a.pos) : a.pos.slice();
}

export function actorYaw(a) {
  return a.id === 'S1' || a.id === 'S2' ? Math.PI / 2 : a.yaw;
}

export function carrierBottom(a) {
  if (a.id === 'S1' || a.id === 'S2') return a.pos[1] + .126 + a.deck;
  if (a.id === 'AMR') return a.deck;
  return a.forkTop - .125;
}

export function palletPosition(id) {
  const p = sim.pallets[id];
  if (!p) return [0, 0, 0];
  if (!p.location.startsWith('@')) return worldStatic(p.location);
  const a = sim.actors[p.location.slice(1)], pos = actorWorld(a);
  pos[1] = carrierBottom(a);
  if (palletReach[a.id]) {
    const d = rotateVector([palletReach[a.id], 0, 0], a.yaw);
    pos[0] += d[0];
    pos[2] += d[2];
  }
  return pos;
}

export function palletYaw(id) {
  const p = sim.pallets[id];
  if (!p) return 0;
  return p.location.startsWith('@') ? actorYaw(sim.actors[p.location.slice(1)]) + p.yawOffset : p.yaw;
}

export function pick(id, a) {
  if (!sim.inventory[id] || a.payload || sim.reservations[id] !== a.id)
    throw Error(id + ' 픽업 상태 불일치');
  const pid = sim.inventory[id], p = sim.pallets[pid], before = worldStatic(id);
  const yaw = p.yaw;
  p.location = '@' + a.id;
  p.yawOffset = yaw - actorYaw(a);
  a.payload = pid;
  sim.inventory[id] = null;
  const after = palletPosition(pid);
  if (Math.hypot(...V.sub(before, after)) > .002)
    throw Error(a.id + ' 픽업 인계 좌표 불연속');
  if (id === 'A' && (!p.cycleStartTime || p.cycleStartTime === 0)) {
    p.cycleStartTime = sim.time;
  }
  log('PICK', a.id + ' · ' + id + ' 픽업', pid);
}

export function put(id, a) {
  if (!a.payload || sim.inventory[id] || sim.reservations[id] !== a.id)
    throw Error(id + ' 하차 상태 불일치');
  const pid = a.payload, p = sim.pallets[pid], before = palletPosition(pid), after = worldStatic(id), yaw = palletYaw(pid);
  if (Math.hypot(...V.sub(before, after)) > .002)
    throw Error(a.id + ' 하차 인계 좌표 불연속 ' + before + ' / ' + after);
  a.payload = null;
  p.location = id;
  p.yaw = yaw;
  p.yawOffset = 0;
  sim.inventory[id] = pid;
  if (id === 'A') {
    const start = p.cycleStartTime || 0;
    const cycleTime = sim.time - start;
    if (cycleTime > 0.5) {
      if (!sim.kpi) sim.kpi = { cycleCount: 0, totalCycleTime: 0 };
      sim.kpi.cycleCount++;
      sim.kpi.totalCycleTime += cycleTime;
      log('KPI', `A→A 순환 완료: ${cycleTime.toFixed(2)}초 (${pid})`, pid);
    }
    p.cycleStartTime = sim.time;
  }
  log('PUT', a.id + ' · ' + id + ' 안착', pid);
}

export function getShuttleCount() {
  const el = $('circulatingCount');
  if (!el) return 1;
  const val = Number(el.value);
  return (val === 1 || val === 3) ? 1 : 2;
}

export function syncGeometry() {
  const numShuttles = getShuttleCount();
  for (const a of Object.values(sim.actors)) {
    const p = actorWorld(a), yaw = actorYaw(a);
    const activeRobot = (a.id !== 'S2' || numShuttles >= 2);
    if (assets.robots[a.id]) {
      for (const g of assets.robots[a.id]) {
        g.off = p.slice();
        g.yaw = yaw;
        g.visible = activeRobot;
        if (g.part === 'lift')
          g.off[1] += a.id === 'S1' || a.id === 'S2' ? a.deck : a.id === 'AMR' ? a.deck : a.forkTop;
        g.floor = (a.id === 'S1' || a.id === 'S2') ? trackY.findIndex(y => Math.abs(y - a.pos[1]) < .1) : -1;
      }
    }
    const e = assets.envelopes[a.id];
    if (e) {
      e.off = p.slice();
      e.yaw = yaw;
      e.visible = activeRobot;
      e.floor = (a.id === 'S1' || a.id === 'S2') ? trackY.findIndex(y => Math.abs(y - a.pos[1]) < .1) : -1;
    }
  }
  if (liftCar) liftCar.off = [0, sim.liftY, 0];
  for (const [id, g] of Object.entries(assets.pallets)) {
    const active = !!sim.pallets[id];
    g.visible = active;
    const c = assets.cargo[id];
    if (c) c.visible = active;
    if (active) {
      g.off = palletPosition(id);
      g.yaw = palletYaw(id);
      if (c) {
        c.off = g.off.slice();
        c.yaw = g.yaw;
      }
    }
  }
  updateVisibility();
  setDirty(true);
}

export function internalCount() {
  return sim.counts.out + sim.counts.in + sim.counts.relocate + (sim.counts.vertical || 0);
}

export function assertScenario() {
  const ids = Object.keys(sim.pallets), seen = [];
  for (const [id, p] of Object.entries(sim.inventory))
    if (p) {
      if (sim.pallets[p]?.location !== id) throw Error('재고 위치 불일치: ' + id);
      seen.push(p);
    }
  for (const a of Object.values(sim.actors)) {
    if (a.payload) {
      if (sim.pallets[a.payload]?.location !== '@' + a.id) throw Error('운반 재고 불일치');
      seen.push(a.payload);
    }
    if (!a.pos.every(Number.isFinite) || !Number.isFinite(a.yaw)) throw Error('유효하지 않은 장비 위치');
  }
  if (seen.length !== ids.length || new Set(seen).size !== ids.length) throw Error('팔레트 수량 또는 중복 오류');
  for (const [id, owner] of Object.entries(sim.reservations))
    if (!sim.actors[owner]?.job) throw Error('소유 작업이 없는 예약: ' + id);

  const isCont = sim.config.mode === 'continuous';
  if (!isCont && sim.actors.S1.job && sim.actors.S2.job) throw Error('공용 통로 순차 예약 위반');
  if (isCont) {
    if (Math.abs(sim.actors.S1.pos[1] - trackY[0]) > .002) throw Error('S1 전용층 위반');
    if (sim.actors.S2.pos[1] < trackY[1] - .002) throw Error('S2 전용층 위반');
  }
  for (const id of ['S1', 'S2'])
    if (sim.actors[id].deck < -.0001 || sim.actors[id].deck > .0401) throw Error('셔틀 리프팅 범위 오류');
  if (sim.actors.AMR.deck < .2499 || sim.actors.AMR.deck > .3101) throw Error('AMR 리프팅 범위 오류');

  const a = sim.actors.AMR;
  if (a.job && 'yaw' in a.job.steps[a.job.index].changes && Math.min(Math.abs(a.pos[2] - cfg.bZ), Math.abs(a.pos[2] - cfg.cZ)) < 1.25)
    throw Error('AMR 버퍼 내부 회전 오류');

  return { ok: true, palletCount: ids.length, unique: new Set(seen).size, shuttleCount: 2 };
}

export function nominalCorners(id) {
  if (id === 'AMR') return [[-.325, -.475], [-.325, .475], [.325, -.475], [.325, .475]];
  if (id === 'S1' || id === 'S2') return [[-.5675, -.435], [-.5675, .435], [.5675, -.435], [.5675, .435]];
  const rear = -halfBody[id], front = halfBody[id] + (id === 'SEER' ? 1.07 : 1.15), w = id === 'SEER' ? .590 : .4925;
  return [[rear, -w], [rear, w], [front, -w], [front, w]];
}

export function boundaryReport() {
  let outside = [], bounds = {};
  for (const [id, a] of Object.entries(sim.actors)) {
    const p = actorWorld(a), pts = nominalCorners(id).map(q => V.add(rotateVector([q[0], 0, q[1]], actorYaw(a)), p));
    const bb = { minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])), minZ: Math.min(...pts.map(p => p[2])), maxZ: Math.max(...pts.map(p => p[2])) };
    bounds[id] = bb;
    if (bb.minX < -.001 || bb.maxX > 9.001 || bb.minZ < -.001 || bb.maxZ > 9.001) outside.push(id);
  }
  for (const pid of Object.keys(sim.pallets)) {
    const p = palletPosition(pid), pts = [[-.55, -.55], [-.55, .55], [.55, -.55], [.55, .55]].map(q => V.add(rotateVector([q[0], 0, q[1]], palletYaw(pid)), p));
    const bb = { minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])), minZ: Math.min(...pts.map(p => p[2])), maxZ: Math.max(...pts.map(p => p[2])) };
    bounds[pid] = bb;
    if (bb.minX < -.001 || bb.maxX > 9.001 || bb.minZ < -.001 || bb.maxZ > 9.001) outside.push(pid);
  }
  return { outside, bounds, note: 'Nominal moving-body plan envelopes only; NOT collision / turning-radius / safe-clearance validation.' };
}

export function advanceSimulation(dt, force = false, scheduleFn, tickActorFn) {
  if ((!sim.playing && !force) || sim.error) return;
  let left = Math.max(0, dt);
  try {
    while (left > 1e-9 && (sim.playing || force)) {
      const step = Math.min(.05, left);
      if (scheduleFn) scheduleFn();
      sim.time += step;
      for (const a of Object.values(sim.actors)) {
        if (tickActorFn) tickActorFn(a, step);
      }
      assertScenario();
      left -= step;
    }
  } catch (e) {
    sim.error = e.message;
    sim.playing = false;
    log('ERROR', e.message);
    console.error(e);
  }
  syncGeometry();
  setDirty(true);
}

export function makeActor(id, pos, yaw = 0) {
  return { id, pos: pos.slice(), yaw, deck: id === 'AMR' ? .25 : 0, forkTop: id === 'HDX' ? .395 : .50, payload: null, job: null, count: 0 };
}

export function resetSimulationLegacy(updateUIFn) {
  const x1 = $('storageOne').value || 'X1', x2 = $('storageTwo').value || 'X2';
  if (x1 === x2) {
    if (window.toast) window.toast('서로 다른 보관 칸을 지정해 주세요.');
    return;
  }
  sim.config = { x1, x2, third: $('thirdPallet').checked, external: $('autoExternal').checked };
  Object.assign(sim, {
    time: 0, playing: false, error: null, actors: {}, inventory: {}, reservations: {}, pallets: {},
    counts: { out: 0, in: 0, relocate: 0, seer: 0, amr: 0, hdx: 0 }, logs: [], liftY: trackY[0], liftOwner: null,
    rackOwner: null, lastShuttle: 'S1', stopAt: null
  });
  const available = ['X6', 'X4', 'X3', 'X5', 'CHG', 'X1', 'X2'].filter(s => s !== x1 && s !== x2);
  sim.homes = { S1: available[0], S2: available[1] };
  for (const [id, s] of Object.entries(slots)) if (s.kind !== 'lift') sim.inventory[id] = null;
  for (const id of ['S1', 'S2']) {
    const h = slots[sim.homes[id]];
    sim.actors[id] = makeActor(id, [h.x, h.y, h.z]);
  }
  sim.actors.SEER = makeActor('SEER', [5.3, 0, cfg.bZ], 0);
  sim.actors.HDX = makeActor('HDX', [5.8, 0, cfg.cZ], 0);
  sim.actors.AMR = makeActor('AMR', [cfg.bufferX, 0, cfg.bZ + 1.4], 0);

  const seed = [['P01', x2], ['P02', 'D']];
  if (sim.config.third) seed.push(['P03', 'B']);
  for (const [id, loc] of seed) {
    sim.inventory[loc] = id;
    sim.pallets[id] = { id, location: loc, yaw: 0, yawOffset: 0 };
  }
  for (const id of ['storageOne', 'storageTwo'])
    for (const o of $(id).options) o.disabled = o.value === (id === 'storageOne' ? x2 : x1);

  log('RESET', '초기 팔레트 ' + seed.length + '개 / 셔틀 2대 / B·C 고정');
  syncGeometry();
  if (updateUIFn) updateUIFn();
  setDirty(true);
}

export function getActivePalletNodes() {
  const btns = document.querySelectorAll('#nodeButtonGrid .btn-node.active');
  if (!btns || !btns.length) return ['A', 'B', 'C', 'D'];
  return Array.from(btns).map(b => b.dataset.node);
}

export function resetSimulation(syncModeUIFn, updateUIFn) {
  resetSimulationLegacy(updateUIFn);
  sim.config.mode = $('scenarioMode').value;
  sim.config.circulating = Number($('circulatingCount').value);
  sim.counts.vertical = 0;
  sim.kpi = { cycleCount: 0, totalCycleTime: 0 };
  for (const a of Object.values(sim.actors)) {
    a.metrics = metricsBlank();
    a.activity = 'waiting';
    a.waitReason = '';
  }
  if (sim.config.mode === 'continuous' || sim.config.mode === 'direct' || sim.config.mode === 'custom') {
    sim.config.x1 = 'X1';
    sim.config.x2 = 'X2';
    sim.config.third = false;
    sim.logs = [];
    sim.inventory = {};
    for (const id of Object.keys(slots)) if (id !== 'LIFT') sim.inventory[id] = null;
    sim.pallets = {};
    const activeNodes = getActivePalletNodes();
    let idx = 1;
    const seed = [];
    for (const loc of activeNodes) {
      if (slots[loc]) {
        const pid = 'P' + String(idx++).padStart(2, '0');
        seed.push([pid, loc]);
        sim.pallets[pid] = { id: pid, location: loc, yaw: 0, yawOffset: 0 };
        sim.inventory[loc] = pid;
      }
    }
    sim.homes = { S1: 'X6', S2: 'X3' };
    sim.actors.S1.pos = [slots.X6.x, slots.X6.y, slots.X6.z];
    sim.actors.S2.pos = [slots.X3.x, slots.X3.y, slots.X3.z];
    sim.liftY = trackY[1];
    sim.liftOwner = null;
    sim.rackOwner = null;
    log('RESET', '선택된 초기 팔레트 ' + seed.length + '개 배치: ' + activeNodes.join(', '));
  }
  if (syncModeUIFn) syncModeUIFn();
  syncGeometry();
  if (updateUIFn) updateUIFn();
  setDirty(true);
}
