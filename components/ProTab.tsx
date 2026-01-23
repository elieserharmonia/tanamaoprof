
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Professional, User, ServiceItem, PaymentRecord, PlanType } from '../types';
import { DAYS_OF_WEEK, PRO_CATEGORIES, COMERCIO_CATEGORIES, getCategoryFromSpecialty, PLAN_PRICES, ALL_SPECIALTIES, SUPPORT_PHONE } from '../constants';
import { db } from '../services/db';
import { paymentService } from '../services/payment';
import { Camera, Save, Lock, Mail, User as UserIcon, LogIn, Loader2, RefreshCcw, Briefcase, ShoppingBag, PlusCircle, MapPin, Award, Zap, Check, Trash2, List, Copy, ExternalLink, QrCode, AlertCircle, TrendingUp, Clock, Eye, EyeOff, ChevronDown, MessageCircle, HelpCircle, Navigation, Key, FileText, ChevronLeft, ShieldCheck, ShieldAlert } from 'lucide-react';

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
  
  // Estados para Recuperação Segura
  const [targetResetUser, setTargetResetUser] = useState<User | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [userOtpInput, setUserOtpInput] = useState<string>('');
  
  const [isGeocoding, setIsGeocoding] = useState(false);

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

  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await db.getUserByEmail(authData.email);
      if (!user) throw new Error("Este e-mail não está cadastrado em nossa base.");
      
      // Gerar código de 6 dígitos
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setTargetResetUser(user);
      
      // Simulação de envio de e-mail (Log de console para desenvolvedor ver)
      console.log(`%c [SISTEMA DE E-MAIL] Código para ${authData.email}: ${otp}`, "color: yellow; background: black; font-weight: bold; padding: 4px;");
      
      alert(`Código de segurança enviado para ${authData.email}. Verifique sua caixa de entrada.`);
      setAuthMode('verify');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (userOtpInput === generatedOtp) {
      setAuthMode('reset');
    } else {
      alert("Código incorreto. Verifique o código enviado ao seu e-mail.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResetUser || !newPass) return;
    setLoading(true);
    try {
      await db.updatePassword(targetResetUser.id, newPass);
      alert("Sucesso! Sua senha foi alterada. Faça login com a nova senha.");
      setAuthMode('login');
      setNewPass('');
      setTargetResetUser(null);
      setGeneratedOtp('');
      setUserOtpInput('');
    } catch (err: any) {
      alert("Erro ao redefinir: " + err.message);
    } finally {
      setLoading(false);
    }
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
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
        <div className="bg-black p-4 rounded-2xl mb-6 shadow-2xl animate-bounce">
          {authMode === 'recovery' || authMode === 'verify' || authMode === 'reset' ? <Mail className="w-10 h-10 text-yellow-400" /> : <Lock className="w-10 h-10 text-yellow-400" />}
        </div>
        
        <h2 className="text-2xl font-black uppercase mb-8 italic text-center leading-tight">
          {authMode === 'login' && 'Acesso do Parceiro'}
          {authMode === 'register' && 'Cadastrar Meu Negócio'}
          {authMode === 'recovery' && 'Recuperar Acesso'}
          {authMode === 'verify' && 'Verificar Identidade'}
          {authMode === 'reset' && 'Criar Nova Senha'}
        </h2>

        {authMode === 'recovery' && (
          <form onSubmit={handleRecoveryRequest} className="w-full space-y-4">
             <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl flex items-start gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-[10px] font-bold text-blue-900 uppercase leading-tight">
                  Enviaremos um código de segurança de 6 dígitos para o seu e-mail para confirmar que você é o dono da conta.
                </p>
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-black/40 px-1">Seu E-mail Cadastrado</label>
                <input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                  value={authData.email} 
                  onChange={e => setAuthData({...authData, email: e.target.value})} 
                  required 
                />
             </div>
             <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 active:translate-y-1 transition-all">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ENVIAR CÓDIGO POR E-MAIL'}
             </button>
             <button type="button" onClick={() => setAuthMode('login')} className="w-full text-[10px] font-black uppercase opacity-40 py-2 flex items-center justify-center gap-1">
               <ChevronLeft className="w-3 h-3"/> Voltar para Login
             </button>
          </form>
        )}

        {authMode === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="w-full space-y-6 text-center">
             <div className="space-y-2">
                <p className="text-xs font-bold uppercase">Código enviado para:</p>
                <p className="text-sm font-black text-blue-600">{authData.email}</p>
             </div>
             
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-black/40">Digite o código de 6 dígitos</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000" 
                  className="w-full bg-white border-2 border-black rounded-xl py-4 text-center text-3xl font-black tracking-[10px] outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                  value={userOtpInput} 
                  onChange={e => setUserOtpInput(e.target.value.replace(/\D/g, ''))} 
                  required 
                />
             </div>

             <div className="space-y-3">
                <button type="submit" className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black uppercase text-xs shadow-lg active:translate-y-1 transition-all flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> VERIFICAR CÓDIGO
                </button>
                <button type="button" onClick={() => setAuthMode('recovery')} className="w-full text-[10px] font-black uppercase text-black/40 py-2 underline">
                  Não recebi o código / Alterar E-mail
                </button>
             </div>
          </form>
        )}

        {authMode === 'reset' && (
          <form onSubmit={handleResetPassword} className="w-full space-y-4">
             <div className="bg-green-50 border-2 border-green-200 p-4 rounded-2xl flex items-center gap-3 mb-2">
                <ShieldCheck className="w-6 h-6 text-green-600" />
                <p className="text-[10px] font-black text-green-800 uppercase leading-tight">
                  Identidade Confirmada! Agora escolha uma nova senha forte para o seu perfil.
                </p>
             </div>
             <div className="relative space-y-1">
                <label className="text-[9px] font-black uppercase text-black/40 px-1">Nova Senha</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Minimo 6 caracteres" 
                  className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none pr-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                  value={newPass} 
                  onChange={e => setNewPass(e.target.value)} 
                  required 
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] text-black/40">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
             </div>
             <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black uppercase text-xs shadow-lg active:translate-y-1 transition-all">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ATUALIZAR SENHA E ENTRAR'}
             </button>
          </form>
        )}

        {(authMode === 'login' || authMode === 'register') && (
          <form onSubmit={handleAuth} className="w-full space-y-4" autoComplete="off">
            <input type="text" style={{display:'none'}} />
            <input type="password" style={{display:'none'}} />
            
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-black/40 px-1">Nome Completo do Responsável</label>
                <input 
                  type="text" 
                  name="partner_full_name"
                  placeholder="Ex: João Silva" 
                  className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                  value={authData.name} 
                  onChange={e => setAuthData({...authData, name: e.target.value})} 
                  required 
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-black/40 px-1">E-mail de Acesso</label>
              <input 
                type="email" 
                name="partner_email"
                autoComplete="new-email"
                placeholder="email@exemplo.com" 
                className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                value={authData.email} 
                onChange={e => setAuthData({...authData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="relative space-y-1">
              <label className="text-[9px] font-black uppercase text-black/40 px-1">Senha</label>
              <input 
                type={showPassword ? "text" : "password"} 
                name="partner_password"
                autoComplete="new-password"
                placeholder="••••••••" 
                className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none pr-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                value={authData.password} 
                onChange={e => setAuthData({...authData, password: e.target.value})} 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] text-black/40">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {authMode === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => { setAuthMode('recovery'); setAuthData({...authData, email: ''}); }} className="text-[9px] font-black uppercase text-black/40 hover:text-black transition-colors underline decoration-dotted">Esqueci minha senha</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black uppercase text-xs shadow-lg active:translate-y-1 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : authMode === 'login' ? 'ENTRAR NO PAINEL' : 'CRIAR MINHA CONTA'}
            </button>
          </form>
        )}

        {authMode !== 'recovery' && authMode !== 'verify' && authMode !== 'reset' && (
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-6 text-[10px] font-black uppercase underline decoration-black/20 opacity-40 hover:opacity-100 transition-opacity">{authMode === 'login' ? 'Ainda não é parceiro? Cadastre-se' : 'Já possui conta? Faça login'}</button>
        )}
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
             <button type="button" onClick={() => setIsChangingPass(true)} className="bg-white border-2 border-black p-2 rounded-xl shadow-sm hover:bg-black hover:text-yellow-400 transition-all"><Key className="w-4 h-4"/></button>
          </div>

          <div className="flex justify-center">
            <div className="relative group">
              <img src={formData.photoUrl} className="w-24 h-24 rounded-full border-4 border-black object-cover bg-white shadow-xl transition-transform group-hover:scale-105" alt="Preview" />
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
               <label className="text-[10px] font-black uppercase text-black/40 px-1">Nome do Negócio / Fantasia</label>
               <input type="text" placeholder="Ex: PADARIA CENTRAL" className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold uppercase text-sm outline-none shadow-sm focus:ring-2 ring-yellow-400/50" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-black/40 px-1">Ramo de Atividade Principal</label>
               <div className="relative">
                 <select className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs appearance-none outline-none shadow-sm" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} required>
                   <option value="">Selecione sua Especialidade</option>
                   {Object.entries({...PRO_CATEGORIES, ...COMERCIO_CATEGORIES}).map(([cat, subs]) => (
                     <optgroup key={cat} label={cat}>{subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}</optgroup>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-black/40 px-1 flex items-center gap-1"><FileText className="w-3 h-3"/> Descrição / O que você faz?</label>
               <textarea 
                 placeholder="Conte um pouco sobre sua experiência, serviços que oferece e diferenciais..." 
                 className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none min-h-[140px] resize-none shadow-sm focus:ring-2 ring-yellow-400/50" 
                 value={formData.bio} 
                 onChange={e => setFormData({...formData, bio: e.target.value})} 
               />
               <p className="text-[8px] font-bold text-black/30 uppercase italic px-1">Dica: Perfis com descrições detalhadas recebem 3x mais contatos!</p>
            </div>

            <div className="bg-white border-2 border-black rounded-3xl p-5 space-y-4 shadow-sm">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase text-black/40">Onde fica seu local?</h4>
                  <button type="button" onClick={() => geocodeAddress()} disabled={isGeocoding} className="text-[9px] font-black uppercase bg-black text-yellow-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                    {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin"/> : <><MapPin className="w-3 h-3"/> Localizar via IA</>}
                  </button>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Cidade" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  <input type="text" placeholder="UF" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
               </div>
               <input type="text" placeholder="Rua / Avenida e Número" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none w-full" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
               <input type="text" placeholder="Bairro" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none w-full" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-black/40 px-1">WhatsApp de Contato</label>
                 <input type="tel" placeholder="(00) 00000-0000" className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none shadow-sm" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-black/40 px-1">Telefone Fixo (Opcional)</label>
                 <input type="tel" placeholder="(00) 0000-0000" className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none shadow-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isGeocoding} className="w-full bg-black text-yellow-400 py-5 rounded-2xl font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
            {isGeocoding ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'CONCLUIR E SALVAR'}
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <div className="bg-white border-4 border-black rounded-[40px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-yellow-400 text-black font-black text-[10px] px-6 py-1 rotate-45 translate-x-4 translate-y-2 uppercase shadow-md">POPULAR</div>
              <div className="bg-yellow-400 p-4 rounded-3xl border-2 border-black shadow-lg"><Zap className="w-10 h-10 fill-black" /></div>
              <h3 className="text-2xl font-black italic uppercase">Plano VIP</h3>
              <p className="text-[11px] font-bold opacity-60 uppercase leading-tight">Destaque seu perfil no topo das buscas por 30 dias!</p>
              <div className="flex items-baseline gap-1 mt-2">
                 <span className="text-lg font-black">R$</span>
                 <span className="text-4xl font-black">9,90</span>
                 <span className="text-xs font-bold opacity-40">/mês</span>
              </div>
              <button className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-transform">Assinar VIP Agora</button>
           </div>
           
           <div className="bg-yellow-400 border-4 border-black rounded-[40px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-4 group">
              <div className="bg-black p-4 rounded-3xl border-2 border-yellow-400 shadow-lg"><Award className="w-10 h-10 text-yellow-400" /></div>
              <h3 className="text-2xl font-black italic uppercase">Plano Premium</h3>
              <p className="text-[11px] font-bold opacity-80 uppercase leading-tight">Visibilidade total o ano inteiro e suporte prioritário!</p>
              <div className="flex items-baseline gap-1 mt-2">
                 <span className="text-lg font-black">R$</span>
                 <span className="text-4xl font-black">99,00</span>
                 <span className="text-xs font-bold opacity-40">/ano</span>
              </div>
              <button className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-transform">Assinar Premium</button>
           </div>
        </div>
      )}

      {isChangingPass && (
        <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
           <div className="bg-white border-4 border-black w-full max-w-xs rounded-3xl p-6 space-y-6 shadow-[10px_10px_0px_0px_rgba(250,204,21,1)]">
              <div className="text-center space-y-2">
                 <h2 className="text-xl font-black uppercase italic">Nova Senha</h2>
                 <p className="text-[9px] font-bold opacity-40 uppercase">Dica: Use letras, números e símbolos.</p>
              </div>
              <div className="relative">
                 <input 
                   type={showPassword ? "text" : "password"} 
                   placeholder="Digite a nova senha" 
                   className="w-full bg-gray-50 border-2 border-black rounded-xl p-4 font-bold outline-none pr-12" 
                   value={newPass} 
                   onChange={e => setNewPass(e.target.value)} 
                   minLength={6}
                 />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setIsChangingPass(false)} className="flex-1 text-[10px] font-black uppercase opacity-40 py-2">Cancelar</button>
                 <button onClick={handleUpdatePassword} className="flex-[2] bg-black text-yellow-400 py-3 rounded-xl font-black uppercase text-xs shadow-lg active:translate-y-1">Confirmar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProTab;
