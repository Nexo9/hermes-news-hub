export interface Conversation {
  id: string;
  updated_at: string;
  type: 'direct' | 'group';
  name?: string;
  image_url?: string | null;
  participants: Participant[];
  lastMessage?: {
    content: string | null;
    message_type: string;
    sender_id: string;
    created_at: string;
  } | null;
  unreadCount?: number;
}

export interface Participant {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Message {
  id: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  created_at: string;
  sender_id: string;
  read_at: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export interface PresenceStatus {
  user_id: string;
  status: 'idle' | 'typing' | 'recording';
  username?: string;
}

export interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  bio?: string | null;
}

export interface Group {
  id: string;
  name: string;
  image_url: string | null;
  conversation_id: string | null;
  member_count: number;
}
