import re
from typing import Tuple, Dict, Any

SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "bn": "Bengali",
    "gu": "Gujarati",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada"
}

# Devanagari / Regional character unicode ranges
SCRIPT_RANGES = {
    "bn": (0x0980, 0x09FF),  # Bengali
    "gu": (0x0A80, 0x0AFF),  # Gujarati
    "ta": (0x0B80, 0x0BFF),  # Tamil
    "te": (0x0C00, 0x0C7F),  # Telugu
    "kn": (0x0C80, 0x0CFF),  # Kannada
    "devanagari": (0x0900, 0x097F), # Hindi / Marathi
}

# Marathi-specific lexical markers vs Hindi
MARATHI_MARKERS = [
    "आहे", "नाही", "पाहिजे", "शोधा", "दाखवा", "घर", "भाड्याने", "पुण्यात", "करा", "बघा",
    "कशी", "कोणती", "किंमत", "जागा", "माहिती", "सांगा", "यापैकी", "तुलना", "गुंतवणूक",
    "पहिल्या", "दुसऱ्या", "तिसऱ्या", "चौथ्या", "फ्लॅट"
]

HINDI_MARKERS = [
    "है", "नहीं", "चाहिए", "खोजें", "दिखाओ", "दिखाइए", "किराये", "किराया", "कीजिए",
    "करो", "कैसा", "कौनसा", "कीमत", "जानकारी", "बताइए", "इनमें", "तुलना", "निवेश",
    "पहला", "दूसरा", "तीसरा", "चौथा", "फ्लैट"
]

# Standard Greetings across 8 languages
GREETINGS_BY_LANG: Dict[str, str] = {
    "en": "Hello! 👋 I'm SAI, your AI Property Assistant. How can I help you find, compare, or analyze properties today?",
    "hi": "नमस्ते! 👋 मैं SAI हूँ, आपका AI प्रॉपर्टी सहायक। मैं आज आपको प्रॉपर्टी खोजने, तुलना करने या निवेश विश्लेषण में कैसे मदद कर सकता हूँ?",
    "mr": "नमस्कार! 👋 मी SAI आहे, तुमचा AI मालमत्ता सहाय्यक. मी आज तुम्हाला मालमत्ता शोधण्यात, तुलना करण्यात किंवा गुंतवणूक विश्लेषणात कशी मदत करू शकतो?",
    "bn": "নমস্কার! 👋 আমি SAI, আপনার AI প্রপার্টি সহকারী। আজ আমি আপনাকে প্রপার্টি খুঁজতে, তুলনা করতে বা বিনিয়োগ বিশ্লেষণে কীভাবে সাহায্য করতে পারি?",
    "gu": "નમસ્તે! 👋 હું SAI છું, તમારો AI પ્રોપર્ટી સહાયક. આજે હું તમને પ્રોપર્ટી શોધવા, સરખામણી કરવા અથવા રોકાણ વિશ્લેષણમાં કેવી રીતે મદદ કરી શકું?",
    "ta": "வணக்கம்! 👋 நான் SAI, உங்கள் AI ரியல் எஸ்டேட் உதவியாளர். சொத்துக்களைத் தேட, ஒப்பிட அல்லது முதலீட்டு ஆய்வில் நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    "te": "నమస్కారం! 👋 నేను SAI, మీ AI ప్రాపర్టీ అసిస్టెంట్. ప్రాపర్టీలను వెతకడంలో, సరిపోల్చడంలో లేదా పెట్టుబడి విశ్లేషణలో నేను మీకు ఎలా సహాయపడగలను?",
    "kn": "ನಮಸ್ಕಾರ! 👋 ನಾನು SAI, ನಿಮ್ಮ AI ಆಸ್ತಿ ಸಹಾಯಕ. ಆಸ್ತಿಗಳನ್ನು ಹುಡುಕಲು, ಹೋಲಿಸಲು ಅಥವಾ ಹೂಡಿಕೆ ವಿಶ್ಲೇಷಣೆಯಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
}

# Off-topic redirection across 8 languages
OFF_TOPIC_RESPONSES: Dict[str, str] = {
    "en": "I specialize strictly in real estate and property assistance. I can help you search properties, compare options, evaluate localities, or calculate investment yields.",
    "hi": "माफ़ कीजिए, मैं केवल रियल एस्टेट और प्रॉपर्टी संबंधी सहायता के लिए बनाया गया हूँ। मैं प्रॉपर्टी खोजने, तुलना करने या निवेश विश्लेषण में आपकी मदद कर सकता हूँ।",
    "mr": "माफ करा, मी केवळ रिअल इस्टेट आणि मालमत्ता संबंधी प्रश्नांसाठी तयार करण्यात आलो आहे. मी तुम्हाला मालमत्ता शोधणे, तुलना करणे किंवा गुंतवणूक विश्लेषणात मदत करू शकतो.",
    "bn": "দুঃখিত, আমি শুধুমাত্র রিয়েল এস্টেট এবং প্রপার্টি সম্পর্কিত সহায়তায় বিশেষজ্ঞ। আমি আপনাকে প্রপার্টি খুঁজতে, তুলনা করতে বা বিনিয়োগ বিশ্লেষণে সাহায্য করতে পারি।",
    "gu": "માફ કરશો, હું ફક્ત રિયલ એસ્ટેટ અને પ્રોપર્ટી સંબંધિત પ્રશ્નો માટે બનાવવામાં આવ્યો છું. હું તમને પ્રોપર્ટી શોધવામાં, સરખામણી કરવામાં અથવા રોકાણ વિશ્લેષણમાં મદદ કરી શકું છું.",
    "ta": "மன்னிக்கவும், நான் ரியல் எஸ்டேட் மற்றும் சொத்து தொடர்பான உதவிகளுக்கு மட்டுமே உதவ முடியும். சொத்துக்களைத் தேட, ஒப்பிட அல்லது முதலீட்டு ஆய்வில் நான் உதவலாம்.",
    "te": "క్షమించండి, నేను రియల్ ఎస్టేట్ మరియు ప్రాపర్టీ సంబంధిత సహాయం కోసం మాత్రమే ప్రత్యేకించబడ్డాను. ప్రాపర్టీలను శోధించడం, సరిపోల్చడం లేదా పెట్టుబడి విశ్లేషణలో మీకు సహాయం చేయగలను.",
    "kn": "ಕ್ಷಮಿಸಿ, ನಾನು ಕೇವಲ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ಮತ್ತು ಆಸ್ತಿ ಸಂಬಂಧಿತ ಸಹಾಯದಲ್ಲಿ ಪರಿಣತಿ ಹೊಂದಿದ್ದೇನೆ. ಆಸ್ತಿಗಳನ್ನು ಹುಡುಕಲು, ಹೋಲಿಸಲು ಅಥವಾ ಹೂಡಿಕೆ ವಿಶ್ಲೇಷಣೆಯಲ್ಲಿ ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು."
}

def detect_language(text: str) -> str:
    """
    Detects user language and constrains to EXACTLY the 8 supported languages:
    'en', 'hi', 'mr', 'bn', 'gu', 'ta', 'te', 'kn'.
    Supports pure script detection, mixed-language code-switching, and transliterated queries.
    """
    if not text or not text.strip():
        return "en"

    clean_text = text.strip()
    lower_text = clean_text.lower()

    # Count script characters
    counts = {k: 0 for k in SCRIPT_RANGES}
    for char in clean_text:
        cp = ord(char)
        for script, (start, end) in SCRIPT_RANGES.items():
            if start <= cp <= end:
                counts[script] += 1
                break

    # If non-Devanagari regional Indian scripts dominate:
    for script in ["bn", "gu", "ta", "te", "kn"]:
        if counts[script] > 1:
            return script

    # If Devanagari script:
    if counts["devanagari"] > 1:
        # Check Marathi vs Hindi markers
        mr_score = sum(1 for m in MARATHI_MARKERS if m in clean_text)
        hi_score = sum(1 for m in HINDI_MARKERS if m in clean_text)
        if mr_score > hi_score:
            return "mr"
        elif hi_score > mr_score:
            return "hi"
        # If ambiguous Devanagari, check common Marathi words
        if any(w in clean_text for w in ["पुणे", "बाणेर", "वाकड", "हिंजवडी", "लाख", "घर"]):
            return "mr"
        return "hi"

    # For Romanized / Hinglish / Minglish mixed language queries:
    # Check Marathi Romanized keywords
    if any(k in lower_text for k in ["pahije", "shodha", "dakhva", "ahe", "mahit", "kiti", "punyat"]):
        return "mr"

    # Check Hindi Romanized keywords
    if any(k in lower_text for k in ["chahiye", "dikhao", "batao", "hai", "kripya", "kiraya"]):
        return "hi"

    # Default to English
    return "en"

def get_greeting(lang: str) -> str:
    return GREETINGS_BY_LANG.get(lang, GREETINGS_BY_LANG["en"])

def get_off_topic_response(lang: str) -> str:
    return OFF_TOPIC_RESPONSES.get(lang, OFF_TOPIC_RESPONSES["en"])
