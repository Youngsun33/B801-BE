"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRefreshToken = exports.authenticateAccessToken = void 0;
const auth_1 = require("../lib/auth");
const authenticateAccessToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Auth header:', authHeader);
    console.log('Token:', token);
    if (!token) {
        console.log('No token provided');
        res.status(401).json({ error: 'Access token이 필요합니다.' });
        return;
    }
    try {
        const payload = (0, auth_1.verifyAccessToken)(token);
        console.log('Token payload:', payload);
        req.user = payload;
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
    }
};
exports.authenticateAccessToken = authenticateAccessToken;
const authenticateRefreshToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Refresh token이 필요합니다.' });
        return;
    }
    try {
        const payload = (0, auth_1.verifyRefreshToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(401).json({ error: '유효하지 않거나 만료된 refresh token입니다.' });
    }
};
exports.authenticateRefreshToken = authenticateRefreshToken;
//# sourceMappingURL=auth.js.map