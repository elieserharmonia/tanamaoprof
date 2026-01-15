
import React, { useState, useEffect } from 'react';
import { Professional, Category, WorkingHours, User } from '../types';
import { DAYS_OF_WEEK, CATEGORIES } from '../constants';
import { db } from '../services/db';
import { Camera, Save, AlertTriangle, Lock, Mail, User as UserIcon, LogIn, ArrowRight, Loader2 } from 'lucide-react';

interface ProTabProps {
  onSave: (pro: Professional) => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
}

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ProTab: React.FC<ProTabProps> = ({ onSave, currentUser, onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [existingPro, setExistingPro] = useState<Professional | null>(null);

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

  // Busca se o usuário logado já tem um perfil
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (currentUser) {
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      if (authMode === 'login') {
        user = await db.signIn(authData.email, authData.password);
      } else {
        if (!authData.name) throw new Error('Nome é obrigatório.');
        user = await db.signUp(authData.email, authData.password, authData.name);
      }
      onLogin(user);
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

  const updateWorkingHour = (index: number, field: keyof WorkingHours, value: any) => {
    const newHours = [...(formData.workingHours || [])];
    newHours[index] = { ...newHours[index], [field]: value };
    setFormData({ ...formData, workingHours: newHours });
  };

  if (!currentUser) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-black p-4 rounded-2xl mb-6 shadow-2xl">
          <Lock className="w-10 h-10 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter text-center uppercase mb-2">Área do Profissional</h2>
        <p className="text-xs font-bold text-black/60 text-center mb-8 uppercase tracking-widest">Acesse para gerenciar sua divulgação</p>

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
              placeholder="E-mail"
              className="w-full bg-white border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold outline-none"
              value={authData.email}
              onChange={(e) => setAuthData({...authData, email: e.target.value})}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
            <input 
              type="password" 
              placeholder="Senha"
              className="w-full bg-white border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold outline-none"
              value={authData.password}
              onChange={(e) => setAuthData({...authData, password: e.target.value})}
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (authMode === 'login' ? <LogIn className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
            {authMode === 'login' ? 'ENTRAR AGORA' : 'CRIAR MINHA CONTA'}
          </button>
        </form>

        <button 
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          className="mt-6 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black"
        >
          {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
        </button>
      </div>
    );
  }

  if (loading) {
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
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <div className="relative group cursor-pointer">
            <img src={formData.photoUrl} className="w-32 h-32 rounded-full border-4 border-black object-cover shadow-xl" alt="Preview" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-8 h-8" />
            </div>
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setFormData({...formData, photoUrl: URL.createObjectURL(file)});
              }}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-black/50 px-1">Nome da Empresa (Opcional - CAIXA ALTA)</label>
            <input 
              type="text" 
              placeholder="EX: PADARIA CENTRAL"
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 focus:bg-yellow-50 transition-all outline-none font-bold"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-black/50 px-1">Nome do Profissional (Opcional - Capitalizado)</label>
            <input 
              type="text" 
              placeholder="Ex: José dos Santos"
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 focus:bg-yellow-50 transition-all outline-none font-bold"
              value={formData.proName}
              onChange={(e) => setFormData({...formData, proName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-black/50 px-1">Categoria</label>
            <select 
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 focus:bg-yellow-50 transition-all outline-none font-bold"
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
                placeholder="Digite sua categoria aqui..."
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 mt-2 focus:bg-yellow-50 outline-none font-bold animate-in slide-in-from-top-2 duration-200"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-black/50 px-1">Bio (O que você faz?)</label>
            <textarea 
              placeholder="Descreva seus serviços de forma atrativa..."
              rows={3}
              className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 focus:bg-yellow-50 transition-all outline-none font-medium"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black/50 px-1">Estado (UF)</label>
              <select 
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 focus:bg-yellow-50 outline-none font-bold"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              >
                {BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black/50 px-1">Cidade</label>
              <input 
                type="text" 
                placeholder="Ex: Torrinha"
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 focus:bg-yellow-50 outline-none font-bold"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black/50 px-1">Whatsapp (DDD + Nº)</label>
              <input 
                type="tel" 
                placeholder="14999999999"
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 focus:bg-yellow-50 outline-none font-bold"
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black/50 px-1">Telefone Fixo</label>
              <input 
                type="tel" 
                placeholder="1436531111"
                className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 focus:bg-yellow-50 outline-none font-bold"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 border-2 border-red-200">
            <input 
              type="checkbox" 
              id="emergency" 
              className="w-6 h-6 accent-red-600 cursor-pointer"
              checked={formData.isEmergency24h}
              onChange={(e) => setFormData({...formData, isEmergency24h: e.target.checked})}
            />
            <label htmlFor="emergency" className="text-xs font-black uppercase flex items-center gap-2 cursor-pointer">
              <AlertTriangle className="w-4 h-4 text-red-600" /> Disponibilidade Emergência 24h
            </label>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t-2 border-black/10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-black/50">Horário de Atendimento</h4>
          <div className="space-y-2">
            {formData.workingHours?.map((wh, idx) => (
              <div key={wh.day} className="flex items-center gap-2 bg-white border-2 border-black/10 p-2 rounded-xl">
                <span className="w-24 text-[10px] font-black uppercase">{wh.day}</span>
                {!wh.closed ? (
                  <>
                    <input 
                      type="time" 
                      value={wh.start} 
                      onChange={(e) => updateWorkingHour(idx, 'start', e.target.value)}
                      className="bg-gray-50 border rounded p-1 text-xs font-bold"
                    />
                    <span className="text-[10px] font-bold">às</span>
                    <input 
                      type="time" 
                      value={wh.end} 
                      onChange={(e) => updateWorkingHour(idx, 'end', e.target.value)}
                      className="bg-gray-50 border rounded p-1 text-xs font-bold"
                    />
                  </>
                ) : (
                  <span className="flex-1 text-[10px] font-black text-red-500 text-center">FECHADO</span>
                )}
                <label className="flex items-center gap-1 ml-auto text-[9px] font-black uppercase cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={wh.closed} 
                    onChange={(e) => updateWorkingHour(idx, 'closed', e.target.checked)}
                    className="w-4 h-4 accent-black"
                  /> Fechado
                </label>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-6 h-6" /> {existingPro ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR MEU PERFIL'}
        </button>
      </form>
    </div>
  );
};

export default ProTab;
