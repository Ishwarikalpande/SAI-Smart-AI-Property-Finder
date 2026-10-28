export interface LocationEntity {
  name: string;
  city: string;
  locality: string;
  state: string;
  lat: number;
  lng: number;
  aliases: string[];
  formattedAddress: string;
}

export const INDIAN_LOCATIONS_DB: LocationEntity[] = [
  // ── PUNE LOCALITIES ──
  { name: "Baner", city: "Pune", locality: "Baner", state: "Maharashtra", lat: 18.5596, lng: 73.7799, aliases: ["baner", "बाणेर", "baner pune", "baner road", "baner gaon"], formattedAddress: "Baner, Pune, Maharashtra" },
  { name: "Wakad", city: "Pune", locality: "Wakad", state: "Maharashtra", lat: 18.5987, lng: 73.7661, aliases: ["wakad", "वाकड", "wakad pune", "dange chowk wakad", "kaspate vasti wakad"], formattedAddress: "Wakad, Pune, Maharashtra" },
  { name: "Hinjewadi", city: "Pune", locality: "Hinjewadi", state: "Maharashtra", lat: 18.5913, lng: 73.7389, aliases: ["hinjewadi", "हिंजवडी", "hinjawadi", "hinjewadi phase 1", "hinjewadi phase 2", "hinjewadi phase 3", "hinjewadi it park"], formattedAddress: "Hinjewadi IT Park, Pune, Maharashtra" },
  { name: "Kharadi", city: "Pune", locality: "Kharadi", state: "Maharashtra", lat: 18.5516, lng: 73.9349, aliases: ["kharadi", "खराडी", "kharadi pune", "eon it park kharadi", "world trade center kharadi"], formattedAddress: "Kharadi, Pune, Maharashtra" },
  { name: "Kothrud", city: "Pune", locality: "Kothrud", state: "Maharashtra", lat: 18.5074, lng: 73.8077, aliases: ["kothrud", "कोथरूड", "kothrud pune", "paud road kothrud", "karve statue kothrud", "chandani chowk kothrud"], formattedAddress: "Kothrud, Pune, Maharashtra" },
  { name: "Viman Nagar", city: "Pune", locality: "Viman Nagar", state: "Maharashtra", lat: 18.5679, lng: 73.9143, aliases: ["viman nagar", "विमान नगर", "viman nagar pune", "phoenix marketcity viman nagar"], formattedAddress: "Viman Nagar, Pune, Maharashtra" },
  { name: "Hadapsar", city: "Pune", locality: "Hadapsar", state: "Maharashtra", lat: 18.5089, lng: 73.9259, aliases: ["hadapsar", "हडपसर", "magarpatta city hadapsar", "amanora hadapsar", "hadapsar pune"], formattedAddress: "Hadapsar, Pune, Maharashtra" },
  { name: "Aundh", city: "Pune", locality: "Aundh", state: "Maharashtra", lat: 18.5580, lng: 73.8075, aliases: ["aundh", "औंध", "aundh pune", "iti road aundh"], formattedAddress: "Aundh, Pune, Maharashtra" },
  { name: "Bavdhan", city: "Pune", locality: "Bavdhan", state: "Maharashtra", lat: 18.5132, lng: 73.7705, aliases: ["bavdhan", "बावधन", "bavdhan pune", "bavdhan khurd", "bavdhan budruk"], formattedAddress: "Bavdhan, Pune, Maharashtra" },
  { name: "Balewadi", city: "Pune", locality: "Balewadi", state: "Maharashtra", lat: 18.5772, lng: 73.7709, aliases: ["balewadi", "बालेवाडी", "balewadi high street", "balewadi stadium", "balewadi pune"], formattedAddress: "Balewadi, Pune, Maharashtra" },
  { name: "Pimple Saudagar", city: "Pune", locality: "Pimple Saudagar", state: "Maharashtra", lat: 18.5986, lng: 73.7978, aliases: ["pimple saudagar", "पिंपळे सौदागर", "saudagar pune"], formattedAddress: "Pimple Saudagar, Pune, Maharashtra" },
  { name: "Pimple Nilakh", city: "Pune", locality: "Pimple Nilakh", state: "Maharashtra", lat: 18.5786, lng: 73.7915, aliases: ["pimple nilakh", "पिंपळे निलख", "nilakh pune"], formattedAddress: "Pimple Nilakh, Pune, Maharashtra" },
  { name: "Shivaji Nagar", city: "Pune", locality: "Shivaji Nagar", state: "Maharashtra", lat: 18.5308, lng: 73.8475, aliases: ["shivaji nagar", "शिवाजी नगर", "shivajinagar", "shivajinagar pune"], formattedAddress: "Shivaji Nagar, Pune, Maharashtra" },
  { name: "Koregaon Park", city: "Pune", locality: "Koregaon Park", state: "Maharashtra", lat: 18.5362, lng: 73.8940, aliases: ["koregaon park", "कोरेगाव पार्क", "kp pune", "north main road koregaon park"], formattedAddress: "Koregaon Park, Pune, Maharashtra" },
  { name: "Kalyani Nagar", city: "Pune", locality: "Kalyani Nagar", state: "Maharashtra", lat: 18.5492, lng: 73.9037, aliases: ["kalyani nagar", "कल्याणी नगर", "kalyani nagar pune"], formattedAddress: "Kalyani Nagar, Pune, Maharashtra" },
  { name: "Ravet", city: "Pune", locality: "Ravet", state: "Maharashtra", lat: 18.6534, lng: 73.7438, aliases: ["ravet", "रावेत", "ravet pune", "ravet pcmc", "kiwale ravet"], formattedAddress: "Ravet, PCMC Pune, Maharashtra" },
  { name: "Tathawade", city: "Pune", locality: "Tathawade", state: "Maharashtra", lat: 18.6186, lng: 73.7548, aliases: ["tathawade", "ताथवडे", "tathawade pune", "dpu tathawade"], formattedAddress: "Tathawade, Pune, Maharashtra" },
  { name: "Pashan", city: "Pune", locality: "Pashan", state: "Maharashtra", lat: 18.5398, lng: 73.7932, aliases: ["pashan", "पाषाण", "pashan pune", "pashan sus road"], formattedAddress: "Pashan, Pune, Maharashtra" },
  { name: "Wagholi", city: "Pune", locality: "Wagholi", state: "Maharashtra", lat: 18.5793, lng: 73.9806, aliases: ["wagholi", "वाघोली", "wagholi pune", "nagar road wagholi"], formattedAddress: "Wagholi, Pune, Maharashtra" },
  { name: "Undri", city: "Pune", locality: "Undri", state: "Maharashtra", lat: 18.4619, lng: 73.9149, aliases: ["undri", "उंड्री", "undri pune", "undri pisoli"], formattedAddress: "Undri, Pune, Maharashtra" },
  { name: "Katraj", city: "Pune", locality: "Katraj", state: "Maharashtra", lat: 18.4575, lng: 73.8677, aliases: ["katraj", "कात्रज", "katraj pune", "katraj ghat", "katraj zoo"], formattedAddress: "Katraj, Pune, Maharashtra" },
  { name: "Magarpatta", city: "Pune", locality: "Magarpatta", state: "Maharashtra", lat: 18.5158, lng: 73.9272, aliases: ["magarpatta", "मगरपट्टा", "magarpatta city", "cybercity magarpatta"], formattedAddress: "Magarpatta City, Hadapsar, Pune" },
  { name: "Dhanori", city: "Pune", locality: "Dhanori", state: "Maharashtra", lat: 18.5866, lng: 73.8967, aliases: ["dhanori", "धानोरी", "dhanori pune", "tingre nagar dhanori"], formattedAddress: "Dhanori, Pune, Maharashtra" },
  { name: "Pimpri", city: "Pune", locality: "Pimpri", state: "Maharashtra", lat: 18.6298, lng: 73.7997, aliases: ["pimpri", "पिंपरी", "pimpri chinchwad", "pcmc"], formattedAddress: "Pimpri, PCMC Pune, Maharashtra" },
  { name: "Chinchwad", city: "Pune", locality: "Chinchwad", state: "Maharashtra", lat: 18.6279, lng: 73.7831, aliases: ["chinchwad", "चिंचवड", "chinchwad station", "thergaon chinchwad"], formattedAddress: "Chinchwad, Pune, Maharashtra" },
  { name: "Chakan", city: "Pune", locality: "Chakan", state: "Maharashtra", lat: 18.7606, lng: 73.8636, aliases: ["chakan", "चाकण", "chakan midc", "chakan pune"], formattedAddress: "Chakan MIDC, Pune, Maharashtra" },
  { name: "Moshi", city: "Pune", locality: "Moshi", state: "Maharashtra", lat: 18.6756, lng: 73.8436, aliases: ["moshi", "मोशी", "moshi pune", "moshi pradhikaran"], formattedAddress: "Moshi, Pune, Maharashtra" },
  { name: "Karve Nagar", city: "Pune", locality: "Karve Nagar", state: "Maharashtra", lat: 18.4908, lng: 73.8184, aliases: ["karve nagar", "कर्वे नगर", "karvenagar pune"], formattedAddress: "Karve Nagar, Pune, Maharashtra" },
  { name: "Swargate", city: "Pune", locality: "Swargate", state: "Maharashtra", lat: 18.5018, lng: 73.8636, aliases: ["swargate", "स्वारगेट", "swargate pune"], formattedAddress: "Swargate, Pune, Maharashtra" },
  { name: "Deccan", city: "Pune", locality: "Deccan Gymkhana", state: "Maharashtra", lat: 18.5167, lng: 73.8415, aliases: ["deccan", "डेक्कन", "deccan gymkhana", "fc road deccan", "jm road"], formattedAddress: "Deccan Gymkhana, FC Road, Pune" },

  // ── MUMBAI LOCALITIES ──
  { name: "Andheri", city: "Mumbai", locality: "Andheri West", state: "Maharashtra", lat: 19.1136, lng: 72.8697, aliases: ["andheri", "अंधेरी", "andheri west", "andheri east", "lokhandwala andheri", "dn nagar andheri"], formattedAddress: "Andheri, Mumbai, Maharashtra" },
  { name: "Bandra", city: "Mumbai", locality: "Bandra West", state: "Maharashtra", lat: 19.0596, lng: 72.8295, aliases: ["bandra", "वांद्रे", "bandra west", "bandra east", "carter road bandra", "bandstand bandra", "pali hill bandra"], formattedAddress: "Bandra, Mumbai, Maharashtra" },
  { name: "BKC", city: "Mumbai", locality: "Bandra Kurla Complex", state: "Maharashtra", lat: 19.0667, lng: 72.8679, aliases: ["bkc", "bandra kurla complex", "बीकेसी", "bkc mumbai"], formattedAddress: "Bandra Kurla Complex (BKC), Mumbai" },
  { name: "Powai", city: "Mumbai", locality: "Powai", state: "Maharashtra", lat: 19.1176, lng: 72.9060, aliases: ["powai", "पवई", "hiranandani powai", "powai lake", "iit bombay powai"], formattedAddress: "Powai, Mumbai, Maharashtra" },
  { name: "Juhu", city: "Mumbai", locality: "Juhu", state: "Maharashtra", lat: 19.1075, lng: 72.8263, aliases: ["juhu", "जुहू", "juhu beach", "juhu tara road", "vile parle juhu"], formattedAddress: "Juhu, Mumbai, Maharashtra" },
  { name: "Thane", city: "Mumbai", locality: "Thane West", state: "Maharashtra", lat: 19.2183, lng: 72.9781, aliases: ["thane", "ठाणे", "thane west", "ghodbunder road thane", "majiwada thane", "hiranandani estate thane", "thane east"], formattedAddress: "Thane, Mumbai MMR, Maharashtra" },
  { name: "Borivali", city: "Mumbai", locality: "Borivali West", state: "Maharashtra", lat: 19.2307, lng: 72.8567, aliases: ["borivali", "बोरिवली", "borivali west", "borivali east", "ic colony borivali"], formattedAddress: "Borivali, Mumbai, Maharashtra" },
  { name: "Goregaon", city: "Mumbai", locality: "Goregaon East", state: "Maharashtra", lat: 19.1663, lng: 72.8526, aliases: ["goregaon", "गोरेगाव", "goregaon east", "goregaon west", "oberoi mall goregaon"], formattedAddress: "Goregaon, Mumbai, Maharashtra" },
  { name: "Malad", city: "Mumbai", locality: "Malad West", state: "Maharashtra", lat: 19.1874, lng: 72.8484, aliases: ["malad", "मालाड", "malad west", "mindspace malad", "malad east", "infinity mall malad"], formattedAddress: "Malad, Mumbai, Maharashtra" },
  { name: "Kandivali", city: "Mumbai", locality: "Kandivali East", state: "Maharashtra", lat: 19.2045, lng: 72.8522, aliases: ["kandivali", "कांदिवली", "kandivali east", "lokhandwala kandivali", "kandivali west"], formattedAddress: "Kandivali, Mumbai, Maharashtra" },
  { name: "Dadar", city: "Mumbai", locality: "Dadar West", state: "Maharashtra", lat: 19.0178, lng: 72.8478, aliases: ["dadar", "दादर", "dadar tt", "shivaji park dadar", "dadar west", "dadar east"], formattedAddress: "Dadar, Mumbai, Maharashtra" },
  { name: "Worli", city: "Mumbai", locality: "Worli Sea Face", state: "Maharashtra", lat: 19.0134, lng: 72.8153, aliases: ["worli", "वरळी", "worli sea face", "worli sea link", "lower parel worli"], formattedAddress: "Worli, Mumbai, Maharashtra" },
  { name: "Lower Parel", city: "Mumbai", locality: "Lower Parel", state: "Maharashtra", lat: 18.9953, lng: 72.8312, aliases: ["lower parel", "लोअर परळ", "high street phoenix lower parel", "curry road lower parel"], formattedAddress: "Lower Parel, Mumbai, Maharashtra" },
  { name: "Colaba", city: "Mumbai", locality: "Colaba", state: "Maharashtra", lat: 18.9067, lng: 72.8147, aliases: ["colaba", "कुलाबा", "colaba causeway", "gateway of india colaba", "cuffe parade"], formattedAddress: "Colaba, South Mumbai, Maharashtra" },
  { name: "Navi Mumbai", city: "Mumbai", locality: "Vashi Navi Mumbai", state: "Maharashtra", lat: 19.0330, lng: 73.0297, aliases: ["navi mumbai", "नवी मुंबई", "vashi", "वाशी", "kharghar", "खारघर", "panvel", "पनवेल", "nerul", "नेरूळ", "belapur"], formattedAddress: "Navi Mumbai, Maharashtra" },

  // ── BANGALORE LOCALITIES ──
  { name: "Whitefield", city: "Bangalore", locality: "Whitefield", state: "Karnataka", lat: 12.9698, lng: 77.7499, aliases: ["whitefield", "व्हाइटफील्ड", "వైట్‌ఫీల్డ్", "ವೈಟ್‌ಫೀಲ್ಡ್", "itpl whitefield", "kadugodi whitefield"], formattedAddress: "Whitefield, Bengaluru, Karnataka" },
  { name: "Koramangala", city: "Bangalore", locality: "Koramangala", state: "Karnataka", lat: 12.9352, lng: 77.6245, aliases: ["koramangala", "कोरोमंगला", "ಕೋರಮಂಗಲ", "koramangala 4th block", "koramangala 5th block", "koramangala 6th block"], formattedAddress: "Koramangala, Bengaluru, Karnataka" },
  { name: "Indiranagar", city: "Bangalore", locality: "Indiranagar", state: "Karnataka", lat: 12.9784, lng: 77.6408, aliases: ["indiranagar", "इंदिरानगर", "ಇಂದಿರಾನಗರ", "100 feet road indiranagar", "12th main indiranagar"], formattedAddress: "Indiranagar, Bengaluru, Karnataka" },
  { name: "HSR Layout", city: "Bangalore", locality: "HSR Layout", state: "Karnataka", lat: 12.9121, lng: 77.6446, aliases: ["hsr layout", "एचएसआर लेआउट", "hsr", "hsr sector 1", "hsr sector 2", "hsr sector 3"], formattedAddress: "HSR Layout, Bengaluru, Karnataka" },
  { name: "Electronic City", city: "Bangalore", locality: "Electronic City", state: "Karnataka", lat: 12.8399, lng: 77.6770, aliases: ["electronic city", "इलेक्ट्रॉनिक सिटी", "ecity", "electronic city phase 1", "electronic city phase 2"], formattedAddress: "Electronic City, Bengaluru, Karnataka" },
  { name: "Marathahalli", city: "Bangalore", locality: "Marathahalli", state: "Karnataka", lat: 12.9569, lng: 77.7011, aliases: ["marathahalli", "मराठाहल्ली", "marathahalli bridge", "outer ring road marathahalli"], formattedAddress: "Marathahalli, Bengaluru, Karnataka" },
  { name: "Bellandur", city: "Bangalore", locality: "Bellandur", state: "Karnataka", lat: 12.9304, lng: 77.6784, aliases: ["bellandur", "बेलंदूर", "bellandur orr", "ecospace bellandur"], formattedAddress: "Bellandur, Bengaluru, Karnataka" },
  { name: "Sarjapur", city: "Bangalore", locality: "Sarjapur Road", state: "Karnataka", lat: 12.9105, lng: 77.6850, aliases: ["sarjapur", "सरजापुर", "sarjapur road", "carmelaram sarjapur"], formattedAddress: "Sarjapur Road, Bengaluru, Karnataka" },
  { name: "Hebbal", city: "Bangalore", locality: "Hebbal", state: "Karnataka", lat: 13.0358, lng: 77.5970, aliases: ["hebbal", "हेब्बल", "hebbal flyover", "manyata tech park hebbal"], formattedAddress: "Hebbal, Bengaluru, Karnataka" },
  { name: "Yelahanka", city: "Bangalore", locality: "Yelahanka", state: "Karnataka", lat: 13.1007, lng: 77.5963, aliases: ["yelahanka", "येलहंका", "yelahanka new town"], formattedAddress: "Yelahanka, Bengaluru, Karnataka" },
  { name: "JP Nagar", city: "Bangalore", locality: "JP Nagar", state: "Karnataka", lat: 12.9063, lng: 77.5857, aliases: ["jp nagar", "जेपी नगर", "jayaprakash nagar", "jp nagar 6th phase"], formattedAddress: "JP Nagar, Bengaluru, Karnataka" },
  { name: "Jayanagar", city: "Bangalore", locality: "Jayanagar", state: "Karnataka", lat: 12.9308, lng: 77.5838, aliases: ["jayanagar", "जयनगर", "jayanagar 4th block", "jayanagar 9th block"], formattedAddress: "Jayanagar, Bengaluru, Karnataka" },

  // ── HYDERABAD LOCALITIES ──
  { name: "Gachibowli", city: "Hyderabad", locality: "Gachibowli", state: "Telangana", lat: 17.4401, lng: 78.3489, aliases: ["gachibowli", "गच्चीबावली", "గచ్చిబౌలి", "gachibowli stadium", "financial district gachibowli"], formattedAddress: "Gachibowli, Hyderabad, Telangana" },
  { name: "Hitec City", city: "Hyderabad", locality: "Hitec City", state: "Telangana", lat: 17.4435, lng: 78.3772, aliases: ["hitec city", "हाईटेक सिटी", "cyber towers hitec city", "mindspace hitec city", "hitex"], formattedAddress: "Hitec City, Cyberabad, Hyderabad" },
  { name: "Madhapur", city: "Hyderabad", locality: "Madhapur", state: "Telangana", lat: 17.4483, lng: 78.3915, aliases: ["madhapur", "माधापुर", "మాదాపూర్", "inorbit mall madhapur"], formattedAddress: "Madhapur, Hyderabad, Telangana" },
  { name: "Jubilee Hills", city: "Hyderabad", locality: "Jubilee Hills", state: "Telangana", lat: 17.4319, lng: 78.4073, aliases: ["jubilee hills", "जुबली हिल्स", "road no 36 jubilee hills", "road no 45 jubilee hills"], formattedAddress: "Jubilee Hills, Hyderabad, Telangana" },
  { name: "Banjara Hills", city: "Hyderabad", locality: "Banjara Hills", state: "Telangana", lat: 17.4156, lng: 78.4357, aliases: ["banjara hills", "बंजारा हिल्स", "road no 1 banjara hills", "road no 12 banjara hills"], formattedAddress: "Banjara Hills, Hyderabad, Telangana" },
  { name: "Kondapur", city: "Hyderabad", locality: "Kondapur", state: "Telangana", lat: 17.4646, lng: 78.3620, aliases: ["kondapur", "कोंडापुर", "కొండాపూర్", "botanical garden kondapur"], formattedAddress: "Kondapur, Hyderabad, Telangana" },
  { name: "Kukatpally", city: "Hyderabad", locality: "Kukatpally", state: "Telangana", lat: 17.4849, lng: 78.4138, aliases: ["kukatpally", "कूकटपल्ली", "kphb colony", "kukatpally housing board"], formattedAddress: "Kukatpally (KPHB), Hyderabad" },
  { name: "Miyapur", city: "Hyderabad", locality: "Miyapur", state: "Telangana", lat: 17.4969, lng: 78.3547, aliases: ["miyapur", "मियापुर", "miyapur metro", "allwyn junction miyapur"], formattedAddress: "Miyapur, Hyderabad, Telangana" },
  { name: "Manikonda", city: "Hyderabad", locality: "Manikonda", state: "Telangana", lat: 17.3986, lng: 78.3887, aliases: ["manikonda", "मणिकोंडा", "puppalguda manikonda", "lanco hills manikonda"], formattedAddress: "Manikonda, Hyderabad, Telangana" },
  { name: "Begumpet", city: "Hyderabad", locality: "Begumpet", state: "Telangana", lat: 17.4447, lng: 78.4664, aliases: ["begumpet", "बेगमपेट", "begumpet airport", "prakash nagar begumpet"], formattedAddress: "Begumpet, Hyderabad, Telangana" },

  // ── CHENNAI LOCALITIES ──
  { name: "OMR", city: "Chennai", locality: "Old Mahabalipuram Road", state: "Tamil Nadu", lat: 12.9345, lng: 80.2312, aliases: ["omr", "ஓஎம்ஆர்", "old mahabalipuram road", "it corridor omr", "thiruvanmiyur omr", "sholinganallur omr"], formattedAddress: "OMR (IT Corridor), Chennai, Tamil Nadu" },
  { name: "Velachery", city: "Chennai", locality: "Velachery", state: "Tamil Nadu", lat: 12.9759, lng: 80.2212, aliases: ["velachery", "வேளச்சேரி", "phoenix marketcity chennai velachery", "velachery main road"], formattedAddress: "Velachery, Chennai, Tamil Nadu" },
  { name: "Anna Nagar", city: "Chennai", locality: "Anna Nagar", state: "Tamil Nadu", lat: 13.0850, lng: 80.2101, aliases: ["anna nagar", "அண்ணா நகர்", "anna nagar west", "anna nagar east", "anna arch"], formattedAddress: "Anna Nagar, Chennai, Tamil Nadu" },
  { name: "Adyar", city: "Chennai", locality: "Adyar", state: "Tamil Nadu", lat: 13.0012, lng: 80.2565, aliases: ["adyar", "அடையாறு", "adyar bridge", "gandhi nagar adyar", "kasturba nagar adyar"], formattedAddress: "Adyar, Chennai, Tamil Nadu" },
  { name: "T Nagar", city: "Chennai", locality: "Thyagaraya Nagar", state: "Tamil Nadu", lat: 13.0418, lng: 80.2341, aliases: ["t nagar", "தி நகர்", "t. nagar", "thyagaraya nagar", "pondv bazaar t nagar"], formattedAddress: "T. Nagar, Chennai, Tamil Nadu" },
  { name: "Guindy", city: "Chennai", locality: "Guindy", state: "Tamil Nadu", lat: 13.0067, lng: 80.2025, aliases: ["guindy", "கிண்டி", "guindy industrial estate", "olympia tech park guindy"], formattedAddress: "Guindy, Chennai, Tamil Nadu" },

  // ── DELHI NCR LOCALITIES ──
  { name: "Connaught Place", city: "Delhi NCR", locality: "Connaught Place", state: "Delhi", lat: 28.6315, lng: 77.2167, aliases: ["connaught place", "कनॉट प्लेस", "cp delhi", "rajiv chowk cp", "inner circle cp", "outer circle cp"], formattedAddress: "Connaught Place (CP), Central Delhi" },
  { name: "Dwarka", city: "Delhi NCR", locality: "Dwarka", state: "Delhi", lat: 28.5921, lng: 77.0460, aliases: ["dwarka", "द्वारका", "dwarka sector 10", "dwarka sector 12", "dwarka sector 21", "dwarka expressway"], formattedAddress: "Dwarka, South West Delhi" },
  { name: "Saket", city: "Delhi NCR", locality: "Saket", state: "Delhi", lat: 28.5244, lng: 77.2167, aliases: ["saket", "साकेत", "select citywalk saket", "saket district centre"], formattedAddress: "Saket, South Delhi" },
  { name: "Vasant Kunj", city: "Delhi NCR", locality: "Vasant Kunj", state: "Delhi", lat: 28.5293, lng: 77.1539, aliases: ["vasant kunj", "वसंत कुंज", "ambiance mall vasant kunj", "promenade vasant kunj"], formattedAddress: "Vasant Kunj, South Delhi" },
  { name: "Rohini", city: "Delhi NCR", locality: "Rohini", state: "Delhi", lat: 28.7495, lng: 77.0565, aliases: ["rohini", "रोहिणी", "rohini sector 13", "rohini sector 24", "rithala rohini"], formattedAddress: "Rohini, North West Delhi" },
  { name: "Hauz Khas", city: "Delhi NCR", locality: "Hauz Khas", state: "Delhi", lat: 28.5494, lng: 77.2001, aliases: ["hauz khas", "हौज खास", "hkv", "hauz khas village"], formattedAddress: "Hauz Khas, South Delhi" },
  { name: "Greater Kailash", city: "Delhi NCR", locality: "Greater Kailash", state: "Delhi", lat: 28.5482, lng: 77.2384, aliases: ["greater kailash", "ग्रेटर कैलाश", "gk 1", "gk 2", "m block gk"], formattedAddress: "Greater Kailash (GK), South Delhi" },
  { name: "Lajpat Nagar", city: "Delhi NCR", locality: "Lajpat Nagar", state: "Delhi", lat: 28.5677, lng: 77.2433, aliases: ["lajpat nagar", "लाजपत नगर", "central market lajpat nagar"], formattedAddress: "Lajpat Nagar, South Delhi" },

  // ── NOIDA LOCALITIES ──
  { name: "Sector 62", city: "Noida", locality: "Sector 62", state: "Uttar Pradesh", lat: 28.6279, lng: 77.3639, aliases: ["sector 62", "सेक्टर 62", "sector 62 noida", "noida sector 62"], formattedAddress: "Sector 62, Noida, Uttar Pradesh" },
  { name: "Sector 137", city: "Noida", locality: "Sector 137", state: "Uttar Pradesh", lat: 28.5089, lng: 77.4042, aliases: ["sector 137", "सेक्टर 137", "sector 137 noida", "noida expressway sector 137"], formattedAddress: "Sector 137, Noida Expressway, Uttar Pradesh" },
  { name: "Sector 150", city: "Noida", locality: "Sector 150", state: "Uttar Pradesh", lat: 28.4350, lng: 77.4810, aliases: ["sector 150", "सेक्टर 150", "sector 150 noida", "sports city sector 150"], formattedAddress: "Sector 150, Noida, Uttar Pradesh" },
  { name: "Sector 18", city: "Noida", locality: "Sector 18", state: "Uttar Pradesh", lat: 28.5708, lng: 77.3271, aliases: ["sector 18", "सेक्टर 18", "sector 18 noida", "atta market noida", "dlf mall of india noida"], formattedAddress: "Sector 18 (Atta Market), Noida" },
  { name: "Noida Extension", city: "Noida", locality: "Greater Noida West", state: "Uttar Pradesh", lat: 28.5992, lng: 77.4475, aliases: ["noida extension", "नोएडा एक्सटेंशन", "greater noida west", "gaur city"], formattedAddress: "Noida Extension (Greater Noida West)" },

  // ── GURGAON LOCALITIES ──
  { name: "Golf Course Rd", city: "Gurgaon", locality: "Golf Course Road", state: "Haryana", lat: 28.4595, lng: 77.0988, aliases: ["golf course rd", "गॉल्फ कोर्स रोड", "golf course road", "dlf golf course road gurgaon"], formattedAddress: "Golf Course Road, DLF Phase 5, Gurgaon" },
  { name: "Cyber City", city: "Gurgaon", locality: "DLF Cyber City", state: "Haryana", lat: 28.4952, lng: 77.0895, aliases: ["cyber city", "साइबर सिटी", "dlf cyber city", "cyber hub gurgaon"], formattedAddress: "DLF Cyber City & Cyber Hub, Gurgaon" },
  { name: "Sector 56", city: "Gurgaon", locality: "Sector 56", state: "Haryana", lat: 28.4305, lng: 77.1065, aliases: ["sector 56", "सेक्टर 56", "sector 56 gurgaon", "rapid metro sector 56"], formattedAddress: "Sector 56, Gurgaon, Haryana" },
  { name: "Sohna Road", city: "Gurgaon", locality: "Sohna Road", state: "Haryana", lat: 28.4069, lng: 77.0426, aliases: ["sohna road", "सोहना रोड", "sohna road gurgaon", "subhash chowk sohna road"], formattedAddress: "Sohna Road, Gurgaon, Haryana" },
  { name: "DLF Phase 5", city: "Gurgaon", locality: "DLF Phase 5", state: "Haryana", lat: 28.4623, lng: 77.0921, aliases: ["dlf phase 5", "डीएलएफ फेज 5", "phase 5 gurgaon", "the aralias dlf phase 5"], formattedAddress: "DLF Phase 5, Gurgaon, Haryana" },

  // ── AHMEDABAD LOCALITIES ──
  { name: "SG Highway", city: "Ahmedabad", locality: "SG Highway", state: "Gujarat", lat: 23.0489, lng: 72.5074, aliases: ["sg highway", "एसजी हाईवे", "sarkhej gandhinagar highway", "sg road ahmedabad"], formattedAddress: "SG Highway, Ahmedabad, Gujarat" },
  { name: "Satellite", city: "Ahmedabad", locality: "Satellite", state: "Gujarat", lat: 23.0304, lng: 72.5178, aliases: ["satellite", "સેટેલાઇટ", "satellite ahmedabad", "jodhpur cross road satellite"], formattedAddress: "Satellite, Ahmedabad, Gujarat" },
  { name: "Bopal", city: "Ahmedabad", locality: "Bopal", state: "Gujarat", lat: 23.0336, lng: 72.4641, aliases: ["bopal", "બોપલ", "south bopal", "sobo bopal", "bopal ahmedabad"], formattedAddress: "Bopal, Ahmedabad, Gujarat" },
  { name: "Prahlad Nagar", city: "Ahmedabad", locality: "Prahlad Nagar", state: "Gujarat", lat: 23.0135, lng: 72.5083, aliases: ["prahlad nagar", "પ્રહલાદ નગર", "prahladnagar garden"], formattedAddress: "Prahlad Nagar, Ahmedabad, Gujarat" },
  { name: "Bodakdev", city: "Ahmedabad", locality: "Bodakdev", state: "Gujarat", lat: 23.0416, lng: 72.5186, aliases: ["bodakdev", "બોડકદેવ", "bodakdev ahmedabad", "judges bungalow bodakdev"], formattedAddress: "Bodakdev, Ahmedabad, Gujarat" },

  // ── KOLKATA LOCALITIES ──
  { name: "Salt Lake", city: "Kolkata", locality: "Salt Lake Sector 5", state: "West Bengal", lat: 22.5807, lng: 88.4173, aliases: ["salt lake", "সল্টলেক", "salt lake city", "sector 5 salt lake", "bidhannagar salt lake"], formattedAddress: "Salt Lake City (Bidhannagar), Kolkata" },
  { name: "New Town", city: "Kolkata", locality: "New Town", state: "West Bengal", lat: 22.5958, lng: 88.4796, aliases: ["new town", "নিউ টাউন", "new town kolkata", "action area 1 new town", "ecospace new town"], formattedAddress: "New Town (Rajarhat), Kolkata" },
  { name: "Rajarhat", city: "Kolkata", locality: "Rajarhat Main Road", state: "West Bengal", lat: 22.6139, lng: 88.4697, aliases: ["rajarhat", "রাজারহাট", "rajarhat kolkata", "chinar park rajarhat"], formattedAddress: "Rajarhat, Kolkata, West Bengal" },
  { name: "Ballygunge", city: "Kolkata", locality: "Ballygunge", state: "West Bengal", lat: 22.5280, lng: 88.3654, aliases: ["ballygunge", "বালিগঞ্জ", "ballygunge circular road", "ballygunge phari"], formattedAddress: "Ballygunge, South Kolkata, West Bengal" },
  { name: "Park Street", city: "Kolkata", locality: "Park Street", state: "West Bengal", lat: 22.5535, lng: 88.3533, aliases: ["park street", "পার্ক স্ট্রিট", "mother teresa sarani", "park street kolkata"], formattedAddress: "Park Street, Central Kolkata, West Bengal" },

  // ── MAJOR CITIES DIRECT PINS ──
  { name: "Pune", city: "Pune", locality: "Central Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, aliases: ["pune", "पुणे", "poona", "pune city", "punecity"], formattedAddress: "Pune, Maharashtra, India" },
  { name: "Mumbai", city: "Mumbai", locality: "Mumbai Central", state: "Maharashtra", lat: 19.0760, lng: 72.8777, aliases: ["mumbai", "मुंबई", "bombay", "mumbai city"], formattedAddress: "Mumbai, Maharashtra, India" },
  { name: "Bangalore", city: "Bangalore", locality: "Bengaluru Central", state: "Karnataka", lat: 12.9716, lng: 77.5946, aliases: ["bangalore", "bengaluru", "बेंगलुरु", "ಬೆಂಗಳೂರು", "bangalore city"], formattedAddress: "Bengaluru, Karnataka, India" },
  { name: "Hyderabad", city: "Hyderabad", locality: "Hyderabad Central", state: "Telangana", lat: 17.3850, lng: 78.4867, aliases: ["hyderabad", "हैदराबाद", "హైదరాబాద్", "hyderabad city"], formattedAddress: "Hyderabad, Telangana, India" },
  { name: "Chennai", city: "Chennai", locality: "Chennai Central", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, aliases: ["chennai", "चेन्नई", "சென்னை", "madras", "chennai city"], formattedAddress: "Chennai, Tamil Nadu, India" },
  { name: "Delhi NCR", city: "Delhi NCR", locality: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090, aliases: ["delhi", "delhi ncr", "दिल्ली", "new delhi", "ncr"], formattedAddress: "Delhi NCR, India" },
  { name: "Ahmedabad", city: "Ahmedabad", locality: "Ahmedabad Central", state: "Gujarat", lat: 23.0225, lng: 72.5714, aliases: ["ahmedabad", "अहमदाबाद", "અમદાવાદ", "amdavad"], formattedAddress: "Ahmedabad, Gujarat, India" },
  { name: "Kolkata", city: "Kolkata", locality: "Kolkata Central", state: "West Bengal", lat: 22.5726, lng: 88.3639, aliases: ["kolkata", "कोलकाता", "কলকাতা", "calcutta"], formattedAddress: "Kolkata, West Bengal, India" },
  { name: "Noida", city: "Noida", locality: "Noida City", state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910, aliases: ["noida", "नोएडा", "noida city"], formattedAddress: "Noida, Gautam Buddha Nagar, Uttar Pradesh" },
  { name: "Gurgaon", city: "Gurgaon", locality: "Gurugram Central", state: "Haryana", lat: 28.4595, lng: 77.0266, aliases: ["gurgaon", "gurugram", "गुड़गांव", "गुरुग्राम"], formattedAddress: "Gurgaon (Gurugram), Haryana, India" },

  // ── TIER-2 LEADING CITIES ──
  { name: "Jaipur", city: "Jaipur", locality: "Pink City Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, aliases: ["jaipur", "जयपुर", "pink city", "vaishali nagar jaipur", "malviya nagar jaipur"], formattedAddress: "Jaipur, Rajasthan, India" },
  { name: "Surat", city: "Surat", locality: "Surat Central", state: "Gujarat", lat: 21.1702, lng: 72.8311, aliases: ["surat", "सूरत", "સુરત", "vesu surat", "adajan surat"], formattedAddress: "Surat, Gujarat, India" },
  { name: "Lucknow", city: "Lucknow", locality: "Lucknow Central", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, aliases: ["lucknow", "लखनऊ", "gomti nagar lucknow", "hazratganj lucknow"], formattedAddress: "Lucknow, Uttar Pradesh, India" },
  { name: "Indore", city: "Indore", locality: "Indore Central", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, aliases: ["indore", "इंदौर", "vijay nagar indore", "palasia indore"], formattedAddress: "Indore, Madhya Pradesh, India" },
  { name: "Chandigarh", city: "Chandigarh", locality: "Chandigarh City", state: "Chandigarh", lat: 30.7333, lng: 76.7794, aliases: ["chandigarh", "चंडीगढ़", "sector 17 chandigarh", "mohali", "panchkula"], formattedAddress: "Chandigarh (Tricity), India" },
  { name: "Kochi", city: "Kochi", locality: "Kochi Ernakulam", state: "Kerala", lat: 9.9312, lng: 76.2673, aliases: ["kochi", "cochin", "கொச்சி", "കൊച്ചി", "ernakulam", "kakkanad kochi"], formattedAddress: "Kochi (Cochin), Kerala, India" },
  { name: "Coimbatore", city: "Coimbatore", locality: "Coimbatore Central", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, aliases: ["coimbatore", "கோவை", "rs puram coimbatore", "gandhipuram coimbatore"], formattedAddress: "Coimbatore, Tamil Nadu, India" },
  { name: "Nagpur", city: "Nagpur", locality: "Nagpur Central", state: "Maharashtra", lat: 21.1458, lng: 79.0882, aliases: ["nagpur", "नागपूर", "dharampeth nagpur", "wardha road nagpur"], formattedAddress: "Nagpur, Maharashtra, India" },
  { name: "Bhopal", city: "Bhopal", locality: "Bhopal Central", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, aliases: ["bhopal", "भोपाल", "arera colony bhopal", "mp nagar bhopal"], formattedAddress: "Bhopal, Madhya Pradesh, India" },
  { name: "Patna", city: "Patna", locality: "Patna Central", state: "Bihar", lat: 25.5941, lng: 85.1376, aliases: ["patna", "पटना", "kankarbagh patna", "bailey road patna", "boring road patna"], formattedAddress: "Patna, Bihar, India" },
  { name: "Vadodara", city: "Vadodara", locality: "Vadodara Central", state: "Gujarat", lat: 22.3072, lng: 73.1812, aliases: ["vadodara", "baroda", "વડોદરા", "alkapuri vadodara", "gotri vadodara"], formattedAddress: "Vadodara (Baroda), Gujarat, India" },
  { name: "Nashik", city: "Nashik", locality: "Nashik Central", state: "Maharashtra", lat: 19.9975, lng: 73.7898, aliases: ["nashik", "नाशिक", "college road nashik", "gangapur road nashik", "indira nagar nashik"], formattedAddress: "Nashik, Maharashtra, India" },
  { name: "Visakhapatnam", city: "Visakhapatnam", locality: "Vizag Central", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185, aliases: ["visakhapatnam", "vizag", "విశాఖపట్నం", "mvp colony vizag", "gajuwaka vizag"], formattedAddress: "Visakhapatnam (Vizag), Andhra Pradesh" },
  { name: "Goa", city: "Goa", locality: "Panaji & Coastal Goa", state: "Goa", lat: 15.2993, lng: 74.1240, aliases: ["goa", "गोवा", "panaji", "panjim", "candolim", "calangute", "porvorim goa", "margao"], formattedAddress: "Goa, India" },
  { name: "Varanasi", city: "Varanasi", locality: "Varanasi Central", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, aliases: ["varanasi", "बनारस", "kashi", "banaras"], formattedAddress: "Varanasi (Kashi), Uttar Pradesh, India" },
  { name: "Mysore", city: "Mysore", locality: "Mysuru Central", state: "Karnataka", lat: 12.2958, lng: 76.6394, aliases: ["mysore", "mysuru", "ಮೈಸೂರು", "vijayanagar mysore", "gokulam mysore"], formattedAddress: "Mysuru (Mysore), Karnataka, India" },
  { name: "Amravati", city: "Amravati", locality: "Amravati Central", state: "Maharashtra", lat: 20.9374, lng: 77.7796, aliases: ["amravati", "अमरावती", "rajapeth amravati", "camp amravati", "badnera amravati", "gadge nagar amravati"], formattedAddress: "Amravati, Maharashtra, India" },
  { name: "Rajapeth", city: "Amravati", locality: "Rajapeth", state: "Maharashtra", lat: 20.9330, lng: 77.7523, aliases: ["rajapeth", "राजापेठ", "rajapeth amravati"], formattedAddress: "Rajapeth, Amravati, Maharashtra" },
  { name: "Camp", city: "Amravati", locality: "Camp", state: "Maharashtra", lat: 20.9277, lng: 77.7561, aliases: ["camp", "कॅम्प", "camp amravati", "camp area amravati"], formattedAddress: "Camp Area, Amravati, Maharashtra" },
  { name: "Trivandrum", city: "Trivandrum", locality: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366, aliases: ["trivandrum", "thiruvananthapuram", "തിരുവനന്തപുരം", "technopark trivandrum"], formattedAddress: "Thiruvananthapuram (Trivandrum), Kerala" },
];

/**
 * Strips filler words and common prefixes used when people speak location commands
 */
export function cleanVoiceLocationQuery(rawText: string): string {
  if (!rawText) return "";
  let clean = rawText.trim().toLowerCase();

  // Strip punctuation
  clean = clean.replace(/[.,?!:;'"()\/#-]/g, " ");

  // Common English filler prefixes/suffixes
  const englishFillers = [
    /^search\s+for\s+/i,
    /^search\s+/i,
    /^show\s+me\s+/i,
    /^show\s+/i,
    /^locate\s+/i,
    /^take\s+me\s+to\s+/i,
    /^go\s+to\s+/i,
    /^find\s+me\s+/i,
    /^find\s+/i,
    /^look\s+for\s+/i,
    /^open\s+map\s+(at|for|of|in)\s+/i,
    /^open\s+/i,
    /^where\s+is\s+/i,
    /^map\s+of\s+/i,
    /^give\s+me\s+(the\s+)?location\s+(of|for|in)?\s+/i,
    /^give\s+me\s+/i,
    /^properties?\s+(in|at|near|around)\s+/i,
    /^flats?\s+(in|at|near|around)\s+/i,
    /^apartments?\s+(in|at|near|around)\s+/i,
    /^homes?\s+(in|at|near|around)\s+/i,
    /^plots?\s+(in|at|near|around)\s+/i,
    /^villas?\s+(in|at|near|around)\s+/i,
    /\s+(city|area|locality|nagar|road|chowk|station|metro)$/i,
  ];

  englishFillers.forEach((regex) => {
    clean = clean.replace(regex, "");
  });

  // Hindi / Marathi filler prefixes/suffixes
  const regionalFillers = [
    /मुझे\s+(भी\s+)?(दिखाओ|दिखाइए|ले\s+चलो)/g,
    /मला\s+(दाखवा|ने)/g,
    /दिखाओ/g,
    /दाखवा/g,
    /ढूंढो/g,
    /शोधा/g,
    /चलो/g,
    /के\s+पास/g,
    /जवळ/g,
    /मध्ये/g,
    /में/g,
  ];

  regionalFillers.forEach((regex) => {
    clean = clean.replace(regex, " ");
  });

  clean = clean.replace(/\s+/g, " ").trim();
  return clean || rawText.trim();
}

export interface ResolvedLocationResult {
  city: string;
  locality: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  matchedName: string;
  source: "db" | "nominatim" | "photon" | "fallback";
}

/**
 * High-speed location resolver:
 * 1. Checks 0ms instant INDIAN_LOCATIONS_DB
 * 2. Fallbacks to OpenStreetMap Nominatim
 * 3. Fallbacks to Photon
 */
export async function resolveSpokenLocation(
  spokenText: string,
  langCode: string = "en"
): Promise<ResolvedLocationResult | null> {
  const cleaned = cleanVoiceLocationQuery(spokenText);
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();

  // 1. Direct or Alias match in database
  for (const item of INDIAN_LOCATIONS_DB) {
    if (
      item.name.toLowerCase() === lower ||
      item.locality.toLowerCase() === lower ||
      item.aliases.some(
        (alias) =>
          alias.toLowerCase() === lower ||
          lower.includes(alias.toLowerCase()) ||
          alias.toLowerCase().includes(lower)
      )
    ) {
      return {
        city: item.city,
        locality: item.locality,
        formattedAddress: item.formattedAddress,
        latitude: item.lat,
        longitude: item.lng,
        matchedName: item.name,
        source: "db",
      };
    }
  }

  // 2. Substring match in database (e.g. if spoken text is "Wakad chowk" or "Baner hill")
  for (const item of INDIAN_LOCATIONS_DB) {
    const locLower = item.locality.toLowerCase();
    const nameLower = item.name.toLowerCase();
    const cityLower = item.city.toLowerCase();

    if (
      lower.includes(locLower) ||
      locLower.includes(lower) ||
      lower.includes(nameLower) ||
      (lower.includes(cityLower) && lower.length > 2)
    ) {
      return {
        city: item.city,
        locality: item.locality,
        formattedAddress: item.formattedAddress,
        latitude: item.lat,
        longitude: item.lng,
        matchedName: item.name,
        source: "db",
      };
    }
  }

  // 3. Online Geocoding with OSM Nominatim
  try {
    const query = encodeURIComponent(`${cleaned}, India`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&accept-language=${langCode}&limit=1`,
      { headers: { "Accept-Language": langCode } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const parts = item.display_name.split(",").map((s: string) => s.trim());
        const locality = parts[0] || cleaned;
        const city = parts[1] || parts[2] || "Target Location";

        return {
          city,
          locality,
          formattedAddress: `${locality}, ${city}`,
          latitude: lat,
          longitude: lng,
          matchedName: locality,
          source: "nominatim",
        };
      }
    }
  } catch (err) {
    console.warn("Nominatim geocoding failed:", err);
  }

  // 4. Fallback to Photon API
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(cleaned)}&limit=1`);
    if (res.ok) {
      const geo = await res.json();
      if (geo.features && geo.features.length > 0) {
        const f = geo.features[0];
        const [lng, lat] = f.geometry.coordinates;
        const props = f.properties || {};
        const locality = props.name || props.street || cleaned;
        const city = props.city || props.state || "Location";

        return {
          city,
          locality,
          formattedAddress: `${locality}, ${city}`,
          latitude: lat,
          longitude: lng,
          matchedName: locality,
          source: "photon",
        };
      }
    }
  } catch (err) {
    console.warn("Photon geocoding failed:", err);
  }

  return null;
}
