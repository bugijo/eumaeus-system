const axios = require('axios');

async function testConnection() {
  console.log('🔍 Testando conectividade com o backend...');
  
  try {
    // Teste básico de conectividade
    console.log('1. Testando conexão básica...');
    const healthCheck = await axios.get('http://localhost:3333/api/tutors', {
      timeout: 5000
    });
    console.log('✅ Conexão com backend OK');
    
    // Teste de login
    console.log('2. Testando login do tutor...');
    const loginResponse = await axios.post('http://localhost:3333/api/auth/login', {
      email: 'tutor@example.com',
      password: '123456'
    }, {
      timeout: 5000
    });
    
    console.log('✅ Login bem-sucedido!');
    console.log('📋 Dados do usuário:', {
      status: loginResponse.status,
      userType: loginResponse.data.user?.type,
      userName: loginResponse.data.user?.name,
      userEmail: loginResponse.data.user?.email,
      hasToken: !!loginResponse.data.accessToken,
      hasRefreshToken: !!loginResponse.data.refreshToken
    });
    
  } catch (error) {
    console.error('❌ Erro detalhado:');
    console.error('   Código:', error.code);
    console.error('   Status:', error.response?.status);
    console.error('   Mensagem:', error.response?.data?.message || error.message);
    console.error('   URL:', error.config?.url);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Backend não está respondendo na porta 3333');
    }
  }
}

testConnection();