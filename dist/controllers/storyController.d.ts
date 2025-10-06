import { Request, Response } from 'express';
export declare const getStoryNode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const chooseStoryOption: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserResources: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getActionPointStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStoryProgress: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const autosaveStory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const enterStoryDay: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const completeRandomStoriesAndSaveCheckpoint: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const completeRandomStoriesAndReturnToCheckpoint: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=storyController.d.ts.map