import * as THREE from "three";
import { getProceduralTexture } from "./tourUtils";

/**
 * Creates 3D furniture models tailored for luxury residential visualization.
 */
export function createFurnitureMesh(
  type: string,
  position: [number, number, number],
  rotationY: number = 0
): THREE.Group {
  const group = new THREE.Group();
  const p = Array.isArray(position)
    ? position
    : [(position as any)?.x ?? 0, (position as any)?.y ?? 0, (position as any)?.z ?? 0];
  group.position.set(p[0], p[1], p[2]);
  group.rotation.y = rotationY;

  const woodTex = getProceduralTexture("wood");
  const marbleTex = getProceduralTexture("marble");
  const carpetTex = getProceduralTexture("carpet");

  // Reusable materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5a3e28,
    map: woodTex,
    roughness: 0.4,
    metalness: 0.1
  });
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x3d4852, // Slate charcoal fabric
    roughness: 0.85,
    metalness: 0.05
  });
  const cushionLightMat = new THREE.MeshStandardMaterial({
    color: 0x9fa8a3, // Sage warm grey accent
    roughness: 0.9,
    metalness: 0.05
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.2,
    metalness: 0.85
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.1,
    metalness: 0.95
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.5
  });

  switch (type) {
    case "sofa_sectional":
    case "sofa_sectional_large":
    case "sofa_l_shape": {
      // Main 3-seat couch cushion base
      const isLarge = type === "sofa_sectional_large";
      const width = isLarge ? 2.8 : 2.4;
      const baseGeo = new THREE.BoxGeometry(width, 0.25, 0.9);
      const base = new THREE.Mesh(baseGeo, fabricMat);
      base.position.set(0, 0.25, 0);
      base.castShadow = true;
      group.add(base);

      // Seat cushions
      const seatCount = 3;
      const seatWidth = width / seatCount - 0.04;
      for (let i = 0; i < seatCount; i++) {
        const seatGeo = new THREE.BoxGeometry(seatWidth, 0.16, 0.75);
        const seat = new THREE.Mesh(seatGeo, cushionLightMat);
        seat.position.set(-width / 2 + (i + 0.5) * (width / seatCount), 0.42, 0.04);
        seat.castShadow = true;
        group.add(seat);
      }

      // Backrest
      const backGeo = new THREE.BoxGeometry(width, 0.5, 0.22);
      const back = new THREE.Mesh(backGeo, fabricMat);
      back.position.set(0, 0.65, -0.34);
      back.castShadow = true;
      group.add(back);

      // Armrests
      const armGeo = new THREE.BoxGeometry(0.2, 0.45, 0.9);
      const armLeft = new THREE.Mesh(armGeo, fabricMat);
      armLeft.position.set(-width / 2 - 0.1, 0.45, 0);
      armLeft.castShadow = true;
      group.add(armLeft);

      const armRight = new THREE.Mesh(armGeo, fabricMat);
      armRight.position.set(width / 2 + 0.1, 0.45, 0);
      armRight.castShadow = true;
      group.add(armRight);

      // Chaise lounge section for L-shape
      if (type.includes("l_shape") || isLarge) {
        const chaiseGeo = new THREE.BoxGeometry(0.85, 0.25, 1.2);
        const chaise = new THREE.Mesh(chaiseGeo, fabricMat);
        chaise.position.set(-width / 2 + 0.35, 0.25, 0.95);
        chaise.castShadow = true;
        group.add(chaise);

        const chaiseCushionGeo = new THREE.BoxGeometry(0.8, 0.16, 1.15);
        const chaiseCushion = new THREE.Mesh(chaiseCushionGeo, cushionLightMat);
        chaiseCushion.position.set(-width / 2 + 0.35, 0.42, 0.95);
        group.add(chaiseCushion);
      }
      break;
    }

    case "coffee_table": {
      // Modern Glass & Walnut Coffee Table
      const topGeo = new THREE.BoxGeometry(1.2, 0.04, 0.7);
      const top = new THREE.Mesh(topGeo, glassMat);
      top.position.set(0, 0.4, 0);
      top.castShadow = true;
      group.add(top);

      // Walnut lower shelf
      const shelfGeo = new THREE.BoxGeometry(1.05, 0.025, 0.58);
      const shelf = new THREE.Mesh(shelfGeo, woodMat);
      shelf.position.set(0, 0.2, 0);
      group.add(shelf);

      // Metal legs
      const legPositions = [
        [-0.55, 0.2, -0.3],
        [0.55, 0.2, -0.3],
        [-0.55, 0.2, 0.3],
        [0.55, 0.2, 0.3]
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 12);
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
      });
      break;
    }

    case "tv_wall_unit": {
      // Floating Media Console
      const consoleGeo = new THREE.BoxGeometry(2.4, 0.35, 0.42);
      const consoleMesh = new THREE.Mesh(consoleGeo, woodMat);
      consoleMesh.position.set(0, 0.45, 0);
      consoleMesh.castShadow = true;
      group.add(consoleMesh);

      // Wall panel backdrop
      const wallBackdropGeo = new THREE.BoxGeometry(2.6, 1.8, 0.05);
      const backdropMat = new THREE.MeshStandardMaterial({
        color: 0x2b2b2b,
        roughness: 0.3,
        metalness: 0.2
      });
      const wallBackdrop = new THREE.Mesh(wallBackdropGeo, backdropMat);
      wallBackdrop.position.set(0, 1.45, -0.1);
      group.add(wallBackdrop);

      // 65" OLED TV Screen
      const tvBezelGeo = new THREE.BoxGeometry(1.65, 0.95, 0.03);
      const tvBezel = new THREE.Mesh(tvBezelGeo, metalMat);
      tvBezel.position.set(0, 1.45, 0.0);
      group.add(tvBezel);

      // Glowing TV display screen
      const tvScreenGeo = new THREE.PlaneGeometry(1.6, 0.9);
      const tvScreenMat = new THREE.MeshBasicMaterial({
        color: 0x14b8a6 // SAI Teal glowing screen
      });
      const tvScreen = new THREE.Mesh(tvScreenGeo, tvScreenMat);
      tvScreen.position.set(0, 1.45, 0.02);
      group.add(tvScreen);

      // Soundbar
      const soundbarGeo = new THREE.BoxGeometry(1.1, 0.07, 0.08);
      const soundbar = new THREE.Mesh(soundbarGeo, metalMat);
      soundbar.position.set(0, 0.88, 0.05);
      group.add(soundbar);
      break;
    }

    case "dining_table_6":
    case "dining_table_8": {
      const is8 = type === "dining_table_8";
      const tableLength = is8 ? 2.4 : 1.8;
      const tableWidth = 0.95;

      // Marble Top
      const tableTopGeo = new THREE.BoxGeometry(tableLength, 0.06, tableWidth);
      const marbleMat = new THREE.MeshStandardMaterial({
        color: 0xfaf8f5,
        map: marbleTex,
        roughness: 0.2,
        metalness: 0.1
      });
      const tableTop = new THREE.Mesh(tableTopGeo, marbleMat);
      tableTop.position.set(0, 0.75, 0);
      tableTop.castShadow = true;
      group.add(tableTop);

      // Trestle / Pedestal Base
      const baseGeo = new THREE.BoxGeometry(tableLength * 0.7, 0.72, 0.12);
      const baseMesh = new THREE.Mesh(baseGeo, woodMat);
      baseMesh.position.set(0, 0.36, 0);
      group.add(baseMesh);

      // Chairs around table
      const chairCountPerSide = is8 ? 3 : 2;
      for (let side of [-1, 1]) {
        for (let i = 0; i < chairCountPerSide; i++) {
          const chairGroup = new THREE.Group();
          const cx = -tableLength / 2 + (i + 0.6) * (tableLength / chairCountPerSide);
          const cz = side * (tableWidth / 2 + 0.28);
          chairGroup.position.set(cx, 0, cz);
          chairGroup.rotation.y = side === 1 ? Math.PI : 0;

          // Chair seat
          const seatGeo = new THREE.BoxGeometry(0.42, 0.05, 0.42);
          const seat = new THREE.Mesh(seatGeo, fabricMat);
          seat.position.set(0, 0.45, 0);
          chairGroup.add(seat);

          // Chair back
          const backGeo = new THREE.BoxGeometry(0.42, 0.45, 0.04);
          const back = new THREE.Mesh(backGeo, fabricMat);
          back.position.set(0, 0.68, -0.19);
          chairGroup.add(back);

          // Chair legs
          const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8);
          const legMesh = new THREE.Mesh(legGeo, metalMat);
          legMesh.position.set(0, 0.22, 0);
          chairGroup.add(legMesh);

          group.add(chairGroup);
        }
      }
      break;
    }

    case "kitchen_counter_l":
    case "kitchen_counter_u":
    case "kitchen_island": {
      // Quartz Countertop Base
      const counterLen = 3.2;
      const counterDepth = 0.65;
      const counterHeight = 0.9;

      const baseCabinetGeo = new THREE.BoxGeometry(counterLen, counterHeight - 0.05, counterDepth);
      const cabinetMat = new THREE.MeshStandardMaterial({
        color: 0x263238, // Modern dark anthracite cabinets
        roughness: 0.3,
        metalness: 0.1
      });
      const baseCabinet = new THREE.Mesh(baseCabinetGeo, cabinetMat);
      baseCabinet.position.set(0, (counterHeight - 0.05) / 2, 0);
      baseCabinet.castShadow = true;
      group.add(baseCabinet);

      // Quartz slab
      const slabGeo = new THREE.BoxGeometry(counterLen + 0.05, 0.05, counterDepth + 0.05);
      const quartzMat = new THREE.MeshStandardMaterial({
        color: 0xfdfdfd,
        map: marbleTex,
        roughness: 0.15,
        metalness: 0.05
      });
      const slab = new THREE.Mesh(slabGeo, quartzMat);
      slab.position.set(0, counterHeight - 0.025, 0);
      slab.castShadow = true;
      group.add(slab);

      // Stainless Steel Sink
      const sinkGeo = new THREE.BoxGeometry(0.65, 0.01, 0.42);
      const sink = new THREE.Mesh(sinkGeo, chromeMat);
      sink.position.set(-0.8, counterHeight + 0.005, 0);
      group.add(sink);

      // Faucet
      const faucetGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16, Math.PI);
      const faucet = new THREE.Mesh(faucetGeo, chromeMat);
      faucet.rotation.z = Math.PI / 2;
      faucet.position.set(-0.8, counterHeight + 0.18, -0.15);
      group.add(faucet);

      // Black Glass Cooktop Stove
      const stoveGeo = new THREE.BoxGeometry(0.75, 0.015, 0.45);
      const stoveMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.1,
        metalness: 0.9
      });
      const stove = new THREE.Mesh(stoveGeo, stoveMat);
      stove.position.set(0.6, counterHeight + 0.01, 0);
      group.add(stove);

      // Upper Wall Cabinets
      const upperCabGeo = new THREE.BoxGeometry(counterLen, 0.7, 0.35);
      const upperCab = new THREE.Mesh(upperCabGeo, woodMat);
      upperCab.position.set(0, 2.1, -0.15);
      upperCab.castShadow = true;
      group.add(upperCab);
      break;
    }

    case "refrigerator":
    case "refrigerator_double": {
      // Stainless Steel French-Door Fridge
      const fridgeGeo = new THREE.BoxGeometry(0.95, 1.85, 0.85);
      const fridgeMat = new THREE.MeshStandardMaterial({
        color: 0xc8c8c8,
        roughness: 0.25,
        metalness: 0.85
      });
      const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
      fridge.position.set(0, 1.85 / 2, 0);
      fridge.castShadow = true;
      group.add(fridge);

      // Door seam line
      const seamGeo = new THREE.BoxGeometry(0.01, 1.1, 0.86);
      const seam = new THREE.Mesh(seamGeo, metalMat);
      seam.position.set(0, 1.25, 0);
      group.add(seam);
      break;
    }

    case "king_bed":
    case "queen_bed": {
      const isKing = type === "king_bed";
      const bedWidth = isKing ? 2.0 : 1.6;
      const bedLength = 2.1;

      // Bed Base
      const bedBaseGeo = new THREE.BoxGeometry(bedWidth, 0.35, bedLength);
      const bedBase = new THREE.Mesh(bedBaseGeo, woodMat);
      bedBase.position.set(0, 0.18, 0);
      bedBase.castShadow = true;
      group.add(bedBase);

      // Mattress
      const mattressGeo = new THREE.BoxGeometry(bedWidth - 0.06, 0.28, bedLength - 0.06);
      const mattressMat = new THREE.MeshStandardMaterial({
        color: 0xf5f3ee,
        roughness: 0.9
      });
      const mattress = new THREE.Mesh(mattressGeo, mattressMat);
      mattress.position.set(0, 0.45, 0);
      mattress.castShadow = true;
      group.add(mattress);

      // Soft Duvet Blanket
      const duvetGeo = new THREE.BoxGeometry(bedWidth - 0.04, 0.12, bedLength * 0.7);
      const duvetMat = new THREE.MeshStandardMaterial({
        color: 0x485a6a, // Premium slate navy duvet
        roughness: 0.8
      });
      const duvet = new THREE.Mesh(duvetGeo, duvetMat);
      duvet.position.set(0, 0.55, bedLength * 0.15);
      duvet.castShadow = true;
      group.add(duvet);

      // Headboard
      const headboardGeo = new THREE.BoxGeometry(bedWidth + 0.3, 1.25, 0.12);
      const headboardMat = new THREE.MeshStandardMaterial({
        color: 0x31383e, // Tufted dark fabric
        roughness: 0.85
      });
      const headboard = new THREE.Mesh(headboardGeo, headboardMat);
      headboard.position.set(0, 0.85, -bedLength / 2);
      headboard.castShadow = true;
      group.add(headboard);

      // Pillows
      const pillowGeo = new THREE.BoxGeometry(0.65, 0.12, 0.42);
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      for (let px of [-bedWidth / 4, bedWidth / 4]) {
        const pillow = new THREE.Mesh(pillowGeo, pillowMat);
        pillow.position.set(px, 0.62, -bedLength / 2 + 0.35);
        pillow.rotation.x = 0.2;
        group.add(pillow);
      }
      break;
    }

    case "nightstand_left":
    case "nightstand_right": {
      // Bedside Nightstand
      const standGeo = new THREE.BoxGeometry(0.55, 0.5, 0.45);
      const stand = new THREE.Mesh(standGeo, woodMat);
      stand.position.set(0, 0.25, 0);
      stand.castShadow = true;
      group.add(stand);

      // Night Lamp
      const lampBaseGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.04, 16);
      const lampBase = new THREE.Mesh(lampBaseGeo, metalMat);
      lampBase.position.set(0, 0.52, 0);
      group.add(lampBase);

      const lampShadeGeo = new THREE.ConeGeometry(0.14, 0.22, 16, 1, true);
      const lampShadeMat = new THREE.MeshStandardMaterial({
        color: 0xffeedd,
        emissive: 0xffaa44,
        emissiveIntensity: 0.35,
        roughness: 0.4
      });
      const lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
      lampShade.position.set(0, 0.68, 0);
      group.add(lampShade);
      break;
    }

    case "wardrobe":
    case "wardrobe_large":
    case "wardrobe_walkin": {
      const isLarge = type.includes("large") || type.includes("walkin");
      const wWidth = isLarge ? 2.6 : 1.8;
      const wardrobeGeo = new THREE.BoxGeometry(wWidth, 2.5, 0.65);
      const wardrobeMat = new THREE.MeshStandardMaterial({
        color: 0x332822,
        map: woodTex,
        roughness: 0.35
      });
      const wardrobe = new THREE.Mesh(wardrobeGeo, wardrobeMat);
      wardrobe.position.set(0, 1.25, 0);
      wardrobe.castShadow = true;
      group.add(wardrobe);

      // Mirrored center door
      const mirrorGeo = new THREE.BoxGeometry(wWidth * 0.45, 2.3, 0.01);
      const mirrorMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.95
      });
      const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
      mirror.position.set(0, 1.25, 0.33);
      group.add(mirror);
      break;
    }

    case "vanity_mirror": {
      // Floating Bathroom Vanity Counter
      const vanityGeo = new THREE.BoxGeometry(1.0, 0.42, 0.5);
      const vanity = new THREE.Mesh(vanityGeo, woodMat);
      vanity.position.set(0, 0.65, 0);
      vanity.castShadow = true;
      group.add(vanity);

      // Ceramic Sink Bowl
      const basinGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.12, 24);
      const basinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
      const basin = new THREE.Mesh(basinGeo, basinMat);
      basin.position.set(0, 0.88, 0);
      group.add(basin);

      // Faucet
      const tapGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 12);
      const tap = new THREE.Mesh(tapGeo, chromeMat);
      tap.position.set(0, 0.98, -0.16);
      group.add(tap);

      // Backlit LED Mirror
      const mirrorGeo = new THREE.BoxGeometry(0.85, 1.0, 0.03);
      const mirrorMat = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.15,
        roughness: 0.05,
        metalness: 0.95
      });
      const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
      mirror.position.set(0, 1.6, -0.2);
      group.add(mirror);
      break;
    }

    case "toilet_commode": {
      // Ceramic WC Commode
      const baseGeo = new THREE.BoxGeometry(0.42, 0.42, 0.6);
      const whiteCeramic = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
      const base = new THREE.Mesh(baseGeo, whiteCeramic);
      base.position.set(0, 0.21, 0);
      group.add(base);

      // Water Tank
      const tankGeo = new THREE.BoxGeometry(0.42, 0.45, 0.22);
      const tank = new THREE.Mesh(tankGeo, whiteCeramic);
      tank.position.set(0, 0.64, -0.2);
      group.add(tank);
      break;
    }

    case "shower_glass": {
      // Glass Shower Cubicle Partition
      const partitionGeo = new THREE.BoxGeometry(0.02, 2.2, 1.2);
      const partition = new THREE.Mesh(partitionGeo, glassMat);
      partition.position.set(0, 1.1, 0);
      group.add(partition);

      // Chrome Shower Head
      const pipeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 12);
      const pipe = new THREE.Mesh(pipeGeo, chromeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(-0.35, 2.1, -0.25);
      group.add(pipe);

      const headGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24);
      const head = new THREE.Mesh(headGeo, chromeMat);
      head.position.set(-0.35, 2.05, 0.0);
      group.add(head);
      break;
    }

    case "balcony_railing": {
      // Tempered Glass & Steel Balcony Railing
      const railingWidth = 4.8;
      const railingHeight = 1.15;

      // Glass Paneling
      const glassPanelGeo = new THREE.BoxGeometry(railingWidth, railingHeight - 0.1, 0.02);
      const glassPanel = new THREE.Mesh(glassPanelGeo, glassMat);
      glassPanel.position.set(0, railingHeight / 2, 0);
      group.add(glassPanel);

      // Top Steel Handrail
      const handrailGeo = new THREE.CylinderGeometry(0.035, 0.035, railingWidth + 0.1, 16);
      const handrail = new THREE.Mesh(handrailGeo, metalMat);
      handrail.rotation.z = Math.PI / 2;
      handrail.position.set(0, railingHeight, 0);
      group.add(handrail);

      // Steel support posts
      const postCount = 5;
      for (let i = 0; i < postCount; i++) {
        const postGeo = new THREE.CylinderGeometry(0.025, 0.025, railingHeight, 12);
        const post = new THREE.Mesh(postGeo, metalMat);
        post.position.set(-railingWidth / 2 + (i / (postCount - 1)) * railingWidth, railingHeight / 2, 0);
        group.add(post);
      }
      break;
    }

    case "area_rug": {
      // Plush Area Rug
      const rugGeo = new THREE.BoxGeometry(2.4, 0.015, 1.8);
      const rugMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        map: carpetTex,
        roughness: 0.9
      });
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.position.set(0, 0.008, 0);
      group.add(rug);
      break;
    }

    default: {
      // Generic subtle accent box placeholder
      const genericGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
      const genericMesh = new THREE.Mesh(genericGeo, woodMat);
      genericMesh.position.set(0, 0.25, 0);
      group.add(genericMesh);
      break;
    }
  }

  return group;
}
