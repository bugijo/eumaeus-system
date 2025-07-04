# PulseVet System - Documento de Visão do Produto

## 1. Visão Geral
O PulseVet System é uma **plataforma SaaS (Software as a Service) de gestão completa** para clínicas veterinárias, desenhada para ser moderna, intuitiva e resiliente. O objetivo é oferecer uma solução centralizada e escalável que otimize todas as operações da clínica, do atendimento ao paciente à gestão financeira e fiscal.

## 2. Modelo de Negócio e Arquitetura
O sistema será construído sobre uma **arquitetura Multi-Tenant**, permitindo que múltiplas clínicas utilizem a mesma aplicação de forma segura e com seus dados completamente isolados. O administrador do sistema (Super Admin) terá um painel de controle para gerenciar as clínicas cadastradas na plataforma.

**Nota de Implementação:** A **Versão 1.0** será desenvolvida e validada com um único tenant (clínica) para garantir a robustez do core do sistema. A **refatoração para a arquitetura Multi-Tenant será a principal missão da Versão 2.0**.

## 3. Público-Alvo
Clínicas veterinárias de pequeno e médio porte no Brasil que buscam uma solução digital completa, por assinatura, para modernizar seus processos.

## 4. Módulos Principais (Core V1.0)

### 4.1. Módulo de Atendimento
- **Gestão de Tutores:** Cadastro completo com dados pessoais, histórico e preferências
- **Gestão de Pets:** Ficha completa com dados, fotos, histórico médico e vacinas
- **Agendamentos:** Sistema de agendamento com calendário, notificações e controle de disponibilidade
- **Prontuário Eletrônico:** Registro de consultas, prescrições, exames e evolução clínica

### 4.2. Módulo de Operações
- **Gestão de Usuários:** Sistema de autenticação com diferentes níveis de acesso (veterinário, atendente, admin)
- **Estoque:** Controle de medicamentos, produtos e materiais com alertas de baixo estoque
- **Relatórios:** Dashboards com métricas de atendimento, faturamento e performance

### 4.3. Módulo Fiscal (Futuro)
- **Emissão de NFCe:** Integração com SEFAZ para emissão automática de notas fiscais
- **Controle Financeiro:** Receitas, despesas, fluxo de caixa e conciliação bancária
- **Relatórios Fiscais:** Relatórios para contabilidade e declarações obrigatórias

## 5. Portal do Cliente (Visão V2.0)
- **Site Público Customizável:** Cada clínica na plataforma terá um site template, cuja aparência (logo, cores) e conteúdo (preços, notícias) será gerenciável pelo painel da própria clínica
- **Área do Cliente:** Portal com login para tutores acessarem o histórico dos seus pets e agendarem consultas online
- **Notificações:** Sistema de lembretes via WhatsApp/SMS para consultas e vacinas

## 6. Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **React Query** para gerenciamento de estado servidor
- **React Hook Form** com Zod para validação
- **React Router** para navegação

### Backend
- **Node.js** com TypeScript
- **Express.js** para API REST
- **Prisma ORM** para banco de dados
- **SQLite** (desenvolvimento) / **PostgreSQL** (produção)
- **JWT** para autenticação
- **Bcrypt** para hash de senhas

## 7. Arquitetura do Projeto

### Estrutura de Pastas
```
vet-system-frontend-blitz/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── services/      # Serviços de API
│   ├── types/         # Tipos TypeScript
│   ├── schemas/       # Schemas de validação
│   └── hooks/         # Hooks customizados
├── backend/
│   ├── src/
│   │   ├── controllers/  # Controladores da API
│   │   ├── services/     # Lógica de negócio
│   │   ├── models/       # Modelos Prisma
│   │   └── routes/       # Rotas da API
│   └── prisma/          # Schema e migrações
└── step-by-step/       # Documentação do desenvolvimento
```

## 8. Status do Desenvolvimento

### Concluído ✅
- Configuração inicial do projeto
- Setup do Prisma com SQLite
- Modelos básicos (Tutor, Pet, User)
- CRUD completo de Tutores
- Interface responsiva com Tailwind
- Componentes UI com Shadcn

### Em Desenvolvimento 🔄
- CRUD de Pets
- Sistema de agendamentos

### Próximas Etapas 🔲
- Prontuário eletrônico
- Sistema de autenticação
- Gestão financeira
- Relatórios e dashboards

## 9. Padrões de Desenvolvimento

### Frontend
- Componentes funcionais com hooks
- TypeScript strict mode
- Validação com Zod schemas
- Estado global com React Query
- Roteamento com React Router

### Backend
- Arquitetura MVC
- Separação de responsabilidades
- Validação de dados
- Tratamento de erros centralizado
- Documentação de API

## 10. Ambiente de Desenvolvimento

### Requisitos
- Node.js 18+
- npm ou yarn
- Git

### Comandos Principais
```bash
# Frontend
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build

# Backend
npm start            # Servidor de desenvolvimento
npm run build        # Compilar TypeScript
npm run dev          # Modo desenvolvimento com watch

# Prisma
npx prisma migrate dev    # Executar migrações
npx prisma studio         # Interface visual do banco
npx prisma generate       # Gerar cliente Prisma
```

## 11. Roadmap Estratégico

### V1.0 - Single Tenant (Atual)
- Foco em finalizar todas as funcionalidades essenciais
- Validação com uma clínica parceira
- Deploy e testes em produção

### V2.0 - Multi-Tenant SaaS
- Refatoração para arquitetura Multi-Tenant
- Painel Super Admin para gestão de clínicas
- Sites customizáveis para cada clínica
- Portal do cliente para tutores
- Sistema de assinaturas e cobrança
