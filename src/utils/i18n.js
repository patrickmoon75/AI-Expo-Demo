export let currentLang = 'ko';

export const t = {
  ko: {
    // Header & Status
    appTitle: 'NOVATEK 3D 팔레트 순환 관제 시뮬레이터',
    appSubtitle: '9 × 9 m 전시 부스 3D CAD 정밀 모형 & 고속 시뮬레이션 관제 시스템',
    simReady: '대기 중 (READY)',
    simRunning: '시연 진행 중',
    simPaused: '일시정지',
    simError: '오류 발생',
    recordStart: '화면 녹화 시작',
    recordStop: '화면 녹화 중지',
    btnSource: '치수 · 근거',

    // KPI Cards
    kpiAvgCycle: 'A → A 평균 사이클 타임',
    kpiCycleCount: 'A → A 순환 완료 횟수',
    kpiTotalTime: '전체 시뮬레이션 시간',
    kpiPalletCount: '현재 시스템 팔레트 수',
    unitCount: '개',
    unitTimes: '회',

    // Camera Toolbar
    camIso: '전체 3D',
    camTop: '9×9 평면',
    camRack: '셔틀 랙',
    camFront: '랙 정면',
    camRear: '후면 통로',

    // Floating Panel
    displayTitle: '3D 시각화 표시 항목',
    btnExpand: '펼치기',
    btnCollapse: '접기',
    lblPallets: '팔레트 ID',
    lblCargo: '화물 수하물',
    lblLabels: '장비/셀 명칭',
    lblPaths: '이동 경로',
    lblLane: '후면 통로',
    lblGhost: '반투명 랙',
    lblVolumes: '보관 윤곽',
    lblDimensions: '주요 치수',
    lblEnvelopes: '장비 외곽선',
    lblGrid: '0.5m 격자',
    lblFloorFilter: '랙 표시 단 선택',
    floorAll: '전체 3단 표시',
    floor1: '1단 · A / D / X6',
    floor2: '2단 · X3 / X4 / X5',
    floor3: '3단 · X1 / 셔틀 충전기 / X2',

    // Captions & Badges
    stageCaptionHeader: '9000 × 9000 mm · 동일 CAD 축척 3D 모델',
    stageCaptionSub: '셔틀 2대 · SEER/HDX 지게차 2대 · SEER AMR 1대 · 고정버퍼 B/C',
    boundaryBadge: '공칭 외곽 경계 정상 (9x9m)',

    // Left Panel 1: Simulation Control
    cardControlTitle: '시뮬레이션 제어',
    btnPlay: '통합 재생',
    btnPause: '일시정지',
    btnReset: '초기화',
    speedLabel: '시뮬레이션 배속 가속',

    // Left Panel 2: Routing & Dispatch
    cardRoutingTitle: 'X-노드 경로 순서 및 이송 관제 설정',
    lblRouteSeq: '셔틀 X-노드 이동 경로 순서 선택',
    optRoute1: 'D → X1 → A (기본 직행 모드)',
    optRoute2: 'D → X2 → A (상층 경유 모드)',
    optRoute3: 'D → X1/X2 교대 지정 (자동 라운드 로빈)',
    optRoute4: '사용자 지정 순서 (선택된 노드 순서)',
    lblFleet: '셔틀 운영 대수 선택',
    optFleet1: '1대 운영 (S1 1단 전용)',
    optFleet2: '2대 운영 (셔틀 2대 동시 관제)',
    lblPalletNodes: '초기 팔레트 위치 선택 (버튼식)',
    lblAutoMission: '팔레트가 있으면 바로 미션 생성',

    // Left Panel 3: Robot Speeds
    cardSpeedTitle: '로봇 주행 속도 설정 (m/s)',
    lblSpeedShuttle: '셔틀 (S1/S2)',
    lblSpeedSeer: 'SEER 지게차',
    lblSpeedAmr: 'SEER AMR',
    lblSpeedHdx: 'HDX 지게차',

    // Bottom Flow
    flowFastCaption: 'A 점유 시 X6 대기 적치',
    flowFullCaption: '기존 전체 보관 경유',

    // Detail Modal
    btnFocus: '선택 위치 확대',
    detailLocation: '위치',
    detailEquipment: '이동 장비',
    detailPallet: '팔레트 ID',

    // Equipment Names
    nameS1: '셔틀 01',
    nameS2: '셔틀 02',
    nameSeer: 'SEER 지게차',
    nameAmr: 'SEER AMR',
    nameHdx: 'HDX 지게차',
    nameCharger: '셔틀 충전기',
    nameInboundD: 'D · HDX 투입',
    nameOutboundA: 'A · SEER 출고',

    // Dimensions Modal
    sourceTitle: '적용한 3D 제원 및 배치 기준',
    sourceSub: '장비를 임의 비율로 축소하지 않았으며, CAD 제원 바탕의 실제 9×9m 축척 3D 형상이 적용되었습니다.',
    thTarget: '대상',
    thDim: '적용 치수 (mm)',
    thProvenance: '근거 및 제원'
  },
  en: {
    // Header & Status
    appTitle: 'NOVATEK 3D Pallet Circulation Control Simulator',
    appSubtitle: '9 × 9 m Exhibition Booth 3D CAD Precision Model & High-Speed Control System',
    simReady: 'READY',
    simRunning: 'SIMULATING',
    simPaused: 'PAUSED',
    simError: 'ERROR',
    recordStart: 'Start Screen Record',
    recordStop: 'Stop Screen Record',
    btnSource: 'Dimensions & Spec',

    // KPI Cards
    kpiAvgCycle: 'A → A Avg Cycle Time',
    kpiCycleCount: 'A → A Cycles Completed',
    kpiTotalTime: 'Total Simulation Time',
    kpiPalletCount: 'Current Pallets in System',
    unitCount: 'Pcs',
    unitTimes: 'Times',

    // Camera Toolbar
    camIso: 'Iso 3D',
    camTop: '9×9 Top',
    camRack: 'Shuttle Rack',
    camFront: 'Front View',
    camRear: 'Rear Lane',

    // Floating Panel
    displayTitle: '3D Display Options',
    btnExpand: 'Expand',
    btnCollapse: 'Collapse',
    lblPallets: 'Pallet ID',
    lblCargo: 'Cargo Payload',
    lblLabels: 'Equipment/Cell Labels',
    lblPaths: 'Motion Paths',
    lblLane: 'Rear Lane',
    lblGhost: 'Ghost Rack',
    lblVolumes: 'Storage Volumes',
    lblDimensions: 'Dimensions',
    lblEnvelopes: 'Envelopes',
    lblGrid: '0.5m Grid',
    lblFloorFilter: 'Rack Level Selection',
    floorAll: 'All 3 Levels',
    floor1: 'Level 1 · A / D / X6',
    floor2: 'Level 2 · X3 / X4 / X5',
    floor3: 'Level 3 · X1 / Shuttle Charger / X2',

    // Captions & Badges
    stageCaptionHeader: '9000 × 9000 mm · 1:1 CAD Scale 3D Model',
    stageCaptionSub: '2 Shuttles · 2 SEER/HDX Forklifts · 1 SEER AMR · Fixed Buffers B/C',
    boundaryBadge: 'Nominal Outer Boundary Normal (9x9m)',

    // Left Panel 1: Simulation Control
    cardControlTitle: 'Simulation Control',
    btnPlay: 'Play All',
    btnPause: 'Pause',
    btnReset: 'Reset',
    speedLabel: 'Simulation Speed Acceleration',

    // Left Panel 2: Routing & Dispatch
    cardRoutingTitle: 'X-Node Routing & Dispatch Config',
    lblRouteSeq: 'Shuttle X-Node Route Sequence',
    optRoute1: 'D → X1 → A (Default Direct)',
    optRoute2: 'D → X2 → A (Via Upper Level)',
    optRoute3: 'D → X1/X2 Alternating (Round-Robin)',
    optRoute4: 'Custom Sequence (Selected Nodes)',
    lblFleet: 'Shuttle Operational Fleet',
    optFleet1: '1 Unit (S1 Level 1 Only)',
    optFleet2: '2 Units (Dual Shuttle Control)',
    lblPalletNodes: 'Initial Pallet Location Selection',
    lblAutoMission: 'Auto Mission When Pallet Exists',

    // Left Panel 3: Robot Speeds
    cardSpeedTitle: 'Robot Speed Settings (m/s)',
    lblSpeedShuttle: 'Shuttle (S1/S2)',
    lblSpeedSeer: 'SEER Forklift',
    lblSpeedAmr: 'SEER AMR',
    lblSpeedHdx: 'HDX Forklift',

    // Bottom Flow
    flowFastCaption: 'A Occupied: Staged at X6',
    flowFullCaption: 'Via Existing Full Storage Route',

    // Detail Modal
    btnFocus: 'Focus Selected Position',
    detailLocation: 'LOCATION',
    detailEquipment: 'MOBILE EQUIPMENT',
    detailPallet: 'PALLET ID',

    // Equipment Names
    nameS1: 'Shuttle 01',
    nameS2: 'Shuttle 02',
    nameSeer: 'SEER Forklift',
    nameAmr: 'SEER AMR',
    nameHdx: 'HDX Forklift',
    nameCharger: 'Shuttle Charger',
    nameInboundD: 'D · HDX Inbound',
    nameOutboundA: 'A · SEER Outbound',

    // Dimensions Modal
    sourceTitle: 'Applied 3D Dimensions & Layout Criteria',
    sourceSub: 'Modeled to exact 1:1 3D CAD scale (9×9m) without arbitrary reduction.',
    thTarget: 'Target',
    thDim: 'Applied Dim (mm)',
    thProvenance: 'Provenance & Spec'
  }
};

export function getText(key) {
  return (t[currentLang] && t[currentLang][key]) || (t.ko && t.ko[key]) || key;
}

export function setLanguage(lang) {
  if (lang !== 'ko' && lang !== 'en') return;
  currentLang = lang;
}
