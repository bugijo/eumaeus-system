# Eumaeus desktop

Instalador para Windows, macOS e Linux. Abre o sistema publicado em `https://eumaeus.com.br/` numa janela própria.

- Linux (local): `npm ci && npx electron-builder --linux AppImage` → `release/Eumaeus-*.AppImage`
- Windows e macOS: gerados pelo workflow `.github/workflows/installers.yml` (`windows-latest` e `macos-latest`).
- macOS sem certificado Apple: o `.dmg` não é notarizado; o usuário confirma a abertura em Ajustes > Privacidade e Segurança.
