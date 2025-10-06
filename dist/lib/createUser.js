"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
const prisma_1 = require("./prisma");
const auth_1 = require("./auth");
async function createUser(options) {
    const { username, password, hp = 100, energy = 100, gold = 1000, attack_power = 10 } = options;
    const existing = await prisma_1.prisma.user.findUnique({
        where: { username }
    });
    if (existing) {
        throw new Error(`사용자 "${username}"는 이미 존재합니다.`);
    }
    const hashedPassword = await (0, auth_1.hashPassword)(password);
    const user = await prisma_1.prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            hp,
            energy,
            gold,
            attack_power,
            current_day: 1,
            is_alive: true
        }
    });
    console.log(`✅ 사용자 생성 완료: ${username}`);
    return user;
}
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('사용법: npm run create-user <username> <password>');
        console.log('예시: npm run create-user player1 mypassword123');
        process.exit(1);
    }
    const [username, password] = args;
    createUser({ username, password })
        .then(() => {
        console.log('🎉 계정 생성 완료!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ 오류:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=createUser.js.map