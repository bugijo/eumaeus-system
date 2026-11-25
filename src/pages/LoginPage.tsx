// Em src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';
import { signupApi } from '../api/signupApi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DownloadsSection } from "@/components/downloads/DownloadsSection";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login({ email, password });

      // Usa a ação da nossa store para salvar o estado do login com ambos os tokens
      login(data.accessToken, data.refreshToken, data.user);

      // Redirecionamento para funcionários (dashboard principal)
      if (data.user.type === 'user') {
        navigate('/');
      } else {
        // Acesso negado para não-funcionários
        setError('Acesso restrito apenas para funcionários da clínica.');
        return;
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-emerald-700 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <span className="rounded-2xl bg-white p-2 shadow-lg"><img src="/logo.png" alt="" className="h-12 w-12 object-contain" /></span>
          <span className="text-2xl font-semibold tracking-tight">Eumaeus</span>
        </div>
        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl font-bold leading-tight">Clínica veterinária e pet shop no mesmo sistema.</h1>
          <ul className="space-y-3 text-base text-primary-foreground/90">
            {['Agenda, prontuário e receitas', 'Caixa com leitor de código de barras', 'Estoque, financeiro e relatório para o contador', 'No computador, no celular e no tablet'].map((item) => (
              <li key={item} className="flex items-start gap-3"><span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-white" />{item}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">© {new Date().getFullYear()} Eumaeus</p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <img src="/logo.png" alt="Eumaeus" className="mx-auto mb-6 h-20 w-auto lg:hidden" />

          <h2 className="mb-2 text-center text-2xl font-bold text-foreground lg:text-left">Entrar</h2>
          <p className="mb-8 text-center text-muted-foreground lg:text-left">Use o e-mail e a senha cadastrados pelo responsável do estabelecimento.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de Email */}
            <div>
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 border-input focus:border-primary focus:ring-primary"
              />
            </div>

            {/* Campo de Senha */}
            <div>
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-input focus:border-primary focus:ring-primary pr-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Esconder' : 'Mostrar'}
                </Button>
              </div>
            </div>

            {/* Exibição de Erro */}
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{error}</p>}
            {error.startsWith('Confirme seu e-mail') && (
              <button
                type="button"
                className="w-full text-center text-sm text-primary underline-offset-4 hover:underline disabled:opacity-60"
                disabled={resent || !email}
                onClick={async () => { await signupApi.resendVerification(email).catch(() => undefined); setResent(true); }}
              >
                {resent ? 'Se a conta existir, enviamos um link novo.' : 'Reenviar link de confirmação'}
              </button>
            )}

            {/* Botão de Submit */}
            <Button 
              type="submit" 
              className="h-11 w-full text-base"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
            <summary className="cursor-pointer font-medium">Baixar aplicativo ou instalar no celular</summary>
            <div className="mt-4"><DownloadsSection /></div>
          </details>
          <p className="mt-8 text-center text-xs text-muted-foreground">Esqueceu a senha? Peça ao dono do estabelecimento para redefinir em Configurações › Equipe e acessos.</p>
        </div>
      </main>
    </div>
  );
}