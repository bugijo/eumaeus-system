import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMedicalRecords } from '../api/medicalRecordApi';
import { usePet } from '../api/petApi';
import { useCreateInvoiceFromAppointment, useInvoiceByAppointment } from '../api/invoiceApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar, FileText, Pill, User, ArrowLeft, DollarSign, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const MedicalRecordsPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { data: pet, isLoading: loadingPet } = usePet(Number(petId));
  const { data: records = [], isLoading: loadingRecords } = useMedicalRecords(Number(petId));
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
  const createInvoiceMutation = useCreateInvoiceFromAppointment();

  if (loadingPet || loadingRecords) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="text-center text-red-500">
        Pet não encontrado.
      </div>
    );
  }

  const toggleRecord = (recordId: number) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const handleGenerateInvoice = async (appointmentId: number) => {
    try {
      const invoice = await createInvoiceMutation.mutateAsync(appointmentId);
      toast.success('Fatura gerada com sucesso!');
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      toast.error('Erro ao gerar fatura');
    }
  };

  // Componente para o botão de faturamento
  const InvoiceButton = ({ record }: { record: any }) => {
    const { data: existingInvoice, isLoading: loadingInvoice } = useInvoiceByAppointment(record.appointmentId);

    if (loadingInvoice) {
      return (
        <Button size="sm" disabled>
          Verificando...
        </Button>
      );
    }

    if (existingInvoice) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/invoices/${existingInvoice.id}`)}
          className="flex items-center gap-2"
        >
          <Receipt className="h-4 w-4" />
          Ver Fatura
        </Button>
      );
    }

    // Só mostra o botão se o agendamento estiver finalizado
    if (record.appointment?.status === 'COMPLETED') {
      return (
        <Button
          size="sm"
          onClick={() => handleGenerateInvoice(record.appointmentId)}
          disabled={createInvoiceMutation.isPending}
          className="flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {createInvoiceMutation.isPending ? 'Gerando...' : 'Gerar Faturamento'}
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Histórico Médico</h1>
          <p className="text-gray-600">
            <User className="inline h-4 w-4 mr-1" />
            {pet.name} - {pet.species} ({pet.breed})
          </p>
        </div>
      </div>

      {/* Informações do Pet */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Pet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{pet.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Espécie/Raça</p>
              <p className="font-medium">{pet.species} - {pet.breed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Idade</p>
              <p className="font-medium">{pet.age} anos</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Peso</p>
              <p className="font-medium">{pet.weight} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tutor</p>
              <p className="font-medium">{pet.tutor?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Prontuários */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prontuários Médicos ({records.length})
        </h2>

        {records.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum prontuário médico encontrado.</p>
              <p className="text-sm text-gray-400 mt-2">
                Os prontuários aparecerão aqui após os atendimentos.
              </p>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="transition-all duration-200 hover:shadow-md">
              <CardHeader 
                className="cursor-pointer" 
                onClick={() => toggleRecord(record.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">
                        {format(new Date(record.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {format(new Date(record.createdAt), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {record.products && record.products.length > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Pill className="h-3 w-3" />
                        {record.products.length} produto(s)
                      </Badge>
                    )}
                    <InvoiceButton record={record} />
                    <Button variant="ghost" size="sm">
                      {expandedRecord === record.id ? 'Ocultar' : 'Ver detalhes'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedRecord === record.id && (
                <CardContent className="border-t">
                  <div className="space-y-4">
                    {/* Sintomas */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Sintomas</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded">{record.symptoms}</p>
                    </div>
                    
                    {/* Diagnóstico */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Diagnóstico</h4>
                      <p className="text-sm bg-blue-50 p-3 rounded">{record.diagnosis}</p>
                    </div>
                    
                    {/* Tratamento */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Tratamento</h4>
                      <p className="text-sm bg-green-50 p-3 rounded">{record.treatment}</p>
                    </div>
                    
                    {/* Observações */}
                    {record.notes && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">Observações</h4>
                        <p className="text-sm bg-yellow-50 p-3 rounded">{record.notes}</p>
                      </div>
                    )}
                    
                    {/* Produtos utilizados */}
                    {record.products && record.products.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          Produtos Utilizados
                        </h4>
                        <div className="space-y-2">
                          {record.products.map((productRecord) => (
                            <div 
                              key={productRecord.id} 
                              className="flex items-center justify-between bg-purple-50 p-3 rounded"
                            >
                              <div>
                                <p className="font-medium text-sm">{productRecord.product.name}</p>
                                {productRecord.product.description && (
                                  <p className="text-xs text-gray-500">
                                    {productRecord.product.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  Qtd: {productRecord.quantityUsed}
                                </p>
                                <p className="text-xs text-gray-500">
                                  R$ {(productRecord.product.price * productRecord.quantityUsed).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicalRecordsPage;