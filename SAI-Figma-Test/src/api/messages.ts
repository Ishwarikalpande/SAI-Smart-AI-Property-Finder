import { apiRequest } from "./client";

export interface ConversationParticipant {
  id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

export interface MessageItem {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    name: string;
  };
}

export interface ConversationItem {
  id: number;
  title?: string;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  messages?: MessageItem[];
}

export async function fetchConversations(): Promise<ConversationItem[]> {
  const res = await apiRequest<any>("/chat/conversations");
  return Array.isArray(res) ? res : (res?.conversations || res?.data || []);
}

export async function startConversation(recipientId: number, initialMessage?: string, title?: string): Promise<ConversationItem> {
  return apiRequest<ConversationItem>("/chat/conversations", {
    method: "POST",
    body: JSON.stringify({
      recipient_id: recipientId,
      initial_message: initialMessage,
      title,
    }),
  });
}

export async function fetchMessages(conversationId: number): Promise<MessageItem[]> {
  return apiRequest<MessageItem[]>(`/chat/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: number, content: string): Promise<MessageItem> {
  return apiRequest<MessageItem>(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
