import { getText } from '../utils/i18n.js';
import { $ } from '../utils/helpers.js';
import {
  labels, sim, assets, slots, cam, viewWidth, viewHeight, continuous
} from '../simulation/state.js';
import { actorWorld, palletPosition } from '../simulation/engine.js';
import { screenPoint } from '../render/webglRenderer.js';
import { selectItem } from './domEvents.js';

export function addLabel(id, text, p, kind = '', floor = -1, opt = {}) {
  let e = document.createElement('div');
  e.className = 'label ' + kind;
  e.textContent = text;
  e.onclick = ev => {
    ev.stopPropagation();
    selectItem(id);
  };
  $('overlay').appendChild(e);
  const l = { id, text, p, kind, floor, e, ...opt };
  labels.push(l);
  return l;
}

export function labelWorld(l) {
  if (l.actor) {
    const a = sim.actors[l.actor];
    if (!a) return [0, 0, 0];
    const p = actorWorld(a);
    p[1] += a.id === 'AMR' ? .5 : a.id === 'S1' || a.id === 'S2' ? .38 : a.id === 'SEER' ? 2.46 : 2.22;
    return p;
  }
  if (l.palletId) {
    const p = palletPosition(l.palletId);
    p[1] += $('showCargo').checked ? .80 : .22;
    return p;
  }
  return l.p.slice();
}

export function displaySlot(s) {
  return s === 'CHG' ? getText('nameCharger') : s;
}

export function positionLabels() {
  const plan = cam.pitch > 1.4, level = Number($('floorFilter').value);
  for (const l of labels) {
    let show = true, p = labelWorld(l), text = l.text;
    if (!$('showLabels').checked && !['dimension', 'gap'].includes(l.kind)) show = false;
    if ((l.kind === 'dimension' || l.kind === 'gap') && !$('showDimensions').checked) show = false;
    if (l.kind === 'rear' && !$('showLane').checked && l.id !== 'TURN') show = false;
    if (l.id === 'TURN' && !$('showPaths').checked) show = false;
    if (l.rack && l.floor >= 0 && level && l.floor !== level-1) show = false;
    if (l.actor && assets.robots[l.actor] && assets.robots[l.actor][0] && !assets.robots[l.actor][0].visible) show = false;
    if (l.palletId && (!sim.pallets[l.palletId] || !assets.pallets[l.palletId].visible)) show = false;
    if (plan && !level && l.rack) {
      if (['X3', 'X4', 'X5', 'X6', 'A', 'D', 'REAR0', 'REAR1', 'CHARGER'].includes(l.id)) show = false;
      if (l.id === 'X1') text = 'D / X3 / X1';
      if (l.id === 'X2') text = 'A / X5 / X2';
      if (l.id === 'CHG') text = 'X6 / X4 / 셔틀 충전기';
      if (l.id === 'REAR2') text = '각 단의 공통 후면 통로';
    }
    l.e.classList.toggle('role1', !continuous() && l.id === sim.config.x1);
    l.e.classList.toggle('role2', !continuous() && l.id === sim.config.x2);
    if (!continuous() && !plan && slots[l.id]?.kind === 'storage') {
      if (l.id === sim.config.x1) text = displaySlot(l.id) + ' · 역할 X1';
      else if (l.id === sim.config.x2) text = displaySlot(l.id) + ' · 역할 X2';
    }
    const [x, y] = screenPoint(p);
    l.screen = [x, y];
    l.e.textContent = text;
    if (!show || x < -70 || x > viewWidth + 70 || y < 46 || y > viewHeight - 130) {
      l.e.style.display = 'none';
      continue;
    }
    l.e.style.display = 'block';
    l.e.style.left = x + 'px';
    l.e.style.top = (y + (plan && l.actor === 'S2' ? -12 : plan && l.actor === 'S1' ? 12 : 0)) + 'px';
  }
}
