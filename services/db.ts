
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Professional, Review, User, PaymentRecord, Subscription, PlanType, MpConfig } from '../types';
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
    const { error } = await supabase.from('users').insert([user]);
    if (error) {
      if (error.code === '23505') throw new Error('Este e-mail já está cadastrado.');
      throw error;
    }
    return { id, email, name };
  },

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
    if (error || !data) throw new Error('E-mail ou senha incorretos.');
    return { id: data.id, email: data.email, name: data.name };
  },

  // --- CONFIG METHODS ---
  async getMpConfig(): Promise<MpConfig> {
    const { data } = await supabase.from('app_config').select('data').eq('key', 'mp_config').single();
    return data?.data || { mode: 'test', accessToken: '', webhookUrl: '' };
  },

  async saveMpConfig(config: MpConfig): Promise<void> {
    await supabase.from('app_config').upsert({ key: 'mp_config', data: config });
  },

  // --- PROFESSIONAL METHODS ---
  async getProfessionals(): Promise<Professional[]> {
    try {
      const { data, error } = await supabase.from('professionals').select('data');
      if (error || !data || data.length === 0) return INITIAL_PROS;
      
      const pros = data.map(item => item.data as Professional);
      
      const now = new Date();
      return pros.map(p => {
        if (p.plan !== 'Gratuito' && p.subscriptionExpiresAt && new Date(p.subscriptionExpiresAt) < now) {
          return { ...p, plan: 'Gratuito', isVip: false, isHighlighted: false };
        }
        return p;
      });
    } catch (e) {
      return INITIAL_PROS;
    }
  },

  async getProfessionalByUserId(userId: string): Promise<Professional | null> {
    const pros = await this.getProfessionals();
    return pros.find(p => p.userId === userId) || null;
  },

  async saveProfessional(pro: Professional): Promise<void> {
    const { error } = await supabase.from('professionals').upsert({ id: pro.id, data: pro });
    if (error) throw error;
  },

  async activatePlan(userId: string, plan: PlanType): Promise<void> {
    const pro = await this.getProfessionalByUserId(userId);
    if (!pro) return;

    const expiresAt = new Date();
    if (plan === 'VIP') expiresAt.setDate(expiresAt.getDate() + 30);
    else if (plan === 'Premium') expiresAt.setDate(expiresAt.getDate() + 365);

    const updatedPro: Professional = {
      ...pro,
      plan,
      subscriptionExpiresAt: expiresAt.toISOString(),
      isVip: plan === 'VIP' || plan === 'Premium',
      isHighlighted: plan === 'Premium'
    };

    await this.saveProfessional(updatedPro);
  },

  async recordPayment(payment: PaymentRecord): Promise<void> {
     await supabase.from('payments').insert([payment]);
  },

  // --- LOCAL STORAGE ---
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
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  },

  async addReview(proId: string, review: Review): Promise<Professional> {
    const pros = await this.getProfessionals();
    const index = pros.findIndex(p => p.id === proId);
    if (index === -1) throw new Error('Profissional não encontrado');
    const pro = pros[index];
    pro.reviews.push(review);
    await this.saveProfessional(pro);
    return pro;
  },

  async incrementViews(proId: string): Promise<void> {
    const pros = await this.getProfessionals();
    const pro = pros.find(p => p.id === proId);
    if (pro) {
      pro.views = (pro.views || 0) + 1;
      await this.saveProfessional(pro);
    }
  }
};
