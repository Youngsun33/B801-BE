interface CreateUserOptions {
    username: string;
    password: string;
    hp?: number;
    energy?: number;
    gold?: number;
    attack_power?: number;
}
export declare function createUser(options: CreateUserOptions): Promise<any>;
export {};
//# sourceMappingURL=createUser.d.ts.map