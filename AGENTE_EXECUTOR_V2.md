# 🤖 Agente Executor v2.0 - Sistema de Ações Genérico

## 📋 Visão Geral

O Agente Executor foi refatorado para usar um sistema de "ações" mais genérico e flexível. Agora ele suporta múltiplas funcionalidades através de um único endpoint `/execute-action`.

## 🚀 Funcionalidades

### ✅ Ações Disponíveis

1. **`create_branch`** - Cria um novo branch Git
2. **`run_tests`** - Executa testes do Playwright

### 🔄 Migração do Endpoint

- **Antes**: `/execute-git` (específico)
- **Agora**: `/execute-action` (genérico)

## 📡 API Reference

### Endpoint Principal

```http
POST /execute-action
Content-Type: application/json
```

### Estrutura do Request

```json
{
  "action": "nome_da_acao",
  "payload": {
    // parâmetros específicos da ação
  }
}
```

## 🎯 Exemplos de Uso

### 1️⃣ Criar Branch Git

**Request:**
```json
{
  "action": "create_branch",
  "payload": {
    "branch_name": "feature/nova-funcionalidade"
  }
}
```

**Response (Sucesso):**
```json
{
  "status": "success",
  "action": "create_branch",
  "branch_name": "feature/nova-funcionalidade",
  "results": [
    {
      "command": "git checkout -b feature/nova-funcionalidade",
      "exit_code": 0,
      "stdout": "Switched to a new branch 'feature/nova-funcionalidade'",
      "stderr": ""
    },
    {
      "command": "git push -u origin feature/nova-funcionalidade",
      "exit_code": 0,
      "stdout": "Branch 'feature/nova-funcionalidade' set up to track remote branch",
      "stderr": ""
    }
  ]
}
```

### 2️⃣ Executar Testes

**Request:**
```json
{
  "action": "run_tests",
  "payload": {}
}
```

**Response (Sucesso):**
```json
{
  "status": "success",
  "action": "run_tests",
  "exit_code": 0,
  "stdout": "Running 6 tests using 3 workers\n\n  ✓ example.spec.ts:3:1 › has title (chromium)\n  ✓ example.spec.ts:9:1 › get started link (chromium)\n  ✓ login.spec.ts:4:1 › should display login form (chromium)\n\n  6 passed (2.1s)",
  "stderr": "",
  "command": "npx playwright test",
  "project_path": "/path/to/project"
}
```

**Response (Falha nos Testes):**
```json
{
  "status": "success",
  "action": "run_tests",
  "exit_code": 1,
  "stdout": "Running 6 tests using 3 workers\n\n  ✗ login.spec.ts:4:1 › should display login form (chromium)\n\n  3 failed, 3 passed (2.1s)",
  "stderr": "Error: page.goto: Could not connect to server",
  "command": "npx playwright test",
  "project_path": "/path/to/project"
}
```

## 🔧 Instalação e Configuração

### 1️⃣ Instalar Dependências Python

```bash
pip install -r requirements.txt
```

### 2️⃣ Executar o Agente

```bash
python agent.py
```

### 3️⃣ Verificar Saúde

```bash
curl http://127.0.0.1:5000/health
```

## 🌐 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|----------|
| `/` | GET | Informações do agente |
| `/health` | GET | Verificação de saúde |
| `/execute-action` | POST | Execução de ações |

## 🎯 Lógica de Resposta

### ✅ Sucesso (Status 200)
- Comando executado com sucesso
- Inclui `stdout`, `stderr` e `exit_code`
- Mesmo se os testes falharem, a execução é considerada bem-sucedida

### ❌ Erro (Status 400/500)
- JSON inválido
- Ação não reconhecida
- Parâmetros obrigatórios ausentes
- Erro interno do sistema

## 🔍 Tratamento de Erros

### Ação Não Reconhecida
```json
{
  "status": "error",
  "message": "Ação 'acao_inexistente' não reconhecida",
  "available_actions": ["create_branch", "run_tests"]
}
```

### Parâmetros Inválidos
```json
{
  "status": "error",
  "action": "create_branch",
  "message": "Nome do branch é obrigatório"
}
```

## 🚀 Próximas Funcionalidades

O sistema foi projetado para ser facilmente extensível. Futuras ações podem incluir:

- `deploy_production` - Deploy para produção
- `run_migrations` - Executar migrações do banco
- `backup_database` - Backup do banco de dados
- `generate_docs` - Gerar documentação
- `run_linter` - Executar linter de código

## 🔧 Desenvolvimento

### Adicionar Nova Ação

1. Criar método `_nova_acao(self, payload)` na classe `AgentExecutor`
2. Adicionar condição no método `execute_action`
3. Documentar a nova ação neste arquivo

### Exemplo de Nova Ação

```python
def _deploy_production(self, payload: dict) -> dict:
    """Deploy para produção"""
    try:
        # Lógica de deploy
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=self.project_path,
            capture_output=True,
            text=True
        )
        
        return {
            "status": "success",
            "action": "deploy_production",
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except Exception as e:
        return {
            "status": "error",
            "action": "deploy_production",
            "message": str(e)
        }
```

---

**Versão:** 2.0  
**Data:** Janeiro 2025  
**Autor:** Sistema Automatizado de Desenvolvimento