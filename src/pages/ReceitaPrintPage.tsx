import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Medicamento {
  nome: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  instrucoes: string;
}

interface VacinaRaiva {
  aplicada: boolean;
  dataAplicacao?: string;
  dataVencimento?: string;
  lote?: string;
  fabricante?: string;
}

interface ReceituarioData {
  id: string;
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
  vacinaRaiva: VacinaRaiva;
  observacoes: string;
  data: string;
}

export function ReceitaPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Dados mockados para demonstração - em produção, buscar do backend
  const receituarioData: ReceituarioData = {
    id: id || '1',
    veterinario: {
      nome: 'Dr. João Silva',
      crmv: 'CRMV-SP 12345',
      clinica: 'Clínica Veterinária Eumaeus',
      endereco: 'Rua das Flores, 123 - Centro - São Paulo/SP',
      telefone: '(11) 99999-9999'
    },
    tutor: {
      nome: 'Maria Silva Santos',
      cpf: '123.456.789-00',
      endereco: 'Rua das Palmeiras, 456 - Jardim das Flores - São Paulo/SP',
      telefone: '(11) 98765-4321'
    },
    pet: {
      nome: 'Rex',
      especie: 'Canino',
      raca: 'Golden Retriever',
      idade: '5 anos',
      peso: '32 kg'
    },
    medicamentos: [
      {
        nome: 'Amoxicilina',
        dosagem: '250mg',
        frequencia: '2x ao dia',
        duracao: '7 dias',
        instrucoes: 'Administrar com alimento'
      },
      {
        nome: 'Meloxicam',
        dosagem: '0.5mg',
        frequencia: '1x ao dia',
        duracao: '5 dias',
        instrucoes: 'Administrar pela manhã'
      }
    ],
    vacinaRaiva: {
      aplicada: true,
      dataAplicacao: '15/01/2024',
      dataVencimento: '15/01/2025',
      lote: 'VAC2024001',
      fabricante: 'Laboratório VetSafe'
    },
    observacoes: 'Retorno em 7 dias para reavaliação. Manter repouso e evitar exercícios intensos.',
    data: new Date().toLocaleDateString('pt-BR')
  };

  // Chama window.print() automaticamente quando a página carrega
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500); // Pequeno delay para garantir que a página carregou completamente

    return () => clearTimeout(timer);
  }, []);

  // Fecha a aba após a impressão (opcional)
  useEffect(() => {
    const handleAfterPrint = () => {
      window.close();
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Conteúdo do Receituário */}
      <div 
        className="receituario-content p-8 text-black max-w-4xl mx-auto relative" 
        id="printable-area"
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
        <div className="border-b-2 border-gray-800 pb-6 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-800 mb-3">RECEITUÁRIO VETERINÁRIO</h1>
            <div className="text-xl font-semibold mb-2">{receituarioData.veterinario.clinica}</div>
            <div className="text-base text-gray-600 mb-1">{receituarioData.veterinario.endereco}</div>
            <div className="text-base text-gray-600">Tel: {receituarioData.veterinario.telefone}</div>
          </div>
        </div>

        {/* Informações do Veterinário */}
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-4 text-blue-800 border-b border-blue-200 pb-2">VETERINÁRIO RESPONSÁVEL</h3>
          <div className="grid grid-cols-2 gap-6 text-base">
            <div>
              <strong>Nome:</strong> {receituarioData.veterinario.nome}
            </div>
            <div>
              <strong>CRMV:</strong> {receituarioData.veterinario.crmv}
            </div>
          </div>
        </div>

        {/* Informações do Tutor */}
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-4 text-blue-800 border-b border-blue-200 pb-2">DADOS DO TUTOR</h3>
          <div className="grid grid-cols-2 gap-6 text-base">
            <div>
              <strong>Nome:</strong> {receituarioData.tutor.nome}
            </div>
            <div>
              <strong>CPF:</strong> {receituarioData.tutor.cpf}
            </div>
            <div>
              <strong>Endereço:</strong> {receituarioData.tutor.endereco}
            </div>
            <div>
              <strong>Telefone:</strong> {receituarioData.tutor.telefone}
            </div>
          </div>
        </div>

        {/* Informações do Pet */}
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-4 text-blue-800 border-b border-blue-200 pb-2">DADOS DO ANIMAL</h3>
          <div className="grid grid-cols-3 gap-6 text-base">
            <div>
              <strong>Nome:</strong> {receituarioData.pet.nome}
            </div>
            <div>
              <strong>Espécie:</strong> {receituarioData.pet.especie}
            </div>
            <div>
              <strong>Raça:</strong> {receituarioData.pet.raca}
            </div>
            <div>
              <strong>Idade:</strong> {receituarioData.pet.idade}
            </div>
            <div>
              <strong>Peso:</strong> {receituarioData.pet.peso}
            </div>
          </div>
        </div>

        {/* Prescrições */}
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-6 text-blue-800 border-b border-blue-200 pb-2">PRESCRIÇÃO MÉDICA</h3>
          <div className="space-y-6">
            {receituarioData.medicamentos.map((medicamento, index) => (
              <div key={index} className="border-2 border-gray-300 p-6 rounded-lg bg-gray-50">
                <div className="grid grid-cols-2 gap-6 mb-4 text-base">
                  <div>
                    <strong>Medicamento:</strong> {medicamento.nome}
                  </div>
                  <div>
                    <strong>Dosagem:</strong> {medicamento.dosagem}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-4 text-base">
                  <div>
                    <strong>Frequência:</strong> {medicamento.frequencia}
                  </div>
                  <div>
                    <strong>Duração:</strong> {medicamento.duracao}
                  </div>
                </div>
                {medicamento.instrucoes && (
                  <div className="text-base">
                    <strong>Instruções:</strong> {medicamento.instrucoes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vacina Antirrábica */}
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-4 text-blue-800 border-b border-blue-200 pb-2">VACINA ANTIRRÁBICA</h3>
          <div className="border-2 border-gray-300 p-6 rounded-lg bg-gray-50">
            {receituarioData.vacinaRaiva.aplicada ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6 text-base">
                  <div>
                    <strong>Data de Aplicação:</strong> {receituarioData.vacinaRaiva.dataAplicacao}
                  </div>
                  <div>
                    <strong>Data de Vencimento:</strong> {receituarioData.vacinaRaiva.dataVencimento}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 text-base">
                  <div>
                    <strong>Lote:</strong> {receituarioData.vacinaRaiva.lote}
                  </div>
                  <div>
                    <strong>Fabricante:</strong> {receituarioData.vacinaRaiva.fabricante}
                  </div>
                </div>
                <div className="text-base text-green-700 font-semibold">
                  ✓ Vacina antirrábica em dia
                </div>
              </div>
            ) : (
              <div className="text-base text-red-700 font-semibold">
                ⚠️ Vacina antirrábica não aplicada ou vencida
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        {receituarioData.observacoes && (
          <div className="mb-8">
            <h3 className="font-bold text-xl mb-4 text-blue-800 border-b border-blue-200 pb-2">OBSERVAÇÕES</h3>
            <div className="border-2 border-gray-300 p-6 rounded-lg bg-gray-50 text-base">
              {receituarioData.observacoes}
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-12 pt-8 border-t-2 border-gray-300">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-base text-gray-600 mb-2">
                <strong>Data de Emissão:</strong> {receituarioData.data}
              </div>
              <div className="text-sm text-gray-500">
                <strong>Receituário Nº:</strong> {receituarioData.id.padStart(6, '0')}
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-gray-800 pt-4 w-80">
                <div className="font-bold text-lg mb-1">{receituarioData.veterinario.nome}</div>
                <div className="text-base mb-1">CRMV: {receituarioData.veterinario.crmv}</div>
                <div className="text-sm text-gray-600 mt-2">Assinatura do Veterinário</div>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso Legal */}
        <div className="mt-8 text-sm text-gray-500 text-center border-t pt-6">
          <p className="mb-2"><strong>Este receituário é válido por 30 dias a partir da data de emissão.</strong></p>
          <p className="mb-2">Medicamentos controlados devem ser dispensados conforme legislação vigente.</p>
          <p>Para dúvidas, entre em contato com a clínica: {receituarioData.veterinario.telefone}</p>
        </div>
        </div>
      </div>

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            font-size: 14px;
            line-height: 1.5;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
          .no-print {
            display: none !important;
          }
        }
        
        @media screen {
          .receituario-content {
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            margin: 20px auto;
            background: white;
          }
        }
      `}</style>

      {/* Botões de controle (visíveis apenas na tela) */}
      <div className="no-print fixed top-4 right-4 space-x-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          🖨️ Imprimir
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          ✕ Fechar
        </button>
      </div>
    </div>
  );
}

export default ReceitaPrintPage;