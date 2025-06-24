
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PawPrint, Edit, FileText, Download, Upload, Stethoscope, Calendar, Thermometer, Heart } from 'lucide-react';

const Prontuario = () => {
  const [activeTab, setActiveTab] = useState('resumo');

  const mockConsultas = [
    {
      id: 1,
      data: '22/05/2025',
      motivo: 'Check-up Anual',
      veterinario: 'Dra. Fernanda Calixto',
      diagnostico: 'Animal saudável, sem alterações significativas',
      tratamento: 'Manutenção da dieta atual, retorno em 6 meses'
    },
    {
      id: 2,
      data: '15/03/2025',
      motivo: 'Vacinação V10',
      veterinario: 'Dra. Fernanda Calixto',
      diagnostico: 'Animal em boas condições para vacinação',
      tratamento: 'Aplicada vacina V10, próxima dose em 1 ano'
    },
    {
      id: 3,
      data: '10/01/2025',
      motivo: 'Consulta de Rotina',
      veterinario: 'Dr. Carlos Silva',
      diagnostico: 'Leve sobrepeso detectado',
      tratamento: 'Ajuste na dieta, exercícios regulares'
    }
  ];

  const mockArquivos = [
    {
      id: 1,
      nome: 'exame_sangue_rex_2025.pdf',
      tipo: 'PDF',
      data: '20/05/2025'
    },
    {
      id: 2,
      nome: 'radiografia_torax_rex.jpg',
      tipo: 'Imagem',
      data: '22/05/2025'
    },
    {
      id: 3,
      nome: 'ultrassom_abdominal.pdf',
      tipo: 'PDF',
      data: '15/04/2025'
    }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Prontuário Eletrônico</h1>
          <p className="text-muted-foreground">Registro médico completo do paciente</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Pet Info Card (Sticky) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=face" />
                    <AvatarFallback className="bg-primary/10 text-2xl">
                      <PawPrint className="w-8 h-8 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl mb-2">Rex</CardTitle>
                <p className="text-muted-foreground">Golden Retriever • Macho • 3 anos</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Tutor:</strong> Fernanda Calixto
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Peso Atual</span>
                    <span className="font-medium">28.5 kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Idade</span>
                    <span className="font-medium">3 anos</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Microchip</span>
                    <span className="font-medium">982123456789012</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Castrado</span>
                    <span className="font-medium">Sim</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Pet
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabbed Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="resumo">Resumo</TabsTrigger>
                    <TabsTrigger value="historico">Histórico</TabsTrigger>
                    <TabsTrigger value="nova-consulta">Nova Consulta</TabsTrigger>
                    <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
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
                          <p className="font-medium">28.5 kg</p>
                          <p className="text-sm text-muted-foreground">Ligeiro sobrepeso</p>
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

                    <Button className="w-full">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Salvar Consulta
                    </Button>
                  </TabsContent>

                  {/* Tab 4: Exames e Arquivos */}
                  <TabsContent value="arquivos" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Exames e Arquivos</h3>
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Adicionar Novo Arquivo
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {mockArquivos.map((arquivo) => (
                        <Card key={arquivo.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{arquivo.nome}</p>
                                <p className="text-sm text-muted-foreground">{arquivo.tipo} • {arquivo.data}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Baixar
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prontuario;
