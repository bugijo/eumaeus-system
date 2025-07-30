import { Response } from 'express';

export function handleError(error: unknown, res: Response, customMessage?: string): Response {
  if (error instanceof Error) {
    console.error('Erro:', error.message);
    return res.status(500).json({ 
      error: customMessage || 'Erro interno do servidor',
      message: error.message 
    });
  }
  
  console.error('Erro desconhecido:', error);
  return res.status(500).json({ 
    error: customMessage || 'Ocorreu um erro desconhecido' 
  });
}

export function handleValidationError(error: unknown, res: Response): Response {
  // Para erros de validação do Zod ou Prisma
  if (error instanceof Error && error.name === 'ZodError') {
    return res.status(400).json({ 
      error: 'Dados inválidos', 
      details: (error as any).errors 
    });
  }
  
  if (error instanceof Error && error.message.includes('P2002')) {
    return res.status(409).json({ 
      error: 'Conflito: dados já existem' 
    });
  }
  
  return handleError(error, res);
}