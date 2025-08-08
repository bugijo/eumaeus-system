#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Agente Executor - Sistema de Ações Genérico
Versão: 2.0
Descrição: Agente autônomo para execução de tarefas de desenvolvimento
"""

import os
import sys
import subprocess
import json
from flask import Flask, request, jsonify
from pathlib import Path

# Configuração da aplicação Flask
app = Flask(__name__)

# Configuração do projeto
PROJECT_PATH = Path(__file__).parent.absolute()

class AgentExecutor:
    """Classe principal do Agente Executor"""
    
    def __init__(self, project_path: Path):
        self.project_path = project_path
    
    def execute_action(self, action: str, payload: dict) -> dict:
        """Executa uma ação baseada no tipo especificado"""
        
        if action == "create_branch":
            return self._create_branch(payload)
        elif action == "run_tests":
            return self._run_tests(payload)
        else:
            return {
                "status": "error",
                "message": f"Ação '{action}' não reconhecida",
                "available_actions": ["create_branch", "run_tests"]
            }
    
    def _create_branch(self, payload: dict) -> dict:
        """Cria um novo branch Git"""
        try:
            branch_name = payload.get("branch_name")
            if not branch_name:
                return {
                    "status": "error",
                    "action": "create_branch",
                    "message": "Nome do branch é obrigatório"
                }
            
            # Executa comandos Git
            commands = [
                ["git", "checkout", "-b", branch_name],
                ["git", "push", "-u", "origin", branch_name]
            ]
            
            results = []
            for cmd in commands:
                result = subprocess.run(
                    cmd,
                    cwd=self.project_path,
                    capture_output=True,
                    text=True
                )
                results.append({
                    "command": " ".join(cmd),
                    "exit_code": result.returncode,
                    "stdout": result.stdout,
                    "stderr": result.stderr
                })
            
            return {
                "status": "success",
                "action": "create_branch",
                "branch_name": branch_name,
                "results": results
            }
            
        except Exception as e:
            return {
                "status": "error",
                "action": "create_branch",
                "message": str(e)
            }
    
    def _run_tests(self, payload: dict) -> dict:
        """Executa os testes do Playwright"""
        try:
            # Comando para executar os testes
            cmd = ["npx", "playwright", "test"]
            
            # Executa o comando
            result = subprocess.run(
                cmd,
                cwd=self.project_path,
                capture_output=True,
                text=True
            )
            
            return {
                "status": "success",
                "action": "run_tests",
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "command": " ".join(cmd),
                "project_path": str(self.project_path)
            }
            
        except Exception as e:
            return {
                "status": "error",
                "action": "run_tests",
                "message": str(e),
                "command": " ".join(cmd),
                "project_path": str(self.project_path)
            }

# Instância global do agente
agent = AgentExecutor(PROJECT_PATH)

@app.route('/execute-action', methods=['POST'])
def execute_action():
    """Endpoint genérico para execução de ações"""
    try:
        # Valida o JSON de entrada
        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "JSON inválido ou vazio"
            }), 400
        
        # Extrai ação e payload
        action = data.get("action")
        payload = data.get("payload", {})
        
        if not action:
            return jsonify({
                "status": "error",
                "message": "Campo 'action' é obrigatório",
                "expected_format": {
                    "action": "nome_da_acao",
                    "payload": {}
                }
            }), 400
        
        # Executa a ação
        result = agent.execute_action(action, payload)
        
        # Retorna o resultado
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de verificação de saúde"""
    return jsonify({
        "status": "healthy",
        "agent": "Agente Executor v2.0",
        "project_path": str(PROJECT_PATH),
        "available_actions": ["create_branch", "run_tests"]
    })

@app.route('/', methods=['GET'])
def root():
    """Endpoint raiz com informações do agente"""
    return jsonify({
        "message": "Agente Executor - Sistema de Ações Genérico",
        "version": "2.0",
        "endpoints": {
            "/execute-action": "POST - Executa ações genéricas",
            "/health": "GET - Verificação de saúde"
        },
        "actions": {
            "create_branch": {
                "description": "Cria um novo branch Git",
                "payload": {"branch_name": "string"}
            },
            "run_tests": {
                "description": "Executa testes do Playwright",
                "payload": {}
            }
        }
    })

if __name__ == '__main__':
    print("🤖 Agente Executor v2.0 - Sistema de Ações Genérico")
    print(f"📁 Diretório do projeto: {PROJECT_PATH}")
    print("🚀 Iniciando servidor Flask...")
    
    # Configuração do servidor
    host = '127.0.0.1'
    port = 5000
    debug = False  # Desabilitado para evitar problemas no Windows
    
    print(f"🌐 Servidor disponível em: http://{host}:{port}")
    print("📋 Endpoints disponíveis:")
    print(f"   • POST http://{host}:{port}/execute-action")
    print(f"   • GET  http://{host}:{port}/health")
    print("\n✨ Ações disponíveis:")
    print("   • create_branch: Cria um novo branch Git")
    print("   • run_tests: Executa testes do Playwright")
    print("\n🚀 Servidor iniciado com sucesso!")
    
    app.run(host=host, port=port, debug=debug)