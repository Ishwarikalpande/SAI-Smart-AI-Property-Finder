export interface FurnitureItem {
  id: string;
  name: string;
  category: "seating" | "storage" | "bedding" | "lighting" | "appliances" | "fixtures" | "decor";
  brandOrFinish: string;
  material: string;
  dimensions: string;
  description: string;
}

export interface RoomHotspot {
  id: string;
  type: "furniture" | "doorway" | "feature";
  x: number; // percentage 5 to 95
  y: number; // percentage 10 to 90
  label: string;
  targetRoomId?: string;
  furnitureItem?: FurnitureItem;
  details?: string;
}

export interface FurnishedRoom {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  category: "entrance" | "living" | "dining" | "kitchen" | "bedroom" | "bathroom" | "balcony";
  dimensions: string;
  carpetAreaSqft: number;
  primaryImageUrl: string;
  fallbackImageUrl?: string;
  panoramaImageUrl: string;
  thumbnailUrl: string;
  isVerifiedActualPhoto: boolean;
  furnitureList: FurnitureItem[];
  hotspots: RoomHotspot[];
  nextRoomId: string;
  prevRoomId: string;
  roomOrder: number;
}

export interface FurnishedFlatTourData {
  propertyId: number;
  propertyTitle: string;
  location: string;
  city: string;
  bhk: number;
  bhkDisplay: string;
  areaSqft: number;
  areaDisplay: string;
  priceDisplay: string;
  isVerified: boolean;
  isRera: boolean;
  isWalkthroughAvailable: boolean;
  rooms: FurnishedRoom[];
  floorPlanSvgUrl?: string;
}

/**
 * Builds the complete 8-room fully furnished virtual flat tour for a property.
 * Strictly adheres to the 8 required spaces with 100% matched, high-resolution visuals.
 */
export function buildFurnishedFlatTour(
  propertyId: number,
  prop: any,
  walkthroughData?: any
): FurnishedFlatTourData {
  const p = prop || {};
  const propType = (p.property_type || p.type || "Apartment").toLowerCase();

  // If raw land/plot with no indoor flat structure
  if (propType === "plot" || propType === "land") {
    return {
      propertyId,
      propertyTitle: p.name || p.title || "Selected Property",
      location: p.location || p.locality || "Pune",
      city: p.city || "Pune",
      bhk: 0,
      bhkDisplay: "Plot / Land",
      areaSqft: p.area_sqft || 0,
      areaDisplay: p.area || `${p.area_sqft || 0} sq.ft`,
      priceDisplay: p.price || "₹0",
      isVerified: Boolean(p.verified || p.is_verified),
      isRera: Boolean(p.rera || p.is_rera),
      isWalkthroughAvailable: false,
      rooms: [],
    };
  }

  // Extract property specs
  const title = p.name || p.title || "Luxurious 2BHK Apartment";
  const location = p.location || `${p.locality || "Kalyani Nagar"}, ${p.city || "Pune"}`;
  const city = p.city || "Pune";
  const rawBhk = typeof p.bhk === "number" ? p.bhk : (parseInt(p.type) || (title.match(/(\d)\s*BHK/i)?.[1] ? parseInt(title.match(/(\d)\s*BHK/i)[1]) : 2));
  const bhk = Math.max(1, rawBhk || 2);
  const bhkDisplay = `${bhk} BHK Flat`;
  const areaSqft = p.area_sqft || (bhk === 1 ? 650 : bhk === 2 ? 1150 : 1600);
  const areaDisplay = p.area || `${areaSqft.toLocaleString("en-IN")} sq.ft`;
  const priceDisplay = p.price || "₹85 Lakh";
  const isVerified = Boolean(p.verified || p.is_verified);
  const isRera = Boolean(p.rera || p.is_rera);

  // 1. ENTRANCE AND FOYER
  const entranceRoom: FurnishedRoom = {
    id: "entrance",
    roomOrder: 1,
    name: "Entrance and Foyer",
    shortName: "Entrance & Foyer",
    subtitle: "Private entryway with fluted oak console, backlit brass halo mirror & biometric smart lock",
    category: "entrance",
    dimensions: "8'0\" × 6'6\"",
    carpetAreaSqft: 52,
    primaryImageUrl: "/assets/rooms/entrance.jpg",
    fallbackImageUrl: "https://images.unsplash.com/photo-1670244208613-6da9cefb3ba1?w=1920&auto=format&fit=crop&q=85",
    panoramaImageUrl: "/assets/rooms/entrance.jpg",
    thumbnailUrl: "/assets/rooms/entrance_thumb.jpg",
    isVerifiedActualPhoto: false,
    furnitureList: [
      {
        id: "ent-1",
        name: "Teak Main Door & Digital Smart Lock",
        category: "fixtures",
        brandOrFinish: "Yale Touchscreen Deadbolt with Biometric & RFID",
        material: "Burma Teak with Matte Brass Vertical Handle",
        dimensions: "7'0\" × 3'6\" × 2\" thick",
        description: "Heavy acoustic-insulated solid teak entrance door equipped with biometric fingerprint and keyless PIN entry.",
      },
      {
        id: "ent-2",
        name: "Fluted Oak Console Table with Marble Top",
        category: "storage",
        brandOrFinish: "Natural Fluted Oak with Carrara Marble",
        material: "Solid Oak Ribbed Tambour & Polished Italian Marble",
        dimensions: "44\" W × 14\" D × 32\" H",
        description: "Contemporary entryway console table featuring ribbed wooden tambour detailing and a scratch-resistant marble surface.",
      },
      {
        id: "ent-3",
        name: "Circular Backlit Brass Halo Mirror",
        category: "decor",
        brandOrFinish: "Warm 3000K Indirect Ambient LED Halo",
        material: "Brushed Brass Rim & Distortion-Free Silver Glass",
        dimensions: "36\" Diameter",
        description: "Statement circular mirror with warm ambient backlight creating an inviting glow upon entering the apartment.",
      },
      {
        id: "ent-4",
        name: "Ventilated Slatted Shoe Storage Bench",
        category: "storage",
        brandOrFinish: "Natural Oak with Neutral Fabric Cushion",
        material: "Engineered Wood with Breathable Slats & High-Density Foam",
        dimensions: "42\" W × 15\" D × 19\" H",
        description: "Ergonomic foyer shoe organizer bench allowing comfortable seating while storing up to 12 pairs of footwear.",
      },
      {
        id: "ent-5",
        name: "Architectural Recessed Ceiling Spotlights",
        category: "lighting",
        brandOrFinish: "Philips CRI 95 Dimmable Warm Spotlights",
        material: "Die-Cast Aluminum in Matte White Trim",
        dimensions: "75mm Recessed Cutout",
        description: "Anti-glare ceiling spotlights illuminating the entryway gallery path and accent wall artwork.",
      },
    ],
    hotspots: [
      {
        id: "ent-hs-1",
        type: "furniture",
        x: 18,
        y: 50,
        label: "Teak Main Door & Biometric Lock",
        details: "Yale Touchscreen Biometric Smart Lock & Solid Burma Teak Door with Brass Handle",
      },
      {
        id: "ent-hs-2",
        type: "furniture",
        x: 48,
        y: 45,
        label: "Fluted Console & Backlit Mirror",
        details: "Fluted Natural Oak Console with Marble Top & 36\" Warm 3000K Ambient Halo Mirror",
      },
      {
        id: "ent-hs-3",
        type: "furniture",
        x: 68,
        y: 78,
        label: "Slatted Shoe Storage Bench",
        details: "Natural Wood Slatted Shoe Organizer with Upholstered Cushion Seating",
      },
      {
        id: "ent-hs-portal",
        type: "doorway",
        x: 88,
        y: 52,
        label: "Step into Living Room →",
        targetRoomId: "living-room",
      },
    ],
    nextRoomId: "living-room",
    prevRoomId: "balcony",
  };

  // 2. LIVING ROOM
  const livingRoom: FurnishedRoom = {
    id: "living-room",
    roomOrder: 2,
    name: "Living Room",
    shortName: "Living Room",
    subtitle: "Spacious central lounge with L-shaped bouclé sectional, Calacatta marble table & 65\" OLED TV",
    category: "living",
    dimensions: "16'6\" × 13'0\"",
    carpetAreaSqft: 214,
    primaryImageUrl: "/assets/rooms/living-room.jpg",
    fallbackImageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&auto=format&fit=crop&q=85",
    panoramaImageUrl: "/assets/rooms/living-room.jpg",
    thumbnailUrl: "/assets/rooms/living-room_thumb.jpg",
    isVerifiedActualPhoto: false,
    furnitureList: [
      {
        id: "liv-1",
        name: "L-Shaped Sectional Sofa in Mist Grey Bouclé",
        category: "seating",
        brandOrFinish: "Textured Water-Repellent Bouclé Fabric",
        material: "Kiln-Dried Hardwood Frame with High-Resilience Memory Foam",
        dimensions: "112\" W × 68\" Chaise Depth × 33\" H",
        description: "Deep, comfortable modular corner sofa with down-filled accent cushions and stain-resistant fabric.",
      },
      {
        id: "liv-2",
        name: "Honed Calacatta Gold Marble Coffee Table",
        category: "decor",
        brandOrFinish: "Natural Veined Calacatta Marble with Brass Legs",
        material: "Italian Natural Marble Slab with Brushed Brass Base",
        dimensions: "36\" Dia × 16\" H",
        description: "Sculptural round coffee table featuring warm gold veining and beveled anti-chip safety perimeter.",
      },
      {
        id: "liv-3",
        name: "65\" Smart 4K OLED TV & Floating Walnut Media Unit",
        category: "appliances",
        brandOrFinish: "LG OLED C3 Cinema Display on Custom Walnut Console",
        material: "Ultra-Thin Bezel Glass & Natural American Walnut Veneer",
        dimensions: "TV: 57\" W × 33\" H | Console: 84\" W × 16\" D × 14\" H",
        description: "Flush wall-mounted cinematic 4K display above a floating credenza with integrated warm under-cabinet LED wash.",
      },
      {
        id: "liv-4",
        name: "Floor-to-Ceiling Motorized Linen Drapes",
        category: "decor",
        brandOrFinish: "Double Track (Sheer Sunlight + 95% Blackout)",
        material: "100% Belgian Linen & Textured Voile",
        dimensions: "16' Span × 9'6\" Drop",
        description: "Dual-layer motorized curtains framing the panoramic sliding doors leading out to the balcony.",
      },
      {
        id: "liv-5",
        name: "Architectural Cove Ceiling Lighting",
        category: "lighting",
        brandOrFinish: "Warm Dim 2700K - 3200K Perimeter LED",
        material: "Recessed Aluminum Extrusion with Opal Diffuser",
        dimensions: "Ceiling Perimeter",
        description: "Glare-free indirect cove illumination washing warm ambient light across the lounge and media wall.",
      },
    ],
    hotspots: [
      {
        id: "liv-hs-1",
        type: "furniture",
        x: 30,
        y: 75,
        label: "L-Shaped Bouclé Sectional Sofa",
        details: "Plush Mist Grey Bouclé Modular Lounge Sofa with Down-Filled Cushions",
      },
      {
        id: "liv-hs-2",
        type: "furniture",
        x: 55,
        y: 76,
        label: "Calacatta Marble Coffee Table",
        details: "36\" Honed Natural Italian Marble Slab with Brushed Brass Tripod Legs",
      },
      {
        id: "liv-hs-3",
        type: "furniture",
        x: 75,
        y: 48,
        label: "65\" OLED TV & Walnut Console",
        details: "4K OLED Cinema Screen above 84\" Floating American Walnut Media Console",
      },
      {
        id: "liv-hs-portal-balcony",
        type: "doorway",
        x: 24,
        y: 45,
        label: "Step onto Balcony →",
        targetRoomId: "balcony",
      },
      {
        id: "liv-hs-portal-dining",
        type: "doorway",
        x: 92,
        y: 55,
        label: "Go to Dining Area →",
        targetRoomId: "dining-area",
      },
    ],
    nextRoomId: "dining-area",
    prevRoomId: "entrance",
  };

  // 3. DINING AREA
  const diningRoom: FurnishedRoom = {
    id: "dining-area",
    roomOrder: 3,
    name: "Dining Area",
    shortName: "Dining Area",
    subtitle: "6-seater Statuario sintered stone dining suite with linear brass chandelier & credenza",
    category: "dining",
    dimensions: "11'6\" × 9'6\"",
    carpetAreaSqft: 109,
    primaryImageUrl: "/assets/rooms/dining-area.jpg",
    fallbackImageUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1920&auto=format&fit=crop&q=85",
    panoramaImageUrl: "/assets/rooms/dining-area.jpg",
    thumbnailUrl: "/assets/rooms/dining-area_thumb.jpg",
    isVerifiedActualPhoto: false,
    furnitureList: [
      {
        id: "din-1",
        name: "6-Seater Sintered Stone Dining Table",
        category: "seating",
        brandOrFinish: "Statuario White Sintered Porcelain Surface",
        material: "12mm Scratch & Heat Resistant Porcelain with Matte Black Steel Base",
        dimensions: "72\" L × 36\" W × 30\" H",
        description: "Non-porous, stain-proof stone surface capable of holding hot cookware directly with chamfered edges.",
      },
      {
        id: "din-2",
        name: "Ergonomic Upholstered Dining Chairs (Set of 6)",
        category: "seating",
        brandOrFinish: "Warm Oatmeal Performance Textured Fabric",
        material: "Solid Walnut Legs with High-Density Cushioning",
        dimensions: "21\" W × 22\" D × 32\" H (18\" Seat Height)",
        description: "Contoured barrel-back dining chairs offering premium spinal support and stain-guarded fabric.",
      },
      {
        id: "din-3",
        name: "Linear Brushed Brass Chandelier",
        category: "lighting",
        brandOrFinish: "Architectural 8-Globe Frosted Glass Pendant",
        material: "Spun Brass with Matte Opal Diffusers",
        dimensions: "52\" L × 10\" W × 24\" Drop",
        description: "Statement horizontal overhead lighting delivering glare-free warm illumination directly over the dining table.",
      },
      {
        id: "din-4",
        name: "Fluted Walnut Credenza & Gold Leaf Art",
        category: "storage",
        brandOrFinish: "Tambour Walnut Fronts with Push-to-Open",
        material: "American Walnut & Brass Accents",
        dimensions: "64\" W × 18\" D × 30\" H",
        description: "Elegant storage credenza for dinnerware, glassware, and serving pieces with modern gold-leaf art above.",
      },
    ],
    hotspots: [
      {
        id: "din-hs-1",
        type: "furniture",
        x: 48,
        y: 64,
        label: "Sintered Stone Dining Table",
        details: "72\" Statuario Porcelain 6-Seater Dining Table & Walnut Upholstered Chairs",
      },
      {
        id: "din-hs-2",
        type: "furniture",
        x: 50,
        y: 16,
        label: "Linear Brass Chandelier",
        details: "8-Globe Frosted Glass Architectural Pendant Chandelier in Brushed Brass",
      },
      {
        id: "din-hs-3",
        type: "furniture",
        x: 82,
        y: 58,
        label: "Fluted Walnut Credenza",
        details: "64\" Tambour Wood Buffet Cabinet & Modern Abstract Gold-Leaf Artwork",
      },
      {
        id: "din-hs-portal-kit",
        type: "doorway",
        x: 88,
        y: 35,
        label: "Enter Modular Kitchen →",
        targetRoomId: "modular-kitchen",
      },
      {
        id: "din-hs-portal-liv",
        type: "doorway",
        x: 12,
        y: 60,
        label: "← Back to Living",
        targetRoomId: "living-room",
      },
    ],
    nextRoomId: "modular-kitchen",
    prevRoomId: "living-room",
  };

  // 4. MODULAR KITCHEN
  const kitchenRoom: FurnishedRoom = {
    id: "modular-kitchen",
    roomOrder: 4,
    name: "Modular Kitchen",
    shortName: "Modular Kitchen",
    subtitle: "Two-tone sage & oak cabinetry with quartz waterfall island, Bosch appliances & glass chimney",
    category: "kitchen",
    dimensions: "10'6\" × 8'6\"",
    carpetAreaSqft: 89,
    primaryImageUrl: "/assets/rooms/modular-kitchen.jpg",
    fallbackImageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1920&auto=format&fit=crop&q=85",
    panoramaImageUrl: "/assets/rooms/modular-kitchen.jpg",
    thumbnailUrl: "/assets/rooms/modular-kitchen_thumb.jpg",
    isVerifiedActualPhoto: false,
    furnitureList: [
      {
        id: "kit-1",
        name: "Two-Tone Matte Sage & Oak Modular Cabinets",
        category: "storage",
        brandOrFinish: "Häfele Soft-Close Tandem Drawers & Lift-Up Wall Units",
        material: "BWR Marine Plywood with Anti-Fingerprint Acrylic & Oak Laminate",
        dimensions: "Upper: 12' Run | Lower: 14' Run",
        description: "Handleless J-pull kitchen cabinets with integrated cutlery organizers and tall pantry pull-out unit.",
      },
      {
        id: "kit-2",
        name: "Quartz Waterfall Breakfast Island with Barstools",
        category: "fixtures",
        brandOrFinish: "Caesarstone Pure White Quartz Waterfall Slab",
        material: "20mm Engineered Natural Quartz & Oak Counter Support",
        dimensions: "7' L × 34\" W with 3 Rattan-Back Stools",
        description: "Stain, scratch, and heat-resistant quartz island serving as both a prep counter and informal breakfast bar.",
      },
      {
        id: "kit-3",
        name: "Built-In Stainless Steel Oven & Microwave Unit",
        category: "appliances",
        brandOrFinish: "Bosch Serie 6 Built-In Oven & Microwave Combo",
        material: "Black Glass & Stainless Steel Trim",
        dimensions: "Standard 24\" Appliance Tall Niche",
        description: "Ergonomically positioned eye-level convection baking oven and sensor microwave.",
      },
      {
        id: "kit-4",
        name: "4-Burner Glass Hob & Curved Glass Chimney",
        category: "appliances",
        brandOrFinish: "Faber Curved Glass 1200 m³/hr Auto-Clean Hood",
        material: "8mm Toughened Beveled Glass & Stainless Steel Blower",
        dimensions: "30\" W Cooktop with 36\" Hood",
        description: "Gesture-control auto-cleaning suction chimney paired with heavy cast-iron trivet gas cooktop.",
      },
      {
        id: "kit-5",
        name: "Undermount Composite Sink & Brushed Brass Pull-Out Faucet",
        category: "fixtures",
        brandOrFinish: "Carysil Matte Black Granite Sink + Swivel Pull-Out Tap",
        material: "Quartz Composite (80% Quartz) & Solid Brass Faucet",
        dimensions: "24\" × 18\" Deep Bowl",
        description: "Acoustic sound-absorbing quartz sink with dual-spray pull-out swivel faucet for easy food preparation.",
      },
    ],
    hotspots: [
      {
        id: "kit-hs-1",
        type: "furniture",
        x: 62,
        y: 75,
        label: "Quartz Waterfall Island & Barstools",
        details: "Caesarstone 20mm Pure White Quartz Waterfall Island with 3 Oak & Cane Barstools",
      },
      {
        id: "kit-hs-2",
        type: "furniture",
        x: 34,
        y: 22,
        label: "Two-Tone Sage & Oak Cabinets",
        details: "Häfele German Soft-Close Tandem Drawers & Handleless Upper Lift-Up Cabinets",
      },
      {
        id: "kit-hs-3",
        type: "furniture",
        x: 17,
        y: 50,
        label: "Built-In Bosch Oven & Microwave",
        details: "Bosch Serie 6 Built-in Convection Oven and Auto-Sensor Microwave Unit",
      },
      {
        id: "kit-hs-4",
        type: "furniture",
        x: 62,
        y: 26,
        label: "Glass Gas Hob & Curved Chimney",
        details: "Faber 1200 m³/hr Gesture-Control Chimney Hood & 4-Burner Toughened Glass Cooktop",
      },
      {
        id: "kit-hs-portal-mbr",
        type: "doorway",
        x: 92,
        y: 50,
        label: "Enter Master Bedroom →",
        targetRoomId: "master-bedroom",
      },
      {
        id: "kit-hs-portal-din",
        type: "doorway",
        x: 8,
        y: 50,
        label: "← Back to Dining",
        targetRoomId: "dining-area",
      },
    ],
    nextRoomId: "master-bedroom",
    prevRoomId: "dining-area",
  };

  // 5. MASTER BEDROOM
  const masterBedroom: FurnishedRoom = {
    id: "master-bedroom",
    roomOrder: 5,
    name: "Master Bedroom",
    shortName: "Master Bedroom",
    subtitle: "Master retreat with king-size hydraulic storage bed, glass illuminated wardrobe & ensuite",
    category: "bedroom",
    dimensions: "15'0\" × 12'6\"",
    carpetAreaSqft: 187,
    primaryImageUrl: "/assets/rooms/master-bedroom.jpg",
    fallbackImageUrl: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1920&auto=format&fit=crop&q=85",
    panoramaImageUrl: "/assets/rooms/master-bedroom.jpg",
    thumbnailUrl: "/assets/rooms/master-bedroom_thumb.jpg",
    isVerifiedActualPhoto: false,
    furnitureList: [
      {
        id: "mbr-1",
        name: "King-Size Hydraulic Storage Bed & Extended Headboard",
        category: "bedding",
        brandOrFinish: "Textured Natural Oatmeal Chenille Headboard",
        material: "Reinforced Solid Pine & Gas Lift Mechanism",
        dimensions: "78\" W × 84\" L × 52\" Headboard Height",
        description: "Heavy-duty gas strut lift-up bed frame providing massive dust-proof storage chamber under the mattress.",
      },
      {
        id: "mbr-2",
        name: "Floor-to-Ceiling Tinted Glass Wardrobe with LED Rails",
        category: "storage",
        brandOrFinish: "Smoked Grey Glass Doors with Integrated Profile LEDs",
        material: "Toughened Aluminum Framed Glass & Walnut Carcass",
        dimensions: "10' W × 9'6\" H × 24\" D",
        description: "Custom wardrobe with automatic sensor lighting, velvet-lined jewelry drawers, and pull-out trouser racks.",
      },
      {
        id: "mbr-3",
        name: "Dual Floating Walnut Bedside Tables",
        category: "storage",
        brandOrFinish: "Walnut with Soft-Close Blum Slides",
        material: "American Walnut with Built-in USB Fast Charger",
        dimensions: "22\" W × 16\" D × 8\" H each",
        description: "Seamless wall-mounted nightstands paired with ceramic bedside table lamps delivering warm 2700K reading light.",
      },
      {
        id: "mbr-4",
        name: "Woven Cane Foot-of-Bed Bench",
        category: "seating",
        brandOrFinish: "Solid Ash Wood with Natural Cane Weave",
        material: "Solid Wood & Hand-Woven Rattan Cane",
        dimensions: "48\" W × 16\" D × 18\" H",
        description: "Artisan bench providing convenient seating while dressing and keeping throw blankets organized.",
      },
      {
        id: "mbr-5",
        name: "Panoramic Picture Window with Blackout Drapes",
        category: "decor",
        brandOrFinish: "98% Thermal Blackout & Sheer Voile",
        material: "Natural Flax Linen",
        dimensions: "8' W × 7' H",
        description: "Sound-damped window frames with floor-to-ceiling drapery ensuring peaceful sleep and acoustic insulation.",
      },
    ],
    hotspots: [
      {
        id: "mbr-hs-1",
        type: "furniture",
        x: 50,
        y: 66,
        label: "King Hydraulic Bed & Headboard",
        details: "78\"×84\" Lift-Up Gas Storage Bed with Extended Oatmeal Chenille Headboard & Cotton Linens",
      },
      {
        id: "mbr-hs-2",
        type: "furniture",
        x: 34,
        y: 62,
        label: "Floating Walnut Nightstand",
        details: "Wall-Mounted American Walnut Bedside Table with Built-In Fast Charger & Ceramic Lamp",
      },
      {
        id: "mbr-hs-3",
        type: "furniture",
        x: 83,
        y: 45,
        label: "Glass-Front Wardrobe with LED Rails",
        details: "10-Foot Floor-to-Ceiling Smoked Glass Sliding Wardrobe with Motion-Sensor Lighting",
      },
      {
        id: "mbr-hs-portal-bath",
        type: "doorway",
        x: 90,
        y: 55,
        label: "Master Attached Bath →",
        targetRoomId: "bathroom",
      },
      {
        id: "mbr-hs-portal-bed2",
        type: "doorway",
        x: 12,
        y: 55,
        label: "Go to Second Bedroom →",
        targetRoomId: "second-bedroom",
      },
    ],
    nextRoomId: "second-bedroom",
    prevRoomId: "modular-kitchen",
  };

  // 6. SECOND BEDROOM
  const bedroom2: FurnishedRoom = {
    id: "second-bedroom",
    roomOrder: 6,
    name: "Second Bedroom",
    shortName: "Second Bedroom",
    subtitle: "Comfortable bedroom with queen bed, floating bookshelves & dedicated study workstation",
    category: "bedroom",
    dimensions: "12'6\" × 11'0\"",
    carpetAreaSqft: 138,
    primaryImageUrl: "/assets/rooms/second-bedroom.jpg",
    fallbackImageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1920&auto=format&fit=crop&q=85",
    panoramaImageUrl: "/assets/rooms/second-bedroom.jpg",
    thumbnailUrl: "/assets/rooms/second-bedroom_thumb.jpg",
    isVerifiedActualPhoto: false,
    furnitureList: [
      {
        id: "b2-1",
        name: "Queen-Size Upholstered Storage Bed",
        category: "bedding",
        brandOrFinish: "Textured Heather Grey Fabric with High-Density Foam",
        material: "Solid Pine & Engineered Wood with 4 Rolling Storage Drawers",
        dimensions: "64\" W × 82\" L × 44\" Headboard Height",
        description: "Comfortable queen bed with 4 under-bed rolling drawers for extra bed linen and storage.",
      },
      {
        id: "b2-2",
        name: "Dedicated Study Desk with Cable Management",
        category: "storage",
        brandOrFinish: "Natural Oak Worktop with Leather Desk Pad",
        material: "Solid Oak & Steel Structure with Cable Spine",
        dimensions: "48\" W × 24\" D × 29.5\" H",
        description: "Productive work-from-home desk with integrated brass task lamp and built-in power strip recess.",
      },
      {
        id: "b2-3",
        name: "Ergonomic Task Swivel Chair",
        category: "seating",
        brandOrFinish: "Breathable Korean Mesh & Solid Oak Arm Accents",
        material: "Cast Aluminum Base & Class-4 Gas Lift",
        dimensions: "Adjustable 38\" to 43\" H",
        description: "Full lumbar support chair with 3D adjustable arms and multi-tilt lock for long working sessions.",
      },
      {
        id: "b2-4",
        name: "Floating Oak Display Bookshelves",
        category: "storage",
        brandOrFinish: "Natural Oak with Concealed Mounting Brackets",
        material: "Solid White Oak with Clear Satin Finish",
        dimensions: "48\" W × 9\" D × 1.5\" Thick each",
        description: "Triple-tier floating shelving displaying books, framed photography, and cascading indoor pothos greenery.",
      },
      {
        id: "b2-5",
        name: "Floor-to-Ceiling White Matte Wardrobe",
        category: "storage",
        brandOrFinish: "Matte White Finish with Soft-Close Hinges",
        material: "Commercial Grade Marine Plywood",
        dimensions: "60\" W × 9'6\" H × 22\" D",
        description: "Full-height wardrobe with loft overhead storage, hanging rail, and internal drawer stack.",
      },
    ],
    hotspots: [
      {
        id: "b2-hs-1",
        type: "furniture",
        x: 32,
        y: 68,
        label: "Queen Upholstered Bed",
        details: "64\"×82\" Queen Bed with Heather Grey Headboard & 4 Under-Bed Storage Drawers",
      },
      {
        id: "b2-hs-2",
        type: "furniture",
        x: 18,
        y: 26,
        label: "Floating Oak Bookshelves",
        details: "Triple-Tier Solid Oak Floating Shelves with Books and Cascading Houseplants",
      },
      {
        id: "b2-hs-3",
        type: "furniture",
        x: 80,
        y: 75,
        label: "Study Desk & Ergonomic Chair",
        details: "Natural Oak Study Workstation with Brass Task Lamp & Adjustable Ergonomic Chair",
      },
      {
        id: "b2-hs-4",
        type: "furniture",
        x: 78,
        y: 32,
        label: "Floor-to-Ceiling Wardrobe",
        details: "Full-Height Soft-Close Matte White Wardrobe with Loft Storage Compartment",
      },
      {
        id: "b2-hs-portal-bath",
        type: "doorway",
        x: 90,
        y: 50,
        label: "Go to Bathrooms →",
        targetRoomId: "bathroom",
      },
      {
        id: "b2-hs-portal-mbr",
        type: "doorway",
        x: 12,
        y: 50,
        label: "← Master Bedroom",
        targetRoomId: "master-bedroom",
      },
    ],
    nextRoomId: "bathroom",
    prevRoomId: "master-bedroom",
  };

  // 7. ATTACHED BATHROOM AND COMMON BATHROOM
  const bathroomRoom: FurnishedRoom = {
    id: "bathroom",
    roomOrder: 7,
    name: "Attached Bathroom and Common Bathroom",
    shortName: "Bathrooms",
    subtitle: "Frameless glass rain-shower cubicle, floating double vanity with Calacatta quartz & rimless WC",
    category: "bathroom",
    dimensions: "8'6\" × 5'6\" & 7'6\" × 5'0\"",
    carpetAreaSqft: 85,
    primaryImageUrl: "/assets/rooms/bathroom.jpg",
    fallbackImageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&auto=format&fit=crop&q=85",
    panoramaImageUrl: "/assets/rooms/bathroom.jpg",
    thumbnailUrl: "/assets/rooms/bathroom_thumb.jpg",
    isVerifiedActualPhoto: false,
    furnitureList: [
      {
        id: "bth-1",
        name: "Frameless Glass Rain Shower Cubicle",
        category: "fixtures",
        brandOrFinish: "Kohler 10-Inch Matte Black Rain Shower + Hand Wand",
        material: "10mm Toughened Safety Glass with Anti-Limescale Coating",
        dimensions: "44\" × 42\" Enclosure × 80\" H",
        description: "Thermostatic mixer with ceiling-mounted rainfall head, separate handheld wand, and recessed shampoo niche.",
      },
      {
        id: "bth-2",
        name: "Floating Walnut Double Vanity with Calacatta Quartz Counter",
        category: "fixtures",
        brandOrFinish: "Calacatta Quartz with Dual Ceramic Undermount Basins",
        material: "Engineered Natural Quartz & Moisture-Proof Marine Plywood",
        dimensions: "72\" W × 22\" D × 20\" H",
        description: "Expansive double vanity with deep soft-close drawers and matte black basin mixers.",
      },
      {
        id: "bth-3",
        name: "Dual Round LED Backlit Anti-Fog Vanity Mirrors",
        category: "decor",
        brandOrFinish: "Touch Defogger with 3000K Warm Ambient Glow",
        material: "5mm Copper-Free Silver Float Glass with IP44 Rating",
        dimensions: "32\" Diameter each",
        description: "Integrated heating defogger elements preventing mirror condensation after hot steam showers.",
      },
      {
        id: "bth-4",
        name: "Wall-Hung Rimless Commode with Concealed Geberit Cistern",
        category: "fixtures",
        brandOrFinish: "Grohe Rimless WC with Dual-Flush Actuator Plate",
        material: "High-Gloss Glazed Vitreous China",
        dimensions: "21\" Projection × 15\" W",
        description: "Hygienic rimless bowl with soft-close seat damper and water-saving 3L/6L pneumatic flush plate.",
      },
      {
        id: "bth-5",
        name: "Bookmatched Statuario Marble Porcelain Wall Tiles",
        category: "decor",
        brandOrFinish: "Polished Italian Statuario Slabs",
        material: "Vitrified Porcelain 4' × 2' Wall Cladding with Matte Floor Tiles",
        dimensions: "Floor to Ceiling",
        description: "Seamless bookmatched marble pattern tiles with anti-skid R10 textured dark grey floor tiles.",
      },
    ],
    hotspots: [
      {
        id: "bth-hs-1",
        type: "furniture",
        x: 26,
        y: 45,
        label: "Frameless Glass Rain Shower",
        details: "Kohler 10\" Ceiling Rainfall Head with 10mm Safety Glass & Recessed Toiletries Niche",
      },
      {
        id: "bth-hs-2",
        type: "furniture",
        x: 78,
        y: 72,
        label: "Floating Double Quartz Vanity",
        details: "72\" Calacatta Quartz Counter with Double Undermount Basins & Soft-Close Storage",
      },
      {
        id: "bth-hs-3",
        type: "furniture",
        x: 82,
        y: 32,
        label: "Dual Backlit Anti-Fog Mirrors",
        details: "Round 32\" Touch Heated Defogger Mirrors with Warm Ambient 3000K Halo Lighting",
      },
      {
        id: "bth-hs-4",
        type: "furniture",
        x: 60,
        y: 68,
        label: "Wall-Hung Rimless Toilet",
        details: "Grohe Dual-Flush Water-Efficient Commode with Concealed Geberit Cistern",
      },
      {
        id: "bth-hs-portal-balc",
        type: "doorway",
        x: 90,
        y: 50,
        label: "Step onto Balcony →",
        targetRoomId: "balcony",
      },
      {
        id: "bth-hs-portal-mbr",
        type: "doorway",
        x: 10,
        y: 50,
        label: "← Master Bedroom",
        targetRoomId: "master-bedroom",
      },
    ],
    nextRoomId: "balcony",
    prevRoomId: "second-bedroom",
  };

  // 8. BALCONY
  const balconyRoom: FurnishedRoom = {
    id: "balcony",
    roomOrder: 8,
    name: "Balcony",
    shortName: "Balcony",
    subtitle: "Open-air sit-out deck with woven rattan armchairs, wood decking & panoramic skyline view",
    category: "balcony",
    dimensions: "12'0\" × 5'0\"",
    carpetAreaSqft: 60,
    primaryImageUrl: "/assets/rooms/balcony.jpg",
    fallbackImageUrl: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1920&auto=format&fit=crop&q=85",
    panoramaImageUrl: "/assets/rooms/balcony.jpg",
    thumbnailUrl: "/assets/rooms/balcony_thumb.jpg",
    isVerifiedActualPhoto: false,
    furnitureList: [
      {
        id: "balc-1",
        name: "All-Weather Woven Rattan Lounge Armchairs",
        category: "seating",
        brandOrFinish: "UV-Resistant Synthetic Rattan in Natural Honey Tone",
        material: "Rust-Proof Powder-Coated Aluminum & Sunbrella Weatherproof Cushions",
        dimensions: "28\" W × 30\" D × 32\" H each",
        description: "Heavy-duty outdoor lounge chairs with quick-drying foam cushions that withstand direct sun and rain.",
      },
      {
        id: "balc-2",
        name: "Round Teak & Metal Bistro Coffee Table",
        category: "decor",
        brandOrFinish: "Solid Weatherproof Teak Top",
        material: "FSC Certified Teak Wood with Matte Black Steel Legs",
        dimensions: "24\" Dia × 18\" H",
        description: "Wind-stable outdoor tea table designed for morning coffee and sunset dining.",
      },
      {
        id: "balc-3",
        name: "Frameless Laminated Glass Safety Railing",
        category: "fixtures",
        brandOrFinish: "12mm Toughened Laminated Structural Glass",
        material: "Safety Glass with Marine 316 Stainless Steel Top Spigots",
        dimensions: "12' Length × 42\" Code-Compliant Height",
        description: "Unobstructed crystal-clear view of the panoramic skyline and lush green treetops.",
      },
      {
        id: "balc-4",
        name: "Weatherproof Composite Wood Decking (WPC)",
        category: "decor",
        brandOrFinish: "Slip-Resistant Natural Wood Grain Planks",
        material: "Recycled Wood Polymer Composite",
        dimensions: "Full Deck Floor Area",
        description: "Splinter-free, water-draining outdoor floor planks with barefoot warmth and natural wood texture.",
      },
      {
        id: "balc-5",
        name: "Potted Fiddle Leaf & Monsteras Foliage",
        category: "decor",
        brandOrFinish: "Ceramic & Terracotta Planters",
        material: "Air-Purifying Tropical Greenery",
        dimensions: "Various Heights (24\" to 48\")",
        description: "Vibrant living plants framing the balcony sit-out with lush natural vitality.",
      },
    ],
    hotspots: [
      {
        id: "balc-hs-1",
        type: "furniture",
        x: 37,
        y: 66,
        label: "Woven Rattan Lounge Armchairs",
        details: "UV-Protected Synthetic Rattan with Sunbrella All-Weather Cushions",
      },
      {
        id: "balc-hs-2",
        type: "furniture",
        x: 52,
        y: 74,
        label: "Teak Bistro Coffee Table",
        details: "24\" Weatherproof Solid Teak Outdoor Tea Table with Black Metal Base",
      },
      {
        id: "balc-hs-3",
        type: "furniture",
        x: 65,
        y: 52,
        label: "Frameless Glass Safety Railing",
        details: "12mm Toughened Glass with 42\" Height & Unobstructed Skyline View",
      },
      {
        id: "balc-hs-4",
        type: "furniture",
        x: 61,
        y: 62,
        label: "Potted Tropical Greenery & Decking",
        details: "Natural Wood-Plastic Composite Decking with Potted Fiddle Leaf & Monsteras",
      },
      {
        id: "balc-hs-portal-liv",
        type: "doorway",
        x: 10,
        y: 50,
        label: "Return to Living Room 🏠",
        targetRoomId: "living-room",
      },
    ],
    nextRoomId: "entrance",
    prevRoomId: "bathroom",
  };

  const rooms: FurnishedRoom[] = [
    entranceRoom,
    livingRoom,
    diningRoom,
    kitchenRoom,
    masterBedroom,
    bedroom2,
    bathroomRoom,
    balconyRoom,
  ];

  return {
    propertyId,
    propertyTitle: title,
    location,
    city,
    bhk,
    bhkDisplay,
    areaSqft,
    areaDisplay,
    priceDisplay,
    isVerified,
    isRera,
    isWalkthroughAvailable: true,
    rooms,
  };
}

export default buildFurnishedFlatTour;
