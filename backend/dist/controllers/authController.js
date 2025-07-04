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
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.roleName }, JWT_SECRET, { expiresIn: '15m' });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
            await prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: refreshToken },
            });
            return res.status(200).json({
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.roleName,
                },
            });
        }
        catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
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
                decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
            }
            catch (error) {
                return res.status(401).json({ message: 'Refresh token inválido' });
            }
            const user = await prisma.user.findFirst({
                where: {
                    id: decoded.userId,
                    refreshToken: refreshToken,
                },
            });
            if (!user) {
                return res.status(401).json({ message: 'Refresh token não encontrado' });
            }
            const newAccessToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.roleName }, JWT_SECRET, { expiresIn: '15m' });
            const newRefreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
            await prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: newRefreshToken },
            });
            return res.status(200).json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.roleName,
                },
            });
        }
        catch (error) {
            console.error('Erro no refresh:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
};
//# sourceMappingURL=authController.js.map