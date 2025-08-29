
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Edit, Trash2, Save, Settings, Bell, Mail, Clock, TestTube, RotateCcw, Info } from 'lucide-react';
import { useClinicSettings, useUpdateClinicSettings, useTestEmailSettings, useResetClinicSettings, useTemplateVariables } from '@/api/clinicSettingsApi';
import { toast } from 'sonner';

export default function Configuracoes() {
  const [emailReminders, setEmailReminders] = useState(true);
  const [whatsappReminders, setWhatsappReminders] = useState(false);
  const [emailHealthAlerts, setEmailHealthAlerts] = useState(true);
  const [whatsappHealthAlerts, setWhatsappHealthAlerts] = useState(true);
  const [satisfactionSurvey, setSatisfactionSurvey] = useState(false);

  // Hooks para o sistema de automação
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useClinicSettings();
  const { data: templateVariables } = useTemplateVariables();
  const updateSettingsMutation = useUpdateClinicSettings();
  const testEmailMutation = useTestEmailSettings();
  const resetSettingsMutation = useResetClinicSettings();

  // Estados locais para os formulários
  const [localSettings, setLocalSettings] = useState({
    appointmentRemindersEnabled: true,
    appointmentReminderTemplate: '',
    vaccineRemindersEnabled: true,
    vaccineReminderTemplate: '',
    emailFromName: '',
    clinicName: '',
    clinicPhone: '',
    reminderSendTime: '08:00',
    vaccineReminderDaysBefore: 7
  });

  // Atualiza estados locais quando os dados chegam do servidor
  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        appointmentRemindersEnabled: settings.appointmentRemindersEnabled,
        appointmentReminderTemplate: settings.appointmentReminderTemplate,
        vaccineRemindersEnabled: settings.vaccineRemindersEnabled,
        vaccineReminderTemplate: settings.vaccineReminderTemplate,
        emailFromName: settings.emailFromName,
        clinicName: settings.clinicName,
        clinicPhone: settings.clinicPhone,
        reminderSendTime: settings.reminderSendTime,
        vaccineReminderDaysBefore: settings.vaccineReminderDaysBefore
      });
    }
  }, [settings]);

  // Função para salvar configurações
  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync({ data: localSettings });
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  // Função para testar e-mail
  const handleTestEmail = async () => {
    try {
      const result = await testEmailMutation.mutateAsync();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao testar configurações de e-mail');
    }
  };

  // Função para resetar configurações
  const handleResetSettings = async () => {
    try {
      await resetSettingsMutation.mutateAsync();
      toast.success('Configurações resetadas para valores padrão!');
    } catch (error) {
      toast.error('Erro ao resetar configurações');
    }
  };

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
    <div className="!bg-background p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-text-dark mb-6">Configurações do Sistema</h1>
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
          {settingsError && (
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar configurações. Tente recarregar a página.
              </AlertDescription>
            </Alert>
          )}

          {/* Status do Sistema de Automação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Sistema de Automação Eumaeus
              </CardTitle>
              <CardDescription>
                Controle total sobre os lembretes automáticos da sua clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-green-800">Sistema Ativo</p>
                    <p className="text-sm text-green-600">Lembretes funcionando</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Horário: {localSettings.reminderSendTime}</p>
                    <p className="text-sm text-blue-600">Envio diário</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-800">Via E-mail</p>
                    <p className="text-sm text-purple-600">Templates personalizados</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Lembretes de Consulta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📅 Lembretes de Consulta
              </CardTitle>
              <CardDescription>
                Configure os lembretes automáticos enviados 24h antes das consultas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-3">
                <Switch 
                  id="appointment-reminders" 
                  checked={localSettings.appointmentRemindersEnabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, appointmentRemindersEnabled: checked }))
                  }
                  disabled={settingsLoading}
                />
                <Label htmlFor="appointment-reminders" className="text-base font-medium">
                  Habilitar lembretes de consulta
                </Label>
              </div>

              {localSettings.appointmentRemindersEnabled && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                  <div className="space-y-2">
                    <Label htmlFor="appointment-template">Template da Mensagem</Label>
                    <Textarea
                      id="appointment-template"
                      value={localSettings.appointmentReminderTemplate}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, appointmentReminderTemplate: e.target.value }))
                      }
                      placeholder="Digite o template da mensagem..."
                      rows={4}
                      disabled={settingsLoading}
                    />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Variáveis disponíveis:</p>
                      <div className="flex flex-wrap gap-2">
                        {templateVariables?.appointment?.map((variable) => (
                          <Badge key={variable.variable} variant="outline" className="text-xs">
                            {variable.variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações de Lembretes de Vacina */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💉 Lembretes de Vacinação
              </CardTitle>
              <CardDescription>
                Configure os lembretes automáticos para vacinas próximas do vencimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-3">
                <Switch 
                  id="vaccine-reminders" 
                  checked={localSettings.vaccineRemindersEnabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, vaccineRemindersEnabled: checked }))
                  }
                  disabled={settingsLoading}
                />
                <Label htmlFor="vaccine-reminders" className="text-base font-medium">
                  Habilitar lembretes de vacinação
                </Label>
              </div>

              {localSettings.vaccineRemindersEnabled && (
                <div className="space-y-4 pl-6 border-l-2 border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vaccine-days-before">Avisar quantos dias antes?</Label>
                      <Input
                        id="vaccine-days-before"
                        type="number"
                        min="1"
                        max="30"
                        value={localSettings.vaccineReminderDaysBefore}
                        onChange={(e) => 
                          setLocalSettings(prev => ({ ...prev, vaccineReminderDaysBefore: parseInt(e.target.value) || 7 }))
                        }
                        disabled={settingsLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vaccine-template">Template da Mensagem</Label>
                    <Textarea
                      id="vaccine-template"
                      value={localSettings.vaccineReminderTemplate}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, vaccineReminderTemplate: e.target.value }))
                      }
                      placeholder="Digite o template da mensagem..."
                      rows={4}
                      disabled={settingsLoading}
                    />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Variáveis disponíveis:</p>
                      <div className="flex flex-wrap gap-2">
                        {templateVariables?.vaccine?.map((variable) => (
                          <Badge key={variable.variable} variant="outline" className="text-xs">
                            {variable.variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚙️ Configurações Avançadas
              </CardTitle>
              <CardDescription>
                Configurações técnicas do sistema de automação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="send-time">Horário de Envio</Label>
                  <Input
                    id="send-time"
                    type="time"
                    value={localSettings.reminderSendTime}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ ...prev, reminderSendTime: e.target.value }))
                    }
                    disabled={settingsLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Horário diário para envio dos lembretes
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Nome da Clínica</Label>
                  <Input
                    id="clinic-name"
                    value={localSettings.clinicName}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ ...prev, clinicName: e.target.value }))
                    }
                    placeholder="Nome da clínica"
                    disabled={settingsLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Telefone da Clínica</Label>
                  <Input
                    id="clinic-phone"
                    value={localSettings.clinicPhone}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ ...prev, clinicPhone: e.target.value }))
                    }
                    placeholder="(XX) XXXXX-XXXX"
                    disabled={settingsLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-from-name">Nome do Remetente</Label>
                  <Input
                    id="email-from-name"
                    value={localSettings.emailFromName}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ ...prev, emailFromName: e.target.value }))
                    }
                    placeholder="Nome que aparece no e-mail"
                    disabled={settingsLoading}
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Configure as variáveis de ambiente EMAIL_USER e EMAIL_PASSWORD no backend para ativar o envio real de e-mails.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending || settingsLoading}
              className="flex-1 md:flex-none"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending || settingsLoading}
            >
              <TestTube className="mr-2 h-4 w-4" />
              {testEmailMutation.isPending ? 'Testando...' : 'Testar E-mail'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleResetSettings}
              disabled={resetSettingsMutation.isPending || settingsLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {resetSettingsMutation.isPending ? 'Resetando...' : 'Resetar Padrão'}
            </Button>
          </div>
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
}
