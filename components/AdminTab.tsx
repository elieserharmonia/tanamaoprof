
import React, { useState } from 'react';
import { Professional, Review } from '../types';
import { 
  Shield, Eye, EyeOff, Award, TrendingUp, Settings, 
  Megaphone, Globe, DollarSign, Lightbulb, Lock, Unlock, 
  ChevronRight, AlertCircle, Copy, Check, MessageCircle,
  PlusCircle, UserPlus
} from 'lucide-react';
import { DAYS_OF_WEEK, ALL_SPECIALTIES, getCategoryFromSpecialty } from '../constants';

interface AdminTabProps {
  professionals: Professional[];
  updateProfessional: (pro: Professional) => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ professionals, updateProfessional }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'moderation' | 'benefits' | 'strategy' | 'create'>('moderation');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const [newProData, setNewProData] = useState<Partial<Professional>>({
    companyName: '',
    proName: '',
    bio: '',
    profileType: 'Profissional',
    category: '',
    subCategory: '',
    state: 'SP',
    city: 'Torrinha',
    phone: '',
    whatsapp: '',
    photoUrl: 'https://img.icons8.com/fluency/200/new-view.png',
    workingHours: DAYS_OF_WEEK.map(d => ({ day: d, start: '08:00', end: '18:00', closed: false })),
    isClaimable: true,
    isVip: false,
    isHighlighted: false,
    isEmergency24h: false,
    reviews: [],
    servicesPhotos: []
  });

  const MASTER_PASSWORD = 'admin123'; 

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === MASTER_PASSWORD) {
      setIsAdminAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setAdminPass('');
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleCreatePro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProData.companyName && !newProData.proName) return alert('Insira um nome.');
    if (!newProData.subCategory) return alert('Selecione uma especialidade.');

    const category = getCategoryFromSpecialty(newProData.subCategory);
    
    const pro: Professional = {
      ...newProData,
      category,
      id: Math.random().toString(36).substr(2, 9),
      userId: 'admin_seed',
      companyName: newProData.companyName?.toUpperCase(),
    } as Professional;

    updateProfessional(pro);
    alert('Perfil "Semente" criado! O profissional receberá um convite para reivindicar.');
    setNewProData({
      ...newProData,
      companyName: '',
      proName: '',
      bio: '',
      phone: '',
      whatsapp: '',
      subCategory: '',
      photoUrl: 'https://img.icons8.com/fluency/200/new-view.png'
    });
  };

  const toggleReviewVisibility = (pro: Professional, reviewId: string) => {
    const updatedReviews = pro.reviews.map(r => 
      r.id === reviewId ? { ...r, hidden: !r.hidden } : r
    );
    updateProfessional({ ...pro, reviews: updatedReviews });
  };

  const toggleBenefit = (pro: Professional, benefit: 'isVip' | 'isHighlighted') => {
    updateProfessional({ ...pro, [benefit]: !pro[benefit] });
  };

  const handleCopyMessage = (text: string, id: string) => {
    const link = window.location.origin;
    const finalText = text.replace('[LINK]', link);
    navigator.clipboard.writeText(finalText);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-xs space-y-8 text-center">
          <div className="relative inline-block">
            <div className={`bg-black p-5 rounded-3xl shadow-2xl transition-transform ${error ? 'animate-shake bg-red-600' : 'animate-bounce'}`}>
              <Shield className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-black">Acesso Gerencial</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Autenticação obrigatória</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input 
              autoFocus
              type="password" 
              placeholder="DIGITE A SENHA MESTRE"
              className={`w-full bg-white border-4 rounded-2xl py-4 text-center tracking-[0.2em] outline-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-1 focus:translate-y-1 ${error ? 'border-red-600 text-red-600' : 'border-black text-black font-black'}`}
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
            />
            <button 
              type="submit"
              className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]"
            >
              Acessar Painel <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          .animate-shake { animation: shake 0.2s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="bg-black text-yellow-400 px-4 py-2 rounded-lg flex items-center gap-2">
          <Unlock className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Gerência Ativa</span>
        </div>
        <button onClick={() => setIsAdminAuthenticated(false)} className="text-[10px] font-black uppercase underline text-black/40">Logout</button>
      </div>

      <div className="flex gap-1 mb-6 bg-black/5 p-1 rounded-xl border border-black/10 overflow-x-auto scrollbar-hide">
        {['moderation', 'create', 'benefits', 'strategy'].map((t) => (
          <button 
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`flex-1 min-w-[80px] py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === t ? 'bg-black text-yellow-400 shadow-lg scale-105' : 'text-gray-500'}`}
          >
            {t === 'moderation' ? 'Moderar' : t === 'create' ? 'Cadastrar' : t === 'benefits' ? 'Planos' : 'Dicas'}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="font-black text-xl uppercase italic">Novo Perfil Semente</h2>
          
          <form onSubmit={handleCreatePro} className="bg-white border-4 border-black p-4 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase mb-1 block">Nome do Negócio</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-sm uppercase"
                value={newProData.companyName}
                onChange={e => setNewProData({...newProData, companyName: e.target.value})}
                placeholder="Ex: FARMÁCIA AVENIDA"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase mb-1 block">Especialidade / Ramo</label>
              <select 
                className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs"
                value={newProData.subCategory}
                onChange={e => setNewProData({...newProData, subCategory: e.target.value})}
              >
                <option value="">Selecione...</option>
                {ALL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black uppercase mb-1 block">Cidade</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs"
                  value={newProData.city}
                  onChange={e => setNewProData({...newProData, city: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase mb-1 block">WhatsApp</label>
                <input 
                  type="tel" 
                  className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs"
                  value={newProData.whatsapp}
                  onChange={e => setNewProData({...newProData, whatsapp: e.target.value})}
                  placeholder="Número com DDD"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-yellow-400 text-black border-4 border-black py-4 rounded-2xl font-black uppercase italic tracking-tighter shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Publicar e Convidar
            </button>
          </form>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="font-black text-xl uppercase italic">Fila de Moderação</h2>
          <div className="space-y-4">
            {professionals.map(pro => (
              pro.reviews.length > 0 && (
                <div key={pro.id} className="border-2 border-black rounded-2xl p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                  <h3 className="font-black text-[10px] uppercase text-yellow-600">{pro.companyName || pro.proName}</h3>
                  <div className="space-y-2">
                    {pro.reviews.map(rev => (
                      <div key={rev.id} className={`p-2 rounded-lg border-2 flex justify-between items-center ${rev.hidden ? 'bg-red-50 border-red-200 opacity-50' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex-1">
                          <span className="text-[9px] font-black block">{rev.userName}</span>
                          <p className="text-[9px] italic">"{rev.comment}"</p>
                        </div>
                        <button onClick={() => toggleReviewVisibility(pro, rev.id)} className="p-2 bg-white rounded-xl border-2 border-black">
                          {rev.hidden ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-600" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {activeTab === 'benefits' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="font-black text-xl uppercase italic">Gestão de Visibilidade</h2>
          <div className="space-y-3">
            {professionals.map(pro => (
              <div key={pro.id} className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-black text-xs uppercase truncate">{pro.companyName || pro.proName}</h3>
                  {pro.isClaimable && <span className="text-[8px] text-blue-600 font-black uppercase italic">Pendente Reivindicação</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleBenefit(pro, 'isVip')} className={`p-2 rounded-xl border-2 ${pro.isVip ? 'bg-black text-yellow-400 border-black' : 'bg-white border-gray-200 text-gray-400'}`}><Award className="w-4 h-4" /></button>
                  <button onClick={() => toggleBenefit(pro, 'isHighlighted')} className={`p-2 rounded-xl border-2 ${pro.isHighlighted ? 'bg-yellow-400 text-black border-black' : 'bg-white border-gray-200 text-gray-400'}`}><TrendingUp className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
           <div className="bg-black text-yellow-400 p-6 rounded-3xl shadow-xl overflow-hidden relative border-4 border-yellow-400/20">
            <h2 className="text-2xl font-black italic mb-2 relative z-10">CRESCIMENTO</h2>
            <Lightbulb className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-yellow-400/20 rotate-12" />
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <PlusCircle className="w-5 h-5 text-black" />
              <h3 className="font-black text-sm uppercase italic">Passos para Engajar</h3>
            </div>
            <TipCard 
              title="Crie 10 Perfis Hoje" 
              text="Cadastre os 10 profissionais mais conhecidos da sua cidade. O TáNaMão enviará um e-mail a cada nova avaliação que eles receberem, motivando-os a assumir a conta." 
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-black" />
              <h3 className="font-black text-sm uppercase italic tracking-tighter">Copy para WhatsApp</h3>
            </div>
            <div className="space-y-3">
               <CopyCard 
                id="msg1"
                title="Aviso de Reivindicação" 
                text="Tudo bem? Notei que seu serviço é referência na cidade e tomei a liberdade de criar uma vitrine prévia para você no TáNaMão. Já temos clientes procurando por seu serviço. Reivindique seu perfil gratuitamente para gerenciar suas fotos e receber notificações: [LINK]" 
                status={copyStatus}
                onCopy={handleCopyMessage}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const TipCard: React.FC<{title: string, text: string}> = ({title, text}) => (
  <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <h4 className="font-black text-xs uppercase text-black mb-1 italic">{title}</h4>
    <p className="text-[10px] font-medium text-gray-600 leading-tight">{text}</p>
  </div>
);

const CopyCard: React.FC<{
  id: string, 
  title: string, 
  text: string, 
  status: string | null, 
  onCopy: (t: string, id: string) => void
}> = ({id, title, text, status, onCopy}) => (
  <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-black text-[10px] uppercase text-yellow-600">{title}</h4>
      <button 
        onClick={() => onCopy(text, id)}
        className={`p-1.5 rounded-lg border-2 transition-all ${status === id ? 'bg-green-500 border-black text-white' : 'bg-black border-black text-yellow-400'}`}
      >
        {status === id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
    <p className="text-[9px] font-medium text-gray-700 leading-relaxed pr-8 italic">"{text.replace('[LINK]', window.location.origin)}"</p>
  </div>
);

export default AdminTab;
