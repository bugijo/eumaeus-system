Alterações: src/components/ui/dialog.tsx, src/components/ui/alert-dialog.tsx, src/components/ui/sheet.tsx
Resumo: Padronização dos overlays (fundo escurecido) para usar bg-background/80 em vez de bg-black/80, alinhando com o design system e suportando temas claro/escuro.
Objetivo: Consistência visual e melhor compatibilidade com tokens de tema do shadcn/tailwind.
Impacto: Overlays agora acompanham o tema ativo, reduzindo contraste excessivo no modo claro e mantendo legibilidade no modo escuro.
Data: 2025-08-29
