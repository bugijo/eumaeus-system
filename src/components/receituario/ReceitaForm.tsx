import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { ReceituarioTemplate } from './ReceituarioTemplate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi, CreatePrescriptionRequest } from '../../api/prescriptionApi';
import { toast } from 'sonner';

interface Medicamento {
  nome: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  instrucoes: string;
}

interface ReceitaFormProps {
  isOpen: boolean;
  onClose: () => void;
  medicalRecordId?: number;
  petData?: {
    nome: string;
    especie: string;
    raca: string;
    idade: string;
    peso: string;
    tutor: {
      nome: string;
      cpf: string;
      endereco: string;
      telefone: string;
    };
  };
}

export function ReceitaForm({ isOpen, onClose, medicalRecordId, petData }: ReceitaFormProps) {
  const queryClient = useQueryClient();
  const [showReceituario, setShowReceituario] = useState(false);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([
    { nome: '', dosagem: '', frequencia: '', duracao: '', instrucoes: '' }
  ]);
  const [observacoes, setObservacoes] = useState('');
  const [vacinaRaiva, setVacinaRaiva] = useState({
    aplicada: false,
    dataAplicacao: '',
    proximaAplicacao: '',
    lote: '',
    fabricante: ''
  });
  
  // Dados do veterinário (normalmente viriam do contexto/auth)
  const [veterinarioData] = useState({
    nome: 'Dr. João Silva',
    crmv: 'CRMV-SP 12345',
    clinica: 'Clínica Veterinária Eumaeus',
    endereco: 'Rua das Flores, 123 - Centro - São Paulo/SP',
    telefone: '(11) 99999-9999'
  });

  const adicionarMedicamento = () => {
    setMedicamentos([...medicamentos, { nome: '', dosagem: '', frequencia: '', duracao: '', instrucoes: '' }]);
  };

  const removerMedicamento = (index: number) => {
    if (medicamentos.length > 1) {
      setMedicamentos(medicamentos.filter((_, i) => i !== index));
    }
  };

  const atualizarMedicamento = (index: number, campo: keyof Medicamento, valor: string) => {
    const novosMedicamentos = [...medicamentos];
    novosMedicamentos[index][campo] = valor;
    setMedicamentos(novosMedicamentos);
  };

  // Mutation para salvar receita
  const createPrescriptionMutation = useMutation({
    mutationFn: (data: CreatePrescriptionRequest) => {
      if (!medicalRecordId) {
        throw new Error('ID do prontuário é obrigatório');
      }
      return prescriptionApi.createPrescription(medicalRecordId, data);
    },
    onSuccess: (prescription) => {
      toast.success('Receita salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescription', 'medicalRecord', medicalRecordId] });
      
      // Abrir página de impressão com o ID real da receita
      const printUrl = `/receita/${prescription.id}/print`;
      window.open(printUrl, '_blank');
      
      // Fechar o modal
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao salvar receita:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar receita');
    }
  });

  const handleGerarReceituario = () => {
    // Validação básica
    const medicamentosValidos = medicamentos.filter(med => med.nome.trim() !== '');
    if (medicamentosValidos.length === 0) {
      toast.error('Adicione pelo menos um medicamento');
      return;
    }

    setShowReceituario(true);
  };

  const handleSalvarEImprimir = () => {
    // Validação básica
    const medicamentosValidos = medicamentos.filter(med => med.nome.trim() !== '');
    if (medicamentosValidos.length === 0) {
      toast.error('Adicione pelo menos um medicamento');
      return;
    }

    if (!medicalRecordId) {
      toast.error('ID do prontuário não encontrado');
      return;
    }

    // Preparar dados para envio
    const prescriptionData: CreatePrescriptionRequest = {
      items: medicamentosValidos.map(med => ({
        medication: med.nome,
        dosage: med.dosagem,
        frequency: med.frequencia,
        duration: med.duracao,
        instructions: med.instrucoes || undefined
      }))
    };

    // Salvar no backend
    createPrescriptionMutation.mutate(prescriptionData);
  };

  const receituarioData = {
    veterinario: veterinarioData,
    tutor: petData?.tutor || {
      nome: '',
      cpf: '',
      endereco: '',
      telefone: ''
    },
    pet: petData || {
      nome: '',
      especie: '',
      raca: '',
      idade: '',
      peso: ''
    },
    medicamentos: medicamentos.filter(med => med.nome.trim() !== ''),
    observacoes,
    vacinaRaiva,
    data: new Date().toLocaleDateString('pt-BR')
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Receituário Veterinário</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do Pet */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Informações do Animal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Animal</Label>
                  <Input value={petData?.nome || ''} disabled className="bg-white" />
                </div>
                <div>
                  <Label>Espécie</Label>
                  <Input value={petData?.especie || ''} disabled className="bg-white" />
                </div>
                <div>
                  <Label>Raça</Label>
                  <Input value={petData?.raca || ''} disabled className="bg-white" />
                </div>
                <div>
                  <Label>Peso</Label>
                  <Input value={petData?.peso || ''} disabled className="bg-white" />
                </div>
              </div>
            </div>

            {/* Informações do Tutor */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Informações do Tutor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Tutor</Label>
                  <Input value={petData?.tutor?.nome || ''} disabled className="bg-white" />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input value={petData?.tutor?.cpf || ''} disabled className="bg-white" />
                </div>
              </div>
            </div>

            {/* Medicamentos */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Prescrições</h3>
                <Button onClick={adicionarMedicamento} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Medicamento
                </Button>
              </div>

              <div className="space-y-4">
                {medicamentos.map((medicamento, index) => (
                  <div key={index} className="border border-gray-200 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Medicamento {index + 1}</h4>
                      {medicamentos.length > 1 && (
                        <Button
                          onClick={() => removerMedicamento(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome do Medicamento *</Label>
                        <Input
                          value={medicamento.nome}
                          onChange={(e) => atualizarMedicamento(index, 'nome', e.target.value)}
                          placeholder="Ex: Amoxicilina"
                        />
                      </div>
                      <div>
                        <Label>Dosagem *</Label>
                        <Input
                          value={medicamento.dosagem}
                          onChange={(e) => atualizarMedicamento(index, 'dosagem', e.target.value)}
                          placeholder="Ex: 250mg"
                        />
                      </div>
                      <div>
                        <Label>Frequência *</Label>
                        <Input
                          value={medicamento.frequencia}
                          onChange={(e) => atualizarMedicamento(index, 'frequencia', e.target.value)}
                          placeholder="Ex: 2x ao dia"
                        />
                      </div>
                      <div>
                        <Label>Duração *</Label>
                        <Input
                          value={medicamento.duracao}
                          onChange={(e) => atualizarMedicamento(index, 'duracao', e.target.value)}
                          placeholder="Ex: 7 dias"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label>Instruções Especiais</Label>
                      <Textarea
                        value={medicamento.instrucoes}
                        onChange={(e) => atualizarMedicamento(index, 'instrucoes', e.target.value)}
                        placeholder="Ex: Administrar com alimento"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vacina de Raiva */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold mb-3 text-yellow-800">Vacina Antirrábica</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="vacinaAplicada"
                    checked={vacinaRaiva.aplicada}
                    onChange={(e) => setVacinaRaiva({...vacinaRaiva, aplicada: e.target.checked})}
                    className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <Label htmlFor="vacinaAplicada" className="text-yellow-800">Vacina antirrábica aplicada</Label>
                </div>
                
                {vacinaRaiva.aplicada && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data da Aplicação</Label>
                      <Input
                        type="date"
                        value={vacinaRaiva.dataAplicacao}
                        onChange={(e) => setVacinaRaiva({...vacinaRaiva, dataAplicacao: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Próxima Aplicação</Label>
                      <Input
                        type="date"
                        value={vacinaRaiva.proximaAplicacao}
                        onChange={(e) => setVacinaRaiva({...vacinaRaiva, proximaAplicacao: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Lote da Vacina</Label>
                      <Input
                        value={vacinaRaiva.lote}
                        onChange={(e) => setVacinaRaiva({...vacinaRaiva, lote: e.target.value})}
                        placeholder="Ex: ABC123"
                      />
                    </div>
                    <div>
                      <Label>Fabricante</Label>
                      <Input
                        value={vacinaRaiva.fabricante}
                        onChange={(e) => setVacinaRaiva({...vacinaRaiva, fabricante: e.target.value})}
                        placeholder="Ex: Zoetis"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observações Gerais */}
            <div>
              <Label>Observações Gerais</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais sobre o tratamento..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleGerarReceituario} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                Visualizar
              </Button>
              <Button 
                onClick={handleSalvarEImprimir} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createPrescriptionMutation.isPending}
              >
                {createPrescriptionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  '💾 Salvar e Imprimir'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal do Receituário */}
      {showReceituario && (
        <ReceituarioTemplate
          data={receituarioData}
          isOpen={showReceituario}
          onClose={() => setShowReceituario(false)}
        />
      )}
    </>
  );
}