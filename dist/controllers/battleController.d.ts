import { Request, Response } from 'express';
export declare const CARD_CATALOG: {
    ally: ({
        id: string;
        name: string;
        type: string;
        description: string;
        effects: {
            probability: number;
            damage: number;
            name: string;
        }[];
    } | {
        id: string;
        name: string;
        type: string;
        description: string;
        effects: {
            probability: number;
            heal: number;
            name: string;
        }[];
    } | {
        id: string;
        name: string;
        type: string;
        description: string;
        effects: {
            probability: number;
            shield: number;
            name: string;
        }[];
    })[];
    boss: {
        id: string;
        name: string;
        type: string;
        description: string;
        effects: {
            probability: number;
            damage: number;
            name: string;
        }[];
    }[];
};
export declare const battleStates: Record<number, {
    teamId: number;
    turn: number;
    phase: 'select' | 'resolve' | 'finished';
    playerSelections: Record<number, {
        cardId: string;
        targetUserId?: number;
        locked: boolean;
    }>;
    bossHp: number;
    maxBossHp: number;
    teamMembers: Array<{
        userId: number;
        hp: number;
        maxHp: number;
        energy: number;
        shield: number;
    }>;
    stunGauge: {
        value: number;
        threshold: number;
        stunned: boolean;
    };
    activeBuffs: Array<{
        id: string;
        duration: number;
        effect: any;
    }>;
    battleLogs: Array<any>;
    turnTimer?: NodeJS.Timeout;
}>;
export declare const getCardCatalog: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBattleState: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const lockCard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const unlockCard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const resolveTurn: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBattleLogs: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const useBuff: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStunGauge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=battleController.d.ts.map