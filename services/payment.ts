
import { PlanType, PaymentRecord, Professional } from '../types';
import { db } from './db';
import { SUPPORT_PHONE } from '../constants';

export const paymentService = {
  async createPixPayment(userId: string, plan: PlanType, amount: number, email: string): Promise<PaymentRecord> {
    const config = await db.getMpConfig();
    const isProd = config.mode === 'prod';
    
    // Simulação de chamada API Mercado Pago usando o token configurado
    console.log(`[MP ${config.mode.toUpperCase()}] Gerando PIX via Token: ${config.accessToken.substring(0, 10)}...`);
    
    const mockId = Math.floor(Math.random() * 1000000000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const payment: PaymentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      external_id: mockId,
      userId,
      plan,
      amount,
      status: 'pending',
      qr_code: "00020101021226850014br.gov.bcb.pix0163tanamao_pagamentos_pix_dinamico_mercado_pago_" + mockId,
      qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEUAAAD///+l2Z/dAAABGElEQVRYw+2WwRHCMBAEn0pADvSADvSADvSADnSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSADvSAD/gF/wAn8f6A7EAAAAASUVORK5CYII=",
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      provider: 'mercadopago'
    };

    await db.recordPayment(payment);
    return payment;
  },

  async checkStatus(externalId: string): Promise<'pending' | 'approved' | 'expired'> {
    // Simula polling que aprova em 15 segundos ou aleatoriamente
    return new Promise((resolve) => {
      setTimeout(() => {
        const rand = Math.random();
        if (rand > 0.85) resolve('approved');
        else if (rand < 0.05) resolve('expired');
        else resolve('pending');
      }, 1000);
    });
  },

  getWhatsAppMessage(status: 'pending' | 'approved' | 'expired' | 'rejected' | 'renewal', pro: Professional): string {
    const nome = pro.companyName || pro.proName || 'Profissional';
    const plano = pro.plan === 'Premium' ? 'Premium Anual' : 'VIP Mensal';
    const dataFim = pro.subscriptionExpiresAt ? new Date(pro.subscriptionExpiresAt).toLocaleDateString() : '30 dias';

    const templates = {
      pending: `Olá ${nome}, seu PIX para ativar o plano ${plano} no app TáNaMão foi gerado. Para ativar seu destaque, conclua o pagamento no app. Após o pagamento, a ativação é automática.`,
      approved: `Olá ${nome}!\nPagamento confirmado com sucesso ✅\nSeu plano ${plano} no TáNaMão está ativo até ${dataFim}.\nSeu perfil já está em destaque para novos clientes.`,
      expired: `Olá ${nome}. O prazo para pagamento do PIX expirou. Gere um novo pagamento no app para continuar com o destaque.`,
      rejected: `Olá ${nome}. Seu pagamento não foi aprovado. Você pode tentar novamente gerando um novo PIX no aplicativo.`,
      renewal: `Olá ${nome}!\nSeu plano ${plano} no TáNaMão vence em breve (${dataFim}). Renove agora para continuar aparecendo em destaque.`
    };

    return encodeURIComponent(templates[status]);
  },

  sendWhatsAppNotification(status: 'pending' | 'approved' | 'expired' | 'rejected' | 'renewal', pro: Professional, target: 'pro' | 'support' = 'pro') {
    const message = this.getWhatsAppMessage(status, pro);
    const phone = target === 'pro' ? pro.whatsapp.replace(/\D/g, '') : SUPPORT_PHONE;
    
    // Se o target for suporte, prefixamos quem está enviando
    let finalMessage = message;
    if (target === 'support') {
      const prefix = encodeURIComponent(`[LOG TÁNAMÃO] Status: ${status.toUpperCase()} - Usuário: ${pro.companyName || pro.proName}\n\n`);
      finalMessage = prefix + message;
    }

    window.open(`https://wa.me/${phone}?text=${finalMessage}`, '_blank');
  }
};
