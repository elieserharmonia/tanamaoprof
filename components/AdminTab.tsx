
import React, { useState } from 'react';
import { Professional, Review } from '../types';
import { 
  Shield, Eye, EyeOff, Award, TrendingUp, Settings, 
  Megaphone, Globe, DollarSign, Lightbulb, Lock, Unlock, 
  ChevronRight, AlertCircle 
} from 'lucide-react';

interface AdminTabProps {
  professionals: Professional[];
  updateProfessional: (pro: Professional) => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ professionals, updateProfessional }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'moderation' | 'benefits' | 'strategy'>('moderation');

  // Senha mestre para acessar a área administrativa
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

  const toggleReviewVisibility = (pro: Professional, reviewId: string) => {
    const updatedReviews = pro.reviews.map(r => 
      r.id === reviewId ? { ...r, hidden: !r.hidden } : r
    );
    updateProfessional({ ...pro, reviews: updatedReviews });
  };

  const toggleBenefit = (pro: Professional, benefit: 'isVip' | 'isHighlighted') => {
    updateProfessional({ ...pro, [benefit]: !pro[benefit] });
  };

  // Tela de Login Administrativo
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-xs space-y-8 text-center">
          <div className="relative inline-block">
            <div className={`bg-black p-5 rounded-3xl shadow-2xl transition-transform ${error ? 'animate-shake bg-red-600' : 'animate-bounce'}`}>
              <Shield className="w-12 h-12 text-yellow-400" />
            </div>
            {error && (
              <div className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full p-1 border-2 border-red-600 animate-bounce">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-black">Área Restrita</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Acesso exclusivo para administradores</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative group">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${error ? 'text-red-600' : 'text-black/30 group-focus-within:text-black'}`} />
              <input 
                autoFocus
                type="password" 
                placeholder="SENHA MESTRE"
                className={`w-full bg-white border-4 rounded-2xl py-4 pl-12 pr-4 font-black text-center tracking-[0.5em] outline-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-1 focus:translate-y-1 ${error ? 'border-red-600 text-red-600' : 'border-black text-black'}`}
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] active:scale-95 transition-all"
            >
              Desbloquear Painel <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[9px] font-bold text-black/30 uppercase italic">
            Dica: A senha padrão é <span className="underline">admin123</span>
          </p>
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

  // Painel Administrativo (Após login)
  return (
    <div className="p-4 pb-20 animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="bg-black text-yellow-400 px-4 py-2 rounded-lg flex items-center gap-2">
          <Unlock className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Painel Liberado</span>
        </div>
        <button 
          onClick={() => setIsAdminAuthenticated(false)}
          className="text-[10px] font-black uppercase underline text-black/40 hover:text-black"
        >
          Sair
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-black/5 p-1 rounded-xl border border-black/10">
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'moderation' ? 'bg-black text-yellow-400 shadow-lg scale-105' : 'text-gray-500'}`}
        >
          Moderação
        </button>
        <button 
          onClick={() => setActiveTab('benefits')}
          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'benefits' ? 'bg-black text-yellow-400 shadow-lg scale-105' : 'text-gray-500'}`}
        >
          Planos
        </button>
        <button 
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'strategy' ? 'bg-black text-yellow-400 shadow-lg scale-105' : 'text-gray-500'}`}
        >
          Estratégia
        </button>
      </div>

      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="font-black text-xl uppercase italic">Controle de Comentários</h2>
          <p className="text-xs text-gray-500">Oculte avaliações que violem as políticas do aplicativo.</p>
          
          <div className="space-y-4">
            {professionals.map(pro => (
              <div key={pro.id} className="border-2 border-black rounded-2xl p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <h3 className="font-black text-xs uppercase text-yellow-600">{pro.companyName || pro.proName}</h3>
                <div className="space-y-2">
                  {pro.reviews.map(rev => (
                    <div key={rev.id} className={`p-2 rounded-lg border-2 flex justify-between items-center transition-all ${rev.hidden ? 'bg-red-50 border-red-200 opacity-60' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black">{rev.userName}</span>
                          <span className={`text-[8px] px-1 rounded font-black uppercase ${rev.hidden ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                            {rev.hidden ? 'Oculto' : 'Visível'}
                          </span>
                        </div>
                        <p className="text-[10px] italic font-medium">"{rev.comment}"</p>
                      </div>
                      <button 
                        onClick={() => toggleReviewVisibility(pro, rev.id)}
                        className="p-2 bg-white rounded-xl border-2 border-black shadow-sm active:scale-90 transition-transform"
                      >
                        {rev.hidden ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-600" />}
                      </button>
                    </div>
                  ))}
                  {pro.reviews.length === 0 && <p className="text-xs text-gray-400 italic font-bold">Sem comentários para este perfil.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'benefits' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="font-black text-xl uppercase italic">Gestão de Planos</h2>
          <p className="text-xs text-gray-500">Promova profissionais para VIP ou Destaque.</p>

          <div className="space-y-3">
            {professionals.map(pro => (
              <div key={pro.id} className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                <div>
                  <h3 className="font-black text-xs uppercase">{pro.companyName || pro.proName}</h3>
                  <div className="flex gap-2 mt-1">
                    {pro.isVip && <span className="text-[8px] bg-black text-yellow-400 font-black px-1.5 py-0.5 rounded border border-black uppercase animate-pulse">Sócio VIP</span>}
                    {pro.isHighlighted && <span className="text-[8px] bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded border border-black uppercase">Destaque</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleBenefit(pro, 'isVip')}
                    className={`p-2 rounded-xl border-2 transition-all ${pro.isVip ? 'bg-black text-yellow-400 border-black' : 'bg-white text-gray-400 border-gray-200'}`}
                    title="Ativar VIP"
                  >
                    <Award className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => toggleBenefit(pro, 'isHighlighted')}
                    className={`p-2 rounded-xl border-2 transition-all ${pro.isHighlighted ? 'bg-yellow-400 text-black border-black' : 'bg-white text-gray-400 border-gray-200'}`}
                    title="Ativar Destaque"
                  >
                    <TrendingUp className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-black text-yellow-400 p-6 rounded-3xl shadow-xl overflow-hidden relative border-4 border-yellow-400/20">
            <h2 className="text-2xl font-black italic mb-2 relative z-10">MANUAL DO DONO</h2>
            <p className="text-sm font-bold opacity-80 relative z-10">Dicas para lucrar e divulgar o TáNaMão</p>
            <Lightbulb className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-yellow-400/20 rotate-12" />
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-black" />
              <h3 className="font-black text-sm uppercase">Divulgação Local</h3>
            </div>
            <div className="grid gap-3">
              <TipCard title="Grupos de Facebook" text="Poste diariamente nos grupos de 'Bolo e Rolo' da sua cidade." />
              <TipCard title="QR Code Estratégico" text="Imprima adesivos com QR Code e cole em pontos de ônibus e padarias." />
              <TipCard title="Amostra Grátis" text="Dê 48h de destaque grátis para novos profissionais testarem o app." />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-black" />
              <h3 className="font-black text-sm uppercase">Planos de Cobrança</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs uppercase mb-1">Destaque Semanal (R$ 15,00)</h4>
                <p className="text-[10px] font-medium text-gray-600">O profissional fica no topo da lista por 7 dias.</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs uppercase mb-1">Anuidade VIP (R$ 199,00)</h4>
                <p className="text-[10px] font-medium text-gray-600">Selo VIP permanente e suporte prioritário no cadastro.</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const TipCard: React.FC<{title: string, text: string}> = ({title, text}) => (
  <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <h4 className="font-black text-xs uppercase text-black mb-1">{title}</h4>
    <p className="text-[10px] font-medium text-gray-600 leading-tight">{text}</p>
  </div>
);

export default AdminTab;
