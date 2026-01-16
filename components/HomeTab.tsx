
import React, { useState } from 'react';
import { 
  Search, MapPin, Star, Heart, Phone, Mail, 
  MessageCircle, Share2, AlertCircle, Clock, 
  ArrowUpDown, Facebook, Copy, Check, User as UserIcon
} from 'lucide-react';
import { Professional, Category, User } from '../types';

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
  const [activeCategory, setActiveCategory] = useState<Category | 'Todos'>('Todos');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'default'>('default');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [tempName, setTempName] = useState('');

  const getAvgRating = (pro: Professional) => {
    if (pro.reviews.length === 0) return 0;
    return pro.reviews.reduce((sum, r) => sum + r.rating, 0) / pro.reviews.length;
  };

  const filteredPros = professionals.filter(pro => {
    const matchesSearch = (pro.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (pro.proName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pro.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || pro.category === activeCategory;
    const matchesCity = !selectedCity || pro.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesState = !selectedState || pro.state.toLowerCase() === selectedState.toLowerCase();
    return matchesSearch && matchesCategory && matchesCity && matchesState;
  }).sort((a, b) => {
    if (a.isHighlighted && !b.isHighlighted) return -1;
    if (!a.isHighlighted && b.isHighlighted) return 1;

    if (sortBy === 'name') {
      const nameA = (a.companyName || a.proName || '').toLowerCase();
      const nameB = (b.companyName || b.proName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'rating') {
      return getAvgRating(b) - getAvgRating(a);
    }
    return 0;
  });

  const cities = Array.from(new Set(professionals.filter(p => !selectedState || p.state === selectedState).map(p => p.city))).sort();
  const states = Array.from(new Set(professionals.map(p => p.state))).sort();
  const dynamicCategories = Array.from(new Set(professionals.map(p => p.category))).sort();

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onLogin(tempName.trim());
      setShowLoginModal(false);
      setTempName('');
    }
  };

  return (
    <div className="p-4 space-y-6 relative">
      {/* Search & Filters */}
      <div className="space-y-3 bg-black/5 p-3 rounded-2xl border border-black/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-5 h-5" />
          <input 
            type="text" 
            placeholder="O que você precisa hoje?"
            className="w-full bg-white border-2 border-black rounded-xl py-3 pl-10 pr-4 focus:ring-4 focus:ring-black/10 outline-none font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 items-center">
           <select 
            className="flex-1 bg-white border-2 border-black rounded-lg px-2 py-2 text-[10px] font-black uppercase focus:ring-2 focus:ring-black outline-none cursor-pointer"
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
          >
            <option value="">UF (Estado)</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select 
            className="flex-1 bg-white border-2 border-black rounded-lg px-2 py-2 text-[10px] font-black uppercase focus:ring-2 focus:ring-black outline-none cursor-pointer"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">Cidade</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveCategory('Todos')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black uppercase transition-all border-2 ${activeCategory === 'Todos' ? 'bg-black text-yellow-400 border-black' : 'bg-white text-black border-black'}`}
          >
            Todos
          </button>
          {dynamicCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black uppercase transition-all border-2 ${activeCategory === cat ? 'bg-black text-yellow-400 border-black' : 'bg-white text-black border-black'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-black/10 flex gap-2">
          <button 
            onClick={() => setSortBy(sortBy === 'name' ? 'default' : 'name')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${sortBy === 'name' ? 'bg-black text-yellow-400 border-black' : 'bg-white/50 text-black border-black/20'}`}
          >
            <ArrowUpDown className="w-3 h-3" /> Por Nome
          </button>
          <button 
            onClick={() => setSortBy(sortBy === 'rating' ? 'default' : 'rating')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${sortBy === 'rating' ? 'bg-black text-yellow-400 border-black' : 'bg-white/50 text-black border-black/20'}`}
          >
            <Star className="w-3 h-3" /> Por Avaliação
          </button>
        </div>
      </div>

      {/* Professionals List */}
      <div className="space-y-4">
        {filteredPros.length === 0 ? (
          <div className="text-center py-10 text-black font-bold italic bg-black/5 rounded-2xl border-2 border-dashed border-black/20">
            Nenhum resultado encontrado...
          </div>
        ) : (
          filteredPros.map(pro => (
            <ProCard 
              key={pro.id} 
              pro={pro} 
              isFavorite={favorites.includes(pro.id)}
              toggleFavorite={toggleFavorite}
              updateProfessional={updateProfessional}
              currentUser={currentUser}
              onPromptLogin={() => setShowLoginModal(true)}
            />
          ))
        )}
      </div>

      {/* Identity Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-yellow-400 border-4 border-black w-full max-w-xs rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="bg-black text-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black shadow-lg">
                <UserIcon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">QUEM É VOCÊ?</h2>
              <p className="text-xs font-bold text-black/60">Identifique-se para deixar sua avaliação real.</p>
            </div>
            
            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase px-1">Seu Nome Completo</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ex: João da Silva"
                  className="w-full bg-white border-3 border-black rounded-xl px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-black/10"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 bg-white text-black border-3 border-black font-black py-3 rounded-xl text-xs uppercase"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-black text-yellow-400 border-3 border-black font-black py-3 rounded-xl text-xs uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                >
                  Confirmar
                </button>
              </div>
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
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Verifica se o usuário atual já deixou uma avaliação para este profissional
  const alreadyReviewed = currentUser && pro.reviews.some(r => r.userName.toLowerCase() === currentUser.name.toLowerCase());

  const handleReview = () => {
    if (!currentUser) return onPromptLogin();
    if (alreadyReviewed) return alert('Você já avaliou este profissional!');
    if (rating === 0) return alert('Por favor, selecione as estrelas');
    if (!comment.trim()) return alert('Escreva um pequeno comentário');
    
    const newReview = {
      id: Math.random().toString(36).substr(2, 9),
      userName: currentUser.name,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
      hidden: false
    };
    updateProfessional({
      ...pro,
      reviews: [...pro.reviews, newReview]
    });
    setRating(0);
    setComment('');
  };

  const avgRating = pro.reviews.length > 0 
    ? (pro.reviews.reduce((sum, r) => sum + r.rating, 0) / pro.reviews.length).toFixed(1)
    : 'Novo';

  const cleanWhatsapp = pro.whatsapp.replace(/\D/g, '');
  const whatsappNumber = cleanWhatsapp.startsWith('55') ? cleanWhatsapp : `55${cleanWhatsapp}`;
  const whatsappMessage = encodeURIComponent('Olá! Encontrei seu contato no aplicativo TáNaMão.');
  
  const shareText = encodeURIComponent(`Confira o perfil de ${pro.companyName || pro.proName} no TáNaMão! Acesse agora para encontrar os melhores serviços.`);
  const shareUrl = encodeURIComponent(window.location.href);

  const copyToClipboard = () => {
    const text = `Confira o perfil de ${pro.companyName || pro.proName} no TáNaMão! ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${pro.isHighlighted ? 'border-black ring-4 ring-black/5' : 'border-black'}`}>
      {pro.isHighlighted && (
        <div className="bg-black text-yellow-400 text-[10px] font-black py-1.5 text-center uppercase tracking-widest">
          PROFISSIONAL DESTAQUE ★
        </div>
      )}

      <div className="p-4 flex gap-4">
        <div className="relative">
          <img src={pro.photoUrl} alt={pro.proName} className="w-20 h-20 rounded-2xl object-cover border-2 border-black bg-yellow-100" />
          {pro.isEmergency24h && (
            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-1 border-2 border-black shadow-md animate-pulse" title="Emergência 24h">
              <AlertCircle className="w-3 h-3" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              {pro.companyName && (
                <h3 className="text-lg font-black uppercase text-black leading-tight tracking-tight">{pro.companyName}</h3>
              )}
              {pro.proName && (
                <p className={`${pro.companyName ? 'text-xs text-gray-600 font-bold capitalize' : 'text-lg font-black text-black tracking-tight'}`}>
                  {pro.proName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              )}
            </div>
            <button onClick={() => toggleFavorite(pro.id)} className="text-gray-300 hover:text-red-500 transition-colors">
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1 mt-1">
            <div className="flex text-black">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-3 h-3 ${Math.round(Number(avgRating)) >= i ? 'fill-black' : ''}`} />
              ))}
            </div>
            <span className="text-[10px] font-black text-gray-500">({pro.reviews.length})</span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-[10px] text-black font-black uppercase tracking-wider">
            <MapPin className="w-3 h-3" />
            {pro.city} - {pro.state}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-black/10 bg-gray-50/80">
        <p className="text-xs text-black/80 line-clamp-2 italic whitespace-pre-wrap leading-relaxed">"{pro.bio}"</p>
      </div>

      <div className="p-4 flex gap-2">
        <a 
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 bg-green-600 text-white font-black py-2.5 rounded-xl border-2 border-black flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-xs uppercase tracking-tighter"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2.5 bg-black text-white rounded-xl border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
        >
          {showDetails ? 'Ver Menos' : 'Ver Mais'}
        </button>
      </div>

      <div className="px-4 pb-4">
         <button 
          onClick={() => setShowShareOptions(!showShareOptions)}
          className={`w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border-2 border-dashed transition-all ${showShareOptions ? 'bg-yellow-100 border-black' : 'text-black/30 border-black/10 hover:text-black hover:border-black/30'}`}
        >
          <Share2 className="w-3 h-3" /> {showShareOptions ? 'Fechar Compartilhamento' : 'Compartilhar Perfil'}
        </button>

        {showShareOptions && (
          <div className="flex gap-2 mt-2 animate-in fade-in zoom-in duration-200">
            <a 
              href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-500 text-white p-2 rounded-lg flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              title="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <button 
              onClick={copyToClipboard}
              className={`flex-1 p-2 rounded-lg flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors ${copied ? 'bg-black text-yellow-400' : 'bg-white text-black'}`}
              title="Copiar Link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="space-y-2">
            <h4 className="font-black text-[10px] uppercase flex items-center gap-2 text-black/40 tracking-widest border-b border-black/5 pb-1">
              <Clock className="w-3 h-3" /> Horários
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {pro.workingHours.map(h => (
                <div key={h.day} className="text-[10px] flex justify-between bg-black/5 p-1.5 rounded border border-black/5">
                  <span className="font-black uppercase text-[8px]">{h.day}</span>
                  <span className="font-bold">{h.closed ? 'FECHADO' : `${h.start} - ${h.end}`}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <a href={`mailto:${pro.email}`} className="flex-1 bg-white text-black font-black py-2 rounded-lg border-2 border-black flex items-center justify-center gap-2 text-[10px] uppercase">
              <Mail className="w-3 h-3" /> E-mail
            </a>
            <a href={`tel:${pro.phone}`} className="flex-1 bg-white text-black font-black py-2 rounded-lg border-2 border-black flex items-center justify-center gap-2 text-[10px] uppercase">
              <Phone className="w-3 h-3" /> Ligar
            </a>
          </div>

          {pro.servicesPhotos.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-black text-[10px] uppercase text-black/40 tracking-widest border-b border-black/5 pb-1">Trabalhos Realizados (VIP)</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {pro.servicesPhotos.map((img, i) => (
                  <img key={i} src={img} className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-black/10 shadow-sm" alt="Serviço" />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 bg-yellow-50/50 p-3 rounded-xl border border-black/5">
            <h4 className="font-black text-[10px] uppercase text-black/40 tracking-widest">Avaliações</h4>
            <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
              {pro.reviews.filter(r => !r.hidden).map(r => (
                <div key={r.id} className="bg-white p-2.5 rounded-lg border border-black/10 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-gray-800">{r.userName}</span>
                    <div className="flex text-black">
                      {[1,2,3,4,5].map(i => <Star key={i} className={`w-2 h-2 ${r.rating >= i ? 'fill-black' : ''}`} />)}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-tight">"{r.comment}"</p>
                </div>
              ))}
              {pro.reviews.filter(r => !r.hidden).length === 0 && (
                <p className="text-[10px] text-gray-400 font-bold italic text-center py-2">Nenhuma avaliação ainda.</p>
              )}
            </div>

            <div className="space-y-3 border-t border-black/5 pt-3">
              {currentUser ? (
                alreadyReviewed ? (
                  <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-green-800 uppercase italic">Você já avaliou este profissional!</p>
                    <p className="text-[8px] text-green-600 font-bold uppercase mt-1">Obrigado pela sua contribuição.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase text-black/40">Avaliar como:</span>
                      <span className="text-[9px] font-black uppercase text-black underline">{currentUser.name}</span>
                    </div>
                    <div className="flex justify-center gap-2">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} onClick={() => setRating(i)} className="transition-transform active:scale-125">
                          <Star className={`w-6 h-6 ${rating >= i ? 'fill-black text-black' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Como foi sua experiência?"
                      className="w-full text-xs p-3 rounded-xl border-2 border-black focus:ring-0 outline-none bg-white font-medium shadow-inner"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button 
                      onClick={handleReview}
                      className="w-full bg-black text-yellow-400 font-black py-3 rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                    >
                      Enviar Avaliação
                    </button>
                  </>
                )
              ) : (
                <div className="text-center p-4 bg-black/5 rounded-xl border-2 border-dashed border-black/10">
                  <p className="text-[10px] font-bold text-black/60 mb-3 uppercase italic">Você precisa se identificar para avaliar.</p>
                  <button 
                    onClick={onPromptLogin}
                    className="bg-black text-yellow-400 px-6 py-2 rounded-lg font-black text-[10px] uppercase shadow-md active:scale-95 transition-all"
                  >
                    Identificar-me Agora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeTab;
