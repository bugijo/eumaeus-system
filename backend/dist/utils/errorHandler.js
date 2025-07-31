"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = handleError;
exports.handleValidationError = handleValidationError;
function handleError(error, res, customMessage) {
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
function handleValidationError(error, res) {
    if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.errors
        });
    }
    if (error instanceof Error && error.message.includes('P2002')) {
        return res.status(409).json({
            error: 'Conflito: dados já existem'
        });
    }
    return handleError(error, res);
}
//# sourceMappingURL=errorHandler.js.map