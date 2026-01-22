
import React from 'react';

export const SUPPORT_PHONE = '5514996074964';

export const PLAN_PRICES = {
  MONTHLY_VIP: 9.90,
  ANNUAL_PREMIUM: 99.00
};

export const PRO_CATEGORIES = {
  'Construção e Reformas': [
    'Pedreiro', 'Pintor', 'Eletricista', 'Encanador / Bombeiro hidráulico', 
    'Gesseiro', 'Azulejista', 'Marceneiro', 'Carpinteiro', 'Serralheiro', 'Calheiro', 'Montador de Móveis'
  ],
  'Serviços Domésticos': [
    'Diarista', 'Faxineira', 'Passadeira', 'Cozinheira(o)', 'Babá', 'Cuidador(a) de idosos'
  ],
  'Beleza e Estética': [
    'Manicure', 'Pedicure', 'Cabeleireiro(a)', 'Barbeiro', 'Maquiadora', 'Esteticista', 'Depiladora'
  ],
  'Transporte e Entregas': [
    'Motorista', 'Motorista Particular', 'Entregador', 'Moto-Boy', 'Táxi', 'Uber'
  ],
  'Profissionais Liberais': [
    'Advogado', 'Engenheiro', 'Arquiteto', 'Contador', 'Veterinário', 'Nutricionista', 'Psicólogo'
  ],
  'Educação e Aulas': [
    'Professor', 'Professor de idiomas', 'Professor (reforço)', 'Professor de música', 'Personal Trainer'
  ],
  'Veículos e Transporte': [
    'Mecânico', 'Elétrica Automotiva', 'Funileiro', 'Guincho / Reboque', 'Lavador de carro', 'Borracheiro'
  ],
  'Jardim e Área Externa': [
    'Jardineiro', 'Paisagista', 'Podador de árvores', 'Piscineiro'
  ],
  'Instalação e Manutenção': [
    'Técnico em ar-condicionado', 'Técnico em refrigeração', 'Instalador de TV / antena', 'Técnico em internet e redes'
  ],
  'Tecnologia': [
    'Técnico em informática', 'Técnico em celulares', 'Suporte de TI', 'Desenvolvedor'
  ],
  'Outros Serviços': [
    'Vidraceiro', 'Estofador', 'Dedetizador', 'Chaveiro', 'Fotógrafo'
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
  'Imobiliária e Locação': [
    'Locação de imóveis', 'Locação'
  ],
  'Serviços em Geral': [
    'Oficina mecânica', 'Lava-jato', 'Gráfica', 'Papelaria'
  ]
};

export const ALL_SPECIALTIES = [
  ...Object.values(PRO_CATEGORIES).flat(),
  ...Object.values(COMERCIO_CATEGORIES).flat()
].sort();

export const getCategoryFromSpecialty = (specialty: string): string => {
  for (const [cat, list] of Object.entries({...PRO_CATEGORIES, ...COMERCIO_CATEGORIES})) {
    if (list.includes(specialty)) return cat;
  }
  return 'Outros';
};

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
    plan: 'Premium',
    companyName: 'CONSTRUÇÕES TORRINHA',
    proName: 'João Silva',
    bio: 'Especialista em reformas e construção civil há mais de 15 anos.',
    category: 'Construção e Reformas',
    subCategory: 'Pedreiro',
    street: 'Rua das Flores, 123',
    neighborhood: 'Centro',
    state: 'SP',
    city: 'Torrinha',
    phone: '14998887777',
    email: 'joao@construcao.com',
    whatsapp: '14998887777',
    experienceYears: 15,
    isVip: true,
    isHighlighted: true,
    isEmergency24h: true,
    photoUrl: 'https://img.icons8.com/fluency/200/worker-male.png',
    workingHours: DAYS_OF_WEEK.map(d => ({ day: d, start: '08:00', end: '18:00', closed: d === 'Domingo' })),
    reviews: [
      { id: 'r1', userName: 'Maria Santos', rating: 5, comment: 'Excelente trabalho!', date: '2023-10-01', hidden: false }
    ],
    servicesPhotos: ['https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=400&q=80'],
    servicesList: [{ name: 'Reforma Completa', price: 'Sob consulta' }],
    views: 150,
    createdAt: '2023-01-01'
  }
];
