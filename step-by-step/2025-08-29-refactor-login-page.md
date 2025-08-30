Alteração: src/pages/LoginPage.tsx
Resumo: Remoção de cores hardcoded (bg-white, eumaeus-*) e adoção de tokens de tema do shadcn/tailwind: bg-background, bg-muted, text-foreground, text-muted-foreground, border-input, focus:ring-primary/border-primary. Botão de submit usa o componente padrão sem classes customizadas.
Objetivo: Garantir consistência visual entre temas, reduzir acoplamento a paleta fixa e simplificar manutenção.
Impacto: Login responde ao tema global, melhora acessibilidade e reduz chance de regressões visuais.
Data: 2025-08-29
