export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  title: string;
  content: string;
  recipient_name: string;
  recipient_email: string;
  relationship: string;
  format: 'text' | 'audio' | 'video' | 'mixed';
  trigger_type: 'inactivity' | 'manual' | 'date';
  trigger_value: string;
  has_pin: boolean;
  pin?: string;
  status: 'draft' | 'sealed' | 'delivered';
  created_at: string;
  updated_at: string;
}

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  relationship: string;
  created_at: string;
}