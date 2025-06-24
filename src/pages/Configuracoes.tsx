
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Edit, Trash2, Save, Settings } from 'lucide-react';

const Configuracoes = () => {
  const [emailReminders, setEmailReminders] = useState(true);
  const [whatsappReminders, setWhatsappReminders] = useState(false);
  const [emailHealthAlerts, setEmailHealthAlerts] = useState(true);
  const [whatsappHealthAlerts, setWhatsappHealthAlerts] = useState(true);
  const [satisfactionSurvey, setSatisfactionSurvey] = useState(false);

  const users = [
    {
      nome: "Dra. Fernanda Calixto",
      email: "fernanda.calixto@vet.com",
      cargo: "Admin",
      color: "bg-primary"
    },
    {
      nome: "Dr. João Silva",
      email: "joao.silva@vet.com",
      cargo: "Veterinário",
      color: "bg-blue-500"
    },
    {
      nome: "Maria Santos",
      email: "maria.santos@vet.com",
      cargo: "Recepção",
      color: "bg-green-500"
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Clínica</CardTitle>
              <CardDescription>Configure os dados básicos da sua clínica veterinária</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nome da Clínica</Label>
                  <Input 
                    id="clinicName" 
                    defaultValue="Clínica Veterinária Fernanda Calixto" 
                    placeholder="Digite o nome da clínica"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone Principal</Label>
                  <Input 
                    id="phone" 
                    defaultValue="(11) 99999-9999" 
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input 
                  id="address" 
                  defaultValue="Rua das Flores, 123 - Centro - São Paulo/SP - CEP: 01234-567" 
                  placeholder="Endereço completo da clínica"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email de Contato</Label>
                <Input 
                  id="email" 
                  type="email"
                  defaultValue="contato@vetcalixto.com.br" 
                  placeholder="email@clinica.com.br"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Horário de Funcionamento</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weekdays">Segunda a Sexta</Label>
                    <Input 
                      id="weekdays" 
                      defaultValue="08:00 - 19:00" 
                      placeholder="HH:MM - HH:MM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saturday">Sábados</Label>
                    <Input 
                      id="saturday" 
                      defaultValue="09:00 - 13:00" 
                      placeholder="HH:MM - HH:MM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sunday">Domingos</Label>
                    <Input 
                      id="sunday" 
                      defaultValue="Fechado" 
                      placeholder="Fechado ou HH:MM - HH:MM"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>Controle o acesso ao sistema e permissões dos usuários</CardDescription>
              </div>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Convidar Novo Usuário
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`${user.color} text-white`}>
                          {user.cargo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>Configure como e quando os clientes receberão avisos automáticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Lembretes de Consulta</h3>
                  <p className="text-sm text-muted-foreground mb-4">Enviar lembrete 24h antes da consulta via:</p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Switch 
                        id="email-reminders" 
                        checked={emailReminders}
                        onCheckedChange={setEmailReminders}
                      />
                      <Label htmlFor="email-reminders">Email</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Switch 
                        id="whatsapp-reminders" 
                        checked={whatsappReminders}
                        onCheckedChange={setWhatsappReminders}
                      />
                      <Label htmlFor="whatsapp-reminders">WhatsApp</Label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Avisos de Saúde</h3>
                  <p className="text-sm text-muted-foreground mb-4">Enviar avisos de vencimento de vacinas e vermífugos via:</p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Switch 
                        id="email-health" 
                        checked={emailHealthAlerts}
                        onCheckedChange={setEmailHealthAlerts}
                      />
                      <Label htmlFor="email-health">Email</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Switch 
                        id="whatsapp-health" 
                        checked={whatsappHealthAlerts}
                        onCheckedChange={setWhatsappHealthAlerts}
                      />
                      <Label htmlFor="whatsapp-health">WhatsApp</Label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Pós-Consulta</h3>
                  <div className="flex items-center space-x-3">
                    <Switch 
                      id="satisfaction-survey" 
                      checked={satisfactionSurvey}
                      onCheckedChange={setSatisfactionSurvey}
                    />
                    <Label htmlFor="satisfaction-survey">Enviar pesquisa de satisfação 1 dia após a consulta</Label>
                  </div>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" />
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Fiscais da Empresa</CardTitle>
              <CardDescription>Informações necessárias para emissão de notas fiscais e documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social</Label>
                  <Input 
                    id="razaoSocial" 
                    defaultValue="Fernanda Calixto Clínica Veterinária Ltda" 
                    placeholder="Razão social da empresa"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input 
                      id="cnpj" 
                      defaultValue="12.345.678/0001-90" 
                      placeholder="XX.XXX.XXX/XXXX-XX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input 
                      id="inscricaoEstadual" 
                      defaultValue="123.456.789.123" 
                      placeholder="Número da inscrição estadual"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" />
                Salvar Dados Fiscais
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
