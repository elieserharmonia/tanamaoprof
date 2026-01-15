
export type Category = string;

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

export interface Professional {
  id: string;
  userId: string; // ID do dono do perfil
  companyName?: string;
  proName?: string;
  bio: string;
  category: Category;
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
}

export enum Tab {
  HOME = 'home',
  PRO = 'pro',
  ADMIN = 'admin'
}
