import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useUpdateClinicSettings } from '@/api/clinicSettingsApi';
import { apiErrorMessage, useMyAccess } from '@/api/userApi';

/** Mostra o plano contratado e, no plano Clínica + Pet Shop, a escolha de separar as contas das unidades. */
export default function PlanSettings({ canEdit }: { canEdit: boolean }) {
  const { data: access } = useMyAccess();
  const update = useUpdateClinicSettings();
  const client = useQueryClient();
  if (!access) return null;

  const modules = access.catalog.filter((item) => access.planPermissions.includes(item.key)).map((item) => item.label);

  const toggle = async (separateUnits: boolean) => {
    try {
      await update.mutateAsync({ data: { separateUnits } as any });
      await client.invalidateQueries({ queryKey: ['my-access'] });
      toast.success(separateUnits ? 'Clínica e pet shop com contas separadas' : 'Clínica e pet shop com as contas juntas');
    } catch (err) { toast.error(apiErrorMessage(err, 'Não foi possível mudar a separação das contas')); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano {access.planLabel}</CardTitle>
        <CardDescription>Módulos incluídos: {modules.join(', ')}.</CardDescription>
      </CardHeader>
      {access.plan === 'CLINICA_PETSHOP' && (
        <CardContent>
          <div className="flex items-start justify-between gap-6 rounded-lg border border-border p-4">
            <div>
              <p id="separate-units-label" className="text-sm font-medium">Separar as contas da clínica e do pet shop</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ligado: cada venda e despesa pertence a uma unidade, e contas como aluguel e energia são divididas pela regra que você cadastrar.
                Desligado: tudo fica num caixa e num financeiro só, como uma empresa única.
              </p>
            </div>
            <Switch aria-labelledby="separate-units-label" checked={access.separateUnits} disabled={!canEdit || update.isPending} onCheckedChange={toggle} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
