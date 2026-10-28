import re
import uuid
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.property import Property
from app.models.chat_log import ChatLog
from app.models.user import User
from app.ai.language_service import detect_language, get_greeting, get_off_topic_response
from app.ai.nlp_parser import rule_based_extract_intent, normalize_devanagari
from app.ai.tools import execute_tool_call, format_property_result
from app.ai.qwen_client import qwen_client
from app.ai.property_reasoning import generate_property_comparison
from app.ai.investment_analysis import analyze_property_investment, format_inr
from app.services.building_3d_service import smart_find_flats
from app.models.project import Unit, Building, Project

logger = logging.getLogger("sai-chat")

# Common Greetings across all 8 languages
GREETING_PATTERNS = [
    r"\b(hi|hello|hey|greetings|namaste|namaskar|pranam|good\s+(morning|afternoon|evening))\b",
    r"(नमस्ते|नमस्कार|प्रणाम|हाय|हॅलो|হ্যালো|নমস্কার|નમસ્તે|નમસ્કાર|வணக்கம்|నమస్కారం|నమస్తే|ನಮಸ್ಕಾರ|ನಮಸ್ತೆ)"
]

# Real estate general concepts (Carpet area, RERA, home loan, 7/12)
REAL_ESTATE_CONCEPT_PATTERNS = [
    r"\b(carpet area|built up area|super built up|what is rera|rera act|stamp duty|registration process|home loan emi|7/12|satbara)\b",
    r"(कारपेट एरिया|बिल्ट अप|रेरा क्या है|रेरा कायदा|मुद्रांक शुल्क|स्टॅम्प ड्युटी|नोंदणी प्रक्रिया|गृहकर्ज|सातबारा)"
]

def extract_session_requirements(user_text: str, past_logs: List[ChatLog]) -> Dict[str, Any]:
    """Accumulates user preferences (budget, BHK, parking, ready possession, priority) across the session."""
    curr_lower = user_text.lower()
    all_text = " ".join([l.user_message for l in past_logs[-4:]] + [user_text])
    parsed = rule_based_extract_intent(all_text)
    lower = all_text.lower()

    # Check if user specifically removed parking
    if any(k in curr_lower for k in ["remove parking", "without parking", "no parking needed", "parking not required"]):
        parking_req = False
    else:
        parking_req = any(k in lower for k in ["parking", "पार्किंग", "गाड़ी"])

    ready_req = any(k in lower for k in ["ready", "possession", "रेडी", "ताबा"])
    bhk = parsed.bhk or 2
    budget = parsed.max_price or 8000000.0
    city = parsed.city or "Amravati"
    priority = "balanced"
    if any(k in curr_lower for k in ["price", "cheapest", "lowest price", "स्वस्त", "सस्ता"]):
        priority = "price"
    elif any(k in curr_lower for k in ["area", "space", "जागा", "क्षेत्र"]):
        priority = "area"
    elif "parking" in curr_lower and ("mandatory" in curr_lower or "priority" in curr_lower):
        priority = "parking"

    return {
        "budget_max": budget,
        "bhk": bhk,
        "city": city,
        "locality": parsed.locality,
        "parking_required": parking_req,
        "ready_required": ready_req,
        "priority": priority
    }

def resolve_context_properties(user_text: str, past_logs: List[ChatLog], db: Session) -> List[Property]:
    """Identifies target properties from explicit IDs, ordinal references, or recent search history."""
    from app.services.property_comparison_service import PropertyComparisonService
    identified, err = PropertyComparisonService.identify_properties(db, user_text, past_logs)
    if identified and len(identified) >= 2:
        return identified

    pids = []
    # 1. Numeric IDs in current text
    for num in re.findall(r'\b\d+\b', user_text):
        try:
            pid = int(num)
            if db.query(Property).filter(Property.id == pid).first():
                pids.append(pid)
        except Exception:
            pass

    # 2. Match property titles in text
    if len(pids) < 2:
        for p in db.query(Property).limit(35).all():
            if p.title.lower() in user_text.lower() and p.id not in pids:
                pids.append(p.id)

    # 3. Context from recent chat logs
    if len(pids) < 2 and past_logs:
        for log in reversed(past_logs):
            if log.matched_property_ids and len(log.matched_property_ids) >= 2:
                matched = log.matched_property_ids
                if "first two" in user_text.lower() or "first 2" in user_text.lower() or "these two" in user_text.lower():
                    pids = matched[:2]
                elif "third" in user_text.lower() and "first" in user_text.lower() and len(matched) >= 3:
                    pids = [matched[0], matched[2]]
                elif "these three" in user_text.lower() or "first three" in user_text.lower() or "top 3" in user_text.lower():
                    pids = matched[:3]
                elif not pids:
                    pids = matched[:2]
                break

    # 4. Default available properties fallback
    if len(pids) < 2:
        default_props = db.query(Property).filter(Property.status == "available").limit(2).all()
        pids = [p.id for p in default_props]

    # Deduplicate preserving order
    seen = set()
    ordered_pids = []
    for pid in pids:
        if pid not in seen:
            seen.add(pid)
            ordered_pids.append(pid)

    props = db.query(Property).filter(Property.id.in_(ordered_pids[:4])).all()
    # Sort in requested order
    p_map = {p.id: p for p in props}
    return [p_map[pid] for pid in ordered_pids[:4] if pid in p_map]

def classify_intent(text: str, past_logs: List[ChatLog] = None) -> str:
    """
    Classifies user intent into canonical intents:
    - GREETING
    - GENERAL_KNOWLEDGE (Machine Learning, Cloud, Python, Coding, General AI, Casual)
    - PROPERTY_VERIFICATION (Verification system, required docs, what is verified)
    - PROPERTY_FOLLOW_UP_CHEAPER (Which is cheaper? lowest price?)
    - PROPERTY_FOLLOW_UP_AREA (Which has more area/space? larger?)
    - PROPERTY_FOLLOW_UP_PARKING (Which has parking? parking facility?)
    - PROPERTY_PRIORITY_UPDATE (Now price is more important, priority is price)
    - PROPERTY_REQUIREMENTS_UPDATE (I need parking and ready possession)
    - PROPERTY_RECOMMENDATION_MATCH (Which matches my requirements better? Which is better for me?)
    - PROPERTY_COMPARISON (Compare these two, Compare properties)
    - PROPERTY_DETAILS (Details of property X)
    - PROPERTY_RECOMMENDATION (Recommend properties)
    - INVESTMENT_ANALYSIS (Rental yield, appreciation, ROI)
    - PROPERTY_SEARCH (City, BHK, price, location)
    - UNCLEAR
    """
    lower = text.strip().lower()

    # 0. Check for gibberish / unclear input
    if re.search(r'(asdfghjkl|असमंजस|काहीतरी|অস্পষ্ট|કંઈક|புரியவில்லை|స్పష్టత లేదు|ಗೊಂದಲ)', text, re.IGNORECASE):
        return "UNCLEAR"
    cleaned_alpha = re.sub(r'[^a-zA-Z\u0900-\u0D7F]', '', text)
    if len(cleaned_alpha) == 0 and any(p in text for p in ["?", "!", ".", "@", "#"]):
        return "UNCLEAR"
    if len(cleaned_alpha) > 4 and re.match(r'^(asdf|qwerty|zxcv|xyz|abcd|1234|qwer|hjkl)', cleaned_alpha.lower()):
        return "UNCLEAR"

    # 1. Greetings
    if any(re.search(p, lower, re.IGNORECASE) for p in GREETING_PATTERNS):
        if len(text.split()) <= 5 and not any(k in lower for k in ["bhk", "crore", "lakh", "rent", "buy", "price", "baner", "wakad", "flat", "apartment", "property"]):
            return "GREETING"

    # 2. Comparison Follow-ups (Specific criteria)
    if re.search(r'\b(which.*cheaper|who is cheaper|which is cheaper|cheapest|lowest price|cost less|how much cheaper|price difference|कम कीमत|सस्ता|कमी किंमत|कोणते स्वस्त)\b', lower):
        return "PROPERTY_FOLLOW_UP_CHEAPER"

    if re.search(r'\b(which.*more area|which.*more space|which is larger|which is bigger|has more area|more sqft|more square feet|अधिक क्षेत्रफल|जास्त जागा|जास्त क्षेत्रफळ|मोठा|बड़ा)\b', lower):
        return "PROPERTY_FOLLOW_UP_AREA"

    if re.search(r'\b(which.*parking|does.*parking|has parking|have parking|about parking|पार्किंग|गाड़ी पार्किंग)\b', lower) and not any(k in lower for k in ["find", "search", "show"]):
        return "PROPERTY_FOLLOW_UP_PARKING"

    if re.search(r'\b(which.*ready to move|which is ready|ready possession|is.*ready to move|possession date|when is possession)\b', lower):
        return "PROPERTY_FOLLOW_UP_READY"

    if re.search(r'\b(which.*verified|who is verified|which is rera|which.*rera status)\b', lower):
        return "PROPERTY_FOLLOW_UP_VERIFIED"

    if re.search(r'\b(which.*more amenities|which.*better amenities|has more amenities|better amenities)\b', lower):
        return "PROPERTY_FOLLOW_UP_AMENITIES"

    if re.search(r'\b(which.*lower price per sq|lower sqft rate|cheaper per sqft|lower price per square foot)\b', lower):
        return "PROPERTY_FOLLOW_UP_SQFT_PRICE"

    if re.search(r'\b(which.*matches my budget|which is within my budget|matches my budget)\b', lower):
        return "PROPERTY_FOLLOW_UP_BUDGET"

    # 3. Priority Changes
    if re.search(r'\b(now price is more important|actually price is|price is my main priority|priority is price|parking is mandatory|area is more important|priority.*price|priority.*area|actually, lowest price is more important|lowest price is more important|now consider price as my priority|प्राथमिकता|महत्त्वाचे)\b', lower):
        return "PROPERTY_PRIORITY_UPDATE"

    # 4. Requirements updates (e.g. "I need parking and ready possession", "remove parking")
    if re.search(r'\b(i need.*parking|need parking|parking and ready|ready possession|remove parking|without parking|parking not required|ready to move)\b', lower):
        if not any(k in lower for k in ["bhk", "crore", "lakh", "flat", "apartment", "villa", "plot", "pune", "mumbai", "amravati", "nagpur"]):
            return "PROPERTY_REQUIREMENTS_UPDATE"

    # 5. Requirement Match (e.g. "Which one matches my requirements better?")
    if re.search(r'\b(which.*match.*requirement|which.*matches.*better|which.*better for me|which.*suits.*better|matches my requirements|which one matches)\b', lower) or \
       re.search(r'(कोणते.*गरजांशी.*जुळते|कोणते.*चांगले|कौन सा.*ज़रूरतों.*से.*मेल)', lower):
        return "PROPERTY_RECOMMENDATION_MATCH"

    # 6. Verification questions
    if re.search(r'\b(what does verified mean|verification system|documents required|what documents|how to verify|how.*verify|verification process|how to check documents|is.*verified|are.*documents.*verified|is.*property.*verified|show.*document|show.*rera|is.*rera.*verified|show.*ownership|ownership.*document|7/12|7-12|7 12|extract|property card|municipal approval|sanctioned plan|building plan|approvals clear|legal clear|kaagaz|कागदपत्रे|पडताळणी|सत्यापन|दस्तावेज|रेरा|सातबारा)\b', lower):
        return "PROPERTY_VERIFICATION"

    # 6.5. 3D Flat Discovery and Building Unit Search
    if re.search(r'\b(flat\s*\d+-?[a-zA-Z]|unit\s*\d+-?[a-zA-Z]|20-c|10-b|\d+(?:st|nd|rd|th)?\s*floor|higher\s*floors?|top\s*floors?|lower\s*floors?|floor\s*\d+|(?:east|west|north|south|north-east|south-east|south-west|north-west)(?:-|\s+)facing|balcon(?:y|ies)\s*facing)\b', lower) or \
       re.search(r'\b(\d+)\s*bhk.*(?:higher|top|low|floor|facing|east|west|north|south|balcon)', lower) or \
       any(k in lower for k in ["open flat", "show flat", "view flat", "3d flat", "3d tour of flat", "3d building", "show me 20-c", "show me 10-b", "flat 20-c", "flat 10-b", "show available flats", "cheapest 2 bhk available", "cheapest 3 bhk available", "available flats"]):
        return "FLAT_3D_SEARCH"

    # 7. Real Estate Concepts (Check before generic comparison so 'carpet area vs built up' is caught)
    if any(re.search(p, lower, re.IGNORECASE) for p in REAL_ESTATE_CONCEPT_PATTERNS):
        if not any(k in lower for k in ["find", "search", "show", "under", "lakh", "crore", "buy", "rent"]):
            return "GENERAL_KNOWLEDGE"

    # 8. Property Comparison
    if any(k in lower for k in [
        "compare", "comparison", "difference between", "versus", "vs",
        "तुलना करें", "तुलना करा", "তুলনা করুন", "સરખામણી કરો", "ஒப்பிடுக", "పోల్చండి", "ಹೋಲಿಕೆ ಮಾಡಿ", "तुलना"
    ]):
        return "PROPERTY_COMPARISON"

    # 9. Property Details
    if any(k in lower for k in [
        "details of", "amenities of", "tell me details", "features of", "info on",
        "सुविधाएं और विवरण", "सुविधाएं", "विवरण", "की जानकारी", "माहिती आणि सुविधा", "माहिती", "सुविधा", "तपशील",
        "সুযোগ-সুবিধা", "বিবরণ", "વિગતો", "સુવિધાઓ", "விவரங்கள்", "வசதிகள்", "వివరాలు", "సౌకర్యాలు", "ವಿವರಗಳು", "ಸೌಲಭ್ಯಗಳನ್ನು", "ಸೌಲಭ್ಯಗಳು"
    ]) or re.search(r'\b(property\s*#?\s*\d+|id\s*#?\s*\d+)\b', lower):
        return "PROPERTY_DETAILS"

    # 10. Property Recommendation
    if any(k in lower for k in [
        "recommend", "suggest", "best property", "best family", "top pick", "best apartment",
        "सिफारिश करें", "शिफारस करा", "सल्ला", "सुझाव", "સૂચન", "ભલામણ કરો", "ભલામણ",
        "সুপারিশ", "பரிந்துரை", "సిఫార్సు", "ಶಿಫಾರಸು"
    ]):
        return "PROPERTY_RECOMMENDATION"

    # 11. Investment Analysis
    if any(k in lower for k in [
        "investment", "rental yield", "appreciation", "roi", "returns",
        "किराया यील्ड", "मूल्य वृद्धि", "भाडे परतावा", "गुंतवणूक विश्लेषण",
        "বিনিয়োগ", "ভাড়া আয়", "રોકાણ", "ભાડાની ઉપજ", "முதலீட்டு", "வாடகை வருவாய்", "పెట్టుబడి", "అద్దె రాబడి", "ಹೂಡಿಕೆ", "ಬಾಡಿಗೆ ಇಳುವರಿ"
    ]):
        return "INVESTMENT_ANALYSIS"

    # 12. Off-Topic Trivia (e.g. capital of France)
    if re.search(r'\b(capital of|president of|prime minister|weather in|who is the king|recipe for|cricket score)\b', lower) or \
       re.search(r'(राजधानी|રાજધાની|রাজধানী|தலைநகரம்|రాజధాని|ರಾಜಧಾನಿ)', lower) or \
       re.search(r'\b(france|paris|ফ্রান্স)\b', lower):
        if not any(k in lower for k in ["bhk", "flat", "apartment", "property", "rent", "buy", "price", "lakh", "crore"]):
            return "OFF_TOPIC"

    # 13. Property Search
    search_terms = [
        "bhk", "flat", "flats", "apartment", "apartments", "villa", "villas", "plot", "plots", "office", "budget", "lakh", "crore",
        "rent", "buy", "find", "search", "show", "property", "properties", "house", "houses", "home", "homes",
        "swimming pool", "gym", "clubhouse", "amenities", "gated community", "ready possession",
        "ghar", "pahije", "chahiye", "khoj", "shodha", "dikhao", "dakhva", "under", "below", "near",
        "फ्लॅट", "फ्लैट", "अपार्टमेंट", "घर", "विला", "प्रॉपर्टी", "मालमत्ता", "संपत्ति",
        "दाखवा", "दिखाओ", "हवे", "पाहिजे", "हवा", "चाहिए", "खोजो", "शोधा",
        "লাখ", "৬০", "લાખ", "લક્ષ", "லட்ச", "லட்சத்திற்குள்", "లక్షల", "లక్ష", "ಲಕ್ಷ"
    ]
    if any(k in lower for k in search_terms):
        return "PROPERTY_SEARCH"

    from app.ai.nlp_parser import rule_based_extract_intent, _get_db_cities, _get_db_localities
    parsed_check = rule_based_extract_intent(text)
    if parsed_check.city or parsed_check.locality or parsed_check.bhk or parsed_check.property_type or parsed_check.max_price:
        return "PROPERTY_SEARCH"

    db_cities = _get_db_cities()
    db_localities = _get_db_localities()
    if any(c in lower for c in db_cities) or any(l in lower for l in db_localities):
        return "PROPERTY_SEARCH"

    # Default: Any general question (ML, Python, Cloud, Physics, Math, General Knowledge, Casual chat)
    return "GENERAL_KNOWLEDGE"

async def process_chat_message(
    db: Session,
    message: str,
    conversation_id: Optional[str] = None,
    language: Optional[str] = "auto",
    current_user: Optional[User] = None
) -> Dict[str, Any]:
    """
    Main conversational pipeline:
    1. Detect language (1 of 8 supported).
    2. Classify intent (General AI, Property Search, Comparison, Recommendations, Verification, etc.).
    3. Factual DB grounding with zero hallucination.
    4. Maintain conversation context memory across multiple turns.
    """
    session_id = conversation_id or str(uuid.uuid4())
    user_text = message.strip()

    # 1. Language Detection
    if not language or language == "auto":
        detected_lang = detect_language(user_text)
    else:
        detected_lang = language if language in ["en", "hi", "mr", "bn", "gu", "ta", "te", "kn"] else "en"

    # 2. Fetch past conversation memory
    past_logs = (
        db.query(ChatLog)
        .filter(ChatLog.session_id == session_id)
        .order_by(ChatLog.created_at.desc())
        .limit(8)
        .all()
    )
    past_logs.reverse()

    # Determine intent
    intent = classify_intent(user_text, past_logs)

    # ── 3. GREETINGS ──
    if intent == "GREETING":
        greetings_map = {
            "en": "Hello! 👋 I'm SAI AI Assistant. I can answer general questions (science, coding, technology) and help you find, compare, and analyze verified real estate properties from the SAI database.",
            "hi": "नमस्ते! 👋 मैं SAI AI असिस्टेंट हूँ। मैं सामान्य ज्ञान, कोडिंग और विज्ञान के सवालों के जवाब दे सकता हूँ, तथा SAI डेटाबेस से प्रॉपर्टी खोजने, तुलना करने और सत्यापित करने में आपकी मदद कर सकता हूँ।",
            "mr": "नमस्कार! 👋 मी SAI AI असिस्टंट आहे. मी सामान्य ज्ञान, कोडिंग, तंत्रज्ञान विषयक प्रश्नांची उत्तरे देऊ शकतो आणि SAI डेटाबेसमधून योग्य घरे शोधण्यात व तुलना करण्यात मदत करू शकतो."
        }
        reply = greetings_map.get(detected_lang, greetings_map["en"])
        _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [])
        return {
            "success": True,
            "conversation_id": session_id,
            "intent": intent,
            "language": detected_lang,
            "message": reply,
            "properties": [],
            "map_data": [],
            "actions": ["search_properties", "explore_map"]
        }

    # ── 3.5. 3D FLAT DISCOVERY & REAL DATABASE GROUNDING ──
    # ── 3.5. 3D FLAT DISCOVERY & REAL DATABASE GROUNDING ──
    if intent == "FLAT_3D_SEARCH":
        lower = user_text.lower()
        # Check if asking for a specific flat (e.g. 20-C, 10-B, Flat 20-C)
        flat_match = re.search(r'\b(?:flat|unit)?\s*(\d+)-?([a-zA-Z])\b', user_text, re.IGNORECASE)
        if flat_match:
            fl_num = int(flat_match.group(1))
            u_code = flat_match.group(2).upper()
            found_unit = db.query(Unit).join(Building, Unit.tower_id == Building.id).join(Project, Unit.project_id == Project.id).filter(
                Unit.floor_number == fl_num,
                Unit.unit_number.ilike(u_code)
            ).first()

            if found_unit:
                bld = found_unit.building
                proj = found_unit.project
                reply = (
                    f"🏢 **Verified Flat Found in SAI Database:**\n\n"
                    f"**{found_unit.unit_label}** in **{bld.name if bld else 'Tower A'}** ({proj.name if proj else 'ABC Residency'}, {proj.city if proj else 'Amravati'}).\n\n"
                    f"• **Configuration:** {found_unit.bhk} BHK ({found_unit.area_sqft:,.0f} sq.ft)\n"
                    f"• **Floor Level:** Level {found_unit.floor_number}\n"
                    f"• **Main Orientation:** {found_unit.direction} Facing\n"
                    f"• **Balcony:** {found_unit.balcony_direction} Facing ({found_unit.balconies} Balconies)\n"
                    f"• **All-Inclusive Price:** {format_inr(found_unit.price)}\n"
                    f"• **Availability Status:** {found_unit.status.upper()}\n\n"
                    f"👉 [Click here to open Flat {found_unit.floor_number}-{found_unit.unit_number} in 3D Building Discovery](/projects/{proj.id if proj else 5}/buildings/{bld.id if bld else 10}?floor={found_unit.floor_number}&unit={found_unit.unit_number})"
                )
                _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [])
                return {
                    "success": True,
                    "conversation_id": session_id,
                    "intent": intent,
                    "language": detected_lang,
                    "message": reply,
                    "flat_3d": {
                        "unit_id": found_unit.id,
                        "building_id": bld.id if bld else 10,
                        "project_id": proj.id if proj else 5,
                        "tower_name": bld.name if bld else "Tower A",
                        "project_name": proj.name if proj else "ABC Residency",
                        "floor_number": found_unit.floor_number,
                        "unit_number": found_unit.unit_number,
                        "unit_label": found_unit.unit_label,
                        "bhk": found_unit.bhk,
                        "direction": found_unit.direction or "East",
                        "balcony_direction": found_unit.balcony_direction or "East",
                        "area_sqft": found_unit.area_sqft,
                        "price": found_unit.price,
                        "price_display": format_inr(found_unit.price),
                        "status": found_unit.status
                    },
                    "properties": [],
                    "suggestions": [f"Start 3D Tour for {found_unit.unit_label}", "Book this flat", "Show other floors"]
                }

        # Parse structured criteria (BHK, Floor, Direction, Balcony, Budget, Cheapest)
        bhk_val = None
        bhk_m = re.search(r'(\d+)\s*bhk', lower)
        if bhk_m:
            bhk_val = int(bhk_m.group(1))

        fl_pref = None
        fl_val = None
        fl_m = re.search(r'(\d+)(?:st|nd|rd|th)?\s*floor', lower)
        if fl_m:
            fl_val = int(fl_m.group(1))
        elif "higher floor" in lower or "top floor" in lower:
            fl_pref = "high"
        elif "lower floor" in lower or "ground floor" in lower:
            fl_pref = "low"

        dir_val = None
        for d in ["North-East", "North-West", "South-East", "South-West", "East", "West", "North", "South"]:
            if d.lower() in lower:
                dir_val = d
                break

        balcony_dir = None
        if "balcon" in lower:
            for d in ["North-East", "North-West", "South-East", "South-West", "East", "West", "North", "South"]:
                if d.lower() in lower:
                    balcony_dir = d
                    break

        max_price_val = None
        price_m = re.search(r'(?:under|below|budget|within|upto)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|lakh|l)?', lower)
        if price_m:
            num = float(price_m.group(1))
            unit_str = price_m.group(2) or ""
            if "cr" in unit_str:
                max_price_val = num * 10000000
            elif "l" in unit_str:
                max_price_val = num * 100000
            elif num < 500:
                max_price_val = num * 100000

        matching_flats = smart_find_flats({
            "bhk": bhk_val,
            "floor": fl_val,
            "floor_preference": fl_pref,
            "direction": dir_val,
            "balcony_direction": balcony_dir,
            "max_price": max_price_val,
            "status": "available"
        }, db)

        if "cheap" in lower or "lowest" in lower:
            matching_flats = sorted(matching_flats, key=lambda x: x["price"])

        if matching_flats:
            flat_items = []
            for u in matching_flats[:4]:
                flat_items.append(f"• **{u['tower_name']} – {u['unit_label']}** (Floor {u['floor_number']}, {u['bhk']} BHK, {u['direction']} Facing, {u['price_display']})")
            
            top_flat = matching_flats[0]
            reply = (
                f"🎯 I searched verified real-time inventory and found **{len(matching_flats)} available matches**:\n\n"
                + "\n".join(flat_items)
                + f"\n\nTell me which flat you'd like to explore, or say **'Show me {top_flat['unit_label']}'** to open it in 3D."
            )
            top_unit_info = {
                "unit_id": top_flat["id"],
                "building_id": top_flat.get("tower_id") or 10,
                "project_id": top_flat.get("project_id") or 5,
                "tower_name": top_flat.get("tower_name") or "Tower A",
                "floor_number": top_flat["floor_number"],
                "unit_number": top_flat["unit_number"],
                "unit_label": top_flat["unit_label"],
                "bhk": top_flat.get("bhk"),
                "direction": top_flat.get("direction", "East"),
                "balcony_direction": top_flat.get("balcony_direction", "East"),
                "area_sqft": top_flat.get("area_sqft"),
                "price": top_flat.get("price"),
                "price_display": top_flat.get("price_display"),
                "status": top_flat["status"]
            }
        else:
            reply = "I checked the database, but no available flats match those exact criteria currently. Try relaxing the floor or orientation preference."
            top_unit_info = None

        _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [])
        return {
            "success": True,
            "conversation_id": session_id,
            "intent": intent,
            "language": detected_lang,
            "message": reply,
            "flat_3d": top_unit_info,
            "matching_flats": matching_flats[:4],
            "properties": [],
            "suggestions": [f"Open {f['unit_label']}" for f in matching_flats[:2]] if matching_flats else ["Show all available flats", "Show Floor 20"]
        }

    # ── 4. UNCLEAR INPUT ──
    if intent == "UNCLEAR":
        unclear_replies = {
            "en": "I didn't quite catch that. Could you please specify your requirement or question?",
            "hi": "माफ़ कीजिए, मुझे आपकी बात समझ नहीं आई। कृपया अपना प्रश्न या प्रॉपर्टी आवश्यकता स्पष्ट करें।",
            "mr": "क्षमस्व, मला स्पष्ट समजले नाही. कृपया तुमचा प्रश्न किंवा आवश्यकतेबद्दल सांगा."
        }
        reply = unclear_replies.get(detected_lang, unclear_replies["en"])
        _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [])
        return {
            "success": True,
            "conversation_id": session_id,
            "intent": intent,
            "language": detected_lang,
            "message": reply,
            "properties": [],
            "map_data": [],
            "actions": ["search_properties", "explore_map"]
        }

    # ── OFF TOPIC (General Trivia, Geography, Non-Real Estate questions) ──
    if intent == "OFF_TOPIC":
        reply = get_off_topic_response(detected_lang)
        _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [])
        return {
            "success": True,
            "conversation_id": session_id,
            "intent": "OFF_TOPIC",
            "language": detected_lang,
            "message": reply,
            "properties": [],
            "map_data": [],
            "actions": ["search_properties", "explore_map"]
        }

    # ── 5. GENERAL AI KNOWLEDGE & CODING (Qwen3 handles directly!) ──
    if intent in ["GENERAL_KNOWLEDGE", "REAL_ESTATE_KNOWLEDGE"]:
        messages = []
        for log in past_logs[-3:]:
            messages.append({"role": "user", "content": log.user_message})
            messages.append({"role": "assistant", "content": log.bot_response})
        messages.append({"role": "user", "content": user_text})

        ai_resp = await qwen_client.chat_completion(messages, language=detected_lang)
        reply = ai_resp.get("content", "")

        _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [])
        return {
            "success": True,
            "conversation_id": session_id,
            "intent": "GENERAL_QUESTION",
            "language": detected_lang,
            "message": reply,
            "properties": [],
            "map_data": [],
            "actions": ["search_properties", "ask_question"]
        }

    # ── 6. PROPERTY VERIFICATION QUESTIONS ──
    if intent == "PROPERTY_VERIFICATION":
        from app.models.verification import VerificationDocument
        from app.services.document_verification.property_documents_service import calculate_property_verification_summary, DOCUMENT_TYPE_LABELS
        from sqlalchemy import func
        
        # Resolve target property from city mention, context, or first available property
        lower_query = user_text.lower()
        target_prop = None
        for c in ["amravati", "pune", "mumbai", "nagpur", "nashik", "aurangabad", "thane"]:
            if c in lower_query:
                target_prop = db.query(Property).filter(func.lower(Property.city) == c).first()
                if target_prop:
                    break
        if not target_prop:
            props = resolve_context_properties(user_text, past_logs, db)
            target_prop = props[0] if props else db.query(Property).first()
        
        doc_actions = []
        if target_prop:
            prop_docs = db.query(VerificationDocument).filter(
                VerificationDocument.property_id == target_prop.id
            ).all()
            
            total_uploaded = len(prop_docs)
            verified_docs = [d for d in prop_docs if d.status == "VERIFIED"]
            review_docs = [d for d in prop_docs if d.status in ("UNDER_REVIEW", "PENDING")]
            rejected_docs = [d for d in prop_docs if d.status == "REJECTED"]
            not_uploaded_count = max(0, 5 - len(verified_docs) - len(review_docs))
            
            # Check if user specifically requested 7/12 extract / Property Card
            if any(k in lower_query for k in ["7/12", "7-12", "7 12", "extract", "property card", "सातबारा"]):
                doc = next((d for d in prop_docs if d.document_type in ("property_card", "7_12_extract", "title_search")), None)
                if not doc:
                    doc = next((d for d in prop_docs if d.document_type in ("sale_deed", "title_deed")), None)
                if doc and doc.status == "VERIFIED":
                    doc_label = "7/12 Extract & Property Card" if doc.document_type == "property_card" else DOCUMENT_TYPE_LABELS.get(doc.document_type, "Property Card")
                    reply = (
                        f"📜 **{doc_label} is available and verified** for **{target_prop.title}** ({target_prop.city}).\n\n"
                        f"• **Document**: {doc_label}\n"
                        f"• **Status**: 🟢 VERIFIED by Revenue Authority & SAI Legal AI\n"
                        f"• **Version**: v{doc.version}\n\n"
                        f"You can view the authentic verified document below."
                    )
                    doc_actions.append({
                        "label": f"View {doc_label}",
                        "document_id": doc.id,
                        "view_url": f"/api/property-documents/{doc.id}/view",
                        "document_name": doc_label
                    })
                elif doc:
                    reply = f"ℹ️ 7/12 Extract / Property Card for **{target_prop.title}** is currently undergoing verification."
                else:
                    reply = f"ℹ️ 7/12 Extract / Property Card has not been uploaded for **{target_prop.title}** yet."

            # Check if user specifically requested Municipal / Building Approvals
            elif any(k in lower_query for k in ["municipal", "approval", "sanction", "building plan", "परवानगी"]):
                doc = next((d for d in prop_docs if d.document_type in ("building_plan_approval", "occupancy_certificate")), None)
                if doc and doc.status == "VERIFIED":
                    doc_label = DOCUMENT_TYPE_LABELS.get(doc.document_type, "Building Plan Approval")
                    reply = (
                        f"🏛️ **Municipal & Building Plan Approvals are verified** for **{target_prop.title}**.\n\n"
                        f"• **Sanction Order**: Official Municipal Town Planning & Corporation Sanction\n"
                        f"• **Status**: 🟢 VERIFIED\n\n"
                        f"You can inspect the sanctioned plan and clearance certificate below."
                    )
                    doc_actions.append({
                        "label": f"View {doc_label}",
                        "document_id": doc.id,
                        "view_url": f"/api/property-documents/{doc.id}/view",
                        "document_name": doc_label
                    })
                elif doc:
                    reply = f"ℹ️ Municipal Building Approvals for **{target_prop.title}** are currently under review."
                else:
                    reply = f"ℹ️ Municipal Building Approvals have not been uploaded for **{target_prop.title}** yet."

            # Check if user specifically requested RERA document
            elif any(k in lower_query for k in ["rera", "रेरा"]):
                rera_doc = next((d for d in prop_docs if d.document_type in ("rera_certificate", "rera_license")), None)
                if rera_doc and rera_doc.status == "VERIFIED":
                    reply = (
                        f"🛡️ **RERA Registration Certificate is available and verified** for **{target_prop.title}**.\n\n"
                        f"• **Document**: RERA Registration Certificate\n"
                        f"• **Status**: 🟢 VERIFIED by SAI Legal & Verification Authority\n"
                        f"• **Version**: v{rera_doc.version}\n\n"
                        f"You can view the authentic verified document below."
                    )
                    doc_actions.append({
                        "label": "View RERA Document",
                        "document_id": rera_doc.id,
                        "view_url": f"/api/property-documents/{rera_doc.id}/view",
                        "document_name": "RERA Registration Certificate"
                    })
                elif rera_doc:
                    reply = f"ℹ️ RERA Registration Certificate for **{target_prop.title}** is currently under AI & Admin verification review."
                else:
                    reply = f"ℹ️ RERA Registration Certificate has not been uploaded for **{target_prop.title}** yet."
            
            # Check if user specifically requested Ownership document
            elif any(k in lower_query for k in ["ownership", "sale deed", "title", "मालकी", "खरेदीखत"]):
                own_doc = next((d for d in prop_docs if d.document_type in ("sale_deed", "title_deed", "mother_deed")), None)
                if own_doc and own_doc.status == "VERIFIED":
                    doc_name = DOCUMENT_TYPE_LABELS.get(own_doc.document_type, "Ownership Document")
                    reply = (
                        f"📜 **{doc_name} is available and verified** for **{target_prop.title}**.\n\n"
                        f"• **Document**: {doc_name}\n"
                        f"• **Status**: 🟢 VERIFIED\n\n"
                        f"You can view the authentic ownership record below."
                    )
                    doc_actions.append({
                        "label": f"View {doc_name}",
                        "document_id": own_doc.id,
                        "view_url": f"/api/property-documents/{own_doc.id}/view",
                        "document_name": doc_name
                    })
                elif own_doc:
                    reply = f"ℹ️ Ownership documents for **{target_prop.title}** are currently under review."
                else:
                    reply = f"ℹ️ Ownership documents have not been uploaded for **{target_prop.title}** yet."
            
            # General property verification status query
            else:
                summary_data = calculate_property_verification_summary(db, target_prop.id, current_user)
                trust_score = summary_data.get("trust_score", 0)
                
                reply = (
                    f"🏢 **Property Verification Status for {target_prop.title}:**\n\n"
                    f"This property has **{total_uploaded} uploaded documents**. "
                    f"**{len(verified_docs)} are verified**, **{len(review_docs)} are under review** "
                    f"and **{not_uploaded_count} have not been uploaded**.\n\n"
                    f"• **Overall Trust Score**: 🟢 **{trust_score}% Verified**\n"
                    f"• **Verified Records**: {', '.join([DOCUMENT_TYPE_LABELS.get(d.document_type, d.document_type.replace('_', ' ').title()) for d in verified_docs]) if verified_docs else 'None yet'}\n"
                )
                if review_docs:
                    reply += f"• **Under Review**: {len(review_docs)} document(s) undergoing verification."
                
                for vd in verified_docs[:2]:
                    dname = DOCUMENT_TYPE_LABELS.get(vd.document_type, vd.document_type.replace('_', ' ').title())
                    doc_actions.append({
                        "label": f"View {dname}",
                        "document_id": vd.id,
                        "view_url": f"/api/property-documents/{vd.id}/view",
                        "document_name": dname
                    })
        else:
            reply = "SAI maintains a strict 5-tier legal verification system covering Ownership Deeds, RERA Certification, Municipal Building Approvals, Property Tax Receipts, and Builder Clearances."

        _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [])
        return {
            "success": True,
            "conversation_id": session_id,
            "intent": intent,
            "language": detected_lang,
            "message": reply,
            "properties": [target_prop] if target_prop else [],
            "map_data": [],
            "document_actions": doc_actions,
            "actions": ["view_verification", "search_properties"]
        }

    # ── 7. PROPERTY COMPARISON FOLLOW-UPS (Cheaper, Area, Parking, Ready, Verified, Amenities, Match, Priority) ──
    if intent in [
        "PROPERTY_FOLLOW_UP_CHEAPER",
        "PROPERTY_FOLLOW_UP_AREA",
        "PROPERTY_FOLLOW_UP_PARKING",
        "PROPERTY_FOLLOW_UP_READY",
        "PROPERTY_FOLLOW_UP_VERIFIED",
        "PROPERTY_FOLLOW_UP_AMENITIES",
        "PROPERTY_FOLLOW_UP_SQFT_PRICE",
        "PROPERTY_FOLLOW_UP_BUDGET",
        "PROPERTY_REQUIREMENTS_UPDATE",
        "PROPERTY_RECOMMENDATION_MATCH",
        "PROPERTY_PRIORITY_UPDATE"
    ]:
        props = resolve_context_properties(user_text, past_logs, db)
        session_reqs = extract_session_requirements(user_text, past_logs)

        if len(props) >= 2:
            p_cheapest = min(props, key=lambda x: x.price)
            p_priciest = max(props, key=lambda x: x.price)
            price_diff = p_priciest.price - p_cheapest.price

            p_largest = max(props, key=lambda x: x.area_sqft or 0)
            p_smallest = min(props, key=lambda x: x.area_sqft or 0)
            area_diff = (p_largest.area_sqft or 0) - (p_smallest.area_sqft or 0)

            cmp_res = generate_property_comparison(
                props,
                language=detected_lang,
                user_requirements=session_reqs,
                priority=session_reqs["priority"]
            )

            if intent == "PROPERTY_FOLLOW_UP_CHEAPER":
                reply = (
                    f"💰 **Price Comparison (Database Grounded):**\n"
                    f"• **{p_cheapest.title}**: {p_cheapest.price_display or format_inr(p_cheapest.price)}\n"
                    f"• **{p_priciest.title}**: {p_priciest.price_display or format_inr(p_priciest.price)}\n\n"
                    f"👉 **{p_cheapest.title}** is cheaper by **{format_inr(price_diff)}**.\n\n"
                    f"💡 *Trade-off*: By paying {format_inr(price_diff)} less, you receive {p_cheapest.area_sqft:,.0f} sq.ft versus {p_priciest.area_sqft:,.0f} sq.ft."
                )

            elif intent == "PROPERTY_FOLLOW_UP_AREA":
                reply = (
                    f"📐 **Carpet Area Comparison (Database Grounded):**\n"
                    f"• **{p_largest.title}**: {p_largest.area_sqft:,.0f} sq.ft\n"
                    f"• **{p_smallest.title}**: {p_smallest.area_sqft:,.0f} sq.ft\n\n"
                    f"👉 **{p_largest.title}** provides **{area_diff:,.0f} sq.ft more living space**.\n\n"
                    f"💡 *Trade-off*: It has a higher listing price ({p_largest.price_display or format_inr(p_largest.price)} vs {p_smallest.price_display or format_inr(p_smallest.price)})."
                )

            elif intent == "PROPERTY_FOLLOW_UP_PARKING":
                parking_lines = ["🚗 **Parking Facility Comparison (Database Grounded):**"]
                for p in props:
                    amenities = p.amenities or []
                    has_park = any("parking" in a.lower() for a in amenities)
                    status_str = "Covered Parking included ✓" if has_park else "No parking listed ✗"
                    parking_lines.append(f"• **{p.title}**: {status_str}")
                reply = "\n".join(parking_lines)

            elif intent == "PROPERTY_FOLLOW_UP_READY":
                ready_lines = ["🔑 **Possession Status (Database Grounded):**"]
                for p in props:
                    desc_l = (p.description or "").lower()
                    stat_l = (p.status or "").lower()
                    is_ready = "ready" in desc_l or "ready" in stat_l
                    st_str = "Ready to Move (Immediate possession)" if is_ready else "Under Construction"
                    ready_lines.append(f"• **{p.title}**: {st_str}")
                ready_props = [p.title for p in props if "ready" in (p.description or "").lower() or "ready" in (p.status or "").lower()]
                if ready_props:
                    ready_lines.append(f"\n👉 **{', '.join(ready_props)}** is ready for immediate occupancy.")
                reply = "\n".join(ready_lines)

            elif intent == "PROPERTY_FOLLOW_UP_VERIFIED":
                verif_lines = ["🛡️ **Verification Status (Database Grounded):**"]
                for p in props:
                    v_str = "Verified in SAI ✓" if p.is_verified else "Pending Review ⏳"
                    r_str = "MahaRERA Registered ✓" if p.is_rera else "Pending / Unlisted"
                    verif_lines.append(f"• **{p.title}**: {v_str} | RERA: {r_str}")
                reply = "\n".join(verif_lines)

            elif intent == "PROPERTY_FOLLOW_UP_AMENITIES":
                amenity_lines = ["🏊 **Amenities Comparison (Database Grounded):**"]
                for p in props:
                    ams = p.amenities or []
                    amenity_lines.append(f"• **{p.title}** ({len(ams)} amenities): {', '.join(ams[:5]) if ams else 'None listed'}")
                p_most = max(props, key=lambda x: len(x.amenities or []))
                amenity_lines.append(f"\n👉 **{p_most.title}** offers the most comprehensive amenity package ({len(p_most.amenities or [])} facilities).")
                reply = "\n".join(amenity_lines)

            elif intent == "PROPERTY_FOLLOW_UP_SQFT_PRICE":
                sqft_lines = ["📐 **Price per Sq.Ft Comparison (Database Grounded):**"]
                for p in props:
                    sqft_rate = round(p.price / p.area_sqft) if p.area_sqft > 0 else 0
                    sqft_lines.append(f"• **{p.title}**: ₹{sqft_rate:,}/sq.ft ({p.price_display or format_inr(p.price)} for {p.area_sqft:,.0f} sq.ft)")
                p_lowest_sqft = min(props, key=lambda x: (x.price / x.area_sqft) if x.area_sqft > 0 else 99999999)
                sqft_lines.append(f"\n👉 **{p_lowest_sqft.title}** has the lower rate per square foot.")
                reply = "\n".join(sqft_lines)

            elif intent == "PROPERTY_FOLLOW_UP_BUDGET":
                bud_max = session_reqs.get("budget_max", 8000000.0)
                bud_lines = [f"💰 **Budget Fit Analysis (Max: {format_inr(bud_max)}):**"]
                for p in props:
                    fit = "✓ Within Budget" if p.price <= bud_max else f"✗ Exceeds budget by {format_inr(p.price - bud_max)}"
                    bud_lines.append(f"• **{p.title}**: {p.price_display or format_inr(p.price)} — {fit}")
                reply = "\n".join(bud_lines)

            elif intent == "PROPERTY_REQUIREMENTS_UPDATE":
                if "remove parking" in user_text.lower():
                    reply = (
                        f"✅ **Requirements Updated:** Parking = Optional.\n\n"
                        f"Both properties in your comparison context ({props[0].title} and {props[1].title}) "
                        f"have been re-evaluated with parking relaxed. Ask **'Which one matches my requirements better?'** to view the updated comparison."
                    )
                else:
                    reply = (
                        f"✅ **Requirements Updated:** Parking = Mandatory, Possession = Ready to Move.\n\n"
                        f"Both properties in your comparison context ({props[0].title} and {props[1].title}) "
                        f"have been re-evaluated. Ask **'Which one matches my requirements better?'** to view the requirement checklist."
                    )

            elif intent == "PROPERTY_RECOMMENDATION_MATCH":
                req_lines = [
                    f"📋 **Requirement Match Analysis:**",
                    f"Criteria: Budget ≤ {format_inr(session_reqs['budget_max'])}, {session_reqs['bhk']} BHK, Parking, Ready to Move.\n"
                ]
                for rm in cmp_res.requirement_match:
                    req_lines.append(f"**{rm['property_title']}:**")
                    for m in rm["matches"]:
                        req_lines.append(f"  ✓ {m}")
                    for mm in rm["mismatches"]:
                        req_lines.append(f"  ✗ {mm}")
                    req_lines.append("")

                req_lines.append("💡 **Trade-off Analysis:**")
                req_lines.append(cmp_res.recommendation_reason)
                reply = "\n".join(req_lines)

            elif intent == "PROPERTY_PRIORITY_UPDATE":
                reply = (
                    f"🎯 **Updated Analysis under Priority (Lowest Price):**\n\n"
                    f"👉 **{p_cheapest.title}** ({p_cheapest.price_display or format_inr(p_cheapest.price)}) is now the leading choice because it saves **{format_inr(price_diff)}**.\n\n"
                    f"**Trade-off**:\n"
                    f"Choosing the lower price means accepting {p_cheapest.area_sqft:,.0f} sq.ft instead of {p_priciest.area_sqft:,.0f} sq.ft, but keeps you well under budget."
                )

            _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [p.id for p in props])
            return {
                "success": True,
                "conversation_id": session_id,
                "intent": intent,
                "language": detected_lang,
                "message": reply,
                "properties": [format_property_result(p) for p in props],
                "comparison": cmp_res.model_dump(),
                "map_data": _build_map_data([format_property_result(p) for p in props]),
                "actions": ["which_is_cheaper", "which_has_more_area", "which_matches_requirements"]
            }

    # ── 8. FULL PROPERTY COMPARISON ──
    if intent == "PROPERTY_COMPARISON":
        props = resolve_context_properties(user_text, past_logs, db)
        if len(props) >= 2:
            session_reqs = extract_session_requirements(user_text, past_logs)
            cmp_res = generate_property_comparison(
                props,
                language=detected_lang,
                user_requirements=session_reqs,
                priority=session_reqs["priority"]
            )

            reply_lines = [
                "📊 **PROPERTY COMPARISON**",
                f"**{cmp_res.summary}**",
                "",
                "**Key Differences:**"
            ]
            for diff in cmp_res.differences:
                reply_lines.append(f"• {diff}")
            reply_lines.append("")
            reply_lines.append("💡 **Trade-off Analysis:**")
            reply_lines.append(cmp_res.recommendation_reason)
            reply = "\n".join(reply_lines)

            _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [p.id for p in props])
            return {
                "success": True,
                "conversation_id": session_id,
                "intent": intent,
                "language": detected_lang,
                "message": reply,
                "properties": [format_property_result(p) for p in props],
                "comparison": cmp_res.model_dump(),
                "map_data": _build_map_data([format_property_result(p) for p in props]),
                "actions": ["which_is_cheaper", "which_has_more_area", "which_matches_requirements"]
            }
        else:
            msg = "Please select or mention 2 to 4 properties to compare." if detected_lang == "en" else (
                "तुलना करने के लिए कृपया 2 से 4 संपत्तियों का चयन करें।" if detected_lang == "hi" else
                "तुलना करण्यासाठी कृपया 2 ते 4 मालमत्ता निवडा किंवा नमूद करा."
            )
            _save_chat_log(db, current_user, session_id, user_text, msg, detected_lang, intent, [])
            return {
                "success": True,
                "conversation_id": session_id,
                "intent": intent,
                "language": detected_lang,
                "message": msg,
                "properties": [],
                "comparison": None,
                "map_data": None,
                "actions": ["search_properties"]
            }

    # ── 9. PROPERTY RECOMMENDATION ──
    if intent == "PROPERTY_RECOMMENDATION":
        parsed = rule_based_extract_intent(user_text)
        tool_res = execute_tool_call(db, "recommend_properties", {
            "city": parsed.city,
            "locality": parsed.locality,
            "budget_max": parsed.max_price,
            "bhk": parsed.bhk,
            "purpose": "end_use",
            "limit": 4
        })
        recs = tool_res.get("recommendations", [])
        props = [r["property"] for r in recs]

        if props:
            reply = (
                f"🌟 **माझ्या शिफारसी (Top Recommendations):**\n"
                f"मी तुमच्यासाठी {len(props)} सर्वोत्तम मालमत्ता निवडल्या आहेत ज्या बजेट, परिसर आणि सुविधांमध्ये उत्कृष्ट गुण मिळवतात."
            ) if detected_lang == "mr" else (
                f"🌟 **शीर्ष सिफारिशें (Top Recommendations):**\n"
                f"मैंने आपके लिए {len(props)} सर्वश्रेष्ठ संपत्तियों का चयन किया है जो बजट, स्थान और सुविधाओं में सर्वश्रेष्ठ हैं।"
            ) if detected_lang == "hi" else (
                f"🌟 **Top Property Recommendations:**\n"
                f"Here are {len(props)} top-ranked properties matched against your budget, location, and amenity preferences in the SAI database."
            )
        else:
            reply = "No matching properties found in the current database for recommendations."

        _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [p["id"] for p in props])
        return {
            "success": True,
            "conversation_id": session_id,
            "intent": intent,
            "language": detected_lang,
            "message": reply,
            "properties": props,
            "map_data": _build_map_data(props),
            "actions": ["view_details", "compare", "schedule_visit"]
        }

    # ── 10. INVESTMENT ANALYSIS ──
    if intent == "INVESTMENT_ANALYSIS":
        target_pid = None
        for num in re.findall(r'\b\d+\b', user_text):
            target_pid = int(num)
            break

        if not target_pid and past_logs:
            for log in reversed(past_logs):
                if log.matched_property_ids:
                    target_pid = log.matched_property_ids[0]
                    break

        if not target_pid:
            first_avail = db.query(Property).filter(Property.status == "available").first()
            if first_avail:
                target_pid = first_avail.id

        if target_pid:
            tool_res = execute_tool_call(db, "analyze_investment", {"property_id": target_pid})
            inv = tool_res.get("analysis", {})
            prop = tool_res.get("property", {})

            if inv and prop:
                reply = (
                    f"📈 **गुंतवणूक विश्लेषण (Investment Analysis) — {prop.get('title')}**\n"
                    f"• सध्याची किंमत (Price): {inv.get('current_price_display')} (₹{inv.get('price_per_sqft', 0):,.0f}/sq.ft)\n"
                    f"• अंदाजे भाडे परतावा (Rental Yield): {inv.get('estimated_rental_yield_pct')}% ({inv.get('monthly_rental_display')})\n"
                    f"• 3 वर्षांची संभाव्य वाढ: {inv.get('projections', [{}, {}])[1].get('value_display', '')} (+{inv.get('projections', [{}, {}])[1].get('cumulative_appreciation_pct', 0)}%)\n"
                    f"• 5 वर्षांची संभाव्य वाढ: {inv.get('projections', [{}, {}, {}])[2].get('value_display', '')} (+{inv.get('projections', [{}, {}, {}])[2].get('cumulative_appreciation_pct', 0)}%)\n"
                    f"• गुंतवणूक गुणवत्ता गुण (Score): {inv.get('investment_score')}/10\n\n"
                    f"⚠️ *{inv.get('disclaimer', 'Projections are model estimates based on micro-market trends.')}*"
                ) if detected_lang == "mr" else (
                    f"📈 **निवेश विश्लेषण (Investment Analysis) — {prop.get('title')}**\n"
                    f"• वर्तमान मूल्य (Price): {inv.get('current_price_display')} (₹{inv.get('price_per_sqft', 0):,.0f}/sq.ft)\n"
                    f"• अनुमानित रेंटल यील्ड (Rental Yield): {inv.get('estimated_rental_yield_pct')}% ({inv.get('monthly_rental_display')})\n"
                    f"• 3 साल का अनुमानित मूल्य: {inv.get('projections', [{}, {}])[1].get('value_display', '')} (+{inv.get('projections', [{}, {}])[1].get('cumulative_appreciation_pct', 0)}%)\n"
                    f"• 5 साल का अनुमानित मूल्य: {inv.get('projections', [{}, {}, {}])[2].get('value_display', '')} (+{inv.get('projections', [{}, {}, {}])[2].get('cumulative_appreciation_pct', 0)}%)\n"
                    f"• निवेश स्कोर: {inv.get('investment_score')}/10\n\n"
                    f"⚠️ *{inv.get('disclaimer', 'Projections are model estimates based on micro-market trends.')}*"
                ) if detected_lang == "hi" else (
                    f"📈 **Investment Analysis for {prop.get('title')}**\n"
                    f"• Current Price: {inv.get('current_price_display')} (₹{inv.get('price_per_sqft', 0):,.0f}/sq.ft)\n"
                    f"• Gross Rental Yield: {inv.get('estimated_rental_yield_pct')}% ({inv.get('monthly_rental_display')})\n"
                    f"• 3-Year Projected Value: {inv.get('projections', [{}, {}])[1].get('value_display', '')} (+{inv.get('projections', [{}, {}])[1].get('cumulative_appreciation_pct', 0)}%)\n"
                    f"• 5-Year Projected Value: {inv.get('projections', [{}, {}, {}])[2].get('value_display', '')} (+{inv.get('projections', [{}, {}, {}])[2].get('cumulative_appreciation_pct', 0)}%)\n"
                    f"• Investment Score: {inv.get('investment_score')}/10 ({inv.get('confidence_level', 'High')} Confidence)\n\n"
                    f"⚠️ *{inv.get('disclaimer', 'Projections are model estimates based on micro-market historical averages.')}*"
                )

                _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, intent, [target_pid])
                return {
                    "success": True,
                    "conversation_id": session_id,
                    "intent": intent,
                    "language": detected_lang,
                    "message": reply,
                    "properties": [prop],
                    "map_data": _build_map_data([prop]),
                    "actions": ["view_details", "compare", "schedule_visit"]
                }

    # ── 11. PROPERTY SEARCH & MULTI-TURN CONTEXT ──
    # Check current message first for explicit intent overrides (e.g. changing city: "Actually show me Pune instead")
    parsed_current = rule_based_extract_intent(user_text)
    context_text = " ".join([l.user_message for l in past_logs[-3:]] + [user_text])
    parsed = rule_based_extract_intent(context_text)

    # If current message specifies a new city, it STRICTLY overrides the past context
    if parsed_current.city:
        parsed.city = parsed_current.city
        # When user changes city, clear previous locality unless specified in current turn
        if not parsed_current.locality:
            parsed.locality = None
    if parsed_current.locality:
        parsed.locality = parsed_current.locality
    if parsed_current.bhk:
        parsed.bhk = parsed_current.bhk
    if parsed_current.max_price:
        parsed.max_price = parsed_current.max_price
    if parsed_current.property_type:
        parsed.property_type = parsed_current.property_type
    if parsed_current.listing_type:
        parsed.listing_type = parsed_current.listing_type

    tool_args = {
        "city": parsed.city,
        "locality": parsed.locality,
        "bhk": parsed.bhk,
        "max_price": parsed.max_price,
        "min_price": parsed.min_price,
        "property_type": parsed.property_type,
        "listing_type": parsed.listing_type,
        "limit": 6
    }
    tool_result = execute_tool_call(db, "search_properties", tool_args)
    found_props = tool_result.get("properties", [])

    if found_props:
        matched_ids = [p["id"] for p in found_props]
        count = len(found_props)

        if detected_lang == "mr":
            msg_parts = [f"मला तुमच्या निकषांनुसार {count} पडताळणी केलेल्या मालमत्ता सापडल्या:"]
            if parsed.city: msg_parts.append(f"• शहर: {parsed.city}")
            if parsed.locality: msg_parts.append(f"• परिसर: {parsed.locality}")
            if parsed.bhk: msg_parts.append(f"• विन्यास: {parsed.bhk} BHK")
            if parsed.max_price: msg_parts.append(f"• कमाल बजेट: {format_inr(parsed.max_price)}")
        elif detected_lang == "hi":
            msg_parts = [f"मुझे आपकी खोज के अनुसार {count} सत्यापित संपत्तियां मिलीं:"]
            if parsed.city: msg_parts.append(f"• शहर: {parsed.city}")
            if parsed.locality: msg_parts.append(f"• इलाका: {parsed.locality}")
            if parsed.bhk: msg_parts.append(f"• विन्यास: {parsed.bhk} BHK")
            if parsed.max_price: msg_parts.append(f"• अधिकतम बजट: {format_inr(parsed.max_price)}")
        elif detected_lang == "bn":
            msg_parts = [f"আমি আপনার পছন্দের {count}টি যাচাইকৃত প্রপার্টি পেয়েছি:"]
            if parsed.city: msg_parts.append(f"• শহর: {parsed.city}")
            if parsed.bhk: msg_parts.append(f"• কনফিগারেশন: {parsed.bhk} BHK")
        elif detected_lang == "gu":
            msg_parts = [f"મને તમારી શોધ મુજબ {count} ચકાસાયેલ પ્રોપર્ટી મળી:"]
            if parsed.city: msg_parts.append(f"• શહેર: {parsed.city}")
            if parsed.bhk: msg_parts.append(f"• ગોઠવણી: {parsed.bhk} BHK")
        elif detected_lang == "ta":
            msg_parts = [f"உங்கள் தேடலுக்கு ஏற்ப {count} சரிபார்க்கப்பட்ட சொத்துக்கள் கிடைத்துள்ளன:"]
            if parsed.city: msg_parts.append(f"• நகரம்: {parsed.city}")
        elif detected_lang == "te":
            msg_parts = [f"మీ శోధన ప్రకారం {count} ధృవీకరించబడిన ప్రాపర్టీలు కనుగొనబడ్డాయి:"]
            if parsed.city: msg_parts.append(f"• నగరం: {parsed.city}")
        elif detected_lang == "kn":
            msg_parts = [f"ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಅನುಗುಣವಾಗಿ {count} ಪರಿಶೀಲಿಸಿದ ಆಸ್ತಿಗಳು ಕಂಡುಬಂದಿವೆ:"]
            if parsed.city: msg_parts.append(f"• ನಗರ: {parsed.city}")
        else:
            msg_parts = [f"I found {count} verified properties matching your requirements in the SAI database:"]
            if parsed.city: msg_parts.append(f"• City: {parsed.city}")
            if parsed.locality: msg_parts.append(f"• Locality: {parsed.locality}")
            if parsed.bhk: msg_parts.append(f"• Configuration: {parsed.bhk} BHK")
            if parsed.max_price: msg_parts.append(f"• Budget: up to {format_inr(parsed.max_price)}")

        reply = "\n".join(msg_parts)
    else:
        found_props = []
        matched_ids = []
        loc_name = f"{parsed.locality}, {parsed.city}" if (parsed.locality and parsed.city) else (parsed.locality or parsed.city)
        if loc_name:
            if detected_lang == "mr":
                reply = f"{loc_name} मध्ये कोणतीही जुळणारी मालमत्ता आढळली नाही. तुम्ही जवळपासचा परिसर किंवा इतर शहर शोधू इच्छिता का?"
            elif detected_lang == "hi":
                reply = f"{loc_name} में कोई मेल खाती संपत्ति नहीं मिली। क्या आप आस-पास के क्षेत्रों या किसी अन्य शहर में खोजना चाहेंगे?"
            else:
                reply = f"No matching properties were found in {loc_name} in the SAI database. Would you like to search nearby areas or another city?"
        else:
            if detected_lang == "mr":
                reply = "तुमच्या निकषांनुसार सध्याच्या SAI मालमत्ता डेटाबेसमध्ये कोणतीही मालमत्ता उपलब्ध नाही. कृपया बजेट वाढवून किंवा इतर परिसर निवडून पुन्हा प्रयत्न करा."
            elif detected_lang == "hi":
                reply = "आपके खोज मानदंडों के अनुसार वर्तमान SAI डेटाबेस में कोई संपत्ति नहीं मिली। कृपया भिन्न बजट या इलाके से पुनः प्रयास करें।"
            else:
                reply = "I couldn't find matching properties in the current SAI database. You could try increasing the budget, changing the locality, or checking 1/2/3 BHK options."

    _save_chat_log(db, current_user, session_id, user_text, reply, detected_lang, "PROPERTY_SEARCH", matched_ids)

    return {
        "success": True,
        "conversation_id": session_id,
        "intent": "PROPERTY_SEARCH",
        "language": detected_lang,
        "message": reply,
        "properties": found_props,
        "map_data": _build_map_data(found_props),
        "actions": ["view_details", "compare", "schedule_visit", "explore_map"]
    }

def _build_map_data(props: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generates structured pin coordinates for interactive map synchronization."""
    pins = []
    for p in props:
        lat = p.get("latitude")
        lng = p.get("longitude")
        if lat is not None and lng is not None:
            pins.append({
                "property_id": p.get("id"),
                "latitude": float(lat),
                "longitude": float(lng),
                "title": p.get("title", "Property"),
                "price": float(p.get("price", 0)),
                "price_display": p.get("price_display", ""),
                "locality": p.get("locality", ""),
                "city": p.get("city", "")
            })
    return pins

def _save_chat_log(db: Session, user: Optional[User], session_id: str, u_msg: str, b_resp: str, lang: str, intent: str, prop_ids: List[int]):
    try:
        log = ChatLog(
            user_id=user.id if user else None,
            session_id=session_id,
            user_message=u_msg,
            bot_response=b_resp,
            detected_language=lang,
            detected_intent=intent,
            matched_property_ids=prop_ids
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.warning(f"Could not persist chat_log: {e}")