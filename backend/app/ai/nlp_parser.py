"""
Dynamic NLP Parser for SAI — Database-driven location detection.

NO hardcoded city or locality lists.
City/locality matching queries the database so any newly added city works automatically.
"""
import re
from typing import Dict, Any, Optional, List, Set
import httpx
from app.core.config import settings
from app.schemas.search import ParsedIntent

# Devanagari digit mapping
DEV_DIGITS = {"०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9"}

# Multilingual city name aliases → canonical English name
# This maps common Devanagari/transliterated forms to their English equivalents.
# The system also does DB-driven matching, so this is only for improving accuracy
# on common transliterated names that wouldn't match substring search.
CITY_ALIASES: Dict[str, str] = {
    # Hindi/Marathi transliterations
    "पुणे": "Pune", "पुण्यात": "Pune", "पुण्यामध्ये": "Pune",
    "मुंबई": "Mumbai", "मुंबईत": "Mumbai", "मुंबईमध्ये": "Mumbai",
    "बेंगळुरू": "Bangalore", "बैंगलोर": "Bangalore", "बंगळुरू": "Bangalore",
    "दिल्ली": "Delhi", "नई दिल्ली": "Delhi",
    "हैदराबाद": "Hyderabad", "हैद्राबाद": "Hyderabad",
    "चेन्नई": "Chennai", "चेन्नैमध्ये": "Chennai",
    "कोलकाता": "Kolkata", "कोलकात्यात": "Kolkata",
    "अहमदाबाद": "Ahmedabad", "अहमदाबादमध्ये": "Ahmedabad",
    "जयपुर": "Jaipur", "जयपूर": "Jaipur",
    "अमरावती": "Amravati", "अमरावतीत": "Amravati", "अमरावतीमध्ये": "Amravati",
    "नागपूर": "Nagpur", "नागपुर": "Nagpur", "नागपूरमध्ये": "Nagpur",
    "नाशिक": "Nashik", "नाशिकमध्ये": "Nashik",
    "सूरत": "Surat", "सुरत": "Surat",
    "इंदौर": "Indore", "इंदोर": "Indore",
    "भोपाल": "Bhopal",
    "लखनऊ": "Lucknow",
    "कानपुर": "Kanpur",
    "पटना": "Patna",
    "नोएडा": "Noida",
    "गुरुग्राम": "Gurgaon", "गुड़गांव": "Gurgaon",
    # Bengali
    "পুনে": "Pune", "মুম্বাই": "Mumbai", "কলকাতা": "Kolkata",
    "দিল্লি": "Delhi", "চেন্নাই": "Chennai", "হায়দরাবাদ": "Hyderabad",
    "বেঙ্গালুরু": "Bangalore", "আহমেদাবাদ": "Ahmedabad", "জয়পুর": "Jaipur",
    "অমরাবতী": "Amravati", "নাগপুর": "Nagpur", "নাশিক": "Nashik",
    # Gujarati
    "પુણે": "Pune", "મુંબઈ": "Mumbai", "અમદાવાદ": "Ahmedabad",
    "દિલ્હી": "Delhi", "ચેન્નાઈ": "Chennai", "હૈદરાબાદ": "Hyderabad",
    "બેંગલુરુ": "Bangalore", "જયપુર": "Jaipur",
    "અમરાવતી": "Amravati", "નાગપુર": "Nagpur", "નાશિક": "Nashik",
    # Tamil
    "புனே": "Pune", "மும்பை": "Mumbai", "சென்னை": "Chennai",
    "டெல்லி": "Delhi", "ஹைதராபாத்": "Hyderabad", "பெங்களூர்": "Bangalore",
    "கொல்கத்தா": "Kolkata", "அகமதாபாத்": "Ahmedabad", "ஜெய்ப்பூர்": "Jaipur",
    "அமராவதி": "Amravati", "நாக்பூர்": "Nagpur", "நாசிக்": "Nashik",
    # Telugu
    "పుణే": "Pune", "ముంబై": "Mumbai", "హైదరాబాద్": "Hyderabad",
    "చెన్నై": "Chennai", "ఢిల్లీ": "Delhi", "బెంగళూరు": "Bangalore",
    "కోల్‌కతా": "Kolkata", "అహ్మదాబాద్": "Ahmedabad", "జైపూర్": "Jaipur",
    "అమరావతి": "Amravati", "నాగపూర్": "Nagpur", "నాసిక్": "Nashik",
    # Kannada
    "ಪುಣೆ": "Pune", "ಮುಂಬೈ": "Mumbai", "ಬೆಂಗಳೂರು": "Bangalore",
    "ಚೆನ್ನೈ": "Chennai", "ದೆಹಲಿ": "Delhi", "ಹೈದರಾಬಾದ್": "Hyderabad",
    "ಕೋಲ್ಕತಾ": "Kolkata", "ಅಹಮದಾಬಾದ್": "Ahmedabad", "ಜೈಪುರ": "Jaipur",
    "ಅಮರಾವತಿ": "Amravati", "ನಾಗ್ಪುರ": "Nagpur", "ನಾಸಿಕ್": "Nashik",
}

# Cached set of known DB cities and localities (populated lazily)
_db_cities_cache: Optional[Set[str]] = None
_db_localities_cache: Optional[Set[str]] = None
_db_locality_city_cache: Optional[Dict[str, str]] = None


def _get_db_cities() -> Set[str]:
    """Lazily loads all distinct city names from the database."""
    global _db_cities_cache
    if _db_cities_cache is not None:
        return _db_cities_cache
    try:
        from app.db.session import SessionLocal
        from app.models.property import Property
        from sqlalchemy import distinct
        db = SessionLocal()
        try:
            cities = db.query(distinct(Property.city)).filter(Property.city.isnot(None)).all()
            _db_cities_cache = set(c[0].strip().lower() for c in cities if c[0])
        finally:
            db.close()
    except Exception:
        _db_cities_cache = set()
    return _db_cities_cache


def _get_db_localities() -> Set[str]:
    """Lazily loads all distinct locality names from the database."""
    global _db_localities_cache
    if _db_localities_cache is not None:
        return _db_localities_cache
    try:
        from app.db.session import SessionLocal
        from app.models.property import Property
        from sqlalchemy import distinct
        db = SessionLocal()
        try:
            localities = db.query(distinct(Property.locality)).filter(Property.locality.isnot(None)).all()
            _db_localities_cache = set(loc[0].strip().lower() for loc in localities if loc[0])
        finally:
            db.close()
    except Exception:
        _db_localities_cache = set()
    return _db_localities_cache


def _get_locality_city_map() -> Dict[str, str]:
    """Maps each locality to its parent city based on current database properties."""
    global _db_locality_city_cache
    if _db_locality_city_cache is not None:
        return _db_locality_city_cache
    try:
        from app.db.session import SessionLocal
        from app.models.property import Property
        db = SessionLocal()
        try:
            records = db.query(Property.locality, Property.city).filter(Property.locality.isnot(None), Property.city.isnot(None)).all()
            _db_locality_city_cache = {loc.strip().lower(): c.strip() for loc, c in records if loc and c}
        finally:
            db.close()
    except Exception:
        _db_locality_city_cache = {}
    return _db_locality_city_cache


def invalidate_location_cache():
    """Call this when new properties are added to refresh the city/locality cache."""
    global _db_cities_cache, _db_localities_cache, _db_locality_city_cache
    _db_cities_cache = None
    _db_localities_cache = None
    _db_locality_city_cache = None


def normalize_devanagari(text: str) -> str:
    res = text
    for d, val in DEV_DIGITS.items():
        res = res.replace(d, val)
    return res


def rule_based_extract_intent(query: str) -> ParsedIntent:
    q = normalize_devanagari(query.lower())
    original_query = query  # Keep original for script-based matching
    intent = ParsedIntent()

    # 1. BHK Extraction (e.g. 1 BHK, 2bhk, 3 BHK, 4 bed, 2 बीएचके, 3 रूम)
    bhk_match = re.search(r'(\d+)\s*(?:bhk|bedroom|bed|room|बीएचके|कमरे|खोल्या)', q)
    if bhk_match:
        intent.bhk = int(bhk_match.group(1))

    # 2. Budget / Price Extraction
    lakh_match = re.search(r'(?:under|within|below|upto|tak|se kam|peksha kami)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l|लाख)\b', q)
    if lakh_match:
        val = float(lakh_match.group(1))
        intent.max_price = val * 100000

    cr_match = re.search(r'(?:under|within|below|upto|tak|se kam|peksha kami)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:crore|crores|cr|करोड़|कोटी)\b', q)
    if cr_match:
        val = float(cr_match.group(1))
        intent.max_price = val * 10000000

    k_match = re.search(r'(?:under|within|below|upto|tak|se kam|peksha kami)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand|हजार)\b', q)
    if k_match:
        val = float(k_match.group(1))
        intent.max_price = val * 1000

    # 3. DYNAMIC Locality Detection (Check before preposition fallback)
    db_localities = _get_db_localities()
    for loc in sorted(db_localities, key=len, reverse=True):
        if loc in q:
            intent.locality = loc.title()
            break

    # 4. DYNAMIC City Detection
    # Step A: Multilingual aliases
    for alias, canonical in CITY_ALIASES.items():
        if alias in original_query or alias in q:
            intent.city = canonical
            break

    # Step B: Database cities
    if not intent.city:
        db_cities = _get_db_cities()
        for city in sorted(db_cities, key=len, reverse=True):
            if city in q:
                intent.city = city.title()
                break

    # Step C: Fallback preposition phrase ("in Jaipur", "near Hinjewadi")
    loc_pat = re.search(r'\b(?:in|at|near|around|for)\s+([A-Za-z]{3,20})\b', original_query, re.IGNORECASE)
    if loc_pat:
        candidate = loc_pat.group(1).strip()
        stopwords = {"sale", "rent", "buy", "bhk", "flat", "apartment", "villa", "budget", "lakh", "crore", "office", "property", "house", "homes", "shop", "plot", "commercial", "good", "best", "cheap", "ready"}
        cand_lower = candidate.lower()
        if cand_lower not in stopwords:
            if cand_lower in db_localities:
                intent.locality = candidate.title()
            elif not intent.city:
                intent.city = candidate.title()

    # Step D: Harmonize locality and city (avoid city == locality and resolve parent city)
    loc_city_map = _get_locality_city_map()
    if intent.locality:
        parent_city = loc_city_map.get(intent.locality.lower())
        if intent.city and intent.city.lower() == intent.locality.lower():
            intent.city = parent_city
        elif not intent.city and parent_city:
            intent.city = parent_city

    # 5. Nearby Facility
    if any(k in q for k in ["metro", "मेट्रो"]):
        intent.nearby_facility = "metro"
    elif any(k in q for k in ["hospital", "हॉस्पिटल", "अस्पताल", "दवाखाना", "रुग्णालय"]):
        intent.nearby_facility = "hospital"
    elif any(k in q for k in ["school", "स्कूल", "शाळा", "विद्यालय"]):
        intent.nearby_facility = "school"
    elif any(k in q for k in ["it park", "आयटी पार्क", "tech park"]):
        intent.nearby_facility = "it park"
    elif any(k in q for k in ["airport", "एअरपोर्ट", "विमानतळ"]):
        intent.nearby_facility = "airport"
    elif any(k in q for k in ["temple", "मंदिर"]):
        intent.nearby_facility = "temple"

    # 6. Listing Type
    if any(k in q for k in ["rent", "lease", "kiraya", "भाडे", "भाड्याने", "किराया", "tenant"]):
        intent.listing_type = "rent"
    elif any(k in q for k in ["commercial", "office", "retail", "shop", "व्यावसायिक", "दुकान", "ऑफिस"]):
        intent.listing_type = "commercial"
    elif any(k in q for k in ["new project", "upcoming", "pre-launch", "नवीन प्रकल्प", "नए प्रोजेक्ट"]):
        intent.listing_type = "new-projects"
    else:
        intent.listing_type = "buy"

    # 7. Property Type
    if any(k in q for k in ["villa", "विला", "बंगला", "bungalow", "house", "ghar", "घर"]):
        intent.property_type = "villa"
    elif any(k in q for k in ["office", "ऑफिस", "दफ्तर"]):
        intent.property_type = "office"
    elif any(k in q for k in ["penthouse", "पेंटहाउस"]):
        intent.property_type = "penthouse"
    elif any(k in q for k in ["studio", "स्टूडियो"]):
        intent.property_type = "studio"
    elif any(k in q for k in ["plot", "प्लॉट", "जमीन"]):
        intent.property_type = "plot"
    elif any(k in q for k in ["flat", "apartment", "फ्लॅट", "फ्लैट", "अपार्टमेंट"]):
        intent.property_type = "apartment"

    # 8. Preferences
    if any(k in q for k in ["quiet", "peaceful", "shanti", "शांत"]):
        intent.preferences.append("quiet")
    if any(k in q for k in ["senior", "elderly", "parents", "accessible", "lift", "वृद्ध", "ज्येष्ठ नागरिक"]):
        intent.preferences.append("senior-friendly")

    return intent


async def parse_natural_language_query(query: str, language: Optional[str] = "en") -> ParsedIntent:
    """
    Combines rule-based parsing with optional local LLM parsing.
    Ensures 100% reliability even if LLM is offline.
    """
    parsed = rule_based_extract_intent(query)

    # Optional local LLM call via Ollama if enabled
    if settings.LLM_PROVIDER == "ollama" and settings.OLLAMA_BASE_URL:
        try:
            prompt = f"""
            Extract real estate search filters from this query: "{query}".
            Output valid JSON with keys: bhk (int), city (str), locality (str), 
            property_type (str), min_price (float), max_price (float), nearby_facility (str).
            """
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={"model": "llama3", "prompt": prompt, "format": "json", "stream": False}
                )
                if res.status_code == 200:
                    data = res.json().get("response", {})
                    # augment parsed fields if LLM found details that regex missed
                    if not parsed.bhk and data.get("bhk"):
                        parsed.bhk = int(data["bhk"])
                    if not parsed.city and data.get("city"):
                        parsed.city = data["city"].strip().title()
                    if not parsed.locality and data.get("locality"):
                        parsed.locality = data["locality"].strip().title()
                    if not parsed.max_price and data.get("max_price"):
                        parsed.max_price = float(data["max_price"])
        except Exception:
            pass  # Graceful fallback to deterministic regex extraction

    return parsed
