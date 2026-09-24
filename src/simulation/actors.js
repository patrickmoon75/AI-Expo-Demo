import { V } from '../utils/math.js';
import {
  sim, cfg, slots, palletReach, continuous, account, dims, trackY
} from './state.js';
import {
  log, ready, empty, reserve, unlock, pick, put, worldStatic, internalCount, getShuttleCount
} from './engine.js';

export function step(duration, title, changes = {}, begin = null, end = null) {
  return { duration: Math.max(.05, duration), title, changes, begin, end };
}

export function gate(title, test, onReady) {
  const s = step(.05, title, {}, onReady);
  s.test = test;
  return s;
}

export function setJob(a, title, key, steps) {
  a.job = { title, key, steps, index: 0, elapsed: 0, done: 0, total: steps.reduce((v, s) => v + s.duration, 0), started: false, from: null };
  log('START', a.id + ' · ' + title);
}

export function getRobotSpeed(actorId) {
  if (!sim.robotSpeeds) {
    sim.robotSpeeds = { Shuttle: 1.0, SEER: 0.5, AMR: 0.5, HDX: 0.5 };
  }
  if (actorId === 'S1' || actorId === 'S2') {
    return Number(sim.robotSpeeds.Shuttle) || 1.0;
  }
  return Number(sim.robotSpeeds[actorId]) || 0.5;
}

export function planMover(a) {
  const steps = [];
  let pos = a.pos.slice(), yaw = a.yaw;
  const robotSpeed = getRobotSpeed(a.id);
  const baseSpeed = (a.id === 'S1' || a.id === 'S2') ? 1.0 : 0.5;
  const speedScale = robotSpeed / baseSpeed;
  return {
    steps,
    move(to, title, nominalSpeed = .5) {
      const dist = Math.hypot(...V.sub(to, pos));
      const actualSpeed = Math.max(0.05, nominalSpeed * speedScale);
      if (dist > .00001) steps.push(step(Math.max(.1, dist / actualSpeed), title, { pos: to.slice() }));
      pos = to.slice();
    },
    turn(to, title) {
      const turnActual = Math.max(0.05, .55 * speedScale);
      let diff = to - yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const targetYaw = yaw + diff;
      if (Math.abs(diff) > .0001) steps.push(step(Math.max(.1, Math.abs(diff) / turnActual), title, { yaw: targetYaw }));
      yaw = targetYaw;
    },
    act(sec, title, changes = {}, begin = null, end = null) {
      steps.push(step(sec, title, changes, begin, end));
    },
    pos: () => pos.slice()
  };
}
export function isImmediate() {
  const el = typeof document !== 'undefined' ? document.getElementById('immediateMission') : null;
  return el ? el.checked : false;
}

export function dispatchSeerLegacy() {
  const a = sim.actors.SEER;
  const immediate = isImmediate();
  if (a.job || !ready('A')) return false;
  if (!immediate && !empty('B')) return false;
  reserve(immediate ? ['A'] : ['A', 'B'], a.id);
  const A = worldStatic('A'), B = worldStatic('B'), stage = 5.3, dockA = A[0] + palletReach.SEER, dockB = B[0] - palletReach.SEER;
  const m = planMover(a), travelBottom = A[1] + .06;
  m.act(.6, 'A / B 예약 · 반출 포크 높이 정렬', { forkTop: A[1] + .110 });
  m.turn(-Math.PI / 2, 'A 접근 · 남향 자세 전환 †');
  m.move([stage, 0, A[2]], 'A 진입 위치까지 북측으로 후진', .55);
  m.turn(-Math.PI, 'A를 향해 서향 정렬 †');
  m.move([dockA, 0, A[2]], 'A 전면 포크 삽입', .34);
  m.act(1.2, 'A 팔레트 데크 밑면 접촉', { forkTop: A[1] + .125 }, null, () => pick('A', a));
  m.act(1.8, 'A 팔레트 상승', { forkTop: travelBottom + .125 });
  m.move([stage, 0, A[2]], 'A에서 팔레트 반출 · 동측 후진', .5);
  m.act(.15, 'A 인계 구역 해제', {}, null, () => unlock('A', a.id));
  m.turn(Math.PI / 2, '후진 출차 선회 · 북향(포크) 정렬 †');
  m.move([stage, 0, (A[2] + B[2]) / 2], '중간 전환점까지 차체 후진 이동', .45);
  m.turn(0, '전진 방향 전환 · 동향(포크) 정렬 †');
  if (immediate) {
    m.steps.push(gate('B 비움·AMR 이탈 대기', () => empty('B'), () => reserve(['B'], a.id)));
  }
  m.act(1.6, '원본 인계 높이 · 팔레트 밑면 EL.410', { forkTop: .535 });
  m.move([dockB, 0, B[2]], 'B 지점 전진 접근 · 중심 정렬', .45);
  m.act(3, 'B에 팔레트 안착 · 밑면 EL.280', { forkTop: .405 }, null, () => put('B', a));
  m.act(1.5, 'SEER 포크 하강 · 지지 분리', { forkTop: .395 });
  m.move([stage, 0, B[2]], 'SEER 서측 후진 · AMR 인계 구역 이탈', .4);
  m.act(.15, 'B 인계 구역 해제', {}, null, () => unlock('B', a.id));
  setJob(a, 'A → B · SEER 지게차', 'seer', m.steps);
  return true;
}

export function dispatchAmr() {
  const a = sim.actors.AMR;
  const immediate = isImmediate();
  if (a.job || !ready('B')) return false;
  if (!immediate && !empty('C')) return false;
  reserve(immediate ? ['B'] : ['B', 'C'], a.id);
  const B = worldStatic('B'), Cpos = worldStatic('C'), x = cfg.bufferX, by = cfg.bZ, cy = cfg.cZ, mid = (by + cy) / 2, m = planMover(a);
  m.act(.6, 'B / C 예약 · 플랫폼 EL.250', { deck: .25 });
  m.move([x, 0, by], 'AMR B 남측 직진 진입', .32);
  m.act(1.5, 'B 팔레트 하면 접촉 · EL.280', { deck: .28 }, null, () => pick('B', a));
  m.act(1.5, 'AMR 상승 · 팔레트 EL.310', { deck: .31 });
  m.move([x, 0, by + 1.4], 'B 남측 후진 · 터널 안에서는 회전 금지', .34);
  m.act(.15, 'B 접근 구간 해제', {}, null, () => unlock('B', a.id));
  m.move([x, 0, mid], '팔레트까지 버퍼 밖 · 회전 지점 이동', .5);
  m.turn(Math.PI, '터널 밖 180° 회전');
  m.move([x, 0, cy - 1.4], 'C 북측 진입점 정렬', .5);
  if (immediate) {
    m.steps.push(gate('C 비움·HDX 이탈 대기', () => empty('C'), () => reserve(['C'], a.id)));
  }
  m.move([x, 0, cy], 'AMR C 북측 직진 진입', .32);
  m.act(1.5, 'C에 팔레트 안착 · EL.280', { deck: .28 }, null, () => put('C', a));
  m.act(1.5, 'AMR 플랫폼 하강 · EL.250', { deck: .25 });
  m.move([x, 0, cy - 1.4], 'AMR만 C 북측 후진 · HDX 접근 전 이탈', .34);
  m.act(.15, 'C 인계 구역 해제', {}, null, () => unlock('C', a.id));
  m.move([x, 0, mid], 'AMR 빈 차 복귀 · 중앙 이동', .55);
  m.turn(0, '빈 차 180° 회전 · B 재진입 방향');
  m.move([x, 0, by + 1.4], 'B 남측 대기 위치 복귀', .55);
  setJob(a, 'B → C · 고정 버퍼 인계', 'amr', m.steps);
  return true;
}

export function dispatchHdxLegacy() {
  const a = sim.actors.HDX;
  const immediate = isImmediate();
  if (a.job || !ready('C')) return false;
  if (!immediate && !empty('D')) return false;
  reserve(immediate ? ['C'] : ['C', 'D'], a.id);
  const Cpos = worldStatic('C'), D = worldStatic('D'), stage = 5.8, dockC = Cpos[0] - palletReach.HDX, dockD = D[0] + palletReach.HDX, m = planMover(a);
  m.act(.6, 'C / D 예약 · 포크 EL.395', { forkTop: .395 });
  m.move([dockC, 0, Cpos[2]], 'HDX C 서측 포크 삽입', .35);
  m.act(1.5, 'HDX 포크 접촉 · 데크 밑면 EL.405', { forkTop: .405 }, null, () => pick('C', a));
  m.act(3, 'C 가이드 상부로 팔레트 상승 · EL.410', { forkTop: .535 });
  m.move([stage, 0, Cpos[2]], 'HDX 서측 후진 · C에서 반출', .4);
  m.act(.15, 'C 인계 구역 해제', {}, null, () => unlock('C', a.id));
  if (immediate) {
    m.steps.push(gate('D 비움·셔틀 이탈 대기', () => empty('D'), () => reserve(['D'], a.id)));
  }
  m.act(1.8, 'D 안착면보다 높게 팔레트 상승', { forkTop: D[1] + .185 });
  m.turn(-Math.PI / 2, '후진 출차 선회 · 남향(포크) 정렬 †');
  m.move([stage, 0, (Cpos[2] + D[2]) / 2], '중간 전환점까지 차체 후진 이동', .45);
  m.turn(Math.PI, '전진 방향 전환 · 서향(포크) 정렬 †');
  m.move([dockD, 0, D[2]], 'HDX D 전면 직진 투입', .45);
  m.act(2.2, 'D 팔레트 안착', { forkTop: D[1] + .125 }, null, () => put('D', a));
  m.act(1.2, 'HDX 포크 하강 · D 지지 분리', { forkTop: D[1] + .110 });
  m.move([stage, 0, D[2]], 'D에서 동측 후진 · 셔틀 인계면 이탈', .45);
  m.act(.15, 'D 인계 구역 해제', {}, null, () => unlock('D', a.id));
  m.turn(Math.PI / 2, 'C 복귀 · 북향 정렬 †');
  m.move([stage, 0, Cpos[2]], 'C 서측 대기 위치 복귀', .55);
  m.turn(0, 'C 서측 포킹 방향 정렬 †');
  m.act(.8, 'HDX 대기 포크 높이', { forkTop: .395 });
  setJob(a, 'C → D · HDX 지게차', 'hdx', m.steps);
  return true;
}

export function dispatchShuttleLegacy(a, src, dst, key) {
  const immediate = isImmediate();
  if (sim.rackOwner || a.job || !ready(src)) return false;
  if (!immediate && !empty(dst)) return false;
  reserve(immediate ? [src] : [src, dst], a.id);
  sim.rackOwner = a.id;
  sim.liftOwner = a.id;
  const steps = [], home = slots[sim.homes[a.id]], S = slots[src], D = slots[dst];
  let p = a.pos.slice(), liftY = sim.liftY, loaded = false;
  const robotSpeed = getRobotSpeed(a.id);
  const speedScale = robotSpeed / 1.0;
  const add = (duration, title, changes = {}, begin = null, end = null) => steps.push(step(duration, title, changes, begin, end));
  const move = (to, title, speed = null) => {
    const distance = Math.hypot(...V.sub(to, p));
    const nominalSpeed = speed || (loaded ? 1 : 1.5);
    const actualSpeed = Math.max(0.05, nominalSpeed * speedScale);
    if (distance > .00001) add(Math.max(.1, distance / actualSpeed), title, { pos: to.slice() });
    p = to.slice();
  };
  const rear = () => move([p[0], p[1], dims.zr], '후면 통로로 직진 이탈', .55);
  function level(targetY) {
    if (Math.abs(p[1] - targetY) < .00001) return;
    rear();
    move([dims.xc[1], p[1], dims.zr], '리프트 후면 진입점 정렬');
    if (Math.abs(liftY - p[1]) > .00001) {
      add(Math.abs(liftY - p[1]) / (.6 * speedScale), '공용 리프트 호출 · 셔틀은 후면 대기', { liftY: p[1] });
      liftY = p[1];
    }
    move([dims.xc[1], p[1], dims.zl], '셔틀 리프트 탑승', .50);
    add(1, '리프트 탑승 확인 · 전용 예약 유지');
    add(Math.abs(targetY - p[1]) / (.6 * speedScale), '리프트 ' + (targetY > p[1] ? '상승' : '하강'), { pos: [p[0], targetY, p[2]], liftY: targetY });
    p = [p[0], targetY, p[2]];
    liftY = targetY;
    add(.7, '층 정렬 확인');
    rear();
  }
  function approach(s) {
    rear();
    level(s.y);
    move([s.x, s.y, dims.zr], s.id + ' 후면 통로 이동');
    move([s.x, s.y, s.z], s.id + ' 팔레트 하부 진입', .50);
  }
  approach(S);
  add(1.5, src + ' 팔레트 접촉', { deck: .030 }, null, () => pick(src, a));
  loaded = true;
  add(1.5, '셔틀 리프팅 40 mm', { deck: .040 });
  rear();
  if (immediate) {
    add(.1, src + ' 인계면 해제', {}, null, () => unlock(src, a.id));
    steps.push(gate(dst + ' 비움 대기', () => empty(dst), () => reserve([dst], a.id)));
  }
  approach(D);
  add(1.5, dst + ' 지지면에 팔레트 안착', { deck: .030 }, null, () => put(dst, a));
  loaded = false;
  add(1.5, '셔틀 리프팅 하강', { deck: 0 });
  rear();
  add(.1, src + '/' + dst + ' 인계면 해제', {}, null, () => {
    if (!immediate) unlock(src, a.id);
    unlock(dst, a.id);
  });
  approach(home);
  add(.4, sim.homes[a.id] + ' 빈 대기 칸 정차 · 다음 셔틀에 통로 해제');
  const title = key === 'out' ? 'X2 → A · 출고 보충' : key === 'in' ? 'D → X1 · 입고 보관' : 'X1 → X2 · 이적';
  setJob(a, title, key, steps);
  return true;
}

export function completedLegacy(a) {
  const j = a.job;
  if (!j) return;
  log('FINISH', a.id + ' · ' + j.title);
  a.count++;
  sim.counts[j.key]++;
  a.job = null;
  if (a.id === 'S1' || a.id === 'S2') {
    sim.rackOwner = null;
    sim.liftOwner = null;
    sim.lastShuttle = a.id;
  }
  for (const [id, owner] of Object.entries(sim.reservations))
    if (owner === a.id) delete sim.reservations[id];
  if (sim.stopAt != null && internalCount() >= sim.stopAt) {
    sim.playing = false;
    sim.stopAt = null;
  }
}

export function dispatchSeer() {
  if (!continuous()) return dispatchSeerLegacy();
  const a = sim.actors.SEER;
  const immediate = isImmediate();
  if (a.job || !ready('A')) return false;
  if (!immediate && !empty('B')) return false;
  reserve(immediate ? ['A'] : ['A', 'B'], a.id);
  const A = worldStatic('A'), B = worldStatic('B'), stage = 5.3, dockA = A[0] + palletReach.SEER, dockB = B[0] - palletReach.SEER, m = planMover(a);
  m.act(.6, 'A 예약 · 포크 높이 정렬', { forkTop: A[1] + .110 });
  if (Math.abs(a.pos[2] - A[2]) > .001) {
    m.turn(-Math.PI / 2, 'A 접근 · 남향 자세 정렬 †');
    m.move([stage, 0, A[2]], 'A 반출점으로 빈 차 복귀', .55);
  }
  m.turn(-Math.PI, 'A 반출 방향 정렬 †');
  m.move([dockA, 0, A[2]], 'A 팔레트 포크 삽입', .34);
  m.act(1.2, 'A 팔레트 접촉', { forkTop: A[1] + .125 }, null, () => pick('A', a));
  m.act(1.8, 'A 팔레트 상승', { forkTop: A[1] + .185 });
  m.move([stage, 0, A[2]], 'A에서 동측 후진 · 다음 팔레트 공간 확보', .5);
  if (immediate) {
    m.act(.15, 'A 인계 구역 해제', {}, null, () => unlock('A', a.id));
  }
  m.turn(Math.PI / 2, '후진 출차 선회 · 북향(포크) 정렬 †');
  m.move([stage, 0, (A[2] + B[2]) / 2], '중간 전환점까지 차체 후진 이동', .45);
  m.turn(0, '전진 방향 전환 · 동향(포크) 정렬 †');
  if (immediate) {
    m.steps.push(gate('B 비움·AMR 이탈 대기 (작업률 제외)', () => empty('B'), () => reserve(['B'], a.id)));
  }
  m.act(1.6, 'B 가이드 상부 · 팔레트 밑면 EL.410', { forkTop: .535 });
  m.move([dockB, 0, B[2]], 'B 지점 전진 접근 · 팔레트 중심 정렬', .45);
  m.act(3, 'B 팔레트 안착 · EL.280', { forkTop: .405 }, null, () => put('B', a));
  m.act(1.5, 'SEER 포크 하강·지지 분리', { forkTop: .395 });
  m.move([stage, 0, B[2]], 'B에서 서측 후진 · AMR 인계 허용', .4);
  m.act(.15, 'A/B 인계 구역 해제', {}, null, () => {
    if (!immediate) unlock('A', a.id);
    unlock('B', a.id);
  });
  m.turn(-Math.PI / 2, '다음 A 반출 준비 · 자세 정렬 †');
  m.move([stage, 0, A[2]], '다음 A 픽업점으로 빈 차 복귀', .55);
  m.turn(-Math.PI, '다음 A 포킹 방향 선행 정렬 †');
  setJob(a, 'A → B · 다음 반출 선행 준비', 'seer', m.steps);
  return true;
}

export function dispatchHdx() {
  if (!continuous()) return dispatchHdxLegacy();
  const a = sim.actors.HDX;
  const immediate = isImmediate();
  if (a.job || !ready('C')) return false;
  if (!immediate && !empty('D')) return false;
  reserve(immediate ? ['C'] : ['C', 'D'], a.id);
  const Cp = worldStatic('C'), D = worldStatic('D'), stage = 5.8, dockC = Cp[0] - palletReach.HDX, dockD = D[0] + palletReach.HDX, m = planMover(a);
  m.act(.6, 'C 예약 · 포크 EL.395', { forkTop: .395 });
  m.move([dockC, 0, Cp[2]], 'C 서측 포크 삽입', .35);
  m.act(1.5, 'C 팔레트 데크 밑면 접촉', { forkTop: .405 }, null, () => pick('C', a));
  m.act(3, 'C 가이드 상부로 팔레트 상승 · EL.410', { forkTop: .535 });
  m.move([stage, 0, Cp[2]], 'C에서 서측 후진 · 다음 AMR 하차 공간 확보', .4);
  if (immediate) {
    m.act(.15, 'C 인계 구역 해제', {}, null, () => unlock('C', a.id));
    m.steps.push(gate('D 비움·셔틀 이탈 대기 (작업률 제외)', () => empty('D'), () => reserve(['D'], a.id)));
  }
  m.act(1.8, 'D 안착면 위로 팔레트 상승', { forkTop: D[1] + .185 });
  m.turn(-Math.PI / 2, '후진 출차 선회 · 남향(포크) 정렬 †');
  m.move([stage, 0, (Cp[2] + D[2]) / 2], '중간 전환점까지 차체 후진 이동', .45);
  m.turn(Math.PI, '전진 방향 전환 · 서향(포크) 정렬 †');
  m.move([dockD, 0, D[2]], 'D 전면 팔레트 투입', .45);
  m.act(2.2, 'D 팔레트 안착', { forkTop: D[1] + .125 }, null, () => put('D', a));
  m.act(1.2, 'HDX 포크 하강·지지 분리', { forkTop: D[1] + .110 });
  m.move([stage, 0, D[2]], 'D에서 동측 후진 · 셔틀 인계 허용', .45);
  m.act(.15, 'C/D 인계 구역 해제', {}, null, () => {
    if (!immediate) unlock('C', a.id);
    unlock('D', a.id);
  });
  m.turn(Math.PI / 2, '다음 C 픽업 준비 · 자세 정렬 †');
  m.move([stage, 0, Cp[2]], '다음 C 픽업점으로 빈 차 복귀', .55);
  m.turn(0, 'C 서측 포킹 방향 선행 정렬 †');
  m.act(.8, '다음 C 픽업 높이 정렬', { forkTop: .395 });
  setJob(a, 'C → D · 다음 입고 선행 준비', 'hdx', m.steps);
  return true;
}

export function dispatchShuttle(a, src, dst, key) {
  if (!continuous()) return dispatchShuttleLegacy(a, src, dst, key);
  const immediate = isImmediate();
  if (a.job || !ready(src)) return false;
  if (!immediate && !empty(dst)) return false;
  const S = slots[src], D = slots[dst];
  const needsLift = Math.abs(a.pos[1] - S.y) > .001 || S.floor !== D.floor;
  if (needsLift && sim.liftOwner && sim.liftOwner !== a.id) return false;
  reserve(immediate ? [src] : [src, dst], a.id);
  if (needsLift) sim.liftOwner = a.id;
  const steps = [];
  let p = a.pos.slice(), liftY = sim.liftY, loaded = false;
  const robotSpeed = getRobotSpeed(a.id);
  const speedScale = robotSpeed / 1.0;
  const add = (duration, title, changes = {}, begin = null, end = null) => steps.push(step(duration, title, changes, begin, end));
  const move = (to, title, speed = null) => {
    const distance = Math.hypot(...V.sub(to, p));
    const nominalSpeed = speed || (loaded ? 1 : 1.5);
    const actualSpeed = Math.max(0.05, nominalSpeed * speedScale);
    if (distance > .00001) add(Math.max(.1, distance / actualSpeed), title, { pos: to.slice() });
    p = to.slice();
  };
  const rear = () => move([p[0], p[1], dims.zr], '동일 층 후면 통로로 직진 이탈', .55);
  function level(y) {
    if (Math.abs(p[1] - y) < .00001) return;
    rear();
    move([dims.xc[1], p[1], dims.zr], '상층 리프트 후면 정렬');
    if (Math.abs(liftY - p[1]) > .00001) {
      add(Math.abs(liftY - p[1]) / (.6 * speedScale), '리프트 호출 · 상층 전용', { liftY: p[1] });
      liftY = p[1];
    }
    move([dims.xc[1], p[1], dims.zl], 'S2 리프트 탑승', .5);
    add(1, '리프트 탑승 확인');
    add(Math.abs(y - p[1]) / (.6 * speedScale), '상층 리프트 ' + (y > p[1] ? '상승' : '하강'), { pos: [p[0], y, p[2]], liftY: y });
    p = [p[0], y, p[2]];
    liftY = y;
    add(.7, '상층 레일 정렬 확인');
    rear();
  }
  const approach = s => {
    rear();
    level(s.y);
    move([s.x, s.y, dims.zr], s.id + ' 후면 접근');
    move([s.x, s.y, s.z], s.id + ' 팔레트 하부 진입', .5);
  };
  approach(S);
  add(1.5, src + ' 팔레트 접촉', { deck: .03 }, null, () => pick(src, a));
  loaded = true;
  add(1.5, '셔틀 팔레트 리프팅 40 mm', { deck: .04 });
  rear();
  if (immediate) {
    add(.1, src + ' 인계면 해제', {}, null, () => unlock(src, a.id));
    steps.push(gate(dst + ' 비움 대기', () => empty(dst), () => reserve([dst], a.id)));
  }
  approach(D);
  add(1.5, dst + ' 팔레트 안착', { deck: .03 }, null, () => put(dst, a));
  loaded = false;
  add(1.5, '셔틀 리프팅 하강', { deck: 0 });
  rear();
  add(.1, src + '/' + dst + ' 인계면 해제', {}, null, () => {
    if (!immediate) unlock(src, a.id);
    unlock(dst, a.id);
  });
  setJob(a, (a.id === 'S1' ? '1단 순환 · ' : '상층 별도 시연 · ') + src + ' → ' + dst, key, steps);
  return true;
}

export function scheduleLegacy() {
  if (!sim.rackOwner) {
    const a = sim.actors[sim.lastShuttle === 'S1' ? 'S2' : 'S1'], x1 = sim.config.x1, x2 = sim.config.x2;
    if (empty('A') && ready(x2)) dispatchShuttle(a, x2, 'A', 'out');
    else if (ready('D') && empty(x1)) dispatchShuttle(a, 'D', x1, 'in');
    else if (ready(x1) && empty(x2)) dispatchShuttle(a, x1, x2, 'relocate');
  }
  if (sim.config.external) {
    dispatchHdx();
    dispatchAmr();
    dispatchSeer();
  }
}

export function schedule() {
  if (!continuous()) return scheduleLegacy();
  const s1 = sim.actors.S1, s2 = sim.actors.S2;
  if (!s1.job) {
    const mode = sim.config.mode || 'direct';
    let route = ['D', 'X1', 'A'];
    if (mode === 'continuous') {
      route = ['D', 'X1', 'X6', 'A'];
    } else if (mode === 'custom') {
      const customNodes = sim.config.customRoute && sim.config.customRoute.length ? sim.config.customRoute : ['X1'];
      route = ['D', ...customNodes, 'A'];
    }

    for (let i = route.length - 1; i > 0; i--) {
      const dst = route[i];
      const src = route[i - 1];
      if (ready(src) && empty(dst)) {
        const key = (dst === 'A') ? 'out' : (src === 'D') ? 'in' : 'relocate';
        dispatchShuttle(s1, src, dst, key);
        break;
      }
    }
  }
  const numShuttles = getShuttleCount();
  if (numShuttles >= 2 && !s2.job) {
    const route = ['X3', 'X1', 'X2', 'X5'];
    const p = Object.values(sim.pallets).find(pal => route.includes(pal?.location));
    if (p) {
      const idx = route.indexOf(p.location);
      if (idx >= 0) dispatchShuttle(s2, route[idx], route[(idx + 1) % route.length], 'vertical');
    }
  }
  if (sim.config.external) {
    dispatchHdx();
    dispatchAmr();
    dispatchSeer();
  }
}

export function completed(a) {
  if (!continuous()) return completedLegacy(a);
  const j = a.job;
  if (!j) return;
  log('FINISH', a.id + ' · ' + j.title);
  a.count++;
  sim.counts[j.key] = (sim.counts[j.key] || 0) + 1;
  a.job = null;
  a.waitReason = '';
  if (sim.liftOwner === a.id) sim.liftOwner = null;
  for (const [id, owner] of Object.entries(sim.reservations))
    if (owner === a.id) delete sim.reservations[id];
  if (sim.stopAt != null && internalCount() >= sim.stopAt) {
    sim.playing = false;
    sim.stopAt = null;
  }
}

export function tickActor(a, dt) {
  let remain = dt, guard = 0;
  while (remain > 1e-9 && guard++ < 60) {
    if (!a.job) {
      account(a, 'waiting', remain);
      a.waitReason = idleReason(a);
      break;
    }
    const j = a.job, s = j.steps[j.index];
    if (!j.started && s.test && !s.test()) {
      j.blocked = true;
      a.waitReason = s.title;
      account(a, 'waiting', remain);
      j.waited = (j.waited || 0) + remain;
      break;
    }
    j.blocked = false;
    a.waitReason = '';
    if (!j.started) {
      j.from = { pos: a.pos.slice(), yaw: a.yaw, deck: a.deck, forkTop: a.forkTop, liftY: sim.liftY };
      if (s.begin) s.begin();
      j.started = true;
    }
    const used = Math.min(remain, s.duration - j.elapsed),
          kind = s.changes.pos || s.changes.yaw !== undefined ? (a.payload ? 'loaded' : 'empty') : 'handling';
    account(a, kind, used);
    j.elapsed += used;
    j.done += used;
    remain -= used;
    const u = Math.max(0, Math.min(1, j.elapsed / s.duration)), t = u * u * (3 - 2 * u);
    for (const [k, v] of Object.entries(s.changes)) {
      const value = Array.isArray(v) ? V.lerp(j.from[k], v, t) : j.from[k] + (v - j.from[k]) * t;
      if (k === 'liftY') sim.liftY = value;
      else a[k] = value;
    }
    if (j.elapsed >= s.duration - 1e-8) {
      for (const [k, v] of Object.entries(s.changes)) {
        if (k === 'liftY') sim.liftY = v;
        else a[k] = Array.isArray(v) ? v.slice() : v;
      }
      if (s.end) s.end();
      j.index++;
      j.elapsed = 0;
      j.started = false;
      if (j.index >= j.steps.length) completed(a);
    }
  }
}

export function idleReason(a) {
  const immediate = isImmediate();
  if (a.id === 'SEER') return !sim.config.external ? '자동 순환 OFF' : !sim.inventory.A ? 'A 팔레트 공급 대기' : sim.reservations.A ? 'A 셔틀 이탈 대기' : (!immediate && !empty('B')) ? 'B 비움 대기' : '다음 작업 배차';
  if (a.id === 'HDX') return !sim.config.external ? '자동 순환 OFF' : !sim.inventory.C ? 'C 팔레트 공급 대기' : sim.reservations.C ? 'C AMR 이탈 대기' : (!immediate && !empty('D')) ? 'D 비움 대기' : '다음 작업 배차';
  if (a.id === 'AMR') return !sim.config.external ? '자동 순환 OFF' : !sim.inventory.B ? 'B 팔레트 공급 대기' : sim.reservations.B ? 'B SEER 이탈 대기' : (!immediate && !empty('C')) ? 'C 비움·HDX 이탈 대기' : '다음 작업 배차';
  return continuous() ? (a.id === 'S1' ? 'D 재고 / A·X6 인계 가능 상태 대기' : '상층 시연 배차') : '후면 통로·리프트 배차 대기';
}
