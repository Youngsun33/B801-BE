interface CreateUserOptions {
    username: string;
    password: string;
    hp?: number;
    energy?: number;
    gold?: number;
    attack_power?: number;
}
export declare function createUser(options: CreateUserOptions): Promise<{
    id: number;
    username: string;
    password: string;
    hp: number;
    energy: number;
    gold: number;
    attack_power: number;
    current_day: number;
    is_alive: boolean;
    role: string;
}>;
export {};
//# sourceMappingURL=createUser.d.ts.map