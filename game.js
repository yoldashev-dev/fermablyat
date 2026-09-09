// AgroTycoon 3D: High-Fidelity WebGL Farm & Machinery Engine (RTX Edition)
// Powered by Three.js (r128) + Real-Time Directional Soft Shadows + PBR Shading + Instanced Crops

(function () {
  'use strict';

  const canvas = document.getElementById('farmCanvas');

  // DOM Elements
  const hud = {
    money: document.getElementById('hud-money'),
    day: document.getElementById('hud-day'),
    weatherIcon: document.getElementById('hud-weather-icon'),
    weatherText: document.getElementById('hud-weather-text'),
    whText: document.getElementById('hud-wh-text'),
    whBar: document.getElementById('hud-wh-bar'),
    newsTicker: document.getElementById('news-ticker'),
    activeVehicleBar: document.getElementById('active-vehicle-bar'),
    drivingVehicleName: document.getElementById('driving-vehicle-name'),
    seedSelector: document.getElementById('seed-selector'),
    toolSlots: document.querySelectorAll('.tool-slot'),
    seedOptions: document.querySelectorAll('.seed-opt'),
    modalMarket: document.getElementById('modal-market'),
    modalMachinery: document.getElementById('modal-machinery'),
    modalWorkers: document.getElementById('modal-workers'),
    modalLand: document.getElementById('modal-land'),
    modalRivals: document.getElementById('modal-rivals'),
    modalWarehouse: document.getElementById('modal-warehouse'),
    marketList: document.getElementById('market-list'),
    machineryList: document.getElementById('machinery-list'),
    workersList: document.getElementById('workers-list'),
    landList: document.getElementById('land-list'),
    rivalsTbody: document.getElementById('rivals-tbody'),
    whDetailContent: document.getElementById('warehouse-detail-content'),
    whUpgradesList: document.getElementById('warehouse-upgrades-list'),
    btnNavWarehouse: document.getElementById('btn-nav-warehouse'),
    btnToggleRtx: document.getElementById('btn-toggle-rtx'),
    btnToggleView: document.getElementById('btn-toggle-view'),
    fpsCrosshair: document.getElementById('fps-crosshair'),
    mobileControls: document.getElementById('mobile-controls'),
    joystickZone: document.getElementById('joystick-zone'),
    joystickBase: document.getElementById('joystick-base'),
    joystickKnob: document.getElementById('joystick-knob'),
    touchLookZone: document.getElementById('touch-look-zone'),
    btnTouchAction: document.getElementById('btn-touch-action'),
    btnTouchSprint: document.getElementById('btn-touch-sprint'),
    btnTouchCam: document.getElementById('btn-touch-cam'),
    btnTouchVehicle: document.getElementById('btn-touch-vehicle'),
    btnTouchExit: document.getElementById('btn-touch-exit'),
    btnQuickExitVehicle: document.getElementById('btn-quick-exit-vehicle'),
    modalMultiplayer: document.getElementById('modal-multiplayer'),
    btnNavMultiplayer: document.getElementById('btn-nav-multiplayer'),
    btnMpCreate: document.getElementById('btn-mp-create'),
    btnMpJoin: document.getElementById('btn-mp-join'),
    btnMpDisconnect: document.getElementById('btn-mp-disconnect'),
    inputRoomCode: document.getElementById('input-room-code'),
    mpHostInfo: document.getElementById('mp-host-info'),
    mpRoomCode: document.getElementById('mp-room-code'),
    btnCopyCode: document.getElementById('btn-copy-code'),
    btnCopyLink: document.getElementById('btn-copy-link'),
    mpStatusBanner: document.getElementById('mp-status-banner'),
    mpStatusText: document.getElementById('mp-status-text'),
    mpActiveSection: document.getElementById('mp-active-section'),
    mpMyRole: document.getElementById('mp-my-role'),
    quickEmoteBar: document.getElementById('quick-emote-bar')
  };

  // --- MOBILE DEVICE DETECTION & OPTIMIZATIONS ---
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || ('ontouchstart' in window)
    || (navigator.maxTouchPoints > 0)
    || (window.innerWidth <= 820);

  // Touch input state for virtual joystick and buttons
  const touchInput = {
    active: false,
    moveX: 0,
    moveZ: 0,
    isSprinting: false
  };

  // --- THREE.JS INITIALIZATION ---
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2.0));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7ec0ee); // Rich natural sky blue
  scene.fog = new THREE.Fog(0x7ec0ee, 150, 520); // Crisp linear atmospheric fog

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 1200);
  camera.position.set(48, 45, 65);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 - 0.08; // Prevent going underground
  controls.minDistance = 15;
  controls.maxDistance = 350;
  controls.target.set(20, 0, 20);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2.0));
  });


  // --- REAL-TIME RTX LIGHTING & DAY/NIGHT RIG ---
  const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.55);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0x7ec0ee, 0x2e4a1f, 0.45);
  scene.add(hemiLight);

  // Directional Sun with high-res cascaded soft shadows
  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
  sunLight.position.set(100, 160, 90);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
  sunLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 450;
  const shadowRange = 110;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);
  scene.add(camera);

  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(72, 0, 72);
  scene.add(sunTarget);
  sunLight.target = sunTarget;

  // Starfield for night sky
  const starsGeo = new THREE.BufferGeometry();
  const starCount = 600;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    const r = 500 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.45; // upper hemisphere
    starPos[i] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i + 1] = r * Math.cos(phi) + 50;
    starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, transparent: true, opacity: 0 });
  const starField = new THREE.Points(starsGeo, starsMat);
  scene.add(starField);


  // --- ECONOMY, CROPS & GAME STATE ---
  const farm = {
    money: 1200,
    day: 1,
    timeOfDay: 9.5, // 9:30 AM
    dayDuration: 180, // 3 minutes per 24h cycle
    rtxEnabled: true,
    viewMode: 'RTS',
    season: 'Весна',
    weather: 'sunny',
    weatherTimer: 45,
    warehouse: {
      capacity: 250,
      upgradeLevel: 1,
      items: { wheat: 0, corn: 0, potato: 0, carrot: 0, sunflower: 0, flour: 0, milk: 0, manure: 2 }
    },
    cowsCount: 2,
    cowsFed: true,
    feedTimer: 60,
    contracts: [],
    totalHarvestedTons: 0,
    activeTool: 'hoe',
    activeSeed: 'wheat',
    drivingVehicle: null
  };

  const CROP_INFO = {
    wheat: { name: 'Пшеница', icon: '🌾', seedCost: 5, basePrice: 16, growTime: 18, color: 0xf1c40f },
    corn: { name: 'Кукуруза', icon: '🌽', seedCost: 12, basePrice: 38, growTime: 28, color: 0xf39c12 },
    potato: { name: 'Картофель', icon: '🥔', seedCost: 15, basePrice: 52, growTime: 24, color: 0x8d6e63 },
    carrot: { name: 'Морковь', icon: '🥕', seedCost: 20, basePrice: 72, growTime: 40, color: 0xe67e22 },
    sunflower: { name: 'Подсолнух', icon: '🌻', seedCost: 35, basePrice: 135, growTime: 55, color: 0xffd700 },
    flour: { name: 'Мука высший сорт', icon: '🌾', seedCost: 0, basePrice: 46, growTime: 0, color: 0xffffff, isProduct: true },
    milk: { name: 'Фермерское молоко', icon: '🥛', seedCost: 0, basePrice: 68, growTime: 0, color: 0xfff9c4, isProduct: true },
    manure: { name: 'Органический навоз', icon: '💩', seedCost: 0, basePrice: 15, growTime: 0, color: 0x5d4037, isProduct: true }
  };

  const market = {
    wheat: { price: 16, trend: 0 },
    corn: { price: 38, trend: 0 },
    potato: { price: 52, trend: 0 },
    carrot: { price: 72, trend: 0 },
    sunflower: { price: 135, trend: 0 },
    flour: { price: 46, trend: 0 },
    milk: { price: 68, trend: 0 },
    manure: { price: 15, trend: 0 }
  };

  const competitors = [
    { name: 'АгроХолдинг «Заря»', money: 14500, lands: 4, harvested: 1240 },
    { name: 'GreenField BioCorp', money: 9800, lands: 3, harvested: 820 },
    { name: 'Ферма Братьев Смит', money: 4200, lands: 2, harvested: 410 }
  ];

  // Grid Settings: 48x48 world tiles (3x3 plots of 16x16 each)
  const TILE_SIZE = 3.0; // 3 meters per tile in 3D world units
  const GRID_COLS = 48;
  const GRID_ROWS = 48;

  const PLOTS = [
    { id: 0, name: 'Центральная усадьба', minC: 0, maxC: 15, minR: 0, maxR: 15, cost: 0, owned: true },
    { id: 1, name: 'Восточные поля', minC: 16, maxC: 31, minR: 0, maxR: 15, cost: 650, owned: false },
    { id: 2, name: 'Степной простор', minC: 32, maxC: 47, minR: 0, maxR: 15, cost: 1350, owned: false },
    { id: 3, name: 'Западные угодья', minC: 0, maxC: 15, minR: 16, maxR: 31, cost: 1100, owned: false },
    { id: 4, name: 'Южная целина', minC: 16, maxC: 31, minR: 16, maxR: 31, cost: 2200, owned: false },
    { id: 5, name: 'Плодородная низина', minC: 32, maxC: 47, minR: 16, maxR: 31, cost: 3600, owned: false },
    { id: 6, name: 'Речная долина', minC: 0, maxC: 15, minR: 32, maxR: 47, cost: 4800, owned: false },
    { id: 7, name: 'Южные чернозёмы', minC: 16, maxC: 31, minR: 32, maxR: 47, cost: 6500, owned: false },
    { id: 8, name: 'Усадьба Друга (Юго-Восток)', minC: 32, maxC: 47, minR: 32, maxR: 47, cost: 9000, owned: false }
  ];

  function isTileOwned(c, r) {
    if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return false;
    return PLOTS[grid[r][c].plotId].owned;
  }

  function isPositionOnOwnedPlot(worldX, worldZ) {
    const c = Math.floor(worldX / TILE_SIZE);
    const r = Math.floor(worldZ / TILE_SIZE);
    return isTileOwned(c, r);
  }


  // --- PROCEDURAL 3D TERRAIN & TILE MESHES ---
  const materials = {
    grassA: new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.85, metalness: 0.1 }),
    grassB: new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.85, metalness: 0.1 }),
    tilledDry: new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.95, metalness: 0.05 }),
    tilledWet: new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.45, metalness: 0.25 }),
    unowned: new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.9, metalness: 0.1 }),
    road: new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.9 }),
    water: new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.7 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 }),
    redBarn: new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.65 }),
    roofTile: new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.7 }),
    siloMetal: new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.35, metalness: 0.75 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x81d4fa, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.9 }),
    yellowRim: new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.4, metalness: 0.6 }),
    steelPlow: new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.3, metalness: 0.85 }),
    goldGlow: new THREE.MeshBasicMaterial({ color: 0xffeb3b }),
    selectionBox: new THREE.MeshBasicMaterial({ color: 0x00e676, wireframe: true }),
    blueBarn: new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.65 }),
    cyanSilo: new THREE.MeshStandardMaterial({ color: 0x80deea, roughness: 0.35, metalness: 0.75 }),
    friendShirt: new THREE.MeshStandardMaterial({ color: 0x00bcd4, roughness: 0.7 }),
    friendCap: new THREE.MeshStandardMaterial({ color: 0x0288d1, roughness: 0.7 })
  };

  const tileGeo = new THREE.BoxGeometry(TILE_SIZE - 0.08, 0.4, TILE_SIZE - 0.08);

  const grid = [];
  const tileMeshes = [];
  
  // --- ENDLESS COUNTRYSIDE TERRAIN (NO MORE VOID!) ---
  const worldGroundGeo = new THREE.PlaneGeometry(1600, 1600, 16, 16);
  worldGroundGeo.rotateX(-Math.PI / 2);
  const worldGroundMat = new THREE.MeshStandardMaterial({
    color: 0x35632b, // Lush country grass
    roughness: 0.95,
    metalness: 0.05
  });
  const worldGround = new THREE.Mesh(worldGroundGeo, worldGroundMat);
  worldGround.position.set(72, -0.22, 72);
  worldGround.receiveShadow = true;
  scene.add(worldGround);

  // Distant scenic hills on horizon
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x284f22, roughness: 1.0 });
  for (let h = 0; h < 14; h++) {
    const angle = (h / 14) * Math.PI * 2;
    const dist = 320 + (h % 3) * 60;
    const radius = 60 + Math.random() * 50;
    const height = 25 + Math.random() * 20;
    const hillGeo = new THREE.ConeGeometry(radius, height, 8);
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(72 + Math.cos(angle) * dist, height / 2 - 2, 72 + Math.sin(angle) * dist);
    scene.add(hill);
  }

  const terrainGroup = new THREE.Group();
  scene.add(terrainGroup);

  function initTerrain() {
    for (let r = 0; r < GRID_ROWS; r++) {
      grid[r] = [];
      tileMeshes[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const colSec = Math.min(2, Math.floor(c / 16));
        const rowSec = Math.min(2, Math.floor(r / 16));
        const plotId = rowSec * 3 + colSec;

        const isOwned = PLOTS[plotId].owned;
        const isFarmsteadYard = (c >= 0 && c <= 7 && r >= 1 && r <= 5);
        const isPastureYard = (c >= 0 && c <= 5 && r >= 8 && r <= 13);
        const isFriendYard = (c >= 37 && c <= 45 && r >= 37 && r <= 43);
        // Country road connecting the two farmsteads across the valley
        const isConnectingRoad = (c === r && c >= 6 && c <= 38) || (c === r + 1 && c >= 7 && c <= 38);
        const isFarmable = !isFarmsteadYard && !isPastureYard && !isFriendYard && !isConnectingRoad;

        grid[r][c] = {
          c: c,
          r: r,
          plotId: plotId,
          soil: (isFarmsteadYard || isFriendYard || isConnectingRoad) ? 'yard' : (isPastureYard ? 'corral' : 'grass'),
          moisture: 0,
          fertilized: false,
          fertility: 100,
          lastCrop: null,
          hasWeeds: false,
          crop: null,
          farmable: isFarmable,
          deco: (c * 7 + r * 13) % 8
        };

        let baseMat;
        if (!isOwned && !isConnectingRoad) {
          baseMat = materials.unowned;
        } else if (isFarmsteadYard || isFriendYard || isConnectingRoad) {
          baseMat = materials.road;
        } else if (isPastureYard) {
          baseMat = materials.tilledDry;
        } else {
          baseMat = (c + r) % 2 === 0 ? materials.grassA : materials.grassB;
        }

        const mesh = new THREE.Mesh(tileGeo, baseMat);
        mesh.position.set(c * TILE_SIZE + TILE_SIZE / 2, -0.2, r * TILE_SIZE + TILE_SIZE / 2);
        mesh.receiveShadow = true;
        mesh.userData = { c: c, r: r };
        terrainGroup.add(mesh);
        tileMeshes[r][c] = mesh;
      }
    }

    // Add Plot Boundary Lines & Corner Posts
    createPlotBoundaries();
  }

  const boundaryGroup = new THREE.Group();
  scene.add(boundaryGroup);

  function createPlotBoundaries() {
    // Clear old boundaries
    while (boundaryGroup.children.length > 0) {
      boundaryGroup.remove(boundaryGroup.children[0]);
    }

    const postGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.2, 8);
    const postMat = materials.wood;

    PLOTS.forEach(plot => {
      const minX = plot.minC * TILE_SIZE;
      const maxX = (plot.maxC + 1) * TILE_SIZE;
      const minZ = plot.minR * TILE_SIZE;
      const maxZ = (plot.maxR + 1) * TILE_SIZE;

      // 4 Corner Posts
      const corners = [
        [minX, minZ], [maxX, minZ], [maxX, maxZ], [minX, maxZ]
      ];
      corners.forEach(([cx, cz]) => {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(cx, 1.1, cz);
        post.castShadow = true;
        boundaryGroup.add(post);
      });

      // Boundary outline
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(minX, 0.08, minZ),
        new THREE.Vector3(maxX, 0.08, minZ),
        new THREE.Vector3(maxX, 0.08, maxZ),
        new THREE.Vector3(minX, 0.08, maxZ),
        new THREE.Vector3(minX, 0.08, minZ)
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: plot.owned ? 0x2e7d32 : 0xd32f2f,
        linewidth: 2
      });
      const line = new THREE.Line(lineGeo, lineMat);
      boundaryGroup.add(line);
    });
  }

  function updateTileAppearance(c, r) {
    const tile = grid[r][c];
    const mesh = tileMeshes[r][c];
    const isOwned = PLOTS[tile.plotId].owned;

    if (!isOwned && tile.soil !== 'yard') {
      mesh.material = materials.unowned;
    } else if (tile.soil === 'yard' || tile.soil === 'road') {
      mesh.material = materials.road;
    } else if (tile.soil === 'corral') {
      mesh.material = materials.tilledDry;
    } else if (tile.soil === 'tilled') {
      mesh.material = tile.moisture > 30 ? materials.tilledWet : materials.tilledDry;
    } else {
      mesh.material = (c + r) % 2 === 0 ? materials.grassA : materials.grassB;
    }
  }


  // --- THREE.INSTANCEDMESH CROPS SYSTEM ---
  // Max possible crops = 48x48 = 2304
  const MAX_CROPS = 2304;
  const cropMeshes = {};
  const dummyMat = new THREE.Matrix4();
  const dummyPos = new THREE.Vector3();
  const dummyScale = new THREE.Vector3();
  const dummyRot = new THREE.Quaternion();

  // Helper to merge multiple geometries with vertex colors into a single BufferGeometry
  function buildColoredGeo(components) {
    let totalVerts = 0;
    const list = components.map(c => {
      const ni = c.geo.index ? c.geo.toNonIndexed() : c.geo;
      totalVerts += ni.attributes.position.count;
      return { ni, color: c.color };
    });

    const posArr = new Float32Array(totalVerts * 3);
    const normArr = new Float32Array(totalVerts * 3);
    const colArr = new Float32Array(totalVerts * 3);

    let offset = 0;
    list.forEach(({ ni, color }) => {
      const count = ni.attributes.position.count;
      posArr.set(ni.attributes.position.array, offset * 3);
      if (ni.attributes.normal) normArr.set(ni.attributes.normal.array, offset * 3);
      for (let i = 0; i < count; i++) {
        colArr[(offset + i) * 3] = color[0];
        colArr[(offset + i) * 3 + 1] = color[1];
        colArr[(offset + i) * 3 + 2] = color[2];
      }
      offset += count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
    merged.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    return merged;
  }

  // Create rich, highly visible procedural 3D crop models
  function initCropMeshSystem() {
    const cropMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.65,
      metalness: 0.05
    });

    // 1. Wheat: Lush clump of 5 golden stalks with grain heads
    const wheatParts = [];
    const stemC = new THREE.CylinderGeometry(0.04, 0.05, 1.5, 6);
    stemC.translate(0, 0.75, 0);
    wheatParts.push({ geo: stemC, color: [0.85, 0.72, 0.25] });
    const earC = new THREE.ConeGeometry(0.22, 0.85, 6);
    earC.translate(0, 1.6, 0);
    wheatParts.push({ geo: earC, color: [0.98, 0.85, 0.35] });

    [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([ox, oz]) => {
      const stem = new THREE.CylinderGeometry(0.035, 0.045, 1.3, 5);
      stem.translate(0, 0.65, 0);
      stem.rotateZ(ox * 0.4);
      stem.rotateX(oz * 0.4);
      stem.translate(ox, 0, oz);
      wheatParts.push({ geo: stem, color: [0.82, 0.70, 0.22] });

      const ear = new THREE.ConeGeometry(0.18, 0.7, 5);
      ear.translate(0, 1.3, 0);
      ear.rotateZ(ox * 0.4);
      ear.rotateX(oz * 0.4);
      ear.translate(ox, 0, oz);
      wheatParts.push({ geo: ear, color: [0.95, 0.82, 0.32] });
    });
    const wheatGeo = buildColoredGeo(wheatParts);
    cropMeshes.wheat = new THREE.InstancedMesh(wheatGeo, cropMat, MAX_CROPS);
    cropMeshes.wheat.castShadow = true;
    cropMeshes.wheat.receiveShadow = true;
    cropMeshes.wheat.count = 0;
    scene.add(cropMeshes.wheat);

    // 2. Potato: Realistic mounded hill, visible golden tubers, bushy foliage & white blossoms
    const potatoParts = [];
    const mound = new THREE.CylinderGeometry(0.5, 0.75, 0.28, 8);
    mound.translate(0, 0.14, 0);
    potatoParts.push({ geo: mound, color: [0.38, 0.24, 0.16] });

    [[-0.32, 0.18, 0.2], [0.3, 0.16, -0.22]].forEach(([px, py, pz]) => {
      const tuber = new THREE.DodecahedronGeometry(0.18, 0);
      tuber.scale(1.3, 0.8, 0.9);
      tuber.translate(px, py, pz);
      potatoParts.push({ geo: tuber, color: [0.76, 0.56, 0.34] });
    });

    [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].forEach(([sx, sz]) => {
      const stem = new THREE.CylinderGeometry(0.04, 0.05, 0.9, 5);
      stem.translate(0, 0.45, 0);
      stem.rotateZ(sx * 0.4);
      stem.rotateX(sz * 0.4);
      stem.translate(sx, 0.2, sz);
      potatoParts.push({ geo: stem, color: [0.2, 0.52, 0.22] });

      const leafCluster = new THREE.DodecahedronGeometry(0.26, 0);
      leafCluster.scale(1.2, 0.7, 1.2);
      leafCluster.translate(sx * 1.5, 0.88, sz * 1.5);
      potatoParts.push({ geo: leafCluster, color: [0.26, 0.65, 0.26] });
    });

    [[0, 1.12, 0.1], [0.15, 1.16, -0.1]].forEach(([fx, fy, fz]) => {
      const flower = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 5);
      flower.translate(fx, fy, fz);
      potatoParts.push({ geo: flower, color: [0.96, 0.96, 1.0] });

      const stamen = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 5);
      stamen.translate(fx, fy + 0.02, fz);
      potatoParts.push({ geo: stamen, color: [1.0, 0.85, 0.0] });
    });

    const potatoGeo = buildColoredGeo(potatoParts);
    cropMeshes.potato = new THREE.InstancedMesh(potatoGeo, cropMat, MAX_CROPS);
    cropMeshes.potato.castShadow = true;
    cropMeshes.potato.receiveShadow = true;
    cropMeshes.potato.count = 0;
    scene.add(cropMeshes.potato);

    // 3. Corn: Sturdy tall green stalk, 4 long leaves, and 2 ripe golden cobs
    const cornParts = [];
    const cornStem = new THREE.CylinderGeometry(0.14, 0.18, 2.5, 6);
    cornStem.translate(0, 1.25, 0);
    cornParts.push({ geo: cornStem, color: [0.22, 0.58, 0.22] });

    [[-0.6, 1.2, 0, 0.6], [0.6, 1.5, 0, -0.6], [0, 1.8, -0.6, 0], [0, 2.0, 0.6, 0]].forEach(([lx, ly, lz, rotZ]) => {
      const leaf = new THREE.BoxGeometry(0.9, 0.08, 0.25);
      leaf.rotateZ(rotZ || 0);
      leaf.translate(lx, ly, lz);
      cornParts.push({ geo: leaf, color: [0.3, 0.7, 0.26] });
    });

    [[-0.25, 1.3, 0.2], [0.25, 1.6, -0.2]].forEach(([cx, cy, cz]) => {
      const cob = new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6);
      cob.rotateZ(cx > 0 ? -0.4 : 0.4);
      cob.translate(cx, cy, cz);
      cornParts.push({ geo: cob, color: [1.0, 0.78, 0.1] });
    });
    const cornGeo = buildColoredGeo(cornParts);
    cropMeshes.corn = new THREE.InstancedMesh(cornGeo, cropMat, MAX_CROPS);
    cropMeshes.corn.castShadow = true;
    cropMeshes.corn.receiveShadow = true;
    cropMeshes.corn.count = 0;
    scene.add(cropMeshes.corn);

    // 3. Carrot: Bright orange root shoulder & 5 lush spreading green fronds
    const carrotParts = [];
    const root = new THREE.CylinderGeometry(0.32, 0.18, 0.5, 8);
    root.translate(0, 0.25, 0);
    carrotParts.push({ geo: root, color: [1.0, 0.45, 0.0] });

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const frond = new THREE.ConeGeometry(0.35, 1.1, 5);
      frond.translate(0, 0.55, 0);
      frond.rotateZ(0.35);
      frond.rotateY(angle);
      frond.translate(Math.sin(angle) * 0.15, 0.4, Math.cos(angle) * 0.15);
      carrotParts.push({ geo: frond, color: [0.22, 0.68, 0.24] });
    }
    const carrotGeo = buildColoredGeo(carrotParts);
    cropMeshes.carrot = new THREE.InstancedMesh(carrotGeo, cropMat, MAX_CROPS);
    cropMeshes.carrot.castShadow = true;
    cropMeshes.carrot.receiveShadow = true;
    cropMeshes.carrot.count = 0;
    scene.add(cropMeshes.carrot);

    // 4. Sunflower: Tall stem, broad leaves, large golden petal disc & brown center
    const sunParts = [];
    const sunStem = new THREE.CylinderGeometry(0.14, 0.18, 2.6, 8);
    sunStem.translate(0, 1.3, 0);
    sunParts.push({ geo: sunStem, color: [0.18, 0.5, 0.2] });

    [[-0.5, 1.2, 0, 0.5], [0.5, 1.6, 0, -0.5]].forEach(([lx, ly, lz, rotZ]) => {
      const leaf = new THREE.BoxGeometry(0.8, 0.06, 0.35);
      leaf.rotateZ(rotZ);
      leaf.translate(lx, ly, lz);
      sunParts.push({ geo: leaf, color: [0.24, 0.6, 0.24] });
    });

    const petalRing = new THREE.CylinderGeometry(0.85, 0.85, 0.1, 12);
    petalRing.rotateX(0.25);
    petalRing.translate(0, 2.6, 0.2);
    sunParts.push({ geo: petalRing, color: [1.0, 0.84, 0.0] });

    const seedDisc = new THREE.CylinderGeometry(0.52, 0.52, 0.13, 12);
    seedDisc.rotateX(0.25);
    seedDisc.translate(0, 2.61, 0.22);
    sunParts.push({ geo: seedDisc, color: [0.25, 0.14, 0.08] });
    const sunflowerGeo = buildColoredGeo(sunParts);
    cropMeshes.sunflower = new THREE.InstancedMesh(sunflowerGeo, cropMat, MAX_CROPS);
    cropMeshes.sunflower.castShadow = true;
    cropMeshes.sunflower.receiveShadow = true;
    cropMeshes.sunflower.count = 0;
    scene.add(cropMeshes.sunflower);
  }

  // Dynamic instance rendering with wind sway and visible growth scaling
  function syncInstancedCropsDynamic(timeSec) {
    const counts = { wheat: 0, corn: 0, potato: 0, carrot: 0, sunflower: 0 };
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = grid[r][c];
        if (tile.crop && cropMeshes[tile.crop.type]) {
          const type = tile.crop.type;
          const idx = counts[type];
          counts[type]++;

          const wx = c * TILE_SIZE + TILE_SIZE / 2;
          const wz = r * TILE_SIZE + TILE_SIZE / 2;
          
          // Growth scale: starts at 0.35 (clearly visible sprout) up to 1.25 when mature
          const progress = tile.crop.progress || 0;
          const scale = Math.max(0.35, (progress / 100) * (tile.fertilized ? 1.25 : 1.05));

          const windSwayX = Math.sin(timeSec * 2.2 + wx * 0.25) * 0.08 * scale;
          const windSwayZ = Math.cos(timeSec * 1.8 + wz * 0.25) * 0.08 * scale;

          dummyPos.set(wx, 0.0, wz);
          dummyScale.set(scale, scale, scale);
          const euler = new THREE.Euler(windSwayX, (c * 17 + r * 31) % 6.28, windSwayZ, 'YXZ');
          dummyRot.setFromEuler(euler);
          dummyMat.compose(dummyPos, dummyRot, dummyScale);
          cropMeshes[type].setMatrixAt(idx, dummyMat);
        }
      }
    }
    for (const key in cropMeshes) {
      cropMeshes[key].count = counts[key];
      cropMeshes[key].instanceMatrix.needsUpdate = true;
    }
  }



  // --- DETAILED 3D FARMSTEAD BUILDINGS & SILOS ---
  const farmsteadGroup = new THREE.Group();
  scene.add(farmsteadGroup);

  let siloInstances = [];

  
  
  // --- IMPECCABLY ORGANIZED FARM YARD (NO CLIPPING!) ---
  let millBladesGroup = null;
  const cowMeshes = [];

  
  // --- REALISTIC GABLE ROOF BUILDER ---
  function createGableRoof(width, depth, height, roofMaterial, wallMaterial) {
    const group = new THREE.Group();
    const overhang = 0.4;
    const w = width + overhang * 2;
    const d = depth + overhang * 2;

    const roofThickness = 0.22;
    const halfW = w / 2;
    const slopeLen = Math.hypot(halfW, height) + 0.15;
    const angle = Math.atan2(height, halfW);

    // Left slope
    const slopeGeo = new THREE.BoxGeometry(slopeLen, roofThickness, d);
    const leftSlope = new THREE.Mesh(slopeGeo, roofMaterial);
    leftSlope.position.set(-halfW / 2, height / 2, 0);
    leftSlope.rotation.z = angle;
    leftSlope.castShadow = true;
    leftSlope.receiveShadow = true;
    group.add(leftSlope);

    // Right slope
    const rightSlope = new THREE.Mesh(slopeGeo, roofMaterial);
    rightSlope.position.set(halfW / 2, height / 2, 0);
    rightSlope.rotation.z = -angle;
    rightSlope.castShadow = true;
    rightSlope.receiveShadow = true;
    group.add(rightSlope);

    // Ridge cap along the top
    const ridgeGeo = new THREE.BoxGeometry(0.35, 0.28, d + 0.06);
    const ridge = new THREE.Mesh(ridgeGeo, materials.woodDark || roofMaterial);
    ridge.position.set(0, height + 0.08, 0);
    ridge.castShadow = true;
    group.add(ridge);

    // Triangular Gable Walls (Фронтоны) at front and back
    if (wallMaterial) {
      const gableShape = new THREE.Shape();
      gableShape.moveTo(-width / 2, 0);
      gableShape.lineTo(0, height * (width / w));
      gableShape.lineTo(width / 2, 0);
      gableShape.closePath();

      const frontGable = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), wallMaterial);
      frontGable.position.set(0, 0, depth / 2);
      group.add(frontGable);

      const backGable = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), wallMaterial);
      backGable.position.set(0, 0, -depth / 2);
      backGable.rotation.y = Math.PI;
      group.add(backGable);
    }

    return group;
  }

  // --- SOLID 3D COLLISION DETECTION SYSTEM ---
  const WORLD_OBSTACLES = [
    // Main Farmhouse Barn & Silo Complex (origin 10, 10 to 19.5, 10 - solid continuous block, no narrow trap cracks)
    { type: 'box', minX: 1.0, maxX: 22.8, minZ: 4.6, maxZ: 15.4, name: 'farmstead_complex' },

    // Scenic Windmill (origin 32, 12, stone base radius 4.8)
    { type: 'circle', x: 32.0, z: 12.0, radius: 4.8, name: 'windmill' },

    // Cow Pasture Shelter Shed (pasture origin 8, 32; shed local 0, -4.5, size 9 x 4.5)
    // world X: [3.5, 12.5], world Z: [25.25, 29.75]
    { type: 'box', minX: 3.4, maxX: 12.6, minZ: 25.1, maxZ: 29.8, name: 'cow_shed' },

    // Cow Pasture Solid Fences (world coordinates)
    // Left fence (x = 2.0, z: 27.5 to 37.5)
    { type: 'box', minX: 1.8, maxX: 2.2, minZ: 27.3, maxZ: 37.7, name: 'cow_fence_left' },

    // Right fence (x = 14.0, z: 27.5 to 37.5)
    { type: 'box', minX: 13.8, maxX: 14.2, minZ: 27.3, maxZ: 37.7, name: 'cow_fence_right' },

    // Back-left wing (x: 2.0 to 3.5, z = 27.5)
    { type: 'box', minX: 1.8, maxX: 3.5, minZ: 27.3, maxZ: 27.7, name: 'cow_fence_back_l' },

    // Back-right wing (x: 12.5 to 14.0, z = 27.5)
    { type: 'box', minX: 12.5, maxX: 14.2, minZ: 27.3, maxZ: 27.7, name: 'cow_fence_back_r' },

    // Front-left fence (x: 2.0 to 6.7, z = 37.5)
    { type: 'box', minX: 1.8, maxX: 6.7, minZ: 37.3, maxZ: 37.7, name: 'cow_fence_front_l' },

    // Front-right fence (x: 9.3 to 14.0, z = 37.5)
    // Note: Gate opening is between 6.7 and 9.3 (width 2.6m) - free passage for player!
    { type: 'box', minX: 9.3, maxX: 14.2, minZ: 37.3, maxZ: 37.7, name: 'cow_fence_front_r' },

    // Cow Feeding Trough inside pasture (world x: 8, z: 31, size 3.4 x 1.0)
    { type: 'box', minX: 6.3, maxX: 9.7, minZ: 30.5, maxZ: 31.5, name: 'cow_trough' }
  ];

  function checkWorldCollision(px, pz, radius = 0.45) {
    for (let i = 0; i < WORLD_OBSTACLES.length; i++) {
      const obs = WORLD_OBSTACLES[i];
      if (obs.type === 'box') {
        const closestX = Math.max(obs.minX, Math.min(px, obs.maxX));
        const closestZ = Math.max(obs.minZ, Math.min(pz, obs.maxZ));
        const dx = px - closestX;
        const dz = pz - closestZ;
        if (dx * dx + dz * dz < radius * radius) {
          return true;
        }
      } else if (obs.type === 'circle') {
        const dx = px - obs.x;
        const dz = pz - obs.z;
        const combinedRadius = radius + obs.radius;
        if (dx * dx + dz * dz < combinedRadius * combinedRadius) {
          return true;
        }
      }
    }
    return false;
  }

  // --- VEHICLE OBSTACLE AVOIDANCE & WAYPOINT NAVIGATION ---
  const NAV_ZONES = [
    // Farmstead corridor at x = 24.5 (avoids orchard at x=2, barn at x=10, silo at x=19.5, and windmill at x=32)
    { name: 'Farmstead', minX: 0.0, maxX: 22.5, minZ: 4.0, maxZ: 16.0, bypassX: 24.5 },
    // Cow Pasture bypass corridor along east fence at x = 16.5
    { name: 'CowPasture', minX: 0.0, maxX: 15.0, minZ: 25.0, maxZ: 38.5, bypassX: 16.5 },
    // Windmill corridor at x = 24.5
    { name: 'Windmill', minX: 26.5, maxX: 37.5, minZ: 6.5, maxZ: 17.5, bypassX: 24.5 }
  ];

  // Fast Liang-Barsky 2D line-box intersection test
  function lineIntersectsNavBox(x1, z1, x2, z2, box, pad = 0.8) {
    const minX = box.minX - pad, maxX = box.maxX + pad;
    const minZ = box.minZ - pad, maxZ = box.maxZ + pad;

    if (x1 >= minX && x1 <= maxX && z1 >= minZ && z1 <= maxZ) return true;
    if (x2 >= minX && x2 <= maxX && z2 >= minZ && z2 <= maxZ) return true;

    let t0 = 0, t1 = 1;
    const dx = x2 - x1, dz = z2 - z1;
    const checks = [
      { p: -dx, q: x1 - minX },
      { p: dx, q: maxX - x1 },
      { p: -dz, q: z1 - minZ },
      { p: dz, q: maxZ - z1 }
    ];
    for (const { p, q } of checks) {
      if (p === 0) {
        if (q < 0) return false;
      } else {
        const r = q / p;
        if (p < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
      }
    }
    return t0 <= t1;
  }

  // Computes direct route or clearance corridor waypoint around blocking buildings
  function getNavigationWaypoint(fromX, fromZ, toX, toZ) {
    for (let i = 0; i < NAV_ZONES.length; i++) {
      const zone = NAV_ZONES[i];
      if (lineIntersectsNavBox(fromX, fromZ, toX, toZ, zone, 1.2)) {
        const passX = zone.bypassX;
        const southZ = zone.maxZ + 2.6;
        const northZ = zone.minZ - 2.6;

        if (fromZ > zone.maxZ) {
          if (Math.hypot(passX - fromX, southZ - fromZ) > 2.2) {
            return { x: passX, z: southZ, isDirect: false };
          } else {
            return { x: passX, z: northZ, isDirect: false };
          }
        } else if (fromZ < zone.minZ) {
          if (Math.hypot(passX - fromX, northZ - fromZ) > 2.2) {
            return { x: passX, z: northZ, isDirect: false };
          } else {
            return { x: passX, z: southZ, isDirect: false };
          }
        } else {
          return { x: passX, z: fromZ, isDirect: false };
        }
      }
    }
    return { x: toX, z: toZ, isDirect: true };
  }

  function buildSpecialStructures() {
    // 1. WINDMILL: Positioned on open scenic hillock at (x: 32, z: 12)
    const millGroup = new THREE.Group();
    millGroup.position.set(32, 0, 12);

    const stoneBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.8, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.9 })
    );
    stoneBase.position.y = 6;
    stoneBase.castShadow = true;
    stoneBase.receiveShadow = true;
    millGroup.add(stoneBase);

    const millRoof = new THREE.Mesh(
      new THREE.ConeGeometry(4.0, 3.8, 8),
      materials.roofTile
    );
    millRoof.position.y = 12 + 1.9;
    millRoof.castShadow = true;
    millGroup.add(millRoof);

    // Mill Blades Axle & 4 Sails
    millBladesGroup = new THREE.Group();
    millBladesGroup.position.set(0, 12, 3.8);

    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.2, 8), materials.woodDark);
    axle.rotation.x = Math.PI / 2;
    millBladesGroup.add(axle);

    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Group();
      arm.rotation.z = (i * Math.PI) / 2;

      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.2, 0.12), materials.woodDark);
      beam.position.y = 3.1;
      beam.castShadow = true;
      arm.add(beam);

      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 4.4, 0.04), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 }));
      sail.position.set(0.48, 3.5, 0.05);
      sail.castShadow = true;
      arm.add(sail);

      millBladesGroup.add(arm);
    }
    millGroup.add(millBladesGroup);

    const millTag = createTextSprite('🏭 Мельница (Клик)');
    millTag.position.set(0, 16.5, 0);
    millGroup.add(millTag);

    scene.add(millGroup);

    // 2. COW PASTURE: Clean square 14x14m enclosure at (x: 8, z: 32)
    const pastureGroup = new THREE.Group();
    pastureGroup.position.set(8, 0, 32);

    // Open Wooden Shelter at back
    const shed = new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 4.5), materials.redBarn);
    shed.position.set(0, 2.25, -4.5);
    shed.castShadow = true;
    pastureGroup.add(shed);

    const shedRoof = createGableRoof(9, 4.5, 2.4, materials.roofTile, materials.redBarn);
    shedRoof.position.set(0, 4.5, -4.5);
    pastureGroup.add(shedRoof);

    // Complete Fences around pasture & Feeding Troughs
    const fenceMat = materials.wood;
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8);

    // Feeding Trough with fresh golden hay
    const troughGroup = new THREE.Group();
    troughGroup.position.set(0, 0, -1.0);
    const troughBox = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.6, 1.0), materials.woodDark);
    troughBox.position.y = 0.3;
    troughBox.castShadow = true;
    troughGroup.add(troughBox);
    const hayMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 0.8), new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.9 }));
    hayMesh.position.y = 0.48;
    troughGroup.add(hayMesh);
    pastureGroup.add(troughGroup);

    // Water Trough with fresh water
    const waterTrough = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 1.0), materials.woodDark);
    waterTrough.position.set(-4.5, 0.25, 2.8);
    waterTrough.castShadow = true;
    pastureGroup.add(waterTrough);
    const waterSurface = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.8), materials.water);
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.set(-4.5, 0.45, 2.8);
    pastureGroup.add(waterSurface);

    function buildFenceSpan(x1, z1, x2, z2, postSpacing = 2.5) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const spans = Math.max(1, Math.round(len / postSpacing));
      const spanLen = len / spans;
      const railGeo = new THREE.BoxGeometry(0.09, 0.12, spanLen + 0.05);

      for (let i = 0; i <= spans; i++) {
        const t = i / spans;
        const post = new THREE.Mesh(postGeo, fenceMat);
        post.position.set(x1 + dx * t, 0.7, z1 + dz * t);
        post.castShadow = true;
        post.receiveShadow = true;
        pastureGroup.add(post);
      }

      for (let i = 0; i < spans; i++) {
        const t = (i + 0.5) / spans;
        const rx = x1 + dx * t;
        const rz = z1 + dz * t;

        const railTop = new THREE.Mesh(railGeo, fenceMat);
        railTop.position.set(rx, 0.95, rz);
        railTop.rotation.y = angle;
        railTop.castShadow = true;
        pastureGroup.add(railTop);

        const railBot = new THREE.Mesh(railGeo, fenceMat);
        railBot.position.set(rx, 0.48, rz);
        railBot.rotation.y = angle;
        railBot.castShadow = true;
        pastureGroup.add(railBot);
      }
    }

    // 1. Left fence line (from z = -4.5 to z = 5.5 at x = -6.0)
    buildFenceSpan(-6.0, -4.5, -6.0, 5.5, 2.5);

    // 2. Right fence line (from z = -4.5 to z = 5.5 at x = 6.0)
    buildFenceSpan(6.0, -4.5, 6.0, 5.5, 2.5);

    // 3. Back-left connector (from left fence to shed wall at z = -4.5)
    buildFenceSpan(-6.0, -4.5, -4.5, -4.5, 1.5);

    // 4. Back-right connector (from shed wall to right fence at z = -4.5)
    buildFenceSpan(4.5, -4.5, 6.0, -4.5, 1.5);

    // 5. Front-left fence line (from x = -6.0 to gatepost at x = -1.3, z = 5.5)
    buildFenceSpan(-6.0, 5.5, -1.3, 5.5, 2.35);

    // 6. Front-right fence line (from gatepost at x = 1.3 to x = 6.0, z = 5.5)
    buildFenceSpan(1.3, 5.5, 6.0, 5.5, 2.35);

    // 7. Gate at entrance (between x = -1.3 and x = 1.3 at z = 5.5)
    const gatePostGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.6, 8);
    const gateCapGeo = new THREE.ConeGeometry(0.2, 0.22, 8);
    [-1.3, 1.3].forEach(gx => {
      const gPost = new THREE.Mesh(gatePostGeo, materials.woodDark);
      gPost.position.set(gx, 0.8, 5.5);
      gPost.castShadow = true;
      pastureGroup.add(gPost);

      const cap = new THREE.Mesh(gateCapGeo, materials.rubber);
      cap.position.set(gx, 1.65, 5.5);
      pastureGroup.add(cap);
    });

    // Open wooden farm gate hinged at left post (-1.3, 5.5), swinging outward into farmyard ~38 deg
    const gateGroup = new THREE.Group();
    gateGroup.position.set(-1.3, 0, 5.5);
    gateGroup.rotation.y = -0.65;

    const gateRailGeo = new THREE.BoxGeometry(2.3, 0.1, 0.08);
    const gateTopRail = new THREE.Mesh(gateRailGeo, fenceMat);
    gateTopRail.position.set(1.15, 0.95, 0);
    gateTopRail.castShadow = true;
    gateGroup.add(gateTopRail);

    const gateBotRail = new THREE.Mesh(gateRailGeo, fenceMat);
    gateBotRail.position.set(1.15, 0.48, 0);
    gateBotRail.castShadow = true;
    gateGroup.add(gateBotRail);

    const gateEndPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), fenceMat);
    gateEndPost.position.set(2.25, 0.7, 0);
    gateGroup.add(gateEndPost);

    // Diagonal Z brace
    const gateBrace = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 0.06), fenceMat);
    gateBrace.position.set(1.15, 0.71, 0.02);
    gateBrace.rotation.z = 0.21;
    gateGroup.add(gateBrace);

    // Iron hinge straps
    [0.95, 0.48].forEach(hy => {
      const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.1), materials.rubber);
      hinge.position.set(0.2, hy, 0);
      gateGroup.add(hinge);
    });

    pastureGroup.add(gateGroup);

    // 3 Animated Cows
    const cowSpotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const cowBlackMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.8 });
    const cowPinkMat = new THREE.MeshStandardMaterial({ color: 0xffab91, roughness: 0.6 });

    for (let c = 0; c < 3; c++) {
      const cow = new THREE.Group();
      cow.position.set(-3.5 + c * 3.5, 0, 1.2 + (c % 2) * 1.5);
      cow.rotation.y = -0.3 + c * 0.8;

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 2.1), cowSpotMat);
      body.position.y = 1.15;
      body.castShadow = true;
      cow.add(body);

      const spot = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.8), cowBlackMat);
      spot.position.set(0.35, 1.2, 0.2);
      cow.add(spot);

      const legGeo = new THREE.BoxGeometry(0.22, 0.85, 0.22);
      [[-0.45, 0.42, -0.75], [0.45, 0.42, -0.75], [-0.45, 0.42, 0.75], [0.45, 0.42, 0.75]].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, cowBlackMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        cow.add(leg);
      });

      const cowHeadGroup = new THREE.Group();
      cowHeadGroup.position.set(0, 1.45, 1.1);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.75), cowSpotMat);
      head.position.set(0, 0, 0.25);
      head.castShadow = true;
      cowHeadGroup.add(head);

      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.28), cowPinkMat);
      muzzle.position.set(0, -0.15, 0.7);
      cowHeadGroup.add(muzzle);

      const hornGeo = new THREE.ConeGeometry(0.08, 0.3, 5);
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
      const hL = new THREE.Mesh(hornGeo, hornMat); hL.position.set(-0.28, 0.35, 0.15); hL.rotation.z = -0.4; cowHeadGroup.add(hL);
      const hR = new THREE.Mesh(hornGeo, hornMat); hR.position.set(0.28, 0.35, 0.15); hR.rotation.z = 0.4; cowHeadGroup.add(hR);

      cow.add(cowHeadGroup);
      cow.headGroup = cowHeadGroup;

      pastureGroup.add(cow);
      cowMeshes.push(cow);
    }

    const cowTag = createTextSprite('🐄 Коровник (Клик)');
    cowTag.position.set(0, 6.2, 0);
    pastureGroup.add(cowTag);

    scene.add(pastureGroup);
  }


  // --- FRIEND'S FARMSTEAD 3D ARCHITECTURE (OPPOSITE END OF MAP - PLOT 8) ---
  const friendFarmsteadGroup = new THREE.Group();
  scene.add(friendFarmsteadGroup);

  function buildFriendFarmstead() {
    while (friendFarmsteadGroup.children.length > 0) {
      friendFarmsteadGroup.remove(friendFarmsteadGroup.children[0]);
    }

    const originX = 122;
    const originZ = 122;
    const barnW = 12;
    const barnH = 7.5;
    const barnD = 8.5;

    // 1. Friend's Blue Farmhouse Barn
    const barnBody = new THREE.Mesh(new THREE.BoxGeometry(barnW, barnH, barnD), materials.blueBarn);
    barnBody.position.set(originX, barnH / 2, originZ);
    barnBody.castShadow = true;
    barnBody.receiveShadow = true;
    friendFarmsteadGroup.add(barnBody);

    const roofH = 3.8;
    const barnRoof = createGableRoof(barnW, barnD, roofH, materials.roofTile, materials.blueBarn);
    barnRoof.position.set(originX, barnH, originZ);
    friendFarmsteadGroup.add(barnRoof);

    // Door & Warm Windows
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.5, 0.3), materials.woodDark);
    door.position.set(originX, 2.25, originZ + barnD / 2 + 0.15);
    friendFarmsteadGroup.add(door);

    const winGeo = new THREE.BoxGeometry(1.6, 1.6, 0.15);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
    const winL = new THREE.Mesh(winGeo, winMat);
    winL.position.set(originX - 3.5, 4.5, originZ + barnD / 2 + 0.1);
    friendFarmsteadGroup.add(winL);
    const winR = new THREE.Mesh(winGeo, winMat);
    winR.position.set(originX + 3.5, 4.5, originZ + barnD / 2 + 0.1);
    friendFarmsteadGroup.add(winR);

    // 2. Friend's Grain Silo with Cyan Beacon
    const siloRadius = 2.2;
    const siloH = 13;
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(siloRadius, siloRadius, siloH, 16), materials.cyanSilo);
    silo.position.set(originX + barnW / 2 + 3.5, siloH / 2, originZ);
    silo.castShadow = true;
    silo.receiveShadow = true;
    friendFarmsteadGroup.add(silo);

    const dome = new THREE.Mesh(new THREE.ConeGeometry(siloRadius * 1.05, 3.0, 16), materials.cyanSilo);
    dome.position.set(originX + barnW / 2 + 3.5, siloH + 1.5, originZ);
    dome.castShadow = true;
    friendFarmsteadGroup.add(dome);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    beacon.position.set(originX + barnW / 2 + 3.5, siloH + 3.2, originZ);
    friendFarmsteadGroup.add(beacon);

    // 3. Friend's Orchard Tree
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4.0, 8), materials.woodDark);
    trunk.position.set(originX - barnW / 2 - 2.5, 2.0, originZ);
    trunk.castShadow = true;
    friendFarmsteadGroup.add(trunk);

    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(3.4, 1), new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.8 }));
    foliage.position.set(originX - barnW / 2 - 2.5, 5.5, originZ);
    foliage.castShadow = true;
    friendFarmsteadGroup.add(foliage);

    // 4. 3D Billboard Sign: "Ферма Друга"
    const signSprite = createTextSprite('🏡 Ферма Друга (Участок №8)');
    signSprite.position.set(originX, 3.4, originZ + barnD / 2 + 3.5);
    signSprite.scale.set(5.5, 1.3, 1);
    friendFarmsteadGroup.add(signSprite);

    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.8, 8), materials.woodDark);
    signPost.position.set(originX, 1.4, originZ + barnD / 2 + 3.5);
    friendFarmsteadGroup.add(signPost);

    // 5. Solid Colliders for Friend's Buildings
    WORLD_OBSTACLES.push({
      type: 'box',
      minX: originX - barnW / 2 - 4.5,
      maxX: originX + barnW / 2 + 6.0,
      minZ: originZ - barnD / 2 - 1.0,
      maxZ: originZ + barnD / 2 + 1.0,
      name: 'friend_farmstead_complex'
    });
  }

  function buildFarmstead() {
    while (farmsteadGroup.children.length > 0) {
      farmsteadGroup.remove(farmsteadGroup.children[0]);
    }
    siloInstances = [];

    // Main Farmhouse: Positioned at (x: 10, z: 10)
    const originX = 10;
    const originZ = 10;
    const barnW = 12;
    const barnH = 7.5;
    const barnD = 8.5;

    const barnBody = new THREE.Mesh(new THREE.BoxGeometry(barnW, barnH, barnD), materials.redBarn);
    barnBody.position.set(originX, barnH / 2, originZ);
    barnBody.castShadow = true;
    barnBody.receiveShadow = true;
    farmsteadGroup.add(barnBody);

    const roofH = 3.8;
    const barnRoof = createGableRoof(barnW, barnD, roofH, materials.roofTile, materials.redBarn);
    barnRoof.position.set(originX, barnH, originZ);
    farmsteadGroup.add(barnRoof);

    // Timber Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.5, 0.3), materials.woodDark);
    door.position.set(originX, 2.25, originZ + barnD / 2 + 0.15);
    farmsteadGroup.add(door);

    // Warm Windows
    const winGeo = new THREE.BoxGeometry(1.6, 1.6, 0.15);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const winL = new THREE.Mesh(winGeo, winMat);
    winL.position.set(originX - 3.5, 4.5, originZ + barnD / 2 + 0.1);
    farmsteadGroup.add(winL);
    const winR = new THREE.Mesh(winGeo, winMat);
    winR.position.set(originX + 3.5, 4.5, originZ + barnD / 2 + 0.1);
    farmsteadGroup.add(winR);

    // Silo: Positioned next to barn at (x: 20, z: 10)
    const siloRadius = 2.2;
    const siloH = 13;
    const siloBodyGeo = new THREE.CylinderGeometry(siloRadius, siloRadius, siloH, 16);
    const siloRoofGeo = new THREE.ConeGeometry(siloRadius * 1.05, 3.0, 16);

    const silo = new THREE.Mesh(siloBodyGeo, materials.siloMetal);
    silo.position.set(originX + barnW / 2 + 3.5, siloH / 2, originZ);
    silo.castShadow = true;
    silo.receiveShadow = true;
    farmsteadGroup.add(silo);

    const dome = new THREE.Mesh(siloRoofGeo, materials.siloMetal);
    dome.position.set(originX + barnW / 2 + 3.5, siloH + 1.5, originZ);
    dome.castShadow = true;
    farmsteadGroup.add(dome);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
    beacon.position.set(originX + barnW / 2 + 3.5, siloH + 3.2, originZ);
    farmsteadGroup.add(beacon);
    siloInstances.push(beacon);

    // Apple Orchard Tree: Positioned safely at (x: 2, z: 10) in garden
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4.0, 8), materials.woodDark);
    trunk.position.set(2, 2.0, 10);
    trunk.castShadow = true;
    farmsteadGroup.add(trunk);

    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(3.4, 1), new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 }));
    foliage.position.set(2, 5.5, 10);
    foliage.castShadow = true;
    farmsteadGroup.add(foliage);
  }



  // --- 3D VEHICLES ENGINE & PROCEDURAL MODELS ---
  const VEHICLE_TYPES = {
    tractor: {
      type: 'tractor',
      name: 'Трактор AgroTrac-80',
      icon: '🚜',
      cost: 1200,
      color: 0x27ae60,
      speed: 12.5,
      turnSpeed: 2.4,
      action: 'plow',
      desc: 'Вспахивает и рыхлит землю полосами 3x3 метра.'
    },
    combine: {
      type: 'combine',
      name: 'Комбайн Harvester Titan',
      icon: '🌾',
      cost: 2800,
      color: 0xc0392b,
      speed: 10.0,
      turnSpeed: 1.9,
      action: 'harvest',
      desc: 'Скашивает спелый урожай крутящейся жаткой, собирая зерно в элеватор.'
    },
    sprayer: {
      type: 'sprayer',
      name: 'Опрыскиватель RainMaker',
      icon: '💧',
      cost: 1800,
      color: 0x1976d2,
      speed: 13.5,
      turnSpeed: 2.2,
      action: 'water',
      desc: 'Мгновенно поливает и удобряет ряды полей.'
    }
  };

  const ownedVehicles = [];

  class Vehicle3D {
    constructor(def, wx, wz) {
      this.def = def;
      this.x = wx;
      this.z = wz;
      this.y = 0;
      this.angle = 0; // heading in radians
      this.speed = 0;
      this.autoWorker = false;
      this.targetTile = null;
      this.statusText = 'Готов к работе';
      this.reelMesh = null;
      this.wheels = [];

      this.group = new THREE.Group();
      this.buildModel();
      this.group.position.set(this.x, 0, this.z);
      scene.add(this.group);
    }

    buildModel() {
      const col = this.def.color;
      const bodyMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.5 });

      // Chassis
      const chassisGeo = new THREE.BoxGeometry(2.4, 0.8, 4.4);
      const chassis = new THREE.Mesh(chassisGeo, bodyMat);
      chassis.position.set(0, 1.2, 0);
      chassis.castShadow = true;
      this.group.add(chassis);

      // Cabin Glass
      const cabGeo = new THREE.BoxGeometry(2.0, 1.8, 2.0);
      const cab = new THREE.Mesh(cabGeo, materials.glass);
      cab.position.set(0, 2.4, -0.4);
      cab.castShadow = true;
      this.group.add(cab);

      // Cabin Roof
      const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 2.2), bodyMat);
      cabRoof.position.set(0, 3.35, -0.4);
      cabRoof.castShadow = true;
      this.group.add(cabRoof);

      // Engine Hood
      const hoodGeo = new THREE.BoxGeometry(1.8, 1.2, 1.8);
      const hood = new THREE.Mesh(hoodGeo, bodyMat);
      hood.position.set(0, 1.8, 1.3);
      hood.castShadow = true;
      this.group.add(hood);

      // Exhaust pipe
      const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8);
      const exhaust = new THREE.Mesh(exhaustGeo, materials.rubber);
      exhaust.position.set(0.7, 2.8, 0.7);
      this.group.add(exhaust);

      // Wheels
      const makeWheel = (wx, wy, wz, radius, width) => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(wx, wy, wz);

        const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
        tireGeo.rotateZ(Math.PI / 2);
        const tire = new THREE.Mesh(tireGeo, materials.rubber);
        tire.castShadow = true;
        wheelGroup.add(tire);

        const rimGeo = new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width + 0.05, 12);
        rimGeo.rotateZ(Math.PI / 2);
        const rim = new THREE.Mesh(rimGeo, materials.yellowRim);
        wheelGroup.add(rim);

        this.group.add(wheelGroup);
        this.wheels.push(wheelGroup);
        return wheelGroup;
      };

      // Rear big wheels, Front steering wheels
      makeWheel(-1.4, 1.1, -1.2, 1.1, 0.7);
      makeWheel(1.4, 1.1, -1.2, 1.1, 0.7);
      makeWheel(-1.3, 0.8, 1.3, 0.8, 0.55);
      makeWheel(1.3, 0.8, 1.3, 0.8, 0.55);

      // Dual Working Spotlights (Headlights with real-time illumination)
      const headlightLeft = new THREE.SpotLight(0xfffaed, 2.5, 38, Math.PI / 5, 0.35, 1.0);
      headlightLeft.position.set(-0.7, 1.8, 2.3);
      headlightLeft.target.position.set(-0.7, 0, 18);
      this.group.add(headlightLeft);
      this.group.add(headlightLeft.target);

      const headlightRight = new THREE.SpotLight(0xfffaed, 2.5, 38, Math.PI / 5, 0.35, 1.0);
      headlightRight.position.set(0.7, 1.8, 2.3);
      headlightRight.target.position.set(0.7, 0, 18);
      this.group.add(headlightRight);
      this.group.add(headlightRight.target);

      // Tool Implement Attachments
      if (this.def.action === 'plow') {
        // Steel rear plowshares
        const plowFrameGeo = new THREE.BoxGeometry(3.0, 0.3, 1.2);
        const plowFrame = new THREE.Mesh(plowFrameGeo, materials.steelPlow);
        plowFrame.position.set(0, 0.5, -2.6);
        plowFrame.castShadow = true;
        this.group.add(plowFrame);

        for (let p = -1; p <= 1; p++) {
          const share = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 4), materials.steelPlow);
          share.rotation.x = Math.PI / 3;
          share.position.set(p * 1.1, 0.3, -2.8);
          share.castShadow = true;
          this.group.add(share);
        }
      } else if (this.def.action === 'harvest') {
        // Broad Front Combine Header with spinning reel
        const headerGeo = new THREE.BoxGeometry(4.2, 0.6, 1.2);
        const header = new THREE.Mesh(headerGeo, bodyMat);
        header.position.set(0, 0.7, 2.6);
        header.castShadow = true;
        this.group.add(header);

        // Reel cylinder
        const reelGeo = new THREE.CylinderGeometry(0.55, 0.55, 4.0, 8, 1, true);
        reelGeo.rotateZ(Math.PI / 2);
        this.reelMesh = new THREE.Mesh(reelGeo, materials.yellowRim);
        this.reelMesh.position.set(0, 0.9, 2.9);
        this.group.add(this.reelMesh);
      } else if (this.def.action === 'water') {
        // Wide Boom Arms for spraying
        const boomGeo = new THREE.BoxGeometry(7.5, 0.2, 0.2);
        const boom = new THREE.Mesh(boomGeo, materials.rubber);
        boom.position.set(0, 1.4, -2.4);
        boom.castShadow = true;
        this.group.add(boom);
      }
    }

    update(dt) {
      if (this === farm.drivingVehicle) {
        // Manual driving controls
        let forward = 0;
        let turn = 0;
        if (keys['w'] || keys['keyw'] || keys['ц'] || keys['arrowup']) forward += 1;
        if (keys['s'] || keys['keys'] || keys['ы'] || keys['arrowdown']) forward -= 1;
        if (keys['a'] || keys['keya'] || keys['ф'] || keys['arrowleft']) turn += 1; // Steer Left on screen
        if (keys['d'] || keys['keyd'] || keys['в'] || keys['arrowright']) turn -= 1; // Steer Right on screen

        if (touchInput.active) {
          forward += touchInput.moveZ;
          turn -= touchInput.moveX;
        }
        forward = Math.max(-1, Math.min(1, forward));
        turn = Math.max(-1, Math.min(1, turn));

        this.angle += turn * this.def.turnSpeed * dt;

        const targetSpeed = forward * this.def.speed;
        this.speed += (targetSpeed - this.speed) * 4.5 * dt;

        const stepX = Math.sin(this.angle) * this.speed * dt;
        const stepZ = Math.cos(this.angle) * this.speed * dt;

        // Strict boundary: vehicle only moves on owned land plots and clear of solid obstacles
        const vRadius = 1.3;
        let movedX = false;
        let movedZ = false;

        if (isPositionOnOwnedPlot(this.x + stepX, this.z) && !checkWorldCollision(this.x + stepX, this.z, vRadius)) {
          this.x += stepX;
          movedX = true;
        }
        if (isPositionOnOwnedPlot(this.x, this.z + stepZ) && !checkWorldCollision(this.x, this.z + stepZ, vRadius)) {
          this.z += stepZ;
          movedZ = true;
        }

        // Smooth deceleration on direct collision into a building or fence
        if (!movedX && !movedZ && Math.abs(this.speed) > 0.4) {
          this.speed *= 0.15;
        }

        // Burn fuel when moving
        if (Math.abs(this.speed) > 0.5) {
          this.fuel = Math.max(0, this.fuel - dt * 0.9);
          const fuelEl = document.getElementById('driving-vehicle-fuel');
          if (fuelEl) {
            fuelEl.innerText = Math.round(this.fuel) + '%';
            fuelEl.style.color = this.fuel > 25 ? '#ffd54f' : '#f44336';
          }

          // Wheel dust FX
          this.dustTimer += dt;
          if (this.dustTimer > 0.12) {
            this.dustTimer = 0;
            const rearX = this.x - Math.sin(this.angle) * 1.8;
            const rearZ = this.z - Math.cos(this.angle) * 1.8;
            spawn3DParticles(rearX, 0.3, rearZ, 0x8d6e63, 2);
          }
        }

        this.applyFieldAction();
      } else if (this.autoWorker) {
        this.updateAutoDrive(dt);
      }

      // Rotate wheels & reel if moving
      if (Math.abs(this.speed) > 0.1) {
        const wheelRot = (this.speed / 1.0) * dt;
        this.wheels.forEach(w => w.rotation.x += wheelRot);
        if (this.reelMesh) this.reelMesh.rotation.x += wheelRot * 2;
      }

      this.group.position.set(this.x, 0, this.z);
      this.group.rotation.y = this.angle;
    }

    updateAutoDrive(dt) {
      if (this.def.action === 'plow') {
        let bestTile = null;
        let minDist = Infinity;

        if (this.targetTile && isTileOwned(this.targetTile.c, this.targetTile.r) && this.targetTile.soil === 'grass') {
          bestTile = this.targetTile;
        } else {
          for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
              const t = grid[r][c];
              if (isTileOwned(c, r) && t.farmable !== false && t.soil === 'grass' && !checkWorldCollision(c * TILE_SIZE + 1.5, r * TILE_SIZE + 1.5, 1.4)) {
                const dist = Math.hypot((c * TILE_SIZE + 1.5) - this.x, (r * TILE_SIZE + 1.5) - this.z);
                if (dist < minDist) {
                  minDist = dist;
                  bestTile = t;
                }
              }
            }
          }
          this.targetTile = bestTile;
        }

        if (!bestTile) {
          this.statusText = 'Все земли вспаханы (Ожидание)';
          this.speed = 0;
          return;
        }

        this.statusText = 'Вспашка целины';
        this.steerAndDriveTowards(bestTile.c * TILE_SIZE + 1.5, bestTile.r * TILE_SIZE + 1.5, dt);
        this.applyFieldAction();
      } else if (this.def.action === 'harvest') {
        let bestTile = null;
        let minDist = Infinity;

        if (this.targetTile && isTileOwned(this.targetTile.c, this.targetTile.r) && this.targetTile.crop && this.targetTile.crop.mature) {
          bestTile = this.targetTile;
        } else {
          for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
              const t = grid[r][c];
              if (isTileOwned(c, r) && t.farmable !== false && t.crop && t.crop.mature && !checkWorldCollision(c * TILE_SIZE + 1.5, r * TILE_SIZE + 1.5, 1.4)) {
                const dist = Math.hypot((c * TILE_SIZE + 1.5) - this.x, (r * TILE_SIZE + 1.5) - this.z);
                if (dist < minDist) {
                  minDist = dist;
                  bestTile = t;
                }
              }
            }
          }
          this.targetTile = bestTile;
        }

        if (!bestTile) {
          this.statusText = 'Ждет созревания урожая...';
          this.speed = 0;
          return;
        }

        this.statusText = 'Жатва спелого урожая';
        this.steerAndDriveTowards(bestTile.c * TILE_SIZE + 1.5, bestTile.r * TILE_SIZE + 1.5, dt);
        this.applyFieldAction();
      } else if (this.def.action === 'water') {
        let bestTile = null;
        let minDist = Infinity;

        if (this.targetTile && isTileOwned(this.targetTile.c, this.targetTile.r) && this.targetTile.crop && this.targetTile.moisture < 30) {
          bestTile = this.targetTile;
        } else {
          for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
              const t = grid[r][c];
              if (isTileOwned(c, r) && t.farmable !== false && t.crop && t.moisture < 30 && !checkWorldCollision(c * TILE_SIZE + 1.5, r * TILE_SIZE + 1.5, 1.4)) {
                const dist = Math.hypot((c * TILE_SIZE + 1.5) - this.x, (r * TILE_SIZE + 1.5) - this.z);
                if (dist < minDist) {
                  minDist = dist;
                  bestTile = t;
                }
              }
            }
          }
          this.targetTile = bestTile;
        }

        if (!bestTile) {
          this.statusText = 'Все посевы увлажнены';
          this.speed = 0;
          return;
        }

        this.statusText = 'Опрыскивание полей';
        this.steerAndDriveTowards(bestTile.c * TILE_SIZE + 1.5, bestTile.r * TILE_SIZE + 1.5, dt);
        this.applyFieldAction();
      }
    }

    steerAndDriveTowards(tx, tz, dt) {
      // 1. Calculate waypoint avoiding building zones
      const nav = getNavigationWaypoint(this.x, this.z, tx, tz);
      const targetX = nav.x;
      const targetZ = nav.z;

      // 2. Base steering towards current waypoint / target
      let targetAngle = Math.atan2(targetX - this.x, targetZ - this.z);

      // 3. Dynamic Whiskers (Feeler ray probes) for immediate local obstacle avoidance
      const probeDist = 3.8;
      const centerHit = checkWorldCollision(this.x + Math.sin(this.angle) * probeDist, this.z + Math.cos(this.angle) * probeDist, 1.1);

      if (centerHit) {
        const leftAngle = this.angle + 0.65;
        const rightAngle = this.angle - 0.65;
        const leftHit = checkWorldCollision(this.x + Math.sin(leftAngle) * 3.2, this.z + Math.cos(leftAngle) * 3.2, 1.0);
        const rightHit = checkWorldCollision(this.x + Math.sin(rightAngle) * 3.2, this.z + Math.cos(rightAngle) * 3.2, 1.0);

        if (!leftHit && rightHit) {
          targetAngle = this.angle + 1.2;
        } else if (!rightHit && leftHit) {
          targetAngle = this.angle - 1.2;
        } else if (leftHit && rightHit) {
          targetAngle = this.angle + Math.PI * 0.75; // Turn around
        }
      }

      let diff = targetAngle - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.def.turnSpeed * 1.25 * dt);

      // Speed modulation: slow down in tight turns or near obstacles
      const turnSlowdown = Math.max(0.4, 1.0 - Math.abs(diff) * 0.45);
      const probeSlowdown = centerHit ? 0.45 : 1.0;
      this.speed = this.def.speed * 0.85 * turnSlowdown * probeSlowdown;

      const stepX = Math.sin(this.angle) * this.speed * dt;
      const stepZ = Math.cos(this.angle) * this.speed * dt;

      const vRadius = 1.2;
      let movedX = false;
      let movedZ = false;

      if (isPositionOnOwnedPlot(this.x + stepX, this.z) && !checkWorldCollision(this.x + stepX, this.z, vRadius)) {
        this.x += stepX;
        movedX = true;
      }
      if (isPositionOnOwnedPlot(this.x, this.z + stepZ) && !checkWorldCollision(this.x, this.z + stepZ, vRadius)) {
        this.z += stepZ;
        movedZ = true;
      }

      // Stuck detection and automatic reverse-turn maneuver
      if (!movedX && !movedZ) {
        this.stuckTimer = (this.stuckTimer || 0) + dt;
        if (this.stuckTimer > 0.4) {
          this.speed = -this.def.speed * 0.45;
          this.angle += 2.2 * dt;
          const revX = Math.sin(this.angle) * this.speed * dt;
          const revZ = Math.cos(this.angle) * this.speed * dt;
          if (isPositionOnOwnedPlot(this.x + revX, this.z + revZ) && !checkWorldCollision(this.x + revX, this.z + revZ, 1.0)) {
            this.x += revX;
            this.z += revZ;
          }
          if (this.stuckTimer > 1.4) {
            this.stuckTimer = 0;
            this.targetTile = null;
          }
        }
      } else {
        this.stuckTimer = 0;
      }
    }

    applyFieldAction() {
      const centerC = Math.floor(this.x / TILE_SIZE);
      const centerR = Math.floor(this.z / TILE_SIZE);

      for (let ro = -1; ro <= 1; ro++) {
        for (let co = -1; co <= 1; co++) {
          const c = centerC + co;
          const r = centerR + ro;
          if (isTileOwned(c, r)) {
            const tile = grid[r][c];
            if (this.def.action === 'plow' && tile.farmable !== false && tile.soil === 'grass') {
              tile.soil = 'tilled';
              updateTileAppearance(c, r);
              spawn3DParticles(c * TILE_SIZE + 1.5, 0.4, r * TILE_SIZE + 1.5, 0x6d4c41, 4);
            } else if (this.def.action === 'harvest' && tile.crop && tile.crop.mature) {
              harvestTile(tile);
            } else if (this.def.action === 'water' && tile.soil === 'tilled') {
              tile.moisture = 100;
              tile.fertilized = true;
              updateTileAppearance(c, r);
            }
          }
        }
      }
    }
  }


  
  // --- 3D INTERACTIVE PLAYER FARMER AVATAR ("ЧЕЛОВЕЧЕК") ---
  function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');
    
    // Bubble background
    ctx.fillStyle = 'rgba(20, 30, 45, 0.85)';
    if (ctx.roundRect) ctx.roundRect(10, 8, 280, 54, 16);
    else ctx.rect(10, 8, 280, 54);
    ctx.fill();
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 150, 35);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.2, 0.75, 1);
    return sprite;
  }


  // --- REMOTE PLAYER FARMER AVATAR (FRIEND 3D CHARACTER) ---
  class RemotePlayerFarmer3D {
    constructor(x = 122, z = 135) {
      this.x = x;
      this.z = z;
      this.y = 0;
      this.angle = Math.PI;
      this.targetX = x;
      this.targetZ = z;
      this.targetY = 0;
      this.targetAngle = Math.PI;
      this.walkAnimTime = 0;
      this.isWalking = false;
      this.isShift = false;
      this.isSwinging = false;
      this.swingTime = 0;
      this.activeTool = 'hoe';
      this.isDriving = false;

      this.group = new THREE.Group();
      this.group.name = 'remoteFarmerGroup';

      this.buildModel();
      this.buildOverheadUI();
      this.buildTractorModel();

      this.group.position.set(this.x, 0, this.z);
      scene.add(this.group);
    }

    buildModel() {
      const matBoots = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.9 });
      const matSkin = new THREE.MeshStandardMaterial({ color: 0xffcc80, roughness: 0.6 });
      const matOveralls = new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.8 });
      const matShirt = materials.friendShirt;
      const matCap = materials.friendCap;

      this.charMeshGroup = new THREE.Group();

      // Legs
      this.leftHip = new THREE.Group();
      this.leftHip.position.set(-0.2, 0.85, 0);
      const legGeo = new THREE.BoxGeometry(0.24, 0.72, 0.24);
      legGeo.translate(0, -0.36, 0);
      const leftLeg = new THREE.Mesh(legGeo, matOveralls);
      leftLeg.castShadow = true;
      this.leftHip.add(leftLeg);
      const bootGeo = new THREE.BoxGeometry(0.26, 0.22, 0.38);
      bootGeo.translate(0, -0.68, 0.06);
      this.leftHip.add(new THREE.Mesh(bootGeo, matBoots));
      this.charMeshGroup.add(this.leftHip);

      this.rightHip = new THREE.Group();
      this.rightHip.position.set(0.2, 0.85, 0);
      const rightLeg = new THREE.Mesh(legGeo, matOveralls);
      rightLeg.castShadow = true;
      this.rightHip.add(rightLeg);
      this.rightHip.add(new THREE.Mesh(bootGeo, matBoots));
      this.charMeshGroup.add(this.rightHip);

      // Torso
      this.torso = new THREE.Group();
      this.torso.position.set(0, 0.85, 0);
      const shirtGeo = new THREE.BoxGeometry(0.7, 0.76, 0.4);
      shirtGeo.translate(0, 0.5, 0);
      const shirt = new THREE.Mesh(shirtGeo, matShirt);
      shirt.castShadow = true;
      this.torso.add(shirt);

      const overallsFront = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.42), matOveralls);
      overallsFront.position.set(0, 0.45, 0);
      this.torso.add(overallsFront);
      this.charMeshGroup.add(this.torso);

      // Head & Cap
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), matSkin);
      head.position.set(0, 2.02, 0);
      head.castShadow = true;
      this.charMeshGroup.add(head);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.48), matCap);
      cap.position.set(0, 2.22, 0);
      this.charMeshGroup.add(cap);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.28), matCap);
      visor.position.set(0, 2.16, 0.32);
      this.charMeshGroup.add(visor);

      // Arms
      this.leftShoulder = new THREE.Group();
      this.leftShoulder.position.set(-0.46, 1.7, 0);
      const armGeo = new THREE.BoxGeometry(0.2, 0.72, 0.2);
      armGeo.translate(0, -0.32, 0);
      this.leftShoulder.add(new THREE.Mesh(armGeo, matShirt));
      this.charMeshGroup.add(this.leftShoulder);

      this.rightShoulder = new THREE.Group();
      this.rightShoulder.position.set(0.46, 1.7, 0);
      this.rightShoulder.add(new THREE.Mesh(armGeo, matShirt));

      // Right Hand Tool
      this.toolMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), materials.wood);
      this.toolMesh.position.set(0, -0.65, 0.3);
      this.toolMesh.rotation.x = Math.PI / 4;
      this.rightShoulder.add(this.toolMesh);
      this.charMeshGroup.add(this.rightShoulder);

      this.group.add(this.charMeshGroup);
    }

    buildOverheadUI() {
      // 3D Name Tag
      this.nameTag = createTextSprite('👨‍🌾 Друг');
      this.nameTag.position.set(0, 2.7, 0);
      this.nameTag.scale.set(2.4, 0.58, 1);
      this.group.add(this.nameTag);

      // 3D Emote Speech Bubble
      this.emoteBubble = createTextSprite('');
      this.emoteBubble.position.set(0, 3.4, 0);
      this.emoteBubble.scale.set(3.2, 0.75, 1);
      this.emoteBubble.visible = false;
      this.group.add(this.emoteBubble);
      this.emoteTimer = 0;
    }

    buildTractorModel() {
      // Secondary colored tractor for the friend
      this.tractorGroup = new THREE.Group();
      const cyanBody = new THREE.MeshStandardMaterial({ color: 0x00acc1, roughness: 0.4 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 3.8), cyanBody);
      chassis.position.set(0, 0.9, 0);
      chassis.castShadow = true;
      this.tractorGroup.add(chassis);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.8), materials.glass);
      cabin.position.set(0, 2.0, -0.4);
      this.tractorGroup.add(cabin);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 2.0), cyanBody);
      roof.position.set(0, 2.75, -0.4);
      this.tractorGroup.add(roof);

      // Wheels
      const wGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
      wGeo.rotateZ(Math.PI / 2);
      [[-1.4, 0.7, 1.2], [1.4, 0.7, 1.2], [-1.4, 0.9, -1.2], [1.4, 0.9, -1.2]].forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(wGeo, materials.rubber);
        wheel.position.set(wx, wy, wz);
        this.tractorGroup.add(wheel);
      });

      this.tractorGroup.visible = false;
      this.group.add(this.tractorGroup);
    }

    setTargetState(data) {
      this.targetX = data.x;
      this.targetZ = data.z;
      this.targetY = data.y || 0;
      this.targetAngle = data.yaw || 0;
      this.isWalking = data.isWalking;
      this.isShift = data.isShift;
      this.isSwinging = data.isSwinging;
      this.activeTool = data.activeTool || 'hoe';
      this.isDriving = !!data.isDriving;

      if (data.vehX !== undefined && this.isDriving) {
        this.targetX = data.vehX;
        this.targetZ = data.vehZ;
        this.targetAngle = data.vehAngle;
      }
    }

    showEmote(text) {
      this.group.remove(this.emoteBubble);
      this.emoteBubble = createTextSprite(text);
      this.emoteBubble.position.set(0, 3.4, 0);
      this.emoteBubble.scale.set(3.2, 0.75, 1);
      this.emoteBubble.visible = true;
      this.group.add(this.emoteBubble);
      this.emoteTimer = 4.5;
    }

    update(dt) {
      // Smooth lerp interpolation for buttery smooth movement
      const lerpFactor = Math.min(1.0, 14 * dt);
      this.x += (this.targetX - this.x) * lerpFactor;
      this.z += (this.targetZ - this.z) * lerpFactor;
      this.y += (this.targetY - this.y) * lerpFactor;

      // Angle shortest rotation interpolation
      let angleDiff = this.targetAngle - this.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      this.angle += angleDiff * lerpFactor;

      this.group.position.set(this.x, this.y, this.z);

      if (this.isDriving) {
        this.tractorGroup.visible = true;
        this.group.rotation.y = this.angle;
        this.charMeshGroup.position.set(0, 1.0, -0.4);
        this.leftHip.rotation.x = -Math.PI / 3;
        this.rightHip.rotation.x = -Math.PI / 3;
        this.leftShoulder.rotation.x = -Math.PI / 4;
        this.rightShoulder.rotation.x = -Math.PI / 4;
      } else {
        this.tractorGroup.visible = false;
        this.charMeshGroup.position.set(0, 0, 0);
        this.group.rotation.y = this.angle + Math.PI;

        if (this.isWalking) {
          this.walkAnimTime += dt * (this.isShift ? 14 : 9);
          const swing = Math.sin(this.walkAnimTime) * 0.55;
          this.leftHip.rotation.x = swing;
          this.rightHip.rotation.x = -swing;
          this.leftShoulder.rotation.x = -swing * 0.8;
          if (!this.isSwinging) this.rightShoulder.rotation.x = swing * 0.8;
        } else {
          this.leftHip.rotation.x = 0;
          this.rightHip.rotation.x = 0;
          this.leftShoulder.rotation.x = 0;
          if (!this.isSwinging) this.rightShoulder.rotation.x = 0;
        }

        if (this.isSwinging) {
          this.swingTime += dt * 6;
          this.rightShoulder.rotation.x = -Math.sin(this.swingTime) * 1.5;
          if (this.swingTime > Math.PI) {
            this.isSwinging = false;
            this.swingTime = 0;
            this.rightShoulder.rotation.x = 0;
          }
        }
      }

      // Emote bubble lifetime
      if (this.emoteTimer > 0) {
        this.emoteTimer -= dt;
        if (this.emoteTimer <= 0) {
          this.emoteBubble.visible = false;
        }
      }
    }

    destroy() {
      scene.remove(this.group);
    }
  }

  class PlayerFarmer3D {
    constructor(x, z) {
      this.x = x;
      this.z = z;
      this.y = 0;
      this.angle = 0;
      this.speed = 0;
      this.walkAnimTime = 0;
      this.isWalking = false;
      this.viewPerspective = 'first'; // 'first' or 'third'
      this.swingTime = 0;
      this.isSwinging = false;
      this.clickableMeshes = [];

      this.group = new THREE.Group();
      this.group.name = 'playerFarmerGroup';
      
      this.buildModel();
      this.buildFirstPersonHands();
      
      this.group.position.set(this.x, 0, this.z);
      scene.add(this.group);
    }

    buildModel() {
      // Materials
      const matDenim = new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.8 });
      const matShirt = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.7 }); // Red flannel
      const matBoots = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });
      const matSkin = new THREE.MeshStandardMaterial({ color: 0xffcc80, roughness: 0.6 });
      const matBelt = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.7 });
      const matBuckle = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });
      const matStraw = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.6 });
      const matHatBand = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.7 });

      // 1. Legs & Hips
      this.leftHip = new THREE.Group();
      this.leftHip.position.set(-0.2, 0.85, 0);
      const leftLegGeo = new THREE.BoxGeometry(0.24, 0.72, 0.24);
      leftLegGeo.translate(0, -0.36, 0);
      const leftLegMesh = new THREE.Mesh(leftLegGeo, matDenim);
      leftLegMesh.castShadow = true;
      this.leftHip.add(leftLegMesh);

      const bootGeo = new THREE.BoxGeometry(0.26, 0.22, 0.38);
      bootGeo.translate(0, -0.68, 0.06);
      const leftBootMesh = new THREE.Mesh(bootGeo, matBoots);
      leftBootMesh.castShadow = true;
      this.leftHip.add(leftBootMesh);
      this.group.add(this.leftHip);

      this.rightHip = new THREE.Group();
      this.rightHip.position.set(0.2, 0.85, 0);
      const rightLegGeo = new THREE.BoxGeometry(0.24, 0.72, 0.24);
      rightLegGeo.translate(0, -0.36, 0);
      const rightLegMesh = new THREE.Mesh(rightLegGeo, matDenim);
      rightLegMesh.castShadow = true;
      this.rightHip.add(rightLegMesh);

      const rightBootMesh = new THREE.Mesh(bootGeo, matBoots);
      rightBootMesh.castShadow = true;
      this.rightHip.add(rightBootMesh);
      this.group.add(this.rightHip);

      // 2. Torso
      this.torso = new THREE.Group();
      this.torso.position.set(0, 0.85, 0);

      // Belt
      const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.42), matBelt);
      beltMesh.position.set(0, 0.06, 0);
      this.torso.add(beltMesh);

      const buckleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.44), matBuckle);
      buckleMesh.position.set(0, 0.06, 0.01);
      this.torso.add(buckleMesh);

      // Shirt body
      const shirtGeo = new THREE.BoxGeometry(0.7, 0.76, 0.4);
      shirtGeo.translate(0, 0.5, 0);
      const shirtMesh = new THREE.Mesh(shirtGeo, matShirt);
      shirtMesh.castShadow = true;
      this.torso.add(shirtMesh);

      // Overalls straps
      const strapGeo = new THREE.BoxGeometry(0.12, 0.78, 0.42);
      strapGeo.translate(0, 0.5, 0);
      const leftStrap = new THREE.Mesh(strapGeo, matDenim);
      leftStrap.position.x = -0.2;
      this.torso.add(leftStrap);
      const rightStrap = new THREE.Mesh(strapGeo, matDenim);
      rightStrap.position.x = 0.2;
      this.torso.add(rightStrap);

      this.group.add(this.torso);

      // 3. Arms & Hands
      this.leftShoulder = new THREE.Group();
      this.leftShoulder.position.set(-0.48, 1.6, 0);
      const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
      armGeo.translate(0, -0.32, 0);
      const leftArmMesh = new THREE.Mesh(armGeo, matShirt);
      leftArmMesh.castShadow = true;
      this.leftShoulder.add(leftArmMesh);
      const leftHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), matSkin);
      leftHandMesh.position.set(0, -0.66, 0);
      this.leftShoulder.add(leftHandMesh);
      this.group.add(this.leftShoulder);

      this.rightShoulder = new THREE.Group();
      this.rightShoulder.position.set(0.48, 1.6, 0);
      const rightArmMesh = new THREE.Mesh(armGeo, matShirt);
      rightArmMesh.castShadow = true;
      this.rightShoulder.add(rightArmMesh);
      const rightHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), matSkin);
      rightHandMesh.position.set(0, -0.66, 0);
      this.rightShoulder.add(rightHandMesh);

      // Tool in right hand (3rd person)
      this.handTool = new THREE.Group();
      this.handTool.position.set(0, -0.66, 0.1);
      
      const handleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), materials.wood);
      handleMesh.rotation.x = Math.PI / 3;
      this.handTool.add(handleMesh);

      const toolHeadMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.2), materials.steelPlow);
      toolHeadMesh.position.set(0, -0.6, 0.5);
      this.handTool.add(toolHeadMesh);

      this.rightShoulder.add(this.handTool);
      this.group.add(this.rightShoulder);

      // 4. Head Group (can be hidden in 1st person to prevent clipping)
      this.headGroup = new THREE.Group();
      this.headGroup.position.set(0, 1.65, 0);

      const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.15), matSkin);
      neckMesh.position.y = 0.08;
      this.headGroup.add(neckMesh);

      const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.44), matSkin);
      headMesh.position.y = 0.38;
      headMesh.castShadow = true;
      this.headGroup.add(headMesh);

      // Eyes
      const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.12, 0.42, 0.23);
      this.headGroup.add(leftEye);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.12, 0.42, 0.23);
      this.headGroup.add(rightEye);

      // Mustache / smile
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x5d4037 }));
      stache.position.set(0, 0.32, 0.23);
      this.headGroup.add(stache);

      // Straw Hat
      const hatGroup = new THREE.Group();
      hatGroup.position.set(0, 0.62, 0);

      const brimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 16), matStraw);
      hatGroup.add(brimMesh);

      const ribbonMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.12, 16), matHatBand);
      ribbonMesh.position.y = 0.09;
      hatGroup.add(ribbonMesh);

      const topMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.35, 16), matStraw);
      topMesh.position.y = 0.28;
      topMesh.castShadow = true;
      hatGroup.add(topMesh);

      this.headGroup.add(hatGroup);
      this.group.add(this.headGroup);

      // 5. Selection Ring under feet
      const ringGeo = new THREE.RingGeometry(0.7, 0.95, 32);
      ringGeo.rotateX(-Math.PI / 2);
      this.ringMat = new THREE.MeshBasicMaterial({ color: 0x00e676, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      this.ring = new THREE.Mesh(ringGeo, this.ringMat);
      this.ring.position.y = 0.04;
      this.group.add(this.ring);

      // 6. Overhead 3D label
      this.tag = createTextSprite('👨‍🌾 ВЫ (Кликни)');
      this.tag.position.set(0, 2.85, 0);
      this.group.add(this.tag);

      // Register clickable meshes for raycaster
      this.clickableMeshes.push(shirtMesh, headMesh, brimMesh, this.ring);
      this.clickableMeshes.forEach(m => { m.userData.isFarmer = true; });
    }

    buildFirstPersonHands() {
      // 1st-person ViewModel attached to camera (hands and active tool in front)
      this.fpViewModel = new THREE.Group();
      this.fpViewModel.name = 'firstPersonViewModel';

      const matSkin = new THREE.MeshStandardMaterial({ color: 0xffcc80, roughness: 0.6 });
      const matSleeve = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.7 });

      // Right arm / hand holding tool
      this.fpRightArm = new THREE.Group();
      this.fpRightArm.position.set(0.38, -0.35, -0.55);

      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.55, 8), matSleeve);
      sleeve.rotation.x = Math.PI / 2.8;
      sleeve.position.set(0, -0.1, 0.15);
      this.fpRightArm.add(sleeve);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), matSkin);
      hand.position.set(0, 0.05, -0.15);
      this.fpRightArm.add(hand);

      // Tool in hand
      this.fpTool = new THREE.Group();
      this.fpTool.position.set(0, 0.05, -0.15);

      this.fpToolStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), materials.wood);
      this.fpToolStaff.rotation.x = Math.PI / 3;
      this.fpToolStaff.position.set(0, 0.2, -0.2);
      this.fpTool.add(this.fpToolStaff);

      this.fpToolBlade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.18), materials.steelPlow);
      this.fpToolBlade.position.set(0, 0.65, -0.45);
      this.fpTool.add(this.fpToolBlade);

      this.fpRightArm.add(this.fpTool);
      this.fpViewModel.add(this.fpRightArm);

      // Left hand visible resting forward
      this.fpLeftArm = new THREE.Group();
      this.fpLeftArm.position.set(-0.35, -0.38, -0.55);
      const lSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.5, 8), matSleeve);
      lSleeve.rotation.x = Math.PI / 3.2;
      lSleeve.position.set(0, -0.08, 0.15);
      this.fpLeftArm.add(lSleeve);
      const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), matSkin);
      lHand.position.set(0, 0.05, -0.12);
      this.fpLeftArm.add(lHand);
      this.fpViewModel.add(this.fpLeftArm);

      this.fpViewModel.visible = false;
      camera.add(this.fpViewModel);
    }

    triggerSwing() {
      this.isSwinging = true;
      this.swingTime = 0;
    }

    setPerspective(mode) {
      this.viewPerspective = mode;
      if (farm.viewMode === 'FPS') {
        if (this.viewPerspective === 'first') {
          this.headGroup.visible = false;
          this.torso.visible = false;
          this.leftHip.visible = false;
          this.rightHip.visible = false;
          this.leftShoulder.visible = false;
          this.rightShoulder.visible = false;
          this.ring.visible = false;
          this.tag.visible = false;
          this.fpViewModel.visible = true;
        } else {
          // Third-person
          this.headGroup.visible = true;
          this.torso.visible = true;
          this.leftHip.visible = true;
          this.rightHip.visible = true;
          this.leftShoulder.visible = true;
          this.rightShoulder.visible = true;
          this.ring.visible = true;
          this.tag.visible = false;
          this.fpViewModel.visible = false;
        }
      } else {
        // RTS mode
        this.headGroup.visible = true;
        this.torso.visible = true;
        this.leftHip.visible = true;
        this.rightHip.visible = true;
        this.leftShoulder.visible = true;
        this.rightShoulder.visible = true;
        this.ring.visible = true;
        this.tag.visible = true;
        this.fpViewModel.visible = false;
      }
    }

    update(dt) {
      const now = performance.now() / 1000;

      // Update Tool appearance in 1st person based on farm.activeTool
      if (farm.activeTool === 'water') {
        this.fpToolBlade.material = materials.water;
        this.fpToolBlade.scale.set(1.4, 1.4, 1.4);
      } else if (farm.activeTool === 'seed') {
        this.fpToolBlade.material = materials.goldGlow;
        this.fpToolBlade.scale.set(0.8, 0.8, 0.8);
      } else if (farm.activeTool === 'scythe') {
        this.fpToolBlade.material = materials.steelPlow;
        this.fpToolBlade.scale.set(1.8, 0.4, 1.8);
      } else {
        this.fpToolBlade.material = materials.steelPlow;
        this.fpToolBlade.scale.set(1.0, 1.0, 1.0);
      }

      // Swing animation
      if (this.isSwinging) {
        this.swingTime += dt * 6.5;
        const swingAngle = Math.sin(this.swingTime * Math.PI) * 0.75;
        this.fpRightArm.rotation.x = swingAngle;
        this.fpRightArm.position.z = -0.55 + swingAngle * 0.2;
        this.rightShoulder.rotation.x = -swingAngle * 1.5;
        if (this.swingTime >= 1.0) {
          this.isSwinging = false;
          this.fpRightArm.rotation.x = 0;
          this.fpRightArm.position.z = -0.55;
          this.rightShoulder.rotation.x = 0;
        }
      }

      if (farm.viewMode === 'FPS') {
        // --- FPS CHARACTER CONTROL ---
        let f = 0, s = 0;
        if (keys['w'] || keys['keyw'] || keys['ц'] || keys['arrowup']) f += 1;
        if (keys['s'] || keys['keys'] || keys['ы'] || keys['arrowdown']) f -= 1;
        if (keys['a'] || keys['keya'] || keys['ф'] || keys['arrowleft']) s -= 1;
        if (keys['d'] || keys['keyd'] || keys['в'] || keys['arrowright']) s += 1;

        if (touchInput.active) {
          f += touchInput.moveZ;
          s += touchInput.moveX;
        }
        f = Math.max(-1, Math.min(1, f));
        s = Math.max(-1, Math.min(1, s));

        const isShift = keys['shift'] || keys['shiftleft'] || keys['shiftright'] || touchInput.isSprinting;
        const moveSpeed = (isShift ? 13.5 : 7.0) * dt;

        this.isWalking = (f !== 0 || s !== 0);

        if (this.isWalking) {
          this.walkAnimTime += dt * (isShift ? 14 : 9);
          
          // Camera basis vectors in XZ plane (W/S forward, D/A right/left)
          const fwX = -Math.sin(fpsControls.yaw);
          const fwZ = -Math.cos(fpsControls.yaw);
          const rtX = Math.cos(fpsControls.yaw);
          const rtZ = -Math.sin(fpsControls.yaw);

          const nx = this.x + (fwX * f + rtX * s) * moveSpeed;
          const nz = this.z + (fwZ * f + rtZ * s) * moveSpeed;

          // Solid collision check with sliding on X and Z independently
          const pRadius = 0.45;
          const mapMaxX = GRID_COLS * TILE_SIZE - pRadius;
          const mapMaxZ = GRID_ROWS * TILE_SIZE - pRadius;

          if (nx >= pRadius && nx <= mapMaxX && !checkWorldCollision(nx, this.z, pRadius)) {
            this.x = nx;
          }
          if (nz >= pRadius && nz <= mapMaxZ && !checkWorldCollision(this.x, nz, pRadius)) {
            this.z = nz;
          }

          // Face walk direction in 3rd person
          this.angle = fpsControls.yaw;
          this.group.rotation.y = this.angle + Math.PI;

          // Limb animations
          const swing = Math.sin(this.walkAnimTime) * 0.55;
          this.leftHip.rotation.x = swing;
          this.rightHip.rotation.x = -swing;
          this.leftShoulder.rotation.x = -swing * 0.8;
          if (!this.isSwinging) this.rightShoulder.rotation.x = swing * 0.8;

          // ViewModel bobbing
          this.fpViewModel.position.y = Math.sin(this.walkAnimTime * 2) * 0.025;
          this.fpViewModel.position.x = Math.cos(this.walkAnimTime) * 0.015;
        } else {
          // Standing idle
          this.leftHip.rotation.x = 0;
          this.rightHip.rotation.x = 0;
          this.leftShoulder.rotation.x = 0;
          if (!this.isSwinging) this.rightShoulder.rotation.x = 0;
          this.fpViewModel.position.y = 0;
          this.fpViewModel.position.x = 0;
          this.group.rotation.y = fpsControls.yaw + Math.PI;
        }

        // Camera positioning
        const headBob = this.isWalking ? Math.sin(this.walkAnimTime * 2) * 0.08 : 0;
        this.group.position.set(this.x, 0, this.z);

        if (this.viewPerspective === 'first') {
          // 1st Person: Camera located directly at eyes
          camera.position.set(this.x, 1.75 + headBob, this.z);

          const lookDir = new THREE.Vector3(
            -Math.sin(fpsControls.yaw) * Math.cos(fpsControls.pitch),
            Math.sin(fpsControls.pitch),
            -Math.cos(fpsControls.yaw) * Math.cos(fpsControls.pitch)
          );
          camera.lookAt(camera.position.clone().add(lookDir));
        } else {
          // 3rd Person: Camera behind character
          const distBack = 4.2;
          const camHeight = 2.4;
          const camX = this.x + Math.sin(fpsControls.yaw) * distBack;
          const camZ = this.z + Math.cos(fpsControls.yaw) * distBack;
          camera.position.set(camX, camHeight, camZ);
          camera.lookAt(this.x, 1.7, this.z);
        }

      } else {
        // --- RTS MODE IDLE ANIMATION ---
        this.tag.quaternion.copy(camera.quaternion); // Tag faces camera
        this.ring.rotation.z = now * 1.5;
        const pulse = 0.75 + Math.sin(now * 3.5) * 0.25;
        this.ringMat.opacity = pulse;

        // Subtle breathing
        const breath = Math.sin(now * 2) * 0.02;
        this.torso.position.y = 0.85 + breath;
        this.headGroup.position.y = 1.65 + breath;
      }
    }
  }

  // --- 3D HIRED WORKERS (AUTONOMOUS NPCS) ---
  const WORKER_DEFS = {
    fieldhand: { id: 'fieldhand', name: 'Полевой рабочий', role: 'Полив полей и ручной сбор спелого урожая', salary: 18, icon: '👨‍🌾', hired: 0 },
    planter: { id: 'planter', name: 'Сеятель (Агроном)', role: 'Автоматически засевает вспаханные поля выбранными семенами', salary: 24, icon: '🌱', hired: 0 },
    tractorist: { id: 'tractorist', name: 'Механизатор (Тракторист)', role: 'Управляет трактором (пашет только целину на ваших землях)', salary: 40, icon: '🚜', hired: 0 },
    combine_driver: { id: 'combine_driver', name: 'Комбайнёр', role: 'Авто-жатва (едет строго туда, где есть спелый урожай)', salary: 60, icon: '🌾', hired: 0 }
  };

  const activeWorkerBots = [];

  class WorkerBot3D {
    constructor(type) {
      this.type = type;
      this.x = 24;
      this.z = 24;
      this.targetX = this.x;
      this.targetZ = this.z;
      this.actionTimer = 0;
      this.speed = 5.5;
      this.isIdle = false;

      this.group = new THREE.Group();
      this.buildModel();
      this.group.position.set(this.x, 0, this.z);
      scene.add(this.group);
    }

    buildModel() {
      // Body / Overalls
      const apronCol = this.type === 'planter' ? 0x2e7d32 : 0x1565c0;
      const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
      const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: apronCol, roughness: 0.8 }));
      body.position.set(0, 1.1, 0);
      body.castShadow = true;
      this.group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: 0xffcc80, roughness: 0.6 }));
      head.position.set(0, 2.0, 0);
      head.castShadow = true;
      this.group.add(head);

      // Straw Hat
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 12), materials.yellowRim);
      hatBrim.position.set(0, 2.3, 0);
      this.group.add(hatBrim);

      const hatTop = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.5, 8), materials.yellowRim);
      hatTop.position.set(0, 2.55, 0);
      this.group.add(hatTop);
    }

    update(dt) {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.actionTimer = 1.8;
        this.findNextJob();
      }

      const dx = this.targetX - this.x;
      const dz = this.targetZ - this.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.4) {
        this.x += (dx / dist) * this.speed * dt;
        this.z += (dz / dist) * this.speed * dt;
        this.group.rotation.y = Math.atan2(dx, dz);
        // Walking bounce
        this.group.position.y = Math.abs(Math.sin(Date.now() / 150)) * 0.2;
      } else {
        this.group.position.y = 0;
        const c = Math.floor(this.x / TILE_SIZE);
        const r = Math.floor(this.z / TILE_SIZE);
        if (isTileOwned(c, r)) {
          const tile = grid[r][c];
          if (this.type === 'planter') {
            if (tile.soil === 'tilled' && !tile.crop) {
              const cropDef = CROP_INFO[farm.activeSeed];
              if (farm.money >= cropDef.seedCost) {
                farm.money -= cropDef.seedCost;
                tile.crop = { type: farm.activeSeed, stage: 0, progress: 0, mature: false };
                spawn3DParticles(c * TILE_SIZE + 1.5, 0.5, r * TILE_SIZE + 1.5, cropDef.color, 6);
                showFloat(`Посеяно ${cropDef.name} 🌱`, window.innerWidth / 2, 80);
                this.findNextJob();
              }
            }
          } else if (this.type === 'fieldhand') {
            if (tile.crop && tile.crop.mature) {
              harvestTile(tile);
              this.findNextJob();
            } else if (tile.crop && tile.moisture < 20) {
              tile.moisture = 100;
              updateTileAppearance(c, r);
              spawn3DParticles(c * TILE_SIZE + 1.5, 0.5, r * TILE_SIZE + 1.5, 0x42a5f5, 6);
              this.findNextJob();
            }
          }
        }
      }

      this.group.position.set(this.x, this.group.position.y, this.z);
    }

    findNextJob() {
      if (this.type === 'planter') {
        let bestTile = null;
        let minDist = Infinity;
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const tile = grid[r][c];
            if (isTileOwned(c, r) && tile.soil === 'tilled' && !tile.crop) {
              const dist = Math.hypot((c * TILE_SIZE + 1.5) - this.x, (r * TILE_SIZE + 1.5) - this.z);
              if (dist < minDist) {
                minDist = dist;
                bestTile = tile;
              }
            }
          }
        }
        if (bestTile) {
          this.targetX = bestTile.c * TILE_SIZE + 1.5;
          this.targetZ = bestTile.r * TILE_SIZE + 1.5;
          this.isIdle = false;
        } else {
          this.targetX = 18 + (Math.random() - 0.5) * 6;
          this.targetZ = 18 + (Math.random() - 0.5) * 6;
          this.isIdle = true;
        }
      } else {
        let bestTile = null;
        let minDist = Infinity;
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const tile = grid[r][c];
            if (isTileOwned(c, r) && tile.crop) {
              if (tile.crop.mature || tile.moisture < 20) {
                const dist = Math.hypot((c * TILE_SIZE + 1.5) - this.x, (r * TILE_SIZE + 1.5) - this.z);
                if (dist < minDist) {
                  minDist = dist;
                  bestTile = tile;
                }
              }
            }
          }
        }
        if (bestTile) {
          this.targetX = bestTile.c * TILE_SIZE + 1.5;
          this.targetZ = bestTile.r * TILE_SIZE + 1.5;
          this.isIdle = false;
        } else {
          this.targetX = 18 + (Math.random() - 0.5) * 6;
          this.targetZ = 18 + (Math.random() - 0.5) * 6;
          this.isIdle = true;
        }
      }
    }
  }


  // --- 3D PARTICLE SYSTEM ---
  const particles3D = [];
  const pGeo = new THREE.SphereGeometry(0.18, 5, 5);

  class Particle3D {
    constructor(wx, wy, wz, colorHex, count) {
      this.mesh = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 }));
      this.mesh.position.set(wx, wy, wz);
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.5;
      this.vx = Math.cos(angle) * spd;
      this.vy = 2.5 + Math.random() * 3.5;
      this.vz = Math.sin(angle) * spd;
      this.life = 0.65;
      this.maxLife = this.life;
      scene.add(this.mesh);
    }
    update(dt) {
      this.mesh.position.x += this.vx * dt;
      this.mesh.position.y += this.vy * dt;
      this.mesh.position.z += this.vz * dt;
      this.vy -= 9.8 * dt; // Gravity
      this.life -= dt;
      this.mesh.material.opacity = Math.max(0, this.life / this.maxLife);
    }
    destroy() {
      scene.remove(this.mesh);
    }
  }

  function spawn3DParticles(wx, wy, wz, colorHex, count = 6) {
    for (let i = 0; i < count; i++) {
      particles3D.push(new Particle3D(wx, wy, wz, colorHex));
    }
  }


  // --- INPUT CONTROLS & RAYCASTING ---
  const keys = {};
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  // Selection Cursor Indicator in 3D
  const cursorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(TILE_SIZE, 0.45, TILE_SIZE),
    materials.selectionBox
  );
  cursorMesh.visible = false;
  scene.add(cursorMesh);

  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;

    // Quick Tool Switch (1 - 5)
    if (e.key === '1') selectTool('hoe');
    if (e.key === '2') selectTool('water');
    if (e.key === '3') selectTool('seed');
    if (e.key === '4') selectTool('scythe');
    if (e.key === '5') selectTool('fertilizer');
    // Toggle 1st / 3rd person perspective for farmer (C key)
    if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'с' || e.code === 'KeyC') {
      if (farm.viewMode === 'FPS') {
        const nextMode = playerFarmer.viewPerspective === 'first' ? 'third' : 'first';
        playerFarmer.setPerspective(nextMode);
        showFloat(nextMode === 'first' ? '👁️ Вид из глаз' : '👤 Вид со спины', window.innerWidth / 2, 80);
      }
    }


    // Exit vehicle (E / У)
    if (e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'у' || e.code === 'KeyE') {
      if (farm.drivingVehicle) exitVehicle();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
  });

  
  // --- FIRST PERSON CONTROLLER & RAYCASTING ---
  const fpsControls = {
    yaw: Math.PI / 4, pitch: -0.2, x: 45, z: 45, y: 1.7, sensitivity: 0.002, isLocked: false
  };

  document.addEventListener('pointerlockchange', () => {
    fpsControls.isLocked = (document.pointerLockElement === canvas);
    if (!fpsControls.isLocked && farm.viewMode === 'FPS') {
      hud.fpsCrosshair.style.display = 'none';
    } else if (fpsControls.isLocked && farm.viewMode === 'FPS') {
      hud.fpsCrosshair.style.display = 'block';
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (farm.viewMode === 'FPS' && fpsControls.isLocked) {
      // Pure instantaneous 1:1 mouse tracking (ZERO INERTIA)
      fpsControls.yaw -= e.movementX * fpsControls.sensitivity;
      fpsControls.pitch -= e.movementY * fpsControls.sensitivity;
      fpsControls.pitch = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, fpsControls.pitch));
      cursorMesh.visible = false;
    } else {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (farm.viewMode === 'RTS') {
        raycaster.setFromCamera(mouse, camera);

        // Hover over farmer?
        const farmerHits = raycaster.intersectObjects(playerFarmer.clickableMeshes);
        if (farmerHits.length > 0) {
          canvas.style.cursor = 'pointer';
          playerFarmer.ringMat.color.setHex(0x00ffff);
          cursorMesh.visible = false;
          return;
        } else {
          canvas.style.cursor = 'default';
          playerFarmer.ringMat.color.setHex(0x00e676);
        }

        // Hover over terrain
        const intersects = raycaster.intersectObjects(terrainGroup.children);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit.userData && hit.userData.c !== undefined) {
            cursorMesh.position.set(hit.position.x, 0.1, hit.position.z);
            cursorMesh.visible = true;
            return;
          }
        }
      }
      cursorMesh.visible = false;
    }
  });

  function triggerPrimaryAction() {
    if (farm.drivingVehicle) return;

    if (farm.viewMode === 'FPS') {
      // Trigger tool swing animation on the farmer's hands
      playerFarmer.triggerSwing();

      // Raycast forward from camera center
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

      // Check if aiming at vehicle to enter it
      for (const v of ownedVehicles) {
        const dist = raycaster.ray.distanceToPoint(new THREE.Vector3(v.x, 1.5, v.z));
        if (dist < 3.8) {
          enterVehicle(v);
          return;
        }
      }

      // Check if aiming at Mill or Cow Barn
      if (raycaster.ray.distanceToPoint(new THREE.Vector3(32, 6, 12)) < 8.0) {
        updateMillUI();
        openModal(document.getElementById('modal-mill'));
        return;
      }
      if (raycaster.ray.distanceToPoint(new THREE.Vector3(8, 3, 32)) < 9.0) {
        updateLivestockUI();
        openModal(document.getElementById('modal-livestock'));
        return;
      }

      // Interact with field tile under crosshair
      const intersects = raycaster.intersectObjects(terrainGroup.children);
      if (intersects.length > 0 && intersects[0].distance < 8.5) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.c !== undefined) {
          handleTileInteraction(hit.userData.c, hit.userData.r);
          return;
        }
      }

      // Mobile touch fallback: interact directly with tile in front of the farmer
      const frontC = Math.floor((playerFarmer.x - Math.sin(fpsControls.yaw) * 1.5) / TILE_SIZE);
      const frontR = Math.floor((playerFarmer.z - Math.cos(fpsControls.yaw) * 1.5) / TILE_SIZE);
      if (frontC >= 0 && frontC < GRID_COLS && frontR >= 0 && frontR < GRID_ROWS) {
        handleTileInteraction(frontC, frontR);
      }
      return;
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button === 0) { // Left Mouse Click
      if (farm.viewMode === 'FPS') {
        if (!fpsControls.isLocked && !isMobile) {
          try { canvas.requestPointerLock(); } catch(err) {}
          return;
        }
        triggerPrimaryAction();
        return;
      }

      // RTS MODE INTERACTION
      raycaster.setFromCamera(mouse, camera);

      // 1. Check if player clicked directly on the Farmer Avatar to possess him!
      const farmerHits = raycaster.intersectObjects(playerFarmer.clickableMeshes);
      if (farmerHits.length > 0) {
        enterFarmerMode();
        return;
      }

      // 1.5 Check if clicked on Mill or Cow Barn
      if (raycaster.ray.distanceToPoint(new THREE.Vector3(32, 6, 12)) < 7.0) {
        updateMillUI();
        openModal(document.getElementById('modal-mill'));
        return;
      }
      if (raycaster.ray.distanceToPoint(new THREE.Vector3(8, 3, 32)) < 8.0) {
        updateLivestockUI();
        openModal(document.getElementById('modal-livestock'));
        return;
      }

      // 2. Check if clicked on a vehicle
      for (const v of ownedVehicles) {
        const dist = Math.hypot(cursorMesh.position.x - v.x, cursorMesh.position.z - v.z);
        if (dist < 4.0) {
          enterVehicle(v);
          return;
        }
      }

      // 3. Field tile interaction
      const intersects = raycaster.intersectObjects(terrainGroup.children);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.c !== undefined) {
          handleTileInteraction(hit.userData.c, hit.userData.r);
        }
      }
    }
  });


  function selectTool(toolName) {
    farm.activeTool = toolName;
    hud.toolSlots.forEach(slot => {
      if (slot.dataset.tool === toolName) slot.classList.add('active');
      else slot.classList.remove('active');
    });

    if (toolName === 'seed') hud.seedSelector.style.display = 'flex';
    else hud.seedSelector.style.display = 'none';
  }

  hud.toolSlots.forEach(slot => {
    slot.addEventListener('click', () => selectTool(slot.dataset.tool));
  });

  hud.seedOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      hud.seedOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      farm.activeSeed = opt.dataset.crop;
    });
  });

  function handleTileInteraction(c, r) {
    if (farm.drivingVehicle) return;

    if (!isTileOwned(c, r)) {
      showFloat('УЧАСТОК НЕ КУПЛЕН!', window.innerWidth / 2, 80, '#c0392b');
      return;
    }

    const tile = grid[r][c];
    if (tile.farmable === false) {
      showFloat('Двор усадьбы нельзя распахивать 🏡', window.innerWidth / 2, 80, '#78909c');
      return;
    }
    const wx = c * TILE_SIZE + 1.5;
    const wz = r * TILE_SIZE + 1.5;

    if (farm.activeTool === 'hoe') {
      if (tile.soil === 'grass') {
        tile.soil = 'tilled';
        updateTileAppearance(c, r);
        spawn3DParticles(wx, 0.4, wz, 0x6d4c41, 6);
        showFloat('Вспахано', window.innerWidth / 2, 80);
      }
    } else if (farm.activeTool === 'water') {
      if (tile.soil === 'tilled') {
        tile.moisture = 100;
        updateTileAppearance(c, r);
        spawn3DParticles(wx, 0.4, wz, 0x42a5f5, 8);
        showFloat('Полито 💧', window.innerWidth / 2, 80, '#1976d2');
      }
    } else if (farm.activeTool === 'seed') {
      if (tile.soil === 'tilled' && !tile.crop) {
        const cropDef = CROP_INFO[farm.activeSeed];
        if (farm.money >= cropDef.seedCost) {
          farm.money -= cropDef.seedCost;
          tile.crop = { type: farm.activeSeed, stage: 0, progress: 0, mature: false };
          spawn3DParticles(wx, 0.4, wz, cropDef.color, 5);
          showFloat(`-${cropDef.seedCost}$ Посеяно`, window.innerWidth / 2, 80);
        } else {
          showFloat('Недостаточно денег на семена!', window.innerWidth / 2, 80, '#d32f2f');
        }
      }
    } else if (farm.activeTool === 'scythe') {
      if (tile.crop && tile.crop.mature) {
        harvestTile(tile);
      }
    } else if (farm.activeTool === 'fertilizer') {
      if (tile.soil === 'tilled' && !tile.fertilized) {
        if (farm.warehouse.items.manure > 0 || farm.money >= 6) {
          if (farm.warehouse.items.manure > 0) {
            farm.warehouse.items.manure--;
            showFloat('💩 Внесен органический навоз! Плодородие 100% ✨', window.innerWidth / 2, 80, '#5d4037');
          } else {
            farm.money -= 6;
            showFloat('-6$ Минеральные удобрения! Плодородие 100% ✨', window.innerWidth / 2, 80, '#7b1fa2');
          }
          tile.fertilized = true;
          tile.fertility = 100;
          tile.hasWeeds = false;
          spawn3DParticles(wx, 0.4, wz, 0xab47bc, 10);
        }
      }
    }
  }

  function harvestTile(tile) {
    const totalStored = Object.values(farm.warehouse.items).reduce((a, b) => a + b, 0);
    if (totalStored >= farm.warehouse.capacity) {
      showFloat('СКЛАД ПОЛОН! ПРОДАЙТЕ УРОЖАЙ', window.innerWidth / 2, 80, '#d32f2f');
      return;
    }

    const cropType = tile.crop.type;
    let yieldAmount = tile.fertilized ? 2 : 1;

    // Hardcore: Monoculture soil depletion vs Crop Rotation
    if (tile.lastCrop === cropType) {
      tile.fertility = Math.max(20, tile.fertility - 25);
      showFloat(`⚠️ Истощение почвы: плодородия осталось ${tile.fertility}% (Чередуйте культуры!)`, window.innerWidth / 2, 90, '#e65100');
      if (tile.fertility < 40) yieldAmount = Math.max(1, yieldAmount - 1);
    } else {
      tile.fertility = Math.min(100, tile.fertility + 10);
      showFloat(`🌱 Севооборот: плодородие +${10}% (${tile.fertility}%)`, window.innerWidth / 2, 90, '#2e7d32');
    }
    tile.lastCrop = cropType;

    farm.warehouse.items[cropType] += yieldAmount;
    farm.totalHarvestedTons += yieldAmount;

    spawn3DParticles(tile.c * TILE_SIZE + 1.5, 0.6, tile.r * TILE_SIZE + 1.5, CROP_INFO[cropType].color, 12);
    showFloat(`+${yieldAmount} ${CROP_INFO[cropType].name}`, window.innerWidth / 2, 80, '#2e7d32');

    tile.crop = null;
    tile.fertilized = false;
  }

  
  
  function enterFarmerMode() {
    if (farm.drivingVehicle) return;
    farm.viewMode = 'FPS';
    controls.enabled = false; // Disable OrbitControls completely (ZERO inertia!)

    if (hud.btnToggleView) {
      hud.btnToggleView.innerHTML = '🛰️ Стратегия [V]';
      hud.btnToggleView.classList.add('active');
    }
    if (hud.fpsCrosshair) hud.fpsCrosshair.style.display = 'block';

    fpsControls.yaw = playerFarmer.angle;
    fpsControls.pitch = -0.12;

    playerFarmer.setPerspective('first');
    if (!isMobile) {
      try { canvas.requestPointerLock(); } catch(e) {}
    } else {
      fpsControls.isLocked = true;
    }

    showFloat('🚶 Вы вселились в фермера! Джойстик — ходьба, правая часть — обзор, ⛏️ — работа.', window.innerWidth / 2, 80, '#00e676');
    updateMobileControlsUI();
  }

  function exitFarmerMode() {
    farm.viewMode = 'RTS';
    document.exitPointerLock();

    if (hud.btnToggleView) {
      hud.btnToggleView.innerHTML = '👨‍🌾 Фермер [V]';
      hud.btnToggleView.classList.remove('active');
    }
    if (hud.fpsCrosshair) hud.fpsCrosshair.style.display = 'none';

    playerFarmer.setPerspective('third');

    controls.enabled = true;
    controls.target.set(playerFarmer.x, 0, playerFarmer.z);
    camera.position.set(playerFarmer.x + 22, 30, playerFarmer.z + 26);
    controls.update();

    showFloat('🛰️ Режим стратегии. Кликните по фермеру, чтобы снова управлять им!', window.innerWidth / 2, 80, '#29b6f6');
    updateMobileControlsUI();
  }

  function toggleViewMode() {
    if (farm.drivingVehicle) return;
    if (farm.viewMode === 'RTS') enterFarmerMode();
    else exitFarmerMode();
  }
  if (hud.btnToggleView) hud.btnToggleView.addEventListener('click', toggleViewMode);

  function enterVehicle(v) {
    if (farm.viewMode === 'FPS') {
      try { if (document.exitPointerLock) document.exitPointerLock(); } catch(e) {}
    }

    farm.drivingVehicle = v;
    hud.activeVehicleBar.style.display = 'block';
    hud.drivingVehicleName.innerText = v.def.name;
    cursorMesh.visible = false;
    controls.enabled = false; // Chase camera takes over
    updateMobileControlsUI();
  }

  function exitVehicle() {
    farm.drivingVehicle = null;
    hud.activeVehicleBar.style.display = 'none';
    controls.enabled = (farm.viewMode === 'RTS');
    updateMobileControlsUI();
  }



  // =========================================================
  // MULTIPLAYER NETWORKING MANAGER (P2P WebRTC via PeerJS)
  // =========================================================
  const mpManager = {
    role: 'single', // 'single' | 'host' | 'guest'
    peer: null,
    conn: null,
    roomId: null,
    connected: false,
    remoteFarmer: null,
    sendTimer: 0,

    initHost() {
      if (this.peer) this.disconnect();

      const randCode = Math.floor(100 + Math.random() * 900);
      this.roomId = 'AGRO-' + randCode;
      this.role = 'host';

      this.setStatus('waiting', `Создание комнаты ${this.roomId}...`);

      try {
        this.peer = new Peer(this.roomId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.roomId = id;
          this.setStatus('waiting', `Ожидание друга... Код: ${id}`);
          if (hud.mpHostInfo) hud.mpHostInfo.style.display = 'block';
          if (hud.mpRoomCode) hud.mpRoomCode.innerText = id;
          if (hud.mpMyRole) hud.mpMyRole.innerText = 'Хост (Усадьба 1)';
          if (hud.mpActiveSection) hud.mpActiveSection.style.display = 'block';
          if (hud.quickEmoteBar) hud.quickEmoteBar.style.display = 'flex';
          showFloat(`Комната ${id} создана! Скопируйте ссылку для друга.`, window.innerWidth / 2, 80, '#00e676');
        });

        this.peer.on('connection', (connection) => {
          this.conn = connection;
          this.setupConnectionHandlers();
        });

        this.peer.on('error', (err) => {
          console.warn('Peer error:', err);
          this.setStatus('disconnected', 'Ошибка: ' + (err.type || 'не удалось создать сервер'));
          showFloat('Ошибка P2P соединения', window.innerWidth / 2, 80, '#e53935');
        });
      } catch (err) {
        console.error(err);
        this.setStatus('disconnected', 'Ошибка инициализации WebRTC');
      }
    },

    joinRoom(targetRoomId) {
      if (!targetRoomId || targetRoomId.trim().length === 0) {
        showFloat('Введите код комнаты!', window.innerWidth / 2, 80, '#e53935');
        return;
      }
      targetRoomId = targetRoomId.trim().toUpperCase();
      if (this.peer) this.disconnect();

      this.role = 'guest';
      this.roomId = targetRoomId;
      this.setStatus('waiting', `Подключение к ${targetRoomId}...`);

      try {
        this.peer = new Peer({
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', () => {
          this.conn = this.peer.connect(targetRoomId, { reliable: true });
          this.setupConnectionHandlers();
        });

        this.peer.on('error', (err) => {
          console.warn('Peer error:', err);
          this.setStatus('disconnected', 'Не удалось найти комнату ' + targetRoomId);
          showFloat('Комната не найдена или занята', window.innerWidth / 2, 80, '#e53935');
        });
      } catch (err) {
        console.error(err);
        this.setStatus('disconnected', 'Ошибка WebRTC');
      }
    },

    setupConnectionHandlers() {
      if (!this.conn) return;

      this.conn.on('open', () => {
        this.connected = true;
        this.setStatus('connected', `🟢 Онлайн! Связь с другом установлена (${this.roomId})`);
        if (hud.mpActiveSection) hud.mpActiveSection.style.display = 'block';
        if (hud.quickEmoteBar) hud.quickEmoteBar.style.display = 'flex';

        // Unlock Plot 8 (Friend's Farm)
        PLOTS[8].owned = true;
        for (let r = PLOTS[8].minR; r <= PLOTS[8].maxR; r++) {
          for (let c = PLOTS[8].minC; c <= PLOTS[8].maxC; c++) {
            updateTileAppearance(c, r);
          }
        }

        // Spawn remote player
        if (!this.remoteFarmer) {
          const spawnX = this.role === 'host' ? 122 : 12;
          const spawnZ = this.role === 'host' ? 135 : 18;
          this.remoteFarmer = new RemotePlayerFarmer3D(spawnX, spawnZ);
        }

        if (this.role === 'guest') {
          if (hud.mpMyRole) hud.mpMyRole.innerText = 'Гость (Усадьба 2)';
          // Teleport local player to Friend's Farmstead
          playerFarmer.x = 122;
          playerFarmer.z = 135;
          playerFarmer.angle = Math.PI;
          controls.target.set(122, 0, 135);
          camera.position.set(122 + 20, 30, 135 + 24);
          controls.update();
          showFloat('🏡 Вы прибыли на ферму друга (Юго-Восток)!', window.innerWidth / 2, 80, '#00e676');
        } else {
          // Host sends world snapshot to guest
          this.sendWorldSync();
          showFloat('🎉 Друг подключился! Его усадьба готова на другом конце карты!', window.innerWidth / 2, 80, '#00e676');
        }
      });

      this.conn.on('data', (data) => {
        this.handleMessage(data);
      });

      this.conn.on('close', () => {
        this.handlePeerDisconnected();
      });
    },

    sendWorldSync() {
      if (!this.conn || !this.connected) return;
      const snapshot = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const t = grid[r][c];
          if (t.soil !== 'grass' || t.crop) {
            snapshot.push({
              c: c,
              r: r,
              soil: t.soil,
              moisture: t.moisture,
              crop: t.crop ? { type: t.crop.type, progress: t.crop.progress, mature: t.crop.mature } : null,
              fertilized: t.fertilized
            });
          }
        }
      }
      this.conn.send({
        type: 'world_sync',
        day: farm.day,
        weather: farm.weather,
        tiles: snapshot
      });
    },

    broadcastTileUpdate(c, r, soil, moisture, crop, fertilized) {
      if (!this.conn || !this.connected) return;
      this.conn.send({
        type: 'tile_update',
        c: c,
        r: r,
        soil: soil,
        moisture: moisture,
        crop: crop,
        fertilized: fertilized
      });
    },

    broadcastEmote(text) {
      if (playerFarmer) {
        showFloat(`Вы: ${text}`, window.innerWidth / 2, 80, '#38bdf8');
      }
      if (this.conn && this.connected) {
        this.conn.send({ type: 'emote', text: text });
      }
    },

    handleMessage(data) {
      if (!data) return;

      if (data.type === 'player_state') {
        if (this.remoteFarmer) {
          this.remoteFarmer.setTargetState(data);
        }
      } else if (data.type === 'tile_update') {
        const t = grid[data.r][data.c];
        if (t) {
          t.soil = data.soil;
          t.moisture = data.moisture;
          t.crop = data.crop;
          t.fertilized = data.fertilized;
          updateTileAppearance(data.c, data.r);
          spawn3DParticles(data.c * TILE_SIZE + 1.5, 0.4, data.r * TILE_SIZE + 1.5, 0x4caf50, 6);
        }
      } else if (data.type === 'world_sync') {
        farm.day = data.day;
        farm.weather = data.weather;
        if (hud.day) hud.day.innerText = `День ${farm.day}, Весна`;
        if (hud.weatherText) hud.weatherText.innerText = farm.weather === 'sunny' ? 'Солнечно' : 'Дождь';

        data.tiles.forEach(item => {
          const t = grid[item.r][item.c];
          if (t) {
            t.soil = item.soil;
            t.moisture = item.moisture;
            t.crop = item.crop;
            t.fertilized = item.fertilized;
            updateTileAppearance(item.c, item.r);
          }
        });
      } else if (data.type === 'emote') {
        if (this.remoteFarmer) {
          this.remoteFarmer.showEmote(data.text);
        }
        showFloat(`👨‍🌾 Друг: ${data.text}`, window.innerWidth / 2, 90, '#34d399');
      }
    },

    handlePeerDisconnected() {
      this.connected = false;
      this.setStatus('waiting', 'Друг отключился. Ожидание повторного входа...');
      if (this.remoteFarmer) {
        this.remoteFarmer.destroy();
        this.remoteFarmer = null;
      }
      showFloat('Друг покинул ферму', window.innerWidth / 2, 80, '#fbbf24');
    },

    disconnect() {
      if (this.conn) {
        try { this.conn.close(); } catch(e) {}
        this.conn = null;
      }
      if (this.peer) {
        try { this.peer.destroy(); } catch(e) {}
        this.peer = null;
      }
      if (this.remoteFarmer) {
        this.remoteFarmer.destroy();
        this.remoteFarmer = null;
      }
      this.connected = false;
      this.role = 'single';
      this.setStatus('disconnected', 'Одиночный режим (Не подключено)');
      if (hud.mpActiveSection) hud.mpActiveSection.style.display = 'none';
      if (hud.mpHostInfo) hud.mpHostInfo.style.display = 'none';
      if (hud.quickEmoteBar) hud.quickEmoteBar.style.display = 'none';
    },

    setStatus(stateClass, text) {
      if (hud.mpStatusBanner) {
        hud.mpStatusBanner.className = `mp-status-box ${stateClass}`;
      }
      if (hud.mpStatusText) {
        hud.mpStatusText.innerText = text;
      }
    },

    tick(dt) {
      if (this.remoteFarmer) {
        this.remoteFarmer.update(dt);
      }

      if (!this.connected || !this.conn) return;

      this.sendTimer += dt;
      // Broadcast player state at 18 Hz
      if (this.sendTimer > 0.055) {
        this.sendTimer = 0;
        const v = farm.drivingVehicle;
        this.conn.send({
          type: 'player_state',
          x: playerFarmer.x,
          y: playerFarmer.y || 0,
          z: playerFarmer.z,
          yaw: fpsControls.yaw,
          isWalking: playerFarmer.isWalking,
          isShift: keys['shift'] || touchInput.isSprinting,
          isSwinging: playerFarmer.isSwinging,
          activeTool: farm.activeTool,
          isDriving: !!v,
          vehX: v ? v.x : 0,
          vehZ: v ? v.z : 0,
          vehAngle: v ? v.angle : 0,
          vehSpeed: v ? v.speed : 0
        });
      }
    }
  };

  // --- MODAL DIALOGS & ECONOMY HANDLERS ---
  function openModal(el) { if(farm.viewMode==='FPS') document.exitPointerLock();  el.style.display = 'flex'; }
  function closeModal(el) { if(farm.viewMode==='FPS') canvas.requestPointerLock();  el.style.display = 'none'; }

  // =========================================================
  // MOBILE TOUCH CONTROLS & VIRTUAL JOYSTICK IMPLEMENTATION
  // =========================================================
  function updateMobileControlsUI() {
    if (!hud.mobileControls) return;

    if (farm.drivingVehicle) {
      if (hud.btnTouchVehicle) {
        hud.btnTouchVehicle.style.display = 'flex';
        hud.btnTouchVehicle.innerHTML = '🚪';
        hud.btnTouchVehicle.title = 'Выйти из техники';
      }
      if (hud.btnTouchExit) hud.btnTouchExit.style.display = 'flex';
      if (hud.btnTouchCam) hud.btnTouchCam.style.display = 'none';
      if (hud.btnTouchAction) hud.btnTouchAction.style.display = 'none';
      if (hud.touchLookZone) hud.touchLookZone.style.pointerEvents = 'none';
    } else if (farm.viewMode === 'FPS') {
      let nearVehicle = null;
      for (const v of ownedVehicles) {
        if (Math.hypot(playerFarmer.x - v.x, playerFarmer.z - v.z) < 3.8) {
          nearVehicle = v;
          break;
        }
      }
      if (hud.btnTouchVehicle) {
        if (nearVehicle) {
          hud.btnTouchVehicle.style.display = 'flex';
          hud.btnTouchVehicle.innerHTML = '🚜';
          hud.btnTouchVehicle.title = 'Сесть за руль';
        } else {
          hud.btnTouchVehicle.style.display = 'none';
        }
      }
      if (hud.btnTouchExit) hud.btnTouchExit.style.display = 'flex';
      if (hud.btnTouchCam) {
        hud.btnTouchCam.style.display = 'flex';
        hud.btnTouchCam.innerHTML = playerFarmer.viewPerspective === 'first' ? '👁️' : '👤';
      }
      if (hud.btnTouchAction) hud.btnTouchAction.style.display = 'flex';
      if (hud.touchLookZone) hud.touchLookZone.style.pointerEvents = 'auto';
    } else {
      // RTS mode
      if (hud.btnTouchVehicle) hud.btnTouchVehicle.style.display = 'none';
      if (hud.btnTouchExit) hud.btnTouchExit.style.display = 'none';
      if (hud.btnTouchCam) {
        hud.btnTouchCam.style.display = 'flex';
        hud.btnTouchCam.innerHTML = '👨‍🌾';
        hud.btnTouchCam.title = 'Вселиться в фермера';
      }
      if (hud.btnTouchAction) hud.btnTouchAction.style.display = 'none';
      if (hud.touchLookZone) hud.touchLookZone.style.pointerEvents = 'none';
    }
  }

  // Display mobile controls if mobile device or touch detected
  if (isMobile && hud.mobileControls) {
    hud.mobileControls.style.display = 'block';
  }
  window.addEventListener('touchstart', () => {
    if (hud.mobileControls) hud.mobileControls.style.display = 'block';
  }, { once: true });

  // Virtual Joystick Logic
  if (hud.joystickZone && hud.joystickKnob && hud.joystickBase) {
    let joystickTouchId = null;
    let joystickCenter = { x: 0, y: 0 };
    const maxRadius = 40;

    function handleJoystickMove(clientX, clientY) {
      let dx = clientX - joystickCenter.x;
      let dy = clientY - joystickCenter.y;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      hud.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      hud.joystickKnob.classList.add('active');

      const deadZone = 5;
      if (dist < deadZone) {
        touchInput.active = false;
        touchInput.moveX = 0;
        touchInput.moveZ = 0;
      } else {
        touchInput.active = true;
        touchInput.moveX = dx / maxRadius;  // -1 to 1 (left to right)
        touchInput.moveZ = -dy / maxRadius; // -1 to 1 (backward to forward)
      }
    }

    function resetJoystick() {
      joystickTouchId = null;
      touchInput.active = false;
      touchInput.moveX = 0;
      touchInput.moveZ = 0;
      hud.joystickKnob.style.transform = 'translate(0px, 0px)';
      hud.joystickKnob.classList.remove('active');
    }

    hud.joystickZone.addEventListener('touchstart', (e) => {
      if (joystickTouchId !== null) return;
      const touch = e.changedTouches[0];
      joystickTouchId = touch.identifier;

      const rect = hud.joystickBase.getBoundingClientRect();
      joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      handleJoystickMove(touch.clientX, touch.clientY);
      e.preventDefault();
    }, { passive: false });

    hud.joystickZone.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchId) {
          handleJoystickMove(touch.clientX, touch.clientY);
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    hud.joystickZone.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId) {
          resetJoystick();
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    hud.joystickZone.addEventListener('touchcancel', resetJoystick, { passive: false });
  }

  // Touch Look Zone on Right Half (FPS Camera Control)
  if (hud.touchLookZone) {
    let lookTouchId = null;
    let lastLookX = 0;
    let lastLookY = 0;
    let lookStartTime = 0;
    let lookTotalDist = 0;

    hud.touchLookZone.addEventListener('touchstart', (e) => {
      if (farm.viewMode !== 'FPS') return;
      if (lookTouchId !== null) return;
      const touch = e.changedTouches[0];
      lookTouchId = touch.identifier;
      lastLookX = touch.clientX;
      lastLookY = touch.clientY;
      lookStartTime = performance.now();
      lookTotalDist = 0;
      e.preventDefault();
    }, { passive: false });

    hud.touchLookZone.addEventListener('touchmove', (e) => {
      if (farm.viewMode !== 'FPS') return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === lookTouchId) {
          const deltaX = touch.clientX - lastLookX;
          const deltaY = touch.clientY - lastLookY;
          lastLookX = touch.clientX;
          lastLookY = touch.clientY;
          lookTotalDist += Math.hypot(deltaX, deltaY);

          const sensitivity = 0.0055;
          fpsControls.yaw -= deltaX * sensitivity;
          fpsControls.pitch -= deltaY * sensitivity;
          fpsControls.pitch = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, fpsControls.pitch));
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    hud.touchLookZone.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === lookTouchId) {
          lookTouchId = null;
          // Quick tap triggers primary action
          if (lookTotalDist < 12 && (performance.now() - lookStartTime) < 260) {
            triggerPrimaryAction();
          }
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    hud.touchLookZone.addEventListener('touchcancel', () => {
      lookTouchId = null;
    }, { passive: false });
  }

  // Mobile Action Buttons Handlers
  if (hud.btnTouchAction) {
    hud.btnTouchAction.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerPrimaryAction();
    }, { passive: false });
    hud.btnTouchAction.addEventListener('click', () => {
      triggerPrimaryAction();
    });
  }

  if (hud.btnTouchSprint) {
    function toggleSprint() {
      touchInput.isSprinting = !touchInput.isSprinting;
      hud.btnTouchSprint.classList.toggle('active', touchInput.isSprinting);
      showFloat(touchInput.isSprinting ? '🏃 Бег активирован' : '🚶 Шаг', window.innerWidth / 2, 80);
    }
    hud.btnTouchSprint.addEventListener('touchstart', (e) => {
      e.preventDefault();
      toggleSprint();
    }, { passive: false });
    hud.btnTouchSprint.addEventListener('click', toggleSprint);
  }

  if (hud.btnTouchCam) {
    function handleTouchCam() {
      if (farm.viewMode === 'FPS') {
        const nextMode = playerFarmer.viewPerspective === 'first' ? 'third' : 'first';
        playerFarmer.setPerspective(nextMode);
        updateMobileControlsUI();
        showFloat(nextMode === 'first' ? '👁️ Вид из глаз' : '👤 Вид со спины', window.innerWidth / 2, 80);
      } else {
        enterFarmerMode();
      }
    }
    hud.btnTouchCam.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTouchCam();
    }, { passive: false });
    hud.btnTouchCam.addEventListener('click', handleTouchCam);
  }

  if (hud.btnTouchVehicle) {
    function handleTouchVehicle() {
      if (farm.drivingVehicle) {
        exitVehicle();
      } else {
        let nearVehicle = null;
        for (const v of ownedVehicles) {
          if (Math.hypot(playerFarmer.x - v.x, playerFarmer.z - v.z) < 3.8) {
            nearVehicle = v;
            break;
          }
        }
        if (nearVehicle) enterVehicle(nearVehicle);
      }
    }
    hud.btnTouchVehicle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTouchVehicle();
    }, { passive: false });
    hud.btnTouchVehicle.addEventListener('click', handleTouchVehicle);
  }

  if (hud.btnTouchExit) {
    function handleTouchExit() {
      if (farm.drivingVehicle) exitVehicle();
      else if (farm.viewMode === 'FPS') exitFarmerMode();
    }
    hud.btnTouchExit.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTouchExit();
    }, { passive: false });
    hud.btnTouchExit.addEventListener('click', handleTouchExit);
  }

  if (hud.btnQuickExitVehicle) {
    hud.btnQuickExitVehicle.addEventListener('click', (e) => {
      e.stopPropagation();
      exitVehicle();
    });
  }

  // Periodic UI update for mobile buttons
  setInterval(updateMobileControlsUI, 600);


  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      if (modalId) document.getElementById(modalId).style.display = 'none';
    });
  });

  document.getElementById('btn-nav-market').addEventListener('click', () => { updateMarketUI(); openModal(hud.modalMarket); });
  document.getElementById('btn-nav-machinery').addEventListener('click', () => { updateMachineryUI(); openModal(hud.modalMachinery); });
  document.getElementById('btn-nav-workers').addEventListener('click', () => { updateWorkersUI(); openModal(hud.modalWorkers); });
  document.getElementById('btn-nav-land').addEventListener('click', () => { updateLandUI(); openModal(hud.modalLand); });
  document.getElementById('btn-nav-rivals').addEventListener('click', () => { updateRivalsUI(); openModal(hud.modalRivals); });

  const openWarehouseHandler = () => { updateWarehouseUI(); openModal(hud.modalWarehouse); };
  document.getElementById('btn-open-warehouse').addEventListener('click', openWarehouseHandler);
  if (hud.btnNavWarehouse) hud.btnNavWarehouse.addEventListener('click', openWarehouseHandler);

  
    // New expansion modal listeners
    const modalContracts = document.getElementById('modal-contracts');
    const modalMill = document.getElementById('modal-mill');
    const modalLivestock = document.getElementById('modal-livestock');

    const btnNavContracts = document.getElementById('btn-nav-contracts');
    if (btnNavContracts) btnNavContracts.addEventListener('click', () => { updateContractsUI(); openModal(modalContracts); });

    const btnNavMill = document.getElementById('btn-nav-mill');
    if (btnNavMill) btnNavMill.addEventListener('click', () => { updateMillUI(); openModal(modalMill); });

    const btnNavLivestock = document.getElementById('btn-nav-livestock');
    if (btnNavLivestock) btnNavLivestock.addEventListener('click', () => { updateLivestockUI(); openModal(modalLivestock); });

    // Quick refuel button
    const btnRefuel = document.getElementById('btn-quick-refuel');
    if (btnRefuel) {
      btnRefuel.addEventListener('click', () => {
        if (farm.drivingVehicle) {
          if (farm.money >= 40) {
            farm.money -= 40;
            farm.drivingVehicle.fuel = Math.min(100, farm.drivingVehicle.fuel + 45);
            const fuelEl = document.getElementById('driving-vehicle-fuel');
            if (fuelEl) fuelEl.innerText = Math.round(farm.drivingVehicle.fuel) + '%';
            showFloat('⛽ Заправлено +45% топлива (-$40)', window.innerWidth / 2, 90, '#ffd54f');
          } else {
            showFloat('Недостаточно денег на топливо ($40)', window.innerWidth / 2, 90, '#d32f2f');
          }
        }
      });
    }

    // RTX Button Handler
  if (hud.btnToggleRtx) {
    hud.btnToggleRtx.addEventListener('click', () => {
      farm.rtxEnabled = !farm.rtxEnabled;
      renderer.shadowMap.enabled = farm.rtxEnabled;
      sunLight.castShadow = farm.rtxEnabled;
      if (farm.rtxEnabled) {
        hud.btnToggleRtx.classList.remove('off');
        hud.btnToggleRtx.innerText = '⚡ RTX: ВКЛ';
        showFloat('⚡ RTX ON: Ray Traced Soft Shadows & Dynamic PBR', window.innerWidth / 2, 80, '#00e676');
      } else {
        hud.btnToggleRtx.classList.add('off');
        hud.btnToggleRtx.innerText = '⚡ RTX: ВЫКЛ';
        showFloat('RTX OFF: Стандартный свет', window.innerWidth / 2, 80, '#9e9e9e');
      }
    });
  }

  
  // --- COMMERCIAL CONTRACTS SYSTEM ---
  function initContracts() {
    if (farm.contracts.length === 0) {
      farm.contracts = [
        { id: 1, title: 'Поставка зерна для Пекарни «Колосок»', crop: 'wheat', amount: 35, reward: 880, penalty: 250, daysLeft: 3.5, totalDays: 3.5, icon: '🥖' },
        { id: 2, title: 'Свежая морковь для сети супермаркетов «Green»', crop: 'carrot', amount: 20, reward: 2100, penalty: 500, daysLeft: 4.0, totalDays: 4.0, icon: '🥕' },
        { id: 3, title: 'Партия премиальной муки для Кондитерской', crop: 'flour', amount: 25, reward: 1650, penalty: 400, daysLeft: 5.0, totalDays: 5.0, icon: '🥐' }
      ];
    }
  }

  function updateContractsUI() {
    const list = document.getElementById('contracts-list');
    if (!list) return;
    list.innerHTML = '';

    farm.contracts.forEach((c, idx) => {
      const stored = farm.warehouse.items[c.crop] || 0;
      const canFulfill = stored >= c.amount;
      const progressPct = Math.min(100, Math.round((stored / c.amount) * 100));

      const card = document.createElement('div');
      card.className = 'contract-card';
      card.innerHTML = `
        <div class="contract-info" style="flex:1;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-size:20px;">${c.icon}</span>
            <h4>${c.title}</h4>
            <span class="contract-badge ${c.daysLeft < 1.5 ? 'badge-urgent' : 'badge-premium'}">
              ⏳ ${c.daysLeft.toFixed(1)} дн.
            </span>
          </div>
          <p>Требуется: <b>${c.amount} ед. ${CROP_INFO[c.crop] ? CROP_INFO[c.crop].name : c.crop}</b> (На складе: ${stored}/${c.amount})</p>
          <div style="background:#e0e0e0; border-radius:4px; height:8px; width:220px; overflow:hidden; margin:6px 0;">
            <div style="width:${progressPct}%; height:100%; background:${canFulfill ? '#4caf50' : '#ffa000'};"></div>
          </div>
          <p style="color:#2e7d32; font-weight:bold;">Награда: +${c.reward.toLocaleString()} <span style="color:#c62828; font-weight:normal; font-size:11px;">(Неустойка: -${c.penalty})</span></p>
        </div>
        <button class="buy-btn" data-contract="${c.id}" ${!canFulfill ? 'disabled' : ''} style="min-width:140px; height:42px;">
          ${canFulfill ? 'СДАТЬ ЗАКАЗ ✓' : `Не хватает ${c.amount - stored}`}
        </button>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('[data-contract]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.contract);
        const c = farm.contracts.find(item => item.id === id);
        if (c && (farm.warehouse.items[c.crop] || 0) >= c.amount) {
          farm.warehouse.items[c.crop] -= c.amount;
          farm.money += c.reward;
          showFloat(`🎉 КОНТРАКТ ВЫПОЛНЕН! +${c.reward}`, window.innerWidth / 2, 80, '#2e7d32');

          // Generate next replacement contract
          const cropsList = ['wheat', 'corn', 'potato', 'carrot', 'flour', 'milk'];
          const randCrop = cropsList[Math.floor(Math.random() * cropsList.length)];
          const amt = Math.floor(Math.random() * 30 + 15);
          const baseP = market[randCrop] ? market[randCrop].price : 30;
          const rew = Math.round(amt * baseP * 1.45);
          c.title = `Оптовый заказ на ${CROP_INFO[randCrop].name}`;
          c.crop = randCrop;
          c.amount = amt;
          c.reward = rew;
          c.penalty = Math.round(rew * 0.25);
          c.daysLeft = 3.0 + Math.random() * 3.0;
          c.totalDays = c.daysLeft;

          updateContractsUI();
          updateWarehouseUI();
        }
      });
    });
  }

  // --- WINDMILL PROCESSING UI ---
  function updateMillUI() {
    const content = document.getElementById('mill-content');
    if (!content) return;
    const wheatCount = farm.warehouse.items.wheat || 0;
    const flourCount = farm.warehouse.items.flour || 0;

    content.innerHTML = `
      <div class="process-box" style="display:flex; justify-content:space-around; align-items:center;">
        <div style="text-align:center;">
          <span style="font-size:36px;">🌾</span>
          <h4>Пшеница в закромах</h4>
          <p style="font-size:18px; font-weight:bold; color:#f57f17;">${wheatCount} кг</p>
          <p style="font-size:11px; color:#777;">Цена зерна: ${market.wheat.price}</p>
        </div>
        <div class="process-arrow">➔ Жернова ➔</div>
        <div style="text-align:center;">
          <span style="font-size:36px;">🥖</span>
          <h4>Готовая мука</h4>
          <p style="font-size:18px; font-weight:bold; color:#2e7d32;">${flourCount} кг</p>
          <p style="font-size:11px; color:#777;">Цена муки: ${market.flour.price} (+180% маржа!)</p>
        </div>
      </div>

      <div style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
        <button class="action-btn" id="btn-mill-10" ${wheatCount < 10 ? 'disabled' : ''}>Перемолоть 10 кг</button>
        <button class="action-btn" id="btn-mill-50" ${wheatCount < 50 ? 'disabled' : ''}>Перемолоть 50 кг</button>
        <button class="buy-btn" id="btn-mill-all" ${wheatCount <= 0 ? 'disabled' : ''} style="background:#2e7d32;">ПЕРЕМОЛОТЬ ВСЁ ЗЕРНО</button>
      </div>
    `;

    const millGrain = (amt) => {
      const actual = Math.min(amt, farm.warehouse.items.wheat || 0);
      if (actual > 0) {
        farm.warehouse.items.wheat -= actual;
        farm.warehouse.items.flour = (farm.warehouse.items.flour || 0) + actual;
        spawn3DParticles(12 * TILE_SIZE + 24, 6, 6 * TILE_SIZE, 0xffffff, 15);
        showFloat(`⚙️ Смолото ${actual} кг муки высшего сорта!`, window.innerWidth / 2, 80, '#2e7d32');
        updateMillUI();
        updateWarehouseUI();
      }
    };

    const b10 = document.getElementById('btn-mill-10');
    if (b10) b10.addEventListener('click', () => millGrain(10));
    const b50 = document.getElementById('btn-mill-50');
    if (b50) b50.addEventListener('click', () => millGrain(50));
    const bAll = document.getElementById('btn-mill-all');
    if (bAll) bAll.addEventListener('click', () => millGrain(farm.warehouse.items.wheat || 0));
  }

  // --- LIVESTOCK & COW BARN UI ---
  function updateLivestockUI() {
    const content = document.getElementById('livestock-content');
    if (!content) return;
    const milkCount = farm.warehouse.items.milk || 0;
    const manureCount = farm.warehouse.items.manure || 0;

    content.innerHTML = `
      <div class="process-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <h4 style="font-size:16px;">🐄 Поголовье коров: <b style="color:#2e7d32;">${farm.cowsCount}</b> из 8</h4>
            <p style="font-size:12px; color:#666;">Стадо производит молоко ежедневно и дает бесплатный органический навоз.</p>
          </div>
          <button class="buy-btn" id="btn-buy-cow" ${farm.money < 850 || farm.cowsCount >= 8 ? 'disabled' : ''}>
            + Купить корову ($850)
          </button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px;">
          <div style="background:#fff; border:1px solid #ddd; border-radius:8px; padding:12px; text-align:center;">
            <span style="font-size:28px;">🥛</span>
            <h4>Свежее молоко</h4>
            <p style="font-size:16px; font-weight:bold; color:#1565c0;">${milkCount} бидонов</p>
            <p style="font-size:11px; color:#777;">Цена на бирже: ${market.milk.price}</p>
          </div>

          <div style="background:#fff; border:1px solid #ddd; border-radius:8px; padding:12px; text-align:center;">
            <span style="font-size:28px;">💩</span>
            <h4>Органический навоз</h4>
            <p style="font-size:16px; font-weight:bold; color:#5d4037;">${manureCount} мешков</p>
            <p style="font-size:11px; color:#2e7d32;">Восстанавливает почву на 100%!</p>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:12px; margin-top:16px;">
          <button class="action-btn" id="btn-collect-milk" ${milkCount <= 0 ? 'disabled' : ''} style="background:#1976d2; color:#fff;">
            ⚡ Продать всё молоко на бирже (+${milkCount * market.milk.price})
          </button>
        </div>
      </div>
    `;

    const btnBuyCow = document.getElementById('btn-buy-cow');
    if (btnBuyCow) {
      btnBuyCow.addEventListener('click', () => {
        if (farm.money >= 850 && farm.cowsCount < 8) {
          farm.money -= 850;
          farm.cowsCount++;
          showFloat('🐄 Куплена новая дойная корова!', window.innerWidth / 2, 80, '#2e7d32');
          updateLivestockUI();
        }
      });
    }

    const btnSellMilk = document.getElementById('btn-collect-milk');
    if (btnSellMilk) {
      btnSellMilk.addEventListener('click', () => {
        const earned = (farm.warehouse.items.milk || 0) * market.milk.price;
        if (earned > 0) {
          farm.money += earned;
          farm.warehouse.items.milk = 0;
          showFloat(`+${earned} Молоко продано!`, window.innerWidth / 2, 80, '#2e7d32');
          updateLivestockUI();
          updateWarehouseUI();
        }
      });
    }
  }

  function updateMarketUI() {
    hud.marketList.innerHTML = '';
    for (const key of Object.keys(CROP_INFO)) {
      const info = CROP_INFO[key];
      const mkt = market[key];
      const stored = farm.warehouse.items[key];
      const trendSymbol = mkt.trend > 0 ? '▲ +$' + mkt.trend : (mkt.trend < 0 ? '▼ -$' + Math.abs(mkt.trend) : '— стабильно');
      const trendColor = mkt.trend > 0 ? '#2e7d32' : (mkt.trend < 0 ? '#d32f2f' : '#616161');

      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-info">
          <h4>${info.icon} ${info.name} — <span style="color:#2e7d32;">$${mkt.price} / ед.</span> <span style="font-size:11px; color:${trendColor};">${trendSymbol}</span></h4>
          <p>На складе: <b>${stored} ед.</b> (Общая стоимость: $${stored * mkt.price})</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="action-btn" data-sell-type="${key}" data-amount="10" ${stored < 10 ? 'disabled' : ''}>Продать 10</button>
          <button class="action-btn" data-sell-type="${key}" data-amount="all" ${stored <= 0 ? 'disabled' : ''}>Продать всё</button>
        </div>
      `;
      hud.marketList.appendChild(card);
    }

    hud.marketList.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.sellType;
        const amtStr = btn.dataset.amount;
        const available = farm.warehouse.items[type];
        const countToSell = amtStr === 'all' ? available : Math.min(available, parseInt(amtStr));

        if (countToSell > 0) {
          const revenue = countToSell * market[type].price;
          farm.warehouse.items[type] -= countToSell;
          farm.money += revenue;
          showFloat(`+$${revenue} Продано!`, window.innerWidth / 2, 80);
          updateMarketUI();
        }
      });
    });
  }

  function updateMachineryUI() {
    hud.machineryList.innerHTML = '';
    for (const key of Object.keys(VEHICLE_TYPES)) {
      const vDef = VEHICLE_TYPES[key];
      const countOwned = ownedVehicles.filter(v => v.def.type === key).length;

      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-info">
          <h4>${vDef.icon} ${vDef.name} — $${vDef.cost} (В автопарке: ${countOwned})</h4>
          <p>${vDef.desc}</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="buy-btn" data-buy-veh="${key}" ${farm.money < vDef.cost ? 'disabled' : ''}>Купить</button>
          ${countOwned > 0 ? `<button class="action-btn btn-drive" data-drive-veh="${key}">Сесть за руль</button>` : ''}
        </div>
      `;
      hud.machineryList.appendChild(card);
    }

    hud.machineryList.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.buyVeh;
        const def = VEHICLE_TYPES[type];
        if (farm.money >= def.cost) {
          farm.money -= def.cost;
          const v = new Vehicle3D(def, 18 + ownedVehicles.length * 5, 18);
          ownedVehicles.push(v);
          updateMachineryUI();
        }
      });
    });

    hud.machineryList.querySelectorAll('.btn-drive').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.driveVeh;
        const targetV = ownedVehicles.find(v => v.def.type === type);
        if (targetV) {
          enterVehicle(targetV);
          closeModal(hud.modalMachinery);
        }
      });
    });
  }

  function updateWorkersUI() {
    hud.workersList.innerHTML = '';
    for (const key of Object.keys(WORKER_DEFS)) {
      const wDef = WORKER_DEFS[key];
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-info">
          <h4>${wDef.icon} ${wDef.name} (Нанято: ${wDef.hired})</h4>
          <p>${wDef.role} | Оплата: <b>$${wDef.salary} / день</b></p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="action-btn" data-hire="${key}">Нанять</button>
          <button class="action-btn" data-fire="${key}" ${wDef.hired <= 0 ? 'disabled' : ''} style="background:#e57373;">Уволить</button>
        </div>
      `;
      hud.workersList.appendChild(card);
    }

    hud.workersList.querySelectorAll('[data-hire]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.hire;
        WORKER_DEFS[key].hired++;
        if (key === 'fieldhand') {
          activeWorkerBots.push(new WorkerBot3D('fieldhand'));
        } else if (key === 'planter') {
          activeWorkerBots.push(new WorkerBot3D('planter'));
        } else if (key === 'tractorist') {
          const freeTractor = ownedVehicles.find(v => v.def.type === 'tractor' && !v.autoWorker);
          if (freeTractor) freeTractor.autoWorker = true;
        } else if (key === 'combine_driver') {
          const freeCombine = ownedVehicles.find(v => v.def.type === 'combine' && !v.autoWorker);
          if (freeCombine) freeCombine.autoWorker = true;
        }
        updateWorkersUI();
      });
    });

    hud.workersList.querySelectorAll('[data-fire]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.fire;
        if (WORKER_DEFS[key].hired > 0) {
          WORKER_DEFS[key].hired--;
          if (key === 'fieldhand' || key === 'planter') {
            const idx = activeWorkerBots.findIndex(b => b.type === key);
            if (idx !== -1) {
              scene.remove(activeWorkerBots[idx].group);
              activeWorkerBots.splice(idx, 1);
            }
          } else if (key === 'tractorist') {
            const v = ownedVehicles.find(v => v.def.type === 'tractor' && v.autoWorker);
            if (v) v.autoWorker = false;
          } else if (key === 'combine_driver') {
            const v = ownedVehicles.find(v => v.def.type === 'combine' && v.autoWorker);
            if (v) v.autoWorker = false;
          }
          updateWorkersUI();
        }
      });
    });
  }

  function updateLandUI() {
    hud.landList.innerHTML = '';
    const ownedCount = PLOTS.filter(p => p.owned).length;
    const totalPlots = PLOTS.length;

    const summaryBanner = document.createElement('div');
    summaryBanner.style.cssText = 'background:#e8f5e9; border:1px solid #81c784; border-radius:8px; padding:10px 14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;';
    summaryBanner.innerHTML = `
      <div>
        <span style="font-size:13px; color:#2e7d32; font-weight:bold;">Владения вашей агрофирмы:</span>
        <div style="font-size:15px; color:#1b5e20; font-weight:bold;">${ownedCount} из ${totalPlots} секторов (${ownedCount * 256} участков)</div>
      </div>
      <div style="font-size:12px; color:#555;">
        ${ownedCount === totalPlots ? '🏆 Вся земля региона принадлежит вам!' : `Осталось освоить: ${totalPlots - ownedCount} сект.`}
      </div>
    `;
    hud.landList.appendChild(summaryBanner);

    for (const plot of PLOTS) {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.style.marginBottom = '8px';
      card.innerHTML = `
        <div class="item-info">
          <h4>🗺️ ${plot.name}</h4>
          <p>Площадь: 16x16 участков (256 клеток) | ${plot.owned ? '<span style="color:#2e7d32; font-weight:bold;">В собственности ✓</span>' : 'Стоимость: <b>$' + plot.cost.toLocaleString() + '</b>'}</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="action-btn btn-focus-plot" data-plot-id="${plot.id}">Показать</button>
          ${plot.owned ? '' : `<button class="buy-btn" data-buy-plot="${plot.id}" ${farm.money < plot.cost ? 'disabled' : ''}>Купить</button>`}
        </div>
      `;
      hud.landList.appendChild(card);
    }

    hud.landList.querySelectorAll('[data-buy-plot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const plotId = parseInt(btn.dataset.buyPlot);
        const p = PLOTS[plotId];
        if (farm.money >= p.cost && !p.owned) {
          farm.money -= p.cost;
          p.owned = true;
          // Refresh plot appearances
          for (let r = p.minR; r <= p.maxR; r++) {
            for (let c = p.minC; c <= p.maxC; c++) {
              updateTileAppearance(c, r);
            }
          }
          createPlotBoundaries();
          showFloat(`ЗЕМЛЯ КУПЛЕНА: ${p.name}!`, window.innerWidth / 2, 80, '#2e7d32');
          updateLandUI();
        }
      });
    });

    hud.landList.querySelectorAll('.btn-focus-plot').forEach(btn => {
      btn.addEventListener('click', () => {
        const plotId = parseInt(btn.dataset.plotId);
        const p = PLOTS[plotId];
        controls.target.set(
          ((p.minC + p.maxC) / 2) * TILE_SIZE,
          0,
          ((p.minR + p.maxR) / 2) * TILE_SIZE
        );
        camera.position.set(
          controls.target.x + 30,
          45,
          controls.target.z + 40
        );
        closeModal(hud.modalLand);
      });
    });
  }

  function updateRivalsUI() {
    hud.rivalsTbody.innerHTML = '';
    const all = [
      ...competitors,
      {
        name: 'Ваша Ферма (Вы)',
        money: farm.money,
        lands: PLOTS.filter(p => p.owned).length,
        harvested: farm.totalHarvestedTons,
        isPlayer: true
      }
    ];
    all.sort((a, b) => b.money - a.money);

    all.forEach((farmer, idx) => {
      const row = document.createElement('tr');
      if (farmer.isPlayer) row.className = 'player-row';
      row.innerHTML = `
        <td><b>#${idx + 1}</b></td>
        <td>${farmer.name}</td>
        <td>$${farmer.money.toLocaleString()}</td>
        <td>${farmer.lands} уч.</td>
        <td>${farmer.harvested} т.</td>
      `;
      hud.rivalsTbody.appendChild(row);
    });
  }

  function updateWarehouseUI() {
    const totalStored = Object.values(farm.warehouse.items).reduce((a, b) => a + b, 0);
    const fillPercent = Math.min(100, Math.round((totalStored / farm.warehouse.capacity) * 100));
    const fillBarColor = fillPercent > 85 ? '#e53935' : (fillPercent > 60 ? '#fbc02d' : '#4caf50');

    let totalStockValue = 0;
    let itemsHtml = `
      <div style="background:#f5f5f5; padding:12px; border-radius:8px; border:1px solid #ddd; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:bold; font-size:14px; color:#3e2723;">Вместимость элеватора (Уровень ${farm.warehouse.upgradeLevel}):</span>
          <span style="font-weight:bold; font-size:14px; color:${fillBarColor};">${totalStored} / ${farm.warehouse.capacity} кг (${fillPercent}%)</span>
        </div>
        <div style="background:#e0e0e0; border-radius:6px; height:12px; overflow:hidden; border:1px solid #bbb;">
          <div style="width:${fillPercent}%; height:100%; background:${fillBarColor}; transition:width 0.3s;"></div>
        </div>
      </div>
      <h4 style="font-size:13px; color:#555; margin-bottom:6px;">Зерно в закромах:</h4>
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-bottom:12px;">
    `;

    for (const key of Object.keys(CROP_INFO)) {
      const count = farm.warehouse.items[key];
      const curPrice = market[key] ? market[key].price : CROP_INFO[key].basePrice;
      const value = count * curPrice;
      totalStockValue += value;
      itemsHtml += `
        <div style="background:#fff; border:1px solid #e0e0e0; border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center;">
          <span>${CROP_INFO[key].icon} <b>${CROP_INFO[key].name}:</b> ${count} ед.</span>
          <span style="color:#2e7d32; font-weight:bold; font-size:12px;">$${value}</span>
        </div>
      `;
    }

    itemsHtml += `
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; background:#e8f5e9; border:1px solid #a5d6a7; border-radius:8px; padding:10px 14px; margin-bottom:14px;">
        <div>
          <span style="font-size:13px; color:#1b5e20;">Рыночная стоимость всех запасов: </span>
          <b style="font-size:16px; color:#2e7d32;">$${totalStockValue}</b>
        </div>
        <button class="action-btn" id="btn-wh-quick-sell" ${totalStored <= 0 ? 'disabled' : ''} style="background:linear-gradient(180deg, #43a047, #2e7d32); color:#fff; border-color:#1b5e20;">
          ⚡ Продать всё на бирже
        </button>
      </div>
    `;

    hud.whDetailContent.innerHTML = itemsHtml;

    const quickSellBtn = document.getElementById('btn-wh-quick-sell');
    if (quickSellBtn) {
      quickSellBtn.addEventListener('click', () => {
        let earned = 0;
        for (const key of Object.keys(CROP_INFO)) {
          const amt = farm.warehouse.items[key];
          if (amt > 0) {
            const price = market[key] ? market[key].price : CROP_INFO[key].basePrice;
            earned += amt * price;
            farm.warehouse.items[key] = 0;
          }
        }
        if (earned > 0) {
          farm.money += earned;
          showFloat(`+$${earned} ВСЁ ПРОДАНО!`, window.innerWidth / 2, 80, '#2e7d32');
          updateWarehouseUI();
          updateMarketUI();
        }
      });
    }

    const upgrades = [
      { id: 'tier1', name: 'Пристройка зернового бункера', bonus: 250, cost: 350 + (farm.warehouse.upgradeLevel - 1) * 150, icon: '📦', desc: 'Быстрое компактное расширение хранилища' },
      { id: 'tier2', name: 'Силосная башня для зерна', bonus: 1000, cost: 1200 + Math.floor(farm.warehouse.capacity / 1000) * 300, icon: '🏗️', desc: 'Капитальная вентилируемая башня для больших объемов' },
      { id: 'tier3', name: 'Промышленный элеваторный комплекс', bonus: 3000, cost: 3200 + Math.floor(farm.warehouse.capacity / 3000) * 800, icon: '🏭', desc: 'Высокотехнологичный комплекс с автоматической разгрузкой' }
    ];

    if (hud.whUpgradesList) {
      hud.whUpgradesList.innerHTML = '';
      upgrades.forEach(u => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.style.marginBottom = '8px';
        card.innerHTML = `
          <div class="item-info">
            <h4>${u.icon} ${u.name} (<span style="color:#2e7d32;">+${u.bonus.toLocaleString()} кг</span>)</h4>
            <p>${u.desc} | Стоимость: <b>$${u.cost.toLocaleString()}</b></p>
          </div>
          <button class="buy-btn" data-cost="${u.cost}" data-bonus="${u.bonus}" ${farm.money < u.cost ? 'disabled' : ''}>
            ПОСТРОИТЬ
          </button>
        `;
        hud.whUpgradesList.appendChild(card);
      });

      hud.whUpgradesList.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cost = parseInt(btn.dataset.cost);
          const bonus = parseInt(btn.dataset.bonus);
          if (farm.money >= cost) {
            farm.money -= cost;
            farm.warehouse.capacity += bonus;
            farm.warehouse.upgradeLevel++;
            buildFarmstead();
  buildFriendFarmstead(); // Regenerate 3D farm buildings with new silos!
            showFloat(`ЭЛЕВАТОР РАСШИРЕН: +${bonus} КГ!`, window.innerWidth / 2, 80, '#2e7d32');
            updateWarehouseUI();
          }
        });
      });
    }
  }

  function showFloat(text, x, y, color = '#2e7d32') {
    const el = document.createElement('div');
    el.innerText = text;
    el.style.cssText = `position:fixed; left:${x}px; top:${y}px; transform:translate(-50%, -50%); color:${color}; font-weight:bold; font-size:16px; text-shadow:0 2px 4px rgba(0,0,0,0.6); pointer-events:none; z-index:9999; transition:all 1.2s ease-out;`;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.top = `${y - 40}px`;
      el.style.opacity = '0';
    }, 20);
    setTimeout(() => { el.remove(); }, 1200);
  }

  function showTicker(msg) {
    hud.newsTicker.innerText = msg;
    hud.newsTicker.style.display = 'block';
    setTimeout(() => { hud.newsTicker.style.display = 'none'; }, 6000);
  }


  // --- MAIN SIMULATION CYCLE & DAY/NIGHT LIGHTING ---
  let eventTimer = 18;
  function updateEconomy(dt) {
    eventTimer -= dt;
    if (eventTimer <= 0) {
      eventTimer = 15 + Math.random() * 15;
      const crops = Object.keys(CROP_INFO);
      const cropKey = crops[Math.floor(Math.random() * crops.length)];
      const rival = competitors[Math.floor(Math.random() * competitors.length)];
      const isDump = Math.random() < 0.65;

      if (isDump) {
        const drop = Math.floor(Math.random() * 6 + 3);
        market[cropKey].price = Math.max(Math.floor(CROP_INFO[cropKey].basePrice * 0.6), market[cropKey].price - drop);
        market[cropKey].trend = -drop;
        rival.money += 350 + Math.floor(Math.random() * 500);
        rival.harvested += 30;
        showTicker(`📉 ${rival.name} продал партию ${CROP_INFO[cropKey].name}! Цена упала.`);
      } else {
        const rise = Math.floor(Math.random() * 9 + 4);
        market[cropKey].price = Math.min(Math.floor(CROP_INFO[cropKey].basePrice * 1.8), market[cropKey].price + rise);
        market[cropKey].trend = rise;
        showTicker(`📈 Спрос на ${CROP_INFO[cropKey].name} резко вырос! Цена взлетела.`);
      }
    }

    // Weather simulation
    farm.weatherTimer -= dt;
    if (farm.weatherTimer <= 0) {
      farm.weatherTimer = 45 + Math.random() * 45;
      const roll = Math.random();
      farm.weather = roll < 0.5 ? 'sunny' : (roll < 0.8 ? 'cloudy' : 'rain');
      hud.weatherIcon.innerText = farm.weather === 'sunny' ? '☀️' : (farm.weather === 'rain' ? '🌧️' : '⛅');
      hud.weatherText.innerText = farm.weather === 'sunny' ? 'Солнечно' : (farm.weather === 'rain' ? 'Дождь (Автополив!)' : 'Облачно');
      hud.weatherText.style.color = farm.weather === 'rain' ? '#1976d2' : '#f57f17';
    }

    if (farm.weather === 'rain') {
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const t = grid[r][c];
          if (t.soil === 'tilled' && t.moisture < 100) {
            t.moisture = Math.min(100, t.moisture + 25 * dt);
            updateTileAppearance(c, r);
          }
        }
      }
    }
  }

  function updateCrops(dt) {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = grid[r][c];
        if (farm.weather === 'sunny' && tile.moisture > 0) {
          tile.moisture = Math.max(0, tile.moisture - 1.2 * dt);
        }

        if (tile.crop && !tile.crop.mature) {
          const info = CROP_INFO[tile.crop.type];
          const speedMultiplier = (tile.moisture > 20 ? 2.5 : 0.8) * (tile.fertilized ? 1.4 : 1.0);
          tile.crop.progress += (dt / info.growTime) * 100 * speedMultiplier;

          if (tile.crop.progress >= 100) {
            tile.crop.stage = 3;
            tile.crop.mature = true;
          } else if (tile.crop.progress >= 60) {
            tile.crop.stage = 2;
          } else if (tile.crop.progress >= 25) {
            tile.crop.stage = 1;
          }
        }
      }
    }
    
  }

  // Day-Night Sun Rig Math
  function updateSunAndSky(dt) {
    const hourDelta = (dt / farm.dayDuration) * 24;
    const prevHour = farm.timeOfDay;
    farm.timeOfDay = (farm.timeOfDay + hourDelta) % 24;

    if (prevHour > 23.5 && farm.timeOfDay < 1) {
      farm.day++;
      const totalWages = Object.values(WORKER_DEFS).reduce((sum, w) => sum + (w.salary * w.hired), 0);
      if (totalWages > 0) {
        farm.money -= totalWages;
        showFloat(`-$${totalWages} Зарплата рабочим за день`, window.innerWidth / 2, 60, '#d32f2f');
      }
    }

    const h = farm.timeOfDay;
    const sunAngle = ((h - 6) / 24) * Math.PI * 2;
    const sunDist = 180;
    const sunX = Math.cos(sunAngle) * sunDist + 72;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunZ = Math.sin(sunAngle * 0.5) * 60 + 72;

    sunLight.position.set(sunX, Math.max(8, sunY), sunZ);

    // Sky and lighting color palette
    if (h >= 5 && h < 8) {
      // Dawn
      const t = (h - 5) / 3;
      scene.background.setHex(0xffa726).lerp(new THREE.Color(0x87ceeb), t);
      scene.fog.color.copy(scene.background);
      sunLight.color.setHex(0xffcc80);
      sunLight.intensity = 0.8 + t * 0.4;
      ambientLight.color.setHex(0xffcc80);
      starsMat.opacity = Math.max(0, (1 - t * 2));
    } else if (h >= 8 && h < 17) {
      // Day
      scene.background.setHex(farm.weather === 'rain' ? 0x607d8b : 0x87ceeb);
      scene.fog.color.copy(scene.background);
      sunLight.color.setHex(0xfffaed);
      sunLight.intensity = farm.weather === 'rain' ? 0.6 : 1.35;
      ambientLight.color.setHex(0xfff3e0);
      starsMat.opacity = 0;
    } else if (h >= 17 && h < 21) {
      // Sunset
      const t = (h - 17) / 4;
      scene.background.setHex(0x87ceeb).lerp(new THREE.Color(0xe65100), t);
      scene.fog.color.copy(scene.background);
      sunLight.color.setHex(0xff7043);
      sunLight.intensity = 1.0 - t * 0.5;
      ambientLight.color.setHex(0xff7043);
      starsMat.opacity = Math.max(0, t - 0.3);
    } else {
      // Night
      scene.background.setHex(0x0a0e1a);
      scene.fog.color.copy(scene.background);
      sunLight.color.setHex(0x90caf9); // Moonlight
      sunLight.intensity = 0.25;
      ambientLight.color.setHex(0x1a237e);
      starsMat.opacity = 0.85;
    }

    // Flash silo red safety beacons at night
    const beaconFlash = (Math.sin(Date.now() / 250) > 0) && (h < 6 || h > 20);
    siloInstances.forEach(b => {
      b.material.color.setHex(beaconFlash ? 0xff1744 : 0x330000);
    });
  }

  // Camera Navigation when driving vs walking
  function updateCamera(dt) {
    if (farm.drivingVehicle) {
      // Chase Camera behind vehicle
      const v = farm.drivingVehicle;
      const chaseDist = 18;
      const chaseHeight = 9.5;
      const targetCamX = v.x - Math.sin(v.angle) * chaseDist;
      const targetCamZ = v.z - Math.cos(v.angle) * chaseDist;

      camera.position.x += (targetCamX - camera.position.x) * 4.5 * dt;
      camera.position.y += (chaseHeight - camera.position.y) * 4.5 * dt;
      camera.position.z += (targetCamZ - camera.position.z) * 4.5 * dt;

      controls.target.set(v.x, 1.5, v.z);
      camera.lookAt(controls.target);
    } else if (farm.viewMode === 'FPS') {
      // --- PLAYER FARMER FIRST PERSON MODE ---
      controls.enabled = false;
      playerFarmer.update(dt);
    } else {
      // --- RTS OVERVIEW STRATEGY CAMERA ---
      controls.enabled = true;
      playerFarmer.update(dt); // Keep idle animations playing in RTS

      let panX = 0;
      let panZ = 0;
      if (keys['w'] || keys['keyw'] || keys['ц'] || keys['arrowup']) panZ -= 1;
      if (keys['s'] || keys['keys'] || keys['ы'] || keys['arrowdown']) panZ += 1;
      if (keys['a'] || keys['keya'] || keys['ф'] || keys['arrowleft']) panX -= 1;
      if (keys['d'] || keys['keyd'] || keys['в'] || keys['arrowright']) panX += 1;

      if (touchInput.active && farm.viewMode === 'RTS' && !farm.drivingVehicle) {
        panZ -= touchInput.moveZ;
        panX += touchInput.moveX;
      }

      if (panX !== 0 || panZ !== 0) {
        const isShift = keys['shift'] || keys['shiftleft'] || keys['shiftright'];
        const panSpeed = (isShift ? 55 : 30) * dt;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const moveVec = new THREE.Vector3()
          .addScaledVector(forward, -panZ * panSpeed)
          .addScaledVector(right, panX * panSpeed);

        camera.position.add(moveVec);
        controls.target.add(moveVec);
      }

      controls.update();
    }
  }

  // Animation Loop
  let lastTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // Simulation updates
    updateSunAndSky(dt);
    updateEconomy(dt);
    updateCrops(dt);
    updateCamera(dt);

    // Dynamic 3D crop models rendering & wind sway animation
    const timeSec = now / 1000;
    syncInstancedCropsDynamic(timeSec);

    // Windmill blades rotation
    if (millBladesGroup) {
      millBladesGroup.rotation.z += dt * 0.85;
    }

    // Cows grazing animation & production
    cowMeshes.forEach((cow, i) => {
      if (cow.headGroup) {
        cow.headGroup.rotation.x = Math.sin(timeSec * 1.5 + i) * 0.25;
      }
    });

    // Contracts timer update
    farm.contracts.forEach(c => {
      c.daysLeft = Math.max(0, c.daysLeft - (dt / farm.dayDuration));
    });

    // Cow daily production timer
    farm.feedTimer -= dt;
    if (farm.feedTimer <= 0) {
      farm.feedTimer = 45;
      if (farm.cowsCount > 0) {
        farm.warehouse.items.milk = (farm.warehouse.items.milk || 0) + farm.cowsCount * 2;
        farm.warehouse.items.manure = (farm.warehouse.items.manure || 0) + farm.cowsCount;
        showTicker(`🥛 Коровы дали ${farm.cowsCount * 2} бидонов молока и ${farm.cowsCount} мешков навоза!`);
      }
    }

    // Update Vehicles
    ownedVehicles.forEach(v => v.update(dt));

    // Update Workers
    activeWorkerBots.forEach(w => w.update(dt));

    // Update Multiplayer Network
    if (typeof mpManager !== 'undefined') mpManager.tick(dt);

    // Update 3D Particles
    for (let i = particles3D.length - 1; i >= 0; i--) {
      particles3D[i].update(dt);
      if (particles3D[i].life <= 0) {
        particles3D[i].destroy();
        particles3D.splice(i, 1);
      }
    }

    // Update HUD
    hud.money.innerText = `$${Math.round(farm.money).toLocaleString()}`;
    const hours = Math.floor(farm.timeOfDay);
    const mins = Math.floor((farm.timeOfDay % 1) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const timeIcon = (hours >= 5 && hours < 8) ? '🌅' : ((hours >= 8 && hours < 17) ? '☀️' : ((hours >= 17 && hours < 21) ? '🌇' : '🌙'));
    hud.day.innerText = `День ${farm.day}, ${farm.season} • ${timeStr} ${timeIcon}`;

    const totalStored = Object.values(farm.warehouse.items).reduce((a, b) => a + b, 0);
    hud.whText.innerText = `${totalStored} / ${farm.warehouse.capacity} кг`;
    hud.whBar.style.width = `${Math.min(100, (totalStored / farm.warehouse.capacity) * 100)}%`;

    // Render WebGL Frame
    renderer.render(scene, camera);
  }

  // --- BOOTSTRAP ENGINE ---
  
  // --- INSTANCED TREES & ENVIRONMENTAL VEGETATION ---
  function initForests() {
    const TREE_COUNT = 110;
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 4.0, 7);
    trunkGeo.translate(0, 2.0, 0);
    const crownGeo = new THREE.ConeGeometry(2.2, 5.5, 7);
    crownGeo.translate(0, 5.5, 0);

    const trunkMesh = new THREE.InstancedMesh(trunkGeo, materials.woodDark, TREE_COUNT);
    const crownMesh = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.85 }), TREE_COUNT);
    trunkMesh.castShadow = true;
    crownMesh.castShadow = true;

    const dummyT = new THREE.Matrix4();
    const dummyP = new THREE.Vector3();
    const dummyS = new THREE.Vector3();
    const dummyQ = new THREE.Quaternion();

    // ALL TREES PLACED STRICTLY IN FOREST BELT OUTSIDE FARM BOUNDARIES
    for (let i = 0; i < TREE_COUNT; i++) {
      const edge = i % 4;
      let tx = 0, tz = 0;
      const margin = 8 + (i % 6) * 6 + Math.random() * 8;

      if (edge === 0) {
        // North belt
        tx = (Math.random() * 180) - 18;
        tz = -margin;
      } else if (edge === 1) {
        // South belt
        tx = (Math.random() * 180) - 18;
        tz = GRID_ROWS * TILE_SIZE + margin;
      } else if (edge === 2) {
        // West belt
        tx = -margin;
        tz = (Math.random() * 180) - 18;
      } else {
        // East belt
        tx = GRID_COLS * TILE_SIZE + margin;
        tz = (Math.random() * 180) - 18;
      }

      const scale = 0.85 + Math.random() * 0.45;
      dummyP.set(tx, 0, tz);
      dummyS.set(scale, scale, scale);
      dummyQ.setFromEuler(new THREE.Euler(0, Math.random() * Math.PI, 0));
      dummyT.compose(dummyP, dummyQ, dummyS);

      trunkMesh.setMatrixAt(i, dummyT);
      crownMesh.setMatrixAt(i, dummyT);
    }

    trunkMesh.instanceMatrix.needsUpdate = true;
    crownMesh.instanceMatrix.needsUpdate = true;
    scene.add(trunkMesh);
    scene.add(crownMesh);
  }

  initTerrain();
  initForests();
  buildSpecialStructures();

  // Spawn the Player Farmer Avatar
  const playerFarmer = new PlayerFarmer3D(16, 20);

  initCropMeshSystem();
  initContracts();
  buildFarmstead();

  // Spawn initial starter tractor
  const starterTractor = new Vehicle3D(VEHICLE_TYPES.tractor, 24, 26);
  ownedVehicles.push(starterTractor);

  // Start RAF
  requestAnimationFrame(animate);

  console.log('AgroTycoon 3D Engine running with Three.js WebGL and RTX soft shadows.');
})();


  // --- MULTIPLAYER UI EVENT LISTENERS ---
  if (hud.btnNavMultiplayer) {
    hud.btnNavMultiplayer.addEventListener('click', () => {
      openModal(hud.modalMultiplayer);
    });
  }

  if (hud.btnMpCreate) {
    hud.btnMpCreate.addEventListener('click', () => {
      mpManager.initHost();
    });
  }

  if (hud.btnMpJoin) {
    hud.btnMpJoin.addEventListener('click', () => {
      const codeVal = hud.inputRoomCode ? hud.inputRoomCode.value : '';
      mpManager.joinRoom(codeVal);
    });
  }

  if (hud.btnMpDisconnect) {
    hud.btnMpDisconnect.addEventListener('click', () => {
      mpManager.disconnect();
    });
  }

  if (hud.btnCopyCode) {
    hud.btnCopyCode.addEventListener('click', () => {
      if (mpManager.roomId) {
        navigator.clipboard.writeText(mpManager.roomId);
        showFloat(`Код ${mpManager.roomId} скопирован!`, window.innerWidth / 2, 80);
      }
    });
  }

  if (hud.btnCopyLink) {
    hud.btnCopyLink.addEventListener('click', () => {
      if (mpManager.roomId) {
        const link = window.location.origin + window.location.pathname + '?room=' + mpManager.roomId;
        navigator.clipboard.writeText(link);
        showFloat('🔗 Ссылка скопирована в буфер обмена!', window.innerWidth / 2, 80, '#00e676');
      }
    });
  }

  // Emotes buttons (inside modal and in floating quick bar)
  document.querySelectorAll('.emote-btn, .quick-emote-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const emote = btn.dataset.emote;
      if (emote) mpManager.broadcastEmote(emote);
    });
  });

  // Auto-connect if URL has ?room= parameter
  window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      if (hud.inputRoomCode) hud.inputRoomCode.value = roomParam;
      openModal(hud.modalMultiplayer);
      setTimeout(() => mpManager.joinRoom(roomParam), 800);
    }
  });
