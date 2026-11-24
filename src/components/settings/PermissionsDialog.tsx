import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ROLE_LABELS, StaffRoleInfo, StaffUser, apiErrorMessage, useUpdateStaffUser } from '@/api/userApi';
import type { MyAccess, PermissionKey } from '@/lib/access';

/** O dono escolhe, módulo a módulo, o que um funcionário pode abrir. Itens fora do plano ficam travados. */
export default function PermissionsDialog({ user, access, roles, onClose }: {
  user: StaffUser | null;
  access: MyAccess | undefined;
  roles: StaffRoleInfo[];
  onClose: () => void;
}) {
  const update = useUpdateStaffUser();
  const roleDefault = useMemo(
    () => roles.find((item) => item.name === (user?.role === 'FUNCIONARIO' ? 'RECEPCAO' : user?.role))?.defaultPermissions ?? [],
    [roles, user],
  );
  const [selected, setSelected] = useState<Set<PermissionKey>>(new Set());

  useEffect(() => {
    if (user) setSelected(new Set(user.permissions ?? roleDefault));
  }, [user, roleDefault]);

  if (!user) return null;
  const inPlan = (key: PermissionKey) => access?.planPermissions.includes(key) ?? true;
  const groups = Array.from(new Set((access?.catalog ?? []).map((item) => item.group)));

  const toggle = (key: PermissionKey, on: boolean) => setSelected((current) => {
    const next = new Set(current);
    if (on) next.add(key); else next.delete(key);
    return next;
  });

  const save = async (permissions: PermissionKey[] | null) => {
    try {
      await update.mutateAsync({ id: user.id, permissions });
      toast.success(permissions === null ? `${user.name} voltou ao padrão do cargo` : `Acessos de ${user.name} salvos. A sessão dela foi encerrada para valer na hora.`);
      onClose();
    } catch (err) { toast.error(apiErrorMessage(err, 'Não foi possível salvar os acessos')); }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const ordered = (access?.catalog ?? []).map((item) => item.key).filter((key) => selected.has(key));
    save(ordered);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Acessos de {user.name}</DialogTitle>
            <DialogDescription>
              Cargo: {ROLE_LABELS[user.role] ?? user.role}. {user.permissions ? 'Acessos escolhidos por você.' : 'Hoje segue o padrão do cargo.'} Marque o que essa pessoa pode abrir.
            </DialogDescription>
          </DialogHeader>

          {groups.map((group) => (
            <fieldset key={group} className="space-y-2">
              <legend className="mb-1 text-sm font-semibold">{group}</legend>
              {(access?.catalog ?? []).filter((item) => item.group === group).map((item) => {
                const id = `perm-${user.id}-${item.key}`;
                const locked = !inPlan(item.key);
                return (
                  <label key={item.key} htmlFor={id} className={`flex items-start gap-3 rounded-lg border border-border p-3 ${locked ? 'opacity-55' : 'cursor-pointer hover:bg-muted/50'}`}>
                    <Checkbox id={id} checked={!locked && selected.has(item.key)} disabled={locked} onCheckedChange={(on) => toggle(item.key, on === true)} className="mt-0.5" />
                    <span>
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{locked ? 'Não faz parte do seu plano.' : item.description}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ))}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => save(null)} disabled={update.isPending || !user.permissions}>
              Voltar ao padrão do cargo
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Salvando…' : 'Salvar acessos'}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
