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
export declare class NFeService {
    private api;
    private baseUrl;
    private token;
    private environment;
    constructor();
    emitirNFSe(referencia: string, dados: NFSeData): Promise<NFSeResponse>;
    consultarNFSe(referencia: string): Promise<NFSeConsultaResponse>;
    cancelarNFSe(referencia: string, motivo: string): Promise<void>;
    baixarPdf(referencia: string): Promise<Buffer>;
    baixarXml(referencia: string): Promise<string>;
    private mapearStatus;
    validarConfiguracao(): Promise<boolean>;
}
export declare const nfeService: NFeService;
//# sourceMappingURL=nfe.service.d.ts.map