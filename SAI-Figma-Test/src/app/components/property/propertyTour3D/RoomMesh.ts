import * as THREE from "three";
import { Property3DRoom } from "./PropertyScene";
import { getProceduralTexture } from "./tourUtils";
import { createFurnitureMesh } from "./FurnitureMesh";

export interface RoomMeshInstance {
  group: THREE.Group;
  roomData: Property3DRoom;
  roomLight: THREE.PointLight;
  setLightIntensity: (intensity: number) => void;
}

/**
 * Builds complete 3D architectural room with floor, walls, ceiling, downlights, and furniture.
 */
export function createRoomMesh(room: Property3DRoom): RoomMeshInstance {
  const roomGroup = new THREE.Group();
  roomGroup.name = `room_${room.id}`;
  const posX = room.position?.x ?? 0;
  const posY = room.position?.y ?? 0;
  const posZ = room.position?.z ?? 0;
  roomGroup.position.set(posX, posY, posZ);

  const width = (typeof room.dimensions === "object" && room.dimensions?.width) ? room.dimensions.width : 4.0;
  const length = (typeof room.dimensions === "object" && room.dimensions?.length) ? room.dimensions.length : 4.0;
  const height = (typeof room.dimensions === "object" && room.dimensions?.height) ? room.dimensions.height : 2.85;
  const wallThick = 0.15;

  // 1. FLOOR
  let floorTextureType: "wood" | "marble" | "tile" | "concrete" | "grass" = "wood";
  if (room.floor_material?.includes("marble") || room.type === "entrance") {
    floorTextureType = "marble";
  } else if (room.floor_material?.includes("tile") || room.type === "kitchen" || room.type === "bathroom") {
    floorTextureType = "tile";
  } else if (room.type === "balcony") {
    floorTextureType = "concrete";
  }

  const floorTexture = getProceduralTexture(floorTextureType);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: floorTextureType === "marble" ? 0.2 : 0.5,
    metalness: floorTextureType === "marble" ? 0.1 : 0.05
  });

  const floorGeo = new THREE.BoxGeometry(width, 0.08, length);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(0, -0.04, 0);
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // 2. CEILING (Exclude for balcony to allow open sky view)
  if (room.type !== "balcony") {
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.9,
      metalness: 0.02
    });
    const ceilingGeo = new THREE.BoxGeometry(width, 0.08, length);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.position.set(0, height + 0.04, 0);
    roomGroup.add(ceilingMesh);

    // Architectural recessed cove lighting trim
    const coveGeo = new THREE.BoxGeometry(width * 0.75, 0.04, length * 0.75);
    const coveMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffeedd,
      emissiveIntensity: 0.15,
      roughness: 0.5
    });
    const cove = new THREE.Mesh(coveGeo, coveMat);
    cove.position.set(0, height - 0.02, 0);
    roomGroup.add(cove);
  }

  // 3. WALLS
  const wallColor = room.wall_color ? parseInt(room.wall_color.replace("#", "0x")) : 0xece9e2;
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.8,
    metalness: 0.02
  });

  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4
  });

  // Helper to build a wall segment with baseboard
  const addWallSegment = (
    segW: number,
    segH: number,
    segD: number,
    posX: number,
    posY: number,
    posZ: number
  ) => {
    const wallGeo = new THREE.BoxGeometry(segW, segH, segD);
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(posX, posY, posZ);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    roomGroup.add(wallMesh);

    // Baseboard trim at bottom
    const baseboardGeo = new THREE.BoxGeometry(segW, 0.1, segD + 0.02);
    const baseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboard.position.set(posX, 0.05, posZ);
    roomGroup.add(baseboard);
  };

  // Outer walls for the room (leaving doorways open)
  // Left wall (-X)
  addWallSegment(wallThick, height, length, -width / 2 - wallThick / 2, height / 2, 0);

  // Right wall (+X)
  addWallSegment(wallThick, height, length, width / 2 + wallThick / 2, height / 2, 0);

  // Back wall (-Z) - only if not open to balcony
  if (room.type !== "balcony") {
    // Has a window opening in center for external bedrooms/living room
    const hasWindow = room.type === "living_room" || room.type === "bedroom" || room.type === "kitchen";
    if (hasWindow) {
      const winW = 1.6;
      const winH = 1.4;
      const sideW = (width - winW) / 2;
      // Left side of back wall
      addWallSegment(sideW, height, wallThick, -width / 2 + sideW / 2, height / 2, -length / 2 - wallThick / 2);
      // Right side of back wall
      addWallSegment(sideW, height, wallThick, width / 2 - sideW / 2, height / 2, -length / 2 - wallThick / 2);
      // Below window
      addWallSegment(winW, 0.9, wallThick, 0, 0.45, -length / 2 - wallThick / 2);
      // Above window
      addWallSegment(winW, height - 0.9 - winH, wallThick, 0, height - (height - 0.9 - winH) / 2, -length / 2 - wallThick / 2);

      // Window Glass
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x90b4ce,
        transparent: true,
        opacity: 0.35,
        roughness: 0.05,
        transmission: 0.85,
        ior: 1.5
      });
      const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 0.02), glassMat);
      glassMesh.position.set(0, 0.9 + winH / 2, -length / 2 - wallThick / 2);
      roomGroup.add(glassMesh);
    } else {
      addWallSegment(width, height, wallThick, 0, height / 2, -length / 2 - wallThick / 2);
    }
  }

  // 4. FURNITURE
  if (room.furniture && room.furniture.length > 0) {
    room.furniture.forEach((f) => {
      const fMesh = createFurnitureMesh(f.type, f.position, f.rotation_y || 0);
      roomGroup.add(fMesh);
    });
  }

  // 5. INTERIOR ROOM POINT LIGHT
  const roomLight = new THREE.PointLight(0xfff4e6, 1.2, 12, 1.5);
  roomLight.position.set(0, height - 0.3, 0);
  roomLight.castShadow = true;
  roomLight.shadow.mapSize.width = 512;
  roomLight.shadow.mapSize.height = 512;
  roomGroup.add(roomLight);

  // Ceiling Downlight fixture bulb
  const fixtureGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16);
  const fixtureMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff4e6,
    emissiveIntensity: 0.8
  });
  const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
  fixture.position.set(0, height - 0.015, 0);
  roomGroup.add(fixture);

  return {
    group: roomGroup,
    roomData: room,
    roomLight,
    setLightIntensity(intensity: number) {
      roomLight.intensity = intensity;
    }
  };
}
