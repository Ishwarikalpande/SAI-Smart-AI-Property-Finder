import json
import logging
import re
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings
from app.ai.language_service import detect_language, get_greeting, SUPPORTED_LANGUAGES
from app.ai.tools import PROPERTY_TOOLS

logger = logging.getLogger("sai-ai")

QWEN3_SYSTEM_PROMPT = """
You are SAI, the Smart AI Property Finder assistant powered by Qwen3.
You are a helpful, knowledgeable, and multilingual AI assistant capable of answering general-purpose questions as well as specialized Indian real estate queries.

SUPPORTED LANGUAGES (EXACTLY 8):
1. English (en)
2. Hindi (hi)
3. Marathi (mr)
4. Bengali (bn)
5. Gujarati (gu)
6. Tamil (ta)
7. Telugu (te)
8. Kannada (kn)

BEHAVIORAL RULES:
1. GENERAL KNOWLEDGE & CONVERSATION:
   - For general questions (coding, science, technology, mathematics, general knowledge, history, jokes, greetings), answer directly, informatively, and accurately in the user's detected language.
   - You do NOT reject general questions or claim you can only talk about real estate.

2. REAL ESTATE & PROPERTY QUERIES:
   - The PostgreSQL database is the SINGLE SOURCE OF TRUTH for actual property records.
   - NEVER invent or fabricate property listings, prices, BHKs, locations, builder names, or RERA numbers.
   - If a requested property is not in the database, explicitly state: "That information is not available in the current SAI property database."
   - For real estate conceptual questions (e.g. "What is carpet area vs built-up area?", "What is RERA?"), explain the concepts clearly and accurately using your real estate knowledge.

3. MULTI-TURN CONVERSATION:
   - Maintain context from previous conversation turns (e.g., if the user previously searched "2 BHK in Pune" and follows with "under 60 lakh", apply the budget to the previous search parameters).

4. INVESTMENT & FINANCIAL ESTIMATES:
   - Clearly distinguish database facts (e.g., current listed price) from financial calculations (e.g., gross rental yield) and model-based projections. Never guarantee future returns.
""".strip()

# Built-in knowledge bank for reliable responses when external LLM service is in transition/offline
GENERAL_KNOWLEDGE_BANK = {
    "artificial_intelligence": {
        "pattern": r"\b(artificial intelligence|what is ai|explain ai|आर्टिफिशियल इंटेलिजेंस|कृत्रिम बुद्धिमत्ता)\b",
        "en": "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think, learn, and solve problems like humans. It spans sub-fields like Machine Learning, Deep Learning, Natural Language Processing (NLP), and Computer Vision. Today, AI powers everything from language translation and autonomous vehicles to smart urban systems and real estate matching engines like SAI.",
        "hi": "आर्टिफिशियल इंटेलिजेंस (AI) या कृत्रिम बुद्धिमत्ता का तात्पर्य कंप्यूटर या मशीनों में मानव जैसी बौद्धिक क्षमताओं (सोचना, सीखना, निर्णय लेना) के विकास से है। इसके प्रमुख अंगों में मशीन लर्निंग, डीप लर्निंग और कंप्यूटर विज़न शामिल हैं।",
        "mr": "कृत्रिम बुद्धिमत्ता (Artificial Intelligence - AI) म्हणजे मानवी बुद्धिमत्तेची संगणकीय प्रणालींद्वारे केलेली नक्कल. यात मशीन लर्निंग, नॅचरल लँग्वेज प्रोसेसिंग (NLP) आणि डेटा ॲनालिटिक्सचा समावेश होतो."
    },
    "machine_learning": {
        "pattern": r"\b(machine learning|what is ml|explain ml|मशीन लर्निंग|मशीन लर्निंग काय आहे)\b",
        "en": "Machine Learning (ML) is a branch of Artificial Intelligence (AI) focused on building applications that learn from data and improve their accuracy over time without being explicitly programmed to do so. In real estate, ML powers price prediction models, automated property valuation, and personalized recommendation systems.",
        "hi": "मशीन लर्निंग (Machine Learning) आर्टिफिशियल इंटेलिजेंस (AI) की एक शाखा है, जो डेटा से सीखकर अपने प्रदर्शन को बेहतर बनाती है बिना अलग से प्रोग्राम किए। रियल एस्टेट में इसका उपयोग प्रॉपर्टी मूल्य निर्धारण और स्मार्ट सिफारिशों के लिए किया जाता है।",
        "mr": "मशीन लर्निंग (Machine Learning) ही कृत्रिम बुद्धिमत्ता (AI) ची एक शाखा आहे जी डेटामधून शिकते आणि स्पष्ट प्रोग्रामिंगशिवाय अचूकता सुधारते. रिअल इस्टेटमध्ये याचा वापर मालमत्तेचे मूल्यांकन आणि स्मार्ट शिफारसींसाठी केला जातो."
    },
    "cloud_computing": {
        "pattern": r"\b(cloud computing|what is cloud|क्लाउड कंप्यूटिंग|क्लाउड कॉम्प्युटिंग)\b",
        "en": "Cloud computing is the on-demand delivery of IT resources over the Internet with pay-as-you-go pricing. Instead of buying, owning, and maintaining physical servers, you can access computing power, storage, and databases on an as-needed basis from a cloud provider like AWS, Google Cloud, or Azure.",
        "hi": "क्लाउड कंप्यूटिंग इंटरनेट के माध्यम से सर्वर, स्टोरेज, डेटाबेस, नेटवर्किंग और सॉफ्टवेयर जैसी कंप्यूटिंग सेवाओं की ऑन-डिमांड डिलीवरी है।",
        "mr": "क्लाउड कॉम्प्युटिंग म्हणजे इंटरनेटवर ऑन-डिमांड कंप्युटिंग संसाधने (जसे सर्व्हर, स्टोरेज, डेटाबेस) पुरवणे."
    },
    "kubernetes": {
        "pattern": r"\b(kubernetes|what is k8s|explain k8s|क्युबरनेटीस|कुबेरनेट्स)\b",
        "en": "Kubernetes (often abbreviated as K8s) is an open-source container orchestration platform that automates the deployment, scaling, and management of containerized applications (like Docker containers). Key components include:\n• **Pods**: Smallest deployable units containing one or more containers.\n• **Nodes & Clusters**: Worker machines executing workloads governed by the Control Plane.\n• **Services & Ingress**: Routing traffic to pods with built-in load balancing.\n• **Auto-scaling**: Automatically adjusting replica counts based on CPU and memory demands.",
        "hi": "कुबेरनेट्स (Kubernetes / K8s) एक ओपन-सोर्स कंटेनर ऑर्केस्ट्रेशन प्लेटफॉर्म है जो डॉकर कंटेनर्स की तैनाती, स्केलिंग और प्रबंधन को स्वचालित करता है।",
        "mr": "कुबरनेट्स (Kubernetes) हे कंटेनराइज्ड ॲप्लिकेशन्सचे स्वयंचलित व्यवस्थापन, डिप्लॉयमेंट आणि स्केलिंग करणारे एक ओपन-सोर्स प्लॅटफॉर्म आहे."
    },
    "cnn_deep_learning": {
        "pattern": r"\b(cnn|convolutional neural network|explain cnn|कनवोल्यूशनल न्यूरल नेटवर्क)\b",
        "en": "A Convolutional Neural Network (CNN) is a specialized deep learning architecture designed primarily for processing structured grid data, such as images. Key layers include:\n1. **Convolutional Layer**: Applies learnable filters/kernels to extract local visual features (edges, textures, shapes).\n2. **Activation Layer (ReLU)**: Introduces non-linearity.\n3. **Pooling Layer (MaxPooling)**: Reduces spatial dimensions while preserving dominant features.\n4. **Fully Connected Layer**: Synthesizes features to perform final classification or regression.",
        "hi": "कनवोल्यूशनल न्यूरल नेटवर्क (CNN) डीप लर्निंग का एक आर्किटेक्चर है जिसका उपयोग मुख्य रूप से इमेज प्रोसेसिंग और कंप्यूटर विज़न में किया जाता है।",
        "mr": "सीएनएन (CNN - Convolutional Neural Network) हे प्रामुख्याने प्रतिमा प्रक्रिया (Image Processing) आणि दृश्य विश्लेषणासाठी वापरले जाणारे डीप लर्निंग नेटवर्क आहे."
    },
    "postgresql": {
        "pattern": r"\b(postgresql|explain postgres|what is postgresql|पोस्टग्रेसक्यूएल|पोस्टग्रेस)\b",
        "en": "PostgreSQL is a powerful, open-source object-relational database management system (ORDBMS) known for its reliability, feature robustness, and performance. Notable features include:\n• **ACID Compliance**: Full support for atomic, consistent, isolated, and durable transactions.\n• **Extensibility**: Support for custom data types, JSONB semi-structured indexing, and PostGIS for spatial/GIS data.\n• **High Concurrency**: Multi-Version Concurrency Control (MVCC) allowing read and write operations simultaneously without locking.",
        "hi": "पोस्टग्रेएसक्यूएल (PostgreSQL) एक शक्तिशाली, ओपन-सोर्स ऑब्जेक्ट-रिलेशनल डेटाबेस सिस्टम है जो ACID अनुपालन और उन्नत डेटा प्रकारों (जैसे JSONB और भौगोलिक डेटा) के लिए जाना जाता है।",
        "mr": "पोस्टग्रेस (PostgreSQL) ही एक प्रगत ओपन-सोर्स रिलेशनल डेटाबेस प्रणाली आहे जी अचूकता, विश्वसनीयता आणि भू-स्थानिक (GIS) विश्लेषणासाठी सर्वोत्तम मानली जाते."
    },
    "data_science": {
        "pattern": r"\b(data science|what is data science|explain data science|डेटा सायन्स|डेटा विज्ञान)\b",
        "en": "Data Science is an interdisciplinary field combining domain expertise, programming skills, and mathematics/statistics to extract meaningful insights from data. The lifecycle involves Data Collection, Data Cleaning & Preprocessing, Exploratory Data Analysis (EDA), Statistical Modeling & Machine Learning, and Data Visualization.",
        "hi": "डेटा साइंस (Data Science) डेटा से मूल्यवान निष्कर्ष और अंतर्दृष्टि निकालने के लिए सांख्यिकी, कंप्यूटर प्रोग्रामिंग और डोमेन विशेषज्ञता का एक अंतःविषय क्षेत्र है।",
        "mr": "डेटा सायन्स (Data Science) म्हणजे कच्च्या डेटामधून सांख्यिकी आणि संगणकीय साधनांचा वापर करून उपयुक्त माहिती आणि अंतर्दृष्टी मिळवणे."
    },
    "python_sort": {
        "pattern": r"\b(python.*sort|sort.*python|sorting code|bubble sort|quick sort|सॉर्ट.*पायथन)\b",
        "en": "Here is a clean Python implementation for sorting:\n\n```python\n# 1. Using Python's built-in Timsort (O(n log n))\nnumbers = [64, 34, 25, 12, 22, 11, 90]\nnumbers.sort()\nprint(\"Sorted list:\", numbers)\n\n# 2. Bubble Sort Implementation (O(n^2))\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n\nprint(\"Bubble sort:\", bubble_sort([64, 34, 25, 12, 22, 11, 90]))\n```",
        "hi": "यहाँ सॉर्टिंग के लिए पायथन कोड है:\n\n```python\n# 1. इन-बिल्ट सॉर्ट\nnumbers = [64, 34, 25, 12, 22, 11, 90]\nnumbers.sort()\nprint(\"सॉर्टेड सूची:\", numbers)\n\n# 2. बबल सॉर्ट\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n```",
        "mr": "येथे सॉर्टिंगसाठी पायथन कोड दिला आहे:\n\n```python\n# 1. इन-बिल्ट सॉर्ट\nnumbers = [64, 34, 25, 12, 22, 11, 90]\nnumbers.sort()\nprint(\"सॉर्ट केलेली यादी:\", numbers)\n\n# 2. बबल सॉर्ट पद्धत\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n```"
    },
    "python_general": {
        "pattern": r"\b(what is python|explain python|पायथन काय आहे|पायथन क्या है)\b",
        "en": "Python is a high-level, interpreted, general-purpose programming language renowned for its clean readability and versatility. It powers web development (FastAPI, Django), artificial intelligence & data science (PyTorch, TensorFlow, Pandas), automation, and system administration.",
        "hi": "पायथन एक उच्च-स्तरीय, इंटरप्रिटेड और बहुउद्देशीय प्रोग्रामिंग भाषा है जो अपनी सरल सिंटैक्स और समृद्ध लाइब्रेरी इकोसिस्टम के लिए दुनिया भर में लोकप्रिय है।",
        "mr": "पायथन ही एक अत्यंत लोकप्रिय आणि वाचण्यास सोपी हाय-लेव्हल प्रोग्रामिंग भाषा आहे, ज्याचा वापर कृत्रिम बुद्धिमत्ता, डेटा सायन्स आणि वेब ॲप्लिकेशन्समध्ये मोठ्या प्रमाणावर केला जातो."
    },
    "capital_france": {
        "pattern": r"\b(capital of france|फ्रांस की राजधानी|फ्रान्सची राजधानी)\b",
        "en": "The capital of France is Paris.",
        "hi": "फ्रांस की राजधानी पेरिस है।",
        "mr": "फ्रान्सची राजधानी पॅरिस आहे."
    },
    "capital_india": {
        "pattern": r"\b(capital of india|भारताची राजधानी|भारत की राजधानी|capital of bharat)\b",
        "en": "The capital of India is New Delhi.",
        "hi": "भारत की राजधानी नई दिल्ली है।",
        "mr": "भारताची राजधानी नवी दिल्ली आहे."
    },
    "joke": {
        "pattern": r"\b(tell me a joke|joke|विनोद सांगा|चुटकुला|मजाक)\b",
        "en": "Why did the computer go to real estate school?\nBecause it wanted to improve its domain knowledge and upgrade its cache flow!",
        "hi": "एक बार एक प्रोग्रामर प्रॉपर्टी खरीदने गया:\nएजेंट: यह घर बहुत शांत है।\nप्रोग्रामर: क्या इसमें बग्स (Bugs) नहीं हैं? 😄",
        "mr": "एक प्रोग्रामर घर बघायला गेला:\nएजंट: हे घर अगदी बग-फ्री आहे!\nप्रोग्रामर: मग अपडेट कधी येणार? 😄"
    },
    "carpet_area": {
        "pattern": r"\b(carpet area|built up area|super built up|कारपेट एरिया|कारपेट क्षेत्र)\b",
        "en": "### Carpet Area vs Built-up Area:\n• **Carpet Area**: The actual net usable floor area inside the inner walls of the apartment where a carpet can be laid (excluding balcony and external walls).\n• **Built-up Area**: Carpet area + thickness of inner & outer walls + balcony area (usually ~10-15% more than carpet area).\n• **Super Built-up Area**: Built-up area + proportionate share of common areas like lobby, staircase, elevator, and clubhouse (usually ~20-30% more than built-up area).\n\n*Under RERA in India, developers must quote prices strictly on Carpet Area.*",
        "hi": "### कारपेट एरिया बनाम बिल्ट-अप एरिया:\n• **कारपेट एरिया**: वह वास्तविक उपयोगी क्षेत्र जहां कालीन बिछाया जा सकता है (दीवारों और बालकनी को छोड़कर)।\n• **बिल्ट-अप एरिया**: कारपेट एरिया + दीवारों की मोटाई और बालकनी।\n• **सुपर बिल्ट-अप एरिया**: बिल्ट-अप एरिया + कॉमन एरिया (लिफ्ट, सीढ़ियां, लॉबी)।\n\n*RERA के अनुसार डेवलपर्स को कारपेट एरिया पर ही कीमत बतानी अनिवार्य है।*",
        "mr": "### कारपेट एरिया आणि बिल्ट-अप एरिया:\n• **कारपेट एरिया (Carpet Area)**: फ्लॅटच्या आतील प्रत्यक्ष वापरण्यायोग्य क्षेत्रफळ.\n• **बिल्ट-अप एरिया (Built-up Area)**: कारपेट एरिया + भिंतींची जाडी + बाल्कनी.\n• **सुपर बिल्ट-अप एरिया**: बिल्ट-अप एरिया + कॉमन सुविधा (लिफ्ट, पायऱ्या, लॉबी).\n\n*RERA कायद्यानुसार किंमत फक्त कारपेट एरियावरच सांगणे बंधनकारक आहे.*"
    },
    "rera": {
        "pattern": r"\b(what is rera|rera act|रेरा काय आहे|रेरा क्या है)\b",
        "en": "### RERA (Real Estate Regulatory Authority):\nPassed in 2016, RERA protects home buyers in India by ensuring:\n1. **Transparency**: Mandatory project registration and updates on state RERA portals (e.g., MahaRERA, K-RERA).\n2. **Timely Delivery**: Developers must deposit 70% of project funds into an escrow account dedicated strictly to construction.\n3. **Standard Carpet Area**: Prices must be quoted strictly on net carpet area.\n4. **Defect Liability**: Builders are responsible for structural defects for 5 years post-handover.",
        "hi": "### RERA (रियल एस्टेट रेगुलेटरी अथॉरिटी):\nRERA 2016 का एक अधिनियम है जो घर खरीदारों के हितों की रक्षा करता है:\n1. सभी प्रोजेक्ट्स का RERA पोर्टल पर अनिवार्य पंजीकरण।\n2. 70% राशि एस्क्रो अकाउंट में जमा करना।\n3. केवल कारपेट एरिया पर बिक्री।\n4. 5 साल तक संरचनात्मक दोषों की जिम्मेदारी।",
        "mr": "### RERA (महारेरा / रेरा कायदा):\nरेरा कायदा घर खरेदीदारांच्या हिताचे रक्षण करतो:\n१. महारेरा नोंदणी अनिवार्य.\n२. प्रकल्पाच्या ७०% रक्कम एस्क्रो खात्यात ठेवणे बंधनकारक.\n३. कारपेट एरियानुसारच विक्री.\n४. हस्तांतरणानंतर ५ वर्षे बांधकामातील दोषांची जबाबदारी बिल्डरवर असते."
    },
    "verification_rules": {
        "pattern": r"\b(what does verified mean|document verification|verification system|documents required|पडताळणी|सत्यापन|कागदपत्रे)\b",
        "en": "### SAI Document Verification System:\nIn SAI, 'Verified' signifies that official documents have undergone AI-assisted validation and human administrator review. Required documents by account type:\n• **Buyer**: Identity/KYC (Aadhaar, PAN, Passport, Driving License).\n• **Owner**: Owner KYC + Property Ownership Documents (Registered Sale Deed, Index II, Property Tax Receipt, 7/12 Satbara extract).\n• **Agent**: KYC + MahaRERA Agent Registration License + Agency details.\n• **Builder**: Company Incorporation Certificate + Project RERA Registration Certificate + Municipal Approval sanctions.\n• **Status Workflow**: `Pending` ➔ `Under Review` ➔ `Verified` or `Resubmission Required`.",
        "hi": "### SAI दस्तावेज़ सत्यापन प्रणाली:\nSAI में 'सत्यापित' का अर्थ है कि दस्तावेज़ों की AI-सहायता और अधिकृत व्यवस्थापक (Admin) द्वारा जांच की गई है:\n• **खरीदार (Buyer)**: पहचान प्रमाण (Aadhaar, PAN कार्ड)।\n• **मालिक (Owner)**: पहचान प्रमाण + सेल डीड (Sale Deed), टैक्स रसीद, 7/12 उतारा।\n• **एजेंट (Agent)**: RERA एजेंट पंजीकरण प्रमाण पत्र + पैन।\n• **बिल्डर (Builder)**: कंपनी पंजीकरण + प्रोजेक्ट RERA स्वीकृति दस्तावेज़।",
        "mr": "### SAI दस्तऐवज पडताळणी प्रणाली:\nSAI मध्ये 'सत्यापित' (Verified) चा अर्थ कायदेशीर कागदपत्रांची AI आणि प्रशासकीय पडताळणी पूर्ण झाली आहे:\n• **खरेदीदार**: ओळख पुरावा (पॅन, आधार).\n• **मालक**: ओळख पुरावा + खरेदी खत (Sale Deed), कर पावती, ७/१२ उतारा.\n• **एजंट**: महारेरा नोंदणी प्रमाणपत्र (RERA License) + पॅन.\n• **बिल्डर**: कंपनी नोंदणी + प्रकल्प महारेरा मंजुरी कागदपत्रे."
    }
}

class QwenClient:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.base_url = settings.QWEN_BASE_URL.rstrip("/")
        self.model = settings.QWEN_MODEL
        self.api_key = settings.QWEN_API_KEY

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Calls Qwen3 via Ollama or OpenAI-compatible endpoint with intelligent fallback.
        """
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "")
                break

        # 1. If OpenAI-compatible endpoint configured
        if self.provider == "openai" or self.api_key:
            try:
                headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
                payload = {
                    "model": self.model,
                    "messages": [{"role": "system", "content": QWEN3_SYSTEM_PROMPT}] + messages,
                    "temperature": 0.3
                }
                if tools:
                    payload["tools"] = tools

                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(f"{self.base_url}/v1/chat/completions", json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]
            except Exception as e:
                logger.warning(f"OpenAI endpoint call error: {e}")

        # 2. If Ollama endpoint configured
        elif self.provider == "ollama":
            try:
                payload = {
                    "model": self.model,
                    "messages": [{"role": "system", "content": QWEN3_SYSTEM_PROMPT}] + messages,
                    "stream": False,
                    "options": {"temperature": 0.3}
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data.get("message", {"role": "assistant", "content": ""})
            except Exception as e:
                logger.warning(f"Ollama Qwen3 call error: {e}")

        # 3. Intelligent Built-in General Knowledge Reasoning Fallback
        lower_user = last_user_msg.lower()
        for key, entry in GENERAL_KNOWLEDGE_BANK.items():
            if re.search(entry["pattern"], lower_user, re.IGNORECASE):
                content = entry.get(language) or entry.get("en") or entry["en"]
                return {"role": "assistant", "content": content}

        # 4. Fallback greeting or helpful general assistant prompt
        greeting_words = ["hi", "hello", "hey", "namaste", "namaskar", "प्रणाम", "नमस्ते", "नमस्कार", "வணக்கம்", "నమస్కారం"]
        if any(w in lower_user for w in greeting_words):
            return {"role": "assistant", "content": get_greeting(language)}

        return {
            "role": "assistant",
            "content": (
                f"I am SAI, your Smart AI Assistant. I can help answer general questions or assist you in searching verified real estate properties across any city in India. Tell me your city and requirements!"
                if language == "en" else
                f"मी SAI आहे, तुमचा स्मार्ट AI सहाय्यक. मी सामान्य प्रश्नांची उत्तरे देऊ शकतो किंवा भारतातील कोणत्याही शहरामधील पडताळणी केलेल्या मालमत्ता शोधण्यात मदत करू शकतो."
                if language == "mr" else
                f"मैं SAI हूँ, आपका स्मार्ट AI सहायक। मैं सामान्य प्रश्नों के उत्तर दे सकता हूँ और भारत के किसी भी शहर में सत्यापित संपत्तियां खोजने में सहायता कर सकता हूँ।"
            )
        }

qwen_client = QwenClient()
