import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  FileText, 
  Download, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Receipt 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useIssueNFe, 
  useNFeStatus, 
  useDownloadNFePDF, 
  useCancelNFe,
  type Invoice 
} from '../../api/invoiceApi';

interface NFSeControlsProps {
  invoice: Invoice;
}

const NFSeControls: React.FC<NFSeControlsProps> = ({ invoice }) => {
  const [cancelJustification, setCancelJustification] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const issueNFeMutation = useIssueNFe();
  const downloadPDFMutation = useDownloadNFePDF();
  const cancelNFeMutation = useCancelNFe();
  
  // Consultar status da NFS-e apenas se já foi emitida
  const { data: nfeStatus, isLoading: isLoadingStatus } = useNFeStatus(
    invoice.id, 
    !!invoice.nfeId
  );

  const handleIssueNFe = async () => {
    try {
      await issueNFeMutation.mutateAsync(invoice.id);
      toast.success('NFS-e emitida com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao emitir NFS-e');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadPDFMutation.mutateAsync(invoice.id);
      toast.success('PDF da NFS-e baixado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao baixar PDF da NFS-e');
    }
  };

  const handleCancelNFe = async () => {
    if (!cancelJustification.trim()) {
      toast.error('Justificativa é obrigatória para cancelamento');
      return;
    }

    try {
      await cancelNFeMutation.mutateAsync({
        invoiceId: invoice.id,
        data: { justificativa: cancelJustification }
      });
      toast.success('NFS-e cancelada com sucesso!');
      setShowCancelDialog(false);
      setCancelJustification('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cancelar NFS-e');
    }
  };

  const getNFeStatusInfo = () => {
    if (!invoice.nfeId) {
      return {
        status: 'Não emitida',
        color: 'bg-gray-100 text-gray-800',
        icon: <Receipt className="w-4 h-4" />
      };
    }

    if (isLoadingStatus) {
      return {
        status: 'Consultando...',
        color: 'bg-blue-100 text-blue-800',
        icon: <Clock className="w-4 h-4" />
      };
    }

    if (!nfeStatus) {
      return {
        status: 'Erro na consulta',
        color: 'bg-red-100 text-red-800',
        icon: <AlertCircle className="w-4 h-4" />
      };
    }

    switch (nfeStatus.status_code) {
      case '100':
        return {
          status: 'Emitida com Sucesso',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case '200':
        return {
          status: 'Cancelada',
          color: 'bg-red-100 text-red-800',
          icon: <X className="w-4 h-4" />
        };
      case '202':
        return {
          status: 'Processando',
          color: 'bg-warning-muted text-warning-muted-foreground',
          icon: <Clock className="w-4 h-4" />
        };
      default:
        return {
          status: nfeStatus.status || 'Status Desconhecido',
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="w-4 h-4" />
        };
    }
  };

  const statusInfo = getNFeStatusInfo();
  const canIssueNFe = invoice.status === 'PAID' && !invoice.nfeId;
  const canDownloadPDF = invoice.nfeId && nfeStatus?.status_code === '100';
  const canCancelNFe = invoice.nfeId && nfeStatus?.status_code === '100';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Nota Fiscal de Serviço (NFS-e)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status da NFS-e */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge className={statusInfo.color}>
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.status}</span>
              </Badge>
            </div>
            {nfeStatus?.numero && (
              <div className="text-sm text-gray-600">
                <strong>Número:</strong> {nfeStatus.numero}
              </div>
            )}
          </div>

          {/* Informações adicionais */}
          {nfeStatus?.codigo_verificacao && (
            <div className="text-sm text-gray-600">
              <strong>Código de Verificação:</strong> {nfeStatus.codigo_verificacao}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            {/* Botão Emitir NFS-e */}
            {canIssueNFe && (
              <Button
                onClick={handleIssueNFe}
                disabled={issueNFeMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                {issueNFeMutation.isPending ? 'Emitindo...' : 'Emitir NFS-e'}
              </Button>
            )}

            {/* Botão Baixar PDF */}
            {canDownloadPDF && (
              <Button
                onClick={handleDownloadPDF}
                disabled={downloadPDFMutation.isPending}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloadPDFMutation.isPending ? 'Baixando...' : 'Baixar PDF'}
              </Button>
            )}

            {/* Botão Cancelar NFS-e */}
            {canCancelNFe && (
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar NFS-e
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancelar NFS-e</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="justification">Justificativa *</Label>
                      <Textarea
                        id="justification"
                        placeholder="Digite a justificativa para o cancelamento..."
                        value={cancelJustification}
                        onChange={(e) => setCancelJustification(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelNFe}
                        disabled={cancelNFeMutation.isPending || !cancelJustification.trim()}
                      >
                        {cancelNFeMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Mensagens de ajuda */}
          {!canIssueNFe && !invoice.nfeId && (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              A NFS-e só pode ser emitida para faturas com status "Pago".
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NFSeControls;