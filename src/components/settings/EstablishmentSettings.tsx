import React, { useEffect, useState } from 'react';
import { Save, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClinicSettings, useUpdateClinicSettings } from '@/api/clinicSettingsApi';
import { apiErrorMessage } from '@/api/userApi';

const EMPTY = { clinicName: '', clinicLegalName: '', clinicDocument: '', clinicPhone: '', clinicEmail: '', clinicAddress: '', businessHours: '' };
type Form = typeof EMPTY;

const digits = (value: string) => value.replace(/\D/g, '');
export function formatDocument(value: string) {
  const d = digits(value).slice(0, 14);
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

/** Dados reais do estabelecimento: aparecem no cupom, nos PDFs e nas mensagens aos tutores. */
export default function EstablishmentSettings({ canEdit }: { canEdit: boolean }) {
  const { data: settings, isLoading } = useClinicSettings();
  const update = useUpdateClinicSettings();
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    if (!settings) return;
    setForm({
      clinicName: settings.clinicName || '',
      clinicLegalName: settings.clinicLegalName || '',
      clinicDocument: settings.clinicDocument ? formatDocument(settings.clinicDocument) : '',
      clinicPhone: settings.clinicPhone || '',
      clinicEmail: settings.clinicEmail || '',
      clinicAddress: settings.clinicAddress || '',
      businessHours: settings.businessHours || '',
    });
  }, [settings]);

  const set = (key: keyof Form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: key === 'clinicDocument' ? formatDocument(event.target.value) : event.target.value }));

  const docDigits = digits(form.clinicDocument);
  const docInvalid = docDigits.length > 0 && docDigits.length !== 11 && docDigits.length !== 14;
  const emailInvalid = form.clinicEmail.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.clinicEmail.trim());

  const save = async () => {
    try {
      await update.mutateAsync({ data: { ...form, clinicDocument: docDigits || null } });
      toast.success('Dados do estabelecimento salvos');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Não foi possível salvar os dados'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Estabelecimento</CardTitle>
        <CardDescription>Esses dados aparecem no cupom do caixa, nos relatórios para o contador e nas mensagens aos tutores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="est-name">Nome fantasia *</Label><Input id="est-name" value={form.clinicName} onChange={set('clinicName')} disabled={!canEdit} placeholder="Ex.: Clínica e Pet Shop Bom Amigo" /></div>
              <div className="space-y-2"><Label htmlFor="est-legal">Razão social</Label><Input id="est-legal" value={form.clinicLegalName} onChange={set('clinicLegalName')} disabled={!canEdit} /></div>
              <div className="space-y-2">
                <Label htmlFor="est-doc">CNPJ ou CPF</Label>
                <Input id="est-doc" inputMode="numeric" value={form.clinicDocument} onChange={set('clinicDocument')} disabled={!canEdit} aria-invalid={docInvalid} />
                {docInvalid && <p className="text-xs text-destructive">Informe 11 dígitos (CPF) ou 14 (CNPJ).</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="est-phone">Telefone / WhatsApp</Label><Input id="est-phone" inputMode="tel" value={form.clinicPhone} onChange={set('clinicPhone')} disabled={!canEdit} placeholder="(16) 99999-9999" /></div>
              <div className="space-y-2">
                <Label htmlFor="est-email">E-mail de contato</Label>
                <Input id="est-email" type="email" value={form.clinicEmail} onChange={set('clinicEmail')} disabled={!canEdit} aria-invalid={emailInvalid} />
                {emailInvalid && <p className="text-xs text-destructive">E-mail inválido.</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="est-address">Endereço</Label><Input id="est-address" value={form.clinicAddress} onChange={set('clinicAddress')} disabled={!canEdit} placeholder="Rua, número, bairro, cidade/UF" /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="est-hours">Horário de funcionamento</Label><Textarea id="est-hours" rows={3} value={form.businessHours} onChange={set('businessHours')} disabled={!canEdit} placeholder={'Seg a sex: 8h–18h\nSáb: 8h–12h'} /></div>
            </div>
            {canEdit ? (
              <Button onClick={save} disabled={update.isPending || !form.clinicName.trim() || docInvalid || emailInvalid}>
                <Save className="mr-2 h-4 w-4" />{update.isPending ? 'Salvando…' : 'Salvar dados'}
              </Button>
            ) : <p className="text-sm text-muted-foreground">Somente o dono pode alterar estes dados.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
