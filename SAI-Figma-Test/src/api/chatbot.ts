import { apiRequest } from "./client";
import { PropertyItem } from "./properties";

export interface ChatbotResponse {
  reply: string;
  properties: PropertyItem[];
  suggestions: string[];
  detected_intent?: string;
}

export async function sendChatbotMessage(
  message: string,
  history: { role: string; content: string }[] = [],
  language: string = "en"
): Promise<ChatbotResponse> {
  return apiRequest<ChatbotResponse>("/chatbot/message", {
    method: "POST",
    body: JSON.stringify({ message, history, language }),
  });
}
