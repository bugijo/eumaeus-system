# Eumaeus mobile

App Android e iPhone/iPad (Capacitor). Carrega `https://eumaeus.com.br/`.

- Android: `npm ci && npx cap sync android && cd android && ./gradlew assembleDebug` → APK em `android/app/build/outputs/apk/debug/`. APK de debug instala por sideload; publicação na Play Store exige keystore de release.
- iOS: `npx cap sync ios` e abrir `ios/App/App.xcodeproj` no Xcode (macOS). Instalar em aparelho e publicar exige conta Apple Developer.
- Build de CI: `.github/workflows/installers.yml`.
