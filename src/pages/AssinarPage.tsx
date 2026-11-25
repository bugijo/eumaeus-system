import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SIGNUP_PLANS, SignupPlanKey, errorMessage, rememberCheckoutToken, signupApi } from '@/api/signupApi';

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

/** Contratação: escolhe o plano, informa o e-mail e segue para o pagamento no Mercado Pago. */
export default function AssinarPage() {
  const [params] = useSearchParams();
  const initial = SIGNUP_PLANS.find((p) => p.key === params.get('plano')?.toUpperCase())?.key ?? 'CLINICA_PETSHOP';
  const [plan, setPlan] = useState<SignupPlanKey>(initial);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const checkout = await signupApi.startCheckout({ plan, email: email.trim() });
      rememberCheckoutToken(checkout.checkoutId, checkout.token);
      window.location.assign(checkout.redirectUrl);
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível iniciar o pagamento. Tente de novo.'));
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <Link to="/" className="mb-6 text-sm text-primary hover:underline">← Voltar</Link>
      <h1 className="text-2xl font-semibold tracking-tight">Contratar o Eumaeus</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Assinatura mensal com preço promocional nos 3 primeiros meses. O pagamento é feito no Mercado Pago
        (Pix ou cartão), sem precisar de conta lá. Depois da confirmação, você cria a conta do estabelecimento.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Plano</legend>
          {SIGNUP_PLANS.map((option) => (
            <label
              key={option.key}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${plan === option.key ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
            >
              <span className="flex items-center gap-3">
                <input type="radio" name="plano" value={option.key} checked={plan === option.key} onChange={() => setPlan(option.key)} />
                <span className="font-medium">{option.name}</span>
              </span>
              <span className="text-right text-sm tabular-nums">
                <span className="font-semibold">{brl(option.promo)}/mês</span>
                <span className="block text-xs text-muted-foreground">depois {brl(option.full)}/mês</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail para receber a confirmação</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@seunegocio.com.br" />
        </div>

        {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Abrindo o pagamento…' : 'Ir para o pagamento'}
        </Button>
        <p className="text-xs text-muted-foreground">
          A assinatura é cobrada todo mês pelo Mercado Pago; a partir do 4º mês vale o preço cheio.
          Para cancelar ou tirar dúvidas, fale com a equipe pelo WhatsApp na página inicial.
        </p>
      </form>
    </main>
  );
}
