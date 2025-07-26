const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testando login do tutor...');
    
    const response = await axios.post('http://localhost:3333/api/auth/login', {
      email: 'tutor@example.com',
      password: '***REMOVIDO***'
    });
    
    console.log('✅ Login bem-sucedido!');
    console.log('📋 Resposta:', {
      status: response.status,
      userType: response.data.user?.type,
      token: response.data.token ? 'Token presente' : 'Token ausente',
      refreshToken: response.data.refreshToken ? 'RefreshToken presente' : 'RefreshToken ausente'
    });
    
  } catch (error) {
    console.error('❌ Erro no login:');
    console.error('   Status:', error.response?.status);
    console.error('   Mensagem:', error.response?.data?.message || error.message);
  }
}

testLogin();