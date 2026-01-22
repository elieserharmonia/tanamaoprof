
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Professional, User, ServiceItem, PaymentRecord, PlanType } from '../types';
import { DAYS_OF_WEEK, PRO_CATEGORIES, COMERCIO_CATEGORIES, getCategoryFromSpecialty, PLAN_PRICES, ALL_SPECIALTIES, SUPPORT_PHONE } from '../constants';
import { db } from '../services/db';
import { paymentService } from '../services/payment';
import { Camera, Save, Lock, Mail, User as UserIcon, LogIn, Loader2, RefreshCcw, Briefcase, ShoppingBag, PlusCircle, MapPin, Award, Zap, Check, Trash2, List, Copy, ExternalLink, QrCode, AlertCircle, TrendingUp, Clock, Eye, EyeOff, ChevronDown, MessageCircle, HelpCircle, Navigation, Key, FileText } from 'lucide-react';

interface ProTabProps {
  onSave: (pro: Professional) => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
}

type CheckoutStep = 'selection' | 'pix_display' | 'waiting' | 'success' | 'expired';

const ProTab: React.FC<ProTabProps> = ({ onSave, currentUser, onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [existingPro, setExistingPro] = useState<Professional | null>(null);
  const [activeView, setActiveView] = useState<'profile' | 'plans'>('profile');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('selection');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Gratuito');
  const [activePayment, setActivePayment] = useState<PaymentRecord | null>(null);
  const pollInterval = useRef<any>(null);

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
    return () => clearInterval(pollInterval.current);
  }, [currentUser]);

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

  const handleUpdatePassword = async () => {
    if (!newPass) return;
    try {
      await db.updatePassword(currentUser!.id, newPass);
      alert("Senha alterada com sucesso!");
      setIsChangingPass(false);
      setNewPass('');
    } catch (err) { alert("Erro ao alterar senha."); }
  };

  const geocodeAddress = async (silent = false) => {
    if (!formData.city || !formData.state) return;
    setIsGeocoding(true);
    try {
      const addressString = `${formData.street || ''}, ${formData.neighborhood || ''}, ${formData.city}, ${formData.state}, Brasil`;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Retorne latitude e longitude JSON para: ${addressString}`,
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
      const result = JSON.parse(response.text);
      setFormData(prev => ({ ...prev, latitude: result.latitude, longitude: result.longitude }));
      if (!silent) alert("Localização detectada!");
    } catch (err) { console.error(err); } finally { setIsGeocoding(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!formData.latitude || !formData.longitude) {
      await geocodeAddress(true);
    }

    const pro: Professional = {
      ...formData,
      id: existingPro ? existingPro.id : Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      companyName: formData.companyName?.toUpperCase(),
      category: getCategoryFromSpecialty(formData.subCategory || ''),
    } as Professional;
    onSave(pro);
  };

  if (!currentUser || currentUser.id === 'temp') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-black p-4 rounded-2xl mb-6 shadow-2xl animate-bounce"><Lock className="w-10 h-10 text-yellow-400" /></div>
        <h2 className="text-2xl font-black uppercase mb-8 italic text-center">Área do Parceiro</h2>
        <form onSubmit={handleAuth} className="w-full space-y-4" autoComplete="off">
          <input type="text" style={{display:'none'}} />
          <input type="password" style={{display:'none'}} />
          
          {authMode === 'register' && (
            <input 
              type="text" 
              name="partner_full_name"
              placeholder="Nome Completo" 
              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none" 
              value={authData.name} 
              onChange={e => setAuthData({...authData, name: e.target.value})} 
              required 
            />
          )}
          <input 
            type="email" 
            name="partner_email"
            autoComplete="new-email"
            placeholder="E-mail" 
            className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none" 
            value={authData.email} 
            onChange={e => setAuthData({...authData, email: e.target.value})} 
            required 
          />
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              name="partner_password"
              autoComplete="new-password"
              placeholder="Senha" 
              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none pr-12" 
              value={authData.password} 
              onChange={e => setAuthData({...authData, password: e.target.value})} 
              required 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black uppercase text-xs shadow-lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : authMode === 'login' ? 'ENTRAR' : 'CADASTRAR'}
          </button>
        </form>
        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-6 text-[10px] font-black uppercase underline opacity-40">{authMode === 'login' ? 'Criar conta' : 'Já tenho conta'}</button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
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
            <div className="relative">
              <img src={formData.photoUrl} className="w-20 h-20 rounded-full border-4 border-black object-cover bg-white shadow-xl" alt="Preview" />
              <div className="absolute -bottom-1 -right-1 bg-black p-2 rounded-full border-2 border-white shadow-lg"><Camera className="w-3 h-3 text-white" /></div>
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
               <label className="text-[10px] font-black uppercase text-black/40">Nome do Negócio</label>
               <input type="text" placeholder="Ex: PADARIA CENTRAL" className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold uppercase text-sm outline-none" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-black/40">Ramo de Atividade</label>
               <div className="relative">
                 <select className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs appearance-none outline-none" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} required>
                   <option value="">Especialidade</option>
                   {Object.entries({...PRO_CATEGORIES, ...COMERCIO_CATEGORIES}).map(([cat, subs]) => (
                     <optgroup key={cat} label={cat}>{subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}</optgroup>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-black/40 flex items-center gap-1"><FileText className="w-3 h-3"/> Biografia / Descrição dos Serviços</label>
               <textarea 
                 placeholder="Conte um pouco sobre sua experiência, serviços que oferece e diferenciais..." 
                 className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none min-h-[120px] resize-none" 
                 value={formData.bio} 
                 onChange={e => setFormData({...formData, bio: e.target.value})} 
               />
               <p className="text-[8px] font-bold text-black/30 uppercase italic">Dica: Uma boa descrição atrai mais clientes!</p>
            </div>

            <div className="bg-white border-2 border-black rounded-3xl p-4 space-y-4 shadow-sm">
               <h4 className="text-[10px] font-black uppercase text-black/40">Endereço do Local</h4>
               <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Cidade" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  <input type="text" placeholder="UF" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
               </div>
               <input type="text" placeholder="Endereço (Rua, Avenida, Número)" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none w-full" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
               <input type="text" placeholder="Bairro" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none w-full" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <input type="tel" placeholder="WhatsApp" className="bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
              <input type="tel" placeholder="Fixo" className="bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <button type="submit" disabled={isGeocoding} className="w-full bg-black text-yellow-400 py-5 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50">
            {isGeocoding ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'SALVAR MEU PERFIL'}
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black italic uppercase">Plano VIP</h3>
              <p className="text-lg font-black text-yellow-600 mb-4">R$ 9,90/mês</p>
              <button className="w-full bg-black text-yellow-400 py-3 rounded-xl font-black text-xs uppercase">Assinar VIP</button>
           </div>
           
           <div className="bg-yellow-400 border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black italic uppercase">Plano Premium</h3>
              <p className="text-lg font-black text-black mb-4">R$ 99,00/ano</p>
              <button className="w-full bg-black text-yellow-400 py-3 rounded-xl font-black text-xs uppercase">Assinar Premium</button>
           </div>
        </div>
      )}

      {isChangingPass && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="bg-white border-4 border-black w-full max-w-xs rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-black uppercase italic text-center">Alterar Senha</h2>
              <input type="password" placeholder="Nova senha" className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold outline-none" value={newPass} onChange={e => setNewPass(e.target.value)} />
              <button onClick={handleUpdatePassword} className="w-full bg-black text-yellow-400 py-3 rounded-xl font-black uppercase text-xs">Confirmar</button>
              <button onClick={() => setIsChangingPass(false)} className="w-full text-xs font-black uppercase opacity-40 py-2">Cancelar</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProTab;
