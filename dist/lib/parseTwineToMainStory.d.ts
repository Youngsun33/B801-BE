export interface ParsedMainStory {
    node_id: number;
    title: string;
    text: string;
    node_type: string;
    route_name: string | null;
    choices: string;
    rewards: string | null;
    position_x?: number;
    position_y?: number;
}
export interface TwineChoice {
    id: number;
    targetNodeId: number;
    label: string;
    requirement?: {
        type: 'ability' | 'item' | 'stat';
        name: string;
        level?: number;
    };
    probability?: number;
}
export declare function parseTwinePassage(title: string, content: string, nodeIdCounter: {
    value: number;
}, positionX?: number, positionY?: number): ParsedMainStory;
export declare function parseTwineDocument(twineContent: string): ParsedMainStory[];
//# sourceMappingURL=parseTwineToMainStory.d.ts.map