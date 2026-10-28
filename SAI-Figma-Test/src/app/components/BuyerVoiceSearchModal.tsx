import React, { useState, useRef, useEffect } from "react";
import {
  Mic, MicOff, Square, X, Search, Sparkles, MapPin, Home,
  DollarSign, Check, HelpCircle, ArrowRight, Volume2, SlidersHorizontal
} from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { getSpeechCode, LANGUAGES } from "../i18n/langauge";
import { CITIES } from "../data/propertyData";

interface BuyerVoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySearch: (criteria: {
    city?: string;
    bhk?: number;
    maxPrice?: number;
    amenities?: string[];
    propertyType?: string;
    keywords?: string;
  }) => void;
  defaultCity?: string;
}

export function BuyerVoiceSearchModal({
  isOpen,
  onClose,
  onApplySearch,
  defaultCity = "Pune",
}: BuyerVoiceSearchModalProps) {
  const { lang } = useI18n();
  const [activeLang, setActiveLang] = useState<string>(lang || "en");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted entities
  const [extractedCity, setExtractedCity] = useState<string | null>(null);
  const [extractedBhk, setExtractedBhk] = useState<number | null>(null);
  const [extractedBudget, setExtractedBudget] = useState<number | null>(null);
  const [extractedType, setExtractedType] = useState<string | null>(null);
  const [extractedAmenities, setExtractedAmenities] = useState<string[]>([]);

  // AI clarification state
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [followUpField, setFollowUpField] = useState<"budget" | "city" | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setInterimText("");
      setErrorMessage(null);
      setExtractedCity(null);
      setExtractedBhk(null);
      setExtractedBudget(null);
      setExtractedType(null);
      setExtractedAmenities([]);
      setFollowUpQuestion(null);
      setFollowUpField(null);
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  const parseVoiceQuery = (text: string) => {
    const lower = text.toLowerCase();
    let cityFound = extractedCity;
    let bhkFound = extractedBhk;
    let budgetFound = extractedBudget;
    let typeFound = extractedType;
    let amenitiesFound = [...extractedAmenities];

    // 1. City extraction (check all 17 cities + Marathi/Hindi variations)
    const CITY_ALIASES: Record<string, string[]> = {
      Pune: ["pune", "पुणे", "पुण्यात", "पुण्यामध्ये", "पुने"],
      Amravati: ["amravati", "अमरावती", "अमरावतीत", "अमरावतीमध्ये"],
      Nagpur: ["nagpur", "नागपूर", "नागपुरात", "नागपूरमध्ये"],
      Mumbai: ["mumbai", "bambai", "मुंबई", "मुंबईत", "मुंबईमध्ये"],
      Nashik: ["nashik", "nasik", "नाशिक", "नाशिकमध्ये"],
      Jaipur: ["jaipur", "जयपुर", "जयपूर"],
      Bangalore: ["bangalore", "bengaluru", "बंगलोर", "बेंगळुरू"],
      Hyderabad: ["hyderabad", "हैदराबाद"],
      Chennai: ["chennai", "madras", "चेन्नई"],
      "Delhi NCR": ["delhi", "delhi ncr", "दिल्ली"],
      Ahmedabad: ["ahmedabad", "अहमदाबाद"],
      Kolkata: ["kolkata", "calcutta", "कोलकाता"],
      Surat: ["surat", "सूरत", "सुरत"],
      Indore: ["indore", "इंदौर"],
      Bhopal: ["bhopal", "भोपाल"],
      Noida: ["noida", "नोएडा"],
      Gurgaon: ["gurgaon", "gurugram", "गुड़गांव", "गुरुग्राम"],
    };

    for (const [cityName, aliases] of Object.entries(CITY_ALIASES)) {
      if (aliases.some((a) => lower.includes(a))) {
        cityFound = cityName;
        break;
      }
    }

    // 2. BHK Extraction (English + Marathi + Hindi)
    if (lower.includes("1 bhk") || lower.includes("1bhk") || lower.includes("one bhk") || lower.includes("एक बीएचके") || lower.includes("1 बेडरूम")) {
      bhkFound = 1;
    } else if (lower.includes("2 bhk") || lower.includes("2bhk") || lower.includes("two bhk") || lower.includes("दोन बीएचके") || lower.includes("दो बीएचके") || lower.includes("2 बेडरूम")) {
      bhkFound = 2;
    } else if (lower.includes("3 bhk") || lower.includes("3bhk") || lower.includes("three bhk") || lower.includes("तीन बीएचके") || lower.includes("3 बेडरूम")) {
      bhkFound = 3;
    } else if (lower.includes("4 bhk") || lower.includes("4bhk") || lower.includes("four bhk") || lower.includes("चार बीएचके")) {
      bhkFound = 4;
    }

    // 3. Budget Extraction
    // Check for Lakhs (e.g. 40 lakh, 40 लाख, 80 lakhs, under 50 lakh)
    const lakhMatch = lower.match(/(?:under|below|max|upto|within|बजेट|लाख|लाखांपर्यंत)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|लाख)/i);
    if (lakhMatch) {
      budgetFound = parseFloat(lakhMatch[1]) * 100000;
    } else {
      const crMatch = lower.match(/(?:under|below|max|upto|within)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores|करोड़|कोटी)/i);
      if (crMatch) {
        budgetFound = parseFloat(crMatch[1]) * 10000000;
      }
    }

    // 4. Property Type
    if (lower.includes("flat") || lower.includes("फ्लॅट") || lower.includes("फ्लैट") || lower.includes("apartment") || lower.includes("अपार्टमेंट")) {
      typeFound = "Apartment";
    } else if (lower.includes("villa") || lower.includes("व्हिला") || lower.includes("बंगला") || lower.includes("bungalow")) {
      typeFound = "Villa";
    } else if (lower.includes("plot") || lower.includes("प्लॉट") || lower.includes("जमीन")) {
      typeFound = "Plot";
    } else if (lower.includes("commercial") || lower.includes("shop") || lower.includes("office") || lower.includes("दुकान")) {
      typeFound = "Commercial";
    }

    // 5. Amenities
    if ((lower.includes("parking") || lower.includes("पार्किंग") || lower.includes("गाड़ी")) && !amenitiesFound.includes("Parking")) {
      amenitiesFound.push("Parking");
    }
    if ((lower.includes("gym") || lower.includes("जिम")) && !amenitiesFound.includes("Gym")) {
      amenitiesFound.push("Gym");
    }
    if ((lower.includes("pool") || lower.includes("swimming") || lower.includes("पोहण्याचा तलाव")) && !amenitiesFound.includes("Pool")) {
      amenitiesFound.push("Pool");
    }
    if ((lower.includes("garden") || lower.includes("बाग") || lower.includes("बगीचा")) && !amenitiesFound.includes("Garden")) {
      amenitiesFound.push("Garden");
    }

    setExtractedCity(cityFound);
    setExtractedBhk(bhkFound);
    setExtractedBudget(budgetFound);
    setExtractedType(typeFound);
    setExtractedAmenities(amenitiesFound);

    // Follow-up logic: if city or budget missing, ask a friendly follow-up question
    if (cityFound && !budgetFound) {
      setFollowUpQuestion(`I found properties in ${cityFound}. What is your preferred budget?`);
      setFollowUpField("budget");
    } else if (!cityFound && budgetFound) {
      setFollowUpQuestion("Which city or locality would you prefer to search in?");
      setFollowUpField("city");
    } else if (!cityFound && !budgetFound && bhkFound) {
      setFollowUpQuestion(`Looking for a ${bhkFound} BHK. Which city and budget do you prefer?`);
      setFollowUpField("city");
    } else {
      setFollowUpQuestion(null);
      setFollowUpField(null);
    }
  };

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Voice search is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    } catch {}

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getSpeechCode(activeLang);
      recognition.interimResults = true;
      recognition.continuous = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText("");
      };

      recognition.onresult = (event: any) => {
        let finalTrans = "";
        let interimTrans = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }

        if (interimTrans) {
          setInterimText(interimTrans);
        }

        if (finalTrans) {
          const combined = transcript ? `${transcript} ${finalTrans.trim()}` : finalTrans.trim();
          setTranscript(combined);
          setInterimText("");
          parseVoiceQuery(combined);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setInterimText("");
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else if (event.error === "no-speech") {
          setErrorMessage("No speech detected. Please tap the mic and speak clearly.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setErrorMessage("Could not initialize microphone: " + (err?.message || "Error"));
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimText("");
  };

  const handleApply = () => {
    onApplySearch({
      city: extractedCity || defaultCity,
      bhk: extractedBhk || undefined,
      maxPrice: extractedBudget || undefined,
      amenities: extractedAmenities.length > 0 ? extractedAmenities : undefined,
      propertyType: extractedType || undefined,
      keywords: transcript.trim() || undefined,
    });
    onClose();
  };

  const handleQuickBudget = (amountLakhs: number) => {
    setExtractedBudget(amountLakhs * 100000);
    setFollowUpQuestion(null);
    setFollowUpField(null);
  };

  const handleQuickCity = (cityName: string) => {
    setExtractedCity(cityName);
    setFollowUpQuestion(null);
    setFollowUpField(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#D9E5E3] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006D6A] via-[#008F8C] to-[#004F4D] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-teal-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-100">SAI Smart AI Voice Finder</span>
          </div>
          <h2 className="text-2xl font-black text-white">Search by Voice</h2>
          <p className="text-xs text-white/80 mt-1">
            Speak naturally in your language (e.g., "I want a 2 BHK flat in Amravati under 40 lakh with parking")
          </p>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setActiveLang(l.code);
                  stopListening();
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeLang === l.code
                    ? "bg-white text-[#006D6A] shadow"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Animated Microphone Area */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute w-28 h-28 rounded-full bg-red-400/20 animate-ping" />
                  <span className="absolute w-36 h-36 rounded-full bg-teal-500/10 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                  isListening
                    ? "bg-red-500 text-white scale-105 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                    : "bg-[#006D6A] text-white hover:scale-105 hover:bg-[#004F4D]"
                }`}
              >
                {isListening ? <Square size={26} className="fill-white" /> : <Mic size={32} />}
              </button>
            </div>

            <p className="mt-3 text-sm font-bold text-slate-700">
              {isListening ? "Listening... Speak now" : "Tap microphone to speak"}
            </p>

            {/* Audio Waveform Bars when active */}
            {isListening && (
              <div className="flex items-center gap-1 mt-2">
                {[12, 24, 18, 30, 16, 22, 28, 14].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-[#008F8C] rounded-full animate-bounce"
                    style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Transcript Display */}
          {(transcript || interimText) && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-[#D9E5E3]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">You said:</p>
              <p className="text-sm font-semibold text-slate-800">
                "{transcript}"{" "}
                {interimText && <span className="text-teal-600 italic">({interimText}...)</span>}
              </p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-700 font-bold ml-2">×</button>
            </div>
          )}

          {/* Extracted Fields */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-[#008F8C]" />
              Extracted Search Filters:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* City */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium block">Location</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-[#008F8C]" />
                  {extractedCity || <span className="text-slate-400 font-normal italic">Not specified</span>}
                </span>
              </div>

              {/* BHK */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium block">Configuration</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Home size={13} className="text-[#008F8C]" />
                  {extractedBhk ? `${extractedBhk} BHK` : <span className="text-slate-400 font-normal italic">Any BHK</span>}
                </span>
              </div>

              {/* Budget */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium block">Max Budget</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <DollarSign size={13} className="text-emerald-600" />
                  {extractedBudget ? `₹${(extractedBudget / 100000).toFixed(1)} Lakh` : <span className="text-slate-400 font-normal italic">Flexible</span>}
                </span>
              </div>

              {/* Type */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-[11px] text-slate-400 font-medium block">Property Type</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block truncate">
                  {extractedType || "Residential"}
                </span>
              </div>

              {/* Amenities */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 sm:col-span-2">
                <span className="text-[11px] text-slate-400 font-medium block">Amenities</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {extractedAmenities.length > 0 ? (
                    extractedAmenities.map((a) => (
                      <span key={a} className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ✓ {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">Standard</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Follow-Up Clarification Prompt */}
          {followUpQuestion && (
            <div className="bg-[#E6F4F2] border border-[#008F8C]/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-[#006D6A]" />
                <span className="text-xs font-bold text-[#073B3A]">AI Assistant Clarification</span>
              </div>
              <p className="text-sm text-[#006D6A] font-medium leading-relaxed">{followUpQuestion}</p>

              {/* Quick response pills */}
              {followUpField === "budget" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[30, 40, 50, 75, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickBudget(amt)}
                      className="px-3 py-1 bg-white hover:bg-[#006D6A] hover:text-white rounded-xl text-xs font-bold text-[#006D6A] border border-[#008F8C]/30 transition-colors shadow-sm"
                    >
                      Under ₹{amt} Lakh
                    </button>
                  ))}
                </div>
              )}

              {followUpField === "city" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Pune", "Amravati", "Nagpur", "Mumbai", "Nashik"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleQuickCity(c)}
                      className="px-3 py-1 bg-white hover:bg-[#006D6A] hover:text-white rounded-xl text-xs font-bold text-[#006D6A] border border-[#008F8C]/30 transition-colors shadow-sm"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#D9E5E3] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="bg-[#006D6A] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#004F4D] transition-colors shadow-md flex items-center gap-2 text-sm"
          >
            <Search size={15} /> Find Matching Properties
          </button>
        </div>
      </div>
    </div>
  );
}
