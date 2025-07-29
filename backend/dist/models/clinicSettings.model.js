"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TEMPLATES = exports.TEMPLATE_VARIABLES = void 0;
exports.TEMPLATE_VARIABLES = {
    appointment: [
        '{tutor}',
        '{pet}',
        '{data}',
        '{hora}',
        '{clinica}',
        '{telefone}'
    ],
    vaccine: [
        '{tutor}',
        '{pet}',
        '{vacina}',
        '{data}',
        '{clinica}',
        '{telefone}'
    ]
};
exports.DEFAULT_TEMPLATES = {
    appointment: "Olá {tutor}! Não se esqueça da consulta do {pet} amanhã às {hora}. Até logo!",
    vaccine: "Olá {tutor}! A vacina {vacina} do {pet} está próxima do vencimento em {data}. Agende a revacinação!"
};
//# sourceMappingURL=clinicSettings.model.js.map