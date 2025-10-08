import { Request, Response } from 'express';
export declare const startInvestigation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCurrentSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSessionStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const endInvestigation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const enterStoryDay: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRemainingInvestigations: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rechargeInvestigation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=investigationController.d.ts.map