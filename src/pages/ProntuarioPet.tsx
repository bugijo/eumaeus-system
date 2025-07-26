import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Stethoscope, Thermometer, Calendar, Plus, Upload, Eye, Download, Trash2, FileText, Pill, X, Camera, Image, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReceitaForm } from '@/components/receituario/ReceitaForm';
import { usePets } from '@/api/petApi';
import { useMedicalRecords } from '@/api/medicalRecordApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function ProntuarioPet() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { data: petsData, isLoading, isError } = usePets();
  const { data: medicalRecords, isLoading: isLoadingRecords } = useMedicalRecords(Number(petId));
  
  // Estados para modais e formulários
  const [receitaModalOpen, setReceitaModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadData, setUploadData] = useState({
    categoria: '',
    tipo: '',
    descricao: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Encontrar o pet específico
  const pets = petsData?.data || [];
  const pet = pets.find(p => p.id === parseInt(petId || '0'));

  // Obter o prontuário mais recente para usar no ReceitaForm
  const latestMedicalRecord = medicalRecords && medicalRecords.length > 0 
    ? medicalRecords[0] 
    : null;

  // Dados mockados para demonstração
  const mockConsultas = [
    {
      id: 1,
      data: '22/05/2025',
      motivo: 'Check-up Anual',
      veterinario: 'Dr. João Silva',
      diagnostico: 'Animal saudável, ligeiro sobrepeso detectado',
      tratamento: 'Dieta balanceada e exercícios regulares recomendados'
    },
    {
      id: 2,
      data: '15/03/2025',
      motivo: 'Vacinação V10',
      veterinario: 'Dra. Fernanda Calixto',
      diagnostico: 'Animal em boas condições para vacinação',
      tratamento: 'Aplicação da vacina V10, retorno em 1 ano'
    }
  ];

  const mockArquivos = [
    {
      id: 1,
      nome: 'Hemograma_Completo_22052025.pdf',
      categoria: 'Exame Laboratorial',
      tipo: 'Hemograma',
      descricao: 'Hemograma completo realizado durante check-up anual',
      tamanho: '2.3 MB',
      data: '22/05/2025'
    },
    {
      id: 2,
      nome: 'Radiografia_Torax_15032025.jpg',
      categoria: 'Exame de Imagem',
      tipo: 'Radiografia',
      descricao: 'Radiografia de tórax pré-vacinação',
      tamanho: '4.1 MB',
      data: '15/03/2025'
    }
  ];

  // Funções para upload de arquivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    // Aqui seria implementada a lógica de upload
    console.log('Uploading files:', selectedFiles);
    console.log('Upload data:', uploadData);
    setSelectedFiles([]);
    setUploadData({ categoria: '', tipo: '', descricao: '' });
    setUploadModalOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'doc':
      case 'docx': return '📝';
      default: return '📎';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar dados do pet</p>
          <Button onClick={() => navigate('/prontuario')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Seleção de Pets
          </Button>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pet não encontrado</p>
          <Button onClick={() => navigate('/prontuario')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Seleção de Pets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/prontuario')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Prontuário - {pet.name}
                </h1>
                <p className="text-muted-foreground">
                  {pet.species} • {pet.breed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Pet */}
        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">
                    {pet.species === 'Canino' ? '🐕' : pet.species === 'Felino' ? '🐱' : '🐾'}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">{pet.name}</h3>
                <p className="text-sm text-muted-foreground">{pet.breed}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Heart className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-medium">Tutor</p>
                  <p className="text-sm text-muted-foreground">{pet.tutor?.name || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Thermometer className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-medium">Peso</p>
                  <p className="text-sm text-muted-foreground">Não informado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium">Última Consulta</p>
                  <p className="text-sm text-muted-foreground">22/05/2025</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid lg:grid-cols-1 gap-6">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="resumo" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                  <TabsTrigger value="nova-consulta">Nova Consulta</TabsTrigger>
                  <TabsTrigger value="receitas">Receitas</TabsTrigger>
                  <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
                  <TabsTrigger value="fotos">Fotos</TabsTrigger>
                </TabsList>

                {/* Tab 1: Resumo */}
                <TabsContent value="resumo" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Heart className="w-4 h-4 mr-2 text-red-500" />
                          Alergias Conhecidas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Nenhuma registrada</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Stethoscope className="w-4 h-4 mr-2 text-primary" />
                          Última Vacina
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">V10</p>
                        <p className="text-sm text-muted-foreground">15/03/2025</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Thermometer className="w-4 h-4 mr-2 text-blue-500" />
                          Peso Atual
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">Não informado</p>
                        <p className="text-sm text-muted-foreground">Dentro do normal</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-green-500" />
                          Última Consulta
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">22/05/2025</p>
                        <p className="text-sm text-muted-foreground">Check-up Anual</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Tab 2: Histórico de Consultas */}
                <TabsContent value="historico" className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Histórico de Consultas</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {mockConsultas.map((consulta) => (
                      <AccordionItem key={consulta.id} value={`consulta-${consulta.id}`}>
                        <AccordionTrigger className="text-left">
                          <div>
                            <p className="font-medium">{consulta.data} - {consulta.motivo}</p>
                            <p className="text-sm text-muted-foreground">{consulta.veterinario}</p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <div>
                            <h4 className="font-medium mb-2">Veterinário Responsável</h4>
                            <p className="text-muted-foreground">{consulta.veterinario}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Diagnóstico Final</h4>
                            <p className="text-muted-foreground">{consulta.diagnostico}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Tratamento Realizado</h4>
                            <p className="text-muted-foreground">{consulta.tratamento}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>

                {/* Tab 3: Nova Consulta */}
                <TabsContent value="nova-consulta" className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Registrar Nova Consulta</h3>
                  
                  {/* Anamnese */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-primary">Anamnese</h4>
                    <div>
                      <label className="block text-sm font-medium mb-2">Queixa principal e histórico relatado pelo tutor</label>
                      <Textarea 
                        placeholder="Descreva os sintomas, comportamentos ou preocupações relatadas pelo tutor..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Exame Físico */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-primary">Exame Físico</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Peso (kg)</label>
                        <Input type="number" placeholder="0.0" step="0.1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Temperatura (°C)</label>
                        <Input type="number" placeholder="0.0" step="0.1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Frequência Cardíaca (bpm)</label>
                        <Input type="number" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Frequência Respiratória (rpm)</label>
                        <Input type="number" placeholder="0" />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Condição Corporal</label>
                        <Textarea placeholder="Avaliação da condição corporal..." className="min-h-[80px]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Hidratação</label>
                        <Textarea placeholder="Status de hidratação..." className="min-h-[80px]" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Observações Gerais</label>
                      <Textarea placeholder="Outras observações do exame físico..." className="min-h-[100px]" />
                    </div>
                  </div>

                  {/* Diagnóstico e Tratamento */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-primary">Diagnóstico e Tratamento</h4>
                    <div>
                      <label className="block text-sm font-medium mb-2">Suspeita(s) Diagnóstica(s)</label>
                      <Textarea placeholder="Liste as suspeitas diagnósticas..." className="min-h-[80px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Diagnóstico Final</label>
                      <Textarea placeholder="Diagnóstico definitivo..." className="min-h-[80px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Plano Terapêutico e Prescrição</label>
                      <Textarea placeholder="Tratamento prescrito, medicações, orientações..." className="min-h-[120px]" />
                    </div>
                  </div>

                  {/* Anexar Exames */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-primary">Anexar Exames e Documentos</h4>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium mb-1">Anexar arquivos de exames</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Arraste arquivos aqui ou clique para selecionar
                        </p>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Selecionar Arquivos
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Os arquivos serão salvos junto com esta consulta no prontuário do paciente.
                    </p>
                  </div>

                  {/* Ações da Consulta */}
                  <div className="flex gap-3">
                    <Button className="flex-1">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Salvar Consulta
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setReceitaModalOpen(true)}
                      className="flex-1"
                    >
                      <Pill className="w-4 h-4 mr-2" />
                      Criar Receituário
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab 4: Receitas */}
                <TabsContent value="receitas" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Receituários Emitidos</h3>
                    <Button onClick={() => setReceitaModalOpen(true)}>
                      <Pill className="w-4 h-4 mr-2" />
                      Nova Receita
                    </Button>
                  </div>

                  {/* Lista de Receitas Mock */}
                  <div className="space-y-4">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Pill className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium">Receituário #001</p>
                                <Badge variant="secondary" className="text-xs">
                                  22/05/2025
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Amoxicilina 250mg, Meloxicam 0.5mg
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>Dr. João Silva</span>
                                <span>•</span>
                                <span>2 medicamentos</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Pill className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium">Receituário #002</p>
                                <Badge variant="secondary" className="text-xs">
                                  15/03/2025
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Dipirona 500mg, Omeprazol 20mg
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>Dra. Fernanda Calixto</span>
                                <span>•</span>
                                <span>2 medicamentos</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Informações sobre Receituários */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Sobre os Receituários</h4>
                          <p className="text-sm text-blue-700">
                            Os receituários são gerados em formato PDF e podem ser impressos ou enviados digitalmente. 
                            Para validade legal, é necessária assinatura digital com certificado ICP-Brasil ou assinatura manuscrita.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 5: Exames e Arquivos */}
                <TabsContent value="arquivos" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Exames e Arquivos</h3>
                    <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Upload className="w-4 h-4 mr-2" />
                          Adicionar Novo Arquivo
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Upload de Arquivos de Exames</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Área de Upload */}
                          <div className="space-y-4">
                            <Label>Selecionar Arquivos</Label>
                            <div 
                              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-lg font-medium mb-2">Clique para selecionar arquivos</p>
                              <p className="text-sm text-muted-foreground mb-4">
                                Ou arraste e solte os arquivos aqui
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB por arquivo)
                              </p>
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </div>

                          {/* Arquivos Selecionados */}
                          {selectedFiles.length > 0 && (
                            <div className="space-y-3">
                              <Label>Arquivos Selecionados ({selectedFiles.length})</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {selectedFiles.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-lg">{getFileIcon(file.name)}</span>
                                      <div>
                                        <p className="font-medium text-sm">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFile(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Informações do Upload */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="categoria">Categoria do Exame</Label>
                              <Select value={uploadData.categoria} onValueChange={(value) => setUploadData(prev => ({ ...prev, categoria: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="exame-laboratorial">Exame Laboratorial</SelectItem>
                                  <SelectItem value="exame-imagem">Exame de Imagem</SelectItem>
                                  <SelectItem value="exame-cardiologico">Exame Cardiológico</SelectItem>
                                  <SelectItem value="exame-oftalmologico">Exame Oftalmológico</SelectItem>
                                  <SelectItem value="exame-dermatologico">Exame Dermatológico</SelectItem>
                                  <SelectItem value="laudo-cirurgico">Laudo Cirúrgico</SelectItem>
                                  <SelectItem value="outros">Outros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tipo">Tipo de Exame</Label>
                              <Input
                                id="tipo"
                                placeholder="Ex: Hemograma, Radiografia, etc."
                                value={uploadData.tipo}
                                onChange={(e) => setUploadData(prev => ({ ...prev, tipo: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="descricao">Descrição/Observações</Label>
                            <Textarea
                              id="descricao"
                              placeholder="Descreva o exame, resultados importantes ou observações relevantes..."
                              value={uploadData.descricao}
                              onChange={(e) => setUploadData(prev => ({ ...prev, descricao: e.target.value }))}
                              className="min-h-[80px]"
                            />
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                              Cancelar
                            </Button>
                            <Button 
                              onClick={handleUpload}
                              disabled={selectedFiles.length === 0 || !uploadData.categoria}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Fazer Upload ({selectedFiles.length} arquivo{selectedFiles.length !== 1 ? 's' : ''})
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Lista de Arquivos */}
                  <div className="space-y-4">
                    {mockArquivos.map((arquivo) => (
                      <Card key={arquivo.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="font-medium truncate">{arquivo.nome}</p>
                                  <Badge variant="secondary" className="text-xs">
                                    {arquivo.categoria}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{arquivo.descricao}</p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>{arquivo.tipo}</span>
                                  <span>•</span>
                                  <span>{arquivo.tamanho}</span>
                                  <span>•</span>
                                  <span>{arquivo.data}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {mockArquivos.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">Nenhum arquivo encontrado</p>
                        <p className="text-muted-foreground mb-4">
                          Adicione arquivos de exames para manter o histórico médico completo
                        </p>
                        <Button onClick={() => setUploadModalOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeiro Arquivo
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 6: Fotos */}
                <TabsContent value="fotos" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Fotos do Pet</h3>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <UserCircle className="w-4 h-4 mr-2" />
                        Atualizar Foto de Perfil
                      </Button>
                      <Button>
                        <Camera className="w-4 h-4 mr-2" />
                        Adicionar Foto
                      </Button>
                    </div>
                  </div>

                  {/* Foto de Perfil */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <UserCircle className="w-5 h-5 mr-2" />
                        Foto de Perfil
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-6">
                        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                          <span className="text-6xl">
                            {pet.species === 'Canino' ? '🐕' : pet.species === 'Felino' ? '🐱' : '🐾'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">Foto atual do {pet.name}</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Uma foto de perfil ajuda na identificação rápida do pet durante consultas e procedimentos.
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm">
                              <Upload className="w-4 h-4 mr-2" />
                              Fazer Upload
                            </Button>
                            <Button variant="outline" size="sm">
                              <Camera className="w-4 h-4 mr-2" />
                              Tirar Foto
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Galeria de Fotos Médicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Image className="w-5 h-5 mr-2" />
                          Fotos Médicas e Documentação Visual
                        </div>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Fotos
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Categorias de Fotos */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                            <Stethoscope className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="font-medium text-sm">Consultas</p>
                          <p className="text-xs text-muted-foreground">3 fotos</p>
                        </Card>
                        
                        <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-2">
                            <Heart className="w-6 h-6 text-red-600" />
                          </div>
                          <p className="font-medium text-sm">Lesões/Feridas</p>
                          <p className="text-xs text-muted-foreground">1 foto</p>
                        </Card>
                        
                        <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                            <Eye className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="font-medium text-sm">Evolução</p>
                          <p className="text-xs text-muted-foreground">2 fotos</p>
                        </Card>
                        
                        <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
                            <Camera className="w-6 h-6 text-purple-600" />
                          </div>
                          <p className="font-medium text-sm">Outras</p>
                          <p className="text-xs text-muted-foreground">0 fotos</p>
                        </Card>
                      </div>

                      {/* Grid de Fotos */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Foto 1 */}
                        <div className="relative group">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <Camera className="w-8 h-8 text-blue-500" />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="secondary">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="secondary">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-medium">Consulta - 22/05/2025</p>
                            <p className="text-xs text-muted-foreground">Check-up geral</p>
                          </div>
                        </div>

                        {/* Foto 2 */}
                        <div className="relative group">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                              <Heart className="w-8 h-8 text-red-500" />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="secondary">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="secondary">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-medium">Lesão - 15/03/2025</p>
                            <p className="text-xs text-muted-foreground">Ferida na pata</p>
                          </div>
                        </div>

                        {/* Foto 3 */}
                        <div className="relative group">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                              <Eye className="w-8 h-8 text-green-500" />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="secondary">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="secondary">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-medium">Evolução - 20/03/2025</p>
                            <p className="text-xs text-muted-foreground">Cicatrização</p>
                          </div>
                        </div>

                        {/* Área para adicionar nova foto */}
                        <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer">
                          <div className="text-center">
                            <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Adicionar Foto</p>
                          </div>
                        </div>
                      </div>

                      {/* Informações sobre Fotos */}
                      <Card className="bg-amber-50 border-amber-200 mt-6">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Camera className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-amber-900 mb-1">Dicas para Fotos Médicas</h4>
                              <ul className="text-sm text-amber-700 space-y-1">
                                <li>• Use boa iluminação natural sempre que possível</li>
                                <li>• Mantenha o foco na área de interesse</li>
                                <li>• Tire fotos de diferentes ângulos quando necessário</li>
                                <li>• Documente a evolução de lesões com fotos periódicas</li>
                                <li>• Adicione descrições detalhadas para cada foto</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Receituário */}
      <ReceitaForm
        isOpen={receitaModalOpen}
        onClose={() => setReceitaModalOpen(false)}
        petData={{
          nome: pet.name,
          especie: pet.species,
          raca: pet.breed,
          idade: 'N/A',
          peso: 'Não informado',
          tutor: {
            nome: pet.tutor?.name || 'Não informado',
            cpf: '123.456.789-00',
            endereco: 'Rua das Flores, 123 - Centro - São Paulo/SP',
            telefone: pet.tutor?.phone || '(11) 99999-9999'
          }
        }}
        medicalRecordId={latestMedicalRecord?.id}
      />
    </div>
  );
}

export default ProntuarioPet;