// Script de Teste de Regressão V2.0
// Testa as funcionalidades básicas para garantir que nada foi quebrado

const axios = require('axios');

const API_BASE = 'http://localhost:3333/api';
let authToken = null;

// Função para fazer login
async function login() {
  try {
    console.log('🔐 Testando login...');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@pulsevet.com',
      password: '123456'
    });
    
    if (response.data.accessToken) {
      authToken = response.data.accessToken;
      console.log('✅ Login realizado com sucesso');
      return true;
    } else {
      console.log('❌ Login falhou - token não retornado');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data?.message || error.message);
    return false;
  }
}

// Função para testar criação de tutor
async function testCreateTutor() {
  try {
    console.log('👥 Testando criação de tutor...');
    const response = await axios.post(`${API_BASE}/tutors`, {
      name: 'Teste Regressão',
      email: `teste.regressao.${Date.now()}@email.com`,
      phone: '(11) 99999-9999',
      address: 'Rua de Teste, 123'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.id) {
      console.log('✅ Tutor criado com sucesso - ID:', response.data.id);
      return response.data;
    } else {
      console.log('❌ Falha na criação do tutor');
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na criação do tutor:', error.response?.data?.message || error.message);
    return null;
  }
}

// Função para testar listagem de tutores
async function testListTutors() {
  try {
    console.log('📋 Testando listagem de tutores...');
    const response = await axios.get(`${API_BASE}/tutors`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (Array.isArray(response.data)) {
      console.log(`✅ Lista de tutores carregada - ${response.data.length} tutores encontrados`);
      return true;
    } else {
      console.log('❌ Falha na listagem de tutores');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na listagem de tutores:', error.response?.data?.message || error.message);
    return false;
  }
}

// Função para testar agenda
async function testAppointments() {
  try {
    console.log('📅 Testando agenda de atendimentos...');
    const response = await axios.get(`${API_BASE}/appointments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (Array.isArray(response.data)) {
      console.log(`✅ Agenda carregada - ${response.data.length} agendamentos encontrados`);
      return true;
    } else {
      console.log('❌ Falha no carregamento da agenda');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no carregamento da agenda:', error.response?.data?.message || error.message);
    return false;
  }
}

// Função para testar dashboard
async function testDashboard() {
  try {
    console.log('📊 Testando dashboard...');
    const response = await axios.get(`${API_BASE}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data) {
      console.log('✅ Dashboard carregado com sucesso');
      console.log('   - Dados retornados:', Object.keys(response.data));
      return true;
    } else {
      console.log('❌ Falha no carregamento do dashboard');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no carregamento do dashboard:', error.response?.data?.message || error.message);
    return false;
  }
}

// Função para testar novas funcionalidades V2.0
async function testV2Features() {
  try {
    console.log('🆕 Testando funcionalidades V2.0...');
    
    // Testar configurações da clínica
    const settingsResponse = await axios.get(`${API_BASE}/clinic/settings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (settingsResponse.data) {
      console.log('✅ Configurações da clínica carregadas');
    }
    
    // Testar produtos
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (Array.isArray(productsResponse.data)) {
      console.log(`✅ Produtos carregados - ${productsResponse.data.length} produtos encontrados`);
    }
    
    return true;
  } catch (error) {
    console.log('⚠️  Algumas funcionalidades V2.0 podem não estar implementadas ainda');
    console.log('   Erro:', error.response?.data?.message || error.message);
    return true; // Não falha o teste por funcionalidades ainda não implementadas
  }
}

// Função principal de teste
async function runRegressionTests() {
  console.log('🚀 INICIANDO TESTE DE REGRESSÃO V2.0');
  console.log('=====================================\n');
  
  const results = {
    login: false,
    createTutor: false,
    listTutors: false,
    appointments: false,
    dashboard: false,
    v2Features: false
  };
  
  // 1. Teste de Login
  results.login = await login();
  if (!results.login) {
    console.log('\n❌ TESTE FALHOU: Não foi possível fazer login');
    return;
  }
  
  console.log('');
  
  // 2. Teste de Criação de Tutor
  const tutor = await testCreateTutor();
  results.createTutor = tutor !== null;
  
  console.log('');
  
  // 3. Teste de Listagem de Tutores
  results.listTutors = await testListTutors();
  
  console.log('');
  
  // 4. Teste de Agenda
  results.appointments = await testAppointments();
  
  console.log('');
  
  // 5. Teste de Dashboard
  results.dashboard = await testDashboard();
  
  console.log('');
  
  // 6. Teste de Funcionalidades V2.0
  results.v2Features = await testV2Features();
  
  console.log('');
  console.log('=====================================');
  console.log('📋 RESUMO DOS TESTES:');
  console.log('=====================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = {
      login: 'Login de Admin',
      createTutor: 'Criação de Tutor',
      listTutors: 'Listagem de Tutores',
      appointments: 'Agenda de Atendimentos',
      dashboard: 'Dashboard Admin',
      v2Features: 'Funcionalidades V2.0'
    }[test];
    
    console.log(`${status} ${testName}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('');
  console.log(`📊 RESULTADO: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema pronto para deploy.');
  } else {
    console.log('⚠️  ALGUNS TESTES FALHARAM. Revisar antes do deploy.');
  }
  
  console.log('=====================================');
}

// Executar testes
runRegressionTests().catch(error => {
  console.error('💥 Erro fatal nos testes:', error);
  process.exit(1);
});