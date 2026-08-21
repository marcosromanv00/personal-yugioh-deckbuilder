export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  pinned?: boolean;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: {
    model?: string;
    referenced_cards?: string[];
    referenced_decks?: string[];
    referenced_containers?: string[];
  };
}
