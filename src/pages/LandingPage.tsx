import { Link } from 'react-router-dom';
import { Archive, BarChart3, CalendarDays, Dog, FileText, ScanBarcode, ShoppingCart, Stethoscope, Store, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DownloadsSection } from '@/components/downloads/DownloadsSection';

const FEATURES = [
  { icon: CalendarDays, title: 'Agenda do dia', text: 'Consultas, banho e tosa e internações em um só calendário, com lembretes para o tutor.' },
  { icon: Stethoscope, title: 'Prontuário e receitas', text: 'Histórico clínico do pet, vacinas, receitas para impressão e internação.' },
  { icon: ShoppingCart, title: 'Caixa com leitor', text: 'Bipe o código de barras com leitor USB ou com a câmera do celular. Dinheiro, Pix e cartão, com troco.' },
  { icon: Archive, title: 'Estoque com validade', text: 'Alerta de estoque baixo e de vencimento, com baixa automática nas vendas e nos atendimentos.' },
  { icon: BarChart3, title: 'Financeiro e contador', text: 'Receitas, despesas e resultado por unidade. Relatório em PDF pronto para o contador.' },
  { icon: Store, title: 'Clínica e pet shop juntos', text: 'Duas unidades no mesmo cadastro, com divisão automática de contas como aluguel, energia e água.' },
  { icon: Users, title: 'Equipe com permissões', text: 'Cada pessoa tem o próprio login e vê só o que o cargo permite.' },
  { icon: ScanBarcode, title: 'Funciona no computador e no celular', text: 'Acesse pelo navegador ou instale como aplicativo, sem perder dados entre aparelhos.' },
];

const STEPS = [
  'Cadastre o estabelecimento, a equipe e os produtos.',
  'Abra a agenda e o caixa e comece a atender.',
  'No fim do mês, exporte o relatório para o contador.',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-9 w-9 object-contain" />
            <span className="font-semibold tracking-tight">Eumaeus</span>
          </div>
          <nav className="flex items-center gap-2">
            <a href="#recursos" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Recursos</a>
            <a href="#downloads" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Aplicativos</a>
            <Button asChild size="sm"><Link to="/login">Entrar</Link></Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-emerald-700 text-primary-foreground">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="flex flex-col justify-center">
              <p className="mb-4 w-fit rounded-full bg-white/15 px-3 py-1 text-sm">Gestão para clínica veterinária e pet shop</p>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Sua clínica e seu pet shop, organizados em um só sistema.</h1>
              <p className="mt-5 max-w-xl text-lg text-primary-foreground/90">Agenda, prontuário, caixa, estoque e financeiro. Você vê o resultado de cada unidade e manda o relatório para o contador sem planilha.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90"><Link to="/login">Entrar no sistema</Link></Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"><a href="#downloads">Baixar aplicativo</a></Button>
              </div>
            </div>
            <div className="hidden items-center justify-center lg:flex">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 text-foreground shadow-2xl">
                <p className="text-sm font-medium text-muted-foreground">Hoje</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {['09:00 · Consulta · Clínica', '10:30 · Banho e tosa · Pet Shop', '14:00 · Vacina · Clínica'].map((item) => (
                    <li key={item} className="rounded-lg border bg-muted/40 px-4 py-3">{item}</li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3 text-sm">
                  <span>Caixa do pet shop</span><span className="font-semibold text-primary">Venda com leitor de código</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold">Tudo o que a rotina pede</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Feito para quem atende pets todos os dias e precisa fechar as contas no fim do mês.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/40 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold">Como começar</h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step} className="rounded-xl border bg-card p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
                  <p className="mt-3 text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="downloads" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <DownloadsSection />
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground">
            <FileText className="h-8 w-8" aria-hidden />
            <h2 className="text-2xl font-bold">Já tem acesso?</h2>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90"><Link to="/login">Entrar no sistema</Link></Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Dog className="h-3.5 w-3.5" aria-hidden />© {new Date().getFullYear()} Eumaeus · Dados protegidos e separados por estabelecimento</div>
        </section>
      </main>
    </div>
  );
}
