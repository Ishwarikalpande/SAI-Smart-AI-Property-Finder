import * as THREE from "three";
import { Property3DTourData, Property3DRoom, Property3DDoor, Property3DCameraStep } from "./PropertyScene";

// Cache procedural textures so they are created once
const textureCache: Map<string, THREE.CanvasTexture> = new Map();

/**
 * Creates high-resolution procedural canvas textures for Three.js.
 * Zero external network downloads, instant loading, reliable on all browsers.
 */
export function getProceduralTexture(type: "wood" | "marble" | "tile" | "grass" | "concrete" | "road" | "carpet"): THREE.CanvasTexture {
  if (textureCache.has(type)) {
    return textureCache.get(type)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  if (type === "wood") {
    // Warm wood parquet planks
    ctx.fillStyle = "#A37A52";
    ctx.fillRect(0, 0, 512, 512);
    const plankHeight = 64;
    for (let y = 0; y < 512; y += plankHeight) {
      // Wood plank divider line
      ctx.fillStyle = "#5E3E24";
      ctx.fillRect(0, y, 512, 3);
      // Wood grain lines
      for (let x = 0; x < 512; x += 32) {
        ctx.fillStyle = (x + y) % 64 === 0 ? "rgba(90, 60, 35, 0.15)" : "rgba(180, 140, 95, 0.12)";
        ctx.fillRect(x, y + 3, 30, plankHeight - 3);
      }
    }
  } else if (type === "marble") {
    // Elegant Italian white marble with soft grey veins
    ctx.fillStyle = "#F5F5F3";
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "rgba(195, 195, 190, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(150, 120, 320, 40, 512, 160);
    ctx.moveTo(80, 512);
    ctx.bezierCurveTo(220, 380, 340, 420, 512, 300);
    ctx.stroke();
    // Sub-veins
    ctx.strokeStyle = "rgba(215, 215, 210, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.bezierCurveTo(200, 200, 300, 180, 450, 512);
    ctx.stroke();
  } else if (type === "tile") {
    // Polished porcelain ceramic grid tiles
    ctx.fillStyle = "#EDEAE5";
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#BEB9B0";
    const tileSize = 128;
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.fillRect(x - 2, 0, 4, 512);
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.fillRect(0, y - 2, 512, 4);
    }
  } else if (type === "grass") {
    // Landscaped lawn green
    ctx.fillStyle = "#3B7A38";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? "#488D44" : "#2E662B";
      ctx.fillRect(rx, ry, 3, 6);
    }
  } else if (type === "concrete") {
    // Modern architectural concrete finish
    ctx.fillStyle = "#D6D4CF";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 300; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)";
      ctx.fillRect(rx, ry, 4, 4);
    }
  } else if (type === "road") {
    // Dark asphalt with dashed lane lines
    ctx.fillStyle = "#2A2E33";
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#EAEAEA";
    // Center dashed line
    for (let y = 30; y < 512; y += 80) {
      ctx.fillRect(250, y, 12, 45);
    }
  } else if (type === "carpet") {
    // Textured plush area rug
    ctx.fillStyle = "#55606E";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#626E7D" : "#4A5462";
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache.set(type, texture);
  return texture;
}

// ── PROCEDURAL SOUND FX (Web Audio API) ──────────────────────────────
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a realistic wooden door opening sound using audio synthesis.
 */
export function playDoorOpenSound(isMuted: boolean = false) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Door latch click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);

    // Door swing whoosh
    const bufferSize = ctx.sampleRate * 0.4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(350, ctx.currentTime + 0.08);
    filter.Q.setValueAtTime(1.5, ctx.currentTime + 0.08);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(ctx.currentTime + 0.08);
  } catch (e) {
    console.debug("[Audio] Door sound:", e);
  }
}

/**
 * Plays a subtle chime on room entry.
 */
export function playRoomTransitionChime(isMuted: boolean = false) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
      gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.45);
    });
  } catch (e) {
    console.debug("[Audio] Chime:", e);
  }
}

// ── VECTOR & CAMERA EASING HELPERS ──────────────────────────────────
export function smoothLerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Builds fallback 3D property structure matching exact BHK specifications.
 */
export function buildClientFallback3D(property: any): Property3DTourData {
  const bhk = Math.max(1, Math.min(property?.bhk || 2, 4));
  const isVilla = ["villa", "house", "bungalow"].includes((property?.type || property?.property_type || "").toLowerCase());
  const city = property?.city || "Pune";
  const locality = property?.location || property?.locality || "Prime Locality";

  return {
    property_id: property?.id || 1,
    title: property?.name || property?.title || `${bhk} BHK Premium Residence`,
    bhk,
    bedrooms: bhk,
    bathrooms: bhk === 1 ? 1 : 2,
    balconies: 1,
    property_type: isVilla ? "villa" : "apartment",
    city,
    locality,
    address: property?.address || `${locality}, ${city}`,
    area_sqft: property?.areaNum || property?.area_sqft || (bhk === 1 ? 650 : bhk === 2 ? 1150 : bhk === 3 ? 1650 : 2400),
    price_display: property?.price || `₹${bhk * 45} Lakh`,
    is_verified_floorplan: false,
    floor_plan_url: property?.floor_plan || null,
    scene: {
      units: "meters",
      ceiling_height: 2.85,
      wall_thickness: 0.15
    },
    building: {
      building_type: isVilla ? "villa" : "apartment",
      total_floors: isVilla ? 2 : 12,
      selected_floor: isVilla ? 1 : (bhk === 2 ? 4 : 6),
      city,
      locality
    },
    rooms: [
      {
        id: "entrance",
        name: "Entrance",
        type: "entrance",
        order: 1,
        position: { x: 0, y: 0, z: 1.8 },
        dimensions: { width: 3.0, length: 3.2, height: 2.85 },
        label: "ENTRANCE",
        subtitle: "Private entrance doorway with modern digital lock"
      },
      {
        id: "living_room",
        name: "Hall / Living Room",
        type: "living_room",
        order: 2,
        position: { x: -0.5, y: 0, z: -2.8 },
        dimensions: { width: 5.8, length: 5.5, height: 2.85 },
        label: "LIVING ROOM",
        subtitle: "Spacious central living area with natural light"
      },
      {
        id: "kitchen",
        name: "Kitchen",
        type: "kitchen",
        order: 3,
        position: { x: 4.4, y: 0, z: -2.6 },
        dimensions: { width: 3.6, length: 4.6, height: 2.85 },
        label: "KITCHEN",
        subtitle: "Functional modular kitchen with utility provisions"
      },
      {
        id: "master_bedroom",
        name: "Master Bedroom",
        type: "bedroom",
        order: 4,
        position: { x: -2.6, y: 0, z: -8.0 },
        dimensions: { width: 5.0, length: 5.4, height: 2.85 },
        label: "MASTER BEDROOM",
        subtitle: "Master bedroom suite with wooden flooring"
      },
      ...(bhk >= 2 ? [{
        id: "bedroom_2",
        name: "Child Bedroom / Bedroom 2",
        type: "bedroom",
        order: 5,
        position: { x: 2.2, y: 0, z: -8.0 },
        dimensions: { width: 4.4, length: 5.0, height: 2.85 },
        label: "BEDROOM 2",
        subtitle: "Second bedroom with study and wardrobe provisions"
      }] : []),
      {
        id: "bathroom_1",
        name: "Bathroom",
        type: "bathroom",
        order: bhk >= 2 ? 6 : 5,
        position: { x: -4.8, y: 0, z: -11.4 },
        dimensions: { width: 2.6, length: 3.0, height: 2.85 },
        label: "BATHROOM",
        subtitle: "Fitted bathroom with premium sanitary fixtures"
      },
      {
        id: "balcony",
        name: "Balcony",
        type: "balcony",
        order: bhk >= 2 ? 7 : 6,
        position: { x: 0, y: 0, z: -12.4 },
        dimensions: { width: 5.4, length: 2.6, height: 2.85 },
        label: "BALCONY VIEW",
        subtitle: `Scenic open balcony overlooking ${city}`
      }
    ],
    doors: [
      { id: "main_door", name: "Main Door", is_main_entrance: true, position: [0, 0, 0], width: 1.15, height: 2.25 },
      { id: "door_balcony", name: "Balcony Door", is_balcony: true, position: [0, 0, -10.8], width: 2.2, height: 2.35 }
    ],
    camera_path: [
      { id: "c1", step_name: "Front View", room_id: "exterior", position: [0, 6.5, 20], look_at: [0, 3.5, 0], duration: 4, action: "none", label: "PROPERTY FRONT VIEW" },
      { id: "c2", step_name: "Entrance", room_id: "entrance", position: [0, 1.7, 4.5], look_at: [0, 1.6, 0], duration: 3, action: "none", label: "ENTRANCE" },
      { id: "c3", step_name: "Door Open", room_id: "entrance", position: [0, 1.7, 1.8], look_at: [0, 1.6, -1], duration: 2.5, action: "door_open", label: "ENTRANCE" },
      { id: "c4", step_name: "Living Room", room_id: "living_room", position: [0, 1.7, -1.2], look_at: [-1.6, 1.5, -3.8], duration: 3.5, action: "none", label: "LIVING ROOM" },
      { id: "c5", step_name: "Kitchen", room_id: "kitchen", position: [3.6, 1.7, -2.2], look_at: [5.2, 1.4, -3.5], duration: 3.5, action: "none", label: "KITCHEN" },
      { id: "c6", step_name: "Master Bedroom", room_id: "master_bedroom", position: [-2.2, 1.7, -6.8], look_at: [-2.6, 1.4, -9.5], duration: 3.5, action: "pan_180", label: "MASTER BEDROOM" },
      { id: "c7", step_name: "Balcony Approach", room_id: "balcony", position: [0, 1.7, -10.2], look_at: [0, 1.6, -14], duration: 2, action: "balcony_open", label: "BALCONY VIEW" },
      { id: "c8", step_name: "Balcony View", room_id: "balcony", position: [0, 1.7, -12], look_at: [0, 1.6, -20], duration: 3.5, action: "exterior_view", label: "BALCONY VIEW" },
      { id: "c9", step_name: "Front Elevation", room_id: "exterior", position: [0, 8, 25], look_at: [0, 4, 0], duration: 4, action: "none", label: "PROPERTY FRONT VIEW" },
      { id: "c10", step_name: "Tour Complete", room_id: "exterior", position: [0, 8, 25], look_at: [0, 4, 0], duration: 2, action: "complete", label: "TOUR COMPLETE" }
    ],
    exterior: {
      weather: "clear_daylight"
    }
  };
}
