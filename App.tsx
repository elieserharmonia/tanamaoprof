
import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, ShieldCheck, LogOut, Loader2, Heart, User as UserIcon } from 'lucide-react';
import { Tab, Professional, User } from './types';
import { db } from './services/db';
import HomeTab from './components/HomeTab';
import ProTab from './components/ProTab';
import AdminTab from './components/AdminTab';
import InstallBanner from './components/InstallBanner';
import SystemNotification from './components/SystemNotification';

// Instância global persistente para o prompt de instalação
let deferredPrompt: any = null;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Deixamos o navegador gerenciar o banner nativo conforme políticas de engajamento
      deferredPrompt = e;
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const initApp = async () => {
      try {
        const [pros, favs, user] = await Promise.all([
          db.getProfessionals(),
          db.getFavorites(),
          db.getCurrentUser()
        ]);
        setProfessionals(pros);
        setFavorites(favs);
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    initApp();

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const saveProfessionalData = async (pro: Professional) => {
    setLoading(true);
    try {
      await db.saveProfessional(pro);
      const updatedPros = await db.getProfessionals();
      setProfessionals(updatedPros);
      if (activeTab === Tab.PRO) {
        setActiveTab(Tab.HOME);
      }
    } catch (err) {
      console.error("Erro ao persistir dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      setPwaPrompt(null);
    }
  };

  if (loading && professionals.length === 0) {
    return (
      <div className="min-h-screen bg-yellow-400 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-black p-4 rounded-2xl mb-4 shadow-2xl animate-bounce">
          <h1 className="text-3xl font-black italic text-yellow-400">TáNaMão</h1>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />
        <p className="font-black uppercase italic text-xs tracking-widest animate-pulse">Carregando oportunidades...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-white shadow-2xl relative">
      <SystemNotification 
        show={notification.show} 
        title={notification.title} 
        message={notification.message} 
        onClose={() => setNotification({ ...notification, show: false })} 
      />
      
      <InstallBanner 
        deferredPrompt={pwaPrompt} 
        onInstall={handleInstallClick} 
      />
      
      <header className="bg-yellow-400 border-b-2 border-black p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3 w-full">
          <button 
            onClick={() => setActiveTab(Tab.HOME)}
            className="bg-black px-4 py-2 rounded-lg shrink-0 transition-transform active:scale-95 hover:scale-105 cursor-pointer"
          >
            <h1 className="text-xl md:text-2xl font-black tracking-tighter italic text-yellow-400">TáNaMão</h1>
          </button>
          <div className="flex flex-col items-end flex-1">
            <p className="text-[8px] md:text-[10px] font-black uppercase text-black italic leading-none mb-1 tracking-tighter">
              A MAIOR VITRINE DA REGIÃO
            </p>
            {currentUser && (
              <div className="flex items-center gap-2 bg-black/10 px-2 py-1 rounded-md border border-black/5">
                <span className="text-[10px] font-black uppercase text-black truncate max-w-[80px]">Olá, {currentUser.name.split(' ')[0]}</span>
                <button onClick={() => { setCurrentUser(null); db.setCurrentUser(null); }} className="text-black hover:text-red-700">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto pb-24 scroll-smooth">
        {activeTab === Tab.HOME && (
          <HomeTab 
            professionals={professionals} 
            toggleFavorite={(id) => db.toggleFavorite(id).then(setFavorites)} 
            favorites={favorites}
            updateProfessional={(p) => setProfessionals(prev => prev.map(pro => pro.id === p.id ? p : pro))}
            currentUser={currentUser}
            onLogin={(name) => {
              const newUser = {id: 'temp', name, email: ''};
              setCurrentUser(newUser);
              db.setCurrentUser(newUser);
            }} 
          />
        )}
        {activeTab === Tab.PRO && (
          <ProTab 
            onSave={saveProfessionalData} 
            currentUser={currentUser} 
            onLogin={(user) => {
              setCurrentUser(user);
              db.setCurrentUser(user);
            }}
          />
        )}
        {activeTab === Tab.ADMIN && (
          <AdminTab 
            professionals={professionals} 
            updateProfessional={(p) => setProfessionals(prev => prev.map(pro => pro.id === p.id ? p : pro))} 
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black p-2 md:p-3 flex justify-center z-[60] safe-pb shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-7xl flex justify-around items-end">
          <button 
            onClick={() => setActiveTab(Tab.HOME)}
            className={`flex-1 flex flex-col items-center p-2 transition-all ${activeTab === Tab.HOME ? 'text-black' : 'text-gray-400'}`}
          >
            <Home className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === Tab.HOME ? 'fill-yellow-400' : ''}`} />
            <span className="text-[8px] md:text-[10px] font-black uppercase mt-1">Explorar</span>
          </button>

          <button 
            onClick={() => setActiveTab(Tab.PRO)}
            className="flex-1 flex flex-col items-center group"
          >
            <div className={`-mt-10 mb-2 w-14 h-14 md:w-16 md:h-16 rounded-full border-4 border-white flex items-center justify-center shadow-xl transition-all active:scale-90 ${activeTab === Tab.PRO ? 'bg-black text-yellow-400' : 'bg-yellow-400 text-black'}`}>
               <PlusCircle className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <span className="text-[8px] md:text-[10px] font-black uppercase mb-1">Anunciar</span>
          </button>

          <button 
            onClick={() => setActiveTab(Tab.ADMIN)}
            className={`flex-1 flex flex-col items-center p-2 transition-all ${activeTab === Tab.ADMIN ? 'text-black' : 'text-gray-400'}`}
          >
            <ShieldCheck className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === Tab.ADMIN ? 'fill-yellow-400' : ''}`} />
            <span className="text-[8px] md:text-[10px] font-black uppercase mt-1">Config</span>
          </button>
        </div>
      </nav>

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-2xl flex items-center gap-3 animate-in zoom-in duration-300">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
            <span className="font-black uppercase text-xs">Aguarde...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
