import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { errorMessage, signupApi } from '@/api/signupApi';

/** Destino do link de confirmação enviado por e-mail (/confirmar-email?token=). */
export default function ConfirmarEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'Link incompleto.');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    signupApi.verifyEmail(token)
      .then(() => { if (!cancelled) setState('ok'); })
      .catch((err) => { if (!cancelled) { setMessage(errorMessage(err, 'Link inválido ou vencido.')); setState('error'); } });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      {state === 'loading' && <h1 className="text-2xl font-semibold">Confirmando…</h1>}
      {state === 'ok' && (
        <>
          <h1 className="text-2xl font-semibold">E-mail confirmado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Agora é só entrar com o e-mail e a senha cadastrados.</p>
          <Button asChild className="mt-6"><Link to="/login">Entrar no sistema</Link></Button>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="text-2xl font-semibold">Não foi possível confirmar</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message} Na tela de login você pode pedir um link novo.</p>
          <Button asChild variant="outline" className="mt-6"><Link to="/login">Ir para o login</Link></Button>
        </>
      )}
    </main>
  );
}
