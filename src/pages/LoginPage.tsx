// Em src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      {/* PAINEL DA ESQUERDA - IMAGEM (só aparece em telas grandes) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-muted relative">
        {/* Logo como uma marca d'água sutil no fundo */}
        <img src="/logo.png" alt="Eumaeus Logo" className="w-2/3 opacity-20" />
      </div>

      {/* PAINEL DA DIREITA - FORMULÁRIO */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo principal, menor, acima do formulário */}
          <img src="/logo.png" alt="Eumaeus System" className="mx-auto h-12 w-auto mb-8" />

          <h2 className="text-center text-2xl font-bold text-foreground mb-2">
            Faça login na sua conta
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Bem-vindo(a) ao Eumaeus System!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de Email */}
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
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
            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            {/* Botão de Submit */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}