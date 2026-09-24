import { V, copy } from '../utils/math.js';
import { $, formatTime, formatTimeHMS } from '../utils/helpers.js';
import {
  sim, cfg, setCfg, slots, dims, geos, labels, selection, setSelection,
  autoRotate, setAutoRotate, cameraMode, setDirty, AINFO, continuous,
  activityReport, initialCfg
} from '../simulation/state.js';
import {
  actorWorld, palletPosition, palletYaw, boundaryReport, resetSimulation,
  advanceSimulation, internalCount, assertScenario
} from '../simulation/engine.js';
import { schedule, tickActor } from '../simulation/actors.js';
import { setCamera, fitScene, render, makeGLB as generateGLB } from '../render/webglRenderer.js';
import { buildAll } from '../models/sceneModels.js';

export function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('on');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $('toast').classList.remove('on'), 3500);
}

export function displaySlot(s) {
  return s === 'CHG' ? '셔틀 충전기' : s;
}

export function playPause() {
  if (sim.error) {
    toast('초기화한 후 다시 재생해 주세요.');
    return;
  }
  sim.stopAt = null;
  sim.playing = !sim.playing;
  updateUI();
  setDirty(true);
}

export function selectItem(id) {
  if (id.startsWith('PAL-')) id = id.slice(4);
  if (!slots[id] && !sim.actors[id] && !sim.pallets[id]) return;
  setSelection(id);
  $('detail').style.display = 'block';
  updateDetail();
  setDirty(true);
}

export function updateDetail() {
  const id = selection;
  if (!id) return;
  $('detailCode').textContent = sim.actors[id] ? 'MOBILE EQUIPMENT' : sim.pallets[id] ? 'PALLET ID' : 'LOCATION';
  $('detailTitle').textContent = AINFO[id]?.name || (id === 'CHG' ? '셔틀 충전기' : id === 'LIFT' ? 'Lift' : id);
  let text = '', p;
  if (sim.actors[id]) {
    const a = sim.actors[id];
    text = a.job ? a.job.title + ' / ' + a.job.steps[a.job.index]?.title : '대기';
    p = actorWorld(a);
  } else if (sim.pallets[id]) {
    text = '현재 위치: ' + sim.pallets[id].location + ' / 외형 1100 × 1100 × 150 mm';
    p = palletPosition(id);
  } else {
    const s = slots[id];
    p = s.world;
    text = id === 'B' ? '고정 스탠드 B. SEER가 서측에서 적치하고 AMR은 남측으로 진입·후진합니다. 스탠드는 이동하지 않습니다.' :
           id === 'C' ? '고정 스탠드 C. AMR이 북측으로 진입·하차하고 HDX는 서측에서 반출합니다.' :
           id === 'A' ? '셔틀이 후면에서 채우는 1단 출고구. SEER 지게차가 동측 전면에서 반출합니다.' :
           id === 'D' ? 'HDX 지게차가 동측 전면에서 투입하는 1단 입고구. 셔틀이 후면으로 가져갑니다.' :
           id === 'CHG' ? '3단의 팔레트 보관 가능 칸입니다. 충전기 본체는 랙 전면 바깥으로 돌출합니다.' :
           id === 'LIFT' ? '리프트 일반 제원 3134 × 2200 mm 적용. 좌우 간격과 제작품 높이는 실측 미확인입니다.' :
           (s.floor + 1) + '단 보관 칸. 후면의 공용 셔틀 통로에서 진입합니다.';
    if (sim.homes.S1 === id || sim.homes.S2 === id) text += ' 현재 비작업 셔틀의 대기 칸으로 사용합니다.';
  }
  $('detailText').textContent = text;
  $('detailReadout').innerHTML = 'X(E) ' + Math.round(p[0] * 1000) + ' / Z(S) ' + Math.round(p[2] * 1000) + ' mm<br>높이 ' + Math.round(p[1] * 1000) + ' mm' + (slots[id] && id !== 'LIFT' ? '<br>재고: ' + (sim.inventory[id] || '비어 있음') + ' · ' + (sim.reservations[id] || '예약 없음') : '');
}

export function updateUILegacy() {
  if (!sim.actors.S1) return;
  const palN = Object.keys(sim.pallets).length;
  $('palCount').innerHTML = palN + '<small> 개</small>';
  $('conserve').textContent = sim.error ? '오류 · 정지' : palN + ' / ' + palN + ' 보존';
  $('playBtn').textContent = sim.playing ? 'Ⅱ 일시정지' : sim.time > 0 ? '▶ 계속 재생' : '▶ 통합 재생';
  $('timeLabel').textContent = formatTime(sim.time);
  $('liftState').textContent = 'Lift ' + Math.round(sim.liftY * 1000) + ' mm' + (sim.liftOwner ? ' · ' + sim.liftOwner + ' 예약' : ' · 대기');
  for (const [id, a] of Object.entries(sim.actors)) {
    const el = $('actor-' + id), j = a.job;
    el.classList.toggle('busy', !!j);
    el.querySelector('small').textContent = sim.error ? sim.error : j ? j.steps[j.index]?.title : '대기' + (id.startsWith('S') && id.length === 2 ? ' · ' + displaySlot(sim.homes[id]) : '');
    el.querySelector('.jobs').textContent = a.count + '건';
    el.querySelector('.progress i').style.width = j ? (j.done / j.total * 100) + '%' : '0%';
  }
  const pairs = [[sim.config.x2, 'A', 'out'], ['D', sim.config.x1, 'in'], [sim.config.x1, sim.config.x2, 'relocate']];
  for (let i = 0; i < 3; i++) {
    const [s, d, key] = pairs[i], working = Object.values(sim.actors).find(a => a.job?.key === key);
    $('rule' + i).classList.toggle('busy', !!working);
    $('count-' + key).textContent = sim.counts[key] + '회';
    $('ruleState' + i).textContent = working ? working.id + ' 실행 중' : !sim.inventory[s] ? displaySlot(s) + ' 재고 대기' : sim.inventory[d] ? displaySlot(d) + ' 비움 대기' : sim.reservations[s] || sim.reservations[d] ? '인계 구역 해제 대기' : sim.rackOwner ? '통로 · 리프트 해제 대기' : '배차 가능';
  }
  const rows = [['A', 'A · 출고'], ['B', 'B · 고정 버퍼'], ['C', 'C · 고정 버퍼'], ['D', 'D · 투입'], [sim.config.x1, 'X1 역할 · ' + displaySlot(sim.config.x1)], [sim.config.x2, 'X2 역할 · ' + displaySlot(sim.config.x2)]];
  $('inventoryRows').innerHTML = rows.map(([id, name]) => '<tr><th>' + name + '</th><td class="' + (sim.inventory[id] ? 'full' : 'wait') + '">' + (sim.inventory[id] || '—') + '</td><td>' + (sim.reservations[id] ? sim.reservations[id] + ' 예약' : '') + '</td></tr>').join('');
  $('externalCounts').textContent = 'A→B ' + sim.counts.seer + ' / B→C ' + sim.counts.amr + ' / C→D ' + sim.counts.hdx + '회';
  $('parkingInfo').textContent = '셔틀 대기 칸: 01 ' + displaySlot(sim.homes.S1) + ' / 02 ' + displaySlot(sim.homes.S2) + ' · X1/X2 지정에 따라 자동 변경';
  $('logs').innerHTML = sim.logs.slice(-9).reverse().map(l => '<div><time>' + formatTime(l.time) + '</time><span>' + l.detail + (l.palletId ? ' · ' + l.palletId : '') + '</span></div>').join('');
  document.querySelectorAll('[data-flow]').forEach(e => {
    const id = e.dataset.flow === 'X1' ? sim.config.x1 : e.dataset.flow === 'X2' ? sim.config.x2 : e.dataset.flow;
    e.classList.toggle('on', !!sim.inventory[id]);
  });
  const b = boundaryReport();
  $('boundaryBadge').className = 'statusBadge' + (b.outside.length ? ' warn' : '');
  $('boundaryBadge').textContent = b.outside.length ? '경계 이탈: ' + b.outside.join(', ') : '현재 공칭 외곽 · 9×9 경계 안';
  if (selection) updateDetail();
}

export function updateUI() {
  updateUILegacy();
  if (!sim.actors.S1) return;
  const cycleCount = sim.kpi ? sim.kpi.cycleCount : 0;
  const avgSec = cycleCount > 0 ? (sim.kpi.totalCycleTime / cycleCount) : 0;
  const avgCycleStr = avgSec > 0 ? `${avgSec.toFixed(2)} 초 (${formatTime(avgSec)})` : '0.00 초 (00:00)';
  const currentPalletCount = Object.keys(sim.pallets).length;
  if ($('kpiAvgCycle')) $('kpiAvgCycle').textContent = avgCycleStr;
  if ($('kpiCycleCount')) $('kpiCycleCount').textContent = cycleCount + ' 회';
  if ($('kpiTotalTime')) $('kpiTotalTime').textContent = formatTimeHMS(sim.time);
  if ($('kpiPalletCount')) $('kpiPalletCount').textContent = currentPalletCount + ' 개';
  const pBtn = $('playBtn');
  if (pBtn) {
    const pTxt = $('txtBtnStart') || pBtn;
    pTxt.textContent = sim.playing ? '중지' : '시작';
    pBtn.classList.toggle('btn-danger', sim.playing);
    pBtn.classList.toggle('btn-primary', !sim.playing);
  }
  const m = activityReport(), names = { loaded: '적재 이송', empty: '빈 차 복귀·정렬', handling: '포크·인계 동작', waiting: '대기' };
  const pc = id => Math.round(m[id].workingPercent);
  $('seerUtil').textContent = sim.time ? pc('SEER') + '%' : '—';
  $('hdxUtil').textContent = sim.time ? pc('HDX') + '%' : '—';
  $('throughputCount').textContent = sim.counts.hdx + ' 회';
  $('liveActors').innerHTML = Object.entries(AINFO).map(([id, inf]) => '<div class="liveitem ' + (m[id].activity === 'waiting' ? 'wait' : 'run') + '"><i></i><b>' + inf.name + '</b><span>' + names[m[id].activity] + '</span></div>').join('');
  for (const [id, a] of Object.entries(sim.actors)) {
    const el = $('actor-' + id), r = m[id];
    el.classList.toggle('busy', r.activity !== 'waiting');
    if (r.activity === 'waiting') el.querySelector('small').textContent = a.waitReason || (a.id === 'SEER' ? (!sim.config.external ? '자동 순환 OFF' : !sim.inventory.A ? 'A 팔레트 공급 대기' : sim.reservations.A ? 'A 셔틀 이탈 대기' : !continuous() && sim.inventory.B ? 'B 비움 대기' : '다음 작업 배차') : (a.id === 'HDX' ? (!sim.config.external ? '자동 순환 OFF' : !sim.inventory.C ? 'C 팔레트 공급 대기' : sim.reservations.C ? 'C AMR 이탈 대기' : !continuous() && sim.inventory.D ? 'D 비움 대기' : '다음 작업 배차') : (a.id === 'AMR' ? (!sim.config.external ? '자동 순환 OFF' : !sim.inventory.B ? 'B 팔레트 공급 대기' : sim.reservations.B ? 'B SEER 이탈 대기' : sim.inventory.C ? 'C 비움·HDX 이탈 대기' : '다음 작업 배차') : (continuous() ? (a.id === 'S1' ? 'D 재고 / A·X6 인계 가능 상태 대기' : '상층 시연 배차') : '후면 통로·리프트 배차 대기'))));
    let bar = el.querySelector('.utilbar'), txt = el.querySelector('.utiltext');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'utilbar';
      txt = document.createElement('div');
      txt.className = 'utiltext';
      el.children[1].append(bar, txt);
    }
    bar.innerHTML = ['loaded', 'handling', 'empty', 'waiting'].map(k => '<i class="' + k + '" style="width:' + (r.total ? 100 * r[k] / r.total : 0) + '%"></i>').join('');
    txt.textContent = (sim.time ? Math.round(r.workingPercent) + '%' : '—') + ' 연출 작업률 · 대기 ' + formatTime(r.waiting);
  }
  if (continuous()) {
    const rules = [['A 우선 보충 · D / X6 → A', 'out'], ['A 점유 시 D → X6', 'in'], ['S2 상층 순환 · X3 → X1 → X2 → X5', 'vertical']];
    rules.forEach(([title, key], i) => {
      const job = Object.values(sim.actors).find(a => a.job?.key === key);
      $('rule' + i).querySelector('b').textContent = title;
      $('rule' + i).classList.toggle('busy', !!job);
      $('rule' + i).querySelector('.count').textContent = sim.counts[key] + '회';
      $('ruleState' + i).textContent = job ? job.id + ' · ' + job.job.title : i === 0 ? (!sim.inventory['A'] ? 'D / X6 공급 대기' : 'A 비움·SEER 이탈 대기') : i === 1 ? 'A 반출과 D 비움 상태에 따라 실행' : '상층 별도 팔레트 P05';
    });
    $('parkingInfo').textContent = 'S1: 1단 전용 / S2: 2·3단 및 리프트. 전용층의 후면 통로에서 다음 작업을 이어갑니다.';
    const rows = [['A', '출고 A'], ['B', '버퍼 B'], ['C', '버퍼 C'], ['D', '입고 D'], ['X6', '대기 적치 X6']];
    if ($('inventoryRows')) $('inventoryRows').innerHTML = rows.map(([id, name]) => '<tr><th>' + name + '</th><td class="' + (sim.inventory[id] ? 'full' : 'wait') + '">' + (sim.inventory[id] || '—') + '</td><td>' + (sim.reservations[id] ? sim.reservations[id] + ' 예약' : '') + '</td></tr>').join('');
  } else {
    ['X2 → A', 'D → X1', 'X1 → X2'].forEach((t, i) => $('rule' + i).querySelector('b').textContent = t);
  }
}

export function syncModeUI() {
  const fast = continuous();
  $('legacyControls').style.display = fast ? 'none' : '';
  $('fastControls').style.display = fast ? '' : 'none';
  const activeBtns = Array.from(document.querySelectorAll('#nodeButtonGrid .btn-node.active')).map(b => b.dataset.node);
  const palCount = Object.keys(sim.pallets).length;
  $('initialNote').innerHTML = fast ? '선택된 초기 팔레트 <b>' + palCount + '개</b>: ' + activeBtns.join(' · ') : '기존 조건 그대로: X2 · D 각 1개' + (sim.config.third ? ' + B 1개' : '') + '. 보관·이적을 모든 팔레트가 경유합니다.';
  $('modeNote').textContent = fast ? '추가 설비 없이 X6를 대기 적치 칸으로 사용합니다. 1단 운행과 상층 승강이 서로 기다리지 않습니다.' : '기존 방식: X2→A / D→X1 / X1→X2. 두 셔틀이 모든 층의 후면 통로·리프트를 교대로 점유합니다.';
  document.querySelector('.flow').innerHTML = fast ? '<span class="node" data-flow="A">A</span><span>→ SEER →</span><span class="node" data-flow="B">B</span><span>→ AMR →</span><span class="node" data-flow="C">C</span><span>→ HDX →</span><span class="node" data-flow="D">D</span><span>→ S1 → A</span><span class="caption">A 점유 시 X6 대기 적치</span>' : '<span class="node">A</span><span>→ SEER → B → AMR → C → HDX → D → X1 → X2 → A</span><span class="caption">기존 전체 보관 경유</span>';
}

export function syncLayoutUI() {
  document.querySelectorAll('[data-config]').forEach(e => e.value = Math.round(cfg[e.dataset.config] * 1000));
  const width = (3 * cfg.bayWidth + cfg.leftGap + cfg.rightGap + cfg.liftWidth) * 1000;
  $('layoutReadout').innerHTML = '랙 길이 <b>' + Math.round(width) + ' mm †</b><br>일반 랙 깊이 <b>' + Math.round((cfg.frontDepth + cfg.rearDepth) * 1000) + ' mm</b><br>리프트 포함 최대 깊이 <b>' + Math.round((cfg.rearDepth + cfg.frontDepth + cfg.liftProtrusion) * 1000) + ' mm</b><br>B/C 중심 간격 <b>' + Math.round((cfg.cZ - cfg.bZ) * 1000) + ' mm †</b>';
  const rows = [
    ['부스', '9000 × 9000', '입력 자료', '사용자 지정 경계. 설비 배치만 모델링.'],
    ['팔레트', '1100 × 1100 × 150', '입력 자료', '사용자 지정. 하면 블록·포크 개구는 원본 HTML의 설명용 형상.'],
    ['PTR-H-C89 × 2', '1135 × 870 × 126<br>리프팅 스트로크 40', '입력 자료', '사용자 제공 셔틀 제원 이미지. 동일 크기 2대.'],
    ['SEER 지게차', '2767 × 1180 × 2235<br>포크 1070 × 122 × 40', '원본 뷰어', '총 길이 = 원본 코드의 포크 앞면 전 차체 1697 + 포크 1070. 모델명과 전시 실물 옵션 미확인. 포크 외폭 570은 원본 가정.'],
    ['HDX 지게차', '1740 × 985 × 1990<br>포크 1150 × 180 × 60', '원본 뷰어', '총 길이 = 원본 차체 590 + 포크 1150. 하부 지지다리 세부 외곽은 설명용.'],
    ['SEER AMR', '950 × 650 × 250<br>플랫폼 850 × 600 / 스트로크 60', '원본 뷰어', '첨부 HTML에 기록된 제원. 실제 정확한 모델명은 자료에 없음.'],
    ['고정 버퍼 B / C', '레일 내폭 800 / 길이 1200<br>안착면 EL.280 / 개방단 탭 EL.290', '원본 뷰어', 'Rev.G1 B안 메시를 재사용. 4040 다리 6개, 북/남 폐쇄 방향 유지. 제작·고정 승인 아님.'],
    ['랙', '3단 / 후면 전체 통로<br>깊이 1280 + 1280 = 2560<br>단간 피치 ' + Math.round(cfg.levelPitch * 1000), '도면 + †', '평면·정면 이미지의 읽을 수 있는 치수 적용. 1단 주행면의 정확한 치수 기준점은 별도 확인.'],
    ['랙 길이 / 기둥 높이', Math.round(width) + ' / ' + Math.round(cfg.rackHeight * 1000), '† 미확정', '칸 피치·리프트 간격에 따른 계산 길이. 기둥 높이도 원본 임시 모델값.'],
    ['리프트', Math.round(cfg.liftWidth * 1000) + ' × ' + Math.round((cfg.frontDepth + cfg.liftProtrusion) * 1000) + '<br>높이 ' + Math.round(cfg.liftHeight * 1000) + ' †', '일반 제원 + †', '기본값 3134 × 2200은 처음 제공된 일반 제원. 제작품 외곽 일치 여부 미확인. 높이는 도면 이미지 판독에 따른 근사값.'],
    ['좌우 여유 / 전면 돌출', Math.round(cfg.leftGap * 1000) + ' / ' + Math.round(cfg.rightGap * 1000) + ' / ' + Math.round(cfg.liftProtrusion * 1000), '† 미확정', '좌우 여유는 원본 Rev.03 배치값. 돌출은 리프트 깊이 2200 - 랙 전면 깊이 1280.'],
    ['셔틀 충전기', '1004 × 358.5<br>케이스 두께 140 † / 돌출 380 †', '입력 자료 + †', '2방향 치수는 제공 제원. 두께와 브래킷·돌출량은 미확정. 셀의 팔레트 보관 가능.'],
    ['장비 좌표·경로', '9 × 9 m 안의 배치안', '† 연출', 'B/C 원본 예시 간격 3800을 그대로 강제하지 않음. 실제 조향·회전반경·허용 속도 검증 미포함.']
  ];
  $('sourceRows').innerHTML = rows.map(([a, b, c, d]) => '<tr><th>' + a + '</th><td><b>' + b + '</b></td><td><span class="pill ' + (c.startsWith('†') ? 'assumed' : c === '입력 자료' ? 'doc' : 'ref') + '">' + c + '</span><br>' + d + '</td></tr>').join('');
}

export function applyLayout() {
  const next = { ...cfg };
  for (const e of document.querySelectorAll('[data-config]')) {
    const v = Number(e.value);
    if (!Number.isFinite(v) || v < Number(e.min) || v > Number(e.max)) {
      $('layoutError').textContent = '입력 범위를 확인해 주세요.';
      return;
    }
    next[e.dataset.config] = v / 1000;
  }
  if (3 * next.bayWidth + next.liftWidth + next.leftGap + next.rightGap > 8.65) {
    $('layoutError').textContent = '이 구성은 랙 발판을 포함하면 9m 경계 여유가 부족합니다. 치수를 축소해 맞추기 전에 원본 도면을 확인하세요.';
    return;
  }
  if (next.cZ - next.bZ < 3.7) {
    $('layoutError').textContent = 'AMR이 두 버퍼 밖에서 회전할 수 있도록 B/C 간격을 다시 확인하세요.';
    return;
  }
  if (next.rackHeight < next.baseHeight + 2 * next.levelPitch + .45 || next.liftHeight < next.baseHeight + 2 * next.levelPitch + .8) {
    $('layoutError').textContent = '3단 주행면에 비해 랙 또는 리프트 높이가 낮습니다.';
    return;
  }
  setCfg(next);
  $('layoutError').textContent = '';
  buildAll();
  setCamera('iso');
  toast('배치안을 적용했습니다. 원본 제원과 제작품 실측을 별도로 확인하세요.');
}

export function initUI() {
  const opts = [['X1', '3단 X1'], ['X2', '3단 X2'], ['CHG', '3단 셔틀 충전기'], ['X3', '2단 X3'], ['X4', '2단 X4'], ['X5', '2단 X5'], ['X6', '1단 X6']];
  for (const [id, val] of [['storageOne', 'X1'], ['storageTwo', 'X2']]) {
    $(id).innerHTML = opts.map(([v, t]) => '<option value="' + v + '">' + t + '</option>').join('');
    $(id).value = val;
  }
  $('actorRows').innerHTML = Object.entries(AINFO).map(([id, i]) => '<div class="actor" id="actor-' + id + '"><span class="aicon">' + i.short + '</span><div><b>' + i.name + '</b><small>대기</small><div class="progress"><i></i></div></div><span class="jobs">0건</span></div>').join('');
  const dimsInputs = [
    ['bayWidth', '랙 1칸 피치 †', 1200, 1600],
    ['liftWidth', '리프트 폭 · 일반 제원', 2200, 3600],
    ['leftGap', '리프트 좌 여유 †', 80, 1200],
    ['rightGap', '리프트 우 여유 †', 80, 1200],
    ['rackHeight', '랙 기둥 높이 †', 5000, 6800],
    ['liftHeight', '리프트 높이 †', 5400, 8000],
    ['baseHeight', '1단 주행면 적용값 †', 300, 700],
    ['levelPitch', '단간 피치 · 도면 판독', 1500, 2600]
  ];
  $('dimensionInputs').innerHTML = dimsInputs.map(([key, name, min, max]) => '<label class="field"><span>' + name + '</span><input data-config="' + key + '" type="number" min="' + min + '" max="' + max + '" step="1"></label>').join('');
  $('layoutInputs').innerHTML = [['bufferX', 'B/C 동측 좌표 †', 7700, 8300], ['bZ', 'B 남북 좌표 †', 1700, 2500], ['cZ', 'C 남북 좌표 †', 6400, 7600]].map(([key, name, min, max]) => '<label class="field"><span>' + name + '</span><input data-config="' + key + '" type="number" min="' + min + '" max="' + max + '" step="10"></label>').join('');
}

export function downloadBlob(blob, name) {
  const a = document.createElement('a'), u = URL.createObjectURL(blob);
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}

export function scenarioSnapshot() {
  return {
    time: sim.time, playing: sim.playing, error: sim.error, activity: activityReport(), config: copy(sim.config),
    counts: copy(sim.counts), homes: copy(sim.homes), inventory: copy(sim.inventory), reservations: copy(sim.reservations),
    rackOwner: sim.rackOwner, liftOwner: sim.liftOwner, liftY: sim.liftY,
    pallets: Object.fromEntries(Object.entries(sim.pallets).map(([id, p]) => [id, { ...p, world: palletPosition(id), yaw: palletYaw(id) }])),
    actors: Object.fromEntries(Object.entries(sim.actors).map(([id, a]) => [id, {
      pos: actorWorld(a), rackLocal: (id === 'S1' || id === 'S2') ? a.pos : null, yaw: a.yaw,
      payload: a.payload, deck: a.deck, forkTop: a.forkTop, count: a.count,
      job: a.job ? { title: a.job.title, key: a.job.key, step: a.job.index, stepTitle: a.job.steps[a.job.index]?.title, done: a.job.done, total: a.job.total, blocked: !!a.job.blocked, waited: a.job.waited || 0 } : null
    }]))
  };
}

export function configExport() {
  return {
    revision: '06', units: 'metres', booth: [9, 9], axes: 'X east, Y up, Z south. Model unit = 1 metre.',
    source_files: ['Industrial_AI_EXPO_Integrated_3D_Viewer_Rev05.html', 'Pallet_Buffer_RevG1_Scenario_3D_Viewer.html', '4Way_Shuttle_Demo_3D_Viewer_Rev04.html', 'User supplied rack plan/elevation and equipment specification images'],
    equipment_counts: { shuttle: 2, seer_forklift: 1, hdx_forklift: 1, seer_low_floor_amr: 1, lift: 1, fixed_buffer: 2 },
    nominal_envelopes_mm: { pallet: [1100, 1100, 150], shuttle: [1135, 870, 126], seer_forklift: [2767, 1180, 2235], hdx_ES15_A: [1740, 985, 1990], seer_amr: [950, 650, 250], amr_platform: [850, 600], amr_stroke: 60, shuttle_stroke: 40, lift_generic_reference: [3134, 2200], buffer_inner: 800, buffer_rail_length: 1200, buffer_support_EL: 280 },
    dimensions: copy(cfg), scenario: copy(sim.config), external_sequence: 'A -> SEER -> B -> SEER lifting AMR -> C -> HDX -> D',
    internal_priority: continuous() ? ['X6 -> A if available, otherwise D -> A', 'D -> X6 if A unavailable', 'Parallel S2 upper demo: X3 -> X1 -> X2 -> X5 -> X3'] : ['X2 -> A if A empty', 'D -> X1 if X1 empty', 'X1 -> X2 if X2 empty'],
    shuttle_policy: continuous() ? 'S1 dedicated floor 1: D -> A, X6 overflow; S2 dedicated floors 2/3: X3 -> X1 -> X2 -> X5 -> X3 with a separate pallet. Only S2 uses the lift. Not an optimized concurrent multi-shuttle controller.' : 'Original: serial shared rear lanes/lift, alternating shuttles',
    internal_policy_active: continuous() ? ['X6 -> A or D -> A when A available', 'D -> X6 if A unavailable', 'S2 upper separate loop X3 -> X1 -> X2 -> X5 -> X3'] : ['X2 -> A', 'D -> X1', 'X1 -> X2'],
    initial_pallets: continuous() ? [{ id: 'P01', location: 'A' }, { id: 'P02', location: 'C' }, { id: 'P03', location: 'D' }, ...(sim.config.circulating === 4 ? [{ id: 'P04', location: 'B' }] : []), { id: 'P05', location: 'X3', pool: 'upper-demo' }] : [{ id: 'P01', location: sim.config.x2 }, { id: 'P02', location: 'D' }, ...(sim.config.third ? [{ id: 'P03', location: 'B' }] : [])],
    source_constraints: ['B and C fixed; only the pallet is transferred', 'B AMR enters south, exits south reversing', 'C AMR enters north, exits north reversing', 'Both forklifts approach B/C from west', 'AMR 180-degree turn only after pallet fully clears buffer', 'No pallet teleportation at loop boundaries'],
    not_verified: ['Rack bay pitch / left-right gaps / rack post height / datum of first running surface', 'Exhibition-built lift dimensions versus generic datasheet', 'Charger case thickness and bracket projection', 'Actual forklift steering and turning radius, speed and safe swept paths', 'Exact SEER models, fork spread and HDX lower-leg envelope', 'Actual pallet fork openings and AMR contact surface', 'Structural fixing, floor load, safe public access and exhibition-approved height'],
    notes: 'All source-equipment geometry uses a common metric scale. Concept model, not fabrication approval CAD or real safety/clearance/throughput validation.'
  };
}

export function savePNG() {
  render();
  const c = document.createElement('canvas'), dpr = window.devicePixelRatio || 1;
  c.width = $('view').width;
  c.height = $('view').height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#eef3f5';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage($('view'), 0, 0);
  ctx.scale(dpr, dpr);
  ctx.font = '10px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const l of labels) {
    if (l.e.style.display === 'none' || !l.screen) continue;
    const [x, y] = l.screen, txt = l.e.textContent, w = ctx.measureText(txt).width + 12;
    ctx.fillStyle = l.kind === 'robot' || l.kind === 'palletid' ? '#234b59' : '#ffffff';
    ctx.fillRect(x - w / 2, y - 10, w, 20);
    ctx.fillStyle = l.kind === 'robot' || l.kind === 'palletid' ? '#ffffff' : '#325565';
    ctx.fillText(txt, x, y);
  }
  ctx.font = 'bold 15px -apple-system,sans-serif';
  ctx.fillStyle = '#294b58';
  ctx.textAlign = 'left';
  ctx.fillText('NOVATEK · INTEGRATED DEMO Rev.06 · 9000 × 9000 mm', 20, 24);
  ctx.font = '10px -apple-system,sans-serif';
  ctx.fillText('Source-based concept geometry / provisional layout / not a safety or fabrication approval model', 20, $('main').clientHeight - 18);
  c.toBlob(b => downloadBlob(b, 'Industrial_AI_EXPO_Rev06_View.png'), 'image/png');
}

export function updateRobotSpeeds() {
  const getVal = (id, defaultVal) => {
    const el = document.getElementById(id);
    if (!el) return defaultVal;
    let val = parseFloat(el.value);
    if (isNaN(val) || val <= 0) val = defaultVal;
    return parseFloat(val.toFixed(1));
  };
  sim.robotSpeeds = {
    Shuttle: getVal('speedShuttle', 1.5),
    SEER: getVal('speedSeer', 1.0),
    AMR: getVal('speedAmr', 1.2),
    HDX: getVal('speedHdx', 1.0)
  };
}

export function updateCustomRouteUI() {
  const scenarioSelect = $('scenarioMode');
  const customSection = $('customXNodeSection');
  if (!scenarioSelect || !customSection) return;

  const isCustom = scenarioSelect.value === 'custom';
  customSection.style.display = isCustom ? 'block' : 'none';

  if (!sim.config.customRoute) {
    sim.config.customRoute = ['X1'];
  }

  document.querySelectorAll('#customXNodeGrid .btn-custom-node').forEach(b => {
    const node = b.dataset.xnode;
    const idx = sim.config.customRoute.indexOf(node);
    if (idx >= 0) {
      b.classList.add('active');
      b.textContent = `${node} (${idx + 1})`;
    } else {
      b.classList.remove('active');
      b.textContent = node;
    }
  });

  const preview = $('customRoutePreview');
  if (preview) {
    const sequenceStr = sim.config.customRoute.length ? sim.config.customRoute.join(' → ') + ' → ' : '';
    preview.textContent = `경로: D → ${sequenceStr}A`;
  }
}

export function setSpeed(val) {
  const speed = Math.max(1, Math.min(100, Number(val) || 1));
  sim.speed = speed;
  const slider = $('speedSlider');
  if (slider) slider.value = speed;
  const valText = $('speedValText');
  if (valText) valText.textContent = speed + 'x';
  const sel = $('speed');
  if (sel) sel.value = String(speed);
  document.querySelectorAll('.speed-presets .btn-chip').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.speed) === speed);
  });
}

export function bindUI() {
  document.querySelectorAll('.robot-speed-input').forEach(input => {
    input.addEventListener('input', () => {
      updateRobotSpeeds();
    });
    input.addEventListener('blur', () => {
      let val = parseFloat(input.value);
      if (isNaN(val) || val < 0.1) val = 0.1;
      input.value = val.toFixed(1);
      updateRobotSpeeds();
    });
  });
  updateRobotSpeeds();
  updateCustomRouteUI();
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b));
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + b.dataset.tab));
  });
  document.querySelectorAll('[data-camera]').forEach(b => b.onclick = () => setCamera(b.dataset.camera));
  for (const id of ['showPallets', 'showCargo', 'showLabels', 'showPaths', 'showLane', 'ghostFrame', 'showVolumes', 'showDimensions', 'showEnvelopes', 'showGrid', 'floorFilter'])
    $(id).onchange = () => { setDirty(true); };
  for (const id of ['storageOne', 'storageTwo', 'thirdPallet', 'circulatingCount'])
    $(id).onchange = () => resetSimulation(syncModeUI, updateUI);

  $('scenarioMode').onchange = () => {
    updateCustomRouteUI();
    resetSimulation(syncModeUI, updateUI);
  };

  document.querySelectorAll('#customXNodeGrid .btn-custom-node').forEach(b => {
    b.onclick = () => {
      const node = b.dataset.xnode;
      if (!sim.config.customRoute) sim.config.customRoute = [];
      const idx = sim.config.customRoute.indexOf(node);
      if (idx >= 0) {
        sim.config.customRoute.splice(idx, 1);
      } else {
        sim.config.customRoute.push(node);
      }
      updateCustomRouteUI();
      resetSimulation(syncModeUI, updateUI);
    };
  });

  document.querySelectorAll('#nodeButtonGrid .btn-node').forEach(b => {
    b.onclick = () => {
      b.classList.toggle('active');
      if (!document.querySelectorAll('#nodeButtonGrid .btn-node.active').length) {
        b.classList.add('active');
      }
      resetSimulation(syncModeUI, updateUI);
    };
  });

  $('autoExternal').onchange = e => {
    sim.config.external = e.target.checked;
    log('SETTING', '외부 자동 순환 ' + (e.target.checked ? 'ON' : 'OFF') + ' · 진행 중 작업은 완료');
  };
  $('skip90').onclick = () => {
    sim.playing = false;
    sim.stopAt = null;
    advanceSimulation(90, true, schedule, tickActor);
    updateUI();
    render();
  };
  const speedSlider = $('speedSlider');
  if (speedSlider) {
    speedSlider.oninput = e => setSpeed(e.target.value);
    speedSlider.onchange = e => setSpeed(e.target.value);
  }
  document.querySelectorAll('.speed-presets .btn-chip').forEach(btn => {
    btn.onclick = () => setSpeed(btn.dataset.speed);
  });
  if ($('speed')) {
    $('speed').onchange = e => setSpeed(e.target.value);
  }
  setSpeed(sim.speed || 5);
  const toggleBtn = $('toggleDisplayPaneBtn');
  const pane = $('floatingDisplayPane');
  if (pane) {
    const header = pane.querySelector('.panel-header');
    const toggleFunc = (e) => {
      if (e) e.stopPropagation();
      const isCollapsed = pane.classList.toggle('collapsed');
      if (toggleBtn) toggleBtn.textContent = isCollapsed ? '펼치기' : '접기';
    };
    if (toggleBtn) toggleBtn.onclick = toggleFunc;
    if (header) header.onclick = (e) => {
      if (e.target !== toggleBtn) toggleFunc(e);
    };
  }
  $('playBtn').onclick = playPause;
  $('resetBtn').onclick = () => resetSimulation(syncModeUI, updateUI);
  $('nextJobBtn').onclick = () => {
    if (sim.error) return;
    sim.stopAt = internalCount() + 1;
    sim.playing = true;
    updateUI();
  };
  $('resetViewBtn').onclick = () => setCamera('iso');
  $('rotateBtn').onclick = () => {
    setAutoRotate(!autoRotate);
    $('rotateBtn').classList.toggle('active', autoRotate);
  };
  $('zoomIn').onclick = () => { cam.span *= .82; setDirty(true); };
  $('zoomOut').onclick = () => { cam.span *= 1.22; setDirty(true); };
  $('fullBtn').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else $('main').requestFullscreen?.();
  };
  $('sourceBtn').onclick = $('sourceBtn2').onclick = () => $('sourceModal').classList.add('open');
  $('helpBtn').onclick = () => $('helpModal').classList.add('open');
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => $(b.dataset.close).classList.remove('open'));
  document.querySelectorAll('.modal').forEach(m => m.onclick = e => { if (e.target === m) m.classList.remove('open'); });
  $('closeDetail').onclick = () => { setSelection(null); $('detail').style.display = 'none'; };
  $('focusSelected').onclick = () => {
    if (!selection) return;
    let p = sim.actors[selection] ? actorWorld(sim.actors[selection]) : sim.pallets[selection] ? palletPosition(selection) : slots[selection].world;
    cam.target = [p[0], p[1] + .35, p[2]];
    cam.span = selection === 'LIFT' ? 8 : 3.8;
    cam.yaw = .9;
    cam.pitch = .47;
    setDirty(true);
  };
  $('menuBtn').onclick = () => $('sidebar').classList.toggle('open');
  $('applyLayout').onclick = applyLayout;
  $('saveSettings').onclick = () => downloadBlob(new Blob([JSON.stringify(configExport(), null, 2)], { type: 'application/json' }), 'Industrial_AI_EXPO_Rev06_Config.json');
  $('savePng').onclick = savePNG;
  $('exportGLB').onclick = () => {
    try {
      downloadBlob(new Blob([generateGLB()], { type: 'model/gltf-binary' }), 'Industrial_AI_EXPO_Integrated_Rev06.glb');
    } catch (e) {
      toast(e.message);
    }
  };
  $('saveLog').onclick = () => {
    const q = x => '"' + String(x ?? '').replaceAll('"', '""') + '"',
          rows = [['연출 시간(s)', '이벤트', '내용', '팔레트 ID'], ...sim.logs.map(l => [l.time, l.event, l.detail, l.palletId])];
    downloadBlob(new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'Industrial_AI_EXPO_Rev06_Events.csv');
  };

  let pointer = null, pinch = null;
  const pointers = new Map();
  const canvasEl = $('view');
  canvasEl.addEventListener('contextmenu', e => e.preventDefault());
  canvasEl.addEventListener('pointerdown', e => {
    canvasEl.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    pointer = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey };
    setAutoRotate(false);
    canvasEl.classList.add('drag');
  });
  canvasEl.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch) cam.span = Math.max(.6, Math.min(40, cam.span * pinch / d));
      pinch = d;
      setDirty(true);
      return;
    }
    if (!pointer) return;
    const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
    if (pointer.pan) {
      const dir = V.norm(V.sub($('eye') || [0, 0, 0], cam.target)),
            right = V.norm(V.cross([0, 1, 0], dir)),
            up = V.cross(dir, right),
            scale = cam.span / $('main').clientHeight;
      cam.target = V.add(cam.target, V.add(V.mul(right, -dx * scale), V.mul(up, dy * scale)));
    } else {
      cam.yaw -= dx * .007;
      cam.pitch = Math.max(.008, Math.min(Math.PI / 2 - .001, cam.pitch + dy * .006));
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    setDirty(true);
  });
  const release = e => {
    pointers.delete(e.pointerId);
    pointer = null;
    pinch = null;
    canvasEl.classList.remove('drag');
  };
  canvasEl.addEventListener('pointerup', release);
  canvasEl.addEventListener('pointercancel', release);
  canvasEl.addEventListener('wheel', e => {
    e.preventDefault();
    cam.span = Math.max(.6, Math.min(40, cam.span * Math.exp(e.deltaY * .001)));
    setDirty(true);
  }, { passive: false });

  window.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      playPause();
    }
    if (e.key.toLowerCase() === 'r') setCamera('iso');
    if (e.key === '1') setCamera('iso');
    if (e.key === '2') setCamera('top');
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
      $('detail').style.display = 'none';
      setSelection(null);
    }
  });
}
