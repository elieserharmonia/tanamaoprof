
import React, { useState, useEffect } from 'react';
import { Home, UserPlus, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { Tab, Professional, User } from './types';
import { db } from './services/db';
import HomeTab from './components/HomeTab';
import ProTab from './components/ProTab';
import AdminTab from './components/AdminTab';
import InstallBanner from './components/InstallBanner';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
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
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const saveProfessionalData = async (pro: Professional) => {
    setLoading(true);
    await db.saveProfessional(pro);
    const updatedPros = await db.getProfessionals();
    setProfessionals(updatedPros);
    setLoading(false);
    setActiveTab(Tab.HOME);
  };

  const toggleFavorite = async (id: string) => {
    const newFavs = await db.toggleFavorite(id);
    setFavorites(newFavs);
  };

  const updateProfessional = async (updatedPro: Professional) => {
    await db.saveProfessional(updatedPro);
    setProfessionals(prev => prev.map(p => p.id === updatedPro.id ? updatedPro : p));
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    await db.setCurrentUser(user);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await db.setCurrentUser(null);
  };

  if (loading && professionals.length === 0) {
    return (
      <div className="min-h-screen bg-yellow-400 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-black p-4 rounded-2xl mb-4 shadow-2xl animate-bounce">
          <h1 className="text-3xl font-black italic text-yellow-400">TáNaMão</h1>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />
        <p className="font-black uppercase italic text-xs tracking-widest animate-pulse">Buscando o melhor para você...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-yellow-400 shadow-2xl relative">
      <InstallBanner />
      
      <header className="bg-yellow-400 border-b-2 border-black p-4 sticky top-0 z-50 flex flex-col gap-2 shadow-md">
        <div className="flex justify-between items-center gap-3">
          <div className="bg-black px-4 py-2 rounded-lg shrink-0">
            <h1 className="text-2xl font-black tracking-tighter italic text-yellow-400">TáNaMão</h1>
          </div>
          <div className="flex flex-col items-end flex-1">
            <p className="text-[10px] font-black uppercase text-black italic leading-none mb-1 tracking-tighter">
              Precisou? TáNaMão!
            </p>
            {currentUser && (
              <div className="flex items-center gap-2 bg-black/10 px-2 py-1 rounded-md border border-black/5">
                <span className="text-[10px] font-black uppercase text-black">Olá, {currentUser.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="text-black hover:text-red-700">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        {activeTab === Tab.HOME && (
          <HomeTab 
            professionals={professionals} 
            toggleFavorite={toggleFavorite} 
            favorites={favorites}
            updateProfessional={updateProfessional}
            currentUser={currentUser}
            onLogin={(name) => handleLogin({id: 'temp', name, email: ''})} // Para reviews rápidos
          />
        )}
        {activeTab === Tab.PRO && (
          <ProTab 
            onSave={saveProfessionalData} 
            currentUser={currentUser} 
            onLogin={handleLogin} 
          />
        )}
        {activeTab === Tab.ADMIN && (
          <AdminTab 
            professionals={professionals} 
            updateProfessional={updateProfessional} 
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t-4 border-black p-2 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.15)] z-[60]">
        <button 
          onClick={() => setActiveTab(Tab.HOME)}
          className={`flex-1 flex flex-col items-center p-2 transition-all duration-300 ${activeTab === Tab.HOME ? 'text-black scale-110' : 'text-gray-400 scale-100 hover:text-gray-600'}`}
        >
          <Home className={`w-6 h-6 ${activeTab === Tab.HOME ? 'fill-yellow-400' : ''}`} />
          <span className="text-[10px] font-black uppercase mt-1">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab(Tab.PRO)}
          className={`flex-1 flex flex-col items-center p-2 transition-all duration-300 ${activeTab === Tab.PRO ? 'text-black scale-110' : 'text-gray-400 scale-100 hover:text-gray-600'}`}
        >
          <UserPlus className={`w-6 h-6 ${activeTab === Tab.PRO ? 'fill-yellow-400' : ''}`} />
          <span className="text-[10px] font-black uppercase mt-1">Perfil</span>
        </button>
        <button 
          onClick={() => setActiveTab(Tab.ADMIN)}
          className={`flex-1 flex flex-col items-center p-2 transition-all duration-300 ${activeTab === Tab.ADMIN ? 'text-black scale-110' : 'text-gray-400 scale-100 hover:text-gray-600'}`}
        >
          <ShieldCheck className={`w-6 h-6 ${activeTab === Tab.ADMIN ? 'fill-yellow-400' : ''}`} />
          <span className="text-[10px] font-black uppercase mt-1">Gerir</span>
        </button>
      </nav>

      {loading && professionals.length > 0 && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-2xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
            <span className="font-black uppercase text-xs">Atualizando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
