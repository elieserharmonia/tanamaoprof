
import React, { useState } from 'react';
import { 
  Search, MapPin, Star, Heart, Phone, Mail, 
  MessageCircle, AlertCircle, Clock, 
  ArrowUpDown, Check, User as UserIcon,
  HelpCircle, UserPlus, Loader2, Briefcase, ShoppingBag, Eye, TrendingUp, Calendar
} from 'lucide-react';
import { Professional, User, Review } from '../types';
import { PRO_CATEGORIES, COMERCIO_CATEGORIES } from '../constants';
import { db } from '../services/db';

interface HomeTabProps {
  professionals: Professional[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  updateProfessional: (pro: Professional) => void;
  currentUser: User | null;
  onLogin: (name: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  professionals, 
  favorites, 
  toggleFavorite, 
  updateProfessional,
  currentUser,
  onLogin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'Todos' | 'Profissional' | 'Comercio'>('Todos');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSub, setFilterSub] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'views' | 'recent'>('name');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [tempName, setTempName] = useState('');

  const getAvgRating = (pro: Professional) => {
    if (!pro.reviews || pro.reviews.length === 0) return 0;
    return pro.reviews.reduce((sum, r) => sum + r.rating, 0) / pro.reviews.length;
  };

  const filteredPros = professionals.filter(pro => {
    const matchesSearch = (pro.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (pro.proName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (pro.bio || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Todos' || pro.profileType === filterType;
    const matchesCat = !filterCategory || pro.category === filterCategory;
    const matchesSub = !filterSub || pro.subCategory === filterSub;
    const matchesCity = !selectedCity || pro.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesState = !selectedState || pro.state.toLowerCase() === selectedState.toLowerCase();
    return matchesSearch && matchesType && matchesCat && matchesSub && matchesCity && matchesState;
  }).sort((a, b) => {
    if (a.isHighlighted && !b.isHighlighted) return -1;
    if (!a.isHighlighted && b.isHighlighted) return 1;

    if (sortBy === 'name') {
      const nameA = (a.companyName || a.proName || '').toLowerCase();
      const nameB = (b.companyName || b.proName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'rating') return getAvgRating(b) - getAvgRating(a);
    if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
    if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  const cities = Array.from(new Set(professionals.map(p => p.city))).sort();
  const states = Array.from(new Set(professionals.map(p => p.state))).sort();

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onLogin(tempName.trim());
      setShowLoginModal(false);
      setTempName('');
    }
  };

  return (
    <div className="p-4 space-y-4 relative">
      <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou serviço..."
            className="w-full bg-gray-50 border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FILTRO TIPO */}
        <div className="flex gap-2">
          {['Todos', 'Profissional', 'Comercio'].map(t => (
            <button 
              key={t}
              onClick={() => { setFilterType(t as any); setFilterCategory(''); setFilterSub(''); }}
              className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all border-2 ${filterType === t ? 'bg-black text-yellow-400 border-black' : 'bg-white text-black border-black/10'}`}
            >
              {t === 'Comercio' ? 'Comércios' : t}
            </button>
          ))}
        </div>

        {/* FILTRO CATEGORIA DINAMICO */}
        <div className="flex gap-2">
          <select 
            className="flex-1 bg-white border-2 border-black rounded-lg px-2 py-2 text-[10px] font-black uppercase outline-none"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setFilterSub(''); }}
          >
            <option value="">Categoria</option>
            {filterType !== 'Todos' && Object.keys(filterType === 'Profissional' ? PRO_CATEGORIES : COMERCIO_CATEGORIES).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {filterType === 'Profissional' && (
            <select 
              className="flex-1 bg-white border-2 border-black rounded-lg px-2 py-2 text-[10px] font-black uppercase outline-none"
              value={filterSub}
              onChange={(e) => setFilterSub(e.target.value)}
              disabled={!filterCategory}
            >
              <option value="">Profissão</option>
              {filterCategory && PRO_CATEGORIES[filterCategory as keyof typeof PRO_CATEGORIES]?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {/* CIDADE E UF */}
        <div className="flex gap-2">
          <select className="flex-1 bg-white border-2 border-black rounded-lg px-2 py-2 text-[10px] font-black uppercase outline-none" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
            <option value="">UF</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="flex-[2] bg-white border-2 border-black rounded-lg px-2 py-2 text-[10px] font-black uppercase outline-none" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
            <option value="">Cidade</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* ORDENAÇÃO */}
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide border-t border-black/5 pt-2">
          {[
            { id: 'name', icon: <ArrowUpDown className="w-3 h-3"/>, label: 'Nome' },
            { id: 'rating', icon: <Star className="w-3 h-3"/>, label: 'Melhores' },
            { id: 'views', icon: <TrendingUp className="w-3 h-3"/>, label: 'Populares' },
            { id: 'recent', icon: <Calendar className="w-3 h-3"/>, label: 'Novos' }
          ].map(s => (
            <button 
              key={s.id}
              onClick={() => setSortBy(s.id as any)}
              className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-full text-[9px] font-black uppercase border-2 transition-all ${sortBy === s.id ? 'bg-yellow-400 text-black border-black shadow-md' : 'bg-gray-50 text-gray-400 border-black/5'}`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredPros.map(pro => (
          <ProCard 
            key={pro.id} 
            pro={pro} 
            isFavorite={favorites.includes(pro.id)}
            toggleFavorite={toggleFavorite}
            updateProfessional={updateProfessional}
            currentUser={currentUser}
            onPromptLogin={() => setShowLoginModal(true)}
          />
        ))}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-yellow-400 border-4 border-black w-full max-w-xs rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black uppercase italic text-center mb-6">Identifique-se para avaliar</h2>
            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              <input 
                autoFocus
                type="text" 
                placeholder="Seu nome"
                className="w-full bg-white border-3 border-black rounded-xl px-4 py-3 font-bold outline-none"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
              />
              <button type="submit" className="w-full bg-black text-yellow-400 border-3 border-black font-black py-3 rounded-xl text-xs uppercase">Confirmar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProCard: React.FC<{ 
  pro: Professional; 
  isFavorite: boolean; 
  toggleFavorite: (id: string) => void;
  updateProfessional: (pro: Professional) => void;
  currentUser: User | null;
  onPromptLogin: () => void;
}> = ({ pro, isFavorite, toggleFavorite, updateProfessional, currentUser, onPromptLogin }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleOpenDetails = () => {
    if (!showDetails) {
      db.incrementViews(pro.id);
    }
    setShowDetails(!showDetails);
  };

  const handleReview = async () => {
    if (!currentUser) return onPromptLogin();
    if (rating === 0 || !comment.trim()) return alert('Preencha estrelas e comentário');
    
    setIsSubmittingReview(true);
    try {
      const newReview: Review = {
        id: Math.random().toString(36).substr(2, 9),
        userName: currentUser.name,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        hidden: false
      };
      
      const updatedPro = await db.addReview(pro.id, newReview);
      updateProfessional(updatedPro);
      setRating(0);
      setComment('');
      alert('Avaliação enviada! O profissional foi notificado.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avgRating = pro.reviews.length > 0 
    ? (pro.reviews.reduce((sum, r) => sum + r.rating, 0) / pro.reviews.length).toFixed(1)
    : 'Novo';

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${pro.isHighlighted ? 'border-black' : 'border-black/20'}`}>
      {pro.isHighlighted && (
        <div className="bg-black text-yellow-400 text-[10px] font-black py-1.5 text-center uppercase tracking-widest">
          PROFISSIONAL DESTAQUE ★
        </div>
      )}

      <div className="p-4 flex gap-4">
        <img src={pro.photoUrl} className="w-16 h-16 rounded-xl object-cover border-2 border-black" alt={pro.proName} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-black uppercase text-sm truncate">{pro.companyName || pro.proName}</h3>
            <button onClick={() => toggleFavorite(pro.id)}>
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-1 mt-1">
             <Star className="w-3 h-3 fill-black" />
             <span className="text-[10px] font-black">{avgRating} ({pro.reviews.length})</span>
             <span className="text-black/20 mx-1">•</span>
             <Eye className="w-3 h-3" />
             <span className="text-[10px] font-black">{pro.views || 0}</span>
          </div>

          <p className="text-[9px] font-black text-yellow-600 uppercase mt-1">
            {pro.profileType === 'Profissional' ? <Briefcase className="w-2 h-2 inline mr-1" /> : <ShoppingBag className="w-2 h-2 inline mr-1" />}
            {pro.category} • {pro.subCategory}
          </p>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-black/5">
        <p className="text-[10px] text-gray-600 italic line-clamp-1">"{pro.bio}"</p>
      </div>

      <div className="p-4 pt-0 flex gap-2">
        <a 
          href={`https://wa.me/${pro.whatsapp}`} 
          target="_blank" 
          className="flex-1 bg-green-600 text-white font-black py-2.5 rounded-xl border-2 border-black flex items-center justify-center gap-2 text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
        >
          WhatsApp
        </a>
        <button 
          onClick={handleOpenDetails}
          className="flex-1 bg-black text-white font-black py-2.5 rounded-xl border-2 border-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
        >
          {showDetails ? 'Ver Menos' : 'Ver Mais'}
        </button>
      </div>

      {showDetails && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-2 gap-4">
            <a href={`tel:${pro.phone}`} className="flex items-center justify-center gap-2 bg-white border-2 border-black p-2 rounded-lg font-black text-[9px] uppercase"><Phone className="w-3 h-3"/> Ligar</a>
            <a href={`mailto:${pro.email}`} className="flex items-center justify-center gap-2 bg-white border-2 border-black p-2 rounded-lg font-black text-[9px] uppercase"><Mail className="w-3 h-3"/> E-mail</a>
          </div>

          <div className="space-y-3 bg-yellow-50 p-3 rounded-xl border border-black/5">
            <h4 className="font-black text-[10px] uppercase">Avaliações</h4>
            <div className="space-y-2">
              {pro.reviews.filter(r => !r.hidden).map(r => (
                <div key={r.id} className="bg-white p-2 rounded-lg border border-black/10">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-[8px] font-black uppercase">{r.userName}</span>
                     <div className="flex text-black">
                       {[1,2,3,4,5].map(i => <Star key={i} className={`w-2 h-2 ${r.rating >= i ? 'fill-black' : ''}`} />)}
                     </div>
                   </div>
                   <p className="text-[10px] italic">"{r.comment}"</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-black/5 space-y-2">
              <div className="flex justify-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <button key={i} onClick={() => setRating(i)}>
                    <Star className={`w-5 h-5 ${rating >= i ? 'fill-black' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <textarea 
                placeholder="Como foi o atendimento?"
                className="w-full text-[10px] p-2 rounded-lg border-2 border-black outline-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button 
                onClick={handleReview}
                disabled={isSubmittingReview}
                className="w-full bg-black text-yellow-400 font-black py-2 rounded-lg text-[9px] uppercase"
              >
                {isSubmittingReview ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Avaliar agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeTab;
