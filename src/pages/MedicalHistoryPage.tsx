import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMedicalRecords, useCreateMedicalRecord, useUpdateMedicalRecord } from '../api/medicalRecordApi';
import { usePet } from '../api/petApi';
import { CreateMedicalRecordData, MedicalRecord } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { Edit2 } from 'lucide-react';

interface MedicalRecordFormData {
  notes: string;
  prescription: string;
}

export function MedicalHistoryPage() {
  const { petId } = useParams<{ petId: string }>();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState<MedicalRecordFormData>({
    notes: '',
    prescription: ''
  });
  
  const { toast } = useToast();
  const petIdNumber = petId ? parseInt(petId) : 0;
  
  const { data: pet, isLoading: petLoading } = usePet(petIdNumber);
  const { data: records, isLoading: recordsLoading, refetch } = useMedicalRecords(petIdNumber);
  const createRecordMutation = useCreateMedicalRecord();
  const updateRecordMutation = useUpdateMedicalRecord();

  const isEditing = editingRecord !== null;

  const handleEditRecord = (record: MedicalRecord) => {
    setEditingRecord(record);
    setFormData({
      notes: record.notes,
      prescription: record.prescription || ''
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setFormData({ notes: '', prescription: '' });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.notes.trim()) {
      toast({
        title: 'Erro',
        description: 'As anotações são obrigatórias',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isEditing && editingRecord) {
        // Modo de edição
        await updateRecordMutation.mutateAsync({
          recordId: editingRecord.id,
          data: {
            notes: formData.notes,
            prescription: formData.prescription
          }
        });

        toast({
          title: 'Sucesso',
          description: 'Prontuário atualizado com sucesso!',
          variant: 'default'
        });
      } else {
        // Modo de criação
        const recordData: CreateMedicalRecordData = {
          petId: petIdNumber,
          appointmentId: 1, // ID fixo para teste, como solicitado
          notes: formData.notes,
          prescription: formData.prescription
        };

        await createRecordMutation.mutateAsync({
          appointmentId: 1,
          data: recordData
        });

        toast({
          title: 'Sucesso',
          description: 'Prontuário criado com sucesso!',
          variant: 'default'
        });
      }

      setFormData({ notes: '', prescription: '' });
      setEditingRecord(null);
      setShowForm(false);
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: isEditing ? 'Erro ao atualizar prontuário' : 'Erro ao criar prontuário',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (petLoading || recordsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pet não encontrado</h2>
        <p className="text-gray-600">O pet solicitado não foi encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Prontuário Médico - {pet.name}
            </h1>
            <p className="text-gray-600">
              {pet.species} • {pet.breed}
            </p>
          </div>
          <Button
            onClick={() => {
              if (showForm) {
                handleCancelEdit();
              } else {
                setShowForm(true);
              }
            }}
            className="gradient-pink text-white"
          >
            {showForm ? 'Cancelar' : 'Nova Entrada'}
          </Button>
        </div>
      </div>

      {/* Formulário para nova entrada */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isEditing ? 'Editar Registro do Prontuário' : 'Nova Entrada no Prontuário'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Anotações *
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Descreva os sintomas, diagnóstico, tratamento..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="prescription" className="block text-sm font-medium text-gray-700 mb-2">
                Prescrição
              </label>
              <textarea
                id="prescription"
                value={formData.prescription}
                onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Medicamentos, dosagem, instruções..."
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={createRecordMutation.isPending || updateRecordMutation.isPending}
                className="gradient-pink text-white"
              >
                {(createRecordMutation.isPending || updateRecordMutation.isPending) ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isEditing ? 'Atualizando...' : 'Salvando...'}
                  </>
                ) : (
                  isEditing ? 'Salvar Alterações' : 'Salvar Entrada'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Histórico de prontuários */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Histórico Médico</h2>
        </div>
        
        <div className="p-6">
          {!records || records.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600">Nenhum registro médico encontrado</p>
              <p className="text-sm text-gray-500 mt-1">Clique em "Nova Entrada" para adicionar o primeiro registro</p>
            </div>
          ) : (
            <div className="space-y-6">
              {records.map((record) => (
                <div key={record.id} className="border-l-4 border-pink-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      Consulta - {formatDate(record.recordDate)}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRecord(record)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-pink-600"
                      >
                        <Edit2 size={14} />
                        <span>Editar</span>
                      </Button>
                      <span className="text-sm text-gray-500">ID: {record.id}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Anotações:</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{record.notes}</p>
                    </div>
                    
                    {record.prescription && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Prescrição:</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{record.prescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MedicalHistoryPage;