import { Building3DResponse, Floor3DItem, Unit3DItem, BookingResponse } from "./building3D";

function formatInr(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(2).replace(/\.00$/, "")} Cr`;
  }
  if (amount >= 100000) {
    const lk = amount / 100000;
    return `₹${lk.toFixed(2).replace(/\.00$/, "")} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

const STATUS_COLORS: Record<string, string> = {
  available: "#10B981",
  reserved: "#F59E0B",
  booked: "#EF4444",
  sold: "#6B7280",
  blocked: "#374151",
};

export function generateMockBuilding3DData(buildingId: number = 10): Building3DResponse {
  const isTowerB = buildingId === 11;
  const towerName = isTowerB ? "Tower B" : "Tower A";
  const towerCode = isTowerB ? "TWR-B" : "TWR-A";
  const totalFloors = 20;
  const floorHeight = 3.2;

  const floors: Floor3DItem[] = [];
  let availableCount = 0;
  let reservedCount = 0;
  let bookedCount = 0;
  let soldCount = 0;
  let blockedCount = 0;

  for (let fn = 1; fn <= totalFloors; fn++) {
    const floorUnits: Unit3DItem[] = [
      {
        id: buildingId * 1000 + fn * 10 + 1,
        project_id: 5,
        building_id: buildingId,
        building_name: towerName,
        floor_id: fn,
        floor_number: fn,
        unit_number: "A",
        unit_label: `Flat ${fn}-A`,
        bhk: 2,
        bedrooms: 2,
        bathrooms: 2,
        balconies: 1,
        carpet_area: 880,
        built_up_area: 1020,
        area_sqft: 1020,
        price: 8200000 + fn * 40000,
        price_display: formatInr(8200000 + fn * 40000),
        parking: "1 Covered",
        direction: "East",
        entrance_direction: "North",
        balcony_direction: "East",
        direction_angle: 90,
        balcony_angle: 90,
        entrance_angle: 0,
        position: { x: -8.5, y: (fn - 1) * floorHeight, z: 5.5 },
        wing: "East Wing",
        status: fn === 20 ? "available" : fn % 4 === 1 ? "reserved" : fn % 5 === 0 ? "booked" : "available",
        status_color: "",
        has_3d_tour: true,
      },
      {
        id: buildingId * 1000 + fn * 10 + 2,
        project_id: 5,
        building_id: buildingId,
        building_name: towerName,
        floor_id: fn,
        floor_number: fn,
        unit_number: "B",
        unit_label: `Flat ${fn}-B`,
        bhk: 3,
        bedrooms: 3,
        bathrooms: 3,
        balconies: 2,
        carpet_area: 1250,
        built_up_area: 1450,
        area_sqft: 1450,
        price: 12500000 + fn * 55000,
        price_display: formatInr(12500000 + fn * 55000),
        parking: "2 Covered",
        direction: "West",
        entrance_direction: "East",
        balcony_direction: "West",
        direction_angle: 270,
        balcony_angle: 270,
        entrance_angle: 90,
        position: { x: 8.5, y: (fn - 1) * floorHeight, z: 5.5 },
        wing: "West Wing",
        status: fn === 20 ? "reserved" : fn % 3 === 0 ? "booked" : fn % 7 === 0 ? "sold" : "available",
        status_color: "",
        has_3d_tour: true,
      },
      {
        id: buildingId * 1000 + fn * 10 + 3,
        project_id: 5,
        building_id: buildingId,
        building_name: towerName,
        floor_id: fn,
        floor_number: fn,
        unit_number: "C",
        unit_label: `Flat ${fn}-C`,
        bhk: 3,
        bedrooms: 3,
        bathrooms: 3,
        balconies: 2,
        carpet_area: 1320,
        built_up_area: 1520,
        area_sqft: 1520,
        price: 13500000 + fn * 50000, // Floor 20: 1.45 Cr
        price_display: formatInr(13500000 + fn * 50000),
        parking: "2 Covered",
        direction: "North-East",
        entrance_direction: "North",
        balcony_direction: "North-East",
        direction_angle: 45,
        balcony_angle: 45,
        entrance_angle: 0,
        position: { x: -8.5, y: (fn - 1) * floorHeight, z: -5.5 },
        wing: "North Wing",
        status: "available", // Floor 20 Flat 20-C is specifically AVAILABLE!
        status_color: "",
        has_3d_tour: true,
      },
      {
        id: buildingId * 1000 + fn * 10 + 4,
        project_id: 5,
        building_id: buildingId,
        building_name: towerName,
        floor_id: fn,
        floor_number: fn,
        unit_number: "D",
        unit_label: `Flat ${fn}-D`,
        bhk: 4,
        bedrooms: 4,
        bathrooms: 4,
        balconies: 3,
        carpet_area: 1850,
        built_up_area: 2150,
        area_sqft: 2150,
        price: 18000000 + fn * 80000,
        price_display: formatInr(18000000 + fn * 80000),
        parking: "2 Covered + EV",
        direction: "North",
        entrance_direction: "South",
        balcony_direction: "North",
        direction_angle: 0,
        balcony_angle: 0,
        entrance_angle: 180,
        position: { x: 8.5, y: (fn - 1) * floorHeight, z: -5.5 },
        wing: "North Wing",
        status: fn === 20 ? "sold" : fn % 2 === 0 ? "booked" : fn % 3 === 0 ? "sold" : "available",
        status_color: "",
        has_3d_tour: true,
      },
    ];

    floorUnits.forEach((u) => {
      u.status_color = STATUS_COLORS[u.status] || STATUS_COLORS.available;
      if (u.status === "available") availableCount++;
      else if (u.status === "reserved") reservedCount++;
      else if (u.status === "booked") bookedCount++;
      else if (u.status === "sold") soldCount++;
      else blockedCount++;
    });

    const floorAvail = floorUnits.filter((u) => u.status === "available").length;

    floors.push({
      id: fn,
      floor_number: fn,
      floor_label: `Floor ${fn}`,
      floor_type: fn === 1 ? "podium_residential" : fn === 20 ? "penthouse_residential" : "residential",
      height_offset: (fn - 1) * floorHeight,
      total_units: floorUnits.length,
      available_units: floorAvail,
      units: floorUnits,
    });
  }

  const totalUnits = totalFloors * 4;

  return {
    building: {
      id: buildingId,
      project_id: 5,
      project_name: "ABC Residency",
      project_city: "Pune",
      project_locality: "Baner",
      name: towerName,
      code: towerCode,
      floors_count: totalFloors,
      units_per_floor: 4,
      total_units: totalUnits,
      status: "active",
      floor_height: floorHeight,
      building_width: 38.0,
      building_depth: 24.0,
      orientation: 0,
      front_direction: "North",
      entrance_position: "Center",
      parking_levels: 2,
      amenities: [
        "Rooftop Infinity Pool",
        "Sky Observatory Lounge",
        "High-Speed Otis Elevators",
        "EV Charging Bays",
        "Clubhouse & Gym",
        "24/7 Biometric Security",
      ],
    },
    inventory_summary: {
      total_units: totalUnits,
      available: availableCount,
      reserved: reservedCount,
      booked: bookedCount,
      sold: soldCount,
      blocked: blockedCount,
    },
    status_legend: [
      { status: "available", label: "Available", color: "#10B981", count: availableCount },
      { status: "reserved", label: "Reserved", color: "#F59E0B", count: reservedCount },
      { status: "booked", label: "Booked", color: "#EF4444", count: bookedCount },
      { status: "sold", label: "Sold", color: "#6B7280", count: soldCount },
      { status: "blocked", label: "Blocked", color: "#374151", count: blockedCount },
    ],
    floors,
  };
}

export function generateMockUnitTour(unitId: number): any {
  // Find unit details from ID
  const bId = Math.floor(unitId / 1000) || 10;
  const bData = generateMockBuilding3DData(bId);
  let foundUnit: Unit3DItem | undefined;
  for (const fl of bData.floors) {
    const u = fl.units.find((x) => x.id === unitId);
    if (u) {
      foundUnit = u;
      break;
    }
  }

  const unit: Unit3DItem = foundUnit || bData.floors[19].units[2]; // Default to Floor 20 Unit 20-C

  return {
    property: {
      id: unit.id,
      name: `ABC Residency · ${bData.building.name} · ${unit.unit_label}`,
      title: `${unit.bhk} BHK ${unit.unit_label}`,
      bhk: unit.bhk,
      bathrooms: unit.bathrooms,
      balconies: unit.balconies,
      city: bData.building.project_city,
      locality: bData.building.project_locality,
      address: `ABC Residency, Pan Card Club Road, ${bData.building.project_locality}, ${bData.building.project_city}`,
      area_sqft: unit.area_sqft,
      price: unit.price,
      price_display: unit.price_display,
      description: `Luxurious ${unit.bhk} BHK residence located on Floor ${unit.floor_number} of ${bData.building.name}. Direction: ${unit.direction}, Balcony facing: ${unit.balcony_direction}.`,
      media: [],
    },
    unit_info: {
      unit_id: unit.id,
      unit_number: unit.unit_number,
      unit_label: unit.unit_label,
      floor_number: unit.floor_number,
      floor_label: `Floor ${unit.floor_number}`,
      tower_id: bData.building.id,
      tower_name: bData.building.name,
      project_id: bData.building.project_id,
      project_name: bData.building.project_name,
      bhk: unit.bhk,
      area_sqft: unit.area_sqft,
      carpet_area: unit.carpet_area,
      built_up_area: unit.built_up_area,
      price: unit.price,
      price_display: unit.price_display,
      status: unit.status,
      direction: unit.direction,
      entrance_direction: unit.entrance_direction,
      balcony_direction: unit.balcony_direction,
      wing: unit.wing,
      position_x: unit.position.x,
      position_y: unit.position.y,
      position_z: unit.position.z,
    },
    exterior: {
      selected_floor: unit.floor_number,
      total_floors: bData.building.floors_count,
      balcony_facing: unit.balcony_direction,
      entrance_facing: unit.entrance_direction,
      compass_rotation: unit.direction_angle,
    },
    scene: {
      units: "meters",
      ceiling_height: 2.85,
      wall_thickness: 0.15,
    },
    building: {
      building_type: "apartment",
      total_floors: bData.building.floors_count,
      selected_floor: unit.floor_number,
      city: bData.building.project_city,
      locality: bData.building.project_locality,
    },
    rooms: [
      {
        id: "entrance",
        name: "Grand Entrance Foyer",
        type: "entrance",
        order: 1,
        position: { x: 0, y: 0, z: 1.8 },
        dimensions: { width: 3.0, length: 3.2, height: 2.85 },
        floor_material: "Italian Marble",
        wall_color: "#E2E8F0",
        label: "ENTRANCE",
        subtitle: `Entrance doorway into ${unit.unit_label} with smart digital biometric lock`,
      },
      {
        id: "living_room",
        name: "Living & Dining Hall",
        type: "living_room",
        order: 2,
        position: { x: -0.5, y: 0, z: -2.8 },
        dimensions: { width: 5.8, length: 5.5, height: 2.85 },
        floor_material: "Vitrified Tiles",
        wall_color: "#F8FAFC",
        label: "LIVING ROOM",
        subtitle: "Expansive central living hall with 10.5 ft ceiling and sunset exposure",
      },
      {
        id: "kitchen",
        name: "Modular Gourmet Kitchen",
        type: "kitchen",
        order: 3,
        position: { x: 4.4, y: 0, z: -2.6 },
        dimensions: { width: 3.6, length: 4.6, height: 2.85 },
        floor_material: "Granite",
        wall_color: "#F1F5F9",
        label: "KITCHEN",
        subtitle: "German modular kitchen with quartz island counter & utility area",
      },
      {
        id: "master_bedroom",
        name: "Master Suite with Deck",
        type: "bedroom",
        order: 4,
        position: { x: -2.6, y: 0, z: -8.0 },
        dimensions: { width: 5.0, length: 5.4, height: 2.85 },
        floor_material: "Hardwood Timber",
        wall_color: "#E2E8F0",
        label: "MASTER BEDROOM",
        subtitle: "Luxurious master bedroom suite with hardwood timber flooring",
      },
      {
        id: "bedroom_2",
        name: "Bedroom 2 / Children's Room",
        type: "bedroom",
        order: 5,
        position: { x: 2.2, y: 0, z: -8.0 },
        dimensions: { width: 4.4, length: 5.0, height: 2.85 },
        floor_material: "wood",
        wall_color: "#F8FAFC",
        label: "BEDROOM 2",
        subtitle: "Second bedroom with custom wardrobe and study desk",
      },
      {
        id: "bathroom_1",
        name: "Designer Bathroom",
        type: "bathroom",
        order: 6,
        position: { x: -4.8, y: 0, z: -11.4 },
        dimensions: { width: 2.6, length: 3.0, height: 2.85 },
        floor_material: "tile",
        wall_color: "#CBD5E1",
        label: "BATHROOM",
        subtitle: "Kohler sanitary fittings with glass partition rain shower",
      },
      {
        id: "balcony",
        name: "Panoramic Sunset Balcony",
        type: "balcony",
        order: 7,
        position: { x: 0, y: 0, z: -12.4 },
        dimensions: { width: 5.4, length: 2.6, height: 2.85 },
        floor_material: "concrete",
        wall_color: "#CBD5E1",
        label: "BALCONY VIEW",
        subtitle: `Scenic open balcony overlooking ${bData.building.project_city} horizon`,
      },
    ],
    doors: [
      {
        id: "main_door",
        name: "Main Entrance Door",
        is_main_entrance: true,
        is_balcony: false,
        position: [0, 0, 0] as [number, number, number],
        width: 1.15,
        height: 2.25,
      },
      {
        id: "door_balcony",
        name: "Balcony Sliding Door",
        is_main_entrance: false,
        is_balcony: true,
        position: [0, 0, -10.8] as [number, number, number],
        width: 2.2,
        height: 2.35,
      },
    ],
    camera_path: [
      {
        id: "c1",
        step_name: "Front Elevation",
        room_id: "exterior",
        position: [0, 6.5, 20] as [number, number, number],
        look_at: [0, 3.5, 0] as [number, number, number],
        duration: 4,
        action: "none" as const,
        label: "PROPERTY FRONT VIEW",
      },
      {
        id: "c2",
        step_name: "Entrance Approach",
        room_id: "entrance",
        position: [0, 1.7, 4.5] as [number, number, number],
        look_at: [0, 1.6, 0] as [number, number, number],
        duration: 3,
        action: "none" as const,
        label: "ENTRANCE",
      },
      {
        id: "c3",
        step_name: "Door Open",
        room_id: "entrance",
        position: [0, 1.7, 1.8] as [number, number, number],
        look_at: [0, 1.6, -1] as [number, number, number],
        duration: 2.5,
        action: "door_open" as const,
        label: "ENTRANCE",
      },
      {
        id: "c4",
        step_name: "Living Room",
        room_id: "living_room",
        position: [0, 1.7, -1.2] as [number, number, number],
        look_at: [-1.6, 1.5, -3.8] as [number, number, number],
        duration: 3.5,
        action: "none" as const,
        label: "LIVING ROOM",
      },
      {
        id: "c5",
        step_name: "Kitchen",
        room_id: "kitchen",
        position: [3.6, 1.7, -2.2] as [number, number, number],
        look_at: [5.2, 1.4, -3.5] as [number, number, number],
        duration: 3.5,
        action: "none" as const,
        label: "KITCHEN",
      },
      {
        id: "c6",
        step_name: "Master Suite",
        room_id: "master_bedroom",
        position: [-2.2, 1.7, -6.8] as [number, number, number],
        look_at: [-2.6, 1.4, -9.5] as [number, number, number],
        duration: 3.5,
        action: "pan_180" as const,
        label: "MASTER BEDROOM",
      },
      {
        id: "c7",
        step_name: "Balcony Approach",
        room_id: "balcony",
        position: [0, 1.7, -10.2] as [number, number, number],
        look_at: [0, 1.6, -14] as [number, number, number],
        duration: 2,
        action: "balcony_open" as const,
        label: "BALCONY VIEW",
      },
      {
        id: "c8",
        step_name: "Sunset Skyline View",
        room_id: "balcony",
        position: [0, 1.7, -12] as [number, number, number],
        look_at: [0, 1.6, -20] as [number, number, number],
        duration: 3.5,
        action: "exterior_view" as const,
        label: "BALCONY VIEW",
      },
      {
        id: "c9",
        step_name: "Tour Complete",
        room_id: "balcony",
        position: [0, 1.7, -12] as [number, number, number],
        look_at: [0, 1.6, -20] as [number, number, number],
        duration: 2,
        action: "complete" as const,
        label: "TOUR COMPLETE",
      },
    ],
    furniture: [
      { id: "furn_sofa", type: "sofa", room_id: "living_room", position: [2, 0.45, -2.5] as [number, number, number], rotation_y: 0 },
      { id: "furn_bed", type: "bed", room_id: "master_bedroom", position: [-2.6, 0.5, -8.5] as [number, number, number], rotation_y: 0 },
      { id: "furn_dining", type: "dining_table", room_id: "living_room", position: [-1.5, 0.4, -4.0] as [number, number, number], rotation_y: 0 },
    ],
    interactive_hotspots: [
      { id: "hotspot_balcony_view", position: { x: 0, y: 1.5, z: -12.4 }, title: "Sunset Skyline View", description: "Clear unhindered horizon view facing west-northwest with sunset exposure." },
      { id: "hotspot_smart_locks", position: { x: 0, y: 1.2, z: 1.8 }, title: "Smart Biometric Lock", description: "Fingerprint, passcode, and mobile app controlled digital access lock." },
    ],
  };
}

export function generateMockProjectBuildings(projectId: number = 5): any[] {
  return [
    {
      id: 10,
      project_id: projectId,
      name: "Tower A",
      code: "TWR-A",
      floors_count: 20,
      units_per_floor: 4,
      total_units: 80,
      status: "active",
      available_units: 48,
    },
    {
      id: 11,
      project_id: projectId,
      name: "Tower B",
      code: "TWR-B",
      floors_count: 20,
      units_per_floor: 4,
      total_units: 80,
      status: "active",
      available_units: 42,
    },
  ];
}
