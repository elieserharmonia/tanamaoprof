
import React from 'react';
import { 
  Briefcase, 
  ShoppingBasket, 
  Croissant, 
  PlusSquare, 
  Building2, 
  Clock, 
  Phone, 
  Mail, 
  MessageSquare, 
  Share2, 
  Star,
  MapPin,
  AlertCircle
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'Profissional', icon: <Briefcase className="w-5 h-5" />, label: 'Profissionais' },
  { id: 'Mercearia', icon: <ShoppingBasket className="w-5 h-5" />, label: 'Mercearias' },
  { id: 'Padaria', icon: <Croissant className="w-5 h-5" />, label: 'Padarias' },
  { id: 'Farmácia', icon: <PlusSquare className="w-5 h-5" />, label: 'Farmácias' },
  { id: 'Empresa', icon: <Building2 className="w-5 h-5" />, label: 'Empresas' },
];

export const DAYS_OF_WEEK = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

export const INITIAL_PROS: any[] = [
  {
    id: '1',
    companyName: 'CONSTRUÇÕES TORRINHA',
    proName: 'João Silva',
    bio: 'Especialista em reformas e construção civil há mais de 15 anos.',
    category: 'Profissional',
    state: 'SP',
    city: 'Torrinha',
    phone: '14998887777',
    email: 'joao@construcao.com',
    whatsapp: '14998887777',
    experienceYears: 15,
    isVip: true,
    isHighlighted: true,
    isEmergency24h: true,
    photoUrl: 'https://picsum.photos/200/200?random=1',
    workingHours: DAYS_OF_WEEK.map(d => ({ day: d, start: '08:00', end: '18:00', closed: d === 'Domingo' })),
    reviews: [
      { id: 'r1', userName: 'Maria Santos', rating: 5, comment: 'Excelente trabalho!', date: '2023-10-01', hidden: false }
    ],
    servicesPhotos: ['https://picsum.photos/400/300?random=10']
  },
  {
    id: '2',
    companyName: 'PADARIA DO CENTRO',
    proName: 'Carlos Padeiro',
    bio: 'O melhor pão francês da região de Brotas.',
    category: 'Padaria',
    state: 'SP',
    city: 'Brotas',
    phone: '1436531111',
    email: 'padaria@contato.com',
    whatsapp: '1436531111',
    experienceYears: 10,
    isVip: false,
    isHighlighted: false,
    isEmergency24h: false,
    photoUrl: 'https://picsum.photos/200/200?random=2',
    workingHours: DAYS_OF_WEEK.map(d => ({ day: d, start: '06:00', end: '20:00', closed: false })),
    reviews: [],
    servicesPhotos: []
  }
];
