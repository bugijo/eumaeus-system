Alteração: src/components/ui/toaster.tsx
Resumo: Padronização de estilos do Toaster para tokens de tema (border, background, foreground, variants), removendo cores hardcoded e adotando classes como border-destructive, bg-destructive/10, text-destructive, border-border, bg-card, text-foreground e text-muted-foreground.
Objetivo: Garantir consistência visual entre temas (claro/escuro), facilitar manutenção e reduzir divergências de paleta.
Impacto: Componente alinhado ao design system (shadcn/tailwind), com melhor escalabilidade e previsibilidade de estilos.
Data: 2025-08-29
