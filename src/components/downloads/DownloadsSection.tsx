import type React from 'react';
import { Apple, Monitor, Smartphone, Globe, Terminal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Item = { icon: React.ElementType; title: string; detail: string; status: 'disponivel' | 'em-breve'; href?: string; cta?: string };

// Instaladores publicados em GitHub Releases (último release). Os nomes fixos vêm do workflow installers.yml.
const RELEASES = 'https://github.com/bugijo/eumaeus-system/releases/latest/download';
// Só vira true depois de o release existir com os arquivos; antes disso o link não pode aparecer.
const INSTALLERS_PUBLISHED = true;
const installer = (file: string) => (INSTALLERS_PUBLISHED ? { status: 'disponivel' as const, href: `${RELEASES}/${file}`, cta: 'Baixar' } : { status: 'em-breve' as const });

/**
 * Downloads. Enquanto o app nativo não for publicado, o caminho que já funciona é
 * instalar pelo navegador (PWA). Os demais aparecem como "em breve" para não levar a link quebrado.
 */
export const DOWNLOAD_ITEMS: Item[] = [
  { icon: Globe, title: 'Navegador (todos os aparelhos)', detail: 'Use direto no endereço do sistema. Não precisa instalar nada.', status: 'disponivel', href: '/login', cta: 'Abrir o sistema' },
  { icon: Smartphone, title: 'Android', detail: 'Pelo Chrome, toque em "Instalar aplicativo" no menu. APK em breve.', status: 'em-breve' },
  { icon: Apple, title: 'iPhone e iPad', detail: 'Pelo Safari: Compartilhar → "Adicionar à Tela de Início". App na App Store em breve.', status: 'em-breve' },
  { icon: Monitor, title: 'Windows', detail: 'Instalador .exe. Pelo Chrome ou Edge, use "Instalar Eumaeus" no endereço.', ...installer('Eumaeus-windows.exe') },
  { icon: Apple, title: 'macOS', detail: 'Instalador .dmg. Pelo Chrome ou Safari, use "Adicionar ao Dock".', ...installer('Eumaeus-mac.dmg') },
  { icon: Terminal, title: 'Linux', detail: 'Pacote AppImage. Pelo Chrome, use "Instalar Eumaeus" no endereço.', ...installer('Eumaeus-linux.AppImage') },
];

export function DownloadsSection() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Aplicativos</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Mesma conta em todos os aparelhos. Os dados ficam sincronizados.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOWNLOAD_ITEMS.map(({ icon: Icon, title, detail, status, href, cta }) => (
          <Card key={title} className="shadow-sm">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
                <Badge variant={status === 'disponivel' ? 'default' : 'secondary'}>{status === 'disponivel' ? 'Disponível' : 'Em breve'}</Badge>
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="flex-1 text-sm text-muted-foreground">{detail}</p>
              {href && cta && <a href={href} className="text-sm font-medium text-primary hover:underline">{cta} →</a>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
