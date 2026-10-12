import { Request, Response } from 'express';
import { PackageService } from '../services/package.service';

export const packageController = {
  async list(_req: Request, res: Response) { return res.json({ success: true, data: await PackageService.listPackages() }); },
  async create(req: Request, res: Response) {
    try { return res.status(201).json({ success: true, data: await PackageService.createPackage({ ...req.body, price: Number(req.body.price), totalSessions: Number(req.body.totalSessions), validityDays: Number(req.body.validityDays), coveredCatalogServiceId: Number(req.body.coveredCatalogServiceId) }) }); }
    catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Pacote inválido' }); }
  },
  async purchase(req: Request, res: Response) {
    try { return res.status(201).json({ success: true, data: await PackageService.purchase(Number(req.params.packageId), Number(req.body.tutorId), Number(req.body.petId)) }); }
    catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Compra inválida' }); }
  },
  async consume(req: Request, res: Response) {
    try { return res.status(201).json({ success: true, data: await PackageService.consume(Number(req.params.contractId), Number(req.body.appointmentId), Number(req.body.serviceId)) }); }
    catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Consumo recusado' }); }
  },
  async reverse(req: Request, res: Response) {
    try { return res.json({ success: true, data: await PackageService.reverse(Number(req.params.sessionId), String(req.body.reason ?? '')) }); }
    catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Estorno recusado' }); }
  },
  async getContract(req: Request, res: Response) { const data = await PackageService.getContract(Number(req.params.contractId)); return data ? res.json({ success: true, data }) : res.status(404).json({ error: 'Contrato não encontrado' }); },
};
