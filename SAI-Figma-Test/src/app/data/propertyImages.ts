export interface PropertyPhoto {
  url: string;
  label: string;
  category: "exterior" | "living" | "bedroom" | "kitchen" | "balcony" | "bathroom" | "office";
}

// Master categorized library of verified Unsplash photos
export const CURATED_PHOTOS = {
  exteriors: [
    { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&auto=format", label: "Building Facade" },
    { url: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&h=800&fit=crop&auto=format", label: "Skyline & Tower View" },
    { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop&auto=format", label: "Private Villa Front" },
    { url: "https://images.unsplash.com/photo-1779976955613-b74623824d1c?w=1200&h=800&fit=crop&auto=format", label: "Residential Complex" },
    { url: "https://images.unsplash.com/photo-1764996915324-91919cee14d3?w=1200&h=800&fit=crop&auto=format", label: "Modern Architecture" },
  ],
  livingRooms: [
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&auto=format", label: "Spacious Living Room" },
    { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop&auto=format", label: "Open Plan Hall & Dining" },
    { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=800&fit=crop&auto=format", label: "Modern Designer Lounge" },
    { url: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1200&h=800&fit=crop&auto=format", label: "Sunlit Drawing Room" },
    { url: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=1200&h=800&fit=crop&auto=format", label: "Luxury Living Suite" },
    { url: "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=1200&h=800&fit=crop&auto=format", label: "Contemporary Living Area" },
  ],
  bedrooms: [
    { url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop&auto=format", label: "Master Bedroom Suite" },
    { url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&h=800&fit=crop&auto=format", label: "Guest Bedroom" },
    { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&auto=format", label: "Kids / Secondary Bedroom" },
    { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=800&fit=crop&auto=format", label: "Deluxe King Bedroom" },
  ],
  kitchens: [
    { url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&h=800&fit=crop&auto=format", label: "Modular Italian Kitchen" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop&auto=format", label: "Gourmet Kitchen Island" },
    { url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&h=800&fit=crop&auto=format", label: "Equipped Kitchenette" },
    { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=800&fit=crop&auto=format", label: "Breakfast Counter & Pantry" },
  ],
  balconies: [
    { url: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&h=800&fit=crop&auto=format", label: "Panoramic Deck Balcony" },
    { url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&h=800&fit=crop&auto=format", label: "Clubhouse & Swimming Pool" },
    { url: "https://images.unsplash.com/photo-1700219447843-d9fafce8143f?w=1200&h=800&fit=crop&auto=format", label: "Sunset Deck / Terrace" },
    { url: "https://images.unsplash.com/photo-1711114377419-09b0cd2d786b?w=1200&h=800&fit=crop&auto=format", label: "Private Garden & Patio" },
  ],
  bathrooms: [
    { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop&auto=format", label: "Designer Master Bathroom" },
    { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&h=800&fit=crop&auto=format", label: "Modern Glass Shower Suite" },
  ],
  offices: [
    { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format", label: "Executive Workspace" },
    { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop&auto=format", label: "Conference & Boardroom" },
    { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop&auto=format", label: "Reception & Lounge" },
    { url: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=1200&h=800&fit=crop&auto=format", label: "Open Workstation Floor" },
    { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop&auto=format", label: "Commercial Glass Tower" },
  ]
};

// Handcrafted distinct image sequences for key listings
export const DEDICATED_PROPERTY_GALLERIES: Record<number, { url: string; label: string }[]> = {
  1: [ // Prestige Heights
    { url: "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=1200&h=800&fit=crop&auto=format", label: "Living Room & Balcony" },
    { url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop&auto=format", label: "Master Bedroom" },
    { url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&h=800&fit=crop&auto=format", label: "Modular Italian Kitchen" },
    { url: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&h=800&fit=crop&auto=format", label: "Balcony Deck & View" },
    { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&h=800&fit=crop&auto=format", label: "Ensuite Bathroom" },
    { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&auto=format", label: "Prestige Tower Exterior" },
  ],
  2: [ // Godrej Woodsville
    { url: "https://images.unsplash.com/photo-1779976955613-b74623824d1c?w=1200&h=800&fit=crop&auto=format", label: "Tower & Landscape" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&auto=format", label: "Designer Living Area" },
    { url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&h=800&fit=crop&auto=format", label: "Warm Wood Bedroom" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop&auto=format", label: "Parallel Kitchen Layout" },
    { url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&h=800&fit=crop&auto=format", label: "Infinity Pool & Gardens" },
  ],
  3: [ // Lodha Palacia
    { url: "https://images.unsplash.com/photo-1711114377419-09b0cd2d786b?w=1200&h=800&fit=crop&auto=format", label: "Private Villa Pool & Lawn" },
    { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop&auto=format", label: "Grand Villa Architecture" },
    { url: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=1200&h=800&fit=crop&auto=format", label: "Double-Height Living Salon" },
    { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=800&fit=crop&auto=format", label: "Presidential Master Suite" },
    { url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&h=800&fit=crop&auto=format", label: "Marble Island Kitchen" },
    { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&h=800&fit=crop&auto=format", label: "Spa Bath & Jacuzzi" },
  ],
  4: [ // Piramal Mahalaxmi
    { url: "https://images.unsplash.com/photo-1680416124510-5eae1beca412?w=1200&h=800&fit=crop&auto=format", label: "Open Plan Living Room" },
    { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&auto=format", label: "Airy Master Bedroom" },
    { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=800&fit=crop&auto=format", label: "Sleek Kitchen & Dining" },
    { url: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&h=800&fit=crop&auto=format", label: "Skyline View" },
  ],
  5: [ // Mahindra Windchimes
    { url: "https://images.unsplash.com/photo-1700219447843-d9fafce8143f?w=1200&h=800&fit=crop&auto=format", label: "Evening Pool & Deck" },
    { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop&auto=format", label: "Vibrant Living Hall" },
    { url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&h=800&fit=crop&auto=format", label: "Master Bedroom with Balcony" },
    { url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&h=800&fit=crop&auto=format", label: "Modern Kitchen" },
  ],
  6: [ // Kolte Patil Life
    { url: "https://images.unsplash.com/photo-1764996915324-91919cee14d3?w=1200&h=800&fit=crop&auto=format", label: "Modern Apartment Facade" },
    { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=800&fit=crop&auto=format", label: "Cozy Hall & TV Unit" },
    { url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&h=800&fit=crop&auto=format", label: "Comfortable Bedroom" },
    { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop&auto=format", label: "Compact Modular Kitchen" },
  ],
  7: [ // Sobha Dream Acres
    { url: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=1200&h=800&fit=crop&auto=format", label: "Luxury Living Lounge" },
    { url: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1200&h=800&fit=crop&auto=format", label: "Dining & Sitting Area" },
    { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=800&fit=crop&auto=format", label: "Master Suite" },
    { url: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&h=800&fit=crop&auto=format", label: "Clubhouse View" },
  ],
  8: [ // Shapoorji Pallonji Commercial
    { url: "https://images.unsplash.com/photo-1758431145201-2846e60054b0?w=1200&h=800&fit=crop&auto=format", label: "Commercial Tower at Dusk" },
    { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format", label: "Executive Workspaces" },
    { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop&auto=format", label: "Boardroom & Video Conf" },
    { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop&auto=format", label: "Grand Reception" },
  ]
};

/**
 * Checks whether an image URL is a real, reliable URL and not a dummy/broken link.
 */
export function isReliableImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) return false;
  if (trimmed.includes("example.com") || trimmed.includes("dummy") || trimmed.endsWith("undefined")) return false;
  return true;
}

/**
 * Returns a guaranteed valid fallback image URL based on property ID and type.
 */
export function getFallbackPropertyImage(propertyId: number = 1, propertyType?: string): string {
  const pType = (propertyType || "").toLowerCase();
  if (pType.includes("office") || pType.includes("commercial") || pType.includes("retail")) {
    const list = CURATED_PHOTOS.offices;
    return list[Math.abs(propertyId) % list.length].url;
  }
  if (pType.includes("villa") || pType.includes("house")) {
    return CURATED_PHOTOS.exteriors[2].url;
  }
  return CURATED_PHOTOS.exteriors[Math.abs(propertyId) % CURATED_PHOTOS.exteriors.length].url;
}

/**
 * Returns a robust array of 4-6 distinct, relevant photos for any property ID or type.
 */
export function getPropertyImages(
  propertyId: number,
  fallbackSingle?: string,
  propertyType?: string,
  existingImages?: string[]
): { url: string; label: string }[] {
  // If dedicated gallery exists, return it
  if (DEDICATED_PROPERTY_GALLERIES[propertyId]) {
    return DEDICATED_PROPERTY_GALLERIES[propertyId];
  }

  // Filter existing images from DB to retain only valid URLs
  const validExisting = (existingImages || []).filter(isReliableImageUrl);

  // If valid multiple images are passed from DB, format them
  if (validExisting.length > 1) {
    const labels = ["Main View", "Living Area", "Master Bedroom", "Kitchen", "Balcony View", "Bathroom"];
    return validExisting.map((u, i) => ({
      url: u,
      label: labels[i % labels.length] || `Photo ${i + 1}`
    }));
  }

  const pType = (propertyType || "").toLowerCase();
  const isComm = pType.includes("office") || pType.includes("commercial") || pType.includes("retail");
  const isVilla = pType.includes("villa") || pType.includes("house");

  const rawPrimary = validExisting[0] || (isReliableImageUrl(fallbackSingle) ? fallbackSingle : undefined);
  const primary = rawPrimary || getFallbackPropertyImage(propertyId, propertyType);

  if (isComm) {
    return [
      { url: primary || CURATED_PHOTOS.offices[0].url, label: "Main Office View" },
      { url: CURATED_PHOTOS.offices[1].url, label: "Conference Room" },
      { url: CURATED_PHOTOS.offices[2].url, label: "Reception & Lounge" },
      { url: CURATED_PHOTOS.offices[3].url, label: "Open Workstation Floor" },
      { url: CURATED_PHOTOS.offices[4].url, label: "Building Exterior" },
    ];
  }

  const offset = Math.abs(propertyId) % 4;

  const living = CURATED_PHOTOS.livingRooms[(offset) % CURATED_PHOTOS.livingRooms.length];
  const bed = CURATED_PHOTOS.bedrooms[(offset) % CURATED_PHOTOS.bedrooms.length];
  const kitchen = CURATED_PHOTOS.kitchens[(offset) % CURATED_PHOTOS.kitchens.length];
  const balcony = CURATED_PHOTOS.balconies[(offset) % CURATED_PHOTOS.balconies.length];
  const exterior = isVilla 
    ? CURATED_PHOTOS.exteriors[2] 
    : CURATED_PHOTOS.exteriors[(offset) % CURATED_PHOTOS.exteriors.length];
  const bath = CURATED_PHOTOS.bathrooms[(offset) % CURATED_PHOTOS.bathrooms.length];

  const list: { url: string; label: string }[] = [];
  list.push({ url: primary, label: "Main View" });
  list.push(living);
  list.push(bed);
  list.push(kitchen);
  list.push(balcony);
  list.push(bath);
  list.push(exterior);

  // Return unique URLs
  const seen = new Set<string>();
  return list.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

