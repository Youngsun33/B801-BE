import { Request, Response } from 'express';
export declare const uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadImage: (req: Request, res: Response) => Promise<void>;
export declare const deleteImage: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=uploadController.d.ts.map