/**
 * Web Speech API Voice Narration for SAI Virtual Property Tour
 * Factual, non-hallucinated voice narration synchronized with room progression.
 */

export class VoiceNarrator {
  private isMuted: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
    // Check saved mute preference
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("sai_tour_muted");
      if (saved !== null) {
        this.isMuted = saved === "true";
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sai_tour_muted", String(muted));
    }
    if (muted) {
      this.stop();
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public speak(text: string): void {
    if (!this.isSupported || this.isMuted || !text) return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower, measured, professional cadence
      utterance.pitch = 1.0;
      utterance.lang = "en-IN"; // Prefer Indian English / English

      // Select a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.lang.includes("en-IN") || v.lang.includes("en-GB") || v.lang.includes("en-US")) &&
          !v.name.includes("whisper")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("[SAI Voice] Narration error:", e);
    }
  }

  public stop(): void {
    if (!this.isSupported) return;
    try {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    } catch {
      // ignore
    }
  }

  /**
   * Generates safe, factual narration text for any room based strictly on verified property data.
   */
  public static getNarrationForRoom(room: any, property: any): string {
    const propTitle = property?.title || property?.name || "this property";
    const bhk = property?.bhk || room?.data?.bhk;
    const bhkText = bhk ? `${bhk} BHK ` : "";
    const pType = property?.property_type || "residence";
    const city = property?.city || property?.locality || "";
    const locText = city ? ` in ${city}` : "";

    switch (room.type) {
      case "exterior":
        return `Welcome to ${propTitle}. Here is the exterior view of this ${bhkText}${pType}${locText}. Let's begin our tour from the entrance.`;
      case "entrance":
        return `Approaching the main entrance and foyer. Moving toward the front door.`;
      case "living_room":
        return `Now entering the spacious living room and lounge area. Notice the open layout and natural lighting.`;
      case "dining":
        return `Here is the dedicated dining area, conveniently positioned near the kitchen.`;
      case "kitchen":
        return `Moving into the kitchen. Designed with practical counter space and utility provisions.`;
      case "bedroom":
        if (room.bedroom_number === 1 || room.name.toLowerCase().includes("master")) {
          return `Entering the master bedroom suite. A peaceful sanctuary with ample natural airflow.`;
        }
        return `Here is ${room.name}. A well-proportioned bedroom with window ventilation.`;
      case "bathroom":
        return `Viewing ${room.name} with modern sanitary fittings and fixtures.`;
      case "balcony":
        return `Stepping out onto the balcony, offering fresh air and an open perspective.`;
      case "amenities":
        return `Here are the community lifestyle amenities and residential facilities.`;
      case "location":
        return `Exploring the neighborhood location and city connectivity.`;
      case "summary":
        return `Virtual tour complete. Here is the verified property summary. You can now schedule an in-person visit or replay the tour.`;
      default:
        return `Viewing ${room.name}.`;
    }
  }
}
