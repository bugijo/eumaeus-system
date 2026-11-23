import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLE_LABELS, apiErrorMessage, useChangeOwnPassword } from '@/api/userApi';
import { SENHA_REGRAS_TEXTO } from './StaffUsersSettings';

export default function MyAccountSettings({ name, email, role, onPasswordChanged }: { name?: string; email?: string; role?: string; onPasswordChanged?: () => void }) {
  const change = useChangeOwnPassword();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const mismatch = form.confirm !== '' && form.confirm !== form.newPassword;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mismatch) return;
    try {
      await change.mutateAsync({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Senha alterada. Entre novamente nos outros aparelhos.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      onPasswordChanged?.();
    } catch (err) { toast.error(apiErrorMessage(err, 'Não foi possível alterar a senha')); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Minha conta</CardTitle>
        <CardDescription>{name} · {email} · {ROLE_LABELS[role || ''] || role}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid max-w-md gap-4">
          <div className="space-y-2"><Label htmlFor="me-current">Senha atual</Label><Input id="me-current" type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm((v) => ({ ...v, currentPassword: e.target.value }))} required /></div>
          <div className="space-y-2"><Label htmlFor="me-new">Nova senha</Label><Input id="me-new" type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm((v) => ({ ...v, newPassword: e.target.value }))} required minLength={10} /><p className="text-xs text-muted-foreground">{SENHA_REGRAS_TEXTO}</p></div>
          <div className="space-y-2"><Label htmlFor="me-confirm">Confirmar nova senha</Label><Input id="me-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((v) => ({ ...v, confirm: e.target.value }))} required aria-invalid={mismatch} />{mismatch && <p className="text-xs text-destructive">As senhas não conferem.</p>}</div>
          <Button type="submit" className="w-fit" disabled={change.isPending || mismatch}>{change.isPending ? 'Salvando…' : 'Alterar senha'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
