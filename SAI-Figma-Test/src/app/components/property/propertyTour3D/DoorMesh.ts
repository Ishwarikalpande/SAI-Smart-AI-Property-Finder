import * as THREE from "three";
import { Property3DDoor } from "./PropertyScene";
import { getProceduralTexture } from "./tourUtils";

export interface DoorMeshInstance {
  group: THREE.Group;
  pivot: THREE.Group;
  doorData: Property3DDoor;
  currentAngle: number;
  targetAngle: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  update: (delta: number) => void;
}

/**
 * Creates an interactive 3D door with realistic pivot swing, frame, panel, and metallic handle.
 */
export function createDoorMesh(doorData: Property3DDoor): DoorMeshInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = `door_${doorData.id}`;
  const dp = Array.isArray(doorData.position)
    ? doorData.position
    : [(doorData.position as any)?.x ?? 0, (doorData.position as any)?.y ?? 0, (doorData.position as any)?.z ?? 0];
  rootGroup.position.set(dp[0], dp[1], dp[2]);
  if (doorData.rotation_y) {
    rootGroup.rotation.y = doorData.rotation_y;
  }

  const width = doorData.width || 1.1;
  const height = doorData.height || 2.2;
  const frameThickness = 0.08;
  const frameDepth = 0.16;
  const panelThickness = 0.045;

  // Door Frame Materials
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d2716,
    roughness: 0.5,
    metalness: 0.1
  });

  // Top Frame Header
  const topFrameGeo = new THREE.BoxGeometry(width + frameThickness * 2, frameThickness, frameDepth);
  const topFrame = new THREE.Mesh(topFrameGeo, frameMaterial);
  topFrame.position.set(0, height + frameThickness / 2, 0);
  topFrame.castShadow = true;
  rootGroup.add(topFrame);

  // Left Frame Jamb
  const jambGeo = new THREE.BoxGeometry(frameThickness, height, frameDepth);
  const leftJamb = new THREE.Mesh(jambGeo, frameMaterial);
  leftJamb.position.set(-width / 2 - frameThickness / 2, height / 2, 0);
  leftJamb.castShadow = true;
  rootGroup.add(leftJamb);

  // Right Frame Jamb
  const rightJamb = new THREE.Mesh(jambGeo, frameMaterial);
  rightJamb.position.set(width / 2 + frameThickness / 2, height / 2, 0);
  rightJamb.castShadow = true;
  rootGroup.add(rightJamb);

  // Hinge Pivot Group (placed at the left jamb)
  const pivotGroup = new THREE.Group();
  pivotGroup.position.set(-width / 2, 0, 0);
  rootGroup.add(pivotGroup);

  if (doorData.is_balcony) {
    // Balcony Sliding / Glass Door
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      ior: 1.5
    });
    const glassFrameMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.3,
      metalness: 0.8
    });

    // Glass panel
    const panelGeo = new THREE.BoxGeometry(width - 0.02, height - 0.02, 0.03);
    const glassMesh = new THREE.Mesh(panelGeo, glassMaterial);
    glassMesh.position.set(width / 2, height / 2, 0);
    pivotGroup.add(glassMesh);

    // Slim perimeter aluminum frame
    const frameBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(panelGeo),
      new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 })
    );
    frameBorder.position.copy(glassMesh.position);
    pivotGroup.add(frameBorder);
  } else {
    // Solid Wood Entrance / Interior Door
    const woodTexture = getProceduralTexture("wood");
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: doorData.is_main_entrance ? 0x5a3318 : 0x8a5a36,
      map: woodTexture,
      roughness: 0.4,
      metalness: 0.15
    });

    const doorGeo = new THREE.BoxGeometry(width - 0.02, height - 0.02, panelThickness);
    const doorPanel = new THREE.Mesh(doorGeo, doorMaterial);
    doorPanel.castShadow = true;
    doorPanel.receiveShadow = true;
    // Position so hinge is at pivotGroup origin (x = 0)
    doorPanel.position.set(width / 2, height / 2, 0);
    pivotGroup.add(doorPanel);

    // Contemporary Metallic Door Handle
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Brass / Gold handle
      roughness: 0.2,
      metalness: 0.9
    });

    // Handle stem & lever
    const handleStemGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12);
    const handleStemFront = new THREE.Mesh(handleStemGeo, handleMat);
    handleStemFront.rotation.x = Math.PI / 2;
    handleStemFront.position.set(width - 0.08, height * 0.48, panelThickness / 2 + 0.022);
    pivotGroup.add(handleStemFront);

    const handleLeverGeo = new THREE.BoxGeometry(0.12, 0.022, 0.015);
    const handleLeverFront = new THREE.Mesh(handleLeverGeo, handleMat);
    handleLeverFront.position.set(width - 0.08 - 0.05, height * 0.48, panelThickness / 2 + 0.045);
    pivotGroup.add(handleLeverFront);

    // Back handle
    const handleStemBack = new THREE.Mesh(handleStemGeo, handleMat);
    handleStemBack.rotation.x = Math.PI / 2;
    handleStemBack.position.set(width - 0.08, height * 0.48, -panelThickness / 2 - 0.022);
    pivotGroup.add(handleStemBack);

    const handleLeverBack = new THREE.Mesh(handleLeverGeo, handleMat);
    handleLeverBack.position.set(width - 0.08 - 0.05, height * 0.48, -panelThickness / 2 - 0.045);
    pivotGroup.add(handleLeverBack);
  }

  const instance: DoorMeshInstance = {
    group: rootGroup,
    pivot: pivotGroup,
    doorData,
    currentAngle: 0,
    targetAngle: 0,
    isOpen: false,
    setOpen(open: boolean) {
      this.isOpen = open;
      this.targetAngle = open ? -Math.PI * 0.48 : 0.0;
    },
    update(delta: number) {
      // Smooth interpolation for door swing
      if (Math.abs(this.currentAngle - this.targetAngle) > 0.001) {
        this.currentAngle += (this.targetAngle - this.currentAngle) * Math.min(1.0, delta * 4.5);
        this.pivot.rotation.y = this.currentAngle;
      }
    }
  };

  return instance;
}
