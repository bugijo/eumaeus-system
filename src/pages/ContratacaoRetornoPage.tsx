import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckoutStatus, errorMessage, forgetCheckoutToken, recallCheckoutToken, signupApi } from '@/api/signupApi';

const POLL_MS = 5000;
const POLL_LIMIT = 120; // ~10 minutos

const brlCents = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Retorno do Mercado Pago (/assinar/retorno?checkout=) e link do e-mail (/cadastro?checkout=&token=).
 * Acompanha o pagamento e, confirmado, mostra o cadastro do estabelecimento.
 */
export default function ContratacaoRetornoPage() {
  const [params] = useSearchParams();
  const checkoutId = params.get('checkout') ?? '';
  const token = params.get('token') ?? recallCheckoutToken(checkoutId) ?? '';
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [loadError, setLoadError] = useState('');
  const [done, setDone] = useState<{ email: string; requiresEmailVerification: boolean } | null>(null);
  const polls = useRef(0);

  useEffect(() => {
    if (!checkoutId || !token) return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const current = await signupApi.status({ checkoutId, token });
        if (cancelled) return;
        setStatus(current);
        setLoadError('');
        polls.current += 1;
        if (current.status === 'PENDING' && polls.current < POLL_LIMIT) timer = setTimeout(check, POLL_MS);
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err, 'Não encontramos esta contratação.'));
      }
    };
    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [checkoutId, token]);

  if (!checkoutId || !token) {
    return (
      <Shell title="Link incompleto">
        <p>Abra o link enviado para o seu e-mail depois do pagamento, ou use o mesmo navegador em que você iniciou a compra.</p>
        <p className="mt-3">Se precisar, fale com a equipe pelo WhatsApp na página inicial.</p>
      </Shell>
    );
  }
  if (done) {
    return (
      <Shell title="Conta criada">
        {done.requiresEmailVerification ? (
          <p>Enviamos um link de confirmação para <strong>{done.email}</strong>. Confirme o e-mail e depois entre no sistema.</p>
        ) : (
          <p>Tudo pronto. Entre com <strong>{done.email}</strong> e a senha que você acabou de criar.</p>
        )}
        <Button asChild className="mt-6 w-full"><Link to="/login">Ir para o login</Link></Button>
      </Shell>
    );
  }
  if (loadError) return <Shell title="Contratação não encontrada"><p>{loadError}</p></Shell>;
  if (!status) return <Shell title="Conferindo o pagamento…"><p>Só um instante.</p></Shell>;

  if (status.status === 'PENDING') {
    return (
      <Shell title="Aguardando a confirmação do pagamento">
        <p>Plano {status.planName}: {brlCents(status.amountCents)}.</p>
        <p className="mt-2">Pix costuma confirmar em segundos; cartão, em até alguns minutos. Esta página atualiza sozinha.</p>
        {polls.current >= POLL_LIMIT && (
          <p className="mt-3">Ainda não recebemos a confirmação. Quando o pagamento for aprovado, enviamos o link de cadastro para {status.contactEmail}.</p>
        )}
      </Shell>
    );
  }
  if (status.status === 'REJECTED') {
    return (
      <Shell title="Pagamento não aprovado">
        <p>O Mercado Pago não aprovou o pagamento. Nenhum valor foi cobrado por esta tentativa.</p>
        <Button asChild className="mt-6 w-full"><Link to={`/assinar?plano=${status.plan}`}>Tentar de novo</Link></Button>
      </Shell>
    );
  }
  if (status.status === 'COMPLETED') {
    return (
      <Shell title="Conta já criada">
        <p>Esta contratação já tem conta. Entre com o e-mail e a senha cadastrados.</p>
        <Button asChild className="mt-6 w-full"><Link to="/login">Ir para o login</Link></Button>
      </Shell>
    );
  }

  return (
    <SignupForm
      status={status}
      onDone={(result) => { forgetCheckoutToken(checkoutId); setDone(result); }}
      submit={(form) => signupApi.complete({ checkoutId, token, ...form })}
    />
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-3 text-sm text-muted-foreground">{children}</div>
    </main>
  );
}

type FormData = { clinicName: string; ownerName: string; email: string; password: string; document: string };

function SignupForm({ status, submit, onDone }: {
  status: CheckoutStatus;
  submit: (form: FormData) => Promise<{ email: string; requiresEmailVerification: boolean }>;
  onDone: (result: { email: string; requiresEmailVerification: boolean }) => void;
}) {
  const [form, setForm] = useState<FormData>({ clinicName: '', ownerName: '', email: status.contactEmail, password: '', document: '' });
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password !== confirm) { setError('As senhas não conferem.'); return; }
    setSaving(true);
    try {
      onDone(await submit(form));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <p className="text-sm font-medium text-emerald-700">Pagamento confirmado · Plano {status.planName}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Crie a conta do estabelecimento</h1>
      <p className="mt-2 text-sm text-muted-foreground">Você será a pessoa dona da conta e poderá cadastrar a equipe depois.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field id="clinicName" label="Nome do estabelecimento" value={form.clinicName} onChange={set('clinicName')} autoComplete="organization" />
        <Field id="document" label="CNPJ ou CPF (opcional)" value={form.document} onChange={set('document')} required={false} inputMode="numeric" />
        <Field id="ownerName" label="Seu nome" value={form.ownerName} onChange={set('ownerName')} autoComplete="name" />
        <Field id="email" label="E-mail de acesso" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        <Field id="password" label="Senha (10+ caracteres, letras e números)" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
        <Field id="confirm" label="Repita a senha" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Criando a conta…' : 'Criar conta'}</Button>
      </form>
    </main>
  );
}

function Field({ id, label, required = true, ...props }: { id: string; label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} required={required} {...props} />
    </div>
  );
}
