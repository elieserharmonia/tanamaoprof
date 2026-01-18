
import React, { useState, useEffect } from 'react';
import { Professional, User } from '../types';
import { DAYS_OF_WEEK, PRO_CATEGORIES, COMERCIO_CATEGORIES } from '../constants';
import { db } from '../services/db';
import { Camera, Save, Lock, Mail, User as UserIcon, LogIn, Loader2, RefreshCcw, Briefcase, ShoppingBag } from 'lucide-react';

interface ProTabProps {
  onSave: (pro: Professional) => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
}

const ProTab: React.FC<ProTabProps> = ({ onSave, currentUser, onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [existingPro, setExistingPro] = useState<Professional | null>(null);

  const [formData, setFormData] = useState<Partial<Professional>>({
    profileType: 'Profissional',
    companyName: '',
    proName: '',
    bio: '',
    category: '',
    subCategory: '',
    state: 'SP',
    city: 'Torrinha',
    phone: '',
    email: '',
    whatsapp: '',
    experienceYears: 0,
    isEmergency24h: false,
    photoUrl: 'https://picsum.photos/200/200?random=pro',
    workingHours: DAYS_OF_WEEK.map(day => ({ day, start: '08:00', end: '18:00', closed: false })),
    reviews: [],
    servicesPhotos: [],
    isVip: false,
    isHighlighted: false,
    views: 0,
    createdAt: new Date().toISOString()
  });

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (currentUser && currentUser.id !== 'temp') {
        setLoading(true);
        const pro = await db.getProfessionalByUserId(currentUser.id);
        if (pro) {
          setExistingPro(pro);
          setFormData(pro);
        }
        setLoading(false);
      }
    };
    checkExistingProfile();
  }, [currentUser]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const base64 = await fileToBase64(file);
        setFormData({ ...formData, photoUrl: base64 });
      } catch (err) {
        alert("Erro ao processar a imagem.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'recovery') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert(`Link enviado para ${authData.email}`);
        setAuthMode('login');
      } else {
        let user;
        if (authMode === 'login') {
          user = await db.signIn(authData.email, authData.password);
        } else {
          user = await db.signUp(authData.email, authData.password, authData.name);
          alert('Conta criada! Enviamos um e-mail de boas-vindas com seus dados.');
        }
        onLogin(user);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formData.category) return alert('Selecione uma categoria obrigatória.');
    if (formData.profileType === 'Profissional' && !formData.subCategory) return alert('Selecione uma subcategoria.');

    const newPro: Professional = {
      ...formData,
      id: existingPro ? existingPro.id : Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      companyName: formData.companyName?.toUpperCase(),
      createdAt: formData.createdAt || new Date().toISOString()
    } as Professional;
    
    onSave(newPro);
  };

  const currentCategories = formData.profileType === 'Profissional' ? PRO_CATEGORIES : COMERCIO_CATEGORIES;

  if (!currentUser || currentUser.id === 'temp') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-black p-4 rounded-2xl mb-6 shadow-2xl">
          {authMode === 'recovery' ? <RefreshCcw className="w-10 h-10 text-yellow-400" /> : <Lock className="w-10 h-10 text-yellow-400" />}
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter text-center uppercase mb-8">
          {authMode === 'recovery' ? 'Recuperar Acesso' : 'Área do Parceiro'}
        </h2>

        <form onSubmit={handleAuth} className="w-full space-y-4">
          {authMode === 'register' && (
            <input 
              type="text" 
              placeholder="Nome Completo"
              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none"
              value={authData.name}
              onChange={(e) => setAuthData({...authData, name: e.target.value})}
              required
            />
          )}
          <input 
            type="email" 
            placeholder="Seu E-mail"
            className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none"
            value={authData.email}
            onChange={(e) => setAuthData({...authData, email: e.target.value})}
            required
          />
          {authMode !== 'recovery' && (
            <input 
              type="password" 
              placeholder="Senha"
              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none"
              value={authData.password}
              onChange={(e) => setAuthData({...authData, password: e.target.value})}
              required
            />
          )}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {authMode === 'recovery' ? 'ENVIAR SENHA' : authMode === 'login' ? 'ENTRAR' : 'CADASTRAR'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-[10px] font-black uppercase tracking-widest text-black/40 underline">
            {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
          </button>
          {authMode === 'login' && (
            <button onClick={() => setAuthMode('recovery')} className="text-[10px] font-black uppercase tracking-widest text-red-600/60 underline">
              Esqueci minha senha
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="bg-black text-yellow-400 p-6 rounded-3xl mb-8 border-b-4 border-yellow-600 shadow-xl">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">{existingPro ? 'Editar Cadastro' : 'Novo Cadastro'}</h2>
        <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Preencha sua vitrine profissional</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TIPO DE PERFIL */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-black/50 px-1">Tipo de Perfil</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => setFormData({...formData, profileType: 'Profissional', category: '', subCategory: ''})}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${formData.profileType === 'Profissional' ? 'bg-black text-yellow-400 border-black' : 'bg-white text-black border-black/10 opacity-50'}`}
            >
              <Briefcase className="w-4 h-4" /> Profissional
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, profileType: 'Comercio', category: '', subCategory: ''})}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${formData.profileType === 'Comercio' ? 'bg-black text-yellow-400 border-black' : 'bg-white text-black border-black/10 opacity-50'}`}
            >
              <ShoppingBag className="w-4 h-4" /> Comércio / Loja
            </button>
          </div>
        </div>

        {/* FOTO */}
        <div className="flex justify-center">
          <div className="relative group cursor-pointer">
            <img src={formData.photoUrl} className="w-24 h-24 rounded-2xl border-4 border-black object-cover bg-white" alt="Preview" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-6 h-6" />
            </div>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} />
          </div>
        </div>

        {/* CATEGORIZAÇÃO */}
        <div className="grid gap-4 bg-black/5 p-4 rounded-2xl border border-black/10">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/50">Categoria Principal</label>
            <select 
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none font-bold text-xs"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value, subCategory: ''})}
              required
            >
              <option value="">Selecione...</option>
              {Object.keys(currentCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/50">
              {formData.profileType === 'Profissional' ? 'Subcategoria / Profissão' : 'Especialidade / Ramo'}
            </label>
            <select 
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none font-bold text-xs"
              value={formData.subCategory}
              onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
              required
              disabled={!formData.category}
            >
              <option value="">Selecione...</option>
              {/* Fix: cast currentCategories to Record<string, string[]> to resolve "never" type inference error */}
              {formData.category && (currentCategories as Record<string, string[]>)[formData.category]?.map((sub: string) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DADOS BÁSICOS */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/50 px-1">Nome do Negócio / Fantasia</label>
            <input 
              type="text" 
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-bold uppercase text-sm"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/50 px-1">Bio / Descrição rápida</label>
            <textarea 
              rows={3}
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-medium text-sm"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Ex: Aberto todos os dias, fazemos entregas..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="tel" 
              placeholder="WhatsApp"
              className="bg-white border-2 border-black rounded-xl px-4 py-3 font-bold text-xs"
              value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Cidade"
              className="bg-white border-2 border-black rounded-xl px-4 py-3 font-bold text-xs"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-black text-yellow-400 py-5 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
        >
          <Save className="w-6 h-6 inline mr-2" /> {existingPro ? 'ATUALIZAR MEU PERFIL' : 'CONCLUIR MEU CADASTRO'}
        </button>
      </form>
    </div>
  );
};

export default ProTab;
