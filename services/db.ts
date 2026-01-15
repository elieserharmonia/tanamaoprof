
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Professional, Review, User } from '../types';
import { INITIAL_PROS } from '../constants';

// No Vercel, estas variáveis são configuradas no painel do projeto.
// O fallback (valor após o ||) garante que o app continue funcionando se as variáveis não forem achadas.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qcsxtkzgjrhzmvwvqpse.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_eNbpiaeRxpBUI8TKsLfekA_b8fcFpAK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FAVS_KEY = 'tanamao_favs_v2';
const USER_KEY = 'tanamao_user_v2';

export const db = {
  // --- AUTH METHODS (Custom login with table users) ---
  async signUp(email: string, password: string, name: string): Promise<User> {
    const id = Math.random().toString(36).substr(2, 9);
    const user: User = { id, email, password, name };
    
    const { error } = await supabase
      .from('users')
      .insert([user]);
    
    if (error) {
      if (error.code === '23505') throw new Error('Este e-mail já está cadastrado.');
      throw error;
    }
    
    return { id, email, name };
  },

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error || !data) throw new Error('E-mail ou senha incorretos.');
    
    return { id: data.id, email: data.email, name: data.name };
  },

  // --- PROFESSIONAL METHODS ---
  async getProfessionals(): Promise<Professional[]> {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('data');
      
      if (error) {
        console.warn("Dica: Se você acabou de conectar o banco, lembre-se de criar a tabela 'professionals' no SQL Editor.");
        return INITIAL_PROS;
      }
      
      if (!data || data.length === 0) return INITIAL_PROS;
      
      return data.map(item => item.data as Professional);
    } catch (e) {
      return INITIAL_PROS;
    }
  },

  async getProfessionalByUserId(userId: string): Promise<Professional | null> {
    const pros = await this.getProfessionals();
    return pros.find(p => p.userId === userId) || null;
  },

  async saveProfessional(pro: Professional): Promise<void> {
    try {
      const { error } = await supabase
        .from('professionals')
        .upsert({ 
          id: pro.id, 
          data: pro 
        });
      
      if (error) throw error;
    } catch (e) {
      console.error("Erro ao salvar profissional no banco remoto:", e);
      throw new Error("Não foi possível salvar os dados. Verifique sua conexão.");
    }
  },

  // --- LOCAL DATA ---
  async getFavorites(): Promise<string[]> {
    const saved = localStorage.getItem(FAVS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  async toggleFavorite(id: string): Promise<string[]> {
    const favs = await this.getFavorites();
    const newFavs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    localStorage.setItem(FAVS_KEY, JSON.stringify(newFavs));
    return newFavs;
  },

  async getCurrentUser(): Promise<User | null> {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  async setCurrentUser(user: User | null): Promise<void> {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  async addReview(proId: string, review: Review): Promise<Professional> {
    const pros = await this.getProfessionals();
    const index = pros.findIndex(p => p.id === proId);
    if (index === -1) throw new Error('Profissional não encontrado');
    
    pros[index].reviews.push(review);
    await this.saveProfessional(pros[index]);
    return pros[index];
  }
};
