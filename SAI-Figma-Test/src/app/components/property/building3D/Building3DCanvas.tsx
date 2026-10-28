import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { Building3DResponse, Unit3DItem } from "../../../../api/building3D";
import { CameraPreset, LightingMode } from "./BuildingControls";

interface Building3DCanvasProps {
  data: Building3DResponse;
  selectedFloorNumber: number;
  onSelectFloor: (floorNumber: number) => void;
  selectedUnitId?: number;
  onSelectUnit: (unit: Unit3DItem) => void;
  lightingMode: LightingMode;
  explodedView: boolean;
  cameraPreset: CameraPreset;
  onCameraPresetHandled: () => void;
}

// ── PROCEDURAL CELESTIAL TEXTURE GENERATORS ───────────────────────────
function createSunGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255, 255, 245, 1)");
  grad.addColorStop(0.18, "rgba(255, 235, 130, 0.9)");
  grad.addColorStop(0.45, "rgba(255, 180, 50, 0.45)");
  grad.addColorStop(0.75, "rgba(255, 130, 20, 0.12)");
  grad.addColorStop(1, "rgba(255, 100, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function createSunRaysTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(128, 128);
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    ctx.rotate((Math.PI * 2) / rays);
    const grad = ctx.createLinearGradient(0, 0, 120, 0);
    grad.addColorStop(0, "rgba(255, 240, 180, 0.6)");
    grad.addColorStop(0.6, "rgba(255, 200, 80, 0.2)");
    grad.addColorStop(1, "rgba(255, 160, 40, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(120, 0);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function createMoonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Silvery-pearl base
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, 0, 512, 512);

  // Soft lunar maria (dark basaltic plains)
  const maria = [
    { x: 190, y: 160, r: 85, color: "rgba(148, 163, 184, 0.45)" },
    { x: 310, y: 230, r: 110, color: "rgba(100, 116, 139, 0.4)" },
    { x: 250, y: 340, r: 80, color: "rgba(148, 163, 184, 0.35)" },
    { x: 150, y: 310, r: 65, color: "rgba(100, 116, 139, 0.3)" },
    { x: 370, y: 140, r: 50, color: "rgba(148, 163, 184, 0.35)" },
    { x: 260, y: 120, r: 60, color: "rgba(110, 126, 150, 0.35)" },
  ];
  maria.forEach((m) => {
    const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
    g.addColorStop(0, m.color);
    g.addColorStop(0.75, m.color);
    g.addColorStop(1, "rgba(226, 232, 240, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Micro craters with highlighted rims
  for (let i = 0; i < 40; i++) {
    const cx = (Math.sin(i * 13.7) * 0.5 + 0.5) * 512;
    const cy = (Math.cos(i * 8.9) * 0.5 + 0.5) * 512;
    const cr = 4 + (i % 7) * 3;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(71, 85, 105, 0.38)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 1, cr, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createMoonGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(224, 242, 254, 0.95)");
  grad.addColorStop(0.25, "rgba(186, 230, 253, 0.55)");
  grad.addColorStop(0.55, "rgba(147, 197, 253, 0.22)");
  grad.addColorStop(0.85, "rgba(96, 165, 250, 0.06)");
  grad.addColorStop(1, "rgba(30, 64, 175, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

export const Building3DCanvas: React.FC<Building3DCanvasProps> = ({
  data,
  selectedFloorNumber,
  onSelectFloor,
  selectedUnitId,
  onSelectUnit,
  lightingMode,
  explodedView,
  cameraPreset,
  onCameraPresetHandled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Interaction refs
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 75, theta: Math.PI / 4, phi: Math.PI / 3 });
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 30, 0));
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 30, 0));

  // Objects references for raycasting & animation
  const floorGroupsRef = useRef<Map<number, THREE.Group>>(new Map());
  const unitMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const clickableObjectsRef = useRef<THREE.Object3D[]>([]);

  // Lighting references
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Environment & Celestial references
  const sunGroupRef = useRef<THREE.Group | null>(null);
  const sunCoreRef = useRef<THREE.Mesh | null>(null);
  const sunHaloMeshRef = useRef<THREE.Mesh | null>(null);
  const sunRaysMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsGroupRef = useRef<THREE.Group | null>(null);

  const moonGroupRef = useRef<THREE.Group | null>(null);
  const moonMeshRef = useRef<THREE.Mesh | null>(null);
  const moonHaloMeshRef = useRef<THREE.Mesh | null>(null);

  const starsPointsRef = useRef<THREE.Points | null>(null);

  // Surface materials references for dynamic theme transitions
  const groundMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const podiumGrassMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const pathwayMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lobbyMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  const building = data?.building || ({} as any);
  const floors = Array.isArray(data?.floors) ? data.floors : [];
  const totalFloors = building.floors_count || floors.length || 20;
  const floorHeight = building.floor_height || 3.2;
  const buildingWidth = building.building_width || 38.0;
  const buildingDepth = building.building_depth || 24.0;
  const buildingHeight = totalFloors * floorHeight;

  // ── INITIALIZE THREE.JS SCENE & CELESTIAL BODIES ─────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x72b9ec);
    scene.fog = new THREE.FogExp2(0xb5defa, 0.0035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 600);
    cameraRef.current = camera;
    camera.position.set(50, 45, 65);
    camera.lookAt(0, buildingHeight / 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // ── LIGHTING SETUP ────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xa5dbfa, 0x5a8a65, 0.85);
    hemiLightRef.current = hemiLight;
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffae6, 2.2);
    dirLightRef.current = dirLight;
    dirLight.position.set(70, 95, 55);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // ── 1. CELESTIAL SUN (Day Mode) ───────────────────────────────────
    const sunGroup = new THREE.Group();
    sunGroup.position.set(70, 95, 55);
    sunGroupRef.current = sunGroup;

    // Glowing core sphere
    const sunCoreGeo = new THREE.SphereGeometry(5.2, 32, 32);
    const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
    sunCoreRef.current = sunCore;
    sunGroup.add(sunCore);

    // Inner glowing sphere layer
    const sunInnerHaloGeo = new THREE.SphereGeometry(6.6, 24, 24);
    const sunInnerHaloMat = new THREE.MeshBasicMaterial({
      color: 0xffd54f,
      transparent: true,
      opacity: 0.45,
      side: THREE.BackSide,
    });
    const sunInnerHalo = new THREE.Mesh(sunInnerHaloGeo, sunInnerHaloMat);
    sunGroup.add(sunInnerHalo);

    // Large outer luminous radial flare billboard
    const sunGlowTex = createSunGlowTexture();
    const sunHaloGeo = new THREE.PlaneGeometry(42, 42);
    const sunHaloMat = new THREE.MeshBasicMaterial({
      map: sunGlowTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sunHaloMesh = new THREE.Mesh(sunHaloGeo, sunHaloMat);
    sunHaloMeshRef.current = sunHaloMesh;
    sunGroup.add(sunHaloMesh);

    // Rotating Sun Rays Ring
    const sunRaysTex = createSunRaysTexture();
    const sunRaysGeo = new THREE.PlaneGeometry(46, 46);
    const sunRaysMat = new THREE.MeshBasicMaterial({
      map: sunRaysTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sunRaysMesh = new THREE.Mesh(sunRaysGeo, sunRaysMat);
    sunRaysMeshRef.current = sunRaysMesh;
    sunGroup.add(sunRaysMesh);

    scene.add(sunGroup);

    // ── 2. PROCEDURAL DAYTIME CLOUDS ──────────────────────────────────
    const cloudsGroup = new THREE.Group();
    cloudsGroupRef.current = cloudsGroup;
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.75,
    });

    // Cloud clusters
    const cloudSpecs = [
      { x: -50, y: 75, z: -40, scale: 1.1 },
      { x: 30, y: 82, z: -60, scale: 1.3 },
      { x: 70, y: 70, z: -20, scale: 0.9 },
      { x: -80, y: 80, z: 20, scale: 1.2 },
    ];
    cloudSpecs.forEach((spec) => {
      const cluster = new THREE.Group();
      cluster.position.set(spec.x, spec.y, spec.z);
      // Construct cloud from 5 overlapping soft spheres
      const puffOffsets = [
        [0, 0, 0, 7.5],
        [-5, -1, 1, 5.5],
        [5, -0.5, -1, 6.0],
        [-2.5, 3.5, 0, 5.0],
        [3, 2.5, 0.5, 5.0],
      ];
      puffOffsets.forEach(([px, py, pz, pr]) => {
        const puffGeo = new THREE.SphereGeometry(pr * spec.scale, 16, 16);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(px * spec.scale, py * spec.scale, pz * spec.scale);
        cluster.add(puff);
      });
      cloudsGroup.add(cluster);
    });
    scene.add(cloudsGroup);

    // ── 3. CELESTIAL MOON (Night Mode) ────────────────────────────────
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-65, 88, -55);
    moonGroupRef.current = moonGroup;

    // Realistic procedural textured moon sphere
    const moonTex = createMoonTexture();
    const moonGeo = new THREE.SphereGeometry(4.6, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      emissive: 0xdde7f0,
      emissiveIntensity: 0.9,
      roughness: 0.85,
      metalness: 0.1,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMeshRef.current = moonMesh;
    moonGroup.add(moonMesh);

    // Soft celestial lunar halo billboard
    const moonGlowTex = createMoonGlowTexture();
    const moonHaloGeo = new THREE.PlaneGeometry(32, 32);
    const moonHaloMat = new THREE.MeshBasicMaterial({
      map: moonGlowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const moonHaloMesh = new THREE.Mesh(moonHaloGeo, moonHaloMat);
    moonHaloMeshRef.current = moonHaloMesh;
    moonGroup.add(moonHaloMesh);

    moonGroup.visible = false;
    scene.add(moonGroup);

    // ── 4. STARRY NIGHT SKY (Night Mode) ──────────────────────────────
    const starsCount = 2400;
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    const cWhite = new THREE.Color(0xffffff);
    const cIceBlue = new THREE.Color(0xa5f3fc);
    const cSoftGold = new THREE.Color(0xfef3c7);

    for (let i = 0; i < starsCount; i++) {
      // Distribute stars on a wide celestial hemisphere dome (radius 220 to 320)
      const radius = 220 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.08 + Math.random() * 0.92); // upper hemisphere dome

      starPositions[i * 3] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.cos(theta);

      // Star color variation
      const randColor = Math.random();
      let chosenColor = cWhite;
      if (randColor > 0.75) chosenColor = cIceBlue;
      else if (randColor > 0.55) chosenColor = cSoftGold;

      starColors[i * 3] = chosenColor.r;
      starColors[i * 3 + 1] = chosenColor.g;
      starColors[i * 3 + 2] = chosenColor.b;
    }

    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starsGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starsMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starsPoints = new THREE.Points(starsGeo, starsMat);
    starsPointsRef.current = starsPoints;
    starsPoints.visible = false;
    scene.add(starsPoints);

    // ── 5. GROUND & LANDSCAPE ─────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(180, 180);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x768799,
      roughness: 0.85,
      metalness: 0.1,
    });
    groundMatRef.current = groundMat;
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Floor Overlay
    const grid = new THREE.GridHelper(140, 70, 0x008f8c, 0x94a3b8);
    grid.position.y = 0.01;
    gridHelperRef.current = grid;
    scene.add(grid);

    // Landscaped Podium Grass Island
    const podiumGrassGeo = new THREE.BoxGeometry(buildingWidth + 16, 0.6, buildingDepth + 16);
    const podiumGrassMat = new THREE.MeshStandardMaterial({
      color: 0x2e8b57,
      roughness: 0.9,
    });
    podiumGrassMatRef.current = podiumGrassMat;
    const podiumGrass = new THREE.Mesh(podiumGrassGeo, podiumGrassMat);
    podiumGrass.position.set(0, 0.2, 0);
    podiumGrass.receiveShadow = true;
    scene.add(podiumGrass);

    // Paved Pathway Foyer
    const pathGeo = new THREE.BoxGeometry(10, 0.65, 20);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xb0bcc9,
      roughness: 0.7,
    });
    pathwayMatRef.current = pathMat;
    const pathway = new THREE.Mesh(pathGeo, pathMat);
    pathway.position.set(0, 0.22, buildingDepth / 2 + 8);
    pathway.receiveShadow = true;
    scene.add(pathway);

    // ── 6. BUILDING BASE LOBBY ────────────────────────────────────────
    const lobbyGeo = new THREE.BoxGeometry(buildingWidth - 2, 4.5, buildingDepth - 2);
    const lobbyMat = new THREE.MeshStandardMaterial({
      color: 0x354b60,
      roughness: 0.35,
      metalness: 0.25,
    });
    lobbyMatRef.current = lobbyMat;
    const lobby = new THREE.Mesh(lobbyGeo, lobbyMat);
    lobby.position.set(0, 2.5, 0);
    lobby.castShadow = true;
    lobby.receiveShadow = true;
    scene.add(lobby);

    // Entrance canopy
    const canopyGeo = new THREE.BoxGeometry(12, 0.4, 6);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x008f8c, roughness: 0.4, metalness: 0.6 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 4.6, buildingDepth / 2 + 1);
    scene.add(canopy);

    // ── RESIZE HANDLER ───────────────────────────────────────────────
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ── ANIMATION LOOP ───────────────────────────────────────────────
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera interpolation towards spherical coordinates
      const targetPos = new THREE.Vector3();
      const phi = sphericalRef.current.phi;
      const theta = sphericalRef.current.theta;
      const r = sphericalRef.current.radius;

      targetPos.x = currentLookAtRef.current.x + r * Math.sin(phi) * Math.sin(theta);
      targetPos.y = currentLookAtRef.current.y + r * Math.cos(phi);
      targetPos.z = currentLookAtRef.current.z + r * Math.sin(phi) * Math.cos(theta);

      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetPos, 0.08);
        currentLookAtRef.current.lerp(targetLookAtRef.current, 0.08);
        cameraRef.current.lookAt(currentLookAtRef.current);

        // Make Sun & Moon billboard halos continuously face camera
        if (sunHaloMeshRef.current) sunHaloMeshRef.current.lookAt(cameraRef.current.position);
        if (sunRaysMeshRef.current) sunRaysMeshRef.current.lookAt(cameraRef.current.position);
        if (moonHaloMeshRef.current) moonHaloMeshRef.current.lookAt(cameraRef.current.position);
      }

      // Animate Sun rays and pulse
      if (sunRaysMeshRef.current && sunGroupRef.current?.visible) {
        sunRaysMeshRef.current.rotation.z += delta * 0.15;
      }
      if (sunCoreRef.current && sunGroupRef.current?.visible) {
        const pulse = 1.0 + Math.sin(time * 2.2) * 0.035;
        sunCoreRef.current.scale.set(pulse, pulse, pulse);
      }

      // Animate Moon slow lunar spin
      if (moonMeshRef.current && moonGroupRef.current?.visible) {
        moonMeshRef.current.rotation.y += delta * 0.04;
      }

      // Animate Stars celestial rotation & twinkling
      if (starsPointsRef.current && starsPointsRef.current.visible) {
        starsPointsRef.current.rotation.y += delta * 0.012;
        // Subtle organic star twinkle
        const twinkle = 0.82 + 0.18 * Math.sin(time * 2.5);
        (starsPointsRef.current.material as THREE.PointsMaterial).opacity = twinkle;
      }

      // Gentle cloud drift
      if (cloudsGroupRef.current && cloudsGroupRef.current.visible) {
        cloudsGroupRef.current.children.forEach((c, idx) => {
          c.position.x += delta * (1.2 + idx * 0.4);
          if (c.position.x > 140) c.position.x = -140;
        });
      }

      // Selected unit gentle pulsing
      if (selectedUnitId && unitMeshesRef.current.has(selectedUnitId)) {
        const selMesh = unitMeshesRef.current.get(selectedUnitId)!;
        const s = 1.0 + Math.sin(time * 4) * 0.04;
        selMesh.scale.set(s, s, s);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current?.domElement) {
        rendererRef.current.domElement.remove();
      }
      renderer.dispose();
    };
  }, [totalFloors, floorHeight, buildingWidth, buildingDepth, buildingHeight]);

  // ── LIGHTING & CELESTIAL THEME CONTROLS (Day / Night / Sunset) ──────
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !ambientLightRef.current || !hemiLightRef.current) return;
    const scene = sceneRef.current;
    const dir = dirLightRef.current;
    const amb = ambientLightRef.current;
    const hemi = hemiLightRef.current;

    if (lightingMode === "day") {
      // ☀️ BRIGHT DAY MODE WITH RADIANT SUN & DAY SKY
      scene.background = new THREE.Color(0x72b9ec);
      scene.fog = new THREE.FogExp2(0xb5defa, 0.0035);

      // Bright warm sunlight
      dir.position.set(70, 95, 55);
      dir.color.setHex(0xfffae6);
      dir.intensity = 2.4;

      amb.color.setHex(0xffffff);
      amb.intensity = 1.15;

      hemi.color.setHex(0xa5dbfa);
      hemi.groundColor.setHex(0x5a8a65);
      hemi.intensity = 0.9;

      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.25;

      // Celestial visibility: SHOW SUN, HIDE MOON & STARS
      if (sunGroupRef.current) {
        sunGroupRef.current.visible = true;
        sunGroupRef.current.position.set(70, 95, 55);
      }
      if (cloudsGroupRef.current) cloudsGroupRef.current.visible = true;
      if (moonGroupRef.current) moonGroupRef.current.visible = false;
      if (starsPointsRef.current) starsPointsRef.current.visible = false;

      // Bright daylight ground landscape
      if (groundMatRef.current) groundMatRef.current.color.setHex(0x768799);
      if (podiumGrassMatRef.current) podiumGrassMatRef.current.color.setHex(0x2e8b57);
      if (pathwayMatRef.current) pathwayMatRef.current.color.setHex(0xb0bcc9);
      if (lobbyMatRef.current) lobbyMatRef.current.color.setHex(0x354b60);
      if (gridHelperRef.current) {
        gridHelperRef.current.visible = true;
      }
    } else if (lightingMode === "night") {
      // 🌙 BLACKISH NIGHT MODE WITH LUMINOUS MOON & TWINKLING STARS
      scene.background = new THREE.Color(0x020308);
      scene.fog = new THREE.FogExp2(0x030611, 0.0065);

      // Cool silvery-blue moonlight
      dir.position.set(-65, 88, -55);
      dir.color.setHex(0x93c5fd);
      dir.intensity = 0.7;

      amb.color.setHex(0x1a263d);
      amb.intensity = 0.3;

      hemi.color.setHex(0x1a2846);
      hemi.groundColor.setHex(0x020617);
      hemi.intensity = 0.38;

      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.05;

      // Celestial visibility: HIDE SUN, SHOW MOON & STARS
      if (sunGroupRef.current) sunGroupRef.current.visible = false;
      if (cloudsGroupRef.current) cloudsGroupRef.current.visible = false;
      if (moonGroupRef.current) {
        moonGroupRef.current.visible = true;
        moonGroupRef.current.position.set(-65, 88, -55);
      }
      if (starsPointsRef.current) starsPointsRef.current.visible = true;

      // Midnight dark ground landscape
      if (groundMatRef.current) groundMatRef.current.color.setHex(0x070b13);
      if (podiumGrassMatRef.current) podiumGrassMatRef.current.color.setHex(0x081710);
      if (pathwayMatRef.current) pathwayMatRef.current.color.setHex(0x0f172a);
      if (lobbyMatRef.current) lobbyMatRef.current.color.setHex(0x0a101b);
    } else if (lightingMode === "sunset") {
      // 🌇 SUNSET DUSK MODE (Rich warm twilight)
      scene.background = new THREE.Color(0x2a1024);
      scene.fog = new THREE.FogExp2(0x2a1024, 0.0055);

      dir.position.set(75, 25, 45);
      dir.color.setHex(0xff7733);
      dir.intensity = 1.8;

      amb.color.setHex(0xffaa77);
      amb.intensity = 0.55;

      hemi.color.setHex(0xf97316);
      hemi.groundColor.setHex(0x1c1917);
      hemi.intensity = 0.55;

      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.15;

      if (sunGroupRef.current) {
        sunGroupRef.current.visible = true;
        sunGroupRef.current.position.set(75, 25, 45);
      }
      if (cloudsGroupRef.current) cloudsGroupRef.current.visible = true;
      if (moonGroupRef.current) moonGroupRef.current.visible = false;
      if (starsPointsRef.current) starsPointsRef.current.visible = true;

      if (groundMatRef.current) groundMatRef.current.color.setHex(0x201a24);
      if (podiumGrassMatRef.current) podiumGrassMatRef.current.color.setHex(0x17241a);
      if (pathwayMatRef.current) pathwayMatRef.current.color.setHex(0x292534);
      if (lobbyMatRef.current) lobbyMatRef.current.color.setHex(0x1f192b);
    }
  }, [lightingMode]);

  // ── BUILD PROCEDURAL FLOORS & UNITS ────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean previous floor groups
    floorGroupsRef.current.forEach((group) => {
      scene.remove(group);
      group.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
          else obj.material.dispose();
        }
      });
    });
    floorGroupsRef.current.clear();
    unitMeshesRef.current.clear();
    clickableObjectsRef.current = [];

    const spacingMultiplier = explodedView ? 1.6 : 1.0;
    const isNight = lightingMode === "night";

    // Build floor by floor
    floors.forEach((fl) => {
      const fn = fl.floor_number;
      const isSelectedFloor = fn === selectedFloorNumber;
      const floorBaseY = 5.0 + (fn - 1) * floorHeight * spacingMultiplier;

      const floorGroup = new THREE.Group();
      floorGroup.position.set(0, floorBaseY, 0);
      floorGroup.userData = { floorNumber: fn, type: "floor" };

      // 1. Concrete floor slab
      const slabGeo = new THREE.BoxGeometry(buildingWidth, 0.35, buildingDepth);
      const slabColor = isSelectedFloor ? 0x008f8c : (isNight ? 0x162232 : 0x475f78);
      const slabMat = new THREE.MeshStandardMaterial({
        color: slabColor,
        roughness: 0.4,
        metalness: isSelectedFloor ? 0.6 : 0.25,
        emissive: isSelectedFloor ? 0x004f4d : 0x000000,
        emissiveIntensity: isSelectedFloor ? 0.4 : 0.0,
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.set(0, 0, 0);
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      slabMesh.userData = { floorNumber: fn, type: "floor" };
      floorGroup.add(slabMesh);
      clickableObjectsRef.current.push(slabMesh);

      // 2. Glass Curtain Wall Facade
      const facadeGeo = new THREE.BoxGeometry(buildingWidth - 0.4, floorHeight - 0.4, buildingDepth - 0.4);
      const facadeColor = isSelectedFloor ? 0x5ce1e6 : (isNight ? 0x182a3d : 0x38658a);
      const facadeMat = new THREE.MeshPhysicalMaterial({
        color: facadeColor,
        roughness: 0.1,
        transmission: isSelectedFloor ? 0.85 : 0.65,
        thickness: 0.5,
        transparent: true,
        opacity: isSelectedFloor ? 0.85 : (isNight ? 0.55 : 0.7),
        reflectivity: 0.85,
      });
      const facade = new THREE.Mesh(facadeGeo, facadeMat);
      facade.position.set(0, floorHeight / 2, 0);
      floorGroup.add(facade);

      // 3. Concrete Edge Balcony Railing Strips
      const railingFrontGeo = new THREE.BoxGeometry(buildingWidth, 0.8, 0.2);
      const railingColor = isNight ? 0x1e2e40 : 0x506d8a;
      const railingMat = new THREE.MeshStandardMaterial({
        color: railingColor,
        roughness: 0.5,
        metalness: 0.4,
      });
      const railingFront = new THREE.Mesh(railingFrontGeo, railingMat);
      railingFront.position.set(0, 0.4, buildingDepth / 2);
      floorGroup.add(railingFront);

      const railingBack = new THREE.Mesh(railingFrontGeo, railingMat);
      railingBack.position.set(0, 0.4, -buildingDepth / 2);
      floorGroup.add(railingBack);

      // 4. Units on this floor
      const unitsOnFloor = fl.units || [];
      unitsOnFloor.forEach((u) => {
        const isSelectedUnit = u.id === selectedUnitId;
        const unitWidth = buildingWidth / 4.4;
        const unitDepth = buildingDepth / 2.3;
        const unitHeight = floorHeight - 0.6;

        const posX = u.position?.x ?? 0;
        const posZ = u.position?.z ?? 0;

        // Unit Boundary Mesh
        const unitGeo = new THREE.BoxGeometry(unitWidth, unitHeight, unitDepth);
        const statusColorHex = parseInt((u.status_color || "#10B981").replace("#", "0x"), 16);

        // In night mode, unselected units also have warm cozy interior apartment illumination
        const warmNightEmissive = 0xf59e0b;
        const unitEmissiveColor = isSelectedUnit
          ? statusColorHex
          : (isNight ? warmNightEmissive : statusColorHex);
        const unitEmissiveIntensity = isSelectedUnit
          ? 0.75
          : (isSelectedFloor ? 0.35 : (isNight ? 0.22 : 0.05));

        const unitMat = new THREE.MeshStandardMaterial({
          color: statusColorHex,
          roughness: 0.3,
          metalness: 0.45,
          transparent: true,
          opacity: isSelectedUnit ? 0.95 : (isSelectedFloor ? 0.8 : (isNight ? 0.55 : 0.45)),
          emissive: unitEmissiveColor,
          emissiveIntensity: unitEmissiveIntensity,
        });

        const unitMesh = new THREE.Mesh(unitGeo, unitMat);
        unitMesh.position.set(posX, floorHeight / 2, posZ);
        unitMesh.userData = { unit: u, floorNumber: fn, type: "unit" };

        // Selection Wireframe Outline
        if (isSelectedUnit) {
          const wireGeo = new THREE.EdgesGeometry(unitGeo);
          const wireMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
          const wireframe = new THREE.LineSegments(wireGeo, wireMat);
          unitMesh.add(wireframe);
        }

        floorGroup.add(unitMesh);
        unitMeshesRef.current.set(u.id, unitMesh);
        clickableObjectsRef.current.push(unitMesh);
      });

      scene.add(floorGroup);
      floorGroupsRef.current.set(fn, floorGroup);
    });
  }, [floors, selectedFloorNumber, selectedUnitId, explodedView, floorHeight, buildingWidth, buildingDepth, lightingMode]);

  // ── FLOOR / UNIT FOCUS CAMERA MOVEMENT ─────────────────────────────
  useEffect(() => {
    const spacingMultiplier = explodedView ? 1.6 : 1.0;
    const floorY = 5.0 + (selectedFloorNumber - 1) * floorHeight * spacingMultiplier + (floorHeight / 2);

    if (selectedUnitId && unitMeshesRef.current.has(selectedUnitId)) {
      const uMesh = unitMeshesRef.current.get(selectedUnitId)!;
      const worldPos = new THREE.Vector3();
      uMesh.getWorldPosition(worldPos);

      targetLookAtRef.current.set(worldPos.x, worldPos.y, worldPos.z);
      sphericalRef.current.radius = 28;
    } else {
      targetLookAtRef.current.set(0, floorY, 0);
      sphericalRef.current.radius = 42;
    }
  }, [selectedFloorNumber, selectedUnitId, explodedView, floorHeight]);

  // ── CAMERA PRESETS ─────────────────────────────────────────────────
  useEffect(() => {
    if (cameraPreset === "reset") {
      sphericalRef.current = { radius: 75, theta: Math.PI / 4, phi: Math.PI / 3 };
      targetLookAtRef.current.set(0, buildingHeight / 2, 0);
      onCameraPresetHandled();
    } else if (cameraPreset === "front") {
      sphericalRef.current = { radius: sphericalRef.current.radius, theta: 0, phi: Math.PI / 2.2 };
      onCameraPresetHandled();
    } else if (cameraPreset === "back") {
      sphericalRef.current = { radius: sphericalRef.current.radius, theta: Math.PI, phi: Math.PI / 2.2 };
      onCameraPresetHandled();
    } else if (cameraPreset === "left") {
      sphericalRef.current = { radius: sphericalRef.current.radius, theta: -Math.PI / 2, phi: Math.PI / 2.2 };
      onCameraPresetHandled();
    } else if (cameraPreset === "right") {
      sphericalRef.current = { radius: sphericalRef.current.radius, theta: Math.PI / 2, phi: Math.PI / 2.2 };
      onCameraPresetHandled();
    } else if (cameraPreset === "top") {
      sphericalRef.current = { radius: sphericalRef.current.radius, theta: 0, phi: 0.05 };
      onCameraPresetHandled();
    }
  }, [cameraPreset, buildingHeight, onCameraPresetHandled]);

  // ── MOUSE / TOUCH INTERACTION (ROTATE, PAN, ZOOM, RAYCAST) ─────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    sphericalRef.current.theta -= dx * 0.008;
    sphericalRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2.05, sphericalRef.current.phi - dy * 0.008));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    sphericalRef.current.radius = Math.max(12, Math.min(130, sphericalRef.current.radius + e.deltaY * 0.05));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(clickableObjectsRef.current, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData.type === "unit" && hit.userData.unit) {
        onSelectUnit(hit.userData.unit);
      } else if (hit.userData.floorNumber) {
        onSelectFloor(hit.userData.floorNumber);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      className="w-full h-full cursor-grab active:cursor-grabbing relative select-none"
    />
  );
};
