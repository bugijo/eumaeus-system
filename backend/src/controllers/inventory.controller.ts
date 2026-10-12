import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const actor = (req: Request) => (req as AuthenticatedRequest).user?.id;
export const inventoryController = {
  async receive(req: Request, res: Response) { try { return res.status(201).json({ success: true, data: await InventoryService.receive({ ...req.body, productId: Number(req.body.productId), quantity: Number(req.body.quantity), authorizedByUserId: actor(req) }) }); } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Entrada recusada' }); } },
  async issue(req: Request, res: Response) { try { return res.status(201).json({ success: true, data: await InventoryService.issue({ ...req.body, productId: Number(req.body.productId), lotId: Number(req.body.lotId), quantity: Number(req.body.quantity), appointmentId: req.body.appointmentId ? Number(req.body.appointmentId) : undefined, authorizedByUserId: actor(req) }) }); } catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Saída recusada' }); } },
  async change(req: Request, res: Response) { try { return res.status(201).json({ success: true, data: await InventoryService.change({ ...req.body, type: String(req.body.type).toUpperCase(), productId: Number(req.body.productId), lotId: Number(req.body.lotId), quantity: Number(req.body.quantity), appointmentId: req.body.appointmentId ? Number(req.body.appointmentId) : undefined, authorizedByUserId: actor(req) } as any) }); } catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Movimento recusado' }); } },
  async adjustment(req: Request, res: Response) { return inventoryController.change({ ...req, body: { ...req.body, type: 'ADJUSTMENT' } } as Request, res); },
  async loss(req: Request, res: Response) { return inventoryController.change({ ...req, body: { ...req.body, type: 'LOSS' } } as Request, res); },
  async returnStock(req: Request, res: Response) { return inventoryController.change({ ...req, body: { ...req.body, type: 'RETURN' } } as Request, res); },
  async movements(req: Request, res: Response) { return res.json({ success: true, data: await InventoryService.list(req.query.productId ? Number(req.query.productId) : undefined) }); },
  async lots(req: Request, res: Response) { return res.json({ success: true, data: await InventoryService.listLots(req.query.productId ? Number(req.query.productId) : undefined) }); },
};
