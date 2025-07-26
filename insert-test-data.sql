-- Script para inserir dados de teste na nova arquitetura de autenticação dual

-- Limpar dados existentes
DELETE FROM User;
DELETE FROM Tutor;
DELETE FROM AuthProfile;
DELETE FROM Role;
DELETE FROM Permission;

-- Inserir Permissions
INSERT INTO Permission (id, name) VALUES 
('perm1', 'CREATE_USER'),
('perm2', 'READ_USER'),
('perm3', 'UPDATE_USER'),
('perm4', 'DELETE_USER'),
('perm5', 'READ_APPOINTMENT'),
('perm6', 'UPDATE_APPOINTMENT'),
('perm7', 'CREATE_RECORD'),
('perm8', 'READ_RECORD');

-- Inserir Roles
INSERT INTO Role (id, name) VALUES 
('role1', 'ADMIN'),
('role2', 'VET');

-- Inserir RolePermissions
INSERT INTO RolePermission (roleId, permissionId) VALUES 
('role1', 'perm1'),
('role1', 'perm2'),
('role1', 'perm3'),
('role1', 'perm4'),
('role2', 'perm5'),
('role2', 'perm6'),
('role2', 'perm7'),
('role2', 'perm8');

-- Inserir AuthProfiles
-- Senha: admin123 -> hash bcrypt
INSERT INTO AuthProfile (id, email, password, createdAt) VALUES 
('auth1', 'admin@clinic.local', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', datetime('now')),
('auth2', 'vet@clinic.local', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', datetime('now')),
('auth3', 'tutor@example.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', datetime('now'));

-- Inserir Users
INSERT INTO User (id, name, roleName, authProfileId, createdAt, updatedAt) VALUES 
('user1', 'Administrador', 'ADMIN', 'auth1', datetime('now'), datetime('now')),
('user2', 'Dr. Maria Silva', 'VET', 'auth2', datetime('now'), datetime('now'));

-- Inserir Tutor
INSERT INTO Tutor (id, name, email, phone, address, authProfileId, createdAt, updatedAt) VALUES 
('tutor1', 'João Silva', 'tutor@example.com', '(11) 99999-9999', 'Rua das Flores, 123', 'auth3', datetime('now'), datetime('now'));

-- Verificar dados inseridos
SELECT 'AuthProfiles' as tabela, COUNT(*) as total FROM AuthProfile
UNION ALL
SELECT 'Users' as tabela, COUNT(*) as total FROM User
UNION ALL
SELECT 'Tutors' as tabela, COUNT(*) as total FROM Tutor;