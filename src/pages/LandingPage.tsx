import { Link } from 'react-router-dom';
import { DOWNLOAD_ITEMS } from '@/components/downloads/DownloadsSection';
import { AppFrame } from '@/components/landing/AppFrame';
import { SplitDemo } from '@/components/landing/SplitDemo';
import { AgendaFragment, PrescriptionFragment, StockFragment, TeamFragment } from '@/components/landing/Fragments';

const MAIN_ACTION = 'Entrar no sistema';

const MODULES = [
  { title: 'Organiza a agenda do dia', text: 'Consultas, banho e tosa e vacinas na mesma lista, com o status de cada atendimento.', fragment: <AgendaFragment /> },
  { title: 'Avisa o que vai vencer', text: 'O lote com vencimento mais próximo sai primeiro, e o estoque baixo aparece antes de faltar no balcão.', fragment: <StockFragment /> },
  { title: 'Imprime a receita do atendimento', text: 'O veterinário preenche no prontuário do pet e imprime na hora.', fragment: <PrescriptionFragment /> },
  { title: 'Libera cada tela pelo cargo', text: 'Cada pessoa entra com o próprio login. A recepção não vê o financeiro.', fragment: <TeamFragment /> },
];

const QUESTIONS = [
  { q: 'Preciso instalar alguma coisa?', a: 'Não. O Eumaeus funciona no navegador do computador, do tablet e do celular. Pelo Chrome ou pelo Safari dá para fixar o sistema na tela inicial.' },
  { q: 'Clínica e pet shop ficam separados?', a: 'Ficam. Cada venda e cada despesa pertencem a uma unidade, e o financeiro mostra o resultado de cada uma. Contas compartilhadas, como aluguel e energia, são divididas pela regra que você cadastrar.' },
  { q: 'Funciona com leitor de código de barras?', a: 'Funciona com leitor USB, que se comporta como teclado, e com a câmera do celular.' },
  { q: 'Emite nota fiscal?', a: 'Ainda não. A emissão de NFC-e e NFS-e está em desenvolvimento. Hoje o relatório em PDF leva vendas e despesas para o contador.' },
  { q: 'Outro estabelecimento consegue ver os meus dados?', a: 'Não. Cada estabelecimento tem os próprios dados, e cada pessoa da equipe vê só as telas do seu cargo.' },
];

function MainAction({ tone = 'primary', className = '' }: { tone?: 'primary' | 'light'; className?: string }) {
  const look = tone === 'light'
    ? 'bg-white text-primary hover:bg-white/90'
    : 'bg-primary text-primary-foreground hover:bg-primary/90';
  return (
    <Link to="/login" className={`lp-press inline-flex h-12 items-center justify-center rounded-xl px-6 text-[15px] font-semibold ${look} ${className}`}>
      {MAIN_ACTION}
    </Link>
  );
}

export default function LandingPage() {
  const year = new Date().getFullYear();
  return (
    <div className="lp min-h-screen bg-background text-foreground">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background">
        <div className="lp-wrap flex h-16 items-center justify-between">
          <a href="#topo" className="flex items-center gap-2.5 rounded-lg">
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="text-[17px] font-semibold tracking-tight">Eumaeus</span>
          </a>
          <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
            <a href="#rateio" className="lp-link hidden rounded-lg px-3 py-2 text-sm text-foreground/75 md:inline-block">Rateio</a>
            <a href="#modulos" className="lp-link hidden rounded-lg px-3 py-2 text-sm text-foreground/75 md:inline-block">Módulos</a>
            <a href="#perguntas" className="lp-link hidden rounded-lg px-3 py-2 text-sm text-foreground/75 md:inline-block">Perguntas</a>
            <Link to="/login" className="lp-press ml-2 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              {MAIN_ACTION}
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        {/* Primeira tela: categoria, comprador e o caixa real em tamanho grande */}
        <section id="topo" className="overflow-hidden pt-14 sm:pt-20">
          <div className="lp-wrap">
            <div className="lp-enter max-w-[46rem]">
              <h1 className="lp-h1 text-[2.4rem] font-semibold leading-[1.06] sm:text-[3.4rem] lg:text-[4rem]">
                Sistema de gestão para clínica veterinária com pet shop
              </h1>
              <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-foreground/70">
                Agenda, prontuário, caixa com leitor de código de barras, estoque por validade e o financeiro de cada unidade, direto no navegador.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <MainAction />
                <a href="#modulos" className="lp-press lp-link inline-flex h-12 items-center justify-center rounded-xl px-5 text-[15px] font-medium text-primary ring-1 ring-inset ring-primary/25 hover:bg-primary/5">
                  Ver as telas do sistema
                </a>
              </div>
              <p className="mt-5 text-sm text-foreground/60">Um acesso por estabelecimento: a clínica e o pet shop do mesmo endereço entram juntos.</p>
            </div>
            <div className="lp-enter lp-enter-2 mt-14 sm:mt-16">
              <AppFrame />
            </div>
          </div>
        </section>

        {/* Momento interativo: a divisão de contas, que é o que diferencia o sistema */}
        <section id="rateio" className="mt-24 bg-[hsl(207_72%_13%)] py-24 text-white sm:mt-32 sm:py-32">
          <div className="lp-wrap grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
            <div>
              <h2 className="lp-h2 text-[2rem] font-semibold leading-[1.1] sm:text-[2.75rem]">
                Aluguel, energia e água divididos entre as unidades
              </h2>
              <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-white/75">
                Cadastre a regra uma vez. Cada conta lançada vira uma despesa em cada unidade, e o resultado do mês da clínica e do pet shop sai separado.
              </p>
              <p className="mt-4 text-sm text-white/60">Mova a regra ao lado para ver a conta dividida.</p>
            </div>
            <SplitDemo />
          </div>
        </section>

        <section id="modulos" className="py-24 sm:py-32">
          <div className="lp-wrap">
            <h2 className="lp-h2 max-w-[40rem] text-[2rem] font-semibold leading-[1.1] sm:text-[2.75rem]">
              Agenda, estoque, receitas e acessos da equipe
            </h2>
            <p className="mt-4 max-w-[36rem] text-lg leading-relaxed text-foreground/70">
              Uma venda no caixa dá baixa no estoque. Um atendimento abre o histórico do pet. Ninguém copia dado de um sistema para outro.
            </p>
            <div className="mt-14 grid gap-x-10 gap-y-14 md:grid-cols-2">
              {MODULES.map((module) => (
                <article key={module.title} className="flex flex-col">
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  <p className="mt-1.5 min-h-[3.25rem] max-w-[30rem] leading-relaxed text-foreground/70">{module.text}</p>
                  <div className="mt-5 flex-1 [&>*]:h-full">{module.fragment}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="perguntas" className="border-t border-border bg-card py-24 sm:py-32">
          <div className="lp-wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <h2 className="lp-h2 text-[2rem] font-semibold leading-[1.1] sm:text-[2.75rem]">Perguntas de quem está trocando de sistema</h2>
              <h3 className="mt-10 text-lg font-semibold">Aplicativos</h3>
              <ul className="mt-3 divide-y divide-border text-sm">
                {DOWNLOAD_ITEMS.map((item) => (
                  <li key={item.title} className="flex items-center justify-between gap-4 py-2.5">
                    <span>{item.title}</span>
                    <span className={item.status === 'disponivel' ? 'font-medium text-secondary' : 'text-foreground/55'}>
                      {item.status === 'disponivel' ? 'Disponível' : 'Em breve'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {QUESTIONS.map((item) => (
                <details key={item.q} className="lp-faq group">
                  <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-6 py-4 text-[17px] font-medium">
                    {item.q}
                    <span aria-hidden className="lp-plus relative h-3.5 w-3.5 shrink-0" />
                  </summary>
                  <p className="max-w-[40rem] pb-5 leading-relaxed text-foreground/70">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary py-24 text-primary-foreground sm:py-28">
          <div className="lp-wrap flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <h2 className="lp-h2 max-w-[30rem] text-[2rem] font-semibold leading-[1.1] sm:text-[2.75rem]">Sua clínica e seu pet shop no Eumaeus</h2>
            <MainAction tone="light" />
          </div>
        </section>
      </main>

      <footer className="lp-wrap flex flex-col gap-2 py-8 text-sm text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} Eumaeus</span>
        <span>As telas desta página usam dados de exemplo.</span>
      </footer>
    </div>
  );
}
