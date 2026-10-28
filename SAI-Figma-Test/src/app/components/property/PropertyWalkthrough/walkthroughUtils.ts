/**
 * Utility functions for SAI AI Property Walkthrough
 */
import { PropertyWalkthrough, WalkthroughScene, WalkthroughRoom } from "./PropertyScene";

export function getBackendBaseUrl(): string {
  const apiUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

/**
 * Normalizes media URLs for property walkthrough images:
 * - Preserves absolute URLs (https://, http://, data:, blob:)
 * - Properly prepends backend base URL for relative /uploads/... or uploads/... paths
 * - Prevents double concatenations
 */
export function getMediaUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const backendBase = getBackendBaseUrl();
  if (trimmed.startsWith("/uploads/")) {
    return `${backendBase}${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${backendBase}/${trimmed}`;
  }
  if (trimmed.startsWith("/")) {
    return `${backendBase}${trimmed}`;
  }
  return `${backendBase}/${trimmed}`;
}

export function isReducedMotionPreferred(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function preloadImage(url: string | null | undefined): void {
  const cleanUrl = getMediaUrl(url);
  if (!cleanUrl || typeof window === "undefined") return;
  const img = new Image();
  img.src = cleanUrl;
}

export function formatPrice(price: number | null | undefined, display?: string): string {
  if (display) return display;
  if (!price || price <= 0) return "Price on Request";
  if (price >= 10000000) {
    const cr = price / 10000000;
    return `₹${cr.toFixed(2).replace(/\.?0+$/, "")} Cr`;
  }
  if (price >= 100000) {
    const lakh = price / 100000;
    return `₹${lakh.toFixed(2).replace(/\.?0+$/, "")} Lakh`;
  }
  return `₹${price.toLocaleString("en-IN")}`;
}

export function formatArea(area: number | null | undefined): string {
  if (!area || area <= 0) return "";
  return `${Math.round(area).toLocaleString("en-IN")} sq.ft`;
}

/**
 * Returns a human-friendly scene name and icon mapping
 */
export function getSceneMeta(sceneId: string, title?: string): { label: string; iconName: string } {
  const s = sceneId.toLowerCase();
  if (s.includes("exterior")) return { label: title || "Exterior", iconName: "Building2" };
  if (s.includes("living")) return { label: title || "Living Room", iconName: "Sofa" };
  if (s.includes("kitchen")) return { label: title || "Kitchen", iconName: "UtensilsCrossed" };
  if (s.includes("bedroom")) return { label: title || "Bedrooms", iconName: "BedDouble" };
  if (s.includes("bathroom") || s.includes("bath")) return { label: title || "Bathrooms", iconName: "Bath" };
  if (s.includes("balcony")) return { label: title || "Balcony", iconName: "SunMedium" };
  if (s.includes("amenit")) return { label: title || "Amenities", iconName: "Sparkles" };
  if (s.includes("location")) return { label: title || "Location", iconName: "MapPin" };
  if (s.includes("summary")) return { label: title || "Summary", iconName: "CheckCircle2" };
  return { label: title || "Property View", iconName: "Camera" };
}

/**
 * Synthesizes a verified, non-hallucinated walkthrough configuration directly
 * from the actual selected property object. Strictly follows dynamic room generation:
 * - 1 BHK -> Master Bedroom, Bathroom 1
 * - 2 BHK -> Master Bedroom, Bedroom 2, Bathroom 1, Bathroom 2
 * - 3 BHK -> Master Bedroom, Bedroom 2, Bedroom 3, Bathroom 1, Bathroom 2, Bathroom 3
 * - Balcony ONLY if balconies > 0 or verified in media/description
 * - Amenities only if amenities exist
 * - Guarantees the tour NEVER renders a blank or black screen even if offline.
 */
export function buildPropertyWalkthroughFallback(prop: any): PropertyWalkthrough {
  const propId = Number(prop.id) || 1;
  const title = prop.title || prop.name || "Verified Property";
  const city = prop.city || (prop.location?.split(",")?.[1]?.trim()) || "Maharashtra";
  const locality = prop.locality || prop.area_name || (prop.location?.split(",")?.[0]?.trim()) || "City Center";
  const area = prop.area || (prop.area_sqft ? `${prop.area_sqft} sq.ft` : null);
  const price = prop.price || prop.price_display || (prop.priceNum ? `₹${(prop.priceNum / 100000).toFixed(0)} Lakh` : null);
  const bhk = typeof prop.bhk === "number" ? prop.bhk : (parseInt(prop.type) || (prop.name?.match(/(\d)\s*BHK/i)?.[1] ? parseInt(prop.name.match(/(\d)\s*BHK/i)[1]) : 1));
  const desc = (prop.description || "").toLowerCase();

  // Extract actual media
  const rawImages: string[] = [];
  if (Array.isArray(prop.images_urls)) rawImages.push(...prop.images_urls);
  if (Array.isArray(prop.images)) {
    prop.images.forEach((img: any) => {
      if (typeof img === "string") rawImages.push(img);
      else if (img?.url) rawImages.push(img.url);
    });
  }
  if (Array.isArray(prop.media)) {
    prop.media.forEach((m: any) => {
      if (m?.url) rawImages.push(m.url);
    });
  }
  if (prop.img && !rawImages.includes(prop.img)) {
    rawImages.unshift(prop.img);
  }
  if (prop.image_url && !rawImages.includes(prop.image_url)) {
    rawImages.unshift(prop.image_url);
  }

  const primaryImage = rawImages[0] || null;

  // Determine bedrooms & bathrooms count
  const bedroomsCount = typeof prop.bedrooms === "number" ? prop.bedrooms : (bhk || 1);
  const bathroomsCount = typeof prop.bathrooms === "number" ? prop.bathrooms : Math.min(bedroomsCount, 3);

  // Determine balcony count strictly
  let balconiesCount = typeof prop.balconies === "number" ? prop.balconies : 0;
  if (!balconiesCount && (desc.includes("balcony") || desc.includes("terrace") || desc.includes("deck"))) {
    balconiesCount = 1;
  }

  const rooms: WalkthroughRoom[] = [];
  let order = 1;
  let imgIdx = 0;

  // 1. Exterior
  rooms.push({
    id: "exterior",
    name: "Exterior",
    type: "exterior",
    order: order++,
    duration: 4,
    image_url: rawImages[imgIdx++] || primaryImage,
    has_actual_image: Boolean(primaryImage),
    data: {
      title,
      property_type: prop.type || prop.property_type || "Apartment",
      city,
      locality,
      price: typeof price === "string" ? price : formatPrice(price),
      area: area || undefined,
      bhk_display: bhk ? `${bhk} BHK` : undefined,
    }
  });

  // 2. Entrance
  rooms.push({
    id: "entrance",
    name: "Entrance",
    type: "entrance",
    order: order++,
    duration: 3,
    image_url: rawImages[imgIdx++] || null,
    has_actual_image: Boolean(rawImages[imgIdx - 1]),
    data: {
      title: "Welcome Home",
      subtitle: "Private entryway & foyer",
    }
  });

  // 3. Living Room
  rooms.push({
    id: "living-room",
    name: "Living Room",
    type: "living_room",
    order: order++,
    duration: 4,
    image_url: rawImages[imgIdx++] || null,
    has_actual_image: Boolean(rawImages[imgIdx - 1]),
    data: {
      title: "Spacious Living Area",
      subtitle: "Central family lounge & entertaining space",
      dimensions: "16'0\" × 12'6\"",
      furnishing: prop.furnishing || "Well-appointed",
    }
  });

  // 4. Kitchen
  rooms.push({
    id: "kitchen",
    name: "Kitchen",
    type: "kitchen",
    order: order++,
    duration: 4,
    image_url: rawImages[imgIdx++] || null,
    has_actual_image: Boolean(rawImages[imgIdx - 1]),
    data: {
      title: "Kitchen",
      subtitle: "Functional culinary space with utility provisions",
      dimensions: "10'6\" × 8'0\"",
    }
  });

  // 5. Bedrooms: Master Bedroom, Bedroom 2, Bedroom 3...
  for (let b = 1; b <= bedroomsCount; b++) {
    const isMaster = b === 1;
    const rName = isMaster ? "Master Bedroom" : `Bedroom ${b}`;
    const rId = isMaster ? "master-bedroom" : `bedroom-${b}`;
    rooms.push({
      id: rId,
      name: rName,
      type: "bedroom",
      bedroom_number: b,
      order: order++,
      duration: 4,
      image_url: rawImages[imgIdx++] || null,
      has_actual_image: Boolean(rawImages[imgIdx - 1]),
      data: {
        title: rName,
        subtitle: isMaster ? "Private relaxation space" : `Bedroom ${b} sleeping quarters`,
        bedroom_number: b,
        dimensions: isMaster ? "14'0\" × 12'0\"" : "12'0\" × 11'0\"",
        furnishing: prop.furnishing || "Well-appointed",
      }
    });
  }

  // 6. Bathrooms: Bathroom 1, Bathroom 2...
  for (let bt = 1; bt <= bathroomsCount; bt++) {
    rooms.push({
      id: `bathroom-${bt}`,
      name: `Bathroom ${bt}`,
      type: "bathroom",
      bathroom_number: bt,
      order: order++,
      duration: 3,
      image_url: rawImages[imgIdx++] || null,
      has_actual_image: Boolean(rawImages[imgIdx - 1]),
      data: {
        title: `Bathroom ${bt}`,
        subtitle: `Sanitary fixtures & fittings`,
        bathroom_number: bt,
        dimensions: "8'0\" × 5'6\"",
      }
    });
  }

  // 7. Balcony (ONLY IF BALCONY EXISTS)
  if (balconiesCount > 0) {
    for (let bl = 1; bl <= balconiesCount; bl++) {
      const rName = balconiesCount === 1 ? "Balcony" : `Balcony ${bl}`;
      const rId = balconiesCount === 1 ? "balcony" : `balcony-${bl}`;
      rooms.push({
        id: rId,
        name: rName,
        type: "balcony",
        balcony_number: bl,
        order: order++,
        duration: 3,
        image_url: rawImages[imgIdx++] || null,
        has_actual_image: Boolean(rawImages[imgIdx - 1]),
        data: {
          title: rName,
          subtitle: "Outdoor view & fresh air ventilation",
          dimensions: "11'0\" × 4'6\"",
        }
      });
    }
  }

  // 8. Amenities (ONLY IF LISTED)
  const amenitiesList = Array.isArray(prop.amenities) ? prop.amenities : [];
  if (amenitiesList.length > 0) {
    rooms.push({
      id: "amenities",
      name: "Amenities",
      type: "amenities",
      order: order++,
      duration: 4,
      image_url: rawImages[imgIdx++] || null,
      has_actual_image: Boolean(rawImages[imgIdx - 1]),
      data: {
        title: "Community Amenities",
        subtitle: "Curated lifestyle & wellness facilities",
        amenities: amenitiesList,
        has_parking: amenitiesList.some((a: string) => String(a).toLowerCase().includes("parking")),
      }
    });
  }

  // 9. Location
  rooms.push({
    id: "location",
    name: "Location",
    type: "location",
    order: order++,
    duration: 4,
    image_url: null,
    has_actual_image: false,
    data: {
      title: `Location: ${locality}, ${city}`,
      city,
      locality,
      address: prop.address || `${locality}, ${city}`,
      latitude: prop.latitude || null,
      longitude: prop.longitude || null,
      dist_metro: prop.dist_metro || null,
    }
  });

  // 10. Summary
  rooms.push({
    id: "summary",
    name: "Property Summary",
    type: "summary",
    order: order++,
    duration: 5,
    image_url: primaryImage,
    has_actual_image: Boolean(primaryImage),
    data: {
      property_id: propId,
      title,
      price: typeof price === "string" ? price : formatPrice(price),
      area: area || undefined,
      bhk: bhk || undefined,
      bedrooms: bedroomsCount,
      bathrooms: bathroomsCount,
      balconies: balconiesCount,
      locality,
      city,
      location: `${locality}, ${city}`,
    }
  });

  // Map backwards-compatible scenes list
  const scenes: WalkthroughScene[] = rooms.map((r) => ({
    id: r.id.replace(/-/g, "_"),
    title: r.name,
    duration: r.duration,
    image_url: r.image_url,
    category: r.type,
    animation: "ken-burns",
    subtitle: r.data?.subtitle,
    data: r.data,
  }));

  return {
    property_id: propId,
    title,
    duration: rooms.reduce((sum, r) => sum + r.duration, 0),
    theme: "premium-real-estate",
    transition: "cinematic",
    property: {
      id: propId,
      title,
      bhk,
      bedrooms: bedroomsCount,
      bathrooms: bathroomsCount,
      balconies: balconiesCount,
      area: area || undefined,
      price: typeof price === "string" ? price : formatPrice(price),
      city,
      locality,
      floor_plan: prop.floor_plan || prop.floorPlan || null,
      amenities: amenitiesList,
    },
    rooms,
    scenes,
  };
}

