import { copy } from './utils/math.js';
import { $ } from './utils/helpers.js';
import {
  sim, cfg, slots, dims, geos, autoRotate, cameraMode, dirty, setDirty
} from './simulation/state.js';
import {
  advanceSimulation, resetSimulation, assertScenario, boundaryReport,
  palletPosition, palletYaw, actorWorld, actorYaw
} from './simulation/engine.js';
import { schedule, tickActor } from './simulation/actors.js';
import {
  render, setCamera, fitScene, makeGLB, main, canvas, webglActive
} from './render/webglRenderer.js';
import { buildAll } from './models/sceneModels.js';
import {
  initUI, bindUI, updateUI, syncModeUI, selectItem, playPause,
  configExport, scenarioSnapshot, savePNG
} from './ui/domEvents.js';

let lastFrame = performance.now(), uiTime = 0;

function loop(now) {
  const dt = Math.min(.12, (now - lastFrame) / 1000);
  lastFrame = now;
  if (sim.playing) advanceSimulation(dt * sim.speed, false, schedule, tickActor);
  if (autoRotate) {
    import('./simulation/state.js').then(s => {
      s.cam.yaw += dt * .14;
      setDirty(true);
    });
  }
  uiTime += dt;
  if (uiTime > .18) {
    updateUI();
    uiTime = 0;
  }
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const targetW = Math.round((main.clientWidth || 800) * dpr);
  const targetH = Math.round((main.clientHeight || 600) * dpr);
  if (dirty || canvas.width !== targetW || canvas.height !== targetH) {
    render();
  }
  requestAnimationFrame(loop);
}

// 마운트 글로벌 전역 API
window.viewer = {
  getConfig: configExport,
  getScenario: scenarioSnapshot,
  getActivity: () => import('./simulation/state.js').then(s => s.activityReport()),
  getLog: () => copy(sim.logs),
  getCamera: () => import('./simulation/state.js').then(s => copy(s.cam)),
  setCamera,
  render,
  makeGLB,
  resetSimulation: () => resetSimulation(syncModeUI, updateUI),
  playPause,
  assertScenario,
  boundaryReport,
  selectItem,
  advance: sec => {
    sim.stopAt = null;
    advanceSimulation(sec, true, schedule, tickActor);
    updateUI();
    render();
    return scenarioSnapshot();
  },
  setScenario: conf => {
    const s = { ...sim.config, ...conf };
    if (!slots[s.x1] || !slots[s.x2] || slots[s.x1].kind !== 'storage' || slots[s.x2].kind !== 'storage' || s.x1 === s.x2)
      throw Error('Two different storage locations required');
    $('storageOne').value = s.x1;
    $('storageTwo').value = s.x2;
    $('thirdPallet').checked = s.third;
    $('autoExternal').checked = s.external;
    if (s.mode) $('scenarioMode').value = s.mode;
    if (s.circulating) $('circulatingCount').value = s.circulating;
    resetSimulation(syncModeUI, updateUI);
    return scenarioSnapshot();
  },
  testRun: sec => {
    let outCount = 0, firstOutside = null;
    for (let i = 0; i < Math.ceil(sec / .2); i++) {
      advanceSimulation(Math.min(.2, sec - i * .2), true, schedule, tickActor);
      const b = boundaryReport();
      if (b.outside.length) {
        outCount++;
        if (!firstOutside) firstOutside = { time: sim.time, report: b };
      }
      if (sim.error) break;
    }
    updateUI();
    render();
    return { state: scenarioSnapshot(), boundarySamplesOutside: outCount, firstOutside, invariants: assertScenario() };
  },
  getGeometryStats: () => ({
    groups: geos.length,
    triangles: geos.reduce((n, g) => n + (g.data ? g.data.length / 27 : 0), 0),
    renderer: webglActive ? 'WebGL' : 'Canvas fallback'
  }),
  getLayout: () => ({ cfg: copy(cfg), slots: copy(slots), dims: copy(dims) })
};

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleDisplayPaneBtn');
  const pane = document.getElementById('floatingDisplayPane');
  if (toggleBtn && pane) {
    toggleBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isCollapsed = pane.classList.toggle('collapsed');
      toggleBtn.textContent = isCollapsed ? '펼치기' : '접기';
    });
  }

  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (window.viewer && window.viewer.playPause) window.viewer.playPause();
    });
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (window.viewer && window.viewer.resetSimulation) window.viewer.resetSimulation();
    });
  }
});

window.addEventListener('resize', () => { setDirty(true); });
window.addEventListener('load', () => { setDirty(true); });

initUI();
bindUI();
buildAll();
setCamera('iso');
updateUI();
requestAnimationFrame(loop);
