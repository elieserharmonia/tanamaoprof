
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, MapPin, Heart, Phone, Mail, 
  ArrowUpDown, Briefcase, ShoppingBag, Eye, TrendingUp, Calendar,
  Share2, List, Filter, X, ChevronDown, Zap, Clock, MessageCircle,
  MessageSquare, User as UserIcon, Loader2, Navigation, Map, RefreshCcw, ShieldCheck
} from 'lucide-react';
import { Professional, User, Review, UserLocation } from '../types';
import { PRO_CATEGORIES, COMERCIO_CATEGORIES, SUPPORT_PHONE } from '../constants';
import { db } from '../services/db';

interface HomeTabProps {
  professionals: Professional[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  updateProfessional: (pro: Professional) => void;
  currentUser: User | null;
  onLogin: (name: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Construção e Reformas': '🏠',
  'Serviços Domésticos': '🧹',
  'Beleza e Estética': '💄',
  'Profissionais Liberais': '⚖️',
  'Veículos e Transporte': '🚗',
  'Jardim e Área Externa': '🌿',
  'Instalação e Manutenção': '🔧',
  'Tecnologia': '💻',
  'Alimentação': '🍕',
  'Saúde e Bem-estar': '🏥',
  'Casa e Construção': '🏗️',
  'Moda e Beleza': '👗',
  'Serviços em Geral': '🛠️',
  'Outros Serviços': '✨'
};

const RADIUS_OPTIONS = [2, 5, 10, 25, 50, 100];
const RADIUS_ALL = 999999;

const HomeTab: React.FC<HomeTabProps> = ({ 
  professionals, 
  favorites, 
  toggleFavorite, 
  updateProfessional,
  currentUser,
  onLogin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'views' | 'recent'>('distance');
  const [radius, setRadius] = useState<number>(10);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [tempName, setTempName] = useState('');
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(db.getLastLocation());
  const [locPermissionState, setLocPermissionState] = useState<'idle' | 'asking' | 'denied' | 'granted'>(userLocation ? 'granted' : 'asking');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleRequestLocation = () => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      setLocPermissionState('denied');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: UserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setUserLocation(newLoc);
        db.saveLastLocation(newLoc);
        setLocPermissionState('granted');
        setIsGettingLocation(false);
      },
      () => {
        setLocPermissionState('denied');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getAvgRating = (pro: Professional) => {
    if (!pro.reviews || pro.reviews.length === 0) return 0;
    return pro.reviews.reduce((sum, r) => sum + r.rating, 0) / pro.reviews.length;
  };

  const filteredPros = useMemo(() => {
    return professionals.filter(pro => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
                            (pro.companyName || '').toLowerCase().includes(search) || 
                            (pro.proName || '').toLowerCase().includes(search) ||
                            (pro.bio || '').toLowerCase().includes(search) ||
                            (pro.subCategory || '').toLowerCase().includes(search);

      const matchesCategory = !activeCategory || pro.category === activeCategory;
      
      let matchesLocation = true;
      if (userLocation && sortBy === 'distance' && pro.latitude && pro.longitude) {
        const dist = db.calculateDistance(userLocation.lat, userLocation.lng, pro.latitude, pro.longitude);
        matchesLocation = radius === RADIUS_ALL ? true : dist <= radius;
      } else if (selectedCity) {
        matchesLocation = pro.city.toLowerCase() === selectedCity.toLowerCase();
      }

      return matchesSearch && matchesCategory && matchesLocation;
    }).sort((a, b) => {
      const weightA = a.plan === 'Premium' ? 3 : a.plan === 'VIP' ? 2 : 1;
      const weightB = b.plan === 'Premium' ? 3 : b.plan === 'VIP' ? 2 : 1;
      
      if (weightA !== weightB) return weightB - weightA;

      if (sortBy === 'distance' && userLocation && a.latitude && a.longitude && b.latitude && b.longitude) {
        const distA = db.calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = db.calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      }

      if (sortBy === 'rating') return getAvgRating(b) - getAvgRating(a);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [professionals, searchTerm, activeCategory, selectedCity, sortBy, userLocation, radius]);

  const cities = useMemo(() => Array.from(new Set(professionals.map(p => p.city))).sort(), [professionals]);
  const categories = useMemo(() => {
    const all = [...Object.keys(PRO_CATEGORIES), ...Object.keys(COMERCIO_CATEGORIES)];
    return Array.from(new Set(all)).sort();
  }, []);

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onLogin(tempName.trim());
      setShowLoginModal(false);
      setTempName('');
    }
  };

  return (
    <div className="pb-20">
      {locPermissionState === 'asking' && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white border-4 border-black w-full max-w-sm rounded-[40px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center space-y-6">
             <div className="bg-yellow-400 w-20 h-20 rounded-full border-4 border-black flex items-center justify-center mx-auto shadow-lg animate-bounce"><Navigation className="w-10 h-10 fill-black" /></div>
             <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase italic tracking-tight">Perto de você?</h2>
                <p className="text-xs font-bold text-black/60 leading-relaxed uppercase">Encontre os melhores profissionais na sua rua ou bairro usando sua localização.</p>
             </div>
             <div className="space-y-3">
                <button onClick={handleRequestLocation} disabled={isGettingLocation} className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                  {isGettingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Navigation className="w-4 h-4 fill-yellow-400" /> Ativar Localização</>}
                </button>
                <button onClick={() => setLocPermissionState('denied')} className="w-full text-[10px] font-black uppercase text-black/40 py-2">Escolher cidade manualmente</button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-400 p-4 sticky top-0 md:top-[74px] z-40 border-b-2 border-black/10">
        <div className="relative group max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 w-5 h-5" />
          <input type="text" placeholder="O que você está procurando?" className="w-full bg-white border-2 border-black rounded-full py-3 pl-12 pr-4 font-bold outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white py-4 overflow-x-auto scrollbar-hide flex gap-6 px-4 border-b border-black/5 justify-start md:justify-center">
        <button onClick={() => setActiveCategory(null)} className="flex flex-col items-center gap-2 shrink-0 min-w-[70px]">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${!activeCategory ? 'bg-yellow-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105' : 'bg-gray-50 border-black/5'}`}>🎯</div>
          <span className={`text-[9px] font-black uppercase text-center ${!activeCategory ? 'text-black' : 'text-gray-400'}`}>Tudo</span>
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className="flex flex-col items-center gap-2 shrink-0 min-w-[70px]">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${activeCategory === cat ? 'bg-yellow-400 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105' : 'bg-gray-50 border-black/5'}`}>{CATEGORY_ICONS[cat] || '💼'}</div>
            <span className={`text-[9px] font-black uppercase text-center leading-tight truncate w-full ${activeCategory === cat ? 'text-black' : 'text-gray-400'}`}>{cat.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="p-4 flex gap-2 overflow-x-auto scrollbar-hide bg-gray-50/50 border-b border-black/5 justify-start md:justify-center">
        {userLocation ? (
          <div className="flex items-center gap-1.5 shrink-0 bg-black text-yellow-400 px-3 py-2 rounded-full border-2 border-black shadow-md transition-transform active:scale-95 group">
             <Navigation className="w-4 h-4 fill-yellow-400" />
             <div className="flex items-center gap-1">
               <span className="text-[10px] font-black uppercase italic tracking-tighter">Raio:</span>
               <select 
                 className="bg-transparent text-[10px] font-black uppercase italic outline-none cursor-pointer appearance-none min-w-[30px]" 
                 value={radius} 
                 onChange={e => setRadius(Number(e.target.value))}
               >
                 {RADIUS_OPTIONS.map(r => <option key={r} value={r} className="text-black font-bold"> {r}KM</option>)}
                 <option value={RADIUS_ALL} className="text-black font-bold">TODOS</option>
               </select>
               <ChevronDown className="w-4 h-4 text-yellow-400" />
             </div>
          </div>
        ) : (
          <select className="bg-white border-2 border-black/10 rounded-full px-4 py-2 text-[10px] font-bold outline-none shrink-0" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
            <option value="">Brasil (Tudo)</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select className="bg-white border-2 border-black/10 rounded-full px-4 py-2 text-[10px] font-bold outline-none shrink-0" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          {userLocation && <option value="distance">Mais Próximos</option>}
          <option value="recent">Mais Recentes</option>
          <option value="rating">Melhor Avaliados</option>
          <option value="views">Mais Vistos</option>
        </select>
      </div>

      <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {filteredPros.length > 0 ? filteredPros.map(pro => (
          <ProGridCard key={pro.id} pro={pro} isFavorite={favorites.includes(pro.id)} toggleFavorite={toggleFavorite} updateProfessional={updateProfessional} currentUser={currentUser} userLocation={userLocation} onPromptLogin={() => setShowLoginModal(true)} />
        )) : (
          <div className="col-span-full py-20 text-center space-y-4 opacity-30">
             <Search className="w-12 h-12 mx-auto" />
             <p className="font-black uppercase text-xs">Nenhum profissional encontrado</p>
          </div>
        )}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white border-4 border-black w-full max-w-xs rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black uppercase italic text-center mb-6">Diga seu nome</h2>
            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              <input autoFocus type="text" placeholder="Seu nome" className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-bold outline-none" value={tempName} onChange={(e) => setTempName(e.target.value)} />
              <button type="submit" className="w-full bg-black text-yellow-400 border-2 border-black font-black py-3 rounded-xl text-xs uppercase">Confirmar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProGridCard: React.FC<{ pro: Professional; isFavorite: boolean; toggleFavorite: (id: string) => void; updateProfessional: (pro: Professional) => void; currentUser: User | null; userLocation: UserLocation | null; onPromptLogin: () => void; }> = ({ pro, isFavorite, toggleFavorite, updateProfessional, currentUser, userLocation, onPromptLogin }) => {
  const [showFull, setShowFull] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const avgRating = pro.reviews && pro.reviews.length > 0 ? (pro.reviews.reduce((sum, r) => sum + r.rating, 0) / pro.reviews.length).toFixed(1) : null;
  const distance = useMemo(() => {
    if (userLocation && pro.latitude && pro.longitude) {
      const d = db.calculateDistance(userLocation.lat, userLocation.lng, pro.latitude, pro.longitude);
      return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
    }
    return null;
  }, [userLocation, pro]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onPromptLogin();
    if (rating === 0 || comment.trim().length < 5) return alert('Por favor, selecione as estrelas e escreva um comentário.');
    setIsSubmittingReview(true);
    try {
      const updatedPro = await db.addReview(pro.id, { id: Math.random().toString(36).substr(2, 9), userName: currentUser.name, rating, comment, date: new Date().toISOString(), hidden: false });
      updateProfessional(updatedPro);
      setRating(0); setComment('');
      alert('Sua avaliação foi publicada!');
    } catch (err) { alert('Erro ao enviar avaliação.'); } finally { setIsSubmittingReview(false); }
  };

  const handleClaim = () => {
     const message = `Olá, sou o dono do negócio "${pro.companyName || pro.proName}" e gostaria de assumir este perfil no TáNaMão!`;
     window.open(`https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const whatsappMessage = encodeURIComponent("Olá, te encontrei no aplicativo TáNaMão.\n\nhttps://tanamaoprofissionais.vercel.app/");

  return (
    <>
      <div onClick={() => { db.incrementViews(pro.id); setShowFull(true); }} className={`bg-white rounded-xl border-2 border-black/5 overflow-hidden shadow-sm active:scale-95 hover:border-black/20 transition-all flex flex-col relative ${pro.plan === 'Premium' ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-md' : 'shadow-sm'}`}>
        {pro.plan !== 'Gratuito' && (
          <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[7px] font-black uppercase border border-black shadow-md flex items-center gap-0.5 animate-pulse"><Zap className="w-2 h-2 fill-black" /> Destaque</div>
        )}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <img src={pro.photoUrl || 'https://img.icons8.com/fluency/200/user-male-circle.png'} className="w-full h-full object-cover" alt={pro.proName} />
          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(pro.id); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-black/5">
            <Heart className={`w-3 h-3 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
          {distance && <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-yellow-400 px-2 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-0.5 shadow-md border border-white/10"><Navigation className="w-2 h-2 fill-yellow-400" /> {distance}</div>}
        </div>
        <div className="p-2 flex-1 flex flex-col justify-between gap-1">
          <div>
            <h4 className="text-[10px] font-black text-black leading-tight uppercase line-clamp-2">{pro.companyName || pro.proName}</h4>
            <p className="text-[8px] font-bold text-black/40 uppercase mt-0.5 truncate">{pro.subCategory}</p>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[9px] font-black text-yellow-600 truncate">{pro.city}</span>
            {avgRating && <div className="flex items-center gap-0.5 bg-yellow-400 px-1.5 py-0.5 rounded border border-black shadow-sm"><Star className="w-2 h-2 fill-black" /><span className="text-[8px] font-black">{avgRating}</span></div>}
          </div>
        </div>
      </div>

      {showFull && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="p-4 flex items-center gap-4 border-b">
              <div className="max-w-4xl mx-auto w-full flex items-center">
                <button onClick={() => setShowFull(false)} className="p-2 -ml-2"><X className="w-6 h-6"/></button>
                <h2 className="text-xs md:text-sm font-black uppercase flex-1 truncate">{pro.companyName || pro.proName}</h2>
                <button onClick={() => toggleFavorite(pro.id)} className="p-2"><Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}/></button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto bg-gray-50/30 pb-24">
              <div className="bg-white flex flex-col items-center py-10 border-b border-black/5 relative">
                 <div className="relative">
                    <img src={pro.photoUrl} className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-white shadow-xl bg-white" />
                 </div>
                 <div className="mt-4 flex flex-col items-center gap-1">
                    <h1 className="text-xl md:text-2xl font-black uppercase text-center px-4">{pro.companyName || pro.proName}</h1>
                    <div className="flex items-center gap-2">
                       <span className="bg-yellow-400 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-black">{pro.subCategory}</span>
                       {distance && <span className="bg-black text-yellow-400 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1"><Navigation className="w-2.5 h-2.5 fill-yellow-400"/> {distance}</span>}
                    </div>
                 </div>
              </div>

              <div className="p-6 space-y-8 max-w-2xl mx-auto">
                 {pro.isClaimable && (
                    <div className="bg-blue-600 text-white p-4 rounded-3xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-3">
                       <ShieldCheck className="w-8 h-8"/>
                       <div>
                          <p className="text-xs font-black uppercase">Este negócio é seu?</p>
                          <p className="text-[9px] font-bold opacity-80 uppercase leading-tight">Assuma este perfil para atualizar fotos, preços e receber contatos diretos!</p>
                       </div>
                       <button onClick={handleClaim} className="bg-white text-blue-600 px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all">Quero assumir meu perfil</button>
                    </div>
                 )}

                 <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase text-black/30 tracking-widest">Sobre o Negócio</h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-2xl border border-black/5 shadow-sm">{pro.bio || 'Sem descrição.'}</p>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-black/30 tracking-widest">Avaliações</h3>
                    <div className="space-y-3">
                       {pro.reviews.filter(r => !r.hidden).map((r, i) => (
                          <div key={i} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-2">
                             <div className="flex justify-between items-start">
                                <p className="text-[10px] font-black uppercase">{r.userName}</p>
                                <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${r.rating >= s ? 'fill-black' : 'text-gray-200'}`} />)}</div>
                             </div>
                             <p className="text-xs italic text-gray-600">"{r.comment}"</p>
                          </div>
                       ))}
                    </div>

                    <div className="bg-yellow-400 border-3 border-black p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-6 space-y-4">
                       <h4 className="text-[11px] font-black uppercase text-center">Deixe sua avaliação</h4>
                       <div className="flex justify-center gap-2">
                          {[1,2,3,4,5].map(i => (
                            <button key={i} onClick={() => setRating(i)} className="transition-transform active:scale-125"><Star className={`w-8 h-8 ${rating >= i ? 'fill-black text-black' : 'text-white/50'}`} /></button>
                          ))}
                       </div>
                       <textarea placeholder="Escreva sua experiência..." className="w-full bg-white border-2 border-black rounded-xl p-3 font-bold text-xs outline-none min-h-[80px]" value={comment} onChange={e => setComment(e.target.value)} />
                       <button onClick={handleReviewSubmit} disabled={isSubmittingReview} className="w-full bg-black text-yellow-400 font-black py-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg active:translate-y-1 transition-all">
                         {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageSquare className="w-4 h-4"/> Publicar</>}
                       </button>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6 border-t border-black/5">
                    <div className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 opacity-30"/><span className="text-[10px] font-black uppercase text-black/40">{pro.views} Visualizações</span></div>
                 </div>
              </div>
           </div>

           <div className="p-4 border-t bg-white flex justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)] sticky bottom-0">
              <div className="max-w-2xl w-full flex gap-3">
                <a href={`tel:${pro.phone}`} className="flex-1 flex flex-col items-center justify-center gap-1 bg-white border-2 border-black rounded-xl py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Phone className="w-4 h-4"/><span className="text-[8px] font-black uppercase">Ligar</span></a>
                <a href={`https://wa.me/55${pro.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`} target="_blank" className="flex-[2] flex items-center justify-center gap-2 bg-black text-yellow-400 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all"><MessageCircle className="w-5 h-5"/> WhatsApp</a>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

const Star: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
);

export default HomeTab;
