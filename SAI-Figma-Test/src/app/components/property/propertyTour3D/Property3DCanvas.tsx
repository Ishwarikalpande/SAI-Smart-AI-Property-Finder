import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { Property3DTourData } from "./PropertyScene";
import { createRoomMesh, RoomMeshInstance } from "./RoomMesh";
import { createDoorMesh, DoorMeshInstance } from "./DoorMesh";
import { createExteriorMesh } from "./ExteriorMesh";
import { CameraController } from "./CameraController";

export interface Property3DCanvasHandle {
  setStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  restart: () => void;
  togglePlay: () => void;
  toggleFreeExplore: () => void;
  setMuted: (muted: boolean) => void;
  getCameraState: () => { pos: [number, number, number]; lookAt: [number, number, number] };
}

interface Property3DCanvasProps {
  tourData: Property3DTourData;
  onStepChange: (index: number) => void;
  onTourComplete: () => void;
  isPlaying: boolean;
  isFreeExplore: boolean;
  isMuted: boolean;
  onCameraUpdate?: (pos: [number, number, number], lookAt: [number, number, number]) => void;
}

export const Property3DCanvas = forwardRef<Property3DCanvasHandle, Property3DCanvasProps>(
  (
    {
      tourData,
      onStepChange,
      onTourComplete,
      isPlaying,
      isFreeExplore,
      isMuted,
      onCameraUpdate
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<CameraController | null>(null);

    useImperativeHandle(ref, () => ({
      setStep: (idx: number) => controllerRef.current?.setStep(idx),
      nextStep: () => controllerRef.current?.nextStep(),
      prevStep: () => controllerRef.current?.prevStep(),
      restart: () => controllerRef.current?.restart(),
      togglePlay: () => {
        if (controllerRef.current) {
          controllerRef.current.isPlaying = !controllerRef.current.isPlaying;
        }
      },
      toggleFreeExplore: () => {
        if (controllerRef.current) {
          controllerRef.current.isFreeExplore = !controllerRef.current.isFreeExplore;
        }
      },
      setMuted: (muted: boolean) => {
        if (controllerRef.current) {
          controllerRef.current.isMuted = muted;
        }
      },
      getCameraState: () => {
        const c = controllerRef.current;
        if (!c) return { pos: [0, 1.7, 0], lookAt: [0, 1.7, -1] };
        return {
          pos: [c.currentPos.x, c.currentPos.y, c.currentPos.z],
          lookAt: [c.currentLookAt.x, c.currentLookAt.y, c.currentLookAt.z]
        };
      }
    }));

    // Synchronize props to controller
    useEffect(() => {
      if (controllerRef.current) {
        controllerRef.current.isPlaying = isPlaying;
      }
    }, [isPlaying]);

    useEffect(() => {
      if (controllerRef.current) {
        controllerRef.current.isFreeExplore = isFreeExplore;
      }
    }, [isFreeExplore]);

    useEffect(() => {
      if (controllerRef.current) {
        controllerRef.current.isMuted = isMuted;
      }
    }, [isMuted]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // 1. SCENE SETUP
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87ceeb); // Daylight sky blue
      scene.fog = new THREE.FogExp2(0xcce0ff, 0.012);

      // 2. CAMERA SETUP
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;
      const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 200);

      // 3. RENDERER SETUP
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        stencil: false
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);

      // 4. LIGHTING
      // Daylight Sunlight
      const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
      sunLight.position.set(20, 35, 20);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 100;
      sunLight.shadow.camera.left = -25;
      sunLight.shadow.camera.right = 25;
      sunLight.shadow.camera.top = 25;
      sunLight.shadow.camera.bottom = -25;
      scene.add(sunLight);

      // Outdoor Hemisphere daylight
      const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x443322, 0.7);
      hemiLight.position.set(0, 50, 0);
      scene.add(hemiLight);

      // Warm Interior Ambient
      const ambientLight = new THREE.AmbientLight(0xffeedd, 0.45);
      scene.add(ambientLight);

      // 5. ASSEMBLE 3D ENVIRONMENT
      // Front Exterior
      const exteriorGroup = createExteriorMesh(tourData.building);
      scene.add(exteriorGroup);

      // Procedural 3D Rooms according to BHK
      const roomInstances: RoomMeshInstance[] = [];
      (tourData.rooms || []).forEach((r) => {
        const rMesh = createRoomMesh(r);
        scene.add(rMesh.group);
        roomInstances.push(rMesh);
      });

      // Interactive 3D Doors
      const doorInstances: DoorMeshInstance[] = [];
      (tourData.doors || []).forEach((d) => {
        const dMesh = createDoorMesh(d);
        scene.add(dMesh.group);
        doorInstances.push(dMesh);
      });

      // 6. INITIALIZE CAMERA CONTROLLER
      const controller = new CameraController({
        camera,
        domElement: renderer.domElement,
        steps: tourData.camera_path,
        doors: doorInstances,
        onStepChange,
        onTourComplete
      });
      controller.isPlaying = isPlaying;
      controller.isFreeExplore = isFreeExplore;
      controller.isMuted = isMuted;
      controllerRef.current = controller;

      // 7. ANIMATION LOOP
      let animationFrameId: number;
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);

        controller.update(delta);
        renderer.render(scene, camera);

        onCameraUpdate?.(
          [controller.currentPos.x, controller.currentPos.y, controller.currentPos.z],
          [controller.currentLookAt.x, controller.currentLookAt.y, controller.currentLookAt.z]
        );
      };

      animate();

      // 8. RESIZE HANDLER
      const handleResize = () => {
        if (!container) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      window.addEventListener("resize", handleResize);

      // 9. CLEANUP ON UNMOUNT
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        controller.dispose();

        // Dispose geometries & materials
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else if (obj.material) {
              obj.material.dispose();
            }
          }
        });

        renderer.dispose();
        if (renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
      };
    }, [tourData]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing"
      />
    );
  }
);

Property3DCanvas.displayName = "Property3DCanvas";
