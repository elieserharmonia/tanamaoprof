
export type Category = string;
export type PlanType = 'Gratuito' | 'VIP' | 'Premium';
export type PaymentStatus = 'pending' | 'approved' | 'expired' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface WorkingHours {
  day: string;
  start: string;
  end: string;
  closed: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  hidden: boolean;
}

export interface ServiceItem {
  name: string;
  price: string;
}

export interface MpConfig {
  mode: 'test' | 'prod';
  accessToken: string;
  webhookUrl: string;
}

export interface PaymentRecord {
  id: string;
  external_id: string; // Mercado Pago ID
  userId: string;
  plan: PlanType;
  amount: number;
  status: PaymentStatus;
  qr_code: string;
  qr_code_base64: string;
  expires_at: string;
  created_at: string;
  provider: 'mercadopago';
}

export interface Subscription {
  userId: string;
  plan: PlanType;
  status: 'active' | 'inactive';
  starts_at: string;
  ends_at: string;
  last_payment_id: string;
}

export interface Professional {
  id: string;
  userId: string; 
  profileType: 'Profissional' | 'Comercio';
  plan: PlanType;
  subscriptionExpiresAt?: string;
  companyName?: string;
  proName?: string;
  bio: string;
  category: string;
  subCategory?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  state: string;
  city: string;
  phone: string;
  email: string;
  whatsapp: string;
  experienceYears: number;
  isVip: boolean; 
  isHighlighted: boolean; 
  isEmergency24h: boolean;
  photoUrl: string;
  workingHours: WorkingHours[];
  reviews: Review[];
  servicesPhotos: string[];
  servicesList: ServiceItem[];
  isClaimable?: boolean;
  views: number;
  createdAt: string;
}

export enum Tab {
  HOME = 'home',
  PRO = 'pro',
  ADMIN = 'admin'
}
