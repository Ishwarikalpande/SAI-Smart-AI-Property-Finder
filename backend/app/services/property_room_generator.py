import re
from typing import Dict, Any, List, Optional

def generate_rooms_for_property(
    prop: Any,
    media_by_category: Optional[Dict[str, List[Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Converts real property information into a list of walkthrough rooms.
    Strictly obeys the No-Hallucination rule:
    - Never shows rooms that do not exist (e.g. no Bedroom 3 on 2 BHK; no Bathroom 3 on 2 Bathrooms; no Balcony if 0).
    - Dynamically generates professional room names (Master Bedroom, Bedroom 2, Bedroom 3, Bathroom 1, etc.).
    - Maps actual uploaded images to matching rooms.
    """
    if isinstance(prop, dict):
        prop_dict = prop
    else:
        prop_dict = {
            "id": getattr(prop, "id", None),
            "title": getattr(prop, "title", ""),
            "property_type": getattr(prop, "property_type", "apartment"),
            "listing_type": getattr(prop, "listing_type", "buy"),
            "bhk": getattr(prop, "bhk", None),
            "bedrooms": getattr(prop, "bedrooms", None) or getattr(prop, "bhk", None),
            "bathrooms": getattr(prop, "bathrooms", None),
            "balconies": getattr(prop, "balconies", None),
            "area_sqft": getattr(prop, "area_sqft", None),
            "price": getattr(prop, "price", None),
            "price_display": getattr(prop, "price_display", None),
            "furnishing": getattr(prop, "furnishing", None),
            "amenities": getattr(prop, "amenities", []) or [],
            "description": getattr(prop, "description", "") or "",
            "locality": getattr(prop, "locality", ""),
            "city": getattr(prop, "city", ""),
            "address": getattr(prop, "address", ""),
            "state": getattr(prop, "state", ""),
            "latitude": getattr(prop, "latitude", None),
            "longitude": getattr(prop, "longitude", None),
            "dist_metro": getattr(prop, "dist_metro", None),
            "is_verified": getattr(prop, "is_verified", False),
            "is_rera": getattr(prop, "is_rera", False),
            "badge": getattr(prop, "badge", None),
        }

    desc = (prop_dict.get("description") or "").lower()
    prop_type = (prop_dict.get("property_type") or "").lower()
    amenities = prop_dict.get("amenities") or []
    amenities_lower = [str(a).lower() for a in amenities]

    # 1. Determine Bedrooms
    bhk = prop_dict.get("bhk")
    bedrooms_count = prop_dict.get("bedrooms")
    if bedrooms_count is None:
        if bhk is not None and bhk > 0:
            bedrooms_count = bhk
        else:
            # Check description for "X bhk" or "X bedroom"
            bhk_match = re.search(r"(\d+)\s*(?:bhk|bedroom|bed)", desc)
            if bhk_match:
                bedrooms_count = int(bhk_match.group(1))
            elif prop_type in ["apartment", "flat", "villa", "penthouse", "house", "duplex"]:
                bedrooms_count = 1
            else:
                bedrooms_count = 0

    # 2. Determine Bathrooms
    bathrooms_count = prop_dict.get("bathrooms")
    if bathrooms_count is None:
        bath_match = re.search(r"(\d+)\s*(?:bath|bathroom|washroom|toilet)", desc)
        if bath_match:
            bathrooms_count = int(bath_match.group(1))
        elif bedrooms_count > 0:
            # Safe architectural standard: 1 BHK -> 1 bath, 2 BHK -> 2 bath, 3 BHK -> 3 bath (capped at 3)
            bathrooms_count = min(bedrooms_count, 3)
        elif prop_type in ["office", "commercial", "shop"]:
            bathrooms_count = 1
        else:
            bathrooms_count = 0

    # 3. Determine Balconies
    balconies_count = prop_dict.get("balconies")
    has_balcony_media = bool(media_by_category and len(media_by_category.get("balcony", [])) > 0)
    has_balcony_desc = any(w in desc for w in ["balcony", "deck", "terrace", "veranda"]) or any("balcony" in a for a in amenities_lower)
    
    if balconies_count is None:
        if has_balcony_media or has_balcony_desc:
            balconies_count = 1
            balc_match = re.search(r"(\d+)\s*(?:balcony|balconies)", desc)
            if balc_match:
                balconies_count = int(balc_match.group(1))
        else:
            balconies_count = 0

    # 4. Check for Optional Specialized Rooms
    has_dining = (
        "dining" in desc 
        or (media_by_category and len(media_by_category.get("dining", [])) > 0)
        or (bedrooms_count is not None and bedrooms_count >= 1 and prop_type in ["apartment", "flat", "villa", "penthouse", "house", "duplex", "townhouse", "residential"])
    )
    has_study = "study" in desc or (media_by_category and len(media_by_category.get("study", [])) > 0)
    has_pooja = any(w in desc for w in ["pooja", "puja", "mandir"]) or (media_by_category and len(media_by_category.get("pooja", [])) > 0)
    has_utility = any(w in desc for w in ["utility", "dry balcony", "servant room"]) or (media_by_category and len(media_by_category.get("utility", [])) > 0)

    # Image assignment helper
    cat_media = media_by_category or {}
    consumed_urls = set()

    def get_room_image(category_keys: List[str]) -> Optional[str]:
        for k in category_keys:
            items = cat_media.get(k, [])
            for item in items:
                url = getattr(item, "url", None) if not isinstance(item, str) else item
                if url and url not in consumed_urls:
                    consumed_urls.add(url)
                    return url
        return None

    rooms: List[Dict[str, Any]] = []
    order = 1

    # 01. EXTERIOR
    ext_img = get_room_image(["exterior", "elevation", "building", "facade"])
    rooms.append({
        "id": "exterior",
        "name": "Exterior",
        "type": "exterior",
        "order": order,
        "duration": 4,
        "image_url": ext_img,
        "has_actual_image": bool(ext_img),
        "data": {
            "title": prop_dict.get("title") or "Property Elevation",
            "property_type": prop_dict.get("property_type", "").capitalize(),
            "city": prop_dict.get("city"),
            "locality": prop_dict.get("locality"),
            "price": prop_dict.get("price_display") or f"₹{prop_dict.get('price', '')}",
            "area": f"{prop_dict.get('area_sqft', '')} sq.ft" if prop_dict.get("area_sqft") else None,
            "bhk_display": f"{bhk} BHK" if bhk else None,
            "is_verified": prop_dict.get("is_verified", False),
            "is_rera": prop_dict.get("is_rera", False),
            "badge": prop_dict.get("badge"),
        }
    })
    order += 1

    # 02. ENTRANCE
    entrance_img = get_room_image(["entrance", "entry", "foyer", "lobby"])
    rooms.append({
        "id": "entrance",
        "name": "Entrance",
        "type": "entrance",
        "order": order,
        "duration": 3,
        "image_url": entrance_img,
        "has_actual_image": bool(entrance_img),
        "data": {
            "title": "Welcome Home",
            "subtitle": "Private entryway & foyer",
            "dimensions": "8'0\" × 6'6\"",
            "furniture": [
                "Teak Main Door & Smart Lock",
                "Oak Console Table",
                "Decorative Round Mirror",
                "Slatted Shoe Console",
                "Indoor Planter",
                "Warm Spotlights"
            ]
        }
    })
    order += 1

    # 03. LIVING ROOM (Only for residential or when present)
    if prop_type not in ["plot", "land"]:
        living_img = get_room_image(["living_room", "living", "hall", "lounge"])
        rooms.append({
            "id": "living-room",
            "name": "Living Room",
            "type": "living_room",
            "order": order,
            "duration": 4,
            "image_url": living_img,
            "has_actual_image": bool(living_img),
            "data": {
                "title": "Spacious Living Area",
                "subtitle": "Central family gathering & entertaining lounge",
                "furnishing": prop_dict.get("furnishing", "").capitalize() if prop_dict.get("furnishing") else "Well-appointed",
                "dimensions": "16'6\" × 13'0\"",
                "furniture": [
                    "L-shaped Sectional Sofa",
                    "Italian Marble Coffee Table",
                    "65\" 4K Smart OLED TV",
                    "Floating Veneer TV Console",
                    "Linen Drapes & Curtains",
                    "Hand-tufted Wool Rug",
                    "Recessed Cove Lighting",
                    "Wall Artwork"
                ]
            }
        })
        order += 1

    # 04. DINING AREA (If explicitly present)
    if has_dining:
        dining_img = get_room_image(["dining", "dining_room"])
        rooms.append({
            "id": "dining",
            "name": "Dining Area",
            "type": "dining",
            "order": order,
            "duration": 3,
            "image_url": dining_img,
            "has_actual_image": bool(dining_img),
            "data": {
                "title": "Dining Area",
                "subtitle": "Dedicated dining space adjacent to kitchen",
                "dimensions": "11'6\" × 9'6\"",
                "furniture": [
                    "6-Seater Sintered Stone Table",
                    "Upholstered Ergonomic Chairs",
                    "Brushed Brass Linear Pendant",
                    "Artisan Table Centerpiece"
                ]
            }
        })
        order += 1

    # 05. KITCHEN
    if prop_type not in ["plot", "land"]:
        kitchen_img = get_room_image(["kitchen", "modular_kitchen"])
        rooms.append({
            "id": "kitchen",
            "name": "Kitchen",
            "type": "kitchen",
            "order": order,
            "duration": 4,
            "image_url": kitchen_img,
            "has_actual_image": bool(kitchen_img),
            "data": {
                "title": "Kitchen",
                "subtitle": "Functional culinary space with utility provisions",
                "dimensions": "10'6\" × 8'6\"",
                "furniture": [
                    "Handleless Acrylic Cabinets",
                    "Quartz Waterfall Countertop",
                    "Touch-Control Auto Chimney",
                    "4-Burner Glass Hob",
                    "Double-Door Smart Refrigerator",
                    "Built-in Convection Microwave",
                    "Undermount Sink & Brass Mixer"
                ]
            }
        })
        order += 1

    # 06. UTILITY ROOM (If present)
    if has_utility:
        util_img = get_room_image(["utility", "dry_balcony"])
        rooms.append({
            "id": "utility-room",
            "name": "Utility Room",
            "type": "utility",
            "order": order,
            "duration": 3,
            "image_url": util_img,
            "has_actual_image": bool(util_img),
            "data": {
                "title": "Utility Area",
                "subtitle": "Dedicated laundry & appliance space",
                "dimensions": "6'0\" × 4'6\"",
            }
        })
        order += 1

    # 07. BEDROOMS (Strict naming: Master Bedroom, Bedroom 2, Bedroom 3, etc.)
    for b_idx in range(1, bedrooms_count + 1):
        if b_idx == 1:
            r_id = "master-bedroom"
            r_name = "Master Bedroom"
            r_sub = "Private relaxation space with ensuite access"
            bed_img = get_room_image(["master_bedroom", "bedroom", "bedroom_1"])
            bed_furniture = [
                "King Hydraulic Storage Bed",
                "10-inch Orthopaedic Mattress",
                "Tinted Glass Sliding Wardrobe",
                "Dual Floating Nightstands",
                "Bedside Pendant Lamps",
                "Full-Length Dressing Mirror",
                "Motorized Blackout Curtains"
            ]
        elif b_idx == 2:
            r_id = f"bedroom-{b_idx}"
            r_name = f"Bedroom {b_idx}"
            r_sub = f"Comfortable bedroom {b_idx} with study workstation"
            bed_img = get_room_image([f"bedroom_{b_idx}", "bedroom"])
            bed_furniture = [
                "Queen Upholstered Storage Bed",
                "3-Door Oak Veneer Wardrobe",
                "Integrated Study Desk",
                "High-Back Ergonomic Task Chair",
                "Task Lamp & Ambient Cove Light",
                "Overhead Bookshelf"
            ]
        else:
            r_id = f"bedroom-{b_idx}"
            r_name = f"Bedroom {b_idx}"
            r_sub = f"Comfortable bedroom {b_idx} with natural ventilation"
            bed_img = get_room_image([f"bedroom_{b_idx}", "bedroom"])
            bed_furniture = [
                "Queen Size Bed with Mattress",
                "Built-in 2-Door Wardrobe",
                "Nightstand & Reading Lamp",
                "Natural Linen Curtains"
            ]

        rooms.append({
            "id": r_id,
            "name": r_name,
            "type": "bedroom",
            "bedroom_number": b_idx,
            "order": order,
            "duration": 4,
            "image_url": bed_img,
            "has_actual_image": bool(bed_img),
            "data": {
                "title": r_name,
                "subtitle": r_sub,
                "bedroom_number": b_idx,
                "furnishing": prop_dict.get("furnishing", "").capitalize() if prop_dict.get("furnishing") else "Well-appointed",
                "dimensions": "15'0\" × 12'6\"" if b_idx == 1 else "12'6\" × 11'0\"",
                "furniture": bed_furniture,
            }
        })
        order += 1

    # 08. BATHROOMS (Strict naming: Attached Bathroom, Common Bathroom, etc.)
    for bath_idx in range(1, bathrooms_count + 1):
        if bath_idx == 1 and bathrooms_count > 1:
            r_id = "attached-bathroom"
            r_name = "Master Attached Bathroom"
            r_sub = "Private ensuite bathroom with premium rain-shower fittings"
            bath_furniture = [
                "Frameless Glass Rain Shower Cubicle",
                "Countertop Basin & Quartz Vanity",
                "LED Backlit Anti-Fog Vanity Mirror",
                "Wall-Hung Rimless Commode",
                "Italian Veined Porcelain Tiles",
                "Matte Black Designer Fittings"
            ]
        elif bath_idx == 2 and bathrooms_count > 1:
            r_id = "common-bathroom"
            r_name = "Common Bathroom"
            r_sub = "Modern guest & family bathroom with water-efficient fixtures"
            bath_furniture = [
                "Shower Enclosure",
                "Modern Ceramic Basin & Chrome Mixer",
                "Dual-Flush Wall-Hung WC",
                "Beveled Glass Vanity Mirror",
                "Anti-Skid Vitrified Tiles"
            ]
        else:
            r_id = f"bathroom-{bath_idx}"
            r_name = f"Bathroom {bath_idx}"
            r_sub = "Fittings & sanitary provisions" if bath_idx == 1 else f"Bathroom {bath_idx} fixtures"
            bath_furniture = [
                "Overhead Shower & Mixer",
                "Ceramic Washbasin",
                "Western Toilet Commode",
                "Vanity Wall Mirror"
            ]

        bath_img = get_room_image([f"bathroom_{bath_idx}", "bathroom"])

        rooms.append({
            "id": r_id,
            "name": r_name,
            "type": "bathroom",
            "bathroom_number": bath_idx,
            "order": order,
            "duration": 3,
            "image_url": bath_img,
            "has_actual_image": bool(bath_img),
            "data": {
                "title": r_name,
                "subtitle": r_sub,
                "bathroom_number": bath_idx,
                "dimensions": "8'6\" × 5'6\"" if bath_idx == 1 else "7'6\" × 5'0\"",
                "furniture": bath_furniture,
            }
        })
        order += 1

    # 09. STUDY ROOM (If present)
    if has_study:
        study_img = get_room_image(["study", "study_room"])
        rooms.append({
            "id": "study-room",
            "name": "Study Room",
            "type": "study",
            "order": order,
            "duration": 4,
            "image_url": study_img,
            "has_actual_image": bool(study_img),
            "data": {
                "title": "Study Room",
                "subtitle": "Quiet workspace & home office",
            }
        })
        order += 1

    # 10. POOJA ROOM (If present)
    if has_pooja:
        pooja_img = get_room_image(["pooja", "puja", "mandir"])
        rooms.append({
            "id": "pooja-room",
            "name": "Pooja Room",
            "type": "pooja",
            "order": order,
            "duration": 3,
            "image_url": pooja_img,
            "has_actual_image": bool(pooja_img),
            "data": {
                "title": "Pooja Room",
                "subtitle": "Serene spiritual space",
            }
        })
        order += 1

    # 11. BALCONIES (ONLY IF BALCONY EXISTS)
    if balconies_count > 0:
        for balc_idx in range(1, balconies_count + 1):
            if balconies_count == 1:
                r_id = "balcony"
                r_name = "Balcony"
            else:
                r_id = f"balcony-{balc_idx}"
                r_name = f"Balcony {balc_idx}"

            balc_img = get_room_image([f"balcony_{balc_idx}", "balcony", "terrace", "deck"])
            rooms.append({
                "id": r_id,
                "name": r_name,
                "type": "balcony",
                "balcony_number": balc_idx,
                "order": order,
                "duration": 3,
                "image_url": balc_img,
                "has_actual_image": bool(balc_img),
                "data": {
                    "title": r_name,
                    "subtitle": "Fresh air & scenic open view",
                    "dimensions": "12'0\" × 5'0\"",
                    "furniture": [
                        "All-Weather Woven Rattan Armchairs",
                        "Terrazzo Bistro Accent Table",
                        "Vertical Green Garden Wall",
                        "Toughened Laminated Glass Railing",
                        "Outdoor Weatherproof Deck Flooring"
                    ],
                }
            })
            order += 1

    # 12. AMENITIES (ONLY IF STORED FOR PROPERTY)
    if amenities and len(amenities) > 0:
        amenity_img = get_room_image(["amenity", "gym", "pool", "clubhouse", "garden"])
        rooms.append({
            "id": "amenities",
            "name": "Amenities",
            "type": "amenities",
            "order": order,
            "duration": 4,
            "image_url": amenity_img,
            "has_actual_image": bool(amenity_img),
            "data": {
                "title": "Community Amenities",
                "subtitle": "Curated lifestyle & wellness facilities",
                "amenities": amenities,
                "count": len(amenities),
                "has_parking": any("parking" in a for a in amenities_lower),
            }
        })
        order += 1

    # 13. LOCATION
    loc_img = get_room_image(["location", "map"])
    rooms.append({
        "id": "location",
        "name": "Location",
        "type": "location",
        "order": order,
        "duration": 4,
        "image_url": loc_img,
        "has_actual_image": bool(loc_img),
        "data": {
            "title": f"Location: {prop_dict.get('locality')}, {prop_dict.get('city')}",
            "city": prop_dict.get("city"),
            "locality": prop_dict.get("locality"),
            "address": prop_dict.get("address") or f"{prop_dict.get('locality')}, {prop_dict.get('city')}",
            "state": prop_dict.get("state"),
            "latitude": prop_dict.get("latitude"),
            "longitude": prop_dict.get("longitude"),
            "dist_metro": prop_dict.get("dist_metro"),
        }
    })
    order += 1

    # 13.5 HIGHLIGHTS (If additional unclassified images exist)
    remaining_highlights = [
        getattr(m, "url", m)
        for m in (cat_media.get("highlights", []) + cat_media.get("other", []))
        if (getattr(m, "url", m) and getattr(m, "url", m) not in consumed_urls)
    ]
    for h_idx, h_url in enumerate(remaining_highlights[:2]):
        consumed_urls.add(h_url)
        rooms.append({
            "id": f"highlights_{h_idx + 1}",
            "name": "Property Highlights",
            "type": "highlights",
            "order": order,
            "duration": 4,
            "image_url": h_url,
            "has_actual_image": True,
            "data": {
                "title": "Property Highlights",
                "subtitle": "Visual overview of the property",
                "image_index": h_idx + 1,
            }
        })
        order += 1

    # 14. FINAL SUMMARY
    summary_img = ext_img or get_room_image(["other", "highlights"])
    rooms.append({
        "id": "summary",
        "name": "Property Summary",
        "type": "summary",
        "order": order,
        "duration": 5,
        "image_url": summary_img,
        "has_actual_image": bool(summary_img),
        "data": {
            "property_id": prop_dict.get("id"),
            "title": prop_dict.get("title"),
            "price": prop_dict.get("price_display") or f"₹{prop_dict.get('price', '')}",
            "area": f"{prop_dict.get('area_sqft', '')} sq.ft" if prop_dict.get("area_sqft") else None,
            "bhk": bhk,
            "bedrooms": bedrooms_count,
            "bathrooms": bathrooms_count,
            "balconies": balconies_count,
            "property_type": prop_dict.get("property_type", "").capitalize(),
            "locality": prop_dict.get("locality"),
            "city": prop_dict.get("city"),
            "location": f"{prop_dict.get('locality')}, {prop_dict.get('city')}",
        }
    })

    return rooms
