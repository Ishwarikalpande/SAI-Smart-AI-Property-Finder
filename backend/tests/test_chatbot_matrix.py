import pytest
from app.models.user import UserRole
from tests.conftest import get_auth_headers

LANGUAGES = ["en", "hi", "mr", "bn", "gu", "ta", "te", "kn"]

SCENARIOS = {
    "greeting": {
        "en": "Hello, good morning!",
        "hi": "नमस्ते",
        "mr": "नमस्कार",
        "bn": "নমস্কার",
        "gu": "નમસ્તે",
        "ta": "வணக்கம்",
        "te": "నమస్కారం",
        "kn": "ನಮಸ್ಕಾರ",
        "expected_intent": "GREETING",
    },
    "property_search": {
        "en": "Find 2 BHK apartments in Baner Pune",
        "hi": "पुणे के बाणेर में 2 BHK फ्लैट खोजें",
        "mr": "पुण्यातील बाणेरमध्ये 2 BHK फ्लॅट शोधा",
        "bn": "পুনের বাণেরে 2 BHK ফ্ল্যাট খুঁজুন",
        "gu": "પુણેના બાણેરમાં 2 BHK ફ્લેટ શોધો",
        "ta": "புனேவின் பாணேரில் 2 BHK பிளாட்களைக் கண்டறியவும்",
        "te": "పూణేలోని బాణేర్‌లో 2 BHK ఫ్లాట్‌లను కనుగొనండి",
        "kn": "ಪುಣೆಯ ಬಾಣೇರ್‌ನಲ್ಲಿ 2 BHK ಅಪಾರ್ಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ಹುಡುಕಿ",
        "expected_intent": "PROPERTY_SEARCH",
    },
    "property_details": {
        "en": "Tell me details and amenities of Prestige Heights",
        "hi": "प्रेस्टिज हाइट्स की सुविधाएं और विवरण बताएं",
        "mr": "प्रेस्टिज हाइट्सची माहिती आणि सुविधा सांगा",
        "bn": "প্রেস্টিজ হাইটসের সুযোগ-সুবিধা এবং বিবরণ বলুন",
        "gu": "પ્રેસ્ટિજ હાઇટ્સની વિગતો અને સુવિધાઓ જણાવો",
        "ta": "பிரெஸ்டீஜ் ஹைட்ஸ் விவரங்கள் மற்றும் வசதிகளைக் கூறுங்கள்",
        "te": "ప్రెస్టీజ్ హైట్స్ వివరాలు మరియు సౌకర్యాలు చెప్పండి",
        "kn": "ಪ್ರೆಸ್ಟೀಜ್ ಹೈಟ್ಸ್ ವಿವರಗಳು ಮತ್ತು ಸೌಲಭ್ಯಗಳನ್ನು ತಿಳಿಸಿ",
        "expected_intent": "PROPERTY_DETAILS",
    },
    "property_comparison": {
        "en": "Compare Prestige Heights and Godrej Woodsville",
        "hi": "प्रेस्टिज हाइट्स और गोदरेज वुड्सविले की तुलना करें",
        "mr": "प्रेस्टिज हाइट्स आणि गोदरेज वुड्सव्हिलेची तुलना करा",
        "bn": "প্রেস্টিজ হাইটস এবং গোদরেজ উডসভিলে তুলনা করুন",
        "gu": "પ્રેસ્ટિજ હાઇટ્સ અને ગોદરેજ વુડ્સવિલેની સરખામણી કરો",
        "ta": "பிரெஸ்டீஜ் ஹைட்ஸ் மற்றும் கோத்ரேஜ் உட்ஸ்வில்லே ஒப்பிடுக",
        "te": "ప్రెస్టీజ్ హైట్స్ మరియు గోద్రెజ్ వుడ్స్‌విల్లే పోల్చండి",
        "kn": "ಪ್ರೆಸ್ಟೀಜ್ ಹೈಟ್ಸ್ ಮತ್ತು ಗೋದ್ರೆಜ್ ವುಡ್ಸ್‌ವಿಲ್ಲೆ ಹೋಲಿಕೆ ಮಾಡಿ",
        "expected_intent": "PROPERTY_COMPARISON",
    },
    "recommendation": {
        "en": "Recommend best family apartments in Pune",
        "hi": "पुणे में रहने के लिए सबसे अच्छे अपार्टमेंट की सिफारिश करें",
        "mr": "पुण्यात कुटुंबासाठी सर्वोत्तम अपार्टमेंटची शिफारस करा",
        "bn": "পুনেতে সেরা পরিবারের অ্যাপার্টমেন্ট সুপারিশ করুন",
        "gu": "પુણેમાં શ્રેષ્ઠ એપાર્ટમેન્ટ્સની ભલામણ કરો",
        "ta": "புனேவில் சிறந்த குடும்ப அடுக்குமாடி குடியிருப்புகளை பரிந்துரைக்கவும்",
        "te": "పూణేలో ఉత్తమ అపార్ట్‌మెంట్‌లను సిఫార్సు చేయండి",
        "kn": "ಪುಣೆಯಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಅಪಾರ್ಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಿ",
        "expected_intent": "PROPERTY_RECOMMENDATION",
    },
    "investment_query": {
        "en": "What is the expected rental yield and appreciation?",
        "hi": "किराया यील्ड और मूल्य वृद्धि का विश्लेषण बताएं",
        "mr": "अपेक्षित भाडे परतावा आणि गुंतवणूक विश्लेषण काय आहे?",
        "bn": "প্রত্যাশিত ভাড়া আয় এবং বিনিয়োগ রিটার্ন কত?",
        "gu": "અપેક્ષિત ભાડાની ઉપજ અને રોકાણ વિશ્લેષણ શું છે?",
        "ta": "எதிர்பார்க்கப்படும் வாடகை வருவாய் மற்றும் முதலீட்டு மதிப்பு என்ன?",
        "te": "అద్దె రాబడి మరియు పెట్టుబడి పెరుగుదల ఎంత?",
        "kn": "ನಿರೀಕ್ಷಿತ ಬಾಡಿಗೆ ಇಳುವರಿ ಮತ್ತು ಹೂಡಿಕೆ ಲಾಭ ಏನು?",
        "expected_intent": "INVESTMENT_ANALYSIS",
    },
    "follow_up_question": {
        "en": "Under 60 lakh only",
        "hi": "केवल 60 लाख के अंदर",
        "mr": "फक्त 60 लाखांच्या आत",
        "bn": "শুধুমাত্র ৬০ লাখের নিচে",
        "gu": "માત્ર 60 લાખની અંદર",
        "ta": "60 லட்சத்திற்குள் மட்டும்",
        "te": "60 లక్షల లోపు మాత్రమే",
        "kn": "ಕೇವಲ 60 ಲಕ್ಷದೊಳಗೆ",
        "expected_intent": "PROPERTY_SEARCH",
    },
    "mixed_language": {
        "en": "Looking for 2 BHK near Pune IT Park under 75 lakh",
        "hi": "Mujhe Pune me 2 BHK flat chahiye under 75 lakh",
        "mr": "Mala Pune madhe 2 BHK flat pahije under 75 lakh",
        "bn": "Amar Pune te 2 BHK flat dorkar under 75 lakh",
        "gu": "Mane Pune ma 2 BHK flat joiye chhe under 75 lakh",
        "ta": "Enakku Pune la 2 BHK flat venum under 75 lakh",
        "te": "Naaku Pune lo 2 BHK flat kaavali under 75 lakh",
        "kn": "Nanage Pune alli 2 BHK flat beku under 75 lakh",
        "expected_intent": "PROPERTY_SEARCH",
    },
    "off_topic": {
        "en": "What is the capital of France?",
        "hi": "फ्रांस की राजधानी कौन सी है?",
        "mr": "फ्रान्सची राजधानी कोणती आहे?",
        "bn": "ফ্রান্সের রাজধানী কি?",
        "gu": "ફ્રાન્સની રાજધાની કઈ છે?",
        "ta": "பிரான்சின் தலைநகரம் எது?",
        "te": "ఫ్రాన్స్ రాజధాని ఏది?",
        "kn": "ಫ್ರಾನ್ಸ್‌ನ ರಾಜಧಾನಿ ಯಾವುದು?",
        "expected_intent": "OFF_TOPIC",
    },
    "unclear_query": {
        "en": "asdfghjkl ???",
        "hi": "असमंजस ?????",
        "mr": "काहीतरी ??????",
        "bn": "অস্পষ্ট ??????",
        "gu": "કંઈક ?????",
        "ta": "புரியவில்லை ???",
        "te": "స్పష్టత లేదు ???",
        "kn": "ಗೊಂದಲ ??????",
        "expected_intent": "UNCLEAR",
    },
}

# Generate 80 parameterized test pairs (8 languages x 10 scenarios)
MATRIX_PARAMS = [
    (lang, scenario_name, data[lang], data["expected_intent"])
    for scenario_name, data in SCENARIOS.items()
    for lang in LANGUAGES
]

@pytest.mark.parametrize("lang,scenario_name,message,expected_intent", MATRIX_PARAMS)
def test_chatbot_8x10_matrix(client, lang, scenario_name, message, expected_intent):
    """Test all 8 languages across 10 scenarios (80 combinations) against /api/ai/chat."""
    payload = {
        "message": message,
        "language": lang,
        "conversation_id": f"test_conv_{lang}_{scenario_name}"
    }
    res = client.post("/api/ai/chat", json=payload)
    assert res.status_code == 200, f"Failed for {lang} - {scenario_name}: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert "message" in data
    assert len(data["message"]) > 0

    # Verify intent matching
    if expected_intent == "OFF_TOPIC":
        assert data["intent"] == "OFF_TOPIC"
        assert any(t in data["message"].lower() for t in [
            "property", "real estate", "प्रॉपर्टी", "मालमत्ता", "ঘর", "મકાન", "வீடு", "ఇల్లు", "ಮನೆ",
            "ரியல் எஸ்டேட்", "சொத்து", "రియల్ ఎస్టేట్", "ప్రాపర్టీ", "ರಿಯಲ್ ಎಸ್ಟೇಟ್", "ಆಸ್ತಿ", "রিয়েল এস্টেট", "প্রপার্টি", "રિયલ એસ્ટેટ", "પ્રોપર્ટી"
        ])
    elif expected_intent == "GREETING":
        assert data["intent"] in ["GREETING", "CONVERSATIONAL"]
    elif expected_intent == "PROPERTY_SEARCH":
        assert data["intent"] == "PROPERTY_SEARCH"
        assert isinstance(data.get("properties"), list)
    elif expected_intent == "PROPERTY_DETAILS":
        assert data["intent"] in ["PROPERTY_DETAILS", "PROPERTY_SEARCH"]
    elif expected_intent == "PROPERTY_COMPARISON":
        assert data["intent"] in ["PROPERTY_COMPARISON", "PROPERTY_SEARCH"]
    elif expected_intent == "PROPERTY_RECOMMENDATION":
        assert data["intent"] in ["PROPERTY_RECOMMENDATION", "PROPERTY_SEARCH"]
    elif expected_intent == "INVESTMENT_ANALYSIS":
        assert data["intent"] in ["INVESTMENT_ANALYSIS", "PROPERTY_SEARCH"]
    elif expected_intent == "UNCLEAR":
        assert data["intent"] in ["UNCLEAR", "CONVERSATIONAL", "GREETING"]

def test_chatbot_hallucination_prevention(client):
    """Qwen3 must never invent properties not in PostgreSQL database."""
    res = client.post("/api/ai/chat", json={
        "message": "Find Mars Orbit 99 BHK floating palace in Pune for 1 rupee",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "PROPERTY_SEARCH"
    # Must return empty list for non-matching property search, no fabricated property IDs
    assert len(data.get("properties", [])) == 0
    # Must state that matching properties were not found
    assert any(term in data["message"].lower() for term in ["no properties", "not found", "available", "database", "criteria"])
