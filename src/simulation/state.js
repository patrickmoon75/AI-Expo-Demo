import { color, C, M } from '../utils/math.js';

export let geos = [];
export function setGeos(val) { geos = val; }

export let labels = [];
export function setLabels(val) { labels = val; }

export let slots = {};
export function setSlots(val) { slots = val; }

export let dims = {};
export function setDims(val) { dims = val; }

export let trackY = [];
export function setTrackY(val) { trackY = val; }

export let liftCar = null;
export function setLiftCar(val) { liftCar = val; }

export let selection = null;
export function setSelection(val) { selection = val; }

export let manualLift = 0;
export function setManualLift(val) { manualLift = val; }

export let selectedFloor = 0;
export function setSelectedFloor(val) { selectedFloor = val; }

export let explode = 0;
export function setExplode(val) { explode = val; }

export let autoRotate = false;
export function setAutoRotate(val) { autoRotate = val; }

export let cameraMode = 'iso';
export function setCameraMode(val) { cameraMode = val; }

export let dirty = true;
export function setDirty(val) { dirty = val; }

export let cfg = {
  bayWidth: 1.4,
  liftWidth: 3.134,
  leftGap: .7,
  rightGap: .3,
  frontDepth: 1.28,
  rearDepth: 1.28,
  liftProtrusion: .92,
  chargerProtrusion: .38,
  baseHeight: .45,
  levelPitch: 2.176,
  rackHeight: 5.8,
  liftHeight: 6.92549,
  bufferX: 8,
  bZ: 2,
  cZ: 7,
  rackBack: .18,
  rackCenter: 4.5,
  pallet: [1.1, 1.1, .15],
  shuttle: [1.135, .87, .126]
};
export function setCfg(val) { cfg = val; }

export const initialCfg = JSON.parse(JSON.stringify(cfg));

export let cam = { yaw: .9, pitch: .54, span: 13.7, target: [4.5, 1.8, 4.5] };
export let eye = [0, 0, 0];
export function setEye(val) { eye = val; }

export let vp = M.id();
export function setVp(val) { vp = val; }

export let viewWidth = 1;
export let viewHeight = 1;
export function setViewWidth(val) { viewWidth = val; }
export function setViewHeight(val) { viewHeight = val; }

export const AINFO = {
  S1: { name: '셔틀 01', short: 'S1', tint: '#2671ae' },
  S2: { name: '셔틀 02', short: 'S2', tint: '#369889' },
  SEER: { name: 'SEER 지게차', short: 'SF', tint: '#c89839' },
  AMR: { name: 'SEER 저상형 AMR', short: 'AM', tint: '#4b9490' },
  HDX: { name: 'HDX ES15-A', short: 'HD', tint: '#738a9a' }
};

export const halfBody = { SEER: .8485, HDX: .295 };
export const palletReach = { SEER: 1.3985, HDX: .845 };

export let assets = { robots: {}, pallets: {}, cargo: {}, envelopes: {} };
export function setAssets(val) { assets = val; }

export let sim = {
  time: 0,
  playing: false,
  speed: 4,
  error: null,
  actors: {},
  inventory: {},
  reservations: {},
  pallets: {},
  counts: { out: 0, in: 0, relocate: 0, seer: 0, amr: 0, hdx: 0 },
  logs: [],
  liftY: .45,
  liftOwner: null,
  rackOwner: null,
  lastShuttle: 'S1',
  homes: {},
  config: { x1: 'X1', x2: 'X2', third: false, external: true },
  robotSpeeds: {
    Shuttle: 1.0,
    SEER: 0.5,
    AMR: 0.5,
    HDX: 0.5
  },
  stopAt: null
};

// Buffer JSON Data 가져오기
const bufferDataEl = typeof document !== 'undefined' ? document.getElementById('buffer-data') : null;
export const bufferData = JSON.parse(bufferDataEl ? bufferDataEl.textContent : '{}');
export const bufferColors = Object.fromEntries((bufferData.categories || []).map(x => [x.id, x.color]));

export const continuous = () => sim.config.mode === 'continuous';

export function metricsBlank() {
  return { loaded: 0, empty: 0, handling: 0, waiting: 0 };
}

export function account(a, kind, seconds) {
  if (!a.metrics) a.metrics = metricsBlank();
  a.metrics[kind] += seconds;
  a.activity = kind;
}

export function activityReport() {
  const result = {};
  for (const [id, a] of Object.entries(sim.actors)) {
    const m = a.metrics || metricsBlank(),
          total = Object.values(m).reduce((s, n) => s + n, 0),
          work = m.loaded + m.empty + m.handling;
    result[id] = {
      ...m,
      total,
      working: work,
      workingPercent: total ? 100 * work / total : 0,
      activity: a.activity || 'waiting',
      waitReason: a.waitReason || '',
      count: a.count
    };
  }
  return result;
}
