import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, AlertCircle, Volume2 } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { getSpeechCode, LANGUAGES } from "../i18n/langauge";

interface VoiceInputFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number" | "textarea";
  required?: boolean;
  rows?: number;
  className?: string;
  inputClassName?: string;
  helperText?: string;
  onVoiceSuccess?: (transcript: string) => void;
  languageOverride?: string;
}

export function VoiceInputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  rows = 3,
  className = "",
  inputClassName = "",
  helperText,
  onVoiceSuccess,
  languageOverride,
}: VoiceInputFieldProps) {
  const { lang } = useI18n();
  const activeLang = languageOverride || lang || "en";
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    } catch {}

    try {
      const recognition = new SpeechRecognition();
      const speechCode = getSpeechCode(activeLang);
      recognition.lang = speechCode;
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
          if (type === "tel") {
            const digits = finalTrans.replace(/\D/g, "");
            const combined = (value ? `${value}${digits}` : digits).slice(0, 10);
            onChange(combined);
          } else {
            const combined = value ? `${value} ${finalTrans.trim()}` : finalTrans.trim();
            onChange(combined);
          }
          setInterimText("");
          if (onVoiceSuccess) {
            onVoiceSuccess(finalTrans.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setInterimText("");
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else if (event.error === "no-speech") {
          setErrorMessage("No speech was detected. Please try again or type manually.");
        } else {
          setErrorMessage(`Speech recognition error (${event.error}). Please type manually.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setErrorMessage("Could not access microphone: " + (err?.message || "Unknown error"));
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

  const langObj = LANGUAGES.find((l) => l.code === activeLang) || LANGUAGES[0];

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
            <Volume2 size={12} className="text-[#008F8C]" />
            Voice in {langObj.native}
          </span>
        </div>
      )}

      <div className="relative">
        {type === "textarea" ? (
          <textarea
            id={id}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={`w-full bg-slate-50 rounded-xl px-4 py-3 pr-24 text-sm text-slate-800 border transition-all ${
              isListening
                ? "border-[#008F8C] ring-2 ring-[#008F8C]/20 bg-teal-50/30"
                : "border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
            } ${inputClassName}`}
          />
        ) : (
          <input
            id={id}
            type={type}
            inputMode={type === "tel" ? "numeric" : undefined}
            pattern={type === "tel" ? "[0-9]{10}" : undefined}
            maxLength={type === "tel" ? 10 : undefined}
            value={value}
            onChange={(e) => {
              if (type === "tel") {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                onChange(digits);
              } else {
                onChange(e.target.value);
              }
            }}
            placeholder={placeholder}
            required={required}
            className={`w-full bg-slate-50 rounded-xl px-4 py-3 pr-24 text-sm text-slate-800 border transition-all ${
              isListening
                ? "border-[#008F8C] ring-2 ring-[#008F8C]/20 bg-teal-50/30"
                : "border-[#D9E5E3] focus:outline-none focus:ring-2 focus:ring-[#006D6A]"
            } ${inputClassName}`}
          />
        )}

        {/* Voice Microphone Controls Beside Input */}
        <div className="absolute right-2 top-2.5 flex items-center gap-1">
          {isListening ? (
            <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 shadow-sm animate-pulse">
              {/* Animated Waveform Bars */}
              <div className="flex items-center gap-0.5 h-3 mr-1">
                <span className="w-0.5 bg-red-600 rounded-full animate-bounce h-3" style={{ animationDelay: "0ms" }} />
                <span className="w-0.5 bg-red-600 rounded-full animate-bounce h-2" style={{ animationDelay: "150ms" }} />
                <span className="w-0.5 bg-red-600 rounded-full animate-bounce h-3.5" style={{ animationDelay: "300ms" }} />
                <span className="w-0.5 bg-red-600 rounded-full animate-bounce h-2" style={{ animationDelay: "450ms" }} />
              </div>
              <span className="text-[11px] font-bold">Listening...</span>
              <button
                type="button"
                onClick={stopListening}
                className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors ml-1"
                title="Stop Recording"
              >
                <Square size={10} className="fill-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startListening}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#006D6A] hover:bg-[#E6F4F2] transition-colors border border-transparent hover:border-[#D9E5E3]"
              title={`Speak to fill in ${langObj.name}`}
            >
              <Mic size={17} className="text-[#008F8C]" />
            </button>
          )}
        </div>
      </div>

      {/* Interim Live Transcript */}
      {isListening && interimText && (
        <p className="mt-1 text-xs text-teal-700 font-medium italic pl-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping inline-block" />
          Hearing: "{interimText}"
        </p>
      )}

      {/* Error / Denial Alert */}
      {errorMessage && (
        <div className="mt-1.5 text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200">
          <AlertCircle size={13} className="flex-shrink-0 text-red-500" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-400 hover:text-red-700 text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}

      {helperText && !errorMessage && !isListening && (
        <p className="mt-1 text-[11px] text-slate-400 pl-1">{helperText}</p>
      )}
    </div>
  );
}
