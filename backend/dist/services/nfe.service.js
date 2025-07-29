"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nfeService = exports.NFeService = void 0;
const axios_1 = __importDefault(require("axios"));
class NFeService {
    constructor() {
        this.environment = process.env.NFE_ENVIRONMENT || 'sandbox';
        this.baseUrl = this.environment === 'production'
            ? 'https://api.focusnfe.com.br'
            : 'https://homologacao.focusnfe.com.br';
        this.token = process.env.FOCUS_NFE_TOKEN || '';
        if (!this.token) {
            console.warn('Token da Focus NFe não configurado. Configure a variável FOCUS_NFE_TOKEN');
        }
        this.api = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Basic ${Buffer.from(this.token + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        this.api.interceptors.request.use((config) => {
            console.log('Enviando requisição para Focus NFe', {
                method: config.method,
                url: config.url,
                environment: this.environment
            });
            return config;
        }, (error) => {
            console.error('Erro na requisição para Focus NFe', error);
            return Promise.reject(error);
        });
        this.api.interceptors.response.use((response) => {
            console.log('Resposta recebida da Focus NFe', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            console.error('Erro na resposta da Focus NFe', {
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            return Promise.reject(error);
        });
    }
    async emitirNFSe(referencia, dados) {
        try {
            console.log('Iniciando emissão de NFS-e', { referencia });
            const response = await this.api.post(`/v2/nfse?ref=${referencia}`, dados);
            const nfseResponse = {
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
        }
        catch (error) {
            console.error('Erro ao emitir NFS-e', {
                referencia,
                error: error.message,
                response: error.response?.data
            });
            throw new Error(`Erro ao emitir NFS-e: ${error.response?.data?.message || error.message}`);
        }
    }
    async consultarNFSe(referencia) {
        try {
            console.log('Consultando NFS-e', { referencia });
            const response = await this.api.get(`/v2/nfse/${referencia}`);
            const consultaResponse = {
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
        }
        catch (error) {
            console.error('Erro ao consultar NFS-e', {
                referencia,
                error: error.message
            });
            throw new Error(`Erro ao consultar NFS-e: ${error.response?.data?.message || error.message}`);
        }
    }
    async cancelarNFSe(referencia, motivo) {
        try {
            console.log('Cancelando NFS-e', { referencia, motivo });
            await this.api.delete(`/v2/nfse/${referencia}`, {
                data: { justificativa: motivo }
            });
            console.log('NFS-e cancelada com sucesso', { referencia });
        }
        catch (error) {
            console.error('Erro ao cancelar NFS-e', {
                referencia,
                error: error.message
            });
            throw new Error(`Erro ao cancelar NFS-e: ${error.response?.data?.message || error.message}`);
        }
    }
    async baixarPdf(referencia) {
        try {
            console.log('Baixando PDF da NFS-e', { referencia });
            const response = await this.api.get(`/v2/nfse/${referencia}.pdf`, {
                responseType: 'arraybuffer'
            });
            console.log('PDF da NFS-e baixado com sucesso', { referencia });
            return Buffer.from(response.data);
        }
        catch (error) {
            console.error('Erro ao baixar PDF da NFS-e', {
                referencia,
                error: error.message
            });
            throw new Error(`Erro ao baixar PDF da NFS-e: ${error.response?.data?.message || error.message}`);
        }
    }
    async baixarXml(referencia) {
        try {
            console.log('Baixando XML da NFS-e', { referencia });
            const response = await this.api.get(`/v2/nfse/${referencia}.xml`);
            console.log('XML da NFS-e baixado com sucesso', { referencia });
            return response.data;
        }
        catch (error) {
            console.error('Erro ao baixar XML da NFS-e', {
                referencia,
                error: error.message
            });
            throw new Error(`Erro ao baixar XML da NFS-e: ${error.response?.data?.message || error.message}`);
        }
    }
    mapearStatus(status) {
        const statusMap = {
            'processando_autorizacao': 'processando',
            'autorizado': 'autorizada',
            'rejeitado': 'rejeitada',
            'cancelado': 'cancelada',
            'erro_autorizacao': 'rejeitada'
        };
        return statusMap[status] || 'processando';
    }
    async validarConfiguracao() {
        try {
            await this.api.get('/v2/empresas');
            return true;
        }
        catch (error) {
            console.error('Configuração da Focus NFe inválida', error);
            return false;
        }
    }
}
exports.NFeService = NFeService;
exports.nfeService = new NFeService();
//# sourceMappingURL=nfe.service.js.map