
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Professional, User, ServiceItem, PaymentRecord, PlanType } from '../types';
import { DAYS_OF_WEEK, PRO_CATEGORIES, COMERCIO_CATEGORIES, getCategoryFromSpecialty, PLAN_PRICES, ALL_SPECIALTIES, SUPPORT_PHONE } from '../constants';
import { db } from '../services/db';
import { paymentService } from '../services/payment';
import { Camera, Save, Lock, Mail, User as UserIcon, LogIn, Loader2, RefreshCcw, Briefcase, ShoppingBag, PlusCircle, MapPin, Award, Zap, Check, Trash2, List, Copy, ExternalLink, QrCode, AlertCircle, TrendingUp, Clock, Eye, EyeOff, ChevronDown, MessageCircle, HelpCircle, Navigation } from 'lucide-react';

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
  
  // Geocoding loading state
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Estados do Checkout
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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Navegador não suporta geolocalização.");
      return;
    }
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
        setIsGeocoding(false);
        alert("Localização capturada com sucesso!");
      },
      (err) => {
        console.error(err);
        setIsGeocoding(false);
        alert("Erro ao capturar localização. Verifique as permissões.");
      }
    );
  };

  const geocodeAddress = async () => {
    if (!formData.city || !formData.state) {
      alert("Informe cidade e estado para converter o endereço.");
      return;
    }
    
    setIsGeocoding(true);
    try {
      const addressString = `${formData.street || ''} ${formData.number || ''}, ${formData.neighborhood || ''}, ${formData.city}, ${formData.state}, Brasil`;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Encontre as coordenadas exatas (latitude e longitude) para este endereço no Brasil: ${addressString}. Retorne APENAS um JSON com as chaves "latitude" e "longitude".`,
        config: {
          tools: [{googleMaps: {}}],
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
      setFormData(prev => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude
      }));
      alert("Localização atualizada via endereço!");
    } catch (err) {
      console.error(err);
      alert("Não foi possível converter o endereço automaticamente. Use o botão 'Usar minha localização atual' se estiver no local.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const startPolling = (paymentId: string) => {
    clearInterval(pollInterval.current);
    pollInterval.current = setInterval(async () => {
      const status = await paymentService.checkStatus(paymentId);
      if (status === 'approved') {
        clearInterval(pollInterval.current);
        await db.activatePlan(currentUser!.id, selectedPlan);
        
        const updated = await db.getProfessionalByUserId(currentUser!.id);
        if (updated) {
          setExistingPro(updated);
          setFormData(updated);
        }
        setCheckoutStep('success');
      } else if (status === 'expired') {
        clearInterval(pollInterval.current);
        setCheckoutStep('expired');
      }
    }, 5000);
  };

  const handleCreatePix = async (plan: PlanType) => {
    if (!currentUser) return;
    setLoading(true);
    setSelectedPlan(plan);
    const amount = plan === 'VIP' ? PLAN_PRICES.MONTHLY_VIP : PLAN_PRICES.ANNUAL_PREMIUM;
    
    try {
      const payment = await paymentService.createPixPayment(currentUser.id, plan, amount, currentUser.email);
      setActivePayment(payment);
      setCheckoutStep('pix_display');
      startPolling(payment.external_id);
    } catch (err) {
      alert("Erro ao gerar PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Código PIX copiado!");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = authMode === 'login' 
        ? await db.signIn(authData.email, authData.password)
        : await db.signUp(authData.email, authData.password, authData.name);
      onLogin(user);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    // Se não tiver coordenadas, tenta geocodificar antes de salvar
    if (!formData.latitude || !formData.longitude) {
      const confirmSave = confirm("Você não definiu sua localização no mapa. Deseja tentar converter seu endereço em coordenadas agora?");
      if (confirmSave) {
        await geocodeAddress();
      }
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
        <div className="bg-black p-4 rounded-2xl mb-6 shadow-2xl animate-bounce">
          <Lock className="w-10 h-10 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-black uppercase mb-8 italic text-center">Área do Parceiro</h2>
        <form onSubmit={handleAuth} className="w-full space-y-4">
          {authMode === 'register' && (
            <input 
              type="text" 
              placeholder="Nome Completo" 
              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none" 
              value={authData.name} 
              onChange={e => setAuthData({...authData, name: e.target.value})} 
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="E-mail" 
            className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none" 
            value={authData.email} 
            onChange={e => setAuthData({...authData, email: e.target.value})} 
            required 
          />
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Senha" 
              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 font-bold outline-none pr-12" 
              value={authData.password} 
              onChange={e => setAuthData({...authData, password: e.target.value})} 
              required 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-[0.98] transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : authMode === 'login' ? 'ENTRAR' : 'CADASTRAR'}
          </button>
        </form>
        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-6 text-[10px] font-black uppercase underline opacity-40">
          {authMode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
        </button>
      </div>
    );
  }

  // TELAS DE PAGAMENTO
  if (activeView === 'plans') {
    if (checkoutStep === 'pix_display' && activePayment) {
      return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
          <h2 className="text-2xl font-black uppercase italic text-center">Pague com PIX</h2>
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center space-y-4">
            <p className="text-xs font-bold text-center">Use o QR Code ou copie o código PIX abaixo para concluir o pagamento.</p>
            <div className="bg-gray-100 p-2 rounded-xl border-2 border-dashed border-black/20">
              <img src={`data:image/png;base64,${activePayment.qr_code_base64}`} className="w-48 h-48" alt="QR Code PIX" />
            </div>
            <button onClick={() => copyToClipboard(activePayment.qr_code)} className="w-full bg-black text-yellow-400 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" /> Copiar código PIX
            </button>
            <button onClick={() => setCheckoutStep('waiting')} className="w-full bg-yellow-400 border-2 border-black py-3 rounded-xl font-black text-xs uppercase">
              Já paguei
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => existingPro && paymentService.sendWhatsAppNotification('pending', existingPro, 'support')} className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-green-700 bg-green-50 p-3 rounded-xl border border-green-200">
               <MessageCircle className="w-4 h-4" /> Receber instruções no WhatsApp
            </button>
            <button onClick={() => setCheckoutStep('selection')} className="w-full text-xs font-black uppercase opacity-40 py-2">Voltar</button>
          </div>
        </div>
      );
    }

    if (checkoutStep === 'waiting') {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-pulse">
           <div className="bg-black p-6 rounded-full border-4 border-yellow-400">
             <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
           </div>
           <h2 className="text-xl font-black uppercase italic text-center">Aguardando pagamento</h2>
           <button onClick={() => setCheckoutStep('pix_display')} className="text-xs font-black uppercase underline">Ver QR Code novamente</button>
        </div>
      );
    }

    if (checkoutStep === 'success') {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-in zoom-in duration-500">
           <div className="bg-green-500 p-6 rounded-full border-4 border-black shadow-xl">
             <Check className="w-12 h-12 text-white" />
           </div>
           <h2 className="text-2xl font-black uppercase italic text-center">Pagamento confirmado</h2>
           <div className="w-full space-y-3">
             <button onClick={() => { setCheckoutStep('selection'); setActiveView('profile'); }} className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase shadow-lg">
               Ir para meu perfil
             </button>
           </div>
        </div>
      );
    }

    if (checkoutStep === 'expired') {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] space-y-6">
           <div className="bg-red-500 p-6 rounded-full border-4 border-black">
             <AlertCircle className="w-12 h-12 text-white" />
           </div>
           <h2 className="text-xl font-black uppercase italic text-center">Pagamento expirado</h2>
           <button onClick={() => setCheckoutStep('selection')} className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase shadow-lg">
             Gerar novo PIX
           </button>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-6 animate-in slide-in-from-bottom duration-300">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-black uppercase italic">Escolha seu plano</h2>
          <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Destaque seu perfil e apareça para mais clientes.</p>
        </div>

        <div className="grid gap-6">
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
             <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black italic uppercase">Plano VIP</h3>
                  <p className="text-lg font-black text-yellow-600">R$ 9,90 <span className="text-[10px] text-black/40">/mês</span></p>
                </div>
                {formData.plan === 'VIP' && <span className="bg-green-500 text-white p-1 rounded-full"><Check className="w-4 h-4"/></span>}
             </div>
             <ul className="space-y-2 mb-6">
                {["Destaque nas buscas", "Prioridade na categoria", "Selo VIP ★", "Galeria de Fotos"].map((b,i) => (
                  <li key={i} className="text-[10px] font-black uppercase flex items-center gap-2"><Check className="w-3 h-3 text-green-600"/> {b}</li>
                ))}
             </ul>
             <button onClick={() => handleCreatePix('VIP')} className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Assinar VIP Mensal</button>
          </div>

          <div className="bg-yellow-400 border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
             <div className="absolute top-2 right-2 rotate-12">
                <Zap className="w-12 h-12 text-white/40 fill-white/20" />
             </div>
             <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black italic uppercase">Plano Premium</h3>
                  <p className="text-lg font-black text-black">R$ 99,00 <span className="text-[10px] opacity-40">/ano</span></p>
                </div>
                {formData.plan === 'Premium' && <span className="bg-green-500 text-white p-1 rounded-full border-2 border-black"><Check className="w-4 h-4"/></span>}
             </div>
             <ul className="space-y-2 mb-6">
                {["Destaque máximo por 12 meses", "Selo Premium Exclusivo", "Prioridade máxima de busca", "Melhor custo-benefício"].map((b,i) => (
                  <li key={i} className="text-[10px] font-black uppercase flex items-center gap-2"><Check className="w-3 h-3 text-black"/> {b}</li>
                ))}
             </ul>
             <button onClick={() => handleCreatePix('Premium')} className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all border-2 border-white/20">Assinar Premium Anual</button>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => setActiveView('profile')} className="w-full py-2 text-[10px] font-black uppercase underline opacity-40">Manter plano gratuito</button>
          <button onClick={() => window.open(`https://wa.me/${SUPPORT_PHONE}?text=Olá, preciso de ajuda com os planos do TáNaMão`, '_blank')} className="flex items-center gap-2 text-[10px] font-black uppercase text-black bg-white px-6 py-3 rounded-full border-2 border-black shadow-md hover:scale-105 transition-all">
            <MessageCircle className="w-4 h-4 text-green-600" /> Falar com Suporte WhatsApp
          </button>
        </div>
      </div>
    );
  }

  const currentCategories = formData.profileType === 'Profissional' ? PRO_CATEGORIES : COMERCIO_CATEGORIES;

  return (
    <div className="p-4 pb-20">
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveView('profile')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${activeView === 'profile' ? 'bg-black text-yellow-400 border-black shadow-md' : 'bg-white text-black border-black/10'}`}>Meus Dados</button>
        <button onClick={() => setActiveView('plans')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${activeView === 'plans' ? 'bg-yellow-400 text-black border-black shadow-md' : 'bg-white text-black border-black/10'}`}>
          {formData.plan === 'Gratuito' ? 'Seja VIP' : `Assinatura ${formData.plan} ✓`}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <div className="relative group">
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
             <input type="text" placeholder="Ex: PADARIA CENTRAL" className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold uppercase text-sm outline-none shadow-sm focus:border-yellow-600" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-black/40">Tipo de Perfil</label>
             <div className="flex gap-2">
                {(['Profissional', 'Comercio'] as const).map(t => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setFormData({...formData, profileType: t, subCategory: ''})}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${formData.profileType === t ? 'bg-black text-yellow-400 border-black' : 'bg-white text-black border-black/10'}`}
                  >
                    {t === 'Comercio' ? 'Comércio' : t}
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-black/40">Ramo de Atividade / Categoria</label>
             <div className="relative">
               <select 
                 className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs appearance-none outline-none shadow-sm"
                 value={formData.subCategory}
                 onChange={e => setFormData({...formData, subCategory: e.target.value})}
                 required
               >
                 <option value="">Selecione sua especialidade</option>
                 {Object.entries(currentCategories).map(([cat, subs]) => (
                   <optgroup key={cat} label={cat}>
                     {subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                   </optgroup>
                 ))}
                 <option value="Outros">Outros</option>
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-40" />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-black/40">Slogan / Bio</label>
             <textarea 
               placeholder="Conte um pouco sobre seu trabalho..." 
               className="w-full bg-white border-2 border-black rounded-xl p-3 font-medium text-sm outline-none shadow-sm focus:border-yellow-600 min-h-[150px] resize-none" 
               rows={5} 
               value={formData.bio} 
               onChange={e => setFormData({...formData, bio: e.target.value})} 
             />
          </div>

          <div className="bg-white border-2 border-black rounded-3xl p-4 space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase text-black/40">Localização do Negócio</h4>
                <div className="flex items-center gap-1">
                   <div className={`w-2 h-2 rounded-full ${formData.latitude ? 'bg-green-500' : 'bg-red-500'}`} />
                   <span className="text-[8px] font-black uppercase">{formData.latitude ? 'Coordenadas Ativas' : 'Pendente'}</span>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Cidade" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                <input type="text" placeholder="UF" className="bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
             </div>
             <input type="text" placeholder="Rua e Número" className="w-full bg-gray-50 border-2 border-black/10 rounded-xl p-3 font-bold text-xs outline-none" value={`${formData.street || ''} ${formData.number || ''}`} onChange={e => {
                const parts = e.target.value.split(' ');
                setFormData({...formData, street: parts[0], number: parts[1] || ''});
             }} />

             <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={handleGetCurrentLocation}
                  disabled={isGeocoding}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-yellow-400 py-3 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all"
                >
                  {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Navigation className="w-4 h-4" /> Usar GPS Atual</>}
                </button>
                <button 
                  type="button" 
                  onClick={geocodeAddress}
                  disabled={isGeocoding}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-black py-3 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all"
                >
                  <MapPin className="w-4 h-4" /> Validar Endereço
                </button>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-black/40">WhatsApp</label>
              <input type="tel" placeholder="(00) 00000-0000" className="bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none shadow-sm focus:border-yellow-600" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-black/40">Telefone Fixo</label>
              <input type="tel" placeholder="(00) 0000-0000" className="bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none shadow-sm focus:border-yellow-600" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-black shadow-md">
             <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${formData.isEmergency24h ? 'bg-red-600' : 'bg-gray-100'}`}>
                <Clock className={`w-5 h-5 ${formData.isEmergency24h ? 'text-white' : 'text-gray-400'}`} />
             </div>
             <div className="flex-1">
                <p className="text-[10px] font-black uppercase">Atendimento 24h / Emergência</p>
                <p className="text-[8px] font-bold text-black/40 uppercase">Ative se você atende fora do horário comercial.</p>
             </div>
             <button type="button" onClick={() => setFormData({...formData, isEmergency24h: !formData.isEmergency24h})} className={`w-12 h-6 rounded-full border-2 border-black relative transition-all ${formData.isEmergency24h ? 'bg-green-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black shadow-sm transition-all ${formData.isEmergency24h ? 'right-0.5' : 'left-0.5'}`} />
             </button>
          </div>
        </div>

        <button type="submit" disabled={isGeocoding} className="w-full bg-black text-yellow-400 py-5 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
          SALVAR MEU PERFIL
        </button>
      </form>
    </div>
  );
};

export default ProTab;
