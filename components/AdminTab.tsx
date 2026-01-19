
import React, { useState, useEffect } from 'react';
import { Professional, Review, MpConfig } from '../types';
import { 
  Shield, Eye, Award, TrendingUp, Lightbulb, Unlock, 
  ChevronRight, Copy, Check, MessageCircle,
  PlusCircle, MapPin, DollarSign, Settings, Globe, CreditCard, Save, RefreshCcw, Loader2
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
  const [activeTab, setActiveTab] = useState<'finance' | 'moderation' | 'config'>('finance');
  const [loading, setLoading] = useState(false);
  
  // MP Config State
  const [mpConfig, setMpConfig] = useState<MpConfig>({
    mode: 'test',
    accessToken: '',
    webhookUrl: ''
  });

  useEffect(() => {
    if (isAdminAuthenticated) {
      db.getMpConfig().then(setMpConfig);
    }
  }, [isAdminAuthenticated]);

  const handleSaveConfig = async () => {
    setLoading(true);
    await db.saveMpConfig(mpConfig);
    setLoading(false);
    alert('Configurações salvas com sucesso!');
  };

  const totalMonthlyRev = professionals.filter(p => p.plan === 'VIP').length * PLAN_PRICES.MONTHLY_VIP;
  const totalAnnualRev = professionals.filter(p => p.plan === 'Premium').length * PLAN_PRICES.ANNUAL_PREMIUM;

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="bg-black p-5 rounded-3xl shadow-2xl animate-bounce mb-8">
          <Shield className="w-12 h-12 text-yellow-400" />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (adminPass === 'admin123') setIsAdminAuthenticated(true); }} className="w-full max-w-xs space-y-4">
          <input type="password" placeholder="SENHA MESTRE" className="w-full border-4 border-black rounded-2xl py-4 text-center font-black outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
          <button type="submit" className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">Acessar Painel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="flex gap-1 bg-black/5 p-1 rounded-xl">
        {['finance', 'moderation', 'config'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === t ? 'bg-black text-yellow-400 shadow-md' : 'text-gray-500'}`}>
            {t === 'finance' ? 'Finanças' : t === 'moderation' ? 'Moderar' : 'Config'}
          </button>
        ))}
      </div>

      {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[8px] font-black uppercase opacity-40">Receita VIP/Mês</span>
              <p className="text-xl font-black">R$ {totalMonthlyRev.toFixed(2)}</p>
            </div>
            <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[8px] font-black uppercase opacity-40">Receita Premium/Ano</span>
              <p className="text-xl font-black">R$ {totalAnnualRev.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-black text-xs uppercase italic">Parceiros Pagantes</h3>
            {professionals.filter(p => p.plan !== 'Gratuito').map(pro => (
              <div key={pro.id} className="bg-white border-2 border-black p-3 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="text-[10px] font-black uppercase">{pro.companyName || pro.proName}</h4>
                  <span className={`text-[8px] font-black uppercase ${pro.plan === 'Premium' ? 'text-yellow-600' : 'text-blue-600'}`}>Plano {pro.plan}</span>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-bold">Vence em:</p>
                   <p className="text-[8px] opacity-40">{pro.subscriptionExpiresAt ? new Date(pro.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
          <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase italic">Mercado Pago PIX</h3>
             </div>
             
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40">Ambiente</label>
                <div className="flex gap-2">
                   {(['test', 'prod'] as const).map(m => (
                     <button 
                       key={m} 
                       onClick={() => setMpConfig({...mpConfig, mode: m})}
                       className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border-2 ${mpConfig.mode === m ? 'bg-black text-yellow-400 border-black' : 'bg-gray-50 border-black/10'}`}
                     >
                       {m === 'test' ? 'Sandbox (Teste)' : 'Produção'}
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40">Access Token</label>
                <input 
                  type="password" 
                  placeholder="APP_USR-..." 
                  className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs outline-none"
                  value={mpConfig.accessToken}
                  onChange={e => setMpConfig({...mpConfig, accessToken: e.target.value})}
                />
             </div>

             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-40">URL do Webhook</label>
                <input 
                  type="text" 
                  placeholder="https://sua-url.com/webhook" 
                  className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 font-bold text-xs outline-none"
                  value={mpConfig.webhookUrl}
                  onChange={e => setMpConfig({...mpConfig, webhookUrl: e.target.value})}
                />
             </div>

             <button 
               onClick={handleSaveConfig}
               disabled={loading}
               className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Salvar Credenciais
             </button>
          </div>

          <div className="bg-yellow-50 border-2 border-black/10 p-4 rounded-2xl">
             <h4 className="text-[10px] font-black uppercase mb-2 flex items-center gap-1 text-yellow-800"><Globe className="w-3 h-3"/> Instruções de Produção</h4>
             <ul className="text-[9px] font-medium space-y-2 text-yellow-900/70">
                <li>1. Obtenha seu Token no painel do Mercado Pago Developers.</li>
                <li>2. Configure a URL de Webhook para receber confirmações offline.</li>
                <li>3. O sistema fará Polling (consulta ativa) enquanto o usuário estiver no app.</li>
                <li>4. O Webhook garantirá a ativação caso o usuário feche o navegador.</li>
             </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTab;
