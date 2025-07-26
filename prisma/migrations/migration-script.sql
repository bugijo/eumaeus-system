-- Script de Migração para Arquitetura de Autenticação Dual
-- Este script deve ser executado APÓS a migration do Prisma

-- 1. Criar AuthProfiles para todos os Users existentes
INSERT INTO AuthProfile (email, password, refreshToken, createdAt)
SELECT 
    email,
    password,
    refreshToken,
    createdAt
FROM User;

-- 2. Atualizar Users para referenciar seus AuthProfiles
UPDATE User 
SET authProfileId = (
    SELECT ap.id 
    FROM AuthProfile ap 
    WHERE ap.email = User.email
)
WHERE User.email IS NOT NULL;

-- 3. Verificar se todos os Users foram migrados corretamente
-- (Este SELECT deve retornar 0 para confirmar sucesso)
SELECT COUNT(*) as users_sem_auth_profile
FROM User 
WHERE authProfileId IS NULL;

-- 4. Opcional: Criar AuthProfiles para Tutors que queiram acesso ao portal
-- (Executar apenas se necessário, com senhas temporárias)
/*
INSERT INTO AuthProfile (email, password, createdAt)
SELECT 
    email,
    '$2b$10$exemplo.hash.temporario.para.reset', -- Hash de senha temporária
    datetime('now')
FROM Tutor 
WHERE email NOT IN (SELECT email FROM AuthProfile)
AND email IS NOT NULL;

-- Vincular Tutors aos seus AuthProfiles
UPDATE Tutor 
SET authProfileId = (
    SELECT ap.id 
    FROM AuthProfile ap 
    WHERE ap.email = Tutor.email
)
WHERE Tutor.email IN (SELECT email FROM AuthProfile)
AND authProfileId IS NULL;
*/

-- 5. Verificações finais
SELECT 
    'AuthProfiles criados' as status,
    COUNT(*) as total
FROM AuthProfile;

SELECT 
    'Users migrados' as status,
    COUNT(*) as total
FROM User 
WHERE authProfileId IS NOT NULL;

SELECT 
    'Tutors com acesso ao portal' as status,
    COUNT(*) as total
FROM Tutor 
WHERE authProfileId IS NOT NULL;

-- 6. Dados de exemplo para teste
-- Criar um tutor com acesso ao portal para testes
/*
INSERT INTO AuthProfile (email, password, createdAt) 
VALUES ('tutor.teste@email.com', '$2b$10$exemplo.hash.para.teste', datetime('now'));

INSERT INTO Tutor (name, email, phone, address, clinicId, authProfileId, createdAt, updatedAt)
VALUES (
    'João Silva (Teste)',
    'tutor.teste@email.com',
    '(11) 99999-9999',
    'Rua Teste, 123',
    1,
    (SELECT id FROM AuthProfile WHERE email = 'tutor.teste@email.com'),
    datetime('now'),
    datetime('now')
);
*/

-- Comentários importantes:
-- 1. Execute este script APÓS rodar: npx prisma migrate dev --name add-auth-profile
-- 2. Faça backup do banco antes da migração
-- 3. Teste em ambiente de desenvolvimento primeiro
-- 4. Os campos email, password e refreshToken serão removidos do modelo User na próxima migration
-- 5. Senhas temporárias para tutors devem ser resetadas no primeiro login