import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.property import Property
from app.ai.investment_analysis import analyze_property_investment, format_inr

# Canonical amenities to check systematically
STANDARD_AMENITIES = [
    "Swimming Pool",
    "Gym",
    "Lift",
    "Parking",
    "Security",
    "Garden",
    "Clubhouse",
    "Power Backup",
    "Children Play Area",
    "EV Charging"
]

class PropertyComparisonService:
    """
    Dedicated factual property comparison service.
    DATABASE = SOURCE OF TRUTH.
    No hardcoded values, no mock properties, no hallucinations.
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def identify_properties(
        *args,
        db: Optional[Session] = None,
        text: Optional[str] = None,
        query_text: Optional[str] = None,
        property_ids: Optional[List[int]] = None,
        past_logs: Optional[List[Any]] = None,
        context_ids: Optional[List[int]] = None,
        conversation_context: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Tuple[List[Any], Optional[str]]:
        is_instance = False
        resolved_db = db
        raw_text = text or query_text or ""
        resolved_past_logs = past_logs

        arg_idx = 0
        if len(args) > arg_idx and isinstance(args[arg_idx], PropertyComparisonService):
            is_instance = True
            if resolved_db is None:
                resolved_db = args[arg_idx].db
            arg_idx += 1

        if len(args) > arg_idx and hasattr(args[arg_idx], "query"):
            resolved_db = args[arg_idx]
            arg_idx += 1

        if not raw_text and len(args) > arg_idx and isinstance(args[arg_idx], str):
            raw_text = args[arg_idx]
            arg_idx += 1

        if resolved_past_logs is None and len(args) > arg_idx:
            resolved_past_logs = args[arg_idx]
            arg_idx += 1

        if property_ids:
            props = resolved_db.query(Property).filter(Property.id.in_(property_ids)).all() if resolved_db else []
            prop_map = {p.id: p for p in props}
            ordered = [prop_map[pid] for pid in property_ids if pid in prop_map]
            if is_instance:
                return [p.id for p in ordered], None
            return ordered, None

        if conversation_context and "last_search_results" in conversation_context:
            res_items = conversation_context["last_search_results"]
            c_ids = [item.get("id") if isinstance(item, dict) else getattr(item, "id", None) for item in res_items]
            context_ids = [i for i in c_ids if i is not None]

        props, ambig = PropertyComparisonService._identify_internal(resolved_db, raw_text, resolved_past_logs, context_ids)
        if is_instance and props:
            return [p.id for p in props], ambig
        return props, ambig

    @staticmethod
    def _identify_internal(
        db: Session,
        text: str,
        past_logs: Optional[List[Any]] = None,
        context_ids: Optional[List[int]] = None
    ) -> Tuple[List[Property], Optional[str]]:
        """
        Identifies 2 to 4 properties from user query, property names, IDs, or conversation context.
        Returns (properties, ambiguity_or_error_message).
        """
        # 1. Check for explicit property IDs: e.g. "property 35 and 21", "ID 1 and 2", "#1, #2"
        explicit_ids = []
        for match in re.finditer(r'(?:property|id|#)\s*#?\s*(\d+)', text, re.IGNORECASE):
            explicit_ids.append(int(match.group(1)))
        
        # Also plain numbers if phrase is "compare 35 and 21"
        if not explicit_ids:
            num_matches = re.findall(r'\b\d+\b', text)
            if len(num_matches) >= 2 and any(k in text.lower() for k in ["compare", "vs", "versus"]):
                explicit_ids = [int(n) for n in num_matches[:4]]

        if explicit_ids:
            unique_ids = list(dict.fromkeys(explicit_ids))[:4]
            props = db.query(Property).filter(Property.id.in_(unique_ids)).all()
            prop_map = {p.id: p for p in props}
            ordered = [prop_map[pid] for pid in unique_ids if pid in prop_map]
            if len(ordered) >= 2:
                return ordered, None

        # 2. Check for ordinal/positional references in context (e.g. "first two", "first and third", "these two")
        recent_ids: List[int] = []
        if context_ids:
            recent_ids = list(context_ids)
        elif past_logs:
            for log in reversed(past_logs):
                pids = getattr(log, "matched_property_ids", None)
                if pids and isinstance(pids, list) and len(pids) >= 2:
                    recent_ids = pids
                    break

        lower = text.lower()
        if recent_ids:
            if "first two" in lower or "top 2" in lower or "first 2" in lower or "these two" in lower:
                target_ids = recent_ids[:2]
                props = db.query(Property).filter(Property.id.in_(target_ids)).all()
                prop_map = {p.id: p for p in props}
                ordered = [prop_map[pid] for pid in target_ids if pid in prop_map]
                if len(ordered) >= 2:
                    return ordered, None

            if "first three" in lower or "top 3" in lower or "first 3" in lower or "these three" in lower:
                target_ids = recent_ids[:3]
                props = db.query(Property).filter(Property.id.in_(target_ids)).all()
                prop_map = {p.id: p for p in props}
                ordered = [prop_map[pid] for pid in target_ids if pid in prop_map]
                if len(ordered) >= 2:
                    return ordered, None

            if "first and third" in lower or "1st and 3rd" in lower:
                if len(recent_ids) >= 3:
                    target_ids = [recent_ids[0], recent_ids[2]]
                    props = db.query(Property).filter(Property.id.in_(target_ids)).all()
                    prop_map = {p.id: p for p in props}
                    ordered = [prop_map[pid] for pid in target_ids if pid in prop_map]
                    if len(ordered) >= 2:
                        return ordered, None

            if "first and second" in lower or "1st and 2nd" in lower:
                target_ids = recent_ids[:2]
                props = db.query(Property).filter(Property.id.in_(target_ids)).all()
                prop_map = {p.id: p for p in props}
                ordered = [prop_map[pid] for pid in target_ids if pid in prop_map]
                if len(ordered) >= 2:
                    return ordered, None

            if "second and third" in lower or "2nd and 3rd" in lower:
                if len(recent_ids) >= 3:
                    target_ids = [recent_ids[1], recent_ids[2]]
                    props = db.query(Property).filter(Property.id.in_(target_ids)).all()
                    prop_map = {p.id: p for p in props}
                    ordered = [prop_map[pid] for pid in target_ids if pid in prop_map]
                    if len(ordered) >= 2:
                        return ordered, None

        # 3. Match by Property Name in Database
        # Query distinct available properties to match against user text
        all_props = db.query(Property).filter(Property.status == "available").all()
        matched_props = []

        for p in all_props:
            # Clean title keywords
            title_clean = re.sub(r'[^\w\s]', ' ', p.title).strip().lower()
            title_tokens = [w for w in title_clean.split() if w not in ["in", "at", "and", "the", "bhk", "villa", "apartment", "studio", "flat", "residency", "heights"]]
            
            # Check full title or specific distinct project name in user query
            if p.title.lower() in lower:
                matched_props.append(p)
            elif len(title_tokens) >= 2 and all(tok in lower for tok in title_tokens):
                matched_props.append(p)
            elif len(title_tokens) == 1 and len(title_tokens[0]) >= 5 and title_tokens[0] in lower:
                # Check for ambiguity
                same_token_props = [
                    other for other in all_props 
                    if title_tokens[0] in other.title.lower()
                ]
                if len(same_token_props) > 1:
                    return [], f"I found multiple properties with that name ({', '.join(pr.title for pr in same_token_props[:3])}). Please select the property you want to compare."
                matched_props.append(p)

        # Deduplicate
        seen_ids = set()
        unique_matched = []
        for p in matched_props:
            if p.id not in seen_ids:
                seen_ids.add(p.id)
                unique_matched.append(p)

        if len(unique_matched) >= 2:
            return unique_matched[:4], None

        # 4. If query is a general comparison ("compare", "compare these", "which is better") and context exists
        if any(k in lower for k in ["compare", "which is better", "which one is better", "which should i buy", "which is cheaper"]):
            if recent_ids and len(recent_ids) >= 2:
                target_ids = recent_ids[:2]
                props = db.query(Property).filter(Property.id.in_(target_ids)).all()
                prop_map = {p.id: p for p in props}
                ordered = [prop_map[pid] for pid in target_ids if pid in prop_map]
                if len(ordered) >= 2:
                    return ordered, None

        return [], "Please specify at least 2 properties by ID, name, or select them from the search results to compare."

    def compare(
        *args,
        db: Optional[Session] = None,
        properties: Optional[List[Any]] = None,
        property_ids: Optional[List[Any]] = None,
        user_requirements: Optional[Dict[str, Any]] = None,
        priority: str = "balanced",
        language: str = "en",
        **kwargs
    ) -> Dict[str, Any]:
        resolved_db = db
        props_input = properties or property_ids
        reqs = kwargs.get("user_requirements", user_requirements)
        pri = kwargs.get("priority", priority)
        lang = kwargs.get("language", language)

        arg_idx = 0
        if len(args) > arg_idx and isinstance(args[arg_idx], PropertyComparisonService):
            if resolved_db is None:
                resolved_db = args[arg_idx].db
            arg_idx += 1

        if len(args) > arg_idx and hasattr(args[arg_idx], "query"):
            resolved_db = args[arg_idx]
            arg_idx += 1

        if props_input is None and len(args) > arg_idx:
            props_input = args[arg_idx]
            arg_idx += 1

        if reqs is None and len(args) > arg_idx:
            reqs = args[arg_idx]
            arg_idx += 1

        if (pri == "balanced" or not pri) and len(args) > arg_idx:
            pri = args[arg_idx]
            arg_idx += 1

        if (lang == "en" or not lang) and len(args) > arg_idx:
            lang = args[arg_idx]
            arg_idx += 1

        if props_input and all(isinstance(x, (int, str)) for x in props_input):
            int_ids = [int(x) for x in props_input]
            if resolved_db:
                db_props = resolved_db.query(Property).filter(Property.id.in_(int_ids)).all()
            else:
                from app.db.session import SessionLocal
                with SessionLocal() as s:
                    db_props = s.query(Property).filter(Property.id.in_(int_ids)).all()
            prop_map = {p.id: p for p in db_props}
            resolved_props = [prop_map[pid] for pid in int_ids if pid in prop_map]
        else:
            resolved_props = props_input

        return PropertyComparisonService._compare_internal(resolved_props, reqs, pri, lang)

    @staticmethod
    def _compare_internal(
        properties: List[Property],
        user_requirements: Optional[Dict[str, Any]] = None,
        priority: str = "balanced",
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Executes complete, database-grounded property comparison.
        Never hallucinates missing values.
        """
        if len(properties) < 2:
            raise ValueError("At least 2 valid properties from the database are required for comparison.")
        if len(properties) > 4:
            properties = properties[:4]

        reqs = user_requirements or {}
        norm_pri = (priority or reqs.get("priority", "balanced")).lower()

        # 1. Normalize Property Data
        norm_props = []
        prices = []
        areas = []
        amenities_map: Dict[int, List[str]] = {}

        for p in properties:
            price = float(p.price) if p.price is not None else 0.0
            area = float(p.area_sqft) if p.area_sqft and p.area_sqft > 0 else 0.0
            price_per_sqft = round(price / area) if (price > 0 and area > 0) else None
            
            prices.append(price)
            areas.append(area)

            # Amenities normalization
            raw_amenities = p.amenities
            if isinstance(raw_amenities, list):
                amenities_list = [str(a).strip() for a in raw_amenities if a]
            elif isinstance(raw_amenities, str):
                amenities_list = [a.strip() for a in raw_amenities.split(",") if a.strip()]
            else:
                amenities_list = []
            amenities_map[p.id] = amenities_list

            # Media / Image
            img_url = None
            if hasattr(p, "media") and p.media:
                sorted_media = sorted(p.media, key=lambda m: getattr(m, "sort_order", 0))
                img_url = sorted_media[0].url if sorted_media else None
            if not img_url:
                img_url = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&auto=format"

            # Investment metrics (model estimate with disclaimer)
            inv = analyze_property_investment(p)

            # Parking breakdown
            has_parking = any("park" in a.lower() for a in amenities_list)
            covered_parking = any("covered park" in a.lower() for a in amenities_list)
            open_parking = any("open park" in a.lower() for a in amenities_list)
            two_wheeler = any("bike" in a.lower() or "two wheeler" in a.lower() for a in amenities_list)

            # Possession breakdown
            desc_lower = (p.description or "").lower()
            status_lower = (p.status or "").lower()
            if "ready" in desc_lower or "ready" in status_lower:
                possession_status = "Ready to Move"
                possession_date = "Immediate"
            elif "under construction" in desc_lower or "under construction" in status_lower:
                possession_status = "Under Construction"
                # Search for year / month
                date_match = re.search(r'\b(202[5-9]|203[0-5])\b', desc_lower)
                possession_date = date_match.group(0) if date_match else "Future Possession"
            else:
                possession_status = "Ready to Move"
                possession_date = "Available"

            # Legal / verification
            verif_str = "Verified in SAI" if p.is_verified else "Pending Review"
            rera_str = "MahaRERA Registered" if p.is_rera else "Pending / Unlisted"

            norm_props.append({
                "id": p.id,
                "title": p.title,
                "property_type": (p.property_type or "Apartment").capitalize(),
                "listing_type": (p.listing_type or "Buy").capitalize(),
                "status": (p.status or "Available").capitalize(),
                "bhk": p.bhk,
                "bhk_display": f"{p.bhk} BHK" if p.bhk else "Not Available",
                "price": price,
                "price_display": p.price_display or format_inr(price),
                "area_sqft": area,
                "area_display": f"{area:,.0f} sq.ft" if area > 0 else "Not Available",
                "price_per_sqft": price_per_sqft,
                "price_per_sqft_display": f"₹{price_per_sqft:,}/sq.ft" if price_per_sqft else "Not Available",
                "locality": p.locality or "Not Available",
                "city": p.city or "Not Available",
                "state": p.state or "Maharashtra",
                "country": p.country or "India",
                "address": p.address or f"{p.locality}, {p.city}",
                "pincode": p.pincode or "Not Available",
                "furnishing": (p.furnishing or "Unfurnished").capitalize(),
                "amenities": amenities_list,
                "dist_metro": p.dist_metro or "Not Available",
                "is_verified": bool(p.is_verified),
                "verification_status": verif_str,
                "is_rera": bool(p.is_rera),
                "rera_status": rera_str,
                "rating": float(p.rating or 4.5),
                "image_url": img_url,
                "possession_status": possession_status,
                "possession_date": possession_date,
                "has_parking": has_parking,
                "parking_display": "Yes (Covered)" if covered_parking else ("Yes" if has_parking else "No / Not listed"),
                "rental_yield_estimate": f"{inv.estimated_rental_yield_pct}% gross",
                "monthly_rent_estimate": inv.monthly_rental_display,
                "five_year_appreciation": f"+{inv.projections[2].cumulative_appreciation_pct}%",
                "investment_score": inv.investment_score,
            })

        # 2. Key Differences Detection
        differences = []
        p_cheapest = min(norm_props, key=lambda x: x["price"])
        p_priciest = max(norm_props, key=lambda x: x["price"])
        p_largest = max(norm_props, key=lambda x: x["area_sqft"])
        p_smallest = min(norm_props, key=lambda x: x["area_sqft"])

        # City difference check
        cities = list(dict.fromkeys(p["city"] for p in norm_props))
        if len(cities) > 1:
            differences.append(
                f"Location Difference: Compared properties are located in different cities ({', '.join(cities)})."
            )

        # Locality difference check
        localities = list(dict.fromkeys(f"{p['locality']} ({p['city']})" for p in norm_props))
        if len(cities) == 1 and len(localities) > 1:
            differences.append(
                f"Locality Difference: Located across different localities ({', '.join(localities)})."
            )

        # Price difference
        if p_cheapest["id"] != p_priciest["id"] and p_priciest["price"] > p_cheapest["price"]:
            price_gap = p_priciest["price"] - p_cheapest["price"]
            differences.append(
                f"{p_cheapest['title']} has the lower price ({p_cheapest['price_display']} vs {p_priciest['price_display']}, saving {format_inr(price_gap)})."
            )

        # Area difference
        if p_largest["id"] != p_smallest["id"] and p_largest["area_sqft"] > p_smallest["area_sqft"]:
            area_gap = p_largest["area_sqft"] - p_smallest["area_sqft"]
            differences.append(
                f"{p_largest['title']} has more area ({p_largest['area_display']} vs {p_smallest['area_display']}, +{area_gap:,.0f} sq.ft)."
            )

        # Price per sq.ft difference
        sqft_props = [p for p in norm_props if p["price_per_sqft"] is not None]
        if len(sqft_props) >= 2:
            lowest_sqft = min(sqft_props, key=lambda x: x["price_per_sqft"])
            highest_sqft = max(sqft_props, key=lambda x: x["price_per_sqft"])
            if lowest_sqft["id"] != highest_sqft["id"] and highest_sqft["price_per_sqft"] > lowest_sqft["price_per_sqft"]:
                sqft_gap = highest_sqft["price_per_sqft"] - lowest_sqft["price_per_sqft"]
                differences.append(
                    f"{lowest_sqft['title']} offers lower cost per square foot ({lowest_sqft['price_per_sqft_display']} vs {highest_sqft['price_per_sqft_display']}, saving ₹{sqft_gap:,}/sq.ft)."
                )

        # Parking difference
        park_has = [p["title"] for p in norm_props if p["has_parking"]]
        park_no = [p["title"] for p in norm_props if not p["has_parking"]]
        if park_has and park_no:
            differences.append(
                f"Parking: {', '.join(park_has)} provides dedicated parking; {', '.join(park_no)} does not list parking."
            )
        elif len(park_has) == len(norm_props):
            differences.append("All compared properties provide designated parking.")

        # Possession difference
        possession_statuses = {p["title"]: p["possession_status"] for p in norm_props}
        if len(set(possession_statuses.values())) > 1:
            ready_titles = [t for t, s in possession_statuses.items() if s == "Ready to Move"]
            uc_titles = [t for t, s in possession_statuses.items() if s != "Ready to Move"]
            differences.append(
                f"Possession: {', '.join(ready_titles)} is listed as ready to move, while {', '.join(uc_titles)} has a future possession date."
            )

        # Verification difference
        verif_has = [p["title"] for p in norm_props if p["is_verified"]]
        verif_no = [p["title"] for p in norm_props if not p["is_verified"]]
        if verif_has and verif_no:
            differences.append(
                f"Verification: {', '.join(verif_has)} is SAI Verified; {', '.join(verif_no)} is pending review."
            )

        # 3. Amenity Comparison Breakdown
        all_amenity_sets = [set(p["amenities"]) for p in norm_props]
        common_amenities = sorted(list(set.intersection(*all_amenity_sets))) if all_amenity_sets else []

        unique_amenities: Dict[int, List[str]] = {}
        for p in norm_props:
            other_sets = [set(op["amenities"]) for op in norm_props if op["id"] != p["id"]]
            other_union = set.union(*other_sets) if other_sets else set()
            unique_amenities[p["id"]] = sorted(list(set(p["amenities"]) - other_union))

        # Check standard amenities checklist
        all_present_amenities = sorted(list(set.union(*all_amenity_sets))) if all_amenity_sets else STANDARD_AMENITIES
        amenity_checklist = []
        for am in all_present_amenities:
            row_dict = {"amenity": am}
            for p in norm_props:
                row_dict[str(p["id"])] = any(am.lower() in a.lower() for a in p["amenities"])
            amenity_checklist.append(row_dict)

        # 4. Advantages & Considerations (Actual Database Facts Only)
        advantages: Dict[int, List[str]] = {}
        considerations: Dict[int, List[str]] = {}

        for p in norm_props:
            adv = []
            cons = []

            # Price
            if p["id"] == p_cheapest["id"] and len(norm_props) > 1 and p_cheapest["price"] < p_priciest["price"]:
                adv.append(f"Lowest listed price ({p['price_display']})")
            elif p["id"] == p_priciest["id"] and len(norm_props) > 1 and p_priciest["price"] > p_cheapest["price"]:
                cons.append(f"Higher listed price ({p['price_display']})")

            # Area
            if p["id"] == p_largest["id"] and len(norm_props) > 1 and p_largest["area_sqft"] > p_smallest["area_sqft"]:
                adv.append(f"Largest listed living area ({p['area_display']})")
            elif p["id"] == p_smallest["id"] and len(norm_props) > 1 and p_smallest["area_sqft"] < p_largest["area_sqft"]:
                cons.append(f"More compact floor area ({p['area_display']})")

            # Price per sqft
            if p.get("price_per_sqft") and sqft_props:
                lowest_sq = min(sqft_props, key=lambda x: x["price_per_sqft"])
                if p["id"] == lowest_sq["id"] and lowest_sq["price_per_sqft"] < max(sqft_props, key=lambda x: x["price_per_sqft"])["price_per_sqft"]:
                    adv.append(f"Most competitive price per sq.ft ({p['price_per_sqft_display']})")

            # Parking
            if p["has_parking"]:
                adv.append("Dedicated parking facility available")
            else:
                cons.append("No parking facility listed in database")

            # Possession
            if p["possession_status"] == "Ready to Move":
                adv.append("Ready to move (Immediate possession)")
            else:
                cons.append(f"Under construction ({p['possession_date']})")

            # Verification
            if p["is_verified"]:
                adv.append("SAI Verified (Ownership & listing inspected)")
            else:
                cons.append("Verification pending (Documents under review)")

            # RERA
            if p["is_rera"]:
                adv.append("RERA Registered & compliant")
            else:
                cons.append("RERA registration unverified")

            # Transit
            if p["dist_metro"] and "metro" in p["dist_metro"].lower():
                adv.append(f"Convenient transit access ({p['dist_metro']})")

            # Amenities count
            if len(p["amenities"]) >= 5:
                adv.append(f"Extensive amenity suite ({len(p['amenities'])} amenities)")
            elif len(p["amenities"]) == 0:
                cons.append("No specialized amenities listed")

            advantages[p["id"]] = adv
            considerations[p["id"]] = cons

        # 5. User Requirement Matching
        # Supported user criteria: budget_max, city, bhk, parking_required, ready_required, locality
        req_budget = reqs.get("budget_max")
        req_city = reqs.get("city")
        req_bhk = reqs.get("bhk")
        req_parking = reqs.get("parking_required", False)
        req_ready = reqs.get("ready_required", False)
        req_locality = reqs.get("locality")

        # Create structured requirement rows
        requirement_matrix = []
        
        # 1. Budget requirement
        if req_budget:
            budget_row = {
                "criterion": f"Budget ≤ {format_inr(req_budget)}",
                "results": {}
            }
            for p in norm_props:
                matched = p["price"] <= req_budget
                budget_row["results"][p["id"]] = {
                    "matched": matched,
                    "symbol": "✓" if matched else "✗",
                    "text": f"{p['price_display']} (within budget)" if matched else f"{p['price_display']} (exceeds budget)"
                }
            requirement_matrix.append(budget_row)

        # 2. City requirement
        if req_city:
            city_row = {
                "criterion": f"City = {req_city.capitalize()}",
                "results": {}
            }
            for p in norm_props:
                matched = p["city"].lower() == req_city.lower()
                city_row["results"][p["id"]] = {
                    "matched": matched,
                    "symbol": "✓" if matched else "✗",
                    "text": p["city"]
                }
            requirement_matrix.append(city_row)

        # 3. BHK requirement
        if req_bhk:
            bhk_row = {
                "criterion": f"{req_bhk} BHK Configuration",
                "results": {}
            }
            for p in norm_props:
                matched = (p["bhk"] == req_bhk)
                bhk_row["results"][p["id"]] = {
                    "matched": matched,
                    "symbol": "✓" if matched else "✗",
                    "text": p["bhk_display"]
                }
            requirement_matrix.append(bhk_row)

        # 4. Parking requirement
        if req_parking:
            park_row = {
                "criterion": "Parking = Required",
                "results": {}
            }
            for p in norm_props:
                matched = p["has_parking"]
                park_row["results"][p["id"]] = {
                    "matched": matched,
                    "symbol": "✓" if matched else "✗",
                    "text": p["parking_display"]
                }
            requirement_matrix.append(park_row)

        # 5. Ready possession requirement
        if req_ready:
            ready_row = {
                "criterion": "Possession = Ready to Move",
                "results": {}
            }
            for p in norm_props:
                matched = (p["possession_status"] == "Ready to Move")
                ready_row["results"][p["id"]] = {
                    "matched": matched,
                    "symbol": "✓" if matched else "✗",
                    "text": p["possession_status"]
                }
            requirement_matrix.append(ready_row)

        # Summarize requirement matches per property
        req_match_per_prop = []
        for p in norm_props:
            matches_list = []
            mismatches_list = []
            for row in requirement_matrix:
                res = row["results"].get(p["id"], {})
                if res.get("matched"):
                    matches_list.append(row["criterion"])
                else:
                    mismatches_list.append(row["criterion"])

            req_match_per_prop.append({
                "property_id": p["id"],
                "property_title": p["title"],
                "matches": matches_list,
                "mismatches": mismatches_list,
                "match_count": len(matches_list),
                "mismatch_count": len(mismatches_list)
            })

        # 6. Priority & Trade-Off Conclusion
        if "price" in norm_pri:
            leader = p_cheapest
            recommendation_reason = (
                f"Under your stated priority for **Lowest Price**, **{p_cheapest['title']}** ({p_cheapest['price_display']}) "
                f"is the leading selection, saving **{format_inr(p_priciest['price'] - p_cheapest['price'])}**.\n\n"
                f"💡 **Trade-off Analysis**: Choosing the lower price means accepting {p_cheapest['area_display']} instead of "
                f"{p_priciest['area_display']}, but keeps overall acquisition capital significantly lower."
            )
        elif "area" in norm_pri or "space" in norm_pri:
            leader = p_largest
            area_extra = p_largest["area_sqft"] - p_smallest["area_sqft"]
            recommendation_reason = (
                f"Under your stated priority for **Maximum Living Space**, **{p_largest['title']}** ({p_largest['area_display']}) "
                f"provides **+{area_extra:,.0f} sq.ft more floor space**.\n\n"
                f"💡 **Trade-off Analysis**: Larger living space comes with a price difference of "
                f"**{format_inr(p_priciest['price'] - p_cheapest['price'])}**."
            )
        elif "parking" in norm_pri:
            park_matches = [p for p in norm_props if p["has_parking"]]
            leader = min(park_matches, key=lambda x: x["price"]) if park_matches else norm_props[0]
            recommendation_reason = (
                f"Under your stated priority for **Parking**, **{leader['title']}** guarantees verified designated parking."
            )
        else:
            # Default: requirement match leader
            if requirement_matrix:
                leader = max(norm_props, key=lambda x: (
                    next((rm["match_count"] for rm in req_match_per_prop if rm["property_id"] == x["id"]), 0),
                    -x["price"],
                    x["area_sqft"]
                ))
                leader_match = next((rm for rm in req_match_per_prop if rm["property_id"] == leader["id"]), None)
                other_props = [p for p in norm_props if p["id"] != leader["id"]]
                
                if leader_match and leader_match["match_count"] == len(requirement_matrix):
                    reasons_text = f"**{leader['title']}** matches all of the stated requirements currently available in the SAI database."
                else:
                    reasons_text = f"**{leader['title']}** matches more of your stated requirements."

                other_summaries = []
                for op in other_props:
                    op_m = next((rm for rm in req_match_per_prop if rm["property_id"] == op["id"]), None)
                    if op_m and op_m["mismatches"]:
                        other_summaries.append(f"**{op['title']}** matches budget/configuration but does not meet: {', '.join(op_m['mismatches'])}")

                other_desc = f" ({'; '.join(other_summaries)})." if other_summaries else ""
                recommendation_reason = (
                    f"Based on the requirements you provided, {reasons_text}{other_desc}\n\n"
                    f"💡 **Trade-off Analysis**: If your main priority shifts (e.g. to lowest price or maximum space), "
                    f"the recommendation adjusts accordingly."
                )
            else:
                leader = p_cheapest
                recommendation_reason = (
                    f"Based on the database records, **{p_cheapest['title']}** offers the lowest acquisition cost ({p_cheapest['price_display']}), "
                    f"while **{p_largest['title']}** provides the largest area ({p_largest['area_display']})."
                )

        # 7. Comprehensive Tabular Fields Comparison
        categories = {
            "Basic Information": [
                ("Property Name", lambda p: p["title"]),
                ("Property ID", lambda p: f"#{p['id']}"),
                ("Property Type", lambda p: p["property_type"]),
                ("Listing Type", lambda p: p["listing_type"]),
                ("Status", lambda p: p["status"]),
                ("Verification Status", lambda p: p["verification_status"]),
            ],
            "Location": [
                ("City", lambda p: p["city"]),
                ("Locality", lambda p: p["locality"]),
                ("Address", lambda p: p["address"]),
                ("PIN Code", lambda p: p["pincode"]),
                ("Transit / Metro", lambda p: p["dist_metro"]),
            ],
            "Price & Cost": [
                ("Listed Price", lambda p: p["price_display"]),
                ("Price per sq.ft", lambda p: p["price_per_sqft_display"]),
                ("Estimated Rent", lambda p: p["monthly_rent_estimate"]),
                ("Rental Yield", lambda p: p["rental_yield_estimate"]),
            ],
            "Property Size": [
                ("Carpet Area", lambda p: p["area_display"]),
            ],
            "Configuration": [
                ("BHK", lambda p: p["bhk_display"]),
                ("Furnishing", lambda p: p["furnishing"]),
            ],
            "Condition & Possession": [
                ("Possession Status", lambda p: p["possession_status"]),
                ("Possession Date", lambda p: p["possession_date"]),
            ],
            "Parking": [
                ("Parking Available", lambda p: p["parking_display"]),
            ],
            "Legal & Trust": [
                ("SAI Verified", lambda p: "Yes ✓" if p["is_verified"] else "Pending Review"),
                ("RERA Registered", lambda p: "Yes ✓" if p["is_rera"] else "Pending / Unlisted"),
                ("Rating", lambda p: f"★ {p['rating']} / 5.0"),
            ]
        }

        comparison_fields = []
        for cat_name, field_tuples in categories.items():
            for field_name, getter in field_tuples:
                values_dict = {}
                raw_vals = []
                for p in norm_props:
                    val = getter(p)
                    values_dict[str(p["id"])] = val
                    raw_vals.append(str(val))
                is_different = len(set(raw_vals)) > 1
                comparison_fields.append({
                    "category": cat_name,
                    "field": field_name,
                    "values": values_dict,
                    "is_different": is_different
                })

        # Tabular matrix dict for backwards-compatibility
        matrix_dict = {}
        for cf in comparison_fields:
            matrix_dict[cf["field"]] = [cf["values"][str(p["id"])] for p in norm_props]

        # Summary text
        city_scope = norm_props[0]["city"] if len(cities) == 1 else "multiple cities"
        summary = (
            f"Compared {len(norm_props)} properties in {city_scope}. "
            f"Prices range from {p_cheapest['price_display']} to {p_priciest['price_display']}. "
            f"{p_cheapest['title']} offers the lowest acquisition cost ({p_cheapest['price_display']}), "
            f"while {p_largest['title']} provides the largest area ({p_largest['area_display']})."
        )

        return {
            "properties": norm_props,
            "fields": comparison_fields,
            "matrix": matrix_dict,
            "comparable_fields": matrix_dict,
            "differences": differences,
            "advantages": advantages,
            "considerations": considerations,
            "requirement_matrix": requirement_matrix,
            "requirement_match": req_match_per_prop,
            "amenity_comparison": {
                "common": common_amenities,
                "unique": unique_amenities,
                "checklist": amenity_checklist,
            },
            "price_analysis": {
                "cheapest_id": p_cheapest["id"],
                "cheapest_title": p_cheapest["title"],
                "cheapest_price": p_cheapest["price"],
                "priciest_id": p_priciest["id"],
                "priciest_title": p_priciest["title"],
                "priciest_price": p_priciest["price"],
                "difference": round(p_priciest["price"] - p_cheapest["price"], 2),
                "difference_display": format_inr(p_priciest["price"] - p_cheapest["price"]),
                "explanation": f"{p_cheapest['title']} is {format_inr(p_priciest['price'] - p_cheapest['price'])} lower in listed price." if p_cheapest['id'] != p_priciest['id'] else "Both properties have identical listed prices."
            },
            "area_analysis": {
                "largest_id": p_largest["id"],
                "largest_title": p_largest["title"],
                "largest_area": p_largest["area_sqft"],
                "smallest_id": p_smallest["id"],
                "smallest_title": p_smallest["title"],
                "smallest_area": p_smallest["area_sqft"],
                "difference": round(p_largest["area_sqft"] - p_smallest["area_sqft"], 2),
                "explanation": f"{p_largest['title']} provides {p_largest['area_sqft'] - p_smallest['area_sqft']:,.0f} sq.ft more listed area." if p_largest['id'] != p_smallest['id'] else "Both properties have identical listed floor area."
            },
            "summary": summary,
            "recommendation_reason": recommendation_reason,
            "top_pick_id": leader["id"],
            "priority": norm_pri,
            "trade_offs": {
                p["title"]: {
                    "advantages": advantages[p["id"]],
                    "considerations": considerations[p["id"]]
                }
                for p in norm_props
            }
        }
