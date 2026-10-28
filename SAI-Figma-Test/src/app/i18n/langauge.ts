export interface Language {
  code: string;
  name: string;
  native: string;
  speechCode: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English",   native: "English",    speechCode: "en-IN" },
  { code: "hi", name: "Hindi",     native: "हिन्दी",      speechCode: "hi-IN" },
  { code: "mr", name: "Marathi",   native: "मराठी",       speechCode: "mr-IN" },
  { code: "gu", name: "Gujarati",  native: "ગુજરાતી",    speechCode: "gu-IN" },
  { code: "ta", name: "Tamil",     native: "தமிழ்",       speechCode: "ta-IN" },
  { code: "te", name: "Telugu",    native: "తెలుగు",      speechCode: "te-IN" },
  { code: "kn", name: "Kannada",   native: "ಕನ್ನಡ",       speechCode: "kn-IN" },
  { code: "bn", name: "Bengali",   native: "বাংলা",       speechCode: "bn-IN" },
];

export function getSpeechCode(langCode: string): string {
  return LANGUAGES.find(l => l.code === langCode)?.speechCode ?? "en-IN";
}
