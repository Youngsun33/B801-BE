import { Request, Response } from 'express';
import multer from 'multer';
declare const upload: multer.Multer;
export declare const importTwineFile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStoryNodes: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateStoryNode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteStoryNode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createStoryNode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAdminStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export { upload };
//# sourceMappingURL=adminController.d.ts.map