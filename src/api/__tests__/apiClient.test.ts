import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../apiClient';

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuração Base', () => {
    it('deve ter a URL base correta', () => {
      expect(apiClient.defaults.baseURL).toBe('http://localhost:3333/api');
    });

    it('deve ter timeout configurado', () => {
      expect(apiClient.defaults.timeout).toBe(10000);
    });

    it('deve ter headers padrão corretos', () => {
      expect(apiClient.defaults.headers.common['Content-Type']).toBe('application/json');
    });
  });

  describe('Interceptors de Request', () => {
    it('deve adicionar token de autorização quando disponível', async () => {
      const mockToken = 'mock-jwt-token';
      mockLocalStorage.getItem.mockReturnValue(mockToken);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    it('não deve adicionar token quando não disponível', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('Interceptors de Response', () => {
    it('deve retornar dados em caso de sucesso', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData
      });

      const response = await apiClient.get('/test');
      expect(response.data).toEqual(mockData);
    });

    it('deve lidar com erro 401 (não autorizado)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('deve lidar com erro 403 (proibido)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    it('deve lidar com erro 500 (servidor)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    it('deve lidar com erro de rede', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network Error');
    });
  });

  describe('Métodos HTTP', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });
    });

    it('deve fazer requisição GET', async () => {
      await apiClient.get('/users');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('deve fazer requisição POST com dados', async () => {
      const postData = { name: 'John', email: 'john@test.com' };
      
      await apiClient.post('/users', postData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData)
        })
      );
    });

    it('deve fazer requisição PUT com dados', async () => {
      const putData = { id: 1, name: 'John Updated' };
      
      await apiClient.put('/users/1', putData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData)
        })
      );
    });

    it('deve fazer requisição DELETE', async () => {
      await apiClient.delete('/users/1');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Tratamento de Timeout', () => {
    it('deve cancelar requisição após timeout', async () => {
      // Mock de uma requisição que demora mais que o timeout
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 15000))
      );

      await expect(apiClient.get('/slow-endpoint')).rejects.toThrow();
    });
  });

  describe('Headers Customizados', () => {
    it('deve permitir headers customizados por requisição', async () => {
      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      
      await apiClient.get('/test', { headers: customHeaders });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value'
          })
        })
      );
    });
  });

  describe('Retry Logic', () => {
    it('deve tentar novamente em caso de erro de rede', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        });

      const response = await apiClient.get('/test');
      expect(response.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});