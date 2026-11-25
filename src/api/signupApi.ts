import apiClient from './apiClient';

export type SignupPlanKey = 'PETSHOP' | 'CLINICA' | 'CLINICA_PETSHOP';

/** Exibição. O valor cobrado é sempre o do servidor. */
export const SIGNUP_PLANS: Array<{ key: SignupPlanKey; name: string; promo: number; full: number }> = [
  { key: 'PETSHOP', name: 'Pet Shop', promo: 79, full: 99 },
  { key: 'CLINICA', name: 'Clínica', promo: 129, full: 149 },
  { key: 'CLINICA_PETSHOP', name: 'Clínica + Pet Shop', promo: 149, full: 199 },
];

export type CheckoutStatus = {
  status: 'PENDING' | 'PAID' | 'REJECTED' | 'COMPLETED';
  plan: SignupPlanKey;
  planName: string;
  amountCents: number;
  fullPriceCents: number | null;
  contactEmail: string;
};

const NO_AUTH = { skipAuth: true, retry: 0 } as const;

/** Segredo do checkout guardado só neste navegador (a URL de retorno leva apenas o id). */
const storageKey = (checkoutId: string) => `eumaeus.checkout.${checkoutId}`;
export const rememberCheckoutToken = (checkoutId: string, token: string) => {
  try { localStorage.setItem(storageKey(checkoutId), token); } catch { /* navegador sem armazenamento */ }
};
export const recallCheckoutToken = (checkoutId: string): string | null => {
  try { return localStorage.getItem(storageKey(checkoutId)); } catch { return null; }
};
export const forgetCheckoutToken = (checkoutId: string) => {
  try { localStorage.removeItem(storageKey(checkoutId)); } catch { /* ignora */ }
};

export const errorMessage = (error: unknown, fallback = 'Não foi possível concluir agora. Tente de novo.') =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

export const signupApi = {
  startCheckout: async (input: { plan: SignupPlanKey; email: string }) =>
    (await apiClient.post<{ checkoutId: string; token: string; redirectUrl: string }>('/signup/checkout', input, NO_AUTH)).data,
  status: async (input: { checkoutId: string; token: string }) =>
    (await apiClient.post<CheckoutStatus>('/signup/checkout/status', input, NO_AUTH)).data,
  complete: async (input: {
    checkoutId: string; token: string; clinicName: string; ownerName: string; email: string; password: string; document?: string;
  }) => (await apiClient.post<{ email: string; requiresEmailVerification: boolean }>('/signup/complete', input, NO_AUTH)).data,
  verifyEmail: async (token: string) => (await apiClient.post<{ verified: boolean }>('/signup/verify-email', { token }, NO_AUTH)).data,
  resendVerification: async (email: string) => (await apiClient.post('/signup/resend-verification', { email }, NO_AUTH)).data,
};
