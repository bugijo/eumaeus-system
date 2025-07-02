# Sistema Veterinário - PulseVet System

## Visão Geral
Sistema completo de gestão para clínicas veterinárias, desenvolvido com React, TypeScript e Prisma. O objetivo é criar uma plataforma moderna e intuitiva que permita o gerenciamento eficiente de tutores, pets, agendamentos, prontuários médicos, estoque e financeiro.

## Objetivos Principais

### 1. Gestão de Clientes e Pacientes
- Cadastro completo de tutores (donos dos pets)
- Registro detalhado de pets com histórico médico
- Relacionamento entre tutores e seus pets

### 2. Sistema de Agendamentos
- Agenda integrada para consultas e procedimentos
- Controle de horários e disponibilidade
- Notificações e lembretes

### 3. Prontuário Eletrônico
- Histórico médico completo dos pets
- Registro de consultas, exames e tratamentos
- Controle de vacinas e medicamentos

### 4. Gestão de Estoque
- Controle de medicamentos e materiais
- Alertas de estoque baixo
- Histórico de movimentações

### 5. Módulo Financeiro
- Controle de receitas e despesas
- Faturamento de consultas e procedimentos
- Relatórios financeiros

## Tecnologias
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/ui
- **Backend**: Prisma ORM
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **Gerenciamento de Estado**: React Query

## Arquitetura
O sistema seguirá uma arquitetura modular com separação clara de responsabilidades:
- Componentes reutilizáveis na pasta `components/ui`
- Páginas principais em `pages/`
- Hooks customizados em `hooks/`
- Utilitários em `lib/`
- Esquemas de banco em `prisma/`

## Público-Alvo
Clínicas veterinárias de pequeno e médio porte que buscam digitalizar e otimizar seus processos de atendimento e gestão.

devemos colocar a possibilidade de emitir notas fiscais para os clientes, e o sistema deve ter um módulo de estoque, que deve ser controlado pelo usuário.
e temos que ter a possibilidade de ser emitido o arquivo com o relatorio para o contador conhecido como XML, que deve ser gerado automaticamente ao final de cada mês.
e o sistema deve ter um módulo de pagamentos, que deve ser controlado pelo usuário.
e o sistema deve ter um módulo de relatórios, que deve ser controlado pelo usuário.
e o sistema deve ter um módulo de configurações, que deve ser controlado pelo usuário.
e o sistema deve ter um módulo de backup, que deve ser controlado pelo usuário.
