
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Settings, Bell, Mail, Clock, TestTube, RotateCcw, Info } from 'lucide-react';
import { useClinicSettings, useUpdateClinicSettings, useTestEmailSettings, useResetClinicSettings, useTemplateVariables } from '@/api/clinicSettingsApi';
import { toast } from 'sonner';
import { serviceApi, ServiceType } from '@/api/serviceApi';
import { useAuthStore } from '@/stores/authStore';
import EstablishmentSettings from '@/components/settings/EstablishmentSettings';
import StaffUsersSettings from '@/components/settings/StaffUsersSettings';
import MyAccountSettings from '@/components/settings/MyAccountSettings';

export default function Configuracoes() {
  const authUser = useAuthStore((state) => state.user);
  const isOwner = authUser?.role === 'DONO';
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('aba') || 'estabelecimento';
  const [catalogServices, setCatalogServices] = useState<ServiceType[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogForm, setCatalogForm] = useState({ name: '', description: '', duration: '60', price: '', category: 'CLINICA' });

  // Hooks para o sistema de automação
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useClinicSettings();
  const { data: templateVariables } = useTemplateVariables();
  const updateSettingsMutation = useUpdateClinicSettings();
  const testEmailMutation = useTestEmailSettings();
  const resetSettingsMutation = useResetClinicSettings();

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try { setCatalogServices(await serviceApi.getAllServices()); }
    catch { toast.error('Não foi possível carregar o catálogo de serviços'); }
    finally { setCatalogLoading(false); }
  };
  React.useEffect(() => { void loadCatalog(); }, []);
  const handleCreateCatalogService = async () => {
    setCatalogSaving(true);
    try {
      await serviceApi.createService({ ...catalogForm, duration: Number(catalogForm.duration), price: Number(catalogForm.price) });
      toast.success('Serviço persistido no catálogo da clínica');
      setCatalogForm({ name: '', description: '', duration: '60', price: '', category: 'CLINICA' });
      await loadCatalog();
    } catch { toast.error('Não foi possível salvar o serviço'); }
    finally { setCatalogSaving(false); }
  };

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

  return (
    <div className="!bg-background p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-text-dark">Configurações</h1>
      </div>

      <Tabs key={initialTab} defaultValue={initialTab} className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="estabelecimento">Estabelecimento</TabsTrigger>
          {isOwner && <TabsTrigger value="usuarios">Equipe e acessos</TabsTrigger>}
          <TabsTrigger value="conta">Minha conta</TabsTrigger>
          <TabsTrigger value="notificacoes">Lembretes</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="estabelecimento" className="space-y-6">
          <EstablishmentSettings canEdit={isOwner} />
        </TabsContent>

        {isOwner && (
          <TabsContent value="usuarios" className="space-y-6">
            <StaffUsersSettings currentUserId={authUser?.id} currentEmail={authUser?.email} />
          </TabsContent>
        )}

        <TabsContent value="conta" className="space-y-6">
          <MyAccountSettings name={authUser?.name} email={authUser?.email} role={authUser?.role} />
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


        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de serviços</CardTitle>
              <CardDescription>Serviços persistidos por empresa, usados na agenda e preservados nos históricos contratados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="service-name">Nome</Label><Input id="service-name" value={catalogForm.name} onChange={e => setCatalogForm(v => ({ ...v, name: e.target.value }))} placeholder="Banho sintético" /></div>
                <div className="space-y-2"><Label htmlFor="service-category">Categoria</Label><select id="service-category" className="h-10 rounded-md border bg-background px-3" value={catalogForm.category} onChange={e => setCatalogForm(v => ({ ...v, category: e.target.value }))}><option value="CLINICA">Clínica</option><option value="BANHO_TOSA">Banho e tosa</option></select></div>
                <div className="space-y-2"><Label htmlFor="service-price">Preço (R$)</Label><Input id="service-price" type="number" min="0" step="0.01" value={catalogForm.price} onChange={e => setCatalogForm(v => ({ ...v, price: e.target.value }))} placeholder="0,00" /></div>
                <div className="space-y-2"><Label htmlFor="service-duration">Duração (minutos)</Label><Input id="service-duration" type="number" min="1" step="1" value={catalogForm.duration} onChange={e => setCatalogForm(v => ({ ...v, duration: e.target.value }))} /></div>
                <div className="space-y-2 md:col-span-2"><Label htmlFor="service-description">Descrição</Label><Textarea id="service-description" value={catalogForm.description} onChange={e => setCatalogForm(v => ({ ...v, description: e.target.value }))} placeholder="Descrição do serviço" /></div>
              </div>
              <Button onClick={handleCreateCatalogService} disabled={catalogSaving || !catalogForm.name.trim() || !catalogForm.price}>{catalogSaving ? 'Salvando...' : 'Salvar serviço'}</Button>
              <div className="rounded-md border">
                <div className="border-b px-4 py-3 font-medium">Serviços ativos {catalogLoading ? '(carregando...)' : `(${catalogServices.length})`}</div>
                {catalogServices.length === 0 && !catalogLoading ? <p className="p-4 text-sm text-muted-foreground">Nenhum serviço cadastrado nesta clínica.</p> : <div className="divide-y">{catalogServices.map(service => <div key={service.id} className="flex items-center justify-between px-4 py-3 text-sm"><span>{service.name} · {service.category} · {service.duration} min</span><span>R$ {Number(service.price).toFixed(2).replace('.', ',')}</span></div>)}</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
