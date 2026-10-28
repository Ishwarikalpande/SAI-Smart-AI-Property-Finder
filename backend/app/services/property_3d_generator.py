import re
import math
from typing import Dict, Any, List, Optional
from app.models.property import Property
from app.models.property_media import PropertyMedia

def classify_property_media(media_list: List[Any]) -> Dict[str, List[str]]:
    categorized: Dict[str, List[str]] = {
        "exterior": [],
        "living_room": [],
        "kitchen": [],
        "dining": [],
        "bedroom": [],
        "master_bedroom": [],
        "bedroom_2": [],
        "bedroom_3": [],
        "bathroom": [],
        "balcony": [],
        "floor_plan": [],
        "other": []
    }

    for item in media_list:
        url = getattr(item, "url", None) if not isinstance(item, str) else item
        if not url:
            continue
        cat = (getattr(item, "media_category", "") or "").lower().strip()
        url_lower = url.lower()

        if "floor" in cat or "plan" in cat or "floorplan" in url_lower or "floor-plan" in url_lower:
            categorized["floor_plan"].append(url)
        elif cat == "exterior" or any(w in url_lower for w in ["exterior", "facade", "building", "elevation"]):
            categorized["exterior"].append(url)
        elif cat == "living_room" or any(w in url_lower for w in ["living", "hall", "lounge"]):
            categorized["living_room"].append(url)
        elif cat == "kitchen" or any(w in url_lower for w in ["kitchen", "cook"]):
            categorized["kitchen"].append(url)
        elif cat == "dining" or "dining" in url_lower:
            categorized["dining"].append(url)
        elif cat == "master_bedroom" or "master" in url_lower:
            categorized["master_bedroom"].append(url)
        elif cat == "bedroom" or any(w in url_lower for w in ["bedroom", "bed-room"]):
            categorized["bedroom"].append(url)
        elif cat == "bathroom" or any(w in url_lower for w in ["bath", "washroom", "toilet"]):
            categorized["bathroom"].append(url)
        elif cat == "balcony" or any(w in url_lower for w in ["balcony", "deck", "terrace", "veranda"]):
            categorized["balcony"].append(url)
        else:
            categorized["other"].append(url)

    return categorized


def generate_3d_tour_for_property(
    prop: Any,
    custom_rooms: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Constructs a complete, normalized 3D architectural property walkthrough scene.
    Strictly follows structural rules according to property.bhk (1, 2, 3, 4 BHK),
    property.property_type (apartment vs villa/house), real dimensions, and verified media.
    """
    # Extract property attributes safely
    prop_id = getattr(prop, "id", None) if not isinstance(prop, dict) else prop.get("id")
    title = (getattr(prop, "title", None) or getattr(prop, "name", "Property Listing")) if not isinstance(prop, dict) else (prop.get("title") or prop.get("name", "Property Listing"))
    prop_type = (getattr(prop, "property_type", "apartment") or "apartment").lower() if not isinstance(prop, dict) else (prop.get("property_type") or "apartment").lower()
    bhk = getattr(prop, "bhk", None) if not isinstance(prop, dict) else prop.get("bhk")
    city = getattr(prop, "city", "Pune") if not isinstance(prop, dict) else (prop.get("city") or "Pune")
    locality = getattr(prop, "locality", "") if not isinstance(prop, dict) else (prop.get("locality") or "")
    address = getattr(prop, "address", "") if not isinstance(prop, dict) else (prop.get("address") or "")
    area_sqft = getattr(prop, "area_sqft", 1200) if not isinstance(prop, dict) else (prop.get("area_sqft") or 1200)
    price = getattr(prop, "price", 0) if not isinstance(prop, dict) else (prop.get("price") or 0)
    price_display = getattr(prop, "price_display", None) if not isinstance(prop, dict) else prop.get("price_display")
    description = (getattr(prop, "description", "") or "").lower() if not isinstance(prop, dict) else (prop.get("description") or "").lower()
    media_list = getattr(prop, "media", []) or [] if not isinstance(prop, dict) else (prop.get("media") or [])

    # Classify images
    classified_media = classify_property_media(media_list)

    # Determine BHK
    if not bhk or bhk <= 0:
        bhk_match = re.search(r"(\d+)\s*(?:bhk|bedroom|bed)", description)
        if bhk_match:
            bhk = int(bhk_match.group(1))
        elif prop_type in ["villa", "house", "bungalow"]:
            bhk = 3
        else:
            bhk = 2
    bhk = max(1, min(bhk, 4)) # Normalize between 1 and 4

    # Determine Bathrooms
    bathrooms_count = getattr(prop, "bathrooms", None) if not isinstance(prop, dict) else prop.get("bathrooms")
    if not bathrooms_count:
        if bhk == 1:
            bathrooms_count = 1
        elif bhk == 2:
            bathrooms_count = 2
        elif bhk == 3:
            bathrooms_count = 2
        else:
            bathrooms_count = 3

    # Check Balconies
    balconies_count = getattr(prop, "balconies", None) if not isinstance(prop, dict) else prop.get("balconies")
    if balconies_count is None:
        balconies_count = 1 if bhk >= 1 else 0

    # Determine building type
    is_standalone_villa = prop_type in ["villa", "house", "bungalow", "row house", "independent house"]
    total_floors = 2 if is_standalone_villa else (14 if bhk >= 3 else 10)
    selected_floor = 1 if is_standalone_villa else (4 if bhk == 2 else (7 if bhk >= 3 else 3))

    # Media mapping helpers
    def get_first_media(keys: List[str]) -> Optional[str]:
        for k in keys:
            if classified_media.get(k) and len(classified_media[k]) > 0:
                return classified_media[k][0]
        return None

    ext_img = get_first_media(["exterior", "other"])
    living_img = get_first_media(["living_room", "other"])
    kitchen_img = get_first_media(["kitchen"])
    master_img = get_first_media(["master_bedroom", "bedroom"])
    bed2_img = get_first_media(["bedroom_2", "bedroom"])
    bed3_img = get_first_media(["bedroom_3", "bedroom"])
    bath_img = get_first_media(["bathroom"])
    balc_img = get_first_media(["balcony"])
    floor_plan_img = get_first_media(["floor_plan"])

    # Define normalized room configurations according to BHK
    ceiling_height = 2.85
    rooms_data: List[Dict[str, Any]] = []
    doors_data: List[Dict[str, Any]] = []
    camera_path: List[Dict[str, Any]] = []

    # 1 BHK LAYOUT
    if bhk == 1:
        rooms_data = [
            {
                "id": "entrance",
                "name": "Entrance & Foyer",
                "type": "entrance",
                "order": 1,
                "position": {"x": 0.0, "y": 0.0, "z": 1.5},
                "dimensions": {"width": 2.5, "length": 3.0, "height": ceiling_height},
                "floor_material": "polished_tile",
                "wall_color": "#F3EFEA",
                "camera_focus": {"position": [0.0, 1.7, 3.2], "look_at": [0.0, 1.6, -1.0]},
                "label": "ENTRANCE",
                "subtitle": "Private entryway with security door",
                "has_actual_image": bool(ext_img),
                "image_url": ext_img
            },
            {
                "id": "living_room",
                "name": "Hall / Living Room",
                "type": "living_room",
                "order": 2,
                "position": {"x": 0.0, "y": 0.0, "z": -2.5},
                "dimensions": {"width": 5.2, "length": 5.0, "height": ceiling_height},
                "floor_material": "hardwood",
                "wall_color": "#ECE9E2",
                "camera_focus": {"position": [0.0, 1.7, -0.5], "look_at": [-1.5, 1.5, -3.5]},
                "label": "LIVING ROOM",
                "subtitle": "Spacious family hall with natural ventilation",
                "has_actual_image": bool(living_img),
                "image_url": living_img,
                "furniture": [
                    {"type": "sofa_sectional", "position": [-1.6, 0.0, -3.5], "rotation_y": 0.0},
                    {"type": "coffee_table", "position": [-1.6, 0.0, -2.2], "rotation_y": 0.0},
                    {"type": "tv_wall_unit", "position": [2.3, 0.0, -2.5], "rotation_y": -1.57},
                    {"type": "area_rug", "position": [-1.6, 0.01, -2.5], "rotation_y": 0.0},
                    {"type": "ceiling_fan", "position": [0.0, 2.7, -2.5], "rotation_y": 0.0}
                ]
            },
            {
                "id": "kitchen",
                "name": "Kitchen",
                "type": "kitchen",
                "order": 3,
                "position": {"x": 4.2, "y": 0.0, "z": -2.2},
                "dimensions": {"width": 3.2, "length": 4.2, "height": ceiling_height},
                "floor_material": "granite_tile",
                "wall_color": "#FFFFFF",
                "camera_focus": {"position": [3.2, 1.7, -1.8], "look_at": [4.8, 1.4, -2.8]},
                "label": "KITCHEN",
                "subtitle": "Functional modular kitchen with utility counter",
                "has_actual_image": bool(kitchen_img),
                "image_url": kitchen_img,
                "furniture": [
                    {"type": "kitchen_counter_l", "position": [4.0, 0.0, -3.0], "rotation_y": 0.0},
                    {"type": "refrigerator", "position": [5.2, 0.0, -0.8], "rotation_y": 3.14},
                    {"type": "kitchen_sink", "position": [3.6, 0.9, -3.8], "rotation_y": 0.0}
                ]
            },
            {
                "id": "master_bedroom",
                "name": "Master Bedroom",
                "type": "bedroom",
                "order": 4,
                "position": {"x": -0.5, "y": 0.0, "z": -7.5},
                "dimensions": {"width": 4.4, "length": 4.8, "height": ceiling_height},
                "floor_material": "wood_laminate",
                "wall_color": "#E5E1D8",
                "camera_focus": {"position": [-0.5, 1.7, -5.8], "look_at": [-0.5, 1.4, -8.6]},
                "label": "MASTER BEDROOM",
                "subtitle": "Comfortable bedroom with wardrobe and attached balcony access",
                "has_actual_image": bool(master_img),
                "image_url": master_img,
                "furniture": [
                    {"type": "king_bed", "position": [-0.5, 0.0, -8.6], "rotation_y": 3.14},
                    {"type": "nightstand_left", "position": [-1.9, 0.0, -8.8], "rotation_y": 0.0},
                    {"type": "nightstand_right", "position": [0.9, 0.0, -8.8], "rotation_y": 0.0},
                    {"type": "wardrobe", "position": [1.4, 0.0, -6.5], "rotation_y": -1.57}
                ]
            },
            {
                "id": "bathroom_1",
                "name": "Bathroom",
                "type": "bathroom",
                "order": 5,
                "position": {"x": 3.4, "y": 0.0, "z": -6.5},
                "dimensions": {"width": 2.4, "length": 2.8, "height": ceiling_height},
                "floor_material": "ceramic_anti_skid",
                "wall_color": "#DCE2E6",
                "camera_focus": {"position": [2.6, 1.7, -5.6], "look_at": [3.8, 1.4, -6.8]},
                "label": "BATHROOM",
                "subtitle": "Premium sanitary fittings and shower partition",
                "has_actual_image": bool(bath_img),
                "image_url": bath_img,
                "furniture": [
                    {"type": "vanity_mirror", "position": [3.6, 0.0, -7.4], "rotation_y": 0.0},
                    {"type": "toilet_commode", "position": [2.5, 0.0, -7.2], "rotation_y": 0.0},
                    {"type": "shower_glass", "position": [4.0, 0.0, -5.8], "rotation_y": 1.57}
                ]
            },
            {
                "id": "balcony",
                "name": "Balcony",
                "type": "balcony",
                "order": 6,
                "position": {"x": -0.5, "y": 0.0, "z": -11.2},
                "dimensions": {"width": 4.2, "length": 2.2, "height": ceiling_height},
                "floor_material": "terracotta_deck",
                "wall_color": "#D4CEBA",
                "camera_focus": {"position": [-0.5, 1.7, -10.4], "look_at": [-0.5, 1.6, -16.0]},
                "label": "BALCONY VIEW",
                "subtitle": "Open airy balcony overlooking the surroundings",
                "has_actual_image": bool(balc_img),
                "image_url": balc_img,
                "furniture": [
                    {"type": "balcony_railing", "position": [-0.5, 0.0, -12.2], "rotation_y": 0.0},
                    {"type": "bistro_chair_left", "position": [-1.2, 0.0, -11.2], "rotation_y": 1.2},
                    {"type": "bistro_chair_right", "position": [0.2, 0.0, -11.2], "rotation_y": -1.2},
                    {"type": "potted_plant", "position": [1.2, 0.0, -11.8], "rotation_y": 0.0}
                ]
            }
        ]

        doors_data = [
            {"id": "main_door", "name": "Main Entrance Door", "is_main_entrance": True, "position": [0.0, 0.0, 0.0], "rotation_y": 0.0, "width": 1.1, "height": 2.2},
            {"id": "door_kitchen", "name": "Kitchen Entry", "is_main_entrance": False, "position": [2.6, 0.0, -2.5], "rotation_y": 1.57, "width": 0.9, "height": 2.1},
            {"id": "door_master", "name": "Master Bedroom Door", "is_main_entrance": False, "position": [-0.5, 0.0, -5.0], "rotation_y": 0.0, "width": 0.95, "height": 2.1},
            {"id": "door_bathroom", "name": "Bathroom Door", "is_main_entrance": False, "position": [2.2, 0.0, -6.5], "rotation_y": 1.57, "width": 0.85, "height": 2.1},
            {"id": "door_balcony", "name": "Balcony Glass Sliding Door", "is_balcony": True, "position": [-0.5, 0.0, -9.9], "rotation_y": 0.0, "width": 1.8, "height": 2.3}
        ]

        camera_path = [
            {"id": "c1", "step_name": "Property Front View", "room_id": "exterior", "position": [0.0, 6.0, 18.0], "look_at": [0.0, 3.5, 0.0], "duration": 4.0, "action": "none", "label": "PROPERTY FRONT VIEW"},
            {"id": "c2", "step_name": "Approach Entrance", "room_id": "entrance", "position": [0.0, 1.7, 4.0], "look_at": [0.0, 1.6, 0.0], "duration": 3.0, "action": "none", "label": "ENTRANCE"},
            {"id": "c3", "step_name": "Main Door Opens", "room_id": "entrance", "position": [0.0, 1.7, 1.8], "look_at": [0.0, 1.6, -1.0], "duration": 2.5, "action": "door_open", "label": "ENTRANCE"},
            {"id": "c4", "step_name": "Enter Living Room", "room_id": "living_room", "position": [0.0, 1.7, -1.2], "look_at": [-1.2, 1.5, -3.5], "duration": 3.5, "action": "none", "label": "LIVING ROOM"},
            {"id": "c5", "step_name": "Living Room Overview", "room_id": "living_room", "position": [0.5, 1.7, -3.2], "look_at": [2.0, 1.5, -2.5], "duration": 3.0, "action": "none", "label": "LIVING ROOM"},
            {"id": "c6", "step_name": "Enter Kitchen", "room_id": "kitchen", "position": [3.5, 1.7, -2.0], "look_at": [4.8, 1.4, -3.2], "duration": 3.5, "action": "none", "label": "KITCHEN"},
            {"id": "c7", "step_name": "Master Bedroom Doorway", "room_id": "master_bedroom", "position": [-0.5, 1.7, -5.2], "look_at": [-0.5, 1.5, -7.5], "duration": 2.5, "action": "none", "label": "MASTER BEDROOM"},
            {"id": "c8", "step_name": "Master Bedroom Pan", "room_id": "master_bedroom", "position": [-0.5, 1.7, -7.2], "look_at": [-0.5, 1.4, -9.0], "duration": 3.5, "action": "pan_180", "label": "MASTER BEDROOM"},
            {"id": "c9", "step_name": "Bathroom", "room_id": "bathroom_1", "position": [2.8, 1.7, -6.5], "look_at": [3.8, 1.4, -6.8], "duration": 2.5, "action": "none", "label": "BATHROOM"},
            {"id": "c10", "step_name": "Balcony Door Opens", "room_id": "balcony", "position": [-0.5, 1.7, -9.5], "look_at": [-0.5, 1.6, -13.0], "duration": 2.0, "action": "balcony_open", "label": "BALCONY VIEW"},
            {"id": "c11", "step_name": "Walk onto Balcony", "room_id": "balcony", "position": [-0.5, 1.7, -11.0], "look_at": [-0.5, 1.6, -18.0], "duration": 3.5, "action": "exterior_view", "label": "BALCONY VIEW"},
            {"id": "c12", "step_name": "Pan Outside Horizon", "room_id": "balcony", "position": [-0.5, 1.7, -11.2], "look_at": [4.0, 1.8, -18.0], "duration": 3.0, "action": "exterior_view", "label": "BALCONY OUTSIDE VIEW"},
            {"id": "c13", "step_name": "Pull Back to Front View", "room_id": "exterior", "position": [0.0, 7.5, 22.0], "look_at": [0.0, 4.0, 0.0], "duration": 4.0, "action": "none", "label": "PROPERTY FRONT VIEW"},
            {"id": "c14", "step_name": "Tour Complete", "room_id": "exterior", "position": [0.0, 7.5, 22.0], "look_at": [0.0, 4.0, 0.0], "duration": 2.0, "action": "complete", "label": "TOUR COMPLETE"}
        ]

    # 2 BHK LAYOUT
    elif bhk == 2:
        rooms_data = [
            {
                "id": "entrance",
                "name": "Entrance & Foyer",
                "type": "entrance",
                "order": 1,
                "position": {"x": 0.0, "y": 0.0, "z": 1.6},
                "dimensions": {"width": 2.8, "length": 3.2, "height": ceiling_height},
                "floor_material": "polished_marble",
                "wall_color": "#F5F2EB",
                "camera_focus": {"position": [0.0, 1.7, 3.5], "look_at": [0.0, 1.6, -1.0]},
                "label": "ENTRANCE",
                "subtitle": "Spacious entrance with decorative paneling",
                "has_actual_image": bool(ext_img),
                "image_url": ext_img
            },
            {
                "id": "living_room",
                "name": "Hall / Living Room",
                "type": "living_room",
                "order": 2,
                "position": {"x": 0.0, "y": 0.0, "z": -2.8},
                "dimensions": {"width": 5.8, "length": 5.5, "height": ceiling_height},
                "floor_material": "italian_marble",
                "wall_color": "#ECE8E0",
                "camera_focus": {"position": [0.0, 1.7, -0.8], "look_at": [-1.8, 1.5, -4.0]},
                "label": "LIVING ROOM",
                "subtitle": "Expansive modern living room with entertainment lounge",
                "has_actual_image": bool(living_img),
                "image_url": living_img,
                "furniture": [
                    {"type": "sofa_l_shape", "position": [-1.8, 0.0, -3.8], "rotation_y": 0.0},
                    {"type": "coffee_table", "position": [-1.8, 0.0, -2.4], "rotation_y": 0.0},
                    {"type": "tv_wall_unit", "position": [2.6, 0.0, -2.8], "rotation_y": -1.57},
                    {"type": "floor_lamp", "position": [-2.6, 0.0, -5.0], "rotation_y": 0.0},
                    {"type": "area_rug", "position": [-1.8, 0.01, -2.8], "rotation_y": 0.0}
                ]
            },
            {
                "id": "kitchen",
                "name": "Kitchen",
                "type": "kitchen",
                "order": 3,
                "position": {"x": 4.6, "y": 0.0, "z": -2.4},
                "dimensions": {"width": 3.6, "length": 4.6, "height": ceiling_height},
                "floor_material": "polished_granite",
                "wall_color": "#FFFFFF",
                "camera_focus": {"position": [3.4, 1.7, -2.0], "look_at": [5.2, 1.4, -3.4]},
                "label": "KITCHEN",
                "subtitle": "Contemporary modular kitchen with chimney & granite platform",
                "has_actual_image": bool(kitchen_img),
                "image_url": kitchen_img,
                "furniture": [
                    {"type": "kitchen_counter_l", "position": [4.5, 0.0, -3.4], "rotation_y": 0.0},
                    {"type": "kitchen_chimney", "position": [4.8, 1.8, -4.2], "rotation_y": 0.0},
                    {"type": "refrigerator", "position": [5.8, 0.0, -1.0], "rotation_y": 3.14}
                ]
            },
            {
                "id": "master_bedroom",
                "name": "Master Bedroom",
                "type": "bedroom",
                "order": 4,
                "position": {"x": -2.4, "y": 0.0, "z": -8.0},
                "dimensions": {"width": 4.8, "length": 5.2, "height": ceiling_height},
                "floor_material": "teak_wood",
                "wall_color": "#E6E2D8",
                "camera_focus": {"position": [-2.4, 1.7, -6.0], "look_at": [-2.4, 1.4, -9.2]},
                "label": "MASTER BEDROOM",
                "subtitle": "Master suite with king bed and ensuite washroom",
                "has_actual_image": bool(master_img),
                "image_url": master_img,
                "furniture": [
                    {"type": "king_bed", "position": [-2.4, 0.0, -9.2], "rotation_y": 3.14},
                    {"type": "nightstand_left", "position": [-4.0, 0.0, -9.4], "rotation_y": 0.0},
                    {"type": "nightstand_right", "position": [-0.8, 0.0, -9.4], "rotation_y": 0.0},
                    {"type": "wardrobe_large", "position": [-4.4, 0.0, -6.8], "rotation_y": 1.57}
                ]
            },
            {
                "id": "bedroom_2",
                "name": "Child Bedroom / Bedroom 2",
                "type": "bedroom",
                "order": 5,
                "position": {"x": 2.4, "y": 0.0, "z": -8.0},
                "dimensions": {"width": 4.4, "length": 5.0, "height": ceiling_height},
                "floor_material": "light_oak_wood",
                "wall_color": "#EAE7DF",
                "camera_focus": {"position": [2.4, 1.7, -6.0], "look_at": [2.4, 1.4, -9.2]},
                "label": "BEDROOM 2",
                "subtitle": "Second bedroom ideal for children or guests with study desk",
                "has_actual_image": bool(bed2_img),
                "image_url": bed2_img,
                "furniture": [
                    {"type": "queen_bed", "position": [2.4, 0.0, -9.2], "rotation_y": 3.14},
                    {"type": "study_desk", "position": [4.0, 0.0, -7.0], "rotation_y": -1.57},
                    {"type": "wardrobe", "position": [0.6, 0.0, -7.0], "rotation_y": 1.57}
                ]
            },
            {
                "id": "bathroom_1",
                "name": "Master Attached Bathroom",
                "type": "bathroom",
                "order": 6,
                "position": {"x": -4.6, "y": 0.0, "z": -11.4},
                "dimensions": {"width": 2.6, "length": 3.0, "height": ceiling_height},
                "floor_material": "anti_skid_tiles",
                "wall_color": "#DCE1E5",
                "camera_focus": {"position": [-3.8, 1.7, -10.4], "look_at": [-5.0, 1.4, -11.8]},
                "label": "BATHROOM 1",
                "subtitle": "Master ensuite with glass shower cubicle",
                "has_actual_image": bool(bath_img),
                "image_url": bath_img,
                "furniture": [
                    {"type": "vanity_mirror", "position": [-4.8, 0.0, -12.4], "rotation_y": 0.0},
                    {"type": "toilet_commode", "position": [-3.8, 0.0, -12.2], "rotation_y": 0.0},
                    {"type": "shower_glass", "position": [-5.4, 0.0, -10.8], "rotation_y": 1.57}
                ]
            },
            {
                "id": "bathroom_2",
                "name": "Common Bathroom",
                "type": "bathroom",
                "order": 7,
                "position": {"x": 5.0, "y": 0.0, "z": -6.6},
                "dimensions": {"width": 2.4, "length": 2.8, "height": ceiling_height},
                "floor_material": "anti_skid_tiles",
                "wall_color": "#DCE1E5",
                "camera_focus": {"position": [4.0, 1.7, -6.6], "look_at": [5.6, 1.4, -7.2]},
                "label": "BATHROOM 2",
                "subtitle": "Guest & common bathroom with premium chrome fittings",
                "has_actual_image": bool(bath_img),
                "image_url": bath_img,
                "furniture": [
                    {"type": "vanity_mirror", "position": [5.6, 0.0, -7.6], "rotation_y": 0.0},
                    {"type": "toilet_commode", "position": [4.5, 0.0, -7.4], "rotation_y": 0.0}
                ]
            },
            {
                "id": "balcony",
                "name": "Balcony",
                "type": "balcony",
                "order": 8,
                "position": {"x": 0.0, "y": 0.0, "z": -12.4},
                "dimensions": {"width": 5.2, "length": 2.6, "height": ceiling_height},
                "floor_material": "deck_wood",
                "wall_color": "#D2CCC0",
                "camera_focus": {"position": [0.0, 1.7, -11.5], "look_at": [0.0, 1.6, -17.5]},
                "label": "BALCONY VIEW",
                "subtitle": "Wide balcony providing panoramic city & open sky views",
                "has_actual_image": bool(balc_img),
                "image_url": balc_img,
                "furniture": [
                    {"type": "balcony_railing", "position": [0.0, 0.0, -13.6], "rotation_y": 0.0},
                    {"type": "coffee_table", "position": [0.0, 0.0, -12.4], "rotation_y": 0.0},
                    {"type": "bistro_chair_left", "position": [-1.2, 0.0, -12.4], "rotation_y": 1.2},
                    {"type": "bistro_chair_right", "position": [1.2, 0.0, -12.4], "rotation_y": -1.2}
                ]
            }
        ]

        doors_data = [
            {"id": "main_door", "name": "Main Entrance Door", "is_main_entrance": True, "position": [0.0, 0.0, 0.0], "rotation_y": 0.0, "width": 1.15, "height": 2.25},
            {"id": "door_kitchen", "name": "Kitchen Doorway", "is_main_entrance": False, "position": [2.8, 0.0, -2.6], "rotation_y": 1.57, "width": 1.0, "height": 2.15},
            {"id": "door_master", "name": "Master Bedroom Door", "is_main_entrance": False, "position": [-1.5, 0.0, -5.5], "rotation_y": 0.0, "width": 0.95, "height": 2.15},
            {"id": "door_bed2", "name": "Bedroom 2 Door", "is_main_entrance": False, "position": [1.5, 0.0, -5.5], "rotation_y": 0.0, "width": 0.95, "height": 2.15},
            {"id": "door_bath1", "name": "Master Bathroom Door", "is_main_entrance": False, "position": [-3.5, 0.0, -10.6], "rotation_y": 0.0, "width": 0.85, "height": 2.1},
            {"id": "door_bath2", "name": "Common Bathroom Door", "is_main_entrance": False, "position": [3.8, 0.0, -6.6], "rotation_y": 1.57, "width": 0.85, "height": 2.1},
            {"id": "door_balcony", "name": "Balcony Glass Slider", "is_balcony": True, "position": [0.0, 0.0, -10.8], "rotation_y": 0.0, "width": 2.2, "height": 2.35}
        ]

        camera_path = [
            {"id": "c1", "step_name": "Property Front View", "room_id": "exterior", "position": [0.0, 6.5, 20.0], "look_at": [0.0, 4.0, 0.0], "duration": 4.0, "action": "none", "label": "PROPERTY FRONT VIEW"},
            {"id": "c2", "step_name": "Approach Entrance", "room_id": "entrance", "position": [0.0, 1.7, 4.5], "look_at": [0.0, 1.6, 0.0], "duration": 3.0, "action": "none", "label": "ENTRANCE"},
            {"id": "c3", "step_name": "Main Door Opens", "room_id": "entrance", "position": [0.0, 1.7, 1.8], "look_at": [0.0, 1.6, -1.0], "duration": 2.5, "action": "door_open", "label": "ENTRANCE"},
            {"id": "c4", "step_name": "Enter Living Room", "room_id": "living_room", "position": [0.0, 1.7, -1.2], "look_at": [-1.6, 1.5, -3.8], "duration": 3.5, "action": "none", "label": "LIVING ROOM"},
            {"id": "c5", "step_name": "Living Room Overview", "room_id": "living_room", "position": [0.8, 1.7, -3.5], "look_at": [2.5, 1.5, -2.5], "duration": 3.0, "action": "none", "label": "LIVING ROOM"},
            {"id": "c6", "step_name": "Enter Kitchen", "room_id": "kitchen", "position": [3.8, 1.7, -2.2], "look_at": [5.2, 1.4, -3.5], "duration": 3.5, "action": "none", "label": "KITCHEN"},
            {"id": "c7", "step_name": "Master Bedroom", "room_id": "master_bedroom", "position": [-2.0, 1.7, -6.8], "look_at": [-2.4, 1.4, -9.2], "duration": 3.5, "action": "pan_180", "label": "MASTER BEDROOM"},
            {"id": "c8", "step_name": "Bedroom 2", "room_id": "bedroom_2", "position": [2.0, 1.7, -6.8], "look_at": [2.4, 1.4, -9.2], "duration": 3.5, "action": "none", "label": "BEDROOM 2"},
            {"id": "c9", "step_name": "Master Bathroom", "room_id": "bathroom_1", "position": [-3.8, 1.7, -10.8], "look_at": [-4.8, 1.4, -11.6], "duration": 2.5, "action": "none", "label": "BATHROOM 1"},
            {"id": "c10", "step_name": "Common Bathroom", "room_id": "bathroom_2", "position": [4.2, 1.7, -6.6], "look_at": [5.4, 1.4, -7.2], "duration": 2.5, "action": "none", "label": "BATHROOM 2"},
            {"id": "c11", "step_name": "Approach Balcony", "room_id": "balcony", "position": [0.0, 1.7, -10.2], "look_at": [0.0, 1.6, -14.0], "duration": 2.0, "action": "balcony_open", "label": "BALCONY VIEW"},
            {"id": "c12", "step_name": "Walk onto Balcony", "room_id": "balcony", "position": [0.0, 1.7, -12.0], "look_at": [0.0, 1.6, -20.0], "duration": 3.5, "action": "exterior_view", "label": "BALCONY VIEW"},
            {"id": "c13", "step_name": "Balcony Outside Pan", "room_id": "balcony", "position": [0.0, 1.7, -12.2], "look_at": [-5.0, 1.8, -20.0], "duration": 3.0, "action": "exterior_view", "label": "BALCONY OUTSIDE VIEW"},
            {"id": "c14", "step_name": "Return to Front View", "room_id": "exterior", "position": [0.0, 8.0, 24.0], "look_at": [0.0, 4.5, 0.0], "duration": 4.0, "action": "none", "label": "PROPERTY FRONT VIEW"},
            {"id": "c15", "step_name": "Tour Complete", "room_id": "exterior", "position": [0.0, 8.0, 24.0], "look_at": [0.0, 4.5, 0.0], "duration": 2.0, "action": "complete", "label": "TOUR COMPLETE"}
        ]

    # 3 BHK LAYOUT
    elif bhk == 3:
        rooms_data = [
            {
                "id": "entrance",
                "name": "Entrance & Foyer",
                "type": "entrance",
                "order": 1,
                "position": {"x": 0.0, "y": 0.0, "z": 2.0},
                "dimensions": {"width": 3.0, "length": 3.5, "height": ceiling_height},
                "floor_material": "polished_marble",
                "wall_color": "#F5F2EB",
                "camera_focus": {"position": [0.0, 1.7, 4.0], "look_at": [0.0, 1.6, -1.0]},
                "label": "ENTRANCE",
                "subtitle": "Grand entrance foyer with designer ceiling",
                "has_actual_image": bool(ext_img),
                "image_url": ext_img
            },
            {
                "id": "living_room",
                "name": "Hall / Living Room",
                "type": "living_room",
                "order": 2,
                "position": {"x": -1.2, "y": 0.0, "z": -2.8},
                "dimensions": {"width": 6.2, "length": 5.8, "height": ceiling_height},
                "floor_material": "imported_marble",
                "wall_color": "#EBE7DF",
                "camera_focus": {"position": [-0.5, 1.7, -0.8], "look_at": [-2.5, 1.5, -4.0]},
                "label": "LIVING ROOM",
                "subtitle": "Large double-height feel living lounge for family and guests",
                "has_actual_image": bool(living_img),
                "image_url": living_img,
                "furniture": [
                    {"type": "sofa_sectional_large", "position": [-2.4, 0.0, -3.8], "rotation_y": 0.0},
                    {"type": "coffee_table", "position": [-2.4, 0.0, -2.4], "rotation_y": 0.0},
                    {"type": "tv_wall_unit", "position": [1.6, 0.0, -2.8], "rotation_y": -1.57},
                    {"type": "chandeliers", "position": [-1.2, 2.7, -2.8], "rotation_y": 0.0}
                ]
            },
            {
                "id": "dining",
                "name": "Dining Area",
                "type": "dining",
                "order": 3,
                "position": {"x": 3.8, "y": 0.0, "z": -2.4},
                "dimensions": {"width": 3.6, "length": 4.5, "height": ceiling_height},
                "floor_material": "imported_marble",
                "wall_color": "#ECE8E0",
                "camera_focus": {"position": [2.6, 1.7, -1.5], "look_at": [4.2, 1.4, -3.2]},
                "label": "DINING AREA",
                "subtitle": "Dedicated 6-seater dining area with modern pendant fixture",
                "has_actual_image": bool(kitchen_img),
                "image_url": kitchen_img,
                "furniture": [
                    {"type": "dining_table_6", "position": [4.0, 0.0, -2.6], "rotation_y": 0.0},
                    {"type": "pendant_light", "position": [4.0, 2.5, -2.6], "rotation_y": 0.0}
                ]
            },
            {
                "id": "kitchen",
                "name": "Kitchen",
                "type": "kitchen",
                "order": 4,
                "position": {"x": 4.5, "y": 0.0, "z": -7.5},
                "dimensions": {"width": 3.8, "length": 5.0, "height": ceiling_height},
                "floor_material": "granite_tile",
                "wall_color": "#FFFFFF",
                "camera_focus": {"position": [3.5, 1.7, -6.0], "look_at": [5.2, 1.4, -8.5]},
                "label": "KITCHEN",
                "subtitle": "Chef-grade modular kitchen with utility balcony connection",
                "has_actual_image": bool(kitchen_img),
                "image_url": kitchen_img,
                "furniture": [
                    {"type": "kitchen_counter_u", "position": [4.6, 0.0, -8.2], "rotation_y": 0.0},
                    {"type": "refrigerator_double", "position": [5.8, 0.0, -6.0], "rotation_y": 3.14}
                ]
            },
            {
                "id": "master_bedroom",
                "name": "Master Bedroom",
                "type": "bedroom",
                "order": 5,
                "position": {"x": -3.2, "y": 0.0, "z": -8.5},
                "dimensions": {"width": 5.2, "length": 5.5, "height": ceiling_height},
                "floor_material": "wooden_parquet",
                "wall_color": "#E5E1D7",
                "camera_focus": {"position": [-3.2, 1.7, -6.5], "look_at": [-3.2, 1.4, -10.0]},
                "label": "MASTER BEDROOM",
                "subtitle": "Expansive master suite with walk-in closet space and private bath",
                "has_actual_image": bool(master_img),
                "image_url": master_img,
                "furniture": [
                    {"type": "king_bed", "position": [-3.2, 0.0, -10.0], "rotation_y": 3.14},
                    {"type": "nightstand_left", "position": [-5.0, 0.0, -10.2], "rotation_y": 0.0},
                    {"type": "nightstand_right", "position": [-1.4, 0.0, -10.2], "rotation_y": 0.0},
                    {"type": "wardrobe_walkin", "position": [-5.5, 0.0, -7.5], "rotation_y": 1.57}
                ]
            },
            {
                "id": "bedroom_2",
                "name": "Bedroom 2",
                "type": "bedroom",
                "order": 6,
                "position": {"x": 1.0, "y": 0.0, "z": -8.5},
                "dimensions": {"width": 4.5, "length": 5.2, "height": ceiling_height},
                "floor_material": "laminate_wood",
                "wall_color": "#E8E5DC",
                "camera_focus": {"position": [1.0, 1.7, -6.5], "look_at": [1.0, 1.4, -9.8]},
                "label": "BEDROOM 2",
                "subtitle": "Second bedroom with wide windows and storage",
                "has_actual_image": bool(bed2_img),
                "image_url": bed2_img,
                "furniture": [
                    {"type": "queen_bed", "position": [1.0, 0.0, -9.8], "rotation_y": 3.14},
                    {"type": "study_desk", "position": [2.6, 0.0, -7.5], "rotation_y": -1.57}
                ]
            },
            {
                "id": "bedroom_3",
                "name": "Bedroom 3 / Guest Bedroom",
                "type": "bedroom",
                "order": 7,
                "position": {"x": 5.0, "y": 0.0, "z": -13.0},
                "dimensions": {"width": 4.4, "length": 5.0, "height": ceiling_height},
                "floor_material": "laminate_wood",
                "wall_color": "#E8E5DC",
                "camera_focus": {"position": [4.0, 1.7, -11.5], "look_at": [5.2, 1.4, -14.2]},
                "label": "BEDROOM 3",
                "subtitle": "Third bedroom suitable for guests or work study",
                "has_actual_image": bool(bed3_img),
                "image_url": bed3_img,
                "furniture": [
                    {"type": "queen_bed", "position": [5.0, 0.0, -14.2], "rotation_y": 3.14},
                    {"type": "wardrobe", "position": [6.5, 0.0, -12.0], "rotation_y": -1.57}
                ]
            },
            {
                "id": "bathroom_1",
                "name": "Master Attached Bathroom",
                "type": "bathroom",
                "order": 8,
                "position": {"x": -5.6, "y": 0.0, "z": -12.2},
                "dimensions": {"width": 2.8, "length": 3.2, "height": ceiling_height},
                "floor_material": "anti_skid_tiles",
                "wall_color": "#DCE1E5",
                "camera_focus": {"position": [-4.5, 1.7, -11.2], "look_at": [-6.0, 1.4, -12.8]},
                "label": "BATHROOM 1",
                "subtitle": "Attached master bathroom with rain shower & glass cubicle",
                "has_actual_image": bool(bath_img),
                "image_url": bath_img,
                "furniture": [
                    {"type": "vanity_mirror", "position": [-5.8, 0.0, -13.4], "rotation_y": 0.0},
                    {"type": "toilet_commode", "position": [-4.6, 0.0, -13.2], "rotation_y": 0.0}
                ]
            },
            {
                "id": "bathroom_2",
                "name": "Common Bathroom",
                "type": "bathroom",
                "order": 9,
                "position": {"x": 2.5, "y": 0.0, "z": -12.2},
                "dimensions": {"width": 2.5, "length": 3.0, "height": ceiling_height},
                "floor_material": "anti_skid_tiles",
                "wall_color": "#DCE1E5",
                "camera_focus": {"position": [1.5, 1.7, -11.5], "look_at": [2.8, 1.4, -12.8]},
                "label": "BATHROOM 2",
                "subtitle": "Central bathroom for bedrooms 2 & 3",
                "has_actual_image": bool(bath_img),
                "image_url": bath_img,
                "furniture": [
                    {"type": "vanity_mirror", "position": [3.0, 0.0, -13.4], "rotation_y": 0.0},
                    {"type": "toilet_commode", "position": [2.0, 0.0, -13.2], "rotation_y": 0.0}
                ]
            },
            {
                "id": "balcony",
                "name": "Balcony",
                "type": "balcony",
                "order": 10,
                "position": {"x": -1.2, "y": 0.0, "z": -13.2},
                "dimensions": {"width": 5.6, "length": 2.8, "height": ceiling_height},
                "floor_material": "deck_wood",
                "wall_color": "#D0CAC0",
                "camera_focus": {"position": [-1.2, 1.7, -12.2], "look_at": [-1.2, 1.6, -18.5]},
                "label": "BALCONY VIEW",
                "subtitle": "Generous balcony opening from living & master suite",
                "has_actual_image": bool(balc_img),
                "image_url": balc_img,
                "furniture": [
                    {"type": "balcony_railing", "position": [-1.2, 0.0, -14.4], "rotation_y": 0.0},
                    {"type": "coffee_table", "position": [-1.2, 0.0, -13.2], "rotation_y": 0.0},
                    {"type": "bistro_chair_left", "position": [-2.4, 0.0, -13.2], "rotation_y": 1.2},
                    {"type": "bistro_chair_right", "position": [0.0, 0.0, -13.2], "rotation_y": -1.2}
                ]
            }
        ]

        doors_data = [
            {"id": "main_door", "name": "Main Entrance Door", "is_main_entrance": True, "position": [0.0, 0.0, 0.0], "rotation_y": 0.0, "width": 1.2, "height": 2.3},
            {"id": "door_kitchen", "name": "Kitchen Entry", "is_main_entrance": False, "position": [4.0, 0.0, -5.0], "rotation_y": 0.0, "width": 1.0, "height": 2.2},
            {"id": "door_master", "name": "Master Suite Door", "is_main_entrance": False, "position": [-2.2, 0.0, -5.8], "rotation_y": 0.0, "width": 1.0, "height": 2.2},
            {"id": "door_bed2", "name": "Bedroom 2 Door", "is_main_entrance": False, "position": [0.5, 0.0, -5.8], "rotation_y": 0.0, "width": 0.95, "height": 2.15},
            {"id": "door_bed3", "name": "Bedroom 3 Door", "is_main_entrance": False, "position": [3.8, 0.0, -11.0], "rotation_y": 0.0, "width": 0.95, "height": 2.15},
            {"id": "door_bath1", "name": "Master Bath Door", "is_main_entrance": False, "position": [-4.5, 0.0, -11.2], "rotation_y": 0.0, "width": 0.85, "height": 2.1},
            {"id": "door_bath2", "name": "Common Bath Door", "is_main_entrance": False, "position": [1.5, 0.0, -11.2], "rotation_y": 0.0, "width": 0.85, "height": 2.1},
            {"id": "door_balcony", "name": "Balcony Glass Slider", "is_balcony": True, "position": [-1.2, 0.0, -11.6], "rotation_y": 0.0, "width": 2.4, "height": 2.4}
        ]

        camera_path = [
            {"id": "c1", "step_name": "Property Front View", "room_id": "exterior", "position": [0.0, 7.0, 22.0], "look_at": [0.0, 4.0, 0.0], "duration": 4.0, "action": "none", "label": "PROPERTY FRONT VIEW"},
            {"id": "c2", "step_name": "Approach Entrance", "room_id": "entrance", "position": [0.0, 1.7, 4.8], "look_at": [0.0, 1.6, 0.0], "duration": 3.0, "action": "none", "label": "ENTRANCE"},
            {"id": "c3", "step_name": "Main Door Opens", "room_id": "entrance", "position": [0.0, 1.7, 1.8], "look_at": [0.0, 1.6, -1.0], "duration": 2.5, "action": "door_open", "label": "ENTRANCE"},
            {"id": "c4", "step_name": "Enter Living Room", "room_id": "living_room", "position": [-0.5, 1.7, -1.2], "look_at": [-2.2, 1.5, -3.8], "duration": 3.5, "action": "none", "label": "LIVING ROOM"},
            {"id": "c5", "step_name": "Dining Area", "room_id": "dining", "position": [2.5, 1.7, -1.8], "look_at": [4.0, 1.4, -3.2], "duration": 3.0, "action": "none", "label": "DINING AREA"},
            {"id": "c6", "step_name": "Modular Kitchen", "room_id": "kitchen", "position": [3.8, 1.7, -6.5], "look_at": [5.0, 1.4, -8.5], "duration": 3.5, "action": "none", "label": "KITCHEN"},
            {"id": "c7", "step_name": "Master Bedroom", "room_id": "master_bedroom", "position": [-2.8, 1.7, -7.2], "look_at": [-3.2, 1.4, -10.0], "duration": 3.5, "action": "pan_180", "label": "MASTER BEDROOM"},
            {"id": "c8", "step_name": "Bedroom 2", "room_id": "bedroom_2", "position": [0.8, 1.7, -7.2], "look_at": [1.0, 1.4, -9.8], "duration": 3.0, "action": "none", "label": "BEDROOM 2"},
            {"id": "c9", "step_name": "Bedroom 3", "room_id": "bedroom_3", "position": [4.2, 1.7, -12.0], "look_at": [5.2, 1.4, -14.2], "duration": 3.0, "action": "none", "label": "BEDROOM 3"},
            {"id": "c10", "step_name": "Master Bathroom", "room_id": "bathroom_1", "position": [-4.8, 1.7, -11.6], "look_at": [-5.8, 1.4, -12.8], "duration": 2.5, "action": "none", "label": "BATHROOM 1"},
            {"id": "c11", "step_name": "Common Bathroom", "room_id": "bathroom_2", "position": [1.8, 1.7, -11.6], "look_at": [2.8, 1.4, -12.8], "duration": 2.5, "action": "none", "label": "BATHROOM 2"},
            {"id": "c12", "step_name": "Balcony Approach", "room_id": "balcony", "position": [-1.2, 1.7, -11.0], "look_at": [-1.2, 1.6, -15.0], "duration": 2.0, "action": "balcony_open", "label": "BALCONY VIEW"},
            {"id": "c13", "step_name": "Walk onto Balcony", "room_id": "balcony", "position": [-1.2, 1.7, -13.0], "look_at": [-1.2, 1.6, -22.0], "duration": 3.5, "action": "exterior_view", "label": "BALCONY VIEW"},
            {"id": "c14", "step_name": "Pan Outside Cityscape", "room_id": "balcony", "position": [-1.2, 1.7, -13.2], "look_at": [4.0, 1.8, -22.0], "duration": 3.0, "action": "exterior_view", "label": "BALCONY OUTSIDE VIEW"},
            {"id": "c15", "step_name": "Full Front View", "room_id": "exterior", "position": [0.0, 8.5, 26.0], "look_at": [0.0, 4.5, 0.0], "duration": 4.0, "action": "none", "label": "PROPERTY FRONT VIEW"},
            {"id": "c16", "step_name": "Tour Complete", "room_id": "exterior", "position": [0.0, 8.5, 26.0], "look_at": [0.0, 4.5, 0.0], "duration": 2.0, "action": "complete", "label": "TOUR COMPLETE"}
        ]

    # 4 BHK LAYOUT
    else:
        rooms_data = [
            {
                "id": "entrance",
                "name": "Entrance Foyer",
                "type": "entrance",
                "order": 1,
                "position": {"x": 0.0, "y": 0.0, "z": 2.2},
                "dimensions": {"width": 3.4, "length": 3.8, "height": ceiling_height},
                "floor_material": "polished_marble",
                "wall_color": "#F5F2EB",
                "camera_focus": {"position": [0.0, 1.7, 4.5], "look_at": [0.0, 1.6, -1.0]},
                "label": "ENTRANCE",
                "subtitle": "Palatial private entrance foyer",
                "has_actual_image": bool(ext_img),
                "image_url": ext_img
            },
            {
                "id": "living_room",
                "name": "Grand Living Room",
                "type": "living_room",
                "order": 2,
                "position": {"x": -1.8, "y": 0.0, "z": -3.2},
                "dimensions": {"width": 7.0, "length": 6.5, "height": ceiling_height},
                "floor_material": "italian_marble",
                "wall_color": "#EAE5DB",
                "camera_focus": {"position": [-0.8, 1.7, -1.0], "look_at": [-3.2, 1.5, -4.5]},
                "label": "LIVING ROOM",
                "subtitle": "Expansive luxury living hall with double seating zones",
                "has_actual_image": bool(living_img),
                "image_url": living_img,
                "furniture": [
                    {"type": "sofa_sectional_large", "position": [-3.2, 0.0, -4.5], "rotation_y": 0.0},
                    {"type": "coffee_table", "position": [-3.2, 0.0, -2.8], "rotation_y": 0.0},
                    {"type": "tv_wall_unit", "position": [1.4, 0.0, -3.2], "rotation_y": -1.57}
                ]
            },
            {
                "id": "dining",
                "name": "Dining Area",
                "type": "dining",
                "order": 3,
                "position": {"x": 4.5, "y": 0.0, "z": -2.8},
                "dimensions": {"width": 4.2, "length": 5.2, "height": ceiling_height},
                "floor_material": "italian_marble",
                "wall_color": "#ECE7DF",
                "camera_focus": {"position": [3.0, 1.7, -1.8], "look_at": [4.8, 1.4, -3.8]},
                "label": "DINING AREA",
                "subtitle": "8-seater formal dining area",
                "has_actual_image": bool(kitchen_img),
                "image_url": kitchen_img,
                "furniture": [
                    {"type": "dining_table_8", "position": [4.8, 0.0, -3.5], "rotation_y": 0.0}
                ]
            },
            {
                "id": "kitchen",
                "name": "Gourmet Kitchen",
                "type": "kitchen",
                "order": 4,
                "position": {"x": 5.0, "y": 0.0, "z": -8.5},
                "dimensions": {"width": 4.2, "length": 5.8, "height": ceiling_height},
                "floor_material": "granite_tile",
                "wall_color": "#FFFFFF",
                "camera_focus": {"position": [3.8, 1.7, -7.0], "look_at": [5.6, 1.4, -9.5]},
                "label": "KITCHEN",
                "subtitle": "Island kitchen with built-in appliances and breakfast counter",
                "has_actual_image": bool(kitchen_img),
                "image_url": kitchen_img,
                "furniture": [
                    {"type": "kitchen_island", "position": [5.2, 0.0, -9.0], "rotation_y": 0.0}
                ]
            },
            {
                "id": "master_bedroom",
                "name": "Master Suite",
                "type": "bedroom",
                "order": 5,
                "position": {"x": -4.0, "y": 0.0, "z": -9.5},
                "dimensions": {"width": 5.8, "length": 6.2, "height": ceiling_height},
                "floor_material": "hardwood_walnut",
                "wall_color": "#E4DFD4",
                "camera_focus": {"position": [-4.0, 1.7, -7.2], "look_at": [-4.0, 1.4, -11.2]},
                "label": "MASTER BEDROOM",
                "subtitle": "Presidential master suite with lounge area",
                "has_actual_image": bool(master_img),
                "image_url": master_img,
                "furniture": [
                    {"type": "king_bed", "position": [-4.0, 0.0, -11.2], "rotation_y": 3.14}
                ]
            },
            {
                "id": "bedroom_2",
                "name": "Bedroom 2 (Child Room 1)",
                "type": "bedroom",
                "order": 6,
                "position": {"x": 0.5, "y": 0.0, "z": -9.5},
                "dimensions": {"width": 4.8, "length": 5.5, "height": ceiling_height},
                "floor_material": "oak_wood",
                "wall_color": "#E7E4DB",
                "camera_focus": {"position": [0.5, 1.7, -7.2], "look_at": [0.5, 1.4, -11.0]},
                "label": "BEDROOM 2",
                "subtitle": "Spacious bedroom with integrated study setup",
                "has_actual_image": bool(bed2_img),
                "image_url": bed2_img,
                "furniture": [
                    {"type": "queen_bed", "position": [0.5, 0.0, -11.0], "rotation_y": 3.14}
                ]
            },
            {
                "id": "bedroom_3",
                "name": "Bedroom 3 (Child Room 2)",
                "type": "bedroom",
                "order": 7,
                "position": {"x": 5.5, "y": 0.0, "z": -14.5},
                "dimensions": {"width": 4.6, "length": 5.2, "height": ceiling_height},
                "floor_material": "oak_wood",
                "wall_color": "#E7E4DB",
                "camera_focus": {"position": [4.2, 1.7, -12.8], "look_at": [5.8, 1.4, -15.8]},
                "label": "BEDROOM 3",
                "subtitle": "Bright third bedroom with external view",
                "has_actual_image": bool(bed3_img),
                "image_url": bed3_img,
                "furniture": [
                    {"type": "queen_bed", "position": [5.5, 0.0, -15.8], "rotation_y": 3.14}
                ]
            },
            {
                "id": "bedroom_4",
                "name": "Bedroom 4 (Guest / Study Room)",
                "type": "bedroom",
                "order": 8,
                "position": {"x": -3.5, "y": 0.0, "z": -16.0},
                "dimensions": {"width": 4.8, "length": 5.2, "height": ceiling_height},
                "floor_material": "oak_wood",
                "wall_color": "#E7E4DB",
                "camera_focus": {"position": [-2.2, 1.7, -14.5], "look_at": [-3.8, 1.4, -17.2]},
                "label": "GUEST BEDROOM",
                "subtitle": "Guest suite / home office study",
                "has_actual_image": bool(bed3_img or master_img),
                "image_url": bed3_img or master_img,
                "furniture": [
                    {"type": "queen_bed", "position": [-3.5, 0.0, -17.2], "rotation_y": 3.14}
                ]
            },
            {
                "id": "bathroom_1",
                "name": "Master Ensuite Bath",
                "type": "bathroom",
                "order": 9,
                "position": {"x": -6.8, "y": 0.0, "z": -13.5},
                "dimensions": {"width": 3.2, "length": 3.8, "height": ceiling_height},
                "floor_material": "anti_skid_tiles",
                "wall_color": "#DCE1E5",
                "camera_focus": {"position": [-5.5, 1.7, -12.2], "look_at": [-7.2, 1.4, -14.2]},
                "label": "BATHROOM 1",
                "subtitle": "5-fixture master bathroom with double vanity",
                "has_actual_image": bool(bath_img),
                "image_url": bath_img,
                "furniture": [
                    {"type": "vanity_mirror", "position": [-7.0, 0.0, -14.8], "rotation_y": 0.0}
                ]
            },
            {
                "id": "bathroom_2",
                "name": "Bathrooms & Powder Room",
                "type": "bathroom",
                "order": 10,
                "position": {"x": 2.2, "y": 0.0, "z": -14.2},
                "dimensions": {"width": 2.8, "length": 3.4, "height": ceiling_height},
                "floor_material": "anti_skid_tiles",
                "wall_color": "#DCE1E5",
                "camera_focus": {"position": [1.2, 1.7, -13.2], "look_at": [2.6, 1.4, -15.0]},
                "label": "BATHROOM 2",
                "subtitle": "Common bathroom with premium fixtures",
                "has_actual_image": bool(bath_img),
                "image_url": bath_img,
                "furniture": [
                    {"type": "vanity_mirror", "position": [2.8, 0.0, -15.4], "rotation_y": 0.0}
                ]
            },
            {
                "id": "balcony",
                "name": "Balcony / Terrace",
                "type": "balcony",
                "order": 11,
                "position": {"x": 0.5, "y": 0.0, "z": -17.5},
                "dimensions": {"width": 6.8, "length": 3.2, "height": ceiling_height},
                "floor_material": "terrace_stone",
                "wall_color": "#D0CAC0",
                "camera_focus": {"position": [0.5, 1.7, -16.2], "look_at": [0.5, 1.6, -24.0]},
                "label": "BALCONY VIEW",
                "subtitle": "Expansive outdoor deck with panoramic skyline horizon",
                "has_actual_image": bool(balc_img),
                "image_url": balc_img,
                "furniture": [
                    {"type": "balcony_railing", "position": [0.5, 0.0, -19.0], "rotation_y": 0.0}
                ]
            }
        ]

        doors_data = [
            {"id": "main_door", "name": "Main Entrance Door", "is_main_entrance": True, "position": [0.0, 0.0, 0.0], "rotation_y": 0.0, "width": 1.3, "height": 2.4},
            {"id": "door_kitchen", "name": "Kitchen Entry", "is_main_entrance": False, "position": [4.5, 0.0, -5.5], "rotation_y": 0.0, "width": 1.1, "height": 2.2},
            {"id": "door_master", "name": "Master Suite Door", "is_main_entrance": False, "position": [-3.0, 0.0, -6.5], "rotation_y": 0.0, "width": 1.05, "height": 2.25},
            {"id": "door_bed2", "name": "Bedroom 2 Door", "is_main_entrance": False, "position": [0.5, 0.0, -6.5], "rotation_y": 0.0, "width": 1.0, "height": 2.2},
            {"id": "door_bed3", "name": "Bedroom 3 Door", "is_main_entrance": False, "position": [4.5, 0.0, -12.0], "rotation_y": 0.0, "width": 0.95, "height": 2.15},
            {"id": "door_bed4", "name": "Bedroom 4 Door", "is_main_entrance": False, "position": [-2.0, 0.0, -13.5], "rotation_y": 0.0, "width": 0.95, "height": 2.15},
            {"id": "door_bath1", "name": "Master Bath Door", "is_main_entrance": False, "position": [-5.5, 0.0, -12.5], "rotation_y": 0.0, "width": 0.9, "height": 2.1},
            {"id": "door_bath2", "name": "Common Bath Door", "is_main_entrance": False, "position": [1.5, 0.0, -13.0], "rotation_y": 0.0, "width": 0.9, "height": 2.1},
            {"id": "door_balcony", "name": "Terrace Sliding Glass Door", "is_balcony": True, "position": [0.5, 0.0, -15.8], "rotation_y": 0.0, "width": 2.8, "height": 2.4}
        ]

        camera_path = [
            {"id": "c1", "step_name": "Property Front View", "room_id": "exterior", "position": [0.0, 7.5, 24.0], "look_at": [0.0, 4.5, 0.0], "duration": 4.0, "action": "none", "label": "PROPERTY FRONT VIEW"},
            {"id": "c2", "step_name": "Approach Entrance", "room_id": "entrance", "position": [0.0, 1.7, 5.0], "look_at": [0.0, 1.6, 0.0], "duration": 3.0, "action": "none", "label": "ENTRANCE"},
            {"id": "c3", "step_name": "Main Door Opens", "room_id": "entrance", "position": [0.0, 1.7, 1.8], "look_at": [0.0, 1.6, -1.0], "duration": 2.5, "action": "door_open", "label": "ENTRANCE"},
            {"id": "c4", "step_name": "Grand Living Room", "room_id": "living_room", "position": [-0.8, 1.7, -1.5], "look_at": [-2.8, 1.5, -4.2], "duration": 3.5, "action": "none", "label": "LIVING ROOM"},
            {"id": "c5", "step_name": "Formal Dining", "room_id": "dining", "position": [3.0, 1.7, -2.0], "look_at": [4.6, 1.4, -3.8], "duration": 3.0, "action": "none", "label": "DINING AREA"},
            {"id": "c6", "step_name": "Gourmet Kitchen", "room_id": "kitchen", "position": [4.0, 1.7, -7.2], "look_at": [5.5, 1.4, -9.5], "duration": 3.5, "action": "none", "label": "KITCHEN"},
            {"id": "c7", "step_name": "Master Suite", "room_id": "master_bedroom", "position": [-3.5, 1.7, -8.0], "look_at": [-4.0, 1.4, -11.2], "duration": 3.5, "action": "pan_180", "label": "MASTER BEDROOM"},
            {"id": "c8", "step_name": "Child Bedroom 1", "room_id": "bedroom_2", "position": [0.5, 1.7, -8.0], "look_at": [0.5, 1.4, -11.0], "duration": 3.0, "action": "none", "label": "BEDROOM 2"},
            {"id": "c9", "step_name": "Child Bedroom 2", "room_id": "bedroom_3", "position": [4.5, 1.7, -13.5], "look_at": [5.5, 1.4, -15.8], "duration": 3.0, "action": "none", "label": "BEDROOM 3"},
            {"id": "c10", "step_name": "Guest Bedroom", "room_id": "bedroom_4", "position": [-2.5, 1.7, -15.0], "look_at": [-3.8, 1.4, -17.2], "duration": 3.0, "action": "none", "label": "GUEST BEDROOM"},
            {"id": "c11", "step_name": "Bathrooms", "room_id": "bathroom_1", "position": [-5.8, 1.7, -12.8], "look_at": [-7.0, 1.4, -14.2], "duration": 2.5, "action": "none", "label": "BATHROOMS"},
            {"id": "c12", "step_name": "Approach Balcony", "room_id": "balcony", "position": [0.5, 1.7, -15.0], "look_at": [0.5, 1.6, -20.0], "duration": 2.0, "action": "balcony_open", "label": "BALCONY VIEW"},
            {"id": "c13", "step_name": "Walk onto Terrace", "room_id": "balcony", "position": [0.5, 1.7, -17.2], "look_at": [0.5, 1.6, -26.0], "duration": 3.5, "action": "exterior_view", "label": "BALCONY VIEW"},
            {"id": "c14", "step_name": "Pan Horizon", "room_id": "balcony", "position": [0.5, 1.7, -17.5], "look_at": [5.0, 1.8, -26.0], "duration": 3.0, "action": "exterior_view", "label": "BALCONY OUTSIDE VIEW"},
            {"id": "c15", "step_name": "Full Front Elevation", "room_id": "exterior", "position": [0.0, 9.0, 28.0], "look_at": [0.0, 5.0, 0.0], "duration": 4.0, "action": "none", "label": "PROPERTY FRONT VIEW"},
            {"id": "c16", "step_name": "Tour Complete", "room_id": "exterior", "position": [0.0, 9.0, 28.0], "look_at": [0.0, 5.0, 0.0], "duration": 2.0, "action": "complete", "label": "TOUR COMPLETE"}
        ]

    # Building exterior model description
    exterior_config = {
        "building_type": "villa" if is_standalone_villa else "apartment",
        "total_floors": total_floors,
        "selected_floor": selected_floor,
        "facade_style": "modern_contemporary",
        "primary_color": "#E5E2DC" if not is_standalone_villa else "#F0ECE1",
        "accent_color": "#2C4A52" if not is_standalone_villa else "#3A352F",
        "glass_tint": "#8FA8B2",
        "has_balconies": True,
        "city": city,
        "locality": locality,
        "weather": "clear_daylight",
        "sun_azimuth": 45,
        "sun_altitude": 60
    }

    # Format price string
    if not price_display:
        if price >= 10000000:
            price_display = f"₹{price / 10000000:.2f} Cr"
        elif price >= 100000:
            price_display = f"₹{price / 100000:.2f} Lakh"
        elif price > 0:
            price_display = f"₹{price:,.0f}"
        else:
            price_display = "Price on Request"

    return {
        "property_id": prop_id,
        "title": title,
        "bhk": bhk,
        "bedrooms": bhk,
        "bathrooms": bathrooms_count,
        "balconies": balconies_count,
        "property_type": prop_type,
        "city": city,
        "locality": locality,
        "address": address,
        "area_sqft": area_sqft,
        "price_display": price_display,
        "is_verified_floorplan": bool(floor_plan_img or custom_rooms),
        "floor_plan_url": floor_plan_img,
        "scene": {
            "units": "meters",
            "ceiling_height": ceiling_height,
            "wall_thickness": 0.15
        },
        "building": exterior_config,
        "rooms": rooms_data,
        "doors": doors_data,
        "camera_path": camera_path,
        "exterior": exterior_config,
        "media": [
            {"category": k, "urls": v} for k, v in classified_media.items() if len(v) > 0
        ]
    }
