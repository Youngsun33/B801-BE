interface StoryChoice {
    text: string;
    requirements?: {
        skill?: string;
        level?: number;
        item?: string;
    };
}
interface StoryOutcome {
    choiceText: string;
    results: string[];
    rewards?: {
        stat?: string;
        value?: number;
        item?: string;
        quantity?: number;
    }[];
}
interface ParsedStory {
    id: number;
    title: string;
    description: string;
    choices: StoryChoice[];
    outcomes: StoryOutcome[];
    category?: string;
}
export declare function parseStoryFile(filePath: string): ParsedStory[];
export declare function importRandomStories(filePath: string): Promise<void>;
export {};
//# sourceMappingURL=parseRandomStories.d.ts.map