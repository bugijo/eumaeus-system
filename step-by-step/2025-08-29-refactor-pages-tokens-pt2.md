# 2025-08-29 — Refatoração de Páginas para Tokens de Tema (Parte 2)

Arquivos alterados:
- src/pages/NotFound.tsx
- src/pages/Prontuario.tsx
- src/pages/ProductListPage.tsx

Resumo das mudanças:
- Substituição de classes Tailwind hardcoded por tokens de tema shadcn/tailwind:
  - Cores de fundo: bg-gray-100 → bg-muted; bg-white → bg-card
  - Texto: text-gray-600 → text-muted-foreground; text-red-600 → text-destructive; títulos para text-foreground
  - Bordas: border-slate-200 → border-border
  - Botões/ações destrutivas: bg-red-600/hover:bg-red-700 → bg-destructive/hover:bg-destructive/90 + text-destructive-foreground
  - Badges de aviso/erro: text-red-600/border-red-600 → text-destructive/border-destructive
- Preservação de utilitários/estilos customizados do projeto (gradient-*, card-vet, border-gradient, warning-*) para manter a identidade visual existente.

Motivação:
- Padronização visual entre temas claro/escuro
- Redução de divergências de paleta e manutenção simplificada
- Alinhamento com os componentes base shadcn/ui

Testes recomendados:
- Validar NotFound (404): contraste de textos/links
- Prontuário: estados de erro e hover da tabela; card de busca; badge de status "Ativo"
- Produtos: cards de estatísticas (vencendo/estoque baixo), tabela (linhas com aviso/erro), botões de ação e diálogo de exclusão

Impacto e próximos passos:
- Melhora a consistência e facilita futuras trocas de tema
- Próximo: revisar gradientes personalizados para tokens/variantes temáticas sem perder a identidade visual
