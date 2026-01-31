import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Professional, Review, User, PaymentRecord, Subscription, PlanType, MpConfig, UserLocation } from '../types';
import { INITIAL_PROS } from '../constants';

// Priorização absoluta das variáveis de ambiente URL_SUPABASE e SUPABASE_KEY
const SUPABASE_URL = process.env.URL_SUPABASE || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("TáNaMão: Erro Crítico - URL_SUPABASE ou SUPABASE_KEY não configuradas na Vercel.");
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

const FAVS_KEY = 'tanamao_favs_v2';
const USER_KEY = 'tanamao_user_v2';
const LAST_LOC_KEY = 'tanamao_last_loc';

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
    const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).eq('password', password).single();
    if (error || !data) throw new Error('E-mail ou senha incorretos.');
    return { id: data.id, email: data.email, name: data.name };
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
    if (error || !data) return null;
    return { id: data.id, email: data.email, name: data.name };
  },

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabase.from('users').update({ password: newPassword }).eq('id', userId);
    if (error) throw error;
  },

  // --- ADMIN CONFIG ---
  async getMasterPassword(): Promise<string> {
    const { data } = await supabase.from('app_config').select('data').eq('key', 'master_password').single();
    return data?.data?.password || 'admin';
  },

  async updateMasterPassword(newPassword: string): Promise<void> {
    await supabase.from('app_config').upsert({ key: 'master_password', data: { password: newPassword } });
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

  async deleteProfessional(proId: string): Promise<void> {
    const { error } = await supabase.from('professionals').delete().eq('id', proId);
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
      isVip: true, 
      isHighlighted: plan === 'Premium'
    };

    await this.saveProfessional(updatedPro);
  },

  // --- GEOLOCATION HELPERS ---
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  },

  saveLastLocation(loc: UserLocation): void {
    localStorage.setItem(LAST_LOC_KEY, JSON.stringify(loc));
  },

  getLastLocation(): UserLocation | null {
    const saved = localStorage.getItem(LAST_LOC_KEY);
    return saved ? JSON.parse(saved) : null;
  },

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
  },

  async recordPayment(payment: PaymentRecord): Promise<void> {
     await supabase.from('payments').insert([payment]);
  }
};