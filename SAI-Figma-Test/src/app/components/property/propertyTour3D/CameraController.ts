import * as THREE from "three";
import { Property3DCameraStep } from "./PropertyScene";
import { DoorMeshInstance } from "./DoorMesh";
import { playDoorOpenSound, playRoomTransitionChime } from "./tourUtils";

export interface CameraControllerOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  steps: Property3DCameraStep[];
  doors: DoorMeshInstance[];
  onStepChange?: (index: number) => void;
  onTourComplete?: () => void;
}

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private steps: Property3DCameraStep[];
  private doors: DoorMeshInstance[];
  private onStepChange?: (index: number) => void;
  private onTourComplete?: () => void;

  // Walkthrough State
  public currentStepIndex: number = 0;
  public isPlaying: boolean = true;
  public isFreeExplore: boolean = false;
  public isMuted: boolean = false;

  private stepProgress: number = 0; // 0.0 to 1.0 within current step
  private stepElapsedTime: number = 0;

  // Current Camera Vectors
  public currentPos: THREE.Vector3 = new THREE.Vector3();
  public currentLookAt: THREE.Vector3 = new THREE.Vector3();
  private targetPos: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();

  // Free Explore Orbit / Drag State
  private isPointerDown: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private spherical: THREE.Spherical = new THREE.Spherical(5, Math.PI / 3, 0);
  private orbitTarget: THREE.Vector3 = new THREE.Vector3();

  // Keyboard navigation for Free Explore
  private keysPressed: { [key: string]: boolean } = {};

  constructor(options: CameraControllerOptions) {
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.steps = options.steps || [];
    this.doors = options.doors;
    this.onStepChange = options.onStepChange;
    this.onTourComplete = options.onTourComplete;

    if (this.steps && this.steps.length > 0) {
      const s0 = this.steps[0];
      const posObj = s0.position as any;
      const p = Array.isArray(s0.position)
        ? s0.position
        : [posObj?.x ?? 0, posObj?.y ?? 1.7, posObj?.z ?? 0];
      const lookObj = s0.look_at as any;
      const l = Array.isArray(s0.look_at)
        ? s0.look_at
        : [lookObj?.x ?? 0, lookObj?.y ?? 1.7, lookObj?.z ?? -1];
      this.currentPos.set(p[0], p[1], p[2]);
      this.currentLookAt.set(l[0], l[1], l[2]);
      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentLookAt);
      this.orbitTarget.copy(this.currentLookAt);
    }

    this.bindEvents();
  }

  private bindEvents() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.domElement.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
    this.domElement.addEventListener("wheel", this.onWheel, { passive: true });
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  public dispose() {
    this.domElement.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.domElement.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  public setStep(index: number) {
    if (this.steps && index >= 0 && index < this.steps.length) {
      this.currentStepIndex = index;
      this.stepElapsedTime = 0;
      this.stepProgress = 0;
      this.executeStepActions(this.steps[index]);
      this.onStepChange?.(index);
    }
  }

  public nextStep() {
    if (this.steps && this.currentStepIndex < this.steps.length - 1) {
      this.setStep(this.currentStepIndex + 1);
    } else {
      this.isPlaying = false;
      this.onTourComplete?.();
    }
  }

  public prevStep() {
    if (this.currentStepIndex > 0) {
      this.setStep(this.currentStepIndex - 1);
    }
  }

  public restart() {
    // Reset all doors
    this.doors.forEach((d) => d.setOpen(false));
    this.setStep(0);
    this.isPlaying = true;
    this.isFreeExplore = false;
  }

  private executeStepActions(step: Property3DCameraStep) {
    if (step.action === "door_open") {
      // Main entrance door swings open physically!
      const mainDoor = (this.doors || []).find((d) => d?.doorData?.is_main_entrance);
      if (mainDoor) {
        mainDoor.setOpen(true);
        playDoorOpenSound(this.isMuted);
      }
    } else if (step.action === "balcony_open") {
      // Balcony door opens!
      const balcDoor = (this.doors || []).find((d) => d?.doorData?.is_balcony);
      if (balcDoor) {
        balcDoor.setOpen(true);
        playDoorOpenSound(this.isMuted);
      }
    } else if (step.action === "complete") {
      this.isPlaying = false;
      this.onTourComplete?.();
    }

    // Play subtle chime on room transitions
    if (step.room_id !== "exterior") {
      playRoomTransitionChime(this.isMuted);
    }
  }

  public update(delta: number) {
    // 1. Update interactive 3D doors
    this.doors.forEach((d) => d.update(delta));

    // 2. Free Explore Mode (Orbit & WASD)
    if (this.isFreeExplore) {
      this.handleFreeExploreMovement(delta);
      return;
    }

    // 3. Automatic Camera Path Interpolation
    if (!this.isPlaying || !this.steps || this.steps.length === 0) return;

    const currentStep = this.steps[this.currentStepIndex];
    if (!currentStep) return;
    const nextStep = this.steps[Math.min(this.currentStepIndex + 1, this.steps.length - 1)] || currentStep;
    const duration = currentStep.duration || 3.5;

    this.stepElapsedTime += delta;
    this.stepProgress = Math.min(1.0, this.stepElapsedTime / duration);

    // Smooth cubic easing for camera motion
    const easeT = this.easeInOutCubic(this.stepProgress);

    const getCoords = (val: any, fallback: [number, number, number]): [number, number, number] => {
      if (Array.isArray(val) && val.length >= 3) return [val[0], val[1], val[2]];
      if (typeof val === "object" && val !== null) return [val.x ?? fallback[0], val.y ?? fallback[1], val.z ?? fallback[2]];
      return fallback;
    };
    const cp = getCoords(currentStep.position, [0, 1.7, 0]);
    const np = getCoords(nextStep.position, [0, 1.7, 0]);
    const cl = getCoords(currentStep.look_at, [0, 1.7, -1]);
    const nl = getCoords(nextStep.look_at, [0, 1.7, -1]);

    const fromPos = new THREE.Vector3(cp[0], cp[1], cp[2]);
    const toPos = new THREE.Vector3(np[0], np[1], np[2]);
    const fromLook = new THREE.Vector3(cl[0], cl[1], cl[2]);
    const toLook = new THREE.Vector3(nl[0], nl[1], nl[2]);

    // Pan 180 handling for master bedroom
    if (currentStep.action === "pan_180" && this.stepProgress < 0.9) {
      const panAngle = (this.stepProgress - 0.2) * Math.PI;
      toLook.x = fromPos.x + Math.sin(panAngle) * 3.5;
      toLook.z = fromPos.z + Math.cos(panAngle) * 3.5;
    }

    this.currentPos.lerpVectors(fromPos, toPos, easeT);
    this.currentLookAt.lerpVectors(fromLook, toLook, easeT);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
    this.orbitTarget.copy(this.currentLookAt);

    // If step completed, advance to next step
    if (this.stepProgress >= 1.0) {
      if (this.steps && this.currentStepIndex < this.steps.length - 1) {
        this.nextStep();
      } else {
        this.isPlaying = false;
        this.onTourComplete?.();
      }
    }
  }

  private handleFreeExploreMovement(delta: number) {
    const moveSpeed = 4.0 * delta;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // WASD controls
    if (this.keysPressed["KeyW"] || this.keysPressed["ArrowUp"]) {
      this.camera.position.addScaledVector(forward, moveSpeed);
    }
    if (this.keysPressed["KeyS"] || this.keysPressed["ArrowDown"]) {
      this.camera.position.addScaledVector(forward, -moveSpeed);
    }
    if (this.keysPressed["KeyA"] || this.keysPressed["ArrowLeft"]) {
      this.camera.position.addScaledVector(right, -moveSpeed);
    }
    if (this.keysPressed["KeyD"] || this.keysPressed["ArrowRight"]) {
      this.camera.position.addScaledVector(right, moveSpeed);
    }

    // Keep camera at comfortable human eye-level (1.68m) inside apartment
    this.camera.position.y = 1.68;

    // Collision boundary constraints: prevent user from flying away into the void
    this.camera.position.x = Math.max(-10, Math.min(10, this.camera.position.x));
    this.camera.position.z = Math.max(-25, Math.min(25, this.camera.position.z));

    this.currentPos.copy(this.camera.position);
    this.camera.getWorldDirection(this.currentLookAt);
    this.currentLookAt.add(this.currentPos);
  }

  private onMouseDown(e: MouseEvent) {
    this.isPointerDown = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isPointerDown) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    if (this.isFreeExplore) {
      // First-person mouse look rotation
      this.camera.rotation.order = "YXZ";
      this.camera.rotation.y -= deltaX * 0.003;
      this.camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.camera.rotation.x - deltaY * 0.003));
    } else {
      // Subtle orbit pan during auto tour
      this.currentLookAt.x -= deltaX * 0.008;
      this.currentLookAt.y += deltaY * 0.008;
      this.camera.lookAt(this.currentLookAt);
    }

    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseUp() {
    this.isPointerDown = false;
  }

  private onWheel(e: WheelEvent) {
    if (this.isFreeExplore) {
      const zoomSpeed = e.deltaY * 0.005;
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.camera.position.addScaledVector(forward, -zoomSpeed);
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keysPressed[e.code] = true;
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keysPressed[e.code] = false;
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}
