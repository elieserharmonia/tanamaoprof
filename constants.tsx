
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
  AlertCircle,
  Hammer,
  Truck,
  Zap,
  ShieldCheck,
  Cpu,
  Coffee,
  HeartPulse,
  Home as HomeIcon,
  Sparkles
} from 'lucide-react';

export const PRO_CATEGORIES = {
  'Construção e Reformas': [
    'Pedreiro', 'Pintor', 'Eletricista', 'Encanador / Bombeiro hidráulico', 
    'Gesseiro', 'Azulejista', 'Marceneiro', 'Carpinteiro', 'Serralheiro', 'Calheiro'
  ],
  'Serviços Domésticos': [
    'Diarista', 'Faxineira(o)', 'Passadeira', 'Cozinheira(o)', 'Babá', 'Cuidador(a) de idosos'
  ],
  'Jardim e Área Externa': [
    'Jardineiro', 'Paisagista', 'Podador de árvores', 'Piscineiro'
  ],
  'Veículos e Transporte': [
    'Mecânico', 'Eletricista automotivo', 'Funileiro', 'Guincho / Reboque', 'Lavador automotivo'
  ],
  'Instalação e Manutenção': [
    'Técnico em ar-condicionado', 'Técnico em refrigeração', 'Instalador de TV / antena', 'Técnico em internet e redes'
  ],
  'Segurança e Acesso': [
    'Chaveiro', 'Instalador de câmeras', 'Instalador de alarmes', 'Porteiro eletrônico'
  ],
  'Tecnologia': [
    'Técnico em informática', 'Técnico em celulares', 'Suporte de TI'
  ],
  'Outros Serviços': [
    'Vidraceiro', 'Estofador', 'Montador de móveis', 'Dedetizador'
  ]
};

export const COMERCIO_CATEGORIES = {
  'Alimentação': [
    'Mercado', 'Supermercado', 'Padaria', 'Açougue', 'Hortifruti', 
    'Mercearia', 'Distribuidora de bebidas', 'Restaurante', 'Lanchonete', 'Pizzaria'
  ],
  'Saúde e Bem-estar': [
    'Farmácia', 'Clínica', 'Laboratório', 'Academia', 'Pet shop'
  ],
  'Casa e Construção': [
    'Loja de material de construção', 'Loja elétrica', 'Loja hidráulica', 'Loja de tintas', 'Madeireira'
  ],
  'Moda e Beleza': [
    'Salão de beleza', 'Barbearia', 'Loja de roupas', 'Loja de calçados', 'Perfumaria'
  ],
  'Serviços em Geral': [
    'Oficina mecânica', 'Lava-jato', 'Gráfica', 'Papelaria'
  ]
};

// Fix: Export CATEGORIES as a flattened list of all category keys for AdminTab
export const CATEGORIES = [
  ...Object.keys(PRO_CATEGORIES).map(cat => ({ id: cat, label: cat })),
  ...Object.keys(COMERCIO_CATEGORIES).map(cat => ({ id: cat, label: cat }))
];

export const DAYS_OF_WEEK = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

export const INITIAL_PROS: any[] = [
  {
    id: '1',
    profileType: 'Profissional',
    companyName: 'CONSTRUÇÕES TORRINHA',
    proName: 'João Silva',
    bio: 'Especialista em reformas e construção civil há mais de 15 anos.',
    category: 'Construção e Reformas',
    subCategory: 'Pedreiro',
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
    servicesPhotos: [],
    views: 150,
    createdAt: '2023-01-01'
  },
  {
    id: '2',
    profileType: 'Comercio',
    companyName: 'PADARIA DO CENTRO',
    proName: 'Carlos Padeiro',
    bio: 'O melhor pão francês da região de Brotas.',
    category: 'Alimentação',
    subCategory: 'Padaria',
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
    servicesPhotos: [],
    views: 85,
    createdAt: '2023-02-15'
  }
];
