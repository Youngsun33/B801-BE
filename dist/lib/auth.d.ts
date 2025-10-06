export interface TokenPayload {
    userId: number;
    username: string;
}
export declare const generateTokens: (payload: TokenPayload) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const validatePassword: (password: string) => {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=auth.d.ts.map