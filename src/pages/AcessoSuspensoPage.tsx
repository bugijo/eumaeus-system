import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

const SUPPORT_WHATSAPP = '5516991702781';
const whatsappLink = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Olá! O acesso ao Eumaeus foi suspenso e quero regularizar a assinatura.')}`;

/** Tela mostrada quando a API responde 402 (assinatura pausada, cancelada ou em atraso). */
export default function AcessoSuspensoPage() {
  const logout = useAuthStore((state) => state.logout);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Acesso suspenso</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        A assinatura deste estabelecimento está pausada, cancelada ou com pagamento em atraso há mais de 7 dias.
        Os dados continuam guardados. Fale com a equipe para regularizar e liberar o acesso.
      </p>
      <Button asChild className="mt-6">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">Falar com a equipe no WhatsApp</a>
      </Button>
      <Button variant="outline" className="mt-3" onClick={() => { logout?.(); window.location.assign('/login'); }}>
        Sair
      </Button>
    </main>
  );
}
