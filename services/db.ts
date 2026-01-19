
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Professional, Review, User } from '../types';
import { INITIAL_PROS } from '../constants';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qcsxtkzgjrhzmvwvqpse.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_eNbpiaeRxpBUI8TKsLfekA_b8fcFpAK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FAVS_KEY = 'tanamao_favs_v2';
const USER_KEY = 'tanamao_user_v2';

export const db = {
  // --- AUTH METHODS ---
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
    
    await this.notifyWelcome(user, password);
    
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

  // --- NOTIFICATION METHODS ---
  async notifyWelcome(user: User, pass: string): Promise<void> {
    console.log(`[SIMULAÇÃO E-MAIL BOAS-VINDAS]`);
    console.log(`Para: ${user.email}`);
    console.log(`Assunto: Bem-vindo ao TáNaMão, ${user.name}!`);
    console.log(`Mensagem: Seu cadastro foi realizado com sucesso.`);
    console.log(`Login: ${user.email}`);
    console.log(`Senha: ${pass}`);
    console.log(`Link: ${window.location.origin}/perfil`);
    return new Promise(resolve => setTimeout(resolve, 1000));
  },

  async notifyProfessionalOfReview(pro: Professional, review: Review): Promise<void> {
    console.log(`[SIMULAÇÃO E-MAIL AVALIAÇÃO]`);
    console.log(`Para: ${pro.email}`);
    console.log(`Assunto: Nova avaliação recebida!`);
    console.log(`Mensagem: "${review.comment}" (${review.rating} estrelas)`);
    return new Promise(resolve => setTimeout(resolve, 800));
  },

  // --- PROFESSIONAL METHODS ---
  async getProfessionals(): Promise<Professional[]> {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('data');
      
      // Se houver dados no banco, prioriza eles e ignora os iniciais para evitar confusão de logos
      if (error) return INITIAL_PROS;
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
      // Garantir que a imagem está sendo salva exatamente como enviada no objeto pro
      const { error } = await supabase
        .from('professionals')
        .upsert({ 
          id: pro.id, 
          data: pro 
        });
      
      if (error) throw error;
    } catch (e) {
      console.error("Erro ao salvar profissional:", e);
      throw new Error("Não foi possível salvar os dados.");
    }
  },

  async incrementViews(proId: string): Promise<void> {
    const pros = await this.getProfessionals();
    const index = pros.findIndex(p => p.id === proId);
    if (index !== -1) {
      pros[index].views = (pros[index].views || 0) + 1;
      await this.saveProfessional(pros[index]);
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
    
    const pro = pros[index];
    pro.reviews.push(review);
    
    await this.saveProfessional(pro);
    await this.notifyProfessionalOfReview(pro, review);
    
    return pro;
  }
};
