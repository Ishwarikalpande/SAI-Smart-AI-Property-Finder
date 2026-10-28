"""
SAI Chatbot — Dynamic, city-agnostic property search assistant.
No hardcoded city defaults. All location filtering is database-driven.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.property import Property
from app.models.user import User, UserRole
from app.schemas.chatbot import ChatbotRequest, ChatbotResponse
from app.schemas.property import PropertyResponse
from app.schemas.search import PropertySearchParams
from app.services.search_service import search_properties
from app.ai.nlp_parser import rule_based_extract_intent


async def process_chatbot_message(
    db: Session,
    request: ChatbotRequest,
    current_user: Optional[User] = None
) -> ChatbotResponse:
    msg = request.message.strip()
    lower_msg = msg.lower()
    lang = request.language or "en"

    # Determine intent
    intent = rule_based_extract_intent(msg)
    
    # Check if user is asking to search or find property
    is_search = any(k in lower_msg for k in [
        "find", "search", "looking for", "show", "bhk", "flat", "apartment", "villa", "budget", 
        "lakh", "crore", "rent", "buy", "khoj", "dikhao", "shodha", "pahije", "chahiye", "ghar"
    ])

    if is_search:
        params = PropertySearchParams(
            city=intent.city,
            locality=intent.locality,
            bhk=intent.bhk,
            max_price=intent.max_price,
            property_type=intent.property_type,
            listing_type=intent.listing_type,
            limit=4
        )
        props, total = search_properties(db, params)
        
        reply_parts = []
        if total > 0:
            # Include city in the response if detected
            city_label = intent.city or intent.locality or ""
            if lang == "hi":
                reply_parts.append(f"मुझे आपकी खोज के अनुसार {total} संपत्तियां मिलीं:")
                if intent.bhk:
                    reply_parts.append(f"• विन्यास: {intent.bhk} BHK")
                if intent.max_price:
                    reply_parts.append(f"• अधिकतम बजट: ₹{intent.max_price:,.0f}")
                if city_label:
                    reply_parts.append(f"• शहर/इलाका: {city_label}")
            elif lang == "mr":
                reply_parts.append(f"मला तुमच्या शोधासाठी {total} जुळणाऱ्या मालमत्ता सापडल्या आहेत:")
                if intent.bhk:
                    reply_parts.append(f"• रचना: {intent.bhk} BHK")
                if intent.max_price:
                    reply_parts.append(f"• कमाल बजेट: ₹{intent.max_price:,.0f}")
                if city_label:
                    reply_parts.append(f"• शहर/परिसर: {city_label}")
            else:
                reply_parts.append(f"I found {total} matching properties for your search:")
                if intent.bhk:
                    reply_parts.append(f"• Configuration: {intent.bhk} BHK")
                if intent.max_price:
                    reply_parts.append(f"• Budget: up to ₹{intent.max_price:,.0f}")
                if city_label:
                    reply_parts.append(f"• Location: {city_label}")
        else:
            # No results — ask user to try another city. DO NOT substitute a different city.
            search_location = intent.city or intent.locality or "the specified location"
            if lang == "hi":
                reply_parts.append(f"{search_location} में कोई मिलान संपत्ति नहीं मिली। क्या आप किसी अन्य शहर या क्षेत्र में खोजना चाहेंगे?")
            elif lang == "mr":
                reply_parts.append(f"{search_location} मध्ये कोणतीही जुळणारी मालमत्ता सापडली नाही. तुम्हाला दुसऱ्या शहरात किंवा परिसरात शोधायचे आहे का?")
            else:
                reply_parts.append(f"No matching properties were found in {search_location}. Would you like to search nearby areas or another city?")
            props = []

        property_responses = [PropertyResponse.model_validate(p) for p in props]

        suggestions = [
            "शीर्ष 2 संपत्तियों की तुलना करें",
            "मेट्रो के पास की प्रॉपर्टीज दिखाएं",
            "साइट विजिट शेड्यूल करें"
        ] if lang == "hi" else [
            "शीर्ष 2 मालमत्तांची तुलना करा",
            "मेट्रोजवळील मालमत्ता दाखवा",
            "साइट भेट निश्चित करा"
        ] if lang == "mr" else [
            "Compare top 2 properties",
            "Show properties near metro",
            "Schedule a site visit"
        ]

        return ChatbotResponse(
            reply="\n".join(reply_parts),
            properties=property_responses,
            suggestions=suggestions,
            detected_intent="property_search"
        )

    # General inquiries / Greetings
    if any(k in lower_msg for k in ["hello", "hi", "hey", "namaste", "namaskar", "pranam"]):
        if lang == "hi":
            return ChatbotResponse(
                reply="नमस्ते! 👋 मैं SAI हूँ, आपका AI प्रॉपर्टी सहायक। मुझे बताइए कि आप किस शहर में किस प्रकार का घर तलाश रहे हैं — आप बोलकर भी खोज सकते हैं!",
                properties=[],
                suggestions=[
                    "₹60 लाख से कम में 2 BHK",
                    "किराए के फ्लैट्स दिखाएं",
                    "लक्जरी विला खोजें"
                ],
                detected_intent="greeting"
            )
        elif lang == "mr":
            return ChatbotResponse(
                reply="नमस्कार! 👋 मी SAI आहे, तुमचा AI मालमत्ता सहाय्यक. तुम्हाला कोणत्या शहरात कशा प्रकारचे घर हवे आहे ते सांगा — तुम्ही व्हॉईसने देखील शोधू शकता!",
                properties=[],
                suggestions=[
                    "60 लाखांपेक्षा कमी 2 BHK",
                    "भाड्याचे फ्लॅट्स दाखवा",
                    "लक्झरी व्हिला शोधा"
                ],
                detected_intent="greeting"
            )
        return ChatbotResponse(
            reply="Namaste! 👋 I'm SAI, your AI Property Assistant. Tell me what kind of home or commercial space you're looking for — mention the city and I'll find the best matches for you!",
            properties=[],
            suggestions=[
                "Find 2 BHK under 60L",
                "Furnished flats for rent",
                "Luxury villas near metro"
            ],
            detected_intent="greeting"
        )
    
    # Senior-friendly assistance
    if any(k in lower_msg for k in ["senior", "parents", "elderly", "accessible", "vriddh", "aji", "aoba"]):
        props = db.query(Property).filter(Property.amenities.contains(["Lift"])).limit(3).all()
        if not props:
            props = db.query(Property).limit(3).all()
        
        reply = "हमारे पास लिफ्ट और स्वास्थ्य सुविधाओं के पास वरिष्ठ नागरिकों के अनुकूल संपत्तियां उपलब्ध हैं।" if lang == "hi" else \
                "आमच्याकडे लिफ्टची सुविधा आणि रुग्णालयांच्या जवळ ज्येष्ठ नागरिकांसाठी अनुकूल मालमत्ता उपलब्ध आहेत." if lang == "mr" else \
                "We have senior-citizen friendly properties with elevator access, low-floor availability, and proximity to healthcare facilities."

        suggestions = ["अस्पताल से 1 किमी के दायरे में", "भूतल या लिफ्ट युक्त"] if lang == "hi" else \
                      ["हॉस्पिटलपासून 1 किमी अंतरावर", "तळमजला किंवा लिफ्टसह"] if lang == "mr" else \
                      ["Properties within 1 km of a hospital", "Ground floor or with elevator"]

        return ChatbotResponse(
            reply=reply,
            properties=[PropertyResponse.model_validate(p) for p in props],
            suggestions=suggestions,
            detected_intent="senior_care"
        )

    # Default fallback — generic, no city-specific mentions
    if lang == "hi":
        return ChatbotResponse(
            reply="मैं प्रॉपर्टी खोजने, कीमतों की जांच करने, साइट विजिट बुक करने या सुविधाओं की तुलना करने में आपकी सहायता कर सकता हूँ। कृपया शहर और अपनी प्राथमिकताएं बताएं।",
            properties=[],
            suggestions=[
                "50 लाख से कम में 2 BHK",
                "कार्यालय हेतु व्यावसायिक स्थान",
                "तुरंत रहने योग्य घर"
            ],
            detected_intent="general_help"
        )
    elif lang == "mr":
        return ChatbotResponse(
            reply="मी तुम्हाला मालमत्ता शोधण्यात, किंमती तपासण्यात, साइट भेट बुक करण्यात मदत करू शकतो. कृपया शहर आणि तुमचे बजेट सांगा.",
            properties=[],
            suggestions=[
                "50 लाखांपेक्षा कमी 2 BHK",
                "भाडेतत्त्वावर व्यावसायिक जागा",
                "राहण्यास तयार घरे"
            ],
            detected_intent="general_help"
        )

    return ChatbotResponse(
        reply="I can help you discover properties, check pricing, schedule site visits, or compare amenities across any Indian city. Tell me your city and budget preferences!",
        properties=[],
        suggestions=[
            "2 BHK flats under 50 Lakh",
            "Commercial offices for lease",
            "Ready-to-move homes"
        ],
        detected_intent="general_help"
    )
