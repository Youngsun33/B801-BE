"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.comparePassword = exports.hashPassword = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const generateTokens = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, JWT_ACCESS_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hash) => {
    return await bcryptjs_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
    }
    if (password.length > 128) {
        errors.push('비밀번호는 최대 128자까지 가능합니다.');
    }
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('비밀번호는 최소 1개의 영문자를 포함해야 합니다.');
    }
    if (!/\d/.test(password)) {
        errors.push('비밀번호는 최소 1개의 숫자를 포함해야 합니다.');
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
exports.validatePassword = validatePassword;
//# sourceMappingURL=auth.js.map