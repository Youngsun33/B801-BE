import { Request, Response } from 'express';
export declare const joinRaidQueue: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const leaveRaidQueue: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyTeam: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTeamDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTeamStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=raidController.d.ts.map