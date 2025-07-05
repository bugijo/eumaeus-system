import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice, useUpdateInvoiceStatus } from '../api/invoiceApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Calendar, User, Phone, Mail, DollarSign, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const InvoiceDetailPage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading, error } = useInvoice(Number(invoiceId));
  const updateStatusMutation = useUpdateInvoiceStatus();

  const handleStatusUpdate = async (status: 'PENDING' | 'PAID' | 'CANCELLED') => {
    if (!invoice) return;

    try {
      await updateStatusMutation.mutateAsync({
        invoiceId: invoice.id,
        status
      });
      toast.success('Status da fatura atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar status da fatura');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'PAID':
        return 'Pago';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando fatura...</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">Erro ao carregar fatura</div>
            <Button onClick={() => navigate('/invoices')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Faturas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Fatura #{invoice.id}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          {invoice.status === 'PENDING' && (
            <>
              <Button
                onClick={() => handleStatusUpdate('PAID')}
                size="sm"
                disabled={updateStatusMutation.isPending}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Marcar como Pago
              </Button>
              <Button
                onClick={() => handleStatusUpdate('CANCELLED')}
                variant="destructive"
                size="sm"
                disabled={updateStatusMutation.isPending}
              >
                Cancelar Fatura
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="space-y-6">
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Detalhes da Fatura</CardTitle>
              <Badge className={getStatusColor(invoice.status)}>
                {getStatusText(invoice.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Informações do Tutor
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Tutor:</strong> {invoice.appointment.pet.tutor.name}</div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {invoice.appointment.pet.tutor.email}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {invoice.appointment.pet.tutor.phone}
                  </div>
                  <div><strong>Pet:</strong> {invoice.appointment.pet.name}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Informações do Atendimento
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Data do Atendimento:</strong>{' '}
                    {format(new Date(invoice.appointment.appointmentDate), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR
                    })}
                  </div>
                  <div>
                    <strong>Data da Fatura:</strong>{' '}
                    {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR
                    })}
                  </div>
                  <div><strong>ID do Agendamento:</strong> #{invoice.appointmentId}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Itens da Fatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoice.items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-gray-600">
                        Quantidade: {item.quantity} × R$ {item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        R$ {item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {index < invoice.items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total da Fatura:</span>
              <span className="text-green-600">
                R$ {invoice.totalAmount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;