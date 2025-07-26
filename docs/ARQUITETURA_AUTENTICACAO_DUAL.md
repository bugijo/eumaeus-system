# Arquitetura de Autenticação Dual - V2.0

## Visão Geral

A V2.0 do PulseVet System introduz uma arquitetura de autenticação dual que permite dois tipos de usuários:
- **Users**: Funcionários da clínica (veterinários, atendentes, etc.)
- **Tutors**: Clientes que acessam o Portal do Cliente

## Modelo de Dados

### AuthProfile (Novo)
Modelo central que gerencia **apenas** as credenciais de login:

```prisma
model AuthProfile {
  id           Int     @id @default(autoincrement())
  email        String  @unique
  password     String  // Hash da senha
  refreshToken String? @unique
  createdAt    DateTime @default(now())

  // Relacionamentos opcionais (um AuthProfile pertence a UM tipo)
  user   User?
  tutor  Tutor?
}
```

### User (Modificado)
Funcionários da clínica:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  clinicId  Int      @default(1) // Para Multi-Tenant V2
  roleName  RoleName
  role      Role     @relation(fields: [roleName], references: [name])

  // Relacionamento 1:1 obrigatório com AuthProfile
  authProfileId Int         @unique
  authProfile   AuthProfile @relation(fields: [authProfileId], references: [id], onDelete: Cascade)
}
```

### Tutor (Modificado)
Clientes da clínica:

```prisma
model Tutor {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique // Para comunicação
  phone     String
  address   String?
  clinicId  Int      @default(1) // Para Multi-Tenant V2

  pets         Pet[]
  appointments Appointment[]

  // Relacionamento 1:1 OPCIONAL com AuthProfile
  authProfileId Int?        @unique
  authProfile   AuthProfile? @relation(fields: [authProfileId], references: [id], onDelete: SetNull)
}
```

## Benefícios da Arquitetura

### 1. Segurança
- **Separação de responsabilidades**: Credenciais isoladas em uma tabela dedicada
- **Controle granular**: Diferentes políticas de segurança por tipo de usuário
- **Auditoria centralizada**: Todos os logins em um local

### 2. Flexibilidade
- **API universal**: Endpoint `/login` funciona para ambos os tipos
- **JWT contextual**: Token contém informações do tipo de usuário
- **Relacionamento opcional**: Nem todo tutor precisa ter login

### 3. Escalabilidade
- **Preparado para Multi-Tenant**: Campo `clinicId` já incluído
- **Extensível**: Fácil adicionar novos tipos (ex: Partner, Admin)
- **Performance**: Queries otimizadas por tipo

## Fluxo de Autenticação

### 1. Login Universal
```typescript
// POST /api/auth/login
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

### 2. Validação
1. Buscar `AuthProfile` pelo email
2. Validar senha
3. Verificar se está vinculado a `User` ou `Tutor`
4. Gerar JWT com contexto apropriado

### 3. JWT Response

**Para User (Funcionário):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 123,
    "type": "user",
    "name": "Dr. João",
    "role": "VETERINARIO",
    "clinicId": 1
  }
}
```

**Para Tutor (Cliente):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 456,
    "type": "tutor",
    "name": "Maria Silva",
    "clinicId": 1
  }
}
```

## Implementação

### 1. Migration
```bash
# Gerar migration
npx prisma migrate dev --name add-auth-profile

# Aplicar ao banco
npx prisma db push
```

### 2. Serviços de Autenticação

**AuthService (Novo):**
```typescript
class AuthService {
  async login(email: string, password: string) {
    // 1. Buscar AuthProfile
    const authProfile = await prisma.authProfile.findUnique({
      where: { email },
      include: { user: { include: { role: true } }, tutor: true }
    });

    // 2. Validar senha
    const isValid = await bcrypt.compare(password, authProfile.password);
    
    // 3. Determinar tipo e gerar JWT
    if (authProfile.user) {
      return this.generateUserToken(authProfile.user);
    } else if (authProfile.tutor) {
      return this.generateTutorToken(authProfile.tutor);
    }
  }
}
```

### 3. Middleware de Autorização
```typescript
// Middleware que funciona para ambos os tipos
function authMiddleware(req, res, next) {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token);
  
  if (decoded.type === 'user') {
    // Lógica para funcionários
    req.user = decoded;
  } else if (decoded.type === 'tutor') {
    // Lógica para clientes
    req.tutor = decoded;
  }
  
  next();
}
```

## Casos de Uso

### 1. Funcionário fazendo login
- Acessa sistema completo da clínica
- Permissões baseadas no `role`
- Pode gerenciar todos os dados

### 2. Tutor fazendo login no Portal
- Acessa apenas seus próprios dados
- Pode ver seus pets e agendamentos
- Pode agendar consultas online

### 3. Tutor sem login
- Cadastrado apenas para comunicação
- Agendamentos feitos pela clínica
- Não acessa o portal

## Próximos Passos

1. **Migration do banco de dados**
2. **Refatoração do AuthService**
3. **Atualização dos middlewares**
4. **Testes de integração**
5. **Implementação do Portal do Cliente**

## Considerações de Segurança

- **Passwords**: Sempre hasheados com bcrypt
- **JWT**: Tokens com expiração apropriada
- **Refresh Tokens**: Rotação automática
- **Rate Limiting**: Proteção contra ataques de força bruta
- **CORS**: Configuração adequada para o portal

---

**Status**: ✅ Arquitetura definida - Pronto para implementação
**Próximo Sprint**: Implementação da autenticação dual
**Responsável**: Equipe de Backend