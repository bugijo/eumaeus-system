import axios, { AxiosInstance } from 'axios';

// Tipos para NFS-e
export interface NFSeData {
  prestador: {
    cnpj: string;
    inscricaoMunicipal?: string;
    codigoMunicipio?: string;
  };
  tomador: {
    cnpj?: string;
    cpf?: string;
    razaoSocial: string;
    email: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      uf: string;
      cep: string;
    };
  };
  servico: {
    discriminacao: string;
    valorServicos: number;
    aliquota?: number;
    issRetido?: boolean;
    itemListaServico?: string;
    codigoTributarioMunicipio?: string;
  };
  dataEmissao?: string;
}

export interface NFSeResponse {
  id: string;
  status: 'processando' | 'autorizada' | 'rejeitada' | 'cancelada';
  numero?: string;
  codigoVerificacao?: string;
  dataEmissao?: string;
  linkPdf?: string;
  linkXml?: string;
  motivoRejeicao?: string;
}

export interface NFSeConsultaResponse {
  id: string;
  status: string;
  numero?: string;
  dataEmissao?: string;
  valorTotal?: number;
  linkPdf?: string;
  linkXml?: string;
}

/**
 * Serviço para emissão de NFS-e através da API Focus NFe
 * 
 * Estratégia escolhida: Focus NFe
 * - Mais de 1.200 prefeituras integradas
 * - API REST simples com JSON
 * - Preços competitivos (R$ 79,90/mês para 1 CNPJ + 100 notas)
 * - 30 dias de teste gratuito
 * - Documentação clara e completa
 * - Suporte especializado
 */
export class NFeService {
  private api: AxiosInstance;
  private baseUrl: string;
  private token: string;
  private environment: 'sandbox' | 'production';

  constructor() {
    this.environment = (process.env.NFE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';
    
    this.token = process.env.FOCUS_NFE_TOKEN || '';
    
    if (!this.token) {
      console.warn('Token da Focus NFe não configurado. Configure a variável FOCUS_NFE_TOKEN');
    }

    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.token + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });

    // Interceptor para logs
    this.api.interceptors.request.use(
      (config) => {
        console.log('Enviando requisição para Focus NFe', {
          method: config.method,
          url: config.url,
          environment: this.environment
        });
        return config;
      },
      (error) => {
        console.error('Erro na requisição para Focus NFe', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log('Resposta recebida da Focus NFe', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        console.error('Erro na resposta da Focus NFe', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Emite uma NFS-e
   */
  async emitirNFSe(referencia: string, dados: NFSeData): Promise<NFSeResponse> {
    try {
      console.log('Iniciando emissão de NFS-e', { referencia });

      const response = await this.api.post(`/v2/nfse?ref=${referencia}`, dados);
      
      const nfseResponse: NFSeResponse = {
        id: referencia,
        status: this.mapearStatus(response.data.status),
        numero: response.data.numero,
        codigoVerificacao: response.data.codigo_verificacao,
        dataEmissao: response.data.data_emissao,
        linkPdf: response.data.url_danfse,
        linkXml: response.data.url_xml,
        motivoRejeicao: response.data.motivo_cancelamento
      };

      console.log('NFS-e emitida com sucesso', { 
        referencia, 
        status: nfseResponse.status,
        numero: nfseResponse.numero 
      });

      return nfseResponse;
    } catch (error: any) {
      console.error('Erro ao emitir NFS-e', { 
        referencia, 
        error: error.message,
        response: error.response?.data 
      });
      
      throw new Error(`Erro ao emitir NFS-e: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Consulta o status de uma NFS-e
   */
  async consultarNFSe(referencia: string): Promise<NFSeConsultaResponse> {
    try {
      console.log('Consultando NFS-e', { referencia });

      const response = await this.api.get(`/v2/nfse/${referencia}`);
      
      const consultaResponse: NFSeConsultaResponse = {
        id: referencia,
        status: this.mapearStatus(response.data.status),
        numero: response.data.numero,
        dataEmissao: response.data.data_emissao,
        valorTotal: response.data.valor_total,
        linkPdf: response.data.url_danfse,
        linkXml: response.data.url_xml
      };

      console.log('Consulta de NFS-e realizada', { 
        referencia, 
        status: consultaResponse.status 
      });

      return consultaResponse;
    } catch (error: any) {
      console.error('Erro ao consultar NFS-e', { 
        referencia, 
        error: error.message 
      });
      
      throw new Error(`Erro ao consultar NFS-e: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cancela uma NFS-e
   */
  async cancelarNFSe(referencia: string, motivo: string): Promise<void> {
    try {
      console.log('Cancelando NFS-e', { referencia, motivo });

      await this.api.delete(`/v2/nfse/${referencia}`, {
        data: { justificativa: motivo }
      });

      console.log('NFS-e cancelada com sucesso', { referencia });
    } catch (error: any) {
      console.error('Erro ao cancelar NFS-e', { 
        referencia, 
        error: error.message 
      });
      
      throw new Error(`Erro ao cancelar NFS-e: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Baixa o PDF da NFS-e
   */
  async baixarPdf(referencia: string): Promise<Buffer> {
    try {
      console.log('Baixando PDF da NFS-e', { referencia });

      const response = await this.api.get(`/v2/nfse/${referencia}.pdf`, {
        responseType: 'arraybuffer'
      });

      console.log('PDF da NFS-e baixado com sucesso', { referencia });
      
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Erro ao baixar PDF da NFS-e', { 
        referencia, 
        error: error.message 
      });
      
      throw new Error(`Erro ao baixar PDF da NFS-e: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Baixa o XML da NFS-e
   */
  async baixarXml(referencia: string): Promise<string> {
    try {
      console.log('Baixando XML da NFS-e', { referencia });

      const response = await this.api.get(`/v2/nfse/${referencia}.xml`);

      console.log('XML da NFS-e baixado com sucesso', { referencia });
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao baixar XML da NFS-e', { 
        referencia, 
        error: error.message 
      });
      
      throw new Error(`Erro ao baixar XML da NFS-e: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Mapeia o status da API para nosso padrão
   */
  private mapearStatus(status: string): 'processando' | 'autorizada' | 'rejeitada' | 'cancelada' {
    const statusMap: Record<string, 'processando' | 'autorizada' | 'rejeitada' | 'cancelada'> = {
      'processando_autorizacao': 'processando',
      'autorizado': 'autorizada',
      'rejeitado': 'rejeitada',
      'cancelado': 'cancelada',
      'erro_autorizacao': 'rejeitada'
    };

    return statusMap[status] || 'processando';
  }

  /**
   * Valida se o ambiente está configurado corretamente
   */
  async validarConfiguracao(): Promise<boolean> {
    try {
      // Tenta fazer uma consulta simples para validar a configuração
      await this.api.get('/v2/empresas');
      return true;
    } catch (error) {
      console.error('Configuração da Focus NFe inválida', error);
      return false;
    }
  }
}

// Instância singleton do serviço
export const nfeService = new NFeService();