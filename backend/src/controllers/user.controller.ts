import { Request, Response } from 'express';
import { UserService, UserServiceError } from '../services/user.service';

const fail = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof UserServiceError) return res.status(error.status).json({ error: error.message });
  if ((error as any)?.code === 'P2002') return res.status(409).json({ error: 'Já existe um acesso com este e-mail' });
  console.error(`[users] ${fallback}`);
  return res.status(500).json({ error: fallback });
};

export const userController = {
  roles(_req: Request, res: Response) { return res.json(UserService.roles()); },
  async myAccess(_req: Request, res: Response) { try { return res.json(await UserService.myAccess()); } catch (error) { return fail(res, error, 'Falha ao carregar acessos'); } },
  async list(_req: Request, res: Response) { try { return res.json(await UserService.list()); } catch (error) { return fail(res, error, 'Falha ao listar usuários'); } },
  async create(req: Request, res: Response) {
    try { return res.status(201).json(await UserService.create({ name: req.body?.name, email: req.body?.email, role: req.body?.role, password: req.body?.password, permissions: req.body?.permissions })); }
    catch (error) { return fail(res, error, 'Falha ao criar usuário'); }
  },
  async update(req: Request, res: Response) {
    try { return res.json(await UserService.update(Number(req.params.id), { name: req.body?.name, role: req.body?.role, active: req.body?.active, permissions: req.body?.permissions })); }
    catch (error) { return fail(res, error, 'Falha ao atualizar usuário'); }
  },
  async resetPassword(req: Request, res: Response) {
    try { return res.json(await UserService.resetPassword(Number(req.params.id), req.body?.password)); }
    catch (error) { return fail(res, error, 'Falha ao redefinir senha'); }
  },
  async changeOwnPassword(req: Request, res: Response) {
    try { return res.json(await UserService.changeOwnPassword(req.body?.currentPassword, req.body?.newPassword)); }
    catch (error) { return fail(res, error, 'Falha ao trocar senha'); }
  },
};
