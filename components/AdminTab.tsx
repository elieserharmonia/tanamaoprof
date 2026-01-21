
import React, { useState, useEffect } from 'react';
import { Professional, Review, MpConfig, PlanType } from '../types';
import { 
  Shield, Eye, EyeOff, Award, TrendingUp, Lightbulb, Unlock, 
  ChevronRight, Copy, Check, MessageCircle,
  PlusCircle, MapPin, DollarSign, Settings, Globe, CreditCard, Save, RefreshCcw, Loader2, Trash2, UserPlus, MessageSquare, X, Key
} from 'lucide-react';
import { DAYS_OF_WEEK, ALL_SPECIALTIES, getCategoryFromSpecialty, PLAN_PRICES } from '../constants';
import { db } from '../services/db';

interface AdminTabProps {
  professionals: Professional[];
  updateProfessional: (pro: Professional) => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ professionals, updateProfessional }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [activeTab, setActiveTab] = useState<'finance' | 'moderation' | 'create' | 'config'>('finance');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [masterPassInput, setMasterPassInput] = useState('');

  // States para criação de perfil
  const [newPro, setNewPro] = useState<Partial<Professional>>({
    companyName: '',
    proName: '',
    category: '',
    subCategory: '',
    city: 'Torrinha',
    state: 'SP',
    phone: '',
    whatsapp: '',
    email: '',
    bio: '',
    plan: 'Gratuito',
    isClaimable: true,
    photoUrl: 'https://img.icons8.com/fluency/200/user-male-circle.png'
  });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = await db.getMasterPassword();
    if (adminPass === correctPass) {
      setIsAdminAuthenticated(true);
    } else {
      alert('Senha mestre incorreta!');
    }
  };

  const handleUpdateMasterPass = async () => {
    if (!masterPassInput) return;
    try {
      await db.updateMasterPassword(masterPassInput);
      alert('Senha mestre alterada com sucesso!');
      setMasterPassInput('');
    } catch (err) { alert('Erro ao alterar senha.'); }
  };

  const handleCreatePro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pro: Professional = {
        ...newPro,
        id: Math.random().toString(36).substr(2, 9),
        userId: 'admin-created',
        reviews: [],
        views: 0,
        createdAt: new Date().toISOString(),
        workingHours: [],
        servicesPhotos: [],
        servicesList: [],
        experienceYears: 0,
        isVip: newPro.plan !== 'Gratuito',
        isHighlighted: newPro.plan === 'Premium',
        isEmergency24h: false
      } as Professional;
      await db.saveProfessional(pro);
      alert('Perfil profissional criado!');
      setNewPro({ ...newPro, companyName: '', proName: '', phone: '', email: '', whatsapp: '', bio: '' });
      window.location.reload(); 
    } catch (err) { alert('Erro ao criar perfil.'); } finally { setLoading(false); }
  };

  const handleDeletePro = async (id: string) => {
    setLoading(true);
    try {
      await db.deleteProfessional(id);
      alert('Perfil excluído permanentemente.');
      window.location.reload();
    } catch (err) { alert('Erro ao excluir perfil.'); } finally { setLoading(false); setShowDeleteConfirm(null); }
  };

  const handleToggleReview = async (pro: Professional, reviewId: string) => {
     const updatedReviews = pro.reviews.map(r => r.id === reviewId ? { ...r, hidden: !r.hidden } : r);
     updateProfessional({ ...pro, reviews: updatedReviews });
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="bg-black p-5 rounded-3xl shadow-2xl animate-bounce mb-8">
          <Shield className="w-12 h-12 text-yellow-400" />
        </div>
        <form onSubmit={handleAdminLogin} className="w-full max-w-xs space-y-4">
          <div className="relative">
             <input type={showAdminPass ? "text" : "password"} placeholder="SENHA MESTRE" className="w-full border-4 border-black rounded-2xl py-4 text-center font-black outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
             <button type="button" onClick={() => setShowAdminPass(!showAdminPass)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">{showAdminPass ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
          </div>
          <button type="submit" className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Acessar Painel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="flex gap-1 bg-black/5 p-1 rounded-xl overflow-x-auto scrollbar-hide">
        {['finance', 'moderation', 'create', 'config'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-[80px] py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === t ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500'}`}>
            {t === 'finance' ? 'Parceiros' : t === 'moderation' ? 'Moderar' : t === 'create' ? 'Cadastrar' : 'Config'}
          </button>
        ))}
      </div>

      {activeTab === 'finance' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h3 className="font-black text-xs uppercase italic">Parceiros Ativos (VIP/Premium)</h3>
          {professionals.filter(p => p.plan !== 'Gratuito').length > 0 ? (
            professionals.filter(p => p.plan !== 'Gratuito').map(pro => (
              <div key={pro.id} className="bg-white border-2 border-black p-3 rounded-xl flex justify-between items-center group">
                <div>
                  <h4 className="text-[10px] font-black uppercase">{pro.companyName || pro.proName}</h4>
                  <span className={`text-[8px] font-black uppercase ${pro.plan === 'Premium' ? 'text-yellow-600' : 'text-blue-600'}`}>Plano {pro.plan}</span>
                </div>
                <button onClick={() => setShowDeleteConfirm(pro.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))
          ) : ( <p className="text-center py-10 text-[10px] font-black uppercase opacity-30">Nenhum parceiro no momento.</p> )}

          <h3 className="font-black text-xs uppercase italic mt-8 border-t pt-4">Todos os Perfis (Moderação/Exclusão)</h3>
          {professionals.map(pro => (
            <div key={pro.id} className="bg-gray-50 border border-black/5 p-3 rounded-xl flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <img src={pro.photoUrl} className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-[10px] font-bold uppercase">{pro.companyName || pro.proName}</span>
                  {pro.plan === 'Gratuito' && <span className="text-[7px] bg-gray-200 px-1 rounded">FREE</span>}
               </div>
               <button onClick={() => setShowDeleteConfirm(pro.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <h3 className="font-black text-xs uppercase italic">Moderação de Comentários</h3>
           <div className="space-y-4">
              {professionals.some(p => p.reviews.length > 0) ? (
                 professionals.flatMap(p => p.reviews.map(r => ({ pro: p, review: r }))).map(({pro, review}) => (
                    <div key={review.id} className={`bg-white p-4 rounded-2xl border-2 border-black shadow-sm space-y-2 ${review.hidden ? 'opacity-50' : ''}`}>
                       <div className="flex justify-between items-start">
                          <p className="text-[9px] font-black uppercase text-yellow-600">{pro.companyName || pro.proName}</p>
                          <div className="flex gap-1">
                             <button onClick={() => handleToggleReview(pro, review.id)} className="p-1.5 bg-gray-100 rounded-lg">{review.hidden ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}</button>
                             <button onClick={() => {
                                const newReviews = pro.reviews.filter(re => re.id !== review.id);
                                updateProfessional({ ...pro, reviews: newReviews });
                             }} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       </div>
                       <p className="text-[10px] font-bold uppercase">{review.userName} deu nota {review.rating}</p>
                       <p className="text-xs italic">"{review.comment}"</p>
                    </div>
                 ))
              ) : ( <div className="text-center py-20 opacity-20"><MessageSquare className="w-12 h-12 mx-auto mb-2"/> <p className="text-xs font-black uppercase">Nenhuma avaliação encontrada</p></div> )}
           </div>
        </div>
      )}

      {activeTab === 'create' && (
        <form onSubmit={handleCreatePro} className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
           <h3 className="font-black text-sm uppercase italic flex items-center gap-2"><UserPlus className="w-5 h-5" /> Cadastrar Novo Perfil</h3>
           <input type="text" placeholder="Nome Fantasia / Empresa" className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs outline-none" value={newPro.companyName} onChange={e => setNewPro({...newPro, companyName: e.target.value})} required />
           <div className="grid grid-cols-2 gap-2">
              <select className="bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-[10px] outline-none" value={newPro.subCategory} onChange={e => setNewPro({...newPro, subCategory: e.target.value, category: getCategoryFromSpecialty(e.target.value)})} required>
                 <option value="">Especialidade</option>
                 {ALL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-[10px] outline-none" value={newPro.plan} onChange={e => setNewPro({...newPro, plan: e.target.value as PlanType})}>
                 <option value="Gratuito">Plano Grátis</option>
                 <option value="VIP">Plano VIP</option>
                 <option value="Premium">Plano Premium</option>
              </select>
           </div>
           <div className="grid grid-cols-2 gap-2">
              <input type="tel" placeholder="WhatsApp" className="bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs outline-none" value={newPro.whatsapp} onChange={e => setNewPro({...newPro, whatsapp: e.target.value})} />
              <input type="email" placeholder="E-mail" className="bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs outline-none" value={newPro.email} onChange={e => setNewPro({...newPro, email: e.target.value})} />
           </div>
           <textarea placeholder="Descrição curta..." className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs outline-none min-h-[80px]" value={newPro.bio} onChange={e => setNewPro({...newPro, bio: e.target.value})} />
           <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl border-2 border-blue-100">
              <input type="checkbox" id="claimable" checked={newPro.isClaimable} onChange={e => setNewPro({...newPro, isClaimable: e.target.checked})} />
              <label htmlFor="claimable" className="text-[9px] font-black uppercase text-blue-800">Permitir reivindicação (Dono assumir perfil)</label>
           </div>
           <button type="submit" disabled={loading} className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase text-xs">Criar Perfil</button>
        </form>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
             <h3 className="font-black text-sm uppercase italic flex items-center gap-2"><Key className="w-5 h-5" /> Alterar Senha Mestre</h3>
             <input type="password" placeholder="Nova Senha Mestre" className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs outline-none" value={masterPassInput} onChange={e => setMasterPassInput(e.target.value)} />
             <button onClick={handleUpdateMasterPass} className="w-full bg-black text-yellow-400 py-3 rounded-xl font-black uppercase text-xs">Atualizar Senha</button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="bg-white border-4 border-black w-full max-w-xs rounded-3xl p-6 text-center space-y-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-600"><Trash2 className="w-8 h-8"/></div>
              <h3 className="font-black uppercase italic">Excluir Perfil?</h3>
              <p className="text-xs font-bold text-black/50">Esta ação é irreversível.</p>
              <div className="flex gap-2">
                 <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-black uppercase text-xs text-black">Voltar</button>
                 <button onClick={() => handleDeletePro(showDeleteConfirm)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black uppercase text-xs">Sim, Excluir</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Star = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
);

export default AdminTab;
