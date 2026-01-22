
import React, { useState } from 'react';
import { Professional, PlanType } from '../types';
import { 
  Shield, Eye, EyeOff, Award, TrendingUp, Unlock, 
  ChevronRight, Copy, Check, MessageCircle, Video, Play,
  PlusCircle, MapPin, DollarSign, Settings, Save, RefreshCcw, Loader2, Trash2, UserPlus, MessageSquare, X, Key, Sparkles, Download, MonitorPlay, Briefcase, Phone, User as UserIcon,
  Globe, Smartphone, Store, Apple, Play as PlayIcon, Layout, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { DAYS_OF_WEEK, ALL_SPECIALTIES, getCategoryFromSpecialty, PLAN_PRICES } from '../constants';
import { db } from '../services/db';
import { GoogleGenAI } from "@google/genai";

interface AdminTabProps {
  professionals: Professional[];
  updateProfessional: (pro: Professional) => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ professionals, updateProfessional }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [activeTab, setActiveTab] = useState<'finance' | 'moderation' | 'create' | 'marketing' | 'publish' | 'config'>('finance');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [masterPassInput, setMasterPassInput] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [promoVideoUrl, setPromoVideoUrl] = useState<string | null>(null);
  const [videoTheme, setVideoTheme] = useState('Modern Business');

  const INITIAL_NEW_PRO: Partial<Professional> = {
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
    isClaimable: true
  };

  const [newPro, setNewPro] = useState<Partial<Professional>>(INITIAL_NEW_PRO);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = await db.getMasterPassword();
    if (adminPass === correctPass) {
      setIsAdminAuthenticated(true);
    } else {
      alert('Senha mestre incorreta!');
    }
  };

  const handleGeneratePromoVideo = async () => {
    if (!(window as any).aistudio || !(await (window as any).aistudio.hasSelectedApiKey())) {
      alert("Para gerar vídeos com IA, você precisa selecionar uma chave de API de um projeto com faturamento ativo.");
      await (window as any).aistudio.openSelectKey();
      return;
    }

    setIsGeneratingVideo(true);
    setPromoVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A high-quality, professional cinematic promotional video for a local services app called 'TáNaMão'. Theme: ${videoTheme}. Show people working happily, tools, and a futuristic smartphone interface. Bright lighting, vibrant colors.`,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '9:16'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setPromoVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("entity was not found")) {
        alert("Erro na chave de API. Por favor, selecione novamente.");
        await (window as any).aistudio.openSelectKey();
      } else {
        alert("Erro ao gerar vídeo: " + err.message);
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleUpdateMasterPass = async () => {
    if (!masterPassInput) return;
    try { 
      await db.updateMasterPassword(masterPassInput); 
      alert('Senha mestre alterada!'); 
      setMasterPassInput(''); 
    } catch (err) { 
      alert('Erro ao alterar senha.'); 
    }
  };

  const handleCreatePro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const proToSave = {
        ...newPro,
        id: Math.random().toString(36).substr(2, 9),
        userId: 'admin_manual',
        category: getCategoryFromSpecialty(newPro.subCategory || ''),
        companyName: newPro.companyName?.toUpperCase(),
        createdAt: new Date().toISOString(),
      } as Professional;
      
      await db.saveProfessional(proToSave);
      setSuccessMessage('Perfil criado com sucesso!');
      setNewPro({
        ...INITIAL_NEW_PRO,
        city: newPro.city,
        state: newPro.state
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert('Erro ao cadastrar: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="bg-black p-5 rounded-3xl shadow-2xl animate-bounce mb-8">
          <Shield className="w-12 h-12 text-yellow-400" />
        </div>
        <form onSubmit={handleAdminLogin} className="w-full max-w-xs space-y-4" autoComplete="off">
          <div className="relative">
             <input 
               type={showAdminPass ? "text" : "password"} 
               name="master_admin_password"
               autoComplete="new-password"
               placeholder="SENHA MESTRE" 
               className="w-full border-4 border-black rounded-2xl py-4 text-center font-black outline-none" 
               value={adminPass} 
               onChange={e => setAdminPass(e.target.value)} 
             />
             <button type="button" onClick={() => setShowAdminPass(!showAdminPass)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
               {showAdminPass ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
             </button>
          </div>
          <button type="submit" className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Acessar Painel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex gap-1 bg-black/5 p-1 rounded-xl overflow-x-auto scrollbar-hide sticky top-2 z-50 backdrop-blur-md">
        {[
          { id: 'finance', label: 'Parceiros' },
          { id: 'moderation', label: 'Moderar' },
          { id: 'create', label: 'Cadastrar' },
          { id: 'marketing', label: 'Marketing' },
          { id: 'publish', label: 'Lojas' },
          { id: 'config', label: 'Config' }
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id as any); setSuccessMessage(null); }} className={`flex-1 min-w-[80px] py-2 rounded-lg font-black text-[9px] uppercase transition-all ${activeTab === t.id ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <div className="space-y-6 animate-in slide-in-from-right relative">
          {successMessage && (
            <div className="bg-green-500 text-white p-4 rounded-2xl border-2 border-black font-black uppercase text-xs text-center animate-in zoom-in duration-300 shadow-lg mb-4 flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> {successMessage}
            </div>
          )}

          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2"><UserPlus className="w-6 h-6" /> Cadastro Manual</h3>
            <form onSubmit={handleCreatePro} className="space-y-4">
              <input type="text" placeholder="Nome do Negócio" className="w-full border-2 border-black rounded-xl p-3 font-bold uppercase text-xs" value={newPro.companyName} onChange={e => setNewPro({...newPro, companyName: e.target.value})} required />
              <select className="w-full border-2 border-black rounded-xl p-3 font-bold text-xs" value={newPro.subCategory} onChange={e => setNewPro({...newPro, subCategory: e.target.value})} required>
                <option value="">Selecione a Especialidade</option>
                {ALL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Cidade" className="w-full border-2 border-black rounded-xl p-3 font-bold text-xs" value={newPro.city} onChange={e => setNewPro({...newPro, city: e.target.value})} />
                <input type="text" placeholder="WhatsApp" className="w-full border-2 border-black rounded-xl p-3 font-bold text-xs" value={newPro.whatsapp} onChange={e => setNewPro({...newPro, whatsapp: e.target.value})} />
              </div>
              <textarea placeholder="Bio/Descrição" className="w-full border-2 border-black rounded-xl p-3 font-bold text-xs min-h-[100px]" value={newPro.bio} onChange={e => setNewPro({...newPro, bio: e.target.value})} />
              <div className="flex items-center gap-2 bg-yellow-400/20 p-3 rounded-xl border border-yellow-400">
                <input type="checkbox" id="claimable" checked={newPro.isClaimable} onChange={e => setNewPro({...newPro, isClaimable: e.target.checked})} className="w-5 h-5 accent-black" />
                <label htmlFor="claimable" className="text-[10px] font-black uppercase">Permitir que o dono assuma o perfil</label>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CADASTRAR PROFISSIONAL'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'publish' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="bg-black text-white p-6 rounded-[32px] border-4 border-yellow-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black italic uppercase flex items-center gap-2 mb-2">
              <Smartphone className="w-6 h-6 text-yellow-400" /> Publicar nas Lojas
            </h3>
            <p className="text-[10px] font-bold opacity-60 uppercase mb-6 leading-tight">
              Transforme seu PWA em um aplicativo nativo para Google Play e App Store.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-yellow-400">
                  <PlayIcon className="w-5 h-5 fill-current" />
                  <span className="font-black uppercase text-xs">Google Play</span>
                </div>
                <p className="text-[9px] font-medium opacity-70">Use **TWA (Trusted Web Activity)** ou **Capacitor**. É o processo mais simples.</p>
                <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-2 py-1 rounded text-[8px] font-black uppercase">
                  <CheckCircle2 className="w-3 h-3" /> Requisito: Conta Developer ($25)
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <Apple className="w-5 h-5 fill-current" />
                  <span className="font-black uppercase text-xs">App Store</span>
                </div>
                <p className="text-[9px] font-medium opacity-70">Use **Capacitor**. Requer um Mac para compilar o código final para iOS.</p>
                <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-[8px] font-black uppercase">
                  <AlertTriangle className="w-3 h-3" /> Requisito: Conta Developer ($99/ano)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <h4 className="text-sm font-black uppercase italic border-b-2 border-black pb-2">Checklist Técnico</h4>
            
            <div className="space-y-4">
              {[
                { label: 'Web Manifest (manifest.json)', status: 'OK', desc: 'Configura o ícone e cores do app.' },
                { label: 'Service Worker (sw.js)', status: 'OK', desc: 'Permite funcionamento offline e cache.' },
                { label: 'Meta Tags Mobile', status: 'OK', desc: 'Ajuste de viewport e barra de status.' },
                { label: 'Ícones (192px/512px)', status: 'OK', desc: 'Necessários para a tela inicial do celular.' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded-full"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase leading-none">{item.label}</p>
                    <p className="text-[9px] font-bold opacity-40 uppercase mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-3">
              <h5 className="text-[10px] font-black uppercase text-black/40">Próximo Passo Recomendado:</h5>
              <div className="bg-gray-100 p-4 rounded-2xl border-2 border-black/5">
                <p className="text-xs font-bold leading-relaxed">
                  Para gerar os arquivos das lojas, recomendo usar o site <span className="text-blue-600 underline">PWABuilder.com</span>. Basta colar a URL do seu site lá e ele gera os pacotes prontos para Google e Apple.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-4 animate-in slide-in-from-left">
           <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black italic uppercase mb-4 flex items-center gap-2"><Settings className="w-6 h-6" /> Gestão de Perfis</h3>
              <div className="space-y-3">
                {professionals.length > 0 ? professionals.map(pro => (
                  <div key={pro.id} className="border-2 border-black/10 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-black transition-all">
                    <div className="flex items-center gap-3 truncate">
                      <img src={pro.photoUrl} className="w-10 h-10 rounded-full border-2 border-black shrink-0 object-cover" />
                      <div className="truncate">
                        <p className="text-[10px] font-black uppercase truncate">{pro.companyName || pro.proName}</p>
                        <p className="text-[8px] font-bold text-black/40 uppercase">{pro.city} • {pro.plan}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setShowDeleteConfirm(pro.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-6 text-xs font-bold opacity-30 uppercase italic">Nenhum profissional na base.</p>
                )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-4 animate-in fade-in duration-300">
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-4 border-black p-4 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                 <p className="text-[8px] font-black uppercase opacity-40">Parceiros VIP</p>
                 <p className="text-2xl font-black">{professionals.filter(p => p.plan === 'VIP').length}</p>
              </div>
              <div className="bg-yellow-400 border-4 border-black p-4 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                 <p className="text-[8px] font-black uppercase opacity-60">Parceiros Premium</p>
                 <p className="text-2xl font-black">{professionals.filter(p => p.plan === 'Premium').length}</p>
              </div>
           </div>

           <h3 className="font-black text-xs uppercase italic mt-6 flex items-center gap-2">
             <DollarSign className="w-4 h-4" /> Lista de Faturamento
           </h3>
           <div className="space-y-2">
             {professionals.filter(p => p.plan !== 'Gratuito').map(pro => (
                <div key={pro.id} className="bg-white border-2 border-black p-3 rounded-xl flex justify-between items-center group hover:bg-black hover:text-white transition-all">
                  <div>
                    <h4 className="text-[10px] font-black uppercase">{pro.companyName || pro.proName}</h4>
                    <span className={`text-[8px] font-black uppercase ${pro.plan === 'Premium' ? 'text-yellow-600' : 'text-blue-600'}`}>Plano {pro.plan}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black">R$ {pro.plan === 'Premium' ? PLAN_PRICES.ANNUAL_PREMIUM.toFixed(2) : PLAN_PRICES.MONTHLY_VIP.toFixed(2)}</p>
                    <p className="text-[8px] font-bold opacity-40 uppercase">Até {new Date(pro.subscriptionExpiresAt || '').toLocaleDateString()}</p>
                  </div>
                </div>
             ))}
             {professionals.filter(p => p.plan !== 'Gratuito').length === 0 && (
               <div className="text-center py-10 opacity-30 italic text-xs font-bold uppercase">Nenhuma assinatura ativa.</div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6 animate-in slide-in-from-bottom">
           <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2"><Key className="w-6 h-6" /> Segurança</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase opacity-40">Nova Senha Mestre</label>
                    <input type="password" placeholder="••••••••" className="w-full border-2 border-black rounded-xl p-3 font-bold" value={masterPassInput} onChange={e => setMasterPassInput(e.target.value)} />
                 </div>
                 <button onClick={handleUpdateMasterPass} className="w-full bg-black text-yellow-400 py-3 rounded-xl font-black text-xs uppercase shadow-md">Atualizar Senha</button>
              </div>
           </div>

           <div className="bg-blue-600 text-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black italic uppercase mb-2 flex items-center gap-2"><Globe className="w-6 h-6" /> Versão do App</h3>
              <p className="text-xs font-bold opacity-80 mb-4 uppercase">v2.5.0 Stable - Torrinha/SP</p>
              <button onClick={() => window.location.reload()} className="w-full bg-white text-blue-600 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2">
                <RefreshCcw className="w-4 h-4" /> Sincronizar Dados
              </button>
           </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
           <div className="bg-gradient-to-br from-indigo-900 to-black text-white p-6 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 w-12 h-12 text-yellow-400/20" />
              <h3 className="text-xl font-black italic uppercase flex items-center gap-2 mb-2"><Video className="w-6 h-6 text-yellow-400" /> Laboratório de Marketing</h3>
              <p className="text-[10px] font-bold opacity-60 uppercase mb-6 leading-tight">Gere vídeos profissionais de 7 segundos para divulgar seu app TáNaMão.</p>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase opacity-40 tracking-widest">Tema do Vídeo</label>
                    <select 
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-3 font-bold text-xs text-white outline-none appearance-none"
                      value={videoTheme}
                      onChange={e => setVideoTheme(e.target.value)}
                    >
                      <option value="Modern Business" className="text-black">Negócios Modernos</option>
                      <option value="Friendly Community" className="text-black">Comunidade Amigável</option>
                      <option value="High Tech Digital" className="text-black">Alta Tecnologia</option>
                      <option value="Worker Tools in Action" className="text-black">Ferramentas em Ação</option>
                    </select>
                 </div>

                 <button 
                   onClick={handleGeneratePromoVideo}
                   disabled={isGeneratingVideo}
                   className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-xl hover:bg-yellow-300 transition-all disabled:opacity-50"
                 >
                   {isGeneratingVideo ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-4 h-4 fill-current"/> Gerar Vídeo Promocional</>}
                 </button>

                 <p className="text-[8px] font-bold text-center text-white/30 italic">Nota: Requer conta faturada no Google Cloud.</p>
              </div>
           </div>

           {promoVideoUrl && (
              <div className="bg-white border-4 border-black p-4 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-in zoom-in">
                 <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden border-2 border-black">
                    <video src={promoVideoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                 </div>
                 <a 
                   href={promoVideoUrl} 
                   download="Promo_TaNaMao.mp4"
                   className="w-full bg-black text-yellow-400 py-4 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2"
                 >
                   <Download className="w-4 h-4" /> Baixar para Divulgação
                 </a>
              </div>
           )}

           <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
              <div className="flex-1">
                 <h4 className="text-sm font-black uppercase italic leading-none">Modo Showcase</h4>
                 <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Limpa a interface para você gravar a tela com perfeição.</p>
              </div>
              <button className="bg-black text-white p-4 rounded-2xl active:scale-95 transition-all"><MonitorPlay className="w-6 h-6"/></button>
           </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="bg-white border-4 border-black w-full max-w-xs rounded-3xl p-6 text-center space-y-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-600"><Trash2 className="w-8 h-8"/></div>
              <h3 className="font-black uppercase italic">Excluir Perfil?</h3>
              <div className="flex gap-2">
                 <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-black uppercase text-xs">Voltar</button>
                 <button onClick={async () => { 
                   await db.deleteProfessional(showDeleteConfirm); 
                   setShowDeleteConfirm(null); 
                   window.location.reload(); 
                 }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black uppercase text-xs">Sim, Excluir</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminTab;
