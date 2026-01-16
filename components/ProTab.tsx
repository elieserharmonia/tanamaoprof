
import React, { useState, useEffect } from 'react';
import { Professional, Category, WorkingHours, User } from '../types';
import { DAYS_OF_WEEK, CATEGORIES } from '../constants';
import { db } from '../services/db';
import { Camera, Save, AlertTriangle, Lock, Mail, User as UserIcon, LogIn, ArrowRight, Loader2, RefreshCcw } from 'lucide-react';

interface ProTabProps {
  onSave: (pro: Professional) => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
}

const ProTab: React.FC<ProTabProps> = ({ onSave, currentUser, onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [existingPro, setExistingPro] = useState<Professional | null>(null);

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

  const [formData, setFormData] = useState<Partial<Professional>>({
    companyName: '',
    proName: '',
    bio: '',
    category: 'Profissional',
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
    isHighlighted: false
  });

  // Função para converter arquivo em Base64 (evita que a foto suma)
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
        alert("Erro ao processar a imagem. Tente uma foto menor.");
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
        alert(`Um link de redefinição de senha foi enviado para ${authData.email}. Verifique sua caixa de entrada.`);
        setAuthMode('login');
      } else {
        let user;
        if (authMode === 'login') {
          user = await db.signIn(authData.email, authData.password);
        } else {
          if (!authData.name) throw new Error('Nome é obrigatório.');
          user = await db.signUp(authData.email, authData.password, authData.name);
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

    if (!formData.proName && !formData.companyName) {
      return alert('Preencha ao menos o seu nome ou o nome da empresa.');
    }
    
    const finalCategory = isOtherCategory ? (customCategory || 'Outros') : formData.category;

    const newPro: Professional = {
      ...formData,
      id: existingPro ? existingPro.id : Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      companyName: formData.companyName?.toUpperCase(),
      proName: formData.proName?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      category: finalCategory,
      reviews: existingPro ? existingPro.reviews : [],
      servicesPhotos: existingPro ? existingPro.servicesPhotos : []
    } as Professional;
    
    onSave(newPro);
    alert(existingPro ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!');
  };

  if (!currentUser || currentUser.id === 'temp') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-black p-4 rounded-2xl mb-6 shadow-2xl">
          {authMode === 'recovery' ? <RefreshCcw className="w-10 h-10 text-yellow-400" /> : <Lock className="w-10 h-10 text-yellow-400" />}
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter text-center uppercase mb-2">
          {authMode === 'recovery' ? 'Recuperar Acesso' : 'Área do Profissional'}
        </h2>
        <p className="text-xs font-bold text-black/60 text-center mb-8 uppercase tracking-widest leading-tight">
          {authMode === 'recovery' ? 'Enviaremos uma nova senha no seu e-mail' : 'Acesse para gerenciar sua divulgação'}
        </p>

        <form onSubmit={handleAuth} className="w-full space-y-4">
          {authMode === 'register' && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
              <input 
                type="text" 
                placeholder="Seu Nome Completo"
                className="w-full bg-white border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold outline-none"
                value={authData.name}
                onChange={(e) => setAuthData({...authData, name: e.target.value})}
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
            <input 
              type="email" 
              placeholder="Seu E-mail Cadastrado"
              className="w-full bg-white border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold outline-none"
              value={authData.email}
              onChange={(e) => setAuthData({...authData, email: e.target.value})}
              required
            />
          </div>
          {authMode !== 'recovery' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
              <input 
                type="password" 
                placeholder="Sua Senha"
                className="w-full bg-white border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold outline-none"
                value={authData.password}
                onChange={(e) => setAuthData({...authData, password: e.target.value})}
                required
              />
            </div>
          )}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (authMode === 'recovery' ? <RefreshCcw className="w-4 h-4" /> : <LogIn className="w-4 h-4" />)}
            {authMode === 'recovery' ? 'ENVIAR SENHA POR E-MAIL' : authMode === 'login' ? 'ENTRAR AGORA' : 'CRIAR MINHA CONTA'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black"
          >
            {authMode === 'recovery' ? '' : (authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login')}
          </button>
          
          {authMode !== 'register' && (
            <button 
              onClick={() => setAuthMode(authMode === 'recovery' ? 'login' : 'recovery')}
              className="text-[10px] font-black uppercase tracking-widest text-red-600/60 hover:text-red-600 underline"
            >
              {authMode === 'recovery' ? 'Voltar para o Login' : 'Esqueci minha senha'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading && !formData.proName && !formData.companyName) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
        <p className="font-black uppercase text-[10px] tracking-widest">Carregando seu perfil...</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-10">
      <div className="bg-black text-yellow-400 p-6 rounded-3xl mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">{existingPro ? 'Editar Perfil' : 'Cadastre-se'}</h2>
          <p className="text-sm font-bold opacity-80">{existingPro ? 'Mantenha seus dados atualizados' : 'Seja encontrado em toda região'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <div className="relative group cursor-pointer">
            <img src={formData.photoUrl} className="w-32 h-32 rounded-full border-4 border-black object-cover shadow-xl bg-white" alt="Preview" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-8 h-8" />
            </div>
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handlePhotoChange}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/50 px-1">Nome da Empresa</label>
            <input 
              type="text" 
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none font-bold uppercase"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/50 px-1">Nome do Responsável</label>
            <input 
              type="text" 
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none font-bold"
              value={formData.proName}
              onChange={(e) => setFormData({...formData, proName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/50 px-1">Categoria</label>
            <select 
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none font-bold"
              value={isOtherCategory ? 'Outros' : formData.category}
              onChange={(e) => {
                if (e.target.value === 'Outros') {
                  setIsOtherCategory(true);
                } else {
                  setIsOtherCategory(false);
                  setFormData({...formData, category: e.target.value});
                }
              }}
            >
              {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              <option value="Outros">Outro (Digitar...)</option>
            </select>
            {isOtherCategory && (
              <input 
                type="text" 
                placeholder="Sua categoria..."
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 mt-2 outline-none font-bold"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/50 px-1">Bio / Descrição do Serviço</label>
            <textarea 
              rows={3}
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none font-medium text-sm"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-black/50 px-1">Whatsapp</label>
              <input 
                type="tel" 
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none font-bold"
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-black/50 px-1">Cidade</label>
              <input 
                type="text" 
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none font-bold"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-6 h-6" /> {existingPro ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR MEU PERFIL'}
        </button>
      </form>
    </div>
  );
};

export default ProTab;
