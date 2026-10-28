import * as THREE from "three";
import { Property3DBuildingConfig } from "./PropertyScene";
import { getProceduralTexture } from "./tourUtils";

/**
 * Creates the Front Exterior environment (Apartment building or Standalone Villa),
 * landscaping, entrance pathway, trees, and sky.
 */
export function createExteriorMesh(config: Property3DBuildingConfig): THREE.Group {
  const exteriorGroup = new THREE.Group();
  exteriorGroup.name = "exterior_environment";

  const isVilla = config.building_type === "villa";
  const grassTex = getProceduralTexture("grass");
  const roadTex = getProceduralTexture("road");
  const concreteTex = getProceduralTexture("concrete");

  // 1. GROUND & LANDSCAPING
  // Lawn
  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.85
  });
  const lawnGeo = new THREE.PlaneGeometry(80, 80);
  const lawn = new THREE.Mesh(lawnGeo, grassMat);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, -0.05, 0);
  lawn.receiveShadow = true;
  exteriorGroup.add(lawn);

  // Front Asphalt Road
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.6
  });
  const roadGeo = new THREE.PlaneGeometry(80, 10);
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.04, 18);
  road.receiveShadow = true;
  exteriorGroup.add(road);

  // Paved Walkway Pathway to Entrance
  const pathMat = new THREE.MeshStandardMaterial({
    map: concreteTex,
    roughness: 0.5
  });
  const pathGeo = new THREE.BoxGeometry(3.2, 0.04, 14);
  const walkway = new THREE.Mesh(pathGeo, pathMat);
  walkway.position.set(0, -0.02, 7);
  walkway.receiveShadow = true;
  exteriorGroup.add(walkway);

  if (isVilla) {
    // ── VILLA EXTERIOR ──────────────────────────────────────────────
    const villaGroup = new THREE.Group();
    villaGroup.position.set(0, 0, -2);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3ee,
      roughness: 0.5
    });
    const stoneAccentMat = new THREE.MeshStandardMaterial({
      color: 0x3e3832,
      roughness: 0.7
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x8fa8b2,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.8
    });

    // 2-Story Main Villa Box
    const villaBaseGeo = new THREE.BoxGeometry(12, 6.2, 10);
    const villaBase = new THREE.Mesh(villaBaseGeo, wallMat);
    villaBase.position.set(0, 3.1, -4);
    villaBase.castShadow = true;
    villaGroup.add(villaBase);

    // Stone Accent Wall Section
    const stoneGeo = new THREE.BoxGeometry(4.5, 6.5, 0.4);
    const stoneWall = new THREE.Mesh(stoneGeo, stoneAccentMat);
    stoneWall.position.set(-3.5, 3.25, 1.2);
    stoneWall.castShadow = true;
    villaGroup.add(stoneWall);

    // Cantilevered Modern Flat Roof Overhang
    const roofGeo = new THREE.BoxGeometry(13.5, 0.4, 11.5);
    const roof = new THREE.Mesh(roofGeo, stoneAccentMat);
    roof.position.set(0, 6.4, -4);
    roof.castShadow = true;
    villaGroup.add(roof);

    // Front Entrance Portico Canopy
    const canopyGeo = new THREE.BoxGeometry(4.2, 0.25, 3.5);
    const canopy = new THREE.Mesh(canopyGeo, stoneAccentMat);
    canopy.position.set(0, 3.2, 2.5);
    canopy.castShadow = true;
    villaGroup.add(canopy);

    // Portico Steel Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 16);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(1.8, 1.6, 4.0);
    villaGroup.add(pillar);

    // Large Villa Windows (Upper & Lower)
    for (let floorY of [1.6, 4.6]) {
      const windowGeo = new THREE.BoxGeometry(3.5, 1.8, 0.1);
      const winMesh = new THREE.Mesh(windowGeo, glassMat);
      winMesh.position.set(2.8, floorY, 1.05);
      villaGroup.add(winMesh);
    }

    exteriorGroup.add(villaGroup);
  } else {
    // ── APARTMENT HIGH-RISE TOWER ───────────────────────────────────
    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, 0, -4);

    const totalFloors = Math.max(6, config.total_floors || 10);
    const floorHeight = 2.85;
    const towerWidth = 14;
    const towerDepth = 12;
    const totalTowerHeight = totalFloors * floorHeight;

    const facadeMat = new THREE.MeshStandardMaterial({
      color: 0xdedad4,
      map: concreteTex,
      roughness: 0.7
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x8fa8b2,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.8
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a47,
      roughness: 0.4
    });

    // Main Tower Structure
    const towerGeo = new THREE.BoxGeometry(towerWidth, totalTowerHeight, towerDepth);
    const tower = new THREE.Mesh(towerGeo, facadeMat);
    tower.position.set(0, totalTowerHeight / 2, -2);
    tower.castShadow = true;
    towerGroup.add(tower);

    // Architectural Facade Vertical Fins
    for (let fx of [-5.5, -2, 2, 5.5]) {
      const finGeo = new THREE.BoxGeometry(0.3, totalTowerHeight + 1.0, 0.8);
      const fin = new THREE.Mesh(finGeo, accentMat);
      fin.position.set(fx, (totalTowerHeight + 1.0) / 2, 4.2);
      towerGroup.add(fin);
    }

    // Windows & Balconies per Floor
    const selectedFloor = config.selected_floor || 4;
    for (let f = 1; f <= totalFloors; f++) {
      const fy = (f - 0.5) * floorHeight;
      const isSelected = f === selectedFloor;

      // Window grid on facade
      for (let wx of [-3.8, 3.8]) {
        const winGeo = new THREE.BoxGeometry(2.2, 1.4, 0.05);
        const win = new THREE.Mesh(winGeo, glassMat);
        win.position.set(wx, fy, 4.05);
        towerGroup.add(win);
      }

      // Balcony projection
      const balcGeo = new THREE.BoxGeometry(3.6, 0.9, 1.2);
      const balcMat = isSelected
        ? new THREE.MeshStandardMaterial({
            color: 0x14b8a6, // Highlight selected floor with glowing Teal
            emissive: 0x14b8a6,
            emissiveIntensity: 0.35,
            roughness: 0.3
          })
        : accentMat;
      const balc = new THREE.Mesh(balcGeo, balcMat);
      balc.position.set(0, fy - 0.4, 4.6);
      balc.castShadow = true;
      towerGroup.add(balc);
    }

    // Ground Floor Entrance Lobby Canopy
    const lobbyCanopyGeo = new THREE.BoxGeometry(6.0, 0.3, 3.8);
    const lobbyCanopy = new THREE.Mesh(lobbyCanopyGeo, accentMat);
    lobbyCanopy.position.set(0, 3.4, 5.2);
    lobbyCanopy.castShadow = true;
    towerGroup.add(lobbyCanopy);

    // Lobby Glass Front
    const lobbyGlassGeo = new THREE.BoxGeometry(5.2, 2.8, 0.05);
    const lobbyGlass = new THREE.Mesh(lobbyGlassGeo, glassMat);
    lobbyGlass.position.set(0, 1.4, 4.05);
    towerGroup.add(lobbyGlass);

    exteriorGroup.add(towerGroup);
  }

  // 2. LANDSCAPE TREES
  const addTree = (tx: number, tz: number) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 0, tz);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.28, 2.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 1.25, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage
    const foliageGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e6f30, roughness: 0.8 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(0, 2.8, 0);
    foliage.castShadow = true;
    treeGroup.add(foliage);

    exteriorGroup.add(treeGroup);
  };

  // Add decorative trees flanking the walkway
  addTree(-5.5, 5);
  addTree(-6.8, 11);
  addTree(5.5, 5);
  addTree(6.8, 11);

  // 3. SKY DOME
  const skyGeo = new THREE.SphereGeometry(60, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x87ceeb, // Sky blue
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  exteriorGroup.add(sky);

  return exteriorGroup;
}
