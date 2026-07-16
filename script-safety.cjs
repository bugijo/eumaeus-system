'use strict';

const ALLOWED_SCRIPT_ENVIRONMENTS = new Set(['development', 'test']);

function assertMutationScriptAllowed(optInVariable, environment = process.env) {
  const nodeEnvironment = environment.NODE_ENV?.trim().toLowerCase();

  if (!nodeEnvironment || !ALLOWED_SCRIPT_ENVIRONMENTS.has(nodeEnvironment)) {
    throw new Error(`Script bloqueado: NODE_ENV deve ser development ou test; ${optInVariable} não foi utilizado`);
  }

  if (environment[optInVariable]?.trim().toLowerCase() !== 'true') {
    throw new Error(`Script bloqueado: defina ${optInVariable}=true para confirmar a mutação`);
  }
}

function requireScriptSecret(name, environment = process.env) {
  const value = environment[name];

  if (!value || value.trim() !== value || value.length < 12) {
    throw new Error(`${name} é obrigatória e deve ter pelo menos 12 caracteres`);
  }

  return value;
}

module.exports = { assertMutationScriptAllowed, requireScriptSecret };
