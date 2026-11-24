/**
 * Central de ajuda: fonte única dos artigos. A tela de ajuda lê daqui (GET /api/help/articles)
 * e o assistente usa o mesmo texto como base, para não responder nada que não esteja escrito.
 * Formato do corpo: parágrafos separados por linha em branco; linhas com "- " viram lista e "1. " viram passos.
 */
export interface HelpArticle {
  id: string;
  title: string;
  category: 'Primeiros passos' | 'Dia a dia' | 'Atendimento' | 'Gestão' | 'Conta e acessos';
  /** Telas onde o artigo aparece primeiro no botão de ajuda. */
  paths: string[];
  keywords: string[];
  body: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros passos no Eumaeus',
    category: 'Primeiros passos',
    paths: ['/'],
    keywords: ['começar', 'início', 'configurar', 'implantação', 'tutorial'],
    body: `Uma ordem simples para deixar o sistema pronto no primeiro dia:

1. Em Configurações, aba Estabelecimento, confira nome, endereço e documento do estabelecimento.
2. Na aba Serviços, cadastre os serviços que você oferece (consulta, vacina, banho, tosa), com duração e preço. A agenda usa essa lista.
3. Na aba Equipe e acessos, crie um acesso para cada funcionário. Cada pessoa entra com o próprio e-mail e senha.
4. Em Estoque, cadastre os produtos. Para medicamentos, use a busca no catálogo para preencher nome e categoria mais rápido.
5. Em Tutores, cadastre os clientes e os pets de cada um.

Depois disso já dá para agendar, atender e vender no Caixa. Para rever o tour da tela, use o botão de ajuda (?) no topo e escolha Rever tutorial.`,
  },
  {
    id: 'agendar',
    title: 'Como criar um agendamento',
    category: 'Dia a dia',
    paths: ['/agendamentos'],
    keywords: ['agenda', 'marcar', 'consulta', 'banho', 'tosa', 'horário', 'novo agendamento'],
    body: `1. Abra Agendamentos no menu.
2. Clique em Novo Agendamento.
3. Escolha o pet (o tutor vem junto), o serviço, a data e o horário.
4. Confirme o agendamento.

O serviço precisa estar cadastrado em Configurações, aba Serviços. Se a lista de serviços estiver vazia, cadastre-os primeiro.

Na lista, cada agendamento mostra o serviço e o nome do pet. Pelo próprio agendamento você atualiza o status (por exemplo, confirmado, em atendimento, concluído ou cancelado).`,
  },
  {
    id: 'lembretes',
    title: 'Lembretes para os tutores',
    category: 'Dia a dia',
    paths: ['/configuracoes'],
    keywords: ['lembrete', 'aviso', 'mensagem', 'whatsapp', 'e-mail', 'notificação'],
    body: `Em Configurações, aba Lembretes, você vê o envio diário de lembretes por e-mail e pode editar o modelo da mensagem.

O envio automático por WhatsApp ainda não está disponível. Quando estiver, será um serviço opcional, ativado pelo próprio estabelecimento.`,
  },
  {
    id: 'caixa-venda',
    title: 'Como fazer uma venda no Caixa',
    category: 'Dia a dia',
    paths: ['/caixa'],
    keywords: ['venda', 'pdv', 'caixa', 'vender', 'código de barras', 'bipar', 'pagamento', 'troco', 'pix', 'cartão', 'dinheiro', 'finalizar venda'],
    body: `1. Abra Caixa no menu.
2. Bipe o código de barras do produto, digite o código ou busque pelo nome. Pelo celular, use o botão da câmera para ler o código.
3. Ajuste a quantidade e, se precisar, o desconto.
4. Em Pagamento, escolha a forma: Dinheiro, PIX, Débito ou Crédito. Dá para combinar mais de uma forma na mesma venda.
5. Clique em Finalizar venda.

O estoque dos produtos baixa sozinho. O troco só é permitido quando há pagamento em dinheiro. Depois da venda você pode imprimir o comprovante.

O comprovante não tem valor fiscal. A emissão de nota fiscal ainda não está disponível no sistema.`,
  },
  {
    id: 'caixa-cancelar',
    title: 'Cancelar uma venda',
    category: 'Dia a dia',
    paths: ['/caixa'],
    keywords: ['cancelar', 'estornar', 'devolver', 'venda errada', 'desfazer'],
    body: `Na lista de vendas do dia, no Caixa, clique em Cancelar na venda desejada e informe o motivo.

O estoque dos itens volta automaticamente. A venda continua no histórico, marcada como cancelada, para manter o registro de quem fez o quê.`,
  },
  {
    id: 'tutores-pets',
    title: 'Cadastrar tutores e pets',
    category: 'Atendimento',
    paths: ['/tutores', '/pets'],
    keywords: ['cliente', 'tutor', 'dono', 'pet', 'animal', 'cadastro', 'novo pet', 'adicionar pet'],
    body: `1. Abra Tutores e cadastre o tutor com nome e contato.
2. Na página do tutor, use Adicionar Pet para cadastrar cada animal.

Também é possível ver todos os animais em Pets. Pela ficha do pet você chega ao prontuário dele.`,
  },
  {
    id: 'prontuario',
    title: 'Registrar um atendimento no prontuário',
    category: 'Atendimento',
    paths: ['/prontuario'],
    keywords: ['prontuário', 'consulta', 'atendimento', 'histórico', 'diagnóstico', 'evolução', 'produtos usados', 'medicamento aplicado'],
    body: `1. Abra Prontuários e escolha o pet (ou entre pela ficha do pet, em Ver Prontuário).
2. Registre queixa, diagnóstico e tratamento.
3. Em produtos usados, escolha os itens do estoque aplicados no atendimento e a quantidade. O estoque baixa sozinho ao salvar.

O histórico do pet mostra os atendimentos anteriores, com o que foi aplicado em cada um. Você também pode baixar o prontuário em PDF.`,
  },
  {
    id: 'receita',
    title: 'Receitas (receituário)',
    category: 'Atendimento',
    paths: ['/prontuario'],
    keywords: ['receita', 'prescrição', 'receituário', 'imprimir receita', 'crmv', 'assinatura'],
    body: `A emissão de receitas pelo sistema está em desenvolvimento.

Quando estiver disponível, só usuários com CRMV cadastrado poderão emitir receitas, com impressão pronta para assinatura.`,
  },
  {
    id: 'internacao',
    title: 'Internação e cirurgia',
    category: 'Atendimento',
    paths: ['/assistencia'],
    keywords: ['internação', 'internar', 'cirurgia', 'alta', 'checklist', 'prescrição', 'evolução', 'consentimento'],
    body: `Em Internação e cirurgia você admite um paciente ou planeja uma cirurgia (Nova admissão ou planejamento).

Durante a internação dá para registrar prescrições, tarefas e a execução de cada uma, evoluções, orientações, checklists e o consentimento do tutor. Ao final, registre a alta.

Esse módulo faz parte dos planos com clínica.`,
  },
  {
    id: 'especialistas',
    title: 'Especialistas',
    category: 'Atendimento',
    paths: ['/especialistas'],
    keywords: ['especialista', 'volante', 'parceiro', 'veterinário externo'],
    body: `Em Especialistas você cadastra profissionais que atendem no estabelecimento (Novo especialista) e os associa a agendamentos.`,
  },
  {
    id: 'estoque',
    title: 'Cadastrar produtos e controlar o estoque',
    category: 'Gestão',
    paths: ['/estoque'],
    keywords: ['estoque', 'produto', 'cadastrar produto', 'medicamento', 'vacina', 'catálogo', 'código de barras', 'estoque baixo', 'entrada'],
    body: `1. Abra Estoque e clique em Novo produto.
2. Para medicamentos, vacinas e materiais, use Buscar no catálogo: escolher um item preenche nome e categoria. Confira a apresentação do produto que você comprou.
3. Informe quantidade, preço de custo, preço de venda e, se tiver, o código de barras.
4. Salve.

A lista mostra o que está em estoque, com estoque baixo ou sem estoque. Vendas no Caixa e produtos usados no prontuário baixam o estoque automaticamente.`,
  },
  {
    id: 'financeiro',
    title: 'Financeiro: vendas, despesas e saldo',
    category: 'Gestão',
    paths: ['/financeiro'],
    keywords: ['financeiro', 'despesa', 'receita', 'saldo', 'faturamento', 'contador', 'csv', 'pdf', 'centro de resultado', 'rateio'],
    body: `O Painel Financeiro mostra as vendas do caixa no mês, as despesas do mês e o saldo.

- Registrar despesa: informe descrição, valor e justificativa.
- Centros de resultado separam clínica e pet shop. Uma despesa pode ser dividida entre eles (rateio).
- Preparar para o contador: baixe o resumo em CSV ou PDF.

Recebimentos de faturas podem ser registrados e, se preciso, estornados com justificativa.`,
  },
  {
    id: 'operacao',
    title: 'Pacotes e operação',
    category: 'Gestão',
    paths: ['/operacao'],
    keywords: ['pacote', 'sessões', 'contrato', 'plano de banho', 'mensal'],
    body: `Em Operação você cria pacotes de serviço (por exemplo, banhos mensais), contrata um pacote para o tutor e acompanha as sessões usadas.`,
  },
  {
    id: 'equipe-acessos',
    title: 'Criar acesso para funcionários',
    category: 'Conta e acessos',
    paths: ['/configuracoes'],
    keywords: ['funcionário', 'usuário', 'acesso', 'senha', 'permissão', 'equipe', 'novo acesso', 'cargo', 'bloquear'],
    body: `1. Abra Configurações, aba Equipe e acessos.
2. Clique em Novo acesso.
3. Informe nome, e-mail, cargo e uma senha inicial.
4. Em Acessos, escolha os módulos que a pessoa pode usar (ou deixe o acesso total do cargo).

A mudança de acessos vale na hora. Para trocar a senha de um funcionário, use Redefinir senha. Cada pessoa deve ter o próprio login: assim o sistema registra quem fez cada venda e cada atendimento.`,
  },
  {
    id: 'minha-conta',
    title: 'Trocar minha senha',
    category: 'Conta e acessos',
    paths: ['/configuracoes'],
    keywords: ['senha', 'trocar senha', 'minha conta', 'e-mail'],
    body: `Clique no seu avatar no canto superior direito e escolha Minha conta. Informe a nova senha e confirme em Salvar senha.

Se esqueceu a senha, peça ao responsável pelo estabelecimento para redefini-la em Equipe e acessos.`,
  },
  {
    id: 'plano',
    title: 'Planos e módulos',
    category: 'Conta e acessos',
    paths: ['/configuracoes'],
    keywords: ['plano', 'módulo', 'assinatura', 'pet shop', 'clínica', 'tela bloqueada', 'sem acesso'],
    body: `O plano do estabelecimento define os módulos disponíveis: Pet Shop, Clínica ou Clínica + Pet Shop.

Se aparecer a mensagem "Esta tela não faz parte do seu acesso", a tela não está no seu plano ou não foi liberada para o seu usuário. Peça ao responsável para liberar em Configurações, aba Equipe e acessos.`,
  },
  {
    id: 'nota-fiscal',
    title: 'Nota fiscal',
    category: 'Gestão',
    paths: ['/caixa', '/financeiro'],
    keywords: ['nota fiscal', 'nfe', 'nfc-e', 'nfs-e', 'cupom fiscal', 'xml', 'fiscal'],
    body: `A emissão de nota fiscal ainda não está disponível no Eumaeus. O comprovante de venda do Caixa não tem valor fiscal.

A importação de XML de nota de compra também está em desenvolvimento.`,
  },
  {
    id: 'suporte',
    title: 'Falar com o suporte',
    category: 'Primeiros passos',
    paths: [],
    keywords: ['suporte', 'ajuda', 'contato', 'problema', 'erro', 'bug'],
    body: `Antes de chamar o suporte, procure a resposta nesta central ou pergunte ao assistente no botão de ajuda (?).

Se não resolver, descreva o que tentou fazer, em qual tela e a mensagem que apareceu. Um print da tela ajuda muito.`,
  },
];
