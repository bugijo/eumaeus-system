import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DownloadsSection } from '@/components/downloads/DownloadsSection';
import { ProductMock } from '@/components/landing/ProductMock';

const PAINS = [
  { title: 'Aluguel e energia divididos na mão', text: 'Cada conta compartilhada vira uma conversa e uma planilha. Aqui, você lança uma vez e o sistema divide entre a clínica e o pet shop.' },
  { title: 'Estoque que vence sem aviso', text: 'Ração, vacina e remédio com validade próxima aparecem na tela antes de estragar ou vencer no balcão.' },
  { title: 'Contador pedindo planilha no fim do mês', text: 'O financeiro sai separado por unidade e em PDF, pronto para o contador conferir.' },
];

const MODULES = [
  {
    eyebrow: 'Atendimento',
    title: 'Agenda, prontuário e receitas no mesmo lugar',
    text: 'A recepção marca o horário, o veterinário abre o histórico do pet e a receita sai impressa. Nada precisa ser copiado de um sistema para outro.',
    points: ['Agenda do dia com tutor e pet', 'Histórico de vacinas do pet', 'Receita impressa a partir do atendimento'],
  },
  {
    eyebrow: 'Caixa',
    title: 'Venda em segundos, com leitor de código de barras',
    text: 'Bipe o produto com leitor USB ou com a câmera do celular. O carrinho soma, aplica desconto, divide o pagamento e calcula o troco.',
    points: ['Leitor USB ou câmera do celular', 'Dinheiro, Pix e cartão no mesmo pagamento', 'Venda cancelada devolve o produto ao estoque'],
  },
  {
    eyebrow: 'Estoque',
    title: 'Saldo, validade e baixa automática',
    text: 'Cada venda e cada atendimento dão baixa no produto. Os lotes com vencimento mais próximo saem primeiro.',
    points: ['Alerta de estoque baixo', 'Lotes com validade e saída por vencimento', 'Histórico de cada movimentação'],
  },
  {
    eyebrow: 'Financeiro',
    title: 'Resultado de cada unidade e relatório para o contador',
    text: 'Receitas, despesas e vendas aparecem separadas por clínica e por pet shop. O relatório sai em PDF para o contador.',
    points: ['Rateio de contas compartilhadas', 'Resultado por unidade', 'Relatório em PDF'],
  },
];

const STEPS = [
  { title: 'Cadastre o estabelecimento', text: 'Nome, CNPJ, horário e as unidades que dividem contas.' },
  { title: 'Convide a equipe', text: 'Cada pessoa entra com o próprio login e vê só o que o cargo permite.' },
  { title: 'Comece a atender', text: 'Agenda, caixa e estoque funcionam desde o primeiro dia.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="text-base font-semibold tracking-tight">Eumaeus</span>
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-6">
            <a href="#modulos" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline">Módulos</a>
            <a href="#aplicativos" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline">Aplicativos</a>
            <Button asChild size="sm" className="active:scale-[0.97] transition-transform duration-150 ease-out">
              <Link to="/login">Entrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Primeira dobra: o produto aparece já na primeira tela */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:pb-28 lg:pt-20">
          <div className="landing-enter space-y-7">
            <p className="text-sm font-medium text-secondary">Para clínica veterinária e pet shop</p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Agenda, caixa e financeiro da clínica e do pet shop em um só sistema.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Cada unidade com o seu resultado, o aluguel dividido sem planilha e o relatório pronto para o contador no fim do mês.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base active:scale-[0.97] transition-transform duration-150 ease-out">
                <Link to="/login">Entrar no sistema</Link>
              </Button>
              <a href="#modulos" className="inline-flex h-12 items-center rounded-md px-4 text-base font-medium text-primary underline-offset-4 transition-colors hover:underline">
                Ver os módulos
              </a>
            </div>
          </div>
          <div className="landing-enter landing-enter-delay">
            <ProductMock />
          </div>
        </section>

        {/* Problemas que o sistema resolve */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-3">
            {PAINS.map((pain) => (
              <div key={pain.title} className="space-y-2">
                <h2 className="text-lg font-semibold">{pain.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{pain.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Módulos, alternados, sem ícones decorativos */}
        <section id="modulos" className="mx-auto max-w-6xl space-y-24 px-5 py-24 sm:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo o que a rotina da clínica e do pet shop usa.</h2>
            <p className="text-muted-foreground">Os módulos conversam entre si. Uma venda dá baixa no estoque, e a conta dividida aparece no resultado de cada unidade.</p>
          </div>
          {MODULES.map((module, index) => (
            <article key={module.title} className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${index % 2 === 1 ? 'lg:[&>div:first-child]:order-2' : ''}`}>
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-secondary">{module.eyebrow}</p>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{module.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{module.text}</p>
                <ul className="space-y-2 pt-2">
                  {module.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm">
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="mb-3 text-xs text-muted-foreground">Exemplo ilustrativo, com dados fictícios.</p>
                <ModuleSketch name={module.eyebrow} />
              </div>
            </article>
          ))}
        </section>

        {/* Como começar */}
        <section className="bg-card border-y border-border">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Do cadastro ao primeiro atendimento, em um dia.</h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="space-y-3 border-t border-border pt-6">
                  <span className="text-sm font-semibold tabular-nums text-secondary">0{index + 1}</span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="aplicativos" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <DownloadsSection />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:flex-row sm:items-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Já tem acesso?</h2>
              <p className="text-primary-foreground/85">Entre com o seu e-mail e continue de onde parou.</p>
            </div>
            <Button asChild size="lg" className="h-12 bg-white px-6 text-base text-primary hover:bg-white/90 active:scale-[0.97] transition-transform duration-150 ease-out">
              <Link to="/login">Entrar no sistema</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Eumaeus</span>
          <span>Dados separados por estabelecimento.</span>
        </div>
      </footer>
    </div>
  );
}

/** Esboço dos módulos: linhas do próprio sistema, sem ilustração genérica. */
function ModuleSketch({ name }: { name: string }) {
  const rows: Record<string, string[]> = {
    Atendimento: ['09:00  Consulta  ·  Thor', '10:30  Banho e tosa  ·  Mel', '14:00  Vacina V10  ·  Nina'],
    Caixa: ['Ração Premium 1 kg  ·  R$ 49,90', 'Petisco Bifinho  ·  R$ 9,50', 'Total  R$ 59,40  ·  Pix'],
    Estoque: ['Ração Premium 1 kg  ·  12 un.  ·  vence em 40 dias', 'Vacina V10  ·  3 un.  ·  estoque baixo', 'Shampoo neutro  ·  0 un.'],
    Financeiro: ['Aluguel  ·  R$ 1.500  Clínica', 'Aluguel  ·  R$ 1.500  Pet Shop', 'Resultado do mês  ·  por unidade'],
  };
  return (
    <ul className="divide-y divide-border text-sm">
      {(rows[name] ?? []).map((row) => (
        <li key={row} className="py-3 tabular-nums text-foreground/85">{row}</li>
      ))}
    </ul>
  );
}
