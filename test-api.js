import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3333/api';

async function testLogin(email, password, userType) {
  try {
    console.log(`\n🧪 Testando login para ${userType}: ${email}`);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login bem-sucedido!');
      console.log('📋 Dados retornados:');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - User Type: ${data.user?.type || 'N/A'}`);
      console.log(`   - User Name: ${data.user?.name || 'N/A'}`);
      console.log(`   - User Role: ${data.user?.role || 'N/A'}`);
      console.log(`   - Access Token: ${data.accessToken ? 'Presente' : 'Ausente'}`);
      console.log(`   - Refresh Token: ${data.refreshToken ? 'Presente' : 'Ausente'}`);
      
      // Testar se o token é válido decodificando-o
      if (data.accessToken) {
        const tokenParts = data.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('🔍 Payload do JWT:');
          console.log(`   - ID: ${payload.id}`);
          console.log(`   - Type: ${payload.type}`);
          console.log(`   - Role: ${payload.role || 'N/A'}`);
          console.log(`   - Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
        }
      }
      
      return { success: true, data };
    } else {
      console.log('❌ Login falhou!');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Erro: ${data.message || 'Erro desconhecido'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('💥 Erro na requisição:');
    console.log(`   - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testRefreshToken(refreshToken) {
  try {
    console.log('\n🔄 Testando refresh token...');
    
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Refresh bem-sucedido!');
      console.log(`   - Novo Access Token: ${data.accessToken ? 'Presente' : 'Ausente'}`);
      console.log(`   - Novo Refresh Token: ${data.refreshToken ? 'Presente' : 'Ausente'}`);
      return { success: true, data };
    } else {
      console.log('❌ Refresh falhou!');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Erro: ${data.message || 'Erro desconhecido'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('💥 Erro na requisição de refresh:');
    console.log(`   - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes da API de autenticação dual...');
  console.log('=' .repeat(60));

  // Teste 1: Login com credenciais inválidas
  await testLogin('invalid@email.com', 'wrongpassword', 'Credenciais Inválidas');

  // Teste 2: Login como Admin (User)
  const adminResult = await testLogin('admin@clinic.local', 'admin123', 'Admin User');

  // Teste 3: Login como Veterinário (User)
  await testLogin('vet@clinic.local', 'vet123', 'Veterinário User');

  // Teste 4: Login como Tutor
  const tutorResult = await testLogin('tutor@example.com', '123456', 'Tutor');

  // Teste 5: Refresh Token (se o login do admin foi bem-sucedido)
  if (adminResult.success && adminResult.data.refreshToken) {
    await testRefreshToken(adminResult.data.refreshToken);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎯 Testes concluídos!');
  console.log('\n📝 Resumo dos testes:');
  console.log('   1. ❌ Credenciais inválidas - deve falhar');
  console.log('   2. ✅ Login Admin - deve retornar type: "user", role: "ADMIN"');
  console.log('   3. ✅ Login Veterinário - deve retornar type: "user", role: "VET"');
  console.log('   4. ✅ Login Tutor - deve retornar type: "tutor"');
  console.log('   5. ✅ Refresh Token - deve gerar novos tokens');
}

// Executar os testes
runTests().catch(console.error);