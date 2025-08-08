#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Teste do Agente Executor v2.0
Testa as funcionalidades do sistema de ações genérico
"""

import requests
import json
import time

# Configuração
AGENT_URL = "http://127.0.0.1:5000"

def test_health_check():
    """Testa o endpoint de verificação de saúde"""
    print("🔍 Testando verificação de saúde...")
    try:
        response = requests.get(f"{AGENT_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Saúde OK: {data['status']}")
            print(f"📋 Ações disponíveis: {data['available_actions']}")
            return True
        else:
            print(f"❌ Erro na verificação de saúde: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def test_run_tests_action():
    """Testa a ação de executar testes do Playwright"""
    print("\n🧪 Testando execução de testes do Playwright...")
    try:
        payload = {
            "action": "run_tests",
            "payload": {}
        }
        
        response = requests.post(
            f"{AGENT_URL}/execute-action",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Ação executada: {data['action']}")
            print(f"📊 Exit code: {data.get('exit_code', 'N/A')}")
            print(f"🔧 Comando: {data.get('command', 'N/A')}")
            
            if data.get('stdout'):
                print(f"📝 Saída padrão (primeiras 200 chars):")
                print(data['stdout'][:200] + "..." if len(data['stdout']) > 200 else data['stdout'])
            
            if data.get('stderr'):
                print(f"⚠️ Saída de erro (primeiras 200 chars):")
                print(data['stderr'][:200] + "..." if len(data['stderr']) > 200 else data['stderr'])
            
            # Debug: mostrar toda a resposta se houver problemas
            print(f"🔍 Resposta completa: {json.dumps(data, indent=2)}")
            
            return True
        else:
            print(f"❌ Erro na execução: {response.status_code}")
            print(f"📄 Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def test_create_branch_action():
    """Testa a ação de criar branch (simulação)"""
    print("\n🌿 Testando criação de branch Git...")
    try:
        payload = {
            "action": "create_branch",
            "payload": {
                "branch_name": "test/agente-executor-v2"
            }
        }
        
        response = requests.post(
            f"{AGENT_URL}/execute-action",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Ação executada: {data['action']}")
            print(f"🌿 Branch: {data.get('branch_name', 'N/A')}")
            
            if 'results' in data:
                for i, result in enumerate(data['results']):
                    print(f"📋 Comando {i+1}: {result['command']}")
                    print(f"   Exit code: {result['exit_code']}")
                    if result['stdout']:
                        print(f"   Saída: {result['stdout'][:100]}...")
                    if result['stderr']:
                        print(f"   Erro: {result['stderr'][:100]}...")
            
            return True
        else:
            print(f"❌ Erro na execução: {response.status_code}")
            print(f"📄 Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def test_invalid_action():
    """Testa uma ação inválida"""
    print("\n🚫 Testando ação inválida...")
    try:
        payload = {
            "action": "acao_inexistente",
            "payload": {}
        }
        
        response = requests.post(
            f"{AGENT_URL}/execute-action",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'error':
                print(f"✅ Erro esperado capturado: {data['message']}")
                print(f"📋 Ações disponíveis: {data.get('available_actions', [])}")
                return True
            else:
                print(f"❌ Resposta inesperada: {data}")
                return False
        else:
            print(f"❌ Status code inesperado: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def main():
    """Função principal de teste"""
    print("🤖 Iniciando testes do Agente Executor v2.0")
    print("=" * 50)
    
    # Aguarda o servidor estar pronto
    print("⏳ Aguardando servidor estar pronto...")
    time.sleep(2)
    
    tests = [
        ("Verificação de Saúde", test_health_check),
        ("Execução de Testes", test_run_tests_action),
        ("Criação de Branch", test_create_branch_action),
        ("Ação Inválida", test_invalid_action)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        success = test_func()
        results.append((test_name, success))
    
    # Resumo dos resultados
    print("\n" + "="*50)
    print("📊 RESUMO DOS TESTES")
    print("="*50)
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"{test_name}: {status}")
        if success:
            passed += 1
    
    total = len(results)
    print(f"\n🎯 Resultado Final: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 Todos os testes passaram! Agente Executor v2.0 está funcionando perfeitamente!")
    else:
        print(f"⚠️ {total - passed} teste(s) falharam. Verifique os logs acima.")

if __name__ == "__main__":
    main()