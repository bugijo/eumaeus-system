import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MedicalRecordForm } from '../components/forms/MedicalRecordForm';
import { usePet } from '../api/petApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function MedicalRecordPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  const { data: pet, isLoading } = usePet(Number(petId));
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando informações do pet...</p>
        </div>
      </div>
    );
  }
  
  if (!pet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pet não encontrado</h3>
              <p className="text-gray-600 mb-4">O pet solicitado não foi encontrado.</p>
              <Button onClick={() => navigate('/pets')}>
                Voltar para Lista de Pets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleSuccess = () => {
    toast.success('Prontuário criado com sucesso!');
    setIsFormVisible(false);
    // Optionally navigate to pet details or medical records list
    navigate(`/pets/${petId}`);
  };
  
  const handleCancel = () => {
    setIsFormVisible(false);
  };
  
  if (isFormVisible) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setIsFormVisible(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <MedicalRecordForm
          petId={pet.id}
          petName={pet.name}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/pets')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Pets
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prontuário Médico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Informações do Pet */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Informações do Pet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Nome:</span>
                  <span className="ml-2 text-blue-700">{pet.name}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Espécie:</span>
                  <span className="ml-2 text-blue-700">{pet.species}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Raça:</span>
                  <span className="ml-2 text-blue-700">{pet.breed}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Idade:</span>
                  <span className="ml-2 text-blue-700">{pet.age} anos</span>
                </div>
                {pet.tutor && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-blue-800">Tutor:</span>
                    <span className="ml-2 text-blue-700">{pet.tutor.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setIsFormVisible(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Criar Novo Prontuário
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate(`/pets/${petId}/medical-records`)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Ver Histórico de Prontuários
              </Button>
            </div>
            
            {/* Informações sobre o formulário */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Sobre o Prontuário Eletrônico</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Registre sintomas, diagnóstico e tratamento de forma detalhada</li>
                <li>• Adicione produtos utilizados durante o atendimento</li>
                <li>• O sistema automaticamente dará baixa no estoque dos produtos utilizados</li>
                <li>• Registre dados vitais como peso, temperatura e frequências</li>
                <li>• Todas as informações ficam disponíveis no histórico do pet</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MedicalRecordPage;