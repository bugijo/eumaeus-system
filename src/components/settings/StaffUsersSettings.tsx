import React, { useState } from 'react';
import { KeyRound, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ROLE_LABELS, StaffRole, StaffUser, apiErrorMessage,
  useCreateStaffUser, useMyAccess, useResetStaffPassword, useStaffRoles, useStaffUsers, useUpdateStaffUser,
} from '@/api/userApi';
import PermissionsDialog from './PermissionsDialog';

const ROLE_ORDER: StaffRole[] = ['DONO', 'VETERINARIO', 'RECEPCAO', 'AUXILIAR', 'BANHO_TOSA', 'FINANCEIRO'];
const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
export const SENHA_REGRAS_TEXTO = 'Mínimo de 10 caracteres, com letras e números.';

export default function StaffUsersSettings({ currentUserId, currentEmail }: { currentUserId?: number; currentEmail?: string }) {
  const { data: users = [], isLoading, error } = useStaffUsers();
  const { data: roles = [] } = useStaffRoles();
  const create = useCreateStaffUser();
  const update = useUpdateStaffUser();
  const reset = useResetStaffPassword();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'RECEPCAO' as StaffRole, password: '' });
  const [resetFor, setResetFor] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [permissionsFor, setPermissionsFor] = useState<StaffUser | null>(null);
  const { data: access } = useMyAccess();

  const isSelf = (user: StaffUser) => user.id === currentUserId || (!!currentEmail && user.email === currentEmail);
  const roleDescription = (role: string) => roles.find((item) => item.name === role)?.description;

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success(`Acesso criado para ${form.name}. Entregue a senha pessoalmente.`);
      setForm({ name: '', email: '', role: 'RECEPCAO', password: '' });
      setCreating(false);
    } catch (err) { toast.error(apiErrorMessage(err, 'Não foi possível criar o acesso')); }
  };

  const change = async (user: StaffUser, data: { role?: StaffRole; active?: boolean }) => {
    try {
      await update.mutateAsync({ id: user.id, ...data });
      toast.success(data.active === false ? `${user.name} desativado(a); a sessão foi encerrada` : 'Usuário atualizado');
    } catch (err) { toast.error(apiErrorMessage(err)); }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetFor) return;
    try {
      await reset.mutateAsync({ id: resetFor.id, password: newPassword });
      toast.success(`Senha de ${resetFor.name} redefinida`);
      setResetFor(null); setNewPassword('');
    } catch (err) { toast.error(apiErrorMessage(err, 'Não foi possível redefinir a senha')); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Equipe e acessos</CardTitle>
          <CardDescription>Cada pessoa tem o próprio login. O cargo traz um padrão de acessos, e você pode mudar o que cada um vê em "Acessos".</CardDescription>
        </div>
        <Button onClick={() => setCreating(true)}><UserPlus className="mr-2 h-4 w-4" /> Novo acesso</Button>
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-destructive">{apiErrorMessage(error, 'Não foi possível carregar a equipe')}</p> : isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Cargo</TableHead><TableHead>Acessos</TableHead><TableHead>Ativo</TableHead><TableHead className="text-right">Senha</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.active ? '' : 'opacity-60'}>
                    <TableCell className="font-medium">{user.name} {isSelf(user) && <Badge variant="secondary" className="ml-1">você</Badge>}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <select aria-label={`Cargo de ${user.name}`} className={selectClass} value={user.role === 'FUNCIONARIO' ? 'RECEPCAO' : user.role} disabled={isSelf(user) || update.isPending} onChange={(e) => change(user, { role: e.target.value as StaffRole })}>
                        {ROLE_ORDER.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      {user.role === 'DONO' ? <span className="text-sm text-muted-foreground">Acesso total</span> : (
                        <Button variant="outline" size="sm" onClick={() => setPermissionsFor(user)} disabled={isSelf(user)}>
                          <ShieldCheck className="mr-1 h-4 w-4" /> {user.permissions ? `Personalizado (${user.permissions.length})` : 'Padrão do cargo'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell><Switch aria-label={`Acesso ativo de ${user.name}`} checked={user.active} disabled={isSelf(user) || update.isPending} onCheckedChange={(active) => change(user, { active })} /></TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => { setResetFor(user); setNewPassword(''); }}><KeyRound className="mr-1 h-4 w-4" /> Redefinir</Button></TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Nenhum usuário.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          {ROLE_ORDER.map((role) => <p key={role}><span className="font-medium text-foreground">{ROLE_LABELS[role]}:</span> {roleDescription(role) || '—'}</p>)}
        </div>
      </CardContent>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <form onSubmit={submitCreate} className="space-y-4">
            <DialogHeader><DialogTitle>Novo acesso</DialogTitle><DialogDescription>A pessoa entra com este e-mail e a senha que você definir.</DialogDescription></DialogHeader>
            <div className="space-y-2"><Label htmlFor="staff-name">Nome</Label><Input id="staff-name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} required /></div>
            <div className="space-y-2"><Label htmlFor="staff-email">E-mail</Label><Input id="staff-email" type="email" autoComplete="off" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} required /></div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Cargo</Label>
              <select id="staff-role" className={selectClass} value={form.role} onChange={(e) => setForm((v) => ({ ...v, role: e.target.value as StaffRole }))}>
                {ROLE_ORDER.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">{roleDescription(form.role)}</p>
            </div>
            <div className="space-y-2"><Label htmlFor="staff-password">Senha inicial</Label><Input id="staff-password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} required minLength={10} /><p className="text-xs text-muted-foreground">{SENHA_REGRAS_TEXTO}</p></div>
            <DialogFooter><Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Criando…' : 'Criar acesso'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {permissionsFor && <PermissionsDialog user={permissionsFor} access={access} roles={roles} onClose={() => setPermissionsFor(null)} />}

      <Dialog open={!!resetFor} onOpenChange={(open) => !open && setResetFor(null)}>
        <DialogContent>
          <form onSubmit={submitReset} className="space-y-4">
            <DialogHeader><DialogTitle>Redefinir senha</DialogTitle><DialogDescription>{resetFor?.name} precisará entrar de novo com a nova senha.</DialogDescription></DialogHeader>
            <div className="space-y-2"><Label htmlFor="reset-password">Nova senha</Label><Input id="reset-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={10} /><p className="text-xs text-muted-foreground">{SENHA_REGRAS_TEXTO}</p></div>
            <DialogFooter><Button type="button" variant="ghost" onClick={() => setResetFor(null)}>Cancelar</Button><Button type="submit" disabled={reset.isPending}>Salvar senha</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
