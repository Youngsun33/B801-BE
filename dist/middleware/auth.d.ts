import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../lib/auth';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare const authenticateAccessToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const authenticateRefreshToken: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map