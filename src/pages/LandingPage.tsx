import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { DOWNLOAD_ITEMS } from '@/components/downloads/DownloadsSection';
import { AppFrame } from '@/components/landing/AppFrame';
import { Screen } from '@/components/landing/Screen';
import { MEDICATION_CATALOG } from '@/data/medicationCatalog';

const MAIN_ACTION = 'Entrar no sistema';

// Vendas e suporte atendidos pelo mesmo WhatsApp (DDI 55 + DDD 16).
const SALES_WHATSAPP = '5516991702781';

function whatsappLink(message: string) {
  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

const BTN_PRIMARY = 'lp-press inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:bg-primary/90';
const BTN_SECONDARY = 'lp-press lp-link inline-flex h-12 items-center justify-center rounded-xl px-5 text-[15px] font-medium text-primary ring-1 ring-inset ring-primary/25 hover:bg-primary/5';

type Tour = { id: string; title: string; text: string[]; shot: string; alt: string; height?: number };

const TOUR: Tour[] = [
  {
    id: 'inicio', title: 'A página inicial mostra o seu dia',
    text: ['Ao entrar, você vê os próximos agendamentos, o que a equipe acabou de fazer e as pendências que pedem atenção hoje.', 'Os atalhos para agendar, abrir o caixa, cadastrar tutor e cadastrar produto ficam no topo.'],
    shot: 'inicio', alt: 'Página inicial do Eumaeus com totais, próximos agendamentos e feed de atividades',
  },
  {
    id: 'agenda', title: 'Consultas, vacinas e banho e tosa na mesma agenda',
    text: ['Veja o mês, a semana ou o dia. Cada horário mostra o serviço e o nome do pet.', 'A cor diz em que pé está o atendimento: agendado, confirmado, chegou, em atendimento, pet pronto ou finalizado.'],
    shot: 'agenda', alt: 'Agenda semanal com consultas, vacinas, castração e banho e tosa',
  },
  {
    id: 'prontuario', title: 'Prontuário com os medicamentos aplicados',
    text: ['A veterinária registra sintomas, diagnóstico e tratamento, e escolhe no estoque o que aplicou no atendimento.', 'Ao salvar, esses itens saem do estoque sozinhos. O histórico do pet guarda cada atendimento com o que foi usado.', 'Vacina registrada com a data da próxima dose entra na lista de lembretes ao tutor.'],
    shot: 'prontuario', alt: 'Prontuário do pet com nova evolução, medicamento aplicado e histórico clínico', height: 1335,
  },
  {
    id: 'estoque', title: 'Estoque por lote e validade',
    text: ['Entrada por lote com validade e motivo. Ajuste, perda e devolução sempre com justificativa.', 'O painel avisa o que está com estoque baixo e o que vence nos próximos 30 dias.'],
    shot: 'estoque', alt: 'Gestão de estoque com totais, entrada por lote e lista de produtos', height: 1353,
  },
  {
    id: 'catalogo', title: `${MEDICATION_CATALOG.length} medicamentos, vacinas e materiais já cadastrados`,
    text: ['Para cadastrar um produto, digite parte do nome e escolha no catálogo: o nome e a categoria já vêm preenchidos.', 'Depois é só conferir a apresentação, informar quantidade, custo e preço de venda.'],
    shot: 'catalogo', alt: 'Cadastro de produto com busca no catálogo de vacinas',
  },
  {
    id: 'caixa', title: 'Caixa: bipou, recebeu, baixou do estoque',
    text: ['Leitor USB ou câmera do celular. Dinheiro, PIX, débito e crédito na mesma venda, com troco calculado e cupom para imprimir.', 'Cada venda dá baixa no estoque e aparece em "Vendas de hoje". Cancelar exige permissão.'],
    shot: 'caixa', alt: 'Tela do caixa com carrinho, formas de pagamento e vendas do dia',
  },
  {
    id: 'financeiro', title: 'Financeiro do mês e relatório para o contador',
    text: ['Vendas do caixa, despesas e saldo do mês. Faturas de atendimento com recebimento e estorno.', 'O relatório em PDF leva vendas e despesas do período para o contador.'],
    shot: 'financeiro', alt: 'Painel financeiro com vendas do mês, despesas e saldo',
  },
  {
    id: 'equipe', title: 'Você decide o que cada funcionário vê',
    text: ['Cada pessoa entra com o próprio login. O cargo já traz um padrão: banho e tosa vê agenda, estoque e caixa; a recepção também dá entrada no estoque.', 'Para mudar, marque e desmarque as telas de cada pessoa. A mudança vale na hora.'],
    shot: 'acessos', alt: 'Janela de acessos de uma funcionária de banho e tosa com as telas marcadas',
  },
];

/** Proposta de preços: precisa da aprovação do dono do produto antes de publicar. */
const PLANS = [
  {
    name: 'Pet Shop', price: 99, note: 'Para banho e tosa e loja.',
    items: ['Agenda de banho e tosa e serviços', 'Tutores e pets', 'Caixa com leitor de código de barras', 'Estoque por lote e validade', 'Financeiro e relatório para o contador', 'Lembretes aos tutores', 'Acessos por funcionário'],
  },
  {
    name: 'Clínica', price: 149, note: 'Para a clínica veterinária.',
    items: ['Tudo do dia a dia: agenda, tutores, caixa e estoque', 'Prontuário com medicamentos aplicados', 'Receitas e vacinas', 'Internação e cirurgia', 'Especialistas', 'Financeiro e relatório para o contador', 'Acessos por funcionário'],
  },
  {
    name: 'Clínica + Pet Shop', price: 199, note: 'Os dois negócios no mesmo sistema.', featured: true,
    items: ['Tudo do plano Clínica', 'Tudo do plano Pet Shop', 'Contas separadas por unidade ou tudo junto, você escolhe', 'Aluguel e energia divididos entre as unidades pela regra que você cadastrar'],
  },
];

const QUESTIONS = [
  { q: 'Preciso instalar alguma coisa?', a: 'Não. O Eumaeus funciona no navegador do computador, do tablet e do celular. Pelo Chrome ou pelo Safari dá para fixar o sistema na tela inicial.' },
  { q: 'Sou veterinária e dona do pet shop. Preciso separar as contas?', a: 'Não precisa. No plano Clínica + Pet Shop você escolhe: contas separadas por unidade, com o resultado de cada uma, ou tudo num caixa e num financeiro só, como uma empresa única. Dá para mudar depois nas configurações.' },
  { q: 'O que acontece com as telas que não estão no meu plano?', a: 'Elas não aparecem para ninguém do estabelecimento. Quem contrata o plano Pet Shop, por exemplo, não vê prontuário nem internação.' },
  { q: 'Funciona com leitor de código de barras?', a: 'Funciona com leitor USB, que se comporta como teclado, e com a câmera do celular.' },
  { q: 'Emite nota fiscal?', a: 'Ainda não. A emissão de NFC-e e NFS-e está em desenvolvimento. Hoje o relatório em PDF leva vendas e despesas para o contador.' },
  { q: 'Outro estabelecimento consegue ver os meus dados?', a: 'Não. Cada estabelecimento tem os próprios dados, e cada pessoa da equipe vê só as telas que você liberou.' },
];

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

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
            <a href="#telas" className="lp-link hidden rounded-lg px-3 py-2 text-sm text-foreground/75 md:inline-block">Telas</a>
            <a href="#planos" className="lp-link hidden rounded-lg px-3 py-2 text-sm text-foreground/75 md:inline-block">Planos</a>
            <a href="#perguntas" className="lp-link hidden rounded-lg px-3 py-2 text-sm text-foreground/75 md:inline-block">Perguntas</a>
            <a href={whatsappLink('Olá! Quero falar com o time de vendas do Eumaeus.')} target="_blank" rel="noopener noreferrer" className="lp-press lp-link ml-2 hidden h-10 items-center rounded-xl px-4 text-sm font-medium text-primary ring-1 ring-inset ring-primary/25 hover:bg-primary/5 sm:inline-flex">
              Falar com vendas
            </a>
            <Link to="/login" className="lp-press ml-2 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              {MAIN_ACTION}
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        {/* Primeira tela: categoria, comprador e o caixa interativo */}
        <section id="topo" className="overflow-hidden pt-14 sm:pt-20">
          <div className="lp-wrap">
            <div className="lp-enter max-w-[46rem]">
              <h1 className="lp-h1 text-[2.4rem] font-semibold leading-[1.06] sm:text-[3.4rem] lg:text-[4rem]">
                Sistema de gestão para clínica veterinária e pet shop
              </h1>
              <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-foreground/70">
                Agenda, prontuário com os medicamentos aplicados, estoque que baixa sozinho, caixa com leitor de código de barras e financeiro. Direto no navegador.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href={whatsappLink('Olá! Quero contratar o Eumaeus.')} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
                  Contratar
                </a>
                <a href="#telas" className={BTN_SECONDARY}>
                  Ver as telas do sistema
                </a>
                <a href={whatsappLink('Olá! Quero falar com o time de vendas do Eumaeus.')} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
                  Falar com vendas
                </a>
              </div>
            </div>
            <div className="lp-enter lp-enter-2 mt-14 sm:mt-16">
              <AppFrame />
            </div>
          </div>
        </section>

        {/* Telas reais do sistema, uma por função */}
        <section id="telas" className="py-24 sm:py-32">
          <div className="lp-wrap">
            <h2 className="lp-h2 max-w-[42rem] text-[2rem] font-semibold leading-[1.1] sm:text-[2.75rem]">
              Do agendamento ao caixa, sem copiar dado de um lugar para outro
            </h2>
            <p className="mt-4 max-w-[38rem] text-lg leading-relaxed text-foreground/70">
              O medicamento aplicado no atendimento sai do estoque. A venda do caixa entra no financeiro. As imagens abaixo são telas do sistema com dados de exemplo.
            </p>
            <div className="mt-16 space-y-24 sm:space-y-32">
              {TOUR.map((item, index) => (
                <article key={item.id} id={`tela-${item.id}`} className={`grid items-center gap-8 lg:gap-14 ${index % 2 ? 'lg:grid-cols-[1.4fr_0.85fr]' : 'lg:grid-cols-[0.85fr_1.4fr]'}`}>
                  <div className={index % 2 ? 'lg:order-2' : ''}>
                    <h3 className="lp-h2 text-[1.5rem] font-semibold leading-[1.15] sm:text-[1.85rem]">{item.title}</h3>
                    {item.text.map((paragraph) => (
                      <p key={paragraph} className="mt-4 max-w-[30rem] leading-relaxed text-foreground/70">{paragraph}</p>
                    ))}
                  </div>
                  <Screen src={item.shot} alt={item.alt} height={item.height} className={index % 2 ? 'lg:order-1' : ''} />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="border-t border-border bg-card py-24 sm:py-32">
          <div className="lp-wrap">
            <h2 className="lp-h2 max-w-[40rem] text-[2rem] font-semibold leading-[1.1] sm:text-[2.75rem]">Contrate só o que o seu negócio usa</h2>
            <p className="mt-4 max-w-[38rem] text-lg leading-relaxed text-foreground/70">
              As telas fora do plano não aparecem para ninguém da equipe. Mensalidade por estabelecimento.
            </p>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <article key={plan.name} className={`flex flex-col rounded-2xl border p-7 ${plan.featured ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className={`mt-1 text-sm ${plan.featured ? 'text-primary-foreground/75' : 'text-foreground/60'}`}>{plan.note}</p>
                  <p className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">{brl(plan.price)}</span>
                    <span className={plan.featured ? 'text-primary-foreground/75' : 'text-foreground/60'}>/mês</span>
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[15px]">
                    {plan.items.map((feature) => (
                      <li key={feature} className="flex gap-2.5">
                        <Check aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? 'text-primary-foreground' : 'text-secondary'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={whatsappLink(`Olá! Quero contratar o plano ${plan.name} do Eumaeus.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl text-[15px] font-semibold ${plan.featured ? 'lp-press bg-white text-primary hover:bg-white/90' : BTN_PRIMARY}`}
                  >
                    Contratar {plan.name}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="perguntas" className="py-24 sm:py-32">
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={whatsappLink('Olá! Quero contratar o Eumaeus.')} target="_blank" rel="noopener noreferrer" className="lp-press inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-[15px] font-semibold text-primary hover:bg-white/90">
                Contratar
              </a>
              <a href={whatsappLink('Olá! Quero falar com o time de vendas do Eumaeus.')} target="_blank" rel="noopener noreferrer" className="lp-press inline-flex h-12 items-center justify-center rounded-xl px-6 text-[15px] font-medium text-primary-foreground ring-1 ring-inset ring-primary-foreground/40 hover:bg-primary-foreground/10">
                Falar com vendas
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-wrap flex flex-col gap-2 py-8 text-sm text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} Eumaeus</span>
        <span>As telas desta página usam dados de exemplo.</span>
        <a href={whatsappLink('Olá! Preciso de suporte no Eumaeus.')} target="_blank" rel="noopener noreferrer" className="lp-link rounded-md">Suporte pelo WhatsApp</a>
      </footer>
    </div>
  );
}
