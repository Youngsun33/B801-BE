export interface TwinePassage {
    title: string;
    text: string;
    choices: Array<{
        label: string;
        target: string;
        requirement?: string;
    }>;
}
export declare const PASSAGE_TO_NODE_ID: Record<string, number>;
export declare function parseRequirement(text: string): {
    type?: 'ability' | 'item' | 'stat';
    name?: string;
    level?: number;
} | null;
export declare function parseRewards(text: string): {
    hp?: number;
    energy?: number;
    gold?: number;
    items?: Array<{
        itemId: number;
        quantity: number;
    }>;
    abilities?: Array<{
        abilityId: number;
    }>;
};
//# sourceMappingURL=parseMainStory.d.ts.map