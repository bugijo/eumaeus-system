import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface Medicamento {
  nome: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  instrucoes: string;
}

interface VacinaRaiva {
  aplicada: boolean;
  dataAplicacao: string;
  proximaAplicacao: string;
  lote: string;
  fabricante: string;
}

interface ReceituarioData {
  veterinario: {
    nome: string;
    crmv: string;
    clinica: string;
    endereco: string;
    telefone: string;
  };
  tutor: {
    nome: string;
    cpf: string;
    endereco: string;
    telefone: string;
  };
  pet: {
    nome: string;
    especie: string;
    raca: string;
    idade: string;
    peso: string;
  };
  medicamentos: Medicamento[];
  observacoes: string;
  vacinaRaiva: VacinaRaiva;
  data: string;
}

interface ReceituarioTemplateProps {
  data: ReceituarioData;
  isOpen: boolean;
  onClose: () => void;
  isForEmail?: boolean;
}

export function ReceituarioTemplate({ data, isOpen, onClose, isForEmail = false }: ReceituarioTemplateProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    // Aqui seria implementada a funcionalidade de envio por email
    alert('Funcionalidade de envio por email será implementada');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle>Receituário Veterinário</DialogTitle>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              🖨️ Imprimir / Salvar PDF
            </Button>
            <Button onClick={handleSendEmail} className="bg-green-600 hover:bg-green-700">
              📧 Enviar por Email
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogHeader>

        {/* Conteúdo do Receituário */}
        <div 
          className="receituario-content relative bg-white p-8 text-black min-h-[297mm]" 
          id="receituario-print"
          style={{
            backgroundImage: 'url(/receituario.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay para melhor legibilidade */}
          <div className="absolute inset-0 bg-white bg-opacity-90"></div>
          
          {/* Conteúdo sobre o overlay */}
          <div className="relative z-10">
          {/* Cabeçalho */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-blue-800 mb-2">RECEITUÁRIO VETERINÁRIO</h1>
              <div className="text-lg font-semibold">{data.veterinario.clinica}</div>
              <div className="text-sm text-gray-600">{data.veterinario.endereco}</div>
              <div className="text-sm text-gray-600">Tel: {data.veterinario.telefone}</div>
            </div>
          </div>

          {/* Informações do Veterinário */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 text-blue-800">VETERINÁRIO RESPONSÁVEL</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Nome:</strong> {data.veterinario.nome}
              </div>
              <div>
                <strong>CRMV:</strong> {data.veterinario.crmv}
              </div>
            </div>
          </div>

          {/* Informações do Tutor */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 text-blue-800">DADOS DO TUTOR</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Nome:</strong> {data.tutor.nome}
              </div>
              <div>
                <strong>CPF:</strong> {data.tutor.cpf}
              </div>
              <div>
                <strong>Endereço:</strong> {data.tutor.endereco}
              </div>
              <div>
                <strong>Telefone:</strong> {data.tutor.telefone}
              </div>
            </div>
          </div>

          {/* Informações do Pet */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 text-blue-800">DADOS DO ANIMAL</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <strong>Nome:</strong> {data.pet.nome}
              </div>
              <div>
                <strong>Espécie:</strong> {data.pet.especie}
              </div>
              <div>
                <strong>Raça:</strong> {data.pet.raca}
              </div>
              <div>
                <strong>Idade:</strong> {data.pet.idade}
              </div>
              <div>
                <strong>Peso:</strong> {data.pet.peso}
              </div>
            </div>
          </div>

          {/* Prescrições */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-4 text-blue-800">PRESCRIÇÃO MÉDICA</h3>
            <div className="space-y-4">
              {data.medicamentos.map((medicamento, index) => (
                <div key={index} className="border border-gray-300 p-4 rounded">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <strong>Medicamento:</strong> {medicamento.nome}
                    </div>
                    <div>
                      <strong>Dosagem:</strong> {medicamento.dosagem}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <strong>Frequência:</strong> {medicamento.frequencia}
                    </div>
                    <div>
                      <strong>Duração:</strong> {medicamento.duracao}
                    </div>
                  </div>
                  {medicamento.instrucoes && (
                    <div>
                      <strong>Instruções:</strong> {medicamento.instrucoes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vacina de Raiva */}
          {data.vacinaRaiva?.aplicada && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2 text-warning-muted-foreground">VACINA ANTIRRÁBICA</h3>
              <div className="border border-warning-muted-foreground bg-warning-muted p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Data da Aplicação:</strong> {new Date(data.vacinaRaiva.dataAplicacao).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <strong>Próxima Aplicação:</strong> {new Date(data.vacinaRaiva.proximaAplicacao).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <strong>Lote:</strong> {data.vacinaRaiva.lote}
                  </div>
                  <div>
                    <strong>Fabricante:</strong> {data.vacinaRaiva.fabricante}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          {data.observacoes && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2 text-blue-800">OBSERVAÇÕES</h3>
              <div className="border border-gray-300 p-4 rounded">
                {data.observacoes}
              </div>
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Data: {data.data}
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-800 pt-2 w-64">
                  <div className="font-semibold">{data.veterinario.nome}</div>
                  <div className="text-sm">CRMV: {data.veterinario.crmv}</div>
                  {isForEmail ? (
                    <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded">
                      <div className="text-xs font-semibold text-blue-800">ASSINATURA DIGITAL</div>
                      <div className="text-xs text-blue-600">Documento assinado digitalmente</div>
                      <div className="text-xs text-blue-600">Hash: {btoa(data.veterinario.nome + data.data).substring(0, 16)}...</div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 mt-1">Assinatura do Veterinário</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div> {/* Fim do conteúdo sobre overlay */}

          {/* Aviso Legal */}
          <div className="mt-6 text-xs text-gray-500 text-center border-t pt-4">
            <p>Este receituário é válido por 30 dias a partir da data de emissão.</p>
            <p>Medicamentos controlados devem ser dispensados conforme legislação vigente.</p>
          </div>
        </div>
      </DialogContent>

      {/* Estilos para impressão */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receituario-content,
          .receituario-content * {
            visibility: visible;
          }
          .receituario-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
