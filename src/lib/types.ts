export type Role = 'Admin' | 'Moderator' | 'Super' | 'VIP' | 'User';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatar: string | null;
  bio: string | null;
  status: 'online' | 'offline' | 'busy' | 'away';
  balance: number;
  created_at: string;
  name_color?: string;
  font_color?: string;
  font_size?: 'small' | 'medium' | 'large';
  font_weight?: 'normal' | 'bold';
  is_muted?: boolean;
  is_banned?: boolean;
  muted_until?: string | null;
  banned_until?: string | null;
  is_invisible?: boolean;
  name_decoration?: string; // e.g. "★ [name] ★"
  chat_wallpaper?: string;
  name_glow?: string; // Glow color for the name
  is_kicked?: boolean;
  font_family?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'private' | 'country';
  icon: string | null;
  created_at: string;
  description: string | null;
  creator_id?: string; // ID of the user who created the room
  topic?: string | null;
}

export interface Message {
  id: string;
  user_id: string;
  room_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  updated_at: string | null;
  profiles?: UserProfile; // Joined profile
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  created_at: string;
  sender?: UserProfile;
  receiver?: UserProfile;
}

export interface Ad {
  id: string;
  title: string;
  image?: string;
  link?: string;
  ad_code?: string;
  position: 'top' | 'sidebar' | 'popup';
  active: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  role_reward: Role;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'paypal' | 'stripe' | 'bank' | 'vodafone_cash';
  details: string;
  active: boolean;
}

export interface SiteSettings {
  site_name: string;
  site_logo?: string;
  keywords: string;
  maintenance_mode: boolean;
  radio_position?: string;
  ad_space_enabled?: boolean;
  ad_space_position?: 'top' | 'bottom';
  sidebar_vip_enabled?: boolean;
  sidebar_vip_title?: string;
  sidebar_vip_text?: string;
  sidebar_vip_subtext?: string;
  footer_links?: string[]; // JSON stringified array of page IDs
}

export interface StaticPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
}
