"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../lib/auth");
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(1).max(50),
    password: zod_1.z.string().min(8),
    inviteCode: zod_1.z.string().optional()
});
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1)
});
const logoutSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1)
});
const refreshTokenStore = new Set();
const register = async (req, res) => {
    try {
        const { username, password, inviteCode } = registerSchema.parse(req.body);
        const passwordValidation = (0, auth_1.validatePassword)(password);
        if (!passwordValidation.valid) {
            return res.status(422).json({
                error: '비밀번호 정책 위반',
                details: passwordValidation.errors
            });
        }
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { username }
        });
        if (existingUser) {
            return res.status(409).json({ error: '이미 사용 중인 사용자명입니다.' });
        }
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const user = await prisma_1.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                hp: 100,
                energy: 100,
                gold: 1000,
                attack_power: 10,
                current_day: 1,
                is_alive: true
            },
            select: {
                id: true,
                username: true,
                hp: true,
                energy: true,
                gold: true,
                attack_power: true,
                current_day: true,
                is_alive: true
            }
        });
        return res.status(201).json({
            message: '회원가입이 완료되었습니다.',
            user
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Register error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { username }
        });
        if (!user) {
            return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
        }
        if (!user.is_alive) {
            return res.status(423).json({ error: '계정이 잠금되었습니다.' });
        }
        const isValidPassword = await (0, auth_1.comparePassword)(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
        }
        const { accessToken, refreshToken } = (0, auth_1.generateTokens)({
            userId: user.id,
            username: user.username
        });
        refreshTokenStore.add(refreshToken);
        return res.status(200).json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                hp: user.hp,
                energy: user.energy,
                gold: user.gold,
                attack_power: user.attack_power,
                current_day: user.current_day,
                is_alive: user.is_alive
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Login error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const user = req.user;
        const { accessToken } = (0, auth_1.generateTokens)({
            userId: user.userId,
            username: user.username
        });
        return res.status(200).json({ accessToken });
    }
    catch (error) {
        console.error('Refresh error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    try {
        const { refreshToken } = logoutSchema.parse(req.body);
        refreshTokenStore.delete(refreshToken);
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Logout error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.logout = logout;
//# sourceMappingURL=authController.js.map