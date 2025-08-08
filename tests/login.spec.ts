import { test, expect } from '@playwright/test';

test.describe('PulseVet Login Page', () => {
  test('should display welcome message on login page', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('http://localhost:3000/login');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
    
    // Procurar por um texto de boas-vindas que (ainda) não existe
    // Este teste vai falhar propositalmente para disparar o ciclo de automação
    await expect(page.locator('text=Bem-vindo ao PulseVet - Sistema Veterinário Avançado')).toBeVisible();
    
    // Verificações adicionais que também podem falhar
    await expect(page.locator('[data-testid="welcome-banner"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('PulseVet Dashboard');
  });
  
  test('should have proper login form elements', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Verificar se existem elementos do formulário de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Procurar por um botão com texto específico que pode não existir
    await expect(page.locator('button:has-text("Entrar no Sistema")')).toBeVisible();
  });
  
  test('should navigate to dashboard after successful login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Tentar fazer login com credenciais de teste
    await page.fill('input[type="email"]', 'admin@pulsevettest.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento e procurar por elementos que podem não existir
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page.locator('text=Dashboard PulseVet')).toBeVisible();
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Bem-vindo');
  });
});