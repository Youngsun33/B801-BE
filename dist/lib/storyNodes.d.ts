export interface StoryChoice {
    id: number;
    label: string;
    requiresItemId?: number;
}
export interface StoryReward {
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
    stat?: string;
    statValue?: number;
}
export interface StoryNode {
    nodeId: number;
    text: string;
    choices: StoryChoice[];
    rewards?: StoryReward;
    isEndNode?: boolean;
    nodeType: 'random' | 'main' | 'checkpoint' | 'intro' | 'tutorial';
}
export declare const STORY_NODES: Record<number, StoryNode>;
export declare const CHOICE_TO_NODE: Record<number, number | string>;
export declare const RANDOM_STORY_POOL: number[];
export declare const MAIN_STORY_POOL: number[];
export declare const CHECKPOINT_NODES: number[];
export declare const INTRO_NODES: number[];
export declare const TUTORIAL_NODES: number[];
//# sourceMappingURL=storyNodes.d.ts.map