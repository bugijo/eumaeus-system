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
    <div className="min-h-screen flex bg-white">
      {/* PAINEL DA ESQUERDA - IMAGEM (só aparece em telas grandes) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-eumaeus-light relative">
        {/* Logo como uma marca d'água sutil no fundo */}
        <img src="/logo.png" alt="Eumaeus Logo" className="w-2/3 opacity-20" />
      </div>

      {/* PAINEL DA DIREITA - FORMULÁRIO */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo principal, menor, acima do formulário */}
          <img src="/logo.png" alt="Eumaeus System" className="mx-auto h-12 w-auto mb-8" />

          <h2 className="text-center text-2xl font-bold text-eumaeus-dark mb-2">
            Faça login na sua conta
          </h2>
          <p className="text-center text-eumaeus-gray mb-8">
            Bem-vindo(a) ao Eumaeus System!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de Email */}
            <div>
              <Label htmlFor="email" className="text-eumaeus-dark">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 border-gray-300 focus:border-eumaeus-blue focus:ring-eumaeus-blue"
              />
            </div>

            {/* Campo de Senha */}
            <div>
              <Label htmlFor="password" className="text-eumaeus-dark">Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-300 focus:border-eumaeus-blue focus:ring-eumaeus-blue pr-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 text-eumaeus-gray hover:text-eumaeus-blue"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Esconder' : 'Mostrar'}
                </Button>
              </div>
            </div>

            {/* Exibição de Erro */}
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            {/* Botão de Submit */}
            <Button 
              type="submit" 
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-eumaeus-blue hover:bg-eumaeus-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eumaeus-blue transition-colors" 
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