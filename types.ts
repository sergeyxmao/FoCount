export enum Rank {
  NOVICE = 'Новичок',
  EMERALD = 'Изумруд',
  SAPPHIRE = 'Сапфир',
  ALMAZ = 'Алмаз',
  DIAMOND_3 = 'Бриллиант 3 карата',
  DIAMOND_5 = 'Бриллиант 5 карат',
  DIAMOND_7 = 'Бриллиант 7 карат',
  AMBASSADOR = 'Амбассадор'
}

export type UserRole = 'partner' | 'client';

export interface VisibilitySettings {
  showPhone: boolean;
  showEmail: boolean;
  showTelegram: boolean;
  showVK: boolean;
  showInstagram: boolean;
  showWhatsApp: boolean;
  allowCrossLineMessages: boolean; // Разрешить писать не из структуры
}

export interface SearchSettings {
  searchByName: boolean;
  searchByCity: boolean;
  searchByCountry: boolean;
  searchByPersonalId: boolean;
  searchByOffice: boolean;
}

export interface Partner {
  id: string;
  fohowId: string;
  parentId?: string;
  name: string;
  rank: Rank;
  country: string;
  city: string;
  phone: string;
  email: string;
  avatar: string;
  bio: string;

  // Social contacts
  office?: string;
  telegram?: string;
  telegram_user?: string;
  telegram_channel?: string;
  whatsapp?: string;
  whatsapp_contact?: string;
  vk_profile?: string;
  ok_profile?: string;
  instagram_profile?: string;

  role: UserRole;
  isVerified: boolean;
  isPublic: boolean; // Master switch: appear in global search
  isOffice: boolean;

  visibilitySettings?: VisibilitySettings;
  searchSettings?: SearchSettings;
  blockedUserIds?: string[]; // IDs of users blocked by this partner

  teamIds?: string[];
}

// Новая система связей
export type RelationshipType = 'mentor' | 'downline';
export type RelationshipStatus = 'pending' | 'confirmed' | 'rejected';

export interface Relationship {
  id: string;
  initiatorId: string;
  targetId: string;
  type: RelationshipType;
  status: RelationshipStatus;
}

export interface Notification {
  id: string;
  type: 'relationship_request' | 'info';
  fromUserId?: string;
  relationshipId?: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  role?: 'user' | 'model';
}

export interface Chat {
  id: string;
  participantIds: string[];
  messages: ChatMessage[];
  lastMessageTime: number;
}

export type AppTab = 'team' | 'offices' | 'global' | 'assistant' | 'profile' | 'chats';
export type TeamSubTab = 'mentors' | 'structure' | 'ranks';

export interface User extends Partner {
  token: string;
  teamIds?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}
