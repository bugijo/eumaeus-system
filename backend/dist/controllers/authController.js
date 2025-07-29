"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'REFRESH_SEGREDO_SUPER_SECRETO';
exports.default = {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const authProfile = await prisma.authProfile.findUnique({
                where: { email },
                include: {
                    user: { include: { role: true } },
                },
            });
            if (!authProfile) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, authProfile.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            if (!authProfile.user) {
                return res.status(403).json({ message: 'Acesso negado. Apenas funcionários podem fazer login.' });
            }
            const tokenPayload = { id: authProfile.user.id, type: 'user', role: authProfile.user.role.name };
            const userPayload = { id: authProfile.user.id, name: authProfile.user.name, email: authProfile.email, role: authProfile.user.role.name, type: 'user' };
            const accessToken = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
            const refreshToken = jsonwebtoken_1.default.sign({ authProfileId: authProfile.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
            await prisma.authProfile.update({
                where: { id: authProfile.id },
                data: { refreshToken },
            });
            return res.status(200).json({ accessToken, refreshToken, user: userPayload });
        }
        catch (error) {
            console.error("Erro no login:", error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(401).json({ message: 'Refresh token não fornecido' });
            }
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            }
            catch (error) {
                return res.status(401).json({ message: 'Refresh token inválido' });
            }
            const authProfile = await prisma.authProfile.findFirst({
                where: {
                    id: decoded.authProfileId,
                    refreshToken: refreshToken,
                },
                include: {
                    user: { include: { role: true } },
                },
            });
            if (!authProfile) {
                return res.status(401).json({ message: 'Refresh token não encontrado' });
            }
            if (!authProfile.user) {
                return res.status(403).json({ message: 'Acesso negado. Apenas funcionários podem fazer login.' });
            }
            const tokenPayload = { id: authProfile.user.id, type: 'user', role: authProfile.user.role.name };
            const userPayload = { id: authProfile.user.id, name: authProfile.user.name, email: authProfile.email, role: authProfile.user.role.name, type: 'user' };
            const newAccessToken = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
            const newRefreshToken = jsonwebtoken_1.default.sign({ authProfileId: authProfile.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
            await prisma.authProfile.update({
                where: { id: authProfile.id },
                data: { refreshToken: newRefreshToken },
            });
            return res.status(200).json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: userPayload,
            });
        }
        catch (error) {
            console.error('Erro no refresh:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
};
//# sourceMappingURL=authController.js.map