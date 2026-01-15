
import React, { useState } from 'react';
import { Professional, Review } from '../types';
import { Shield, Eye, EyeOff, Award, TrendingUp, Settings, Megaphone, Globe, DollarSign, Lightbulb } from 'lucide-react';

interface AdminTabProps {
  professionals: Professional[];
  updateProfessional: (pro: Professional) => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ professionals, updateProfessional }) => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'benefits' | 'strategy'>('moderation');

  const toggleReviewVisibility = (pro: Professional, reviewId: string) => {
    const updatedReviews = pro.reviews.map(r => 
      r.id === reviewId ? { ...r, hidden: !r.hidden } : r
    );
    updateProfessional({ ...pro, reviews: updatedReviews });
  };

  const toggleBenefit = (pro: Professional, benefit: 'isVip' | 'isHighlighted') => {
    updateProfessional({ ...pro, [benefit]: !pro[benefit] });
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex gap-1 mb-6 bg-black/5 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'moderation' ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500'}`}
        >
          Moderação
        </button>
        <button 
          onClick={() => setActiveTab('benefits')}
          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'benefits' ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500'}`}
        >
          Planos
        </button>
        <button 
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === 'strategy' ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500'}`}
        >
          Estratégia
        </button>
      </div>

      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="font-black text-xl uppercase italic">Controle de Comentários</h2>
          <p className="text-xs text-gray-500">Oculte avaliações que violem as políticas de privacidade.</p>
          
          <div className="space-y-4">
            {professionals.map(pro => (
              <div key={pro.id} className="border-2 border-black rounded-2xl p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <h3 className="font-black text-xs uppercase text-yellow-600">{pro.companyName || pro.proName}</h3>
                <div className="space-y-2">
                  {pro.reviews.map(rev => (
                    <div key={rev.id} className={`p-2 rounded-lg border-2 flex justify-between items-center ${rev.hidden ? 'bg-red-50 border-red-200 opacity-60' : 'bg-green-50 border-green-200'}`}>
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
                        className="p-2 bg-white rounded-xl border-2 border-black shadow-sm"
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
          <p className="text-xs text-gray-500">Ceda benefícios ou gerencie destaques pagos.</p>

          <div className="space-y-3">
            {professionals.map(pro => (
              <div key={pro.id} className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <h3 className="font-black text-xs uppercase">{pro.companyName || pro.proName}</h3>
                  <div className="flex gap-2 mt-1">
                    {pro.isVip && <span className="text-[8px] bg-black text-yellow-400 font-black px-1.5 py-0.5 rounded border border-black uppercase">Sócio VIP</span>}
                    {pro.isHighlighted && <span className="text-[8px] bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded border border-black uppercase">Destaque</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleBenefit(pro, 'isVip')}
                    className={`p-2 rounded-xl border-2 ${pro.isVip ? 'bg-black text-yellow-400 border-black' : 'bg-white text-gray-400 border-gray-200'}`}
                    title="Ativar VIP"
                  >
                    <Award className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => toggleBenefit(pro, 'isHighlighted')}
                    className={`p-2 rounded-xl border-2 ${pro.isHighlighted ? 'bg-yellow-400 text-black border-black' : 'bg-white text-gray-400 border-gray-200'}`}
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
          <div className="bg-black text-yellow-400 p-6 rounded-3xl shadow-xl overflow-hidden relative">
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
              <TipCard title="Grupos de Torrinha" text="Poste diariamente nos grupos de 'Bolo e Rolo' e notícias locais." />
              <TipCard title="QR Code em Padarias" text="Imprima um papel com QR Code e peça para deixar no balcão de padarias." />
              <TipCard title="Parceria 'Boca a Boca'" text="Dê 1 semana de destaque grátis para quem indicar o app para 5 amigos." />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-black" />
              <h3 className="font-black text-sm uppercase">Planos de Cobrança</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs uppercase mb-1">Destaque Semanal (Sugestão: R$ 10)</h4>
                <p className="text-[10px] font-medium text-gray-600">Ideal para profissionais que querem serviço rápido (eletricista, fretes).</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xs uppercase mb-1">Assinatura VIP (Sugestão: R$ 29/mês)</h4>
                <p className="text-[10px] font-medium text-gray-600">Para empresas que querem fotos de portfólio e selo de confiança.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-black" />
              <h3 className="font-black text-sm uppercase">Próximos Passos</h3>
            </div>
            <div className="bg-yellow-100 border-2 border-black p-4 rounded-2xl text-[11px] font-bold leading-relaxed">
              Para escalar, use o <span className="underline">Supabase</span> (banco de dados real) e hospede na <span className="underline">Vercel</span>. Assim o app nunca sai do ar e você pode gerenciar tudo de qualquer lugar!
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
