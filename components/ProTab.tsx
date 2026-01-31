
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import emailjs from '@emailjs/browser';
import { Professional, User, PlanType } from '../types';
import { DAYS_OF_WEEK, PRO_CATEGORIES, COMERCIO_CATEGORIES, getCategoryFromSpecialty, PLAN_PRICES } from '../constants';
import { db } from '../services/db';
import { Camera, Lock, Mail, User as UserIcon, Loader2, MapPin, Award, Zap, Check, Key, FileText, ChevronLeft, ShieldCheck, ChevronDown, Clock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_z67v8qh',
  TEMPLATE_ID: 'template_xanup4h',
  PUBLIC_KEY: 'R6W4nxPqQRJ0wYfdu'
};

interface ProTabProps {
  onSave: (pro: Professional) => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'recovery' | 'verify' | 'reset';

const ProTab: React.FC<ProTabProps> = ({ onSave, currentUser, onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [existingPro, setExistingPro] = useState<Professional | null>(null);
  const [activeView, setActiveView] = useState<'profile' | 'plans'>('profile');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  
  const [targetResetUser, setTargetResetUser] = useState<User | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [userOtpInput, setUserOtpInput] = useState<string>('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  }, []);

  const [formData, setFormData] = useState<Partial<Professional>>({
    profileType: 'Profissional',
    plan: 'Gratuito',
    companyName: '',
    proName: '',
    bio: '',
    category: '',
    subCategory: '',
    state: 'SP',
    city: 'Torrinha',
    street: '',
    neighborhood: '',
    phone: '',
    email: '',
    whatsapp: '',
    photoUrl: 'https://img.icons8.com/fluency/200/user-male-circle.png',
    workingHours: DAYS_OF_WEEK.map(day => ({ day, start: '08:00', end: '18:00', closed: false })),
    reviews: [],
    servicesPhotos: [],
    servicesList: [],
    views: 0,
    createdAt: new Date().toISOString(),
    latitude: undefined,
    longitude: undefined
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

  const geocodeAddress = async (silent = false) => {
    const apiKey = process.env.API_KEY;
    
    // CORREÇÃO: Verificação rigorosa da API Key antes da instanciação
    if (!apiKey) {
      if (!silent) {
        console.warn("IA indisponível: Chave de API não encontrada.");
        alert("Aviso: A localização automática via IA está temporariamente indisponível. Preencha seu endereço manualmente.");
      }
      return;
    }

    if (!formData.city || !formData.state) return;

    setIsGeocoding(true);
    try {
      const addressString = `${formData.street || ''}, ${formData.neighborhood || ''}, ${formData.city}, ${formData.state}, Brasil`;
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Retorne latitude e longitude JSON para o endereço: ${addressString}. Responda apenas o objeto JSON puro.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER }
            },
            required: ["latitude", "longitude"]
          }
        }
      });
      const result = JSON.parse(response.text || '{}');
      if (result.latitude && result.longitude) {
        setFormData(prev => ({ ...prev, latitude: result.latitude, longitude: result.longitude }));
        if (!silent) alert("Localização do seu negócio detectada com sucesso!");
      }
    } catch (err) { 
      console.error("Erro no geocoding:", err); 
    } finally { 
      setIsGeocoding(false); 
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const user = await db.signIn(authData.email, authData.password);
        onLogin(user);
      } else if (authMode === 'register') {
        const user = await db.signUp(authData.email, authData.password, authData.name);
        onLogin(user);
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    // Tenta geocoding se houver API Key e as coordenadas estiverem zeradas
    if (process.env.API_KEY && (!formData.latitude || !formData.longitude)) {
      await geocodeAddress(true);
    }

    const pro: Professional = {
      ...formData,
      id: existingPro ? existingPro.id : Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      companyName: formData.companyName?.toUpperCase(),
      category: getCategoryFromSpecialty(formData.subCategory || ''),
    } as Professional;
    
    try {
      setLoading(true);
      await db.saveProfessional(pro);
      onSave(pro);
      alert("Perfil salvo com sucesso!");
    } catch (err) {
      alert("Erro ao salvar perfil no Supabase.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.id === 'temp') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
        <div className="bg-black p-4 rounded-2xl mb-6 shadow-2xl animate-bounce">
          <Lock className="w-10 h-10 text-yellow-400" />
        </div>
        
        <h2 className="text-2xl font-black uppercase mb-8 italic text-center leading-tight">
          {authMode === 'login' ? 'Acesso do Parceiro' : 'Cadastrar Meu Negócio'}
        </h2>

        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4" autoComplete="off">
          {authMode === 'register' && (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-black/40 px-1">Nome Completo</label>
              <input type="text" placeholder="Nome do Responsável" className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} required />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-black/40 px-1">E-mail</label>
            <input type="email" placeholder="Ex: joao@email.com" className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} required />
          </div>
          <div className="relative space-y-1">
            <label className="text-[9px] font-black uppercase text-black/40 px-1">Senha</label>
            <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none pr-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] text-black/40">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black uppercase text-xs shadow-lg active:translate-y-1 transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : authMode === 'login' ? 'ENTRAR NO PAINEL' : 'CRIAR MINHA CONTA'}
          </button>
        </form>
        
        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-6 text-[10px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity">
          {authMode === 'login' ? 'Ainda não é parceiro? Cadastre-se' : 'Já possui conta? Faça login'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveView('profile')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${activeView === 'profile' ? 'bg-black text-yellow-400 border-black shadow-md' : 'bg-white text-black border-black/10'}`}>Meus Dados</button>
        <button onClick={() => setActiveView('plans')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${activeView === 'plans' ? 'bg-yellow-400 text-black border-black shadow-md' : 'bg-white text-black border-black/10'}`}>Assinatura ✓</button>
      </div>

      {activeView === 'profile' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-black/10">
             <div className="flex items-center gap-3">
                <div className="bg-black p-2 rounded-xl"><UserIcon className="w-4 h-4 text-yellow-400" /></div>
                <div><p className="text-[10px] font-black uppercase">{currentUser.name}</p></div>
             </div>
             <button type="button" onClick={() => setIsChangingPass(true)} className="bg-white border-2 border-black p-2 rounded-xl shadow-sm"><Key className="w-4 h-4"/></button>
          </div>

          <div className="flex justify-center">
            <div className="relative group">
              <img src={formData.photoUrl} className="w-24 h-24 rounded-full border-4 border-black object-cover bg-white shadow-xl" alt="Preview" />
              <div className="absolute -bottom-1 -right-1 bg-black p-2.5 rounded-full border-2 border-white shadow-lg"><Camera className="w-3.5 h-3.5 text-white" /></div>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                 const file = e.target.files?.[0];
                 if (file) {
                   const reader = new FileReader();
                   reader.onloadend = () => setFormData({...formData, photoUrl: reader.result as string});
                   reader.readAsDataURL(file);
                 }
              }} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-black/40 px-1">Nome do Negócio</label>
               <input type="text" placeholder="Ex: PADARIA CENTRAL" className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold uppercase text-sm outline-none shadow-sm" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-black/40 px-1">Especialidade</label>
               <select className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs shadow-sm" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} required>
                 <option value="">Selecione sua Especialidade</option>
                 {Object.entries({...PRO_CATEGORIES, ...COMERCIO_CATEGORIES}).map(([cat, subs]) => (
                   <optgroup key={cat} label={cat}>{subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}</optgroup>
                 ))}
               </select>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-black/40 px-1">Descrição</label>
               <textarea placeholder="Conte sobre seu trabalho..." className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none min-h-[140px] shadow-sm" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
            </div>

            <div className="bg-white border-2 border-black rounded-3xl p-5 space-y-4 shadow-sm">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase text-black/40">Endereço</h4>
                  <button type="button" onClick={() => geocodeAddress()} disabled={isGeocoding} className="text-[9px] font-black uppercase bg-black text-yellow-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all">
                    {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin"/> : <><MapPin className="w-3 h-3"/> IA Geocode</>}
                  </button>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Cidade" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  <input type="text" placeholder="UF" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
               </div>
               <input type="text" placeholder="Rua e Número" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none w-full" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
               <input type="text" placeholder="Bairro" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none w-full" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
            </div>
          </div>

          <button type="submit" disabled={isGeocoding || loading} className="w-full bg-black text-yellow-400 py-5 rounded-2xl font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'SALVAR NO SUPABASE'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
           <div className="bg-white border-4 border-black rounded-[40px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-4 relative overflow-hidden">
              <div className="bg-yellow-400 p-4 rounded-3xl border-2 border-black shadow-lg"><Zap className="w-10 h-10 fill-black" /></div>
              <h3 className="text-2xl font-black uppercase italic">Plano VIP</h3>
              <p className="text-[11px] font-bold opacity-60 uppercase">Destaque seu perfil no topo!</p>
              <div className="flex items-baseline gap-1 mt-2">
                 <span className="text-4xl font-black">R$ 9,90</span>
                 <span className="text-xs font-bold opacity-40">/mês</span>
              </div>
              <button className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Assinar Agora</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProTab;
