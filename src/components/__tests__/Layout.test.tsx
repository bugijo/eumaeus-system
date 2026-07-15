import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Layout from '../Layout';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/authApi';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn()
}));

// Mock do store de autenticação
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn()
}));

vi.mock('../../api/authApi', () => ({
  authApi: {
    logout: vi.fn()
  }
}));

// Mock do react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
    useNavigate: () => mockNavigate
  };
});

const mockUser = {
  id: 1,
  name: 'João Silva',
  email: 'joao@teste.com'
};

const mockAuthStore = {
  user: mockUser,
  refreshToken: 'stored-refresh-token',
  logout: vi.fn()
};

const renderLayout = (children = <div>Test Content</div>) => {
  return render(
    <BrowserRouter>
      <Layout>{children}</Layout>
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);
    vi.mocked(authApi.logout).mockResolvedValue();
    vi.clearAllMocks();
  });

  it('deve renderizar o layout corretamente', () => {
    renderLayout();
    
    expect(screen.getByText('Eumaeus System')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('deve exibir o nome do usuário logado', () => {
    renderLayout();
    
    expect(screen.getByText('Bem-vindo(a), João Silva! 👋')).toBeInTheDocument();
  });

  it('deve abrir/fechar o sidebar no mobile', () => {
    // Mock window.innerWidth para simular mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });
    
    renderLayout();
    
    const menuButton = screen.getByLabelText(/abrir menu de navegação/i);
    expect(menuButton).toBeInTheDocument();
    
    fireEvent.click(menuButton);
    
    expect(screen.getByLabelText(/fechar menu de navegação/i)).toBeInTheDocument();
  });

  it('deve conter todos os links de navegação', () => {
    renderLayout();
    
    // Verificar se os principais links estão presentes
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agendamentos')).toBeInTheDocument();
    expect(screen.getByText('Tutores')).toBeInTheDocument();
    expect(screen.getByText('Pets')).toBeInTheDocument();
    expect(screen.getByText('Prontuários')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Estoque')).toBeInTheDocument();
  });

  it('deve revogar o token e limpar o estado local ao sair', async () => {
    renderLayout();
    
    const logoutButton = screen.getByLabelText(/sair do sistema/i);
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalledWith('stored-refresh-token');
      expect(mockAuthStore.logout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('deve limpar o estado local quando a revogação falha por erro de rede', async () => {
    vi.mocked(authApi.logout).mockRejectedValueOnce(new Error('network error'));
    renderLayout();

    fireEvent.click(screen.getByLabelText(/sair do sistema/i));

    await waitFor(() => {
      expect(mockAuthStore.logout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('deve evitar chamadas simultâneas de logout', async () => {
    let finishLogout: (() => void) | undefined;
    vi.mocked(authApi.logout).mockImplementationOnce(() => new Promise<void>((resolve) => {
      finishLogout = resolve;
    }));
    renderLayout();

    const logoutButton = screen.getByLabelText(/sair do sistema/i);
    fireEvent.click(logoutButton);
    fireEvent.click(logoutButton);

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    finishLogout?.();
    await waitFor(() => expect(mockAuthStore.logout).toHaveBeenCalledTimes(1));
  });

  it('deve ter estrutura semântica adequada para acessibilidade', () => {
    renderLayout();
    
    // Verificar elementos semânticos
    expect(screen.getByRole('navigation', { name: /menu principal de navegação/i })).toBeInTheDocument();
    expect(screen.getByRole('main', { name: /conteúdo principal da página/i })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
  });

  it('deve ter atributos ARIA corretos', () => {
    renderLayout();
    
    const sidebar = screen.getByRole('navigation', { name: /menu principal de navegação/i });
    expect(sidebar).toHaveAttribute('id', 'sidebar-navigation');
    
    const menuButton = screen.getByLabelText(/abrir menu de navegação/i);
    expect(menuButton).toHaveAttribute('aria-controls', 'sidebar-navigation');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('deve fechar sidebar ao clicar em link no mobile', () => {
    // Mock window.innerWidth para simular mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });
    
    renderLayout();
    
    // Abrir sidebar
    const menuButton = screen.getByLabelText(/abrir menu de navegação/i);
    fireEvent.click(menuButton);
    
    // Clicar em um link de navegação
    const dashboardLink = screen.getByLabelText(/navegar para dashboard/i);
    fireEvent.click(dashboardLink);
    
    // Verificar se o sidebar foi fechado (aria-expanded deve ser false)
    waitFor(() => {
      expect(screen.getByLabelText(/abrir menu de navegação/i)).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('deve exibir overlay no mobile quando sidebar estiver aberto', () => {
    // Mock window.innerWidth para simular mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });
    
    renderLayout();
    
    // Abrir sidebar
    const menuButton = screen.getByLabelText(/abrir menu de navegação/i);
    fireEvent.click(menuButton);
    
    // Verificar se o overlay está presente
    const overlay = document.querySelector('[class~="bg-black/50"]');
    expect(overlay).toBeInTheDocument();
  });

  it('deve renderizar com usuário padrão quando não há usuário logado', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      refreshToken: null,
      logout: vi.fn()
    });
    
    renderLayout();
    
    expect(screen.getByText('Bem-vindo(a), Usuário! 👋')).toBeInTheDocument();
    expect(screen.getByText('Usuário')).toBeInTheDocument();
  });
});
