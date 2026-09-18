/**
 * Pallet Circulation Simulator Engine & UI Controller
 * With Bilingual (KO/EN) i18n & High-Performance 2D Canvas Engine
 */

const I18N = {
  ko: {
    appTitle: "팔레트 순환 관제 시뮬레이터",
    appSubtitle: "전시회 데모용 2D 물류 노드 관제 및 가속 시뮬레이션 시스템",
    statusReady: "대기 중 (READY)",
    statusRunning: "시뮬레이션 가속 가동 중",
    statusPaused: "일시정지됨 (PAUSED)",
    recordStart: "화면 녹화 시작",
    recordStop: "녹화 중지",
    cardSimControl: "시뮬레이션 제어",
    btnStart: "시작",
    btnPause: "일시정지",
    btnReset: "초기화",
    btnStep: "스텝",
    speedLabel: "시뮬레이션 배속 가속",
    cardNodeSelect: "초기 팔레트 노드 선택",
    hintMultiSelect: "복수 선택 가능",
    sectionDescNode: "시작 전 팔레트가 배치될 노드를 클릭 또는 체크하여 설정하세요.",
    presetFull: "전체 배치",
    presetAlt: "교대 배치 (D, X2, B)",
    presetSingle: "1개 배치 (D만)",
    presetClear: "전체 해제",
    cardLinkTime: "링크별 이동시간 설정 (초)",
    cardTransferOption: "이송 구간 제어 설정",
    lblRestrictTopTitle: "상단 구간(D➔X1➔X2➔A) 단일 이송 제한 및 우선순위",
    lblRestrictTopDesc: "D➔X1, X1➔X2, X2➔A 링크는 단 1개만 이송되며, X2➔A 미션이 D➔X1 미션보다 최우선으로 진행됩니다.",
    lblShuttleReturnTime: "셔틀 로봇 복귀 시간 (N초)",
    storageNoticeTag: "브라우저 자동 저장",
    storageSaved: "저장 완료",
    globalApplyLabel: "일괄 설정:",
    globalApplyBtn: "전체 적용",
    unitSec: "초",
    unitTimes: "회",
    unitPcs: "개",
    kpiAvgCycle: "A ➔ A 평균 사이클 타임",
    kpiTotalCycles: "A ➔ A 순환 완료 횟수",
    kpiTotalSimTime: "전체 시뮬레이션 시간",
    kpiActivePallets: "현재 시스템 팔레트 수",
    legendYellow: "팔레트 있음 (YELLOW)",
    legendShuttle: "셔틀 로봇 이송 (ORANGE)",
    legendShuttleReturn: "셔틀 로봇 복귀 (DASHED)",
    legendEmpty: "팔레트 없음 (EMPTY)",
    legendMoving: "일반 이송 (MOVING)",
    statusShuttleReturn: "셔틀 로봇 복귀 중",
    nodePalletOn: "PALLET ON",
    nodeEmpty: "EMPTY",
    logTitle: "팔레트 A ➔ A 순환 이력 기록 (Cycle Log)",
    btnClearLogs: "로그 초기화",
    thSeq: "순번",
    thPalletId: "팔레트 ID",
    thCompletedAt: "완료 시각",
    thDuration: "소요시간 (시뮬레이션)",
    thAvgTime: "누적 평균 사이클 타임",
    emptyLogText: "순환 기록이 아직 없습니다. 시뮬레이션을 시작해 보세요.",
    modalTitle: "시뮬레이션 녹화 완료",
    modalDesc: "녹화된 시뮬레이션 동영상을 재생하거나 다운로드할 수 있습니다.",
    modalDownloadBtn: "동영상 다운로드",
    modalCloseBtn: "닫기",
    recBannerText: "화면 녹화 중...",
    nodePrefix: "노드 "
  },
  en: {
    appTitle: "Pallet Circulation Simulator",
    appSubtitle: "2D Logistics Node Control & Speed Simulation System for Exhibition Demos",
    statusReady: "Status: READY",
    statusRunning: "Simulation Running",
    statusPaused: "Status: PAUSED",
    recordStart: "Start Recording",
    recordStop: "Stop Recording",
    cardSimControl: "Simulation Control",
    btnStart: "Start",
    btnPause: "Pause",
    btnReset: "Reset",
    btnStep: "Step",
    speedLabel: "Simulation Speed Multiplier",
    cardNodeSelect: "Initial Pallet Node Selection",
    hintMultiSelect: "Multi-select",
    sectionDescNode: "Click nodes or check boxes to set initial pallet locations before start.",
    presetFull: "Select All",
    presetAlt: "Alternate (D, X2, B)",
    presetSingle: "Single (D Only)",
    presetClear: "Clear All",
    cardLinkTime: "Link Travel Time (sec)",
    cardTransferOption: "Transfer Segment Control",
    lblRestrictTopTitle: "Restrict Top Segment (D➔X1➔X2➔A) with Priority",
    lblRestrictTopDesc: "D➔X1, X1➔X2, X2➔A links operate single-transfer, with X2➔A prioritized over D➔X1.",
    lblShuttleReturnTime: "Shuttle Robot Return Time (N s)",
    storageNoticeTag: "Auto Saved to Browser",
    storageSaved: "Saved",
    globalApplyLabel: "Set All:",
    globalApplyBtn: "Apply All",
    unitSec: "s",
    unitTimes: "cycles",
    unitPcs: "pcs",
    kpiAvgCycle: "A ➔ A Avg Cycle Time",
    kpiTotalCycles: "A ➔ A Completed Cycles",
    kpiTotalSimTime: "Total Simulation Time",
    kpiActivePallets: "System Pallet Count",
    legendYellow: "Pallet Present (YELLOW)",
    legendShuttle: "Shuttle Transfer (ORANGE)",
    legendShuttleReturn: "Shuttle Return (DASHED)",
    legendEmpty: "Pallet Empty (EMPTY)",
    legendMoving: "General Transfer (MOVING)",
    statusShuttleReturn: "Shuttle Returning...",
    nodePalletOn: "PALLET ON",
    nodeEmpty: "EMPTY",
    logTitle: "Pallet A ➔ A Cycle History Log",
    btnClearLogs: "Clear Logs",
    thSeq: "No.",
    thPalletId: "Pallet ID",
    thCompletedAt: "Completed At",
    thDuration: "Cycle Time (Simulated)",
    thAvgTime: "Cumulative Avg",
    emptyLogText: "No cycle history recorded yet. Start simulation to track cycles.",
    modalTitle: "Simulation Recording Complete",
    modalDesc: "You can play back or download the recorded simulation video.",
    modalDownloadBtn: "Download Video",
    modalCloseBtn: "Close",
    recBannerText: "Recording Screen...",
    nodePrefix: "Node "
  }
};

class PalletSimulator {
  constructor() {
    this.canvas = document.getElementById('simCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Language State (default 'ko')
    this.currentLang = localStorage.getItem('pallet_sim_lang') || 'ko';

    // Shuttle Robot Properties
    this.shuttleReturnTimeSec = 2.0;
    this.shuttleState = { status: 'idle', positionNodeId: 'A' };
    this.shuttleReturnTransfer = null;

    // Simulation Clock & Speed
    this.isRunning = false;
    this.speedMultiplier = 1;
    this.lastTimestamp = 0;
    this.simulatedTime = 0; // Total accumulated simulation time in seconds

    // Media Recorder for Screen Recording
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingStartTime = 0;
    this.recordingTimerInterval = null;

    // Cycle Analytics
    this.cycleHistory = [];
    this.nextPalletSequence = 1;

    // Nodes Definition (Clockwise: D -> X1 -> X2 -> A -> B -> C -> D)
    const nodeSize = 90;
    this.nodes = [
      { id: 'D',  x: 140, y: 110, size: nodeSize, hasPallet: true, palletInfo: null },
      { id: 'X1', x: 370, y: 110, size: nodeSize, hasPallet: false, palletInfo: null },
      { id: 'X2', x: 600, y: 110, size: nodeSize, hasPallet: false, palletInfo: null },
      { id: 'A',  x: 830, y: 110, size: nodeSize, hasPallet: false, palletInfo: null },
      { id: 'B',  x: 830, y: 410, size: nodeSize, hasPallet: false, palletInfo: null },
      { id: 'C',  x: 140, y: 410, size: nodeSize, hasPallet: false, palletInfo: null }
    ];

    // Node lookup map
    this.nodeMap = {};
    this.nodes.forEach(n => this.nodeMap[n.id] = n);

    // Links Definition
    this.links = [
      { id: 'D-X1',  from: 'D',  to: 'X1', travelTimeSec: 2.0, activeTransfer: null },
      { id: 'X1-X2', from: 'X1', to: 'X2', travelTimeSec: 2.0, activeTransfer: null },
      { id: 'X2-A',  from: 'X2', to: 'A',  travelTimeSec: 2.0, activeTransfer: null },
      { id: 'A-B',   from: 'A',  to: 'B',  travelTimeSec: 2.0, activeTransfer: null },
      { id: 'B-C',   from: 'B',  to: 'C',  travelTimeSec: 2.0, activeTransfer: null },
      { id: 'C-D',   from: 'C',  to: 'D',  travelTimeSec: 2.0, activeTransfer: null }
    ];

    // Assign initial pallet to D
    this.syncInitialPallets();

    // Load persisted settings from localStorage
    this.loadSettings();

    // Initialize UI, Language, and Event Listeners
    this.initUI();
    this.bindEvents();

    // Set Initial Language UI
    this.setLanguage(this.currentLang);

    // Start render loop
    requestAnimationFrame(this.loop.bind(this));
  }

  // Language Switcher Function
  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('pallet_sim_lang', lang);

    document.getElementById('langKO').classList.toggle('active', lang === 'ko');
    document.getElementById('langEN').classList.toggle('active', lang === 'en');

    const t = I18N[lang];

    const setTxt = (id, text) => {
      const elem = document.getElementById(id);
      if (elem) elem.innerText = text;
    };

    setTxt('appTitle', t.appTitle);
    setTxt('appSubtitle', t.appSubtitle);
    setTxt('cardSimControl', t.cardSimControl);
    setTxt('txtBtnStart', t.btnStart);
    setTxt('txtBtnPause', t.btnPause);
    setTxt('txtBtnReset', t.btnReset);
    setTxt('txtBtnStep', t.btnStep);
    setTxt('speedLabel', t.speedLabel);
    setTxt('cardNodeSelect', t.cardNodeSelect);
    setTxt('hintMultiSelect', t.hintMultiSelect);
    setTxt('sectionDescNode', t.sectionDescNode);
    setTxt('presetFull', t.presetFull);
    setTxt('presetAlt', t.presetAlt);
    setTxt('presetSingle', t.presetSingle);
    setTxt('presetClear', t.presetClear);
    setTxt('cardLinkTime', t.cardLinkTime);
    setTxt('cardTransferOption', t.cardTransferOption);
    setTxt('lblRestrictTopTitle', t.lblRestrictTopTitle);
    setTxt('lblRestrictTopDesc', t.lblRestrictTopDesc);
    setTxt('lblShuttleReturnTime', t.lblShuttleReturnTime);
    setTxt('globalApplyBtn', t.globalApplyBtn);
    setTxt('globalApplyLabel', t.globalApplyLabel);
    setTxt('lblKpiAvgCycle', t.kpiAvgCycle);
    setTxt('lblKpiTotalCycles', t.kpiTotalCycles);
    setTxt('lblKpiTotalSimTime', t.kpiTotalSimTime);
    setTxt('lblKpiActivePallets', t.kpiActivePallets);
    setTxt('legendYellow', t.legendYellow);
    setTxt('legendShuttle', t.legendShuttle);
    setTxt('legendShuttleReturn', t.legendShuttleReturn);
    setTxt('legendEmpty', t.legendEmpty);
    setTxt('legendMoving', t.legendMoving);
    setTxt('logTitle', t.logTitle);
    setTxt('txtBtnClearLogs', t.btnClearLogs);
    setTxt('thSeq', t.thSeq);
    setTxt('thPalletId', t.thPalletId);
    setTxt('thCompletedAt', t.thCompletedAt);
    setTxt('thDuration', t.thDuration);
    setTxt('thAvgTime', t.thAvgTime);
    setTxt('modalTitle', t.modalTitle);
    setTxt('modalDesc', t.modalDesc);
    setTxt('txtModalDownload', t.modalDownloadBtn);
    setTxt('txtModalClose', t.modalCloseBtn);
    setTxt('recBannerText', t.recBannerText);

    document.querySelectorAll('.unit-sec').forEach(e => e.innerText = t.unitSec);

    this.updateStatusBadgeText();
    this.initNodePickerUI();
    this.updateKPIs();
    this.renderLogs();
  }

  updateStatusBadgeText() {
    const t = I18N[this.currentLang];
    const textElem = document.getElementById('simStatusText');
    const badge = document.getElementById('simStatusBadge');
    if (!textElem) return;

    if (this.isRunning) {
      textElem.innerText = `${t.statusRunning} (${this.speedMultiplier}x)`;
    } else if (badge.classList.contains('paused')) {
      textElem.innerText = t.statusPaused;
    } else {
      textElem.innerText = t.statusReady;
    }

    const recBtnText = document.getElementById('recordBtnText');
    if (recBtnText) {
      recBtnText.innerText = this.isRecording ? t.recordStop : t.recordStart;
    }
  }

  // Load saved settings from browser localStorage
  loadSettings() {
    try {
      const savedLinkTimes = localStorage.getItem('pallet_sim_link_times');
      if (savedLinkTimes) {
        const linkMap = JSON.parse(savedLinkTimes);
        this.links.forEach(link => {
          if (linkMap[link.id] !== undefined) {
            const val = parseFloat(linkMap[link.id]);
            if (!isNaN(val) && val >= 0.1) {
              link.travelTimeSec = val;
            }
          }
        });
      }

      const savedTopRestrict = localStorage.getItem('pallet_sim_restrict_top');
      this.restrictTopSegment = savedTopRestrict !== 'false';
      const chkTop = document.getElementById('chkRestrictTopSegment');
      if (chkTop) chkTop.checked = this.restrictTopSegment;

      const savedReturnTime = localStorage.getItem('pallet_sim_shuttle_return');
      if (savedReturnTime) {
        const val = parseFloat(savedReturnTime);
        if (!isNaN(val) && val >= 0.1) this.shuttleReturnTimeSec = val;
      }
      const returnInp = document.getElementById('shuttleReturnTimeInput');
      if (returnInp) returnInp.value = this.shuttleReturnTimeSec;
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
  }

  // Save settings to browser localStorage
  saveSettings() {
    try {
      const t = I18N[this.currentLang];
      const linkMap = {};
      this.links.forEach(link => {
        linkMap[link.id] = link.travelTimeSec;
      });
      localStorage.setItem('pallet_sim_link_times', JSON.stringify(linkMap));
      localStorage.setItem('pallet_sim_restrict_top', this.restrictTopSegment ? 'true' : 'false');
      localStorage.setItem('pallet_sim_shuttle_return', this.shuttleReturnTimeSec);

      // Show save notice badge animation
      const noticeTag = document.getElementById('storageNoticeTag');
      if (noticeTag) {
        noticeTag.innerHTML = `<i class="fa-solid fa-check"></i> ${t.storageSaved}`;
        noticeTag.style.background = 'rgba(16, 185, 129, 0.2)';
        noticeTag.style.color = '#10B981';
        setTimeout(() => {
          noticeTag.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${t.storageNoticeTag}`;
          noticeTag.style.background = '';
          noticeTag.style.color = '';
        }, 1500);
      }
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }

  // Assign internal pallet tracker objects to nodes with hasPallet = true
  syncInitialPallets() {
    let count = 0;
    this.nodes.forEach(node => {
      if (node.hasPallet) {
        count++;
        if (!node.palletInfo) {
          node.palletInfo = {
            id: `P-${this.nextPalletSequence++}`,
            departedA: node.id === 'A',
            departTimeA: node.id === 'A' ? this.simulatedTime : null
          };
        }
      } else {
        node.palletInfo = null;
      }
    });
    this.initialPalletCount = count;
  }

  initUI() {
    this.initNodePickerUI();

    // Render Per-Link Time Input Fields
    const t = I18N[this.currentLang];
    const linkInputsGrid = document.getElementById('linkInputsGrid');
    linkInputsGrid.innerHTML = '';
    this.links.forEach(link => {
      const item = document.createElement('div');
      item.className = 'link-input-item';
      item.innerHTML = `
        <label>${link.from} ➔ ${link.to}</label>
        <div>
          <input type="number" min="0.1" max="60" step="0.5" value="${link.travelTimeSec}" data-link-id="${link.id}">
          <span class="unit-sec">${t.unitSec}</span>
        </div>
      `;
      const input = item.querySelector('input');
      input.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0.1) val = 0.5;
        link.travelTimeSec = val;
        this.saveSettings();
      });
      linkInputsGrid.appendChild(item);
    });

    this.updateKPIs();
  }

  initNodePickerUI() {
    const t = I18N[this.currentLang];
    const nodePickerGrid = document.getElementById('nodePickerGrid');
    if (!nodePickerGrid) return;
    nodePickerGrid.innerHTML = '';
    this.nodes.forEach(node => {
      const chip = document.createElement('div');
      chip.className = `node-chip ${node.hasPallet ? 'has-pallet' : ''}`;
      chip.dataset.nodeId = node.id;
      chip.innerHTML = `
        <span class="node-name">${t.nodePrefix}${node.id}</span>
        <input type="checkbox" ${node.hasPallet ? 'checked' : ''}>
      `;
      chip.addEventListener('click', (e) => {
        if (this.isRunning) return;
        const checkbox = chip.querySelector('input');
        if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
        node.hasPallet = checkbox.checked;
        this.syncInitialPallets();
        this.updateNodeChipUI();
        this.updateKPIs();
      });
      nodePickerGrid.appendChild(chip);
    });
  }

  updateNodeChipUI() {
    const chips = document.querySelectorAll('.node-chip');
    chips.forEach(chip => {
      const nodeId = chip.dataset.nodeId;
      const node = this.nodeMap[nodeId];
      const checkbox = chip.querySelector('input');
      if (node.hasPallet) {
        chip.classList.add('has-pallet');
        checkbox.checked = true;
      } else {
        chip.classList.remove('has-pallet');
        checkbox.checked = false;
      }
    });
  }

  bindEvents() {
    // Language Switcher Buttons
    document.getElementById('langKO').addEventListener('click', () => this.setLanguage('ko'));
    document.getElementById('langEN').addEventListener('click', () => this.setLanguage('en'));

    // Start / Pause / Reset / Step
    document.getElementById('btnStart').addEventListener('click', () => this.start());
    document.getElementById('btnPause').addEventListener('click', () => this.pause());
    document.getElementById('btnReset').addEventListener('click', () => this.reset());
    document.getElementById('btnStep').addEventListener('click', () => this.stepOnce());

    // Speed Slider & Chips
    const speedSlider = document.getElementById('speedSlider');
    const speedValText = document.getElementById('speedValText');
    speedSlider.addEventListener('input', (e) => {
      this.speedMultiplier = parseInt(e.target.value, 10);
      speedValText.innerText = `${this.speedMultiplier}x`;
      this.updateSpeedChipActive(this.speedMultiplier);
    });

    document.querySelectorAll('.speed-presets .btn-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const spd = parseInt(btn.dataset.speed, 10);
        this.speedMultiplier = spd;
        speedSlider.value = spd;
        speedValText.innerText = `${spd}x`;
        this.updateSpeedChipActive(spd);
      });
    });

    // Preset Buttons for Initial Node Selection
    document.getElementById('presetFull').addEventListener('click', () => this.setPreset([true, true, true, true, true, true]));
    document.getElementById('presetAlt').addEventListener('click', () => this.setPreset([true, false, true, false, true, false]));
    document.getElementById('presetSingle').addEventListener('click', () => this.setPreset([true, false, false, false, false, false]));
    document.getElementById('presetClear').addEventListener('click', () => this.setPreset([false, false, false, false, false, false]));

    // Global Link Time Apply
    document.getElementById('btnApplyGlobalLinkTime').addEventListener('click', () => {
      const val = parseFloat(document.getElementById('globalLinkTime').value);
      if (!isNaN(val) && val >= 0.1) {
        this.links.forEach(l => l.travelTimeSec = val);
        document.querySelectorAll('.link-input-item input').forEach(inp => inp.value = val);
        this.saveSettings();
      }
    });

    // Top Segment Restrict Switch
    const chkTop = document.getElementById('chkRestrictTopSegment');
    if (chkTop) {
      chkTop.addEventListener('change', (e) => {
        this.restrictTopSegment = e.target.checked;
        this.saveSettings();
      });
    }

    // Shuttle Robot Return Time Input
    const returnInp = document.getElementById('shuttleReturnTimeInput');
    if (returnInp) {
      returnInp.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0.1) val = 0.5;
        this.shuttleReturnTimeSec = val;
        this.saveSettings();
      });
    }

    // Clear Logs
    document.getElementById('btnClearLogs').addEventListener('click', () => {
      this.cycleHistory = [];
      this.renderLogs();
      this.updateKPIs();
    });

    // Screen Recording Toggle & Modals
    document.getElementById('btnRecordToggle').addEventListener('click', () => this.toggleRecording());
    document.getElementById('btnCloseModal').addEventListener('click', () => this.closeVideoModal());
    document.getElementById('btnCloseModal2').addEventListener('click', () => this.closeVideoModal());

    // Canvas click to toggle node pallet when stopped
    this.canvas.addEventListener('click', (e) => {
      if (this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const clickY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

      this.nodes.forEach(node => {
        const half = node.size / 2;
        if (clickX >= node.x - half && clickX <= node.x + half &&
            clickY >= node.y - half && clickY <= node.y + half) {
          node.hasPallet = !node.hasPallet;
          this.syncInitialPallets();
          this.updateNodeChipUI();
          this.updateKPIs();
        }
      });
    });
  }

  setPreset(states) {
    if (this.isRunning) return;
    this.nodes.forEach((n, idx) => {
      n.hasPallet = states[idx];
    });
    this.syncInitialPallets();
    this.updateNodeChipUI();
    this.updateKPIs();
  }

  updateSpeedChipActive(spd) {
    document.querySelectorAll('.speed-presets .btn-chip').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.speed, 10) === spd);
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();

    document.getElementById('btnStart').disabled = true;
    document.getElementById('btnPause').disabled = false;

    const badge = document.getElementById('simStatusBadge');
    badge.className = 'status-badge running';
    this.updateStatusBadgeText();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;

    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnPause').disabled = true;

    const badge = document.getElementById('simStatusBadge');
    badge.className = 'status-badge paused';
    this.updateStatusBadgeText();
  }

  reset() {
    this.pause();
    this.simulatedTime = 0;

    // Reset cycle history & log table
    this.cycleHistory = [];
    this.renderLogs();

    // Reset links active transfers
    this.links.forEach(l => l.activeTransfer = null);

    // Reset shuttle robot state & return transfers
    this.shuttleReturnTransfer = null;
    this.shuttleState = { status: 'idle', positionNodeId: 'A' };

    // Reset initial pallets
    this.nextPalletSequence = 1;
    this.syncInitialPallets();

    const badge = document.getElementById('simStatusBadge');
    badge.className = 'status-badge ready';
    this.updateStatusBadgeText();

    this.updateNodeChipUI();
    this.updateKPIs();
  }

  stepOnce() {
    const stepDeltaSec = 0.2;
    this.updateSimulationLogic(stepDeltaSec);
    this.updateKPIs();
  }

  // Central Control Logic
  updateSimulationLogic(deltaSec) {
    this.simulatedTime += deltaSec;
    const topLinkIds = ['D-X1', 'X1-X2', 'X2-A'];

    // 0. Process active Shuttle Robot Return Transfer
    if (this.shuttleReturnTransfer) {
      const ret = this.shuttleReturnTransfer;
      ret.elapsed += deltaSec;
      ret.progress = ret.elapsed / this.shuttleReturnTimeSec;

      if (ret.progress >= 1.0) {
        this.shuttleState.positionNodeId = ret.to;
        this.shuttleReturnTransfer = null;
        this.shuttleState.status = 'idle';
      }
    }

    // 1. Process active link transfers
    this.links.forEach(link => {
      if (link.activeTransfer) {
        const transfer = link.activeTransfer;
        transfer.elapsed += deltaSec;
        transfer.progress = transfer.elapsed / link.travelTimeSec;

        if (transfer.progress >= 1.0) {
          const fromNode = this.nodeMap[link.from];
          const toNode = this.nodeMap[link.to];

          fromNode.hasPallet = false;
          fromNode.palletInfo = null;

          toNode.hasPallet = true;
          toNode.palletInfo = transfer.palletInfo;

          link.activeTransfer = null;

          if (topLinkIds.includes(link.id)) {
            this.shuttleState.positionNodeId = toNode.id;
            this.shuttleState.status = 'idle';
          }

          if (toNode.id === 'A') {
            const pallet = toNode.palletInfo;
            if (pallet.departedA && pallet.departTimeA !== null) {
              const cycleDuration = this.simulatedTime - pallet.departTimeA;
              this.recordCompletedCycle(pallet.id, cycleDuration);
            }
            pallet.departedA = true;
            pallet.departTimeA = this.simulatedTime;
          }
        }
      }
    });

    // 2. Evaluate candidate links in priority order (X2-A > X1-X2 > D-X1 > A-B > B-C > C-D)
    const priorityOrderedLinks = [
      this.links.find(l => l.id === 'X2-A'),
      this.links.find(l => l.id === 'X1-X2'),
      this.links.find(l => l.id === 'D-X1'),
      this.links.find(l => l.id === 'A-B'),
      this.links.find(l => l.id === 'B-C'),
      this.links.find(l => l.id === 'C-D')
    ].filter(Boolean);

    priorityOrderedLinks.forEach(link => {
      if (link.activeTransfer) return;

      const fromNode = this.nodeMap[link.from];
      const toNode = this.nodeMap[link.to];

      if (!fromNode.hasPallet) return;

      const isTargetReceiving = this.links.some(l => l.activeTransfer && l.to === toNode.id);
      const isToNodeAvailable = !toNode.hasPallet && !isTargetReceiving;

      if (!isToNodeAvailable) return;

      // Shuttle Robot Handling for Top Segment Links
      if (topLinkIds.includes(link.id)) {
        const isTopBusy = this.links.some(l => topLinkIds.includes(l.id) && l.activeTransfer !== null);
        if (isTopBusy || this.shuttleReturnTransfer !== null) return;

        if (this.shuttleState.positionNodeId !== fromNode.id) {
          this.shuttleReturnTransfer = {
            from: this.shuttleState.positionNodeId,
            to: fromNode.id,
            elapsed: 0,
            progress: 0.0
          };
          this.shuttleState.status = 'returning';
          return;
        }
      }

      const pallet = fromNode.palletInfo || {
        id: `P-${this.nextPalletSequence++}`,
        departedA: fromNode.id === 'A',
        departTimeA: fromNode.id === 'A' ? this.simulatedTime : null
      };

      if (fromNode.id === 'A') {
        pallet.departedA = true;
        pallet.departTimeA = this.simulatedTime;
      }

      link.activeTransfer = {
        palletInfo: pallet,
        elapsed: 0,
        progress: 0.0
      };

      if (topLinkIds.includes(link.id)) {
        this.shuttleState.status = 'transferring';
      }
    });

    this.updateNodeChipUI();
  }

  formatHMS(seconds) {
    const totalSec = Math.floor(seconds);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = n => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  recordCompletedCycle(palletId, durationSec) {
    const cycleNum = this.cycleHistory.length + 1;
    const currentSum = this.cycleHistory.reduce((sum, item) => sum + item.duration, 0) + durationSec;
    const avg = currentSum / cycleNum;

    const record = {
      num: cycleNum,
      palletId: palletId,
      timeString: new Date().toLocaleTimeString(),
      duration: durationSec,
      avgSoFar: avg
    };

    this.cycleHistory.unshift(record);
    this.renderLogs();
    this.updateKPIs();
  }

  renderLogs() {
    const t = I18N[this.currentLang];
    const tbody = document.getElementById('logTableBody');
    if (this.cycleHistory.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5" id="emptyLogText">${t.emptyLogText}</td></tr>`;
      return;
    }

    tbody.innerHTML = this.cycleHistory.map(item => `
      <tr>
        <td><strong>#${item.num}</strong></td>
        <td><span class="hint-tag">${item.palletId}</span></td>
        <td>${item.timeString}</td>
        <td><strong style="color: var(--accent-yellow);">${item.duration.toFixed(2)}${t.unitSec}</strong></td>
        <td>${item.avgSoFar.toFixed(2)}${t.unitSec}</td>
      </tr>
    `).join('');
  }

  updateKPIs() {
    const t = I18N[this.currentLang];
    const totalCycles = this.cycleHistory.length;
    const avgCycle = totalCycles > 0 ? this.cycleHistory[0].avgSoFar : 0;
    const count = this.initialPalletCount !== undefined ? this.initialPalletCount : this.nodes.filter(n => n.hasPallet).length;

    document.getElementById('kpiActivePallets').innerHTML = `${count} <span class="unit">${t.unitPcs}</span>`;
    document.getElementById('kpiTotalCycles').innerHTML = `${totalCycles} <span class="unit">${t.unitTimes}</span>`;
    document.getElementById('kpiAvgCycle').innerHTML = `${avgCycle.toFixed(2)} <span class="unit">${t.unitSec}</span>`;
    
    const totalSimTimeElem = document.getElementById('kpiTotalSimTime');
    if (totalSimTimeElem) {
      totalSimTimeElem.innerText = this.formatHMS(this.simulatedTime);
    }
  }

  // Animation Loop
  loop(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const realDeltaSec = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    if (this.isRunning) {
      const effectiveDelta = Math.min(realDeltaSec, 0.1) * this.speedMultiplier;
      this.updateSimulationLogic(effectiveDelta);
      this.updateKPIs();
      this.updateStatusBadgeText();
    }

    this.renderCanvas();
    requestAnimationFrame(this.loop.bind(this));
  }

  // 2D Canvas Drawing
  renderCanvas() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const t = I18N[this.currentLang];

    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const topLinkIds = ['D-X1', 'X1-X2', 'X2-A'];

    this.links.forEach(link => {
      const fromNode = this.nodeMap[link.from];
      const toNode = this.nodeMap[link.to];
      this.drawLinkArrow(fromNode, toNode, link);
    });

    this.links.forEach(link => {
      if (link.activeTransfer) {
        const fromNode = this.nodeMap[link.from];
        const toNode = this.nodeMap[link.to];
        const progress = Math.min(1.0, Math.max(0.0, link.activeTransfer.progress));

        const posX = fromNode.x + (toNode.x - fromNode.x) * progress;
        const posY = fromNode.y + (toNode.y - fromNode.y) * progress;

        const isShuttle = topLinkIds.includes(link.id);
        this.drawMovingPallet(posX, posY, link.activeTransfer.palletInfo.id, progress, isShuttle);
      }
    });

    // Draw active Shuttle Robot Return animation
    this.drawShuttleReturn(t);

    this.nodes.forEach(node => {
      this.drawNode(node, t);
    });
  }

  drawLinkArrow(fromNode, toNode, link) {
    const ctx = this.ctx;
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const angle = Math.atan2(dy, dx);
    const isTopLink = ['D-X1', 'X1-X2', 'X2-A'].includes(link.id);

    const offset = fromNode.size / 2 + 5;
    const startX = fromNode.x + Math.cos(angle) * offset;
    const startY = fromNode.y + Math.sin(angle) * offset;
    const endX = toNode.x - Math.cos(angle) * offset;
    const endY = toNode.y - Math.sin(angle) * offset;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);

    if (link.activeTransfer) {
      if (isTopLink) {
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 6;
        ctx.shadowColor = 'rgba(249, 115, 22, 0.7)';
        ctx.shadowBlur = 12;
      } else {
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 6;
        ctx.shadowColor = 'rgba(250, 204, 21, 0.5)';
        ctx.shadowBlur = 10;
      }
    } else {
      ctx.strokeStyle = isTopLink ? '#382218' : '#26334D';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.restore();

    const headLen = 16;
    ctx.save();
    if (link.activeTransfer) {
      ctx.fillStyle = isTopLink ? '#F97316' : '#FACC15';
    } else {
      ctx.fillStyle = isTopLink ? '#854D0E' : '#475569';
    }
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLen * Math.cos(angle - Math.PI / 6),
      endY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLen * Math.cos(angle + Math.PI / 6),
      endY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    ctx.save();
    ctx.font = '11px Outfit, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let labelOffsetY = 0;
    let labelOffsetX = 0;
    if (dy === 0) labelOffsetY = -16;
    if (dx === 0) labelOffsetX = dy > 0 ? 24 : -24;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(midX + labelOffsetX - 18, midY + labelOffsetY - 10, 36, 18);
    ctx.strokeStyle = isTopLink ? '#F97316' : '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(midX + labelOffsetX - 18, midY + labelOffsetY - 10, 36, 18);

    ctx.fillStyle = isTopLink ? '#FB923C' : '#38BDF8';
    ctx.fillText(`${link.travelTimeSec}s`, midX + labelOffsetX, midY + labelOffsetY);
    ctx.restore();
  }

  drawShuttleReturn(t) {
    if (!this.shuttleReturnTransfer) return;
    const ctx = this.ctx;
    const ret = this.shuttleReturnTransfer;
    const fromNode = this.nodeMap[ret.from];
    const toNode = this.nodeMap[ret.to];
    if (!fromNode || !toNode) return;

    const progress = Math.min(1.0, Math.max(0.0, ret.progress));
    const posX = fromNode.x + (toNode.x - fromNode.x) * progress;
    const posY = fromNode.y + (toNode.y - fromNode.y) * progress;

    // Draw dashed return line path
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.shadowColor = 'rgba(249, 115, 22, 0.5)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    // Draw Empty Shuttle Robot Icon
    const boxSize = 46;
    ctx.save();
    ctx.translate(posX, posY);

    ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.shadowColor = 'rgba(249, 115, 22, 0.8)';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.roundRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize, 8);
    ctx.fill();
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Icon & Label
    ctx.fillStyle = '#FFEDD5';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🤖', 0, -8);

    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.fillStyle = '#F97316';
    ctx.fillText('RETURN', 0, 10);

    // Floating Badge above robot
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1;
    ctx.fillRect(-45, -38, 90, 18);
    ctx.strokeRect(-45, -38, 90, 18);

    ctx.fillStyle = '#FFEDD5';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.fillText(t ? (t.statusShuttleReturn || '셔틀 복귀 중') : '셔틀 복귀 중', 0, -29);

    ctx.restore();
  }

  drawNode(node, t) {
    const ctx = this.ctx;
    const half = node.size / 2;
    const x = node.x - half;
    const y = node.y - half;

    ctx.save();
    if (node.hasPallet) {
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#CA8A04';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.roundRect(x, y, node.size, node.size, 12);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 26px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y - 8);

      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.fillStyle = '#854D0E';
      ctx.fillText(t ? t.nodePalletOn : 'PALLET ON', node.x, node.y + 18);

    } else {
      ctx.fillStyle = '#1B6585';
      ctx.strokeStyle = '#2B8BB7';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(43, 139, 183, 0.2)';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.roundRect(x, y, node.size, node.size, 12);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y - 8);

      ctx.font = '10px Outfit, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(t ? t.nodeEmpty : 'EMPTY', node.x, node.y + 18);
    }
    ctx.restore();
  }

  drawMovingPallet(x, y, palletId, progress, isShuttle = false) {
    const ctx = this.ctx;
    const boxSize = 44;

    ctx.save();
    ctx.translate(x, y);

    if (isShuttle) {
      ctx.fillStyle = '#F97316';
      ctx.strokeStyle = '#EA580C';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(249, 115, 22, 0.9)';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.roundRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize, 8);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Outfit, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🤖📦', 0, -6);
      ctx.font = 'bold 10px Outfit, monospace';
      ctx.fillText(palletId, 0, 10);
    } else {
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#EAB308';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.roundRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize, 8);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 12px Outfit, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', 0, -6);
      ctx.font = 'bold 10px Outfit, monospace';
      ctx.fillText(palletId, 0, 10);
    }

    ctx.restore();
  }

  // MediaRecorder Screen Recording Functions
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    try {
      const stream = this.canvas.captureStream(30);
      this.recordedChunks = [];
      const options = { mimeType: 'video/webm;codecs=vp9' };

      try {
        this.mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        this.mediaRecorder = new MediaRecorder(stream);
      }

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const videoURL = URL.createObjectURL(blob);
        const recordedVideo = document.getElementById('recordedVideo');
        const downloadBtn = document.getElementById('downloadVideoBtn');

        recordedVideo.src = videoURL;
        downloadBtn.href = videoURL;
        downloadBtn.download = `Pallet_Simulation_Demo_${Date.now()}.webm`;

        document.getElementById('videoModal').classList.remove('hidden');
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      const btn = document.getElementById('btnRecordToggle');
      btn.classList.add('recording');
      this.updateStatusBadgeText();
      document.getElementById('recordingBanner').classList.remove('hidden');

      this.recordingTimerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        document.getElementById('recTimer').innerText = `${mins}:${secs}`;
      }, 1000);

    } catch (err) {
      alert('화면 녹화를 시작할 수 없습니다: ' + err.message);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.recordingTimerInterval);

      const btn = document.getElementById('btnRecordToggle');
      btn.classList.remove('recording');
      this.updateStatusBadgeText();
      document.getElementById('recordingBanner').classList.add('hidden');
    }
  }

  closeVideoModal() {
    document.getElementById('videoModal').classList.add('hidden');
  }
}

// Instantiate App when DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.simulatorApp = new PalletSimulator();
});
