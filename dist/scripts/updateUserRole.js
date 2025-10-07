"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
async function updateUserRole() {
    try {
        const updatedUser = await prisma_1.prisma.user.update({
            where: { username: 'administrator' },
            data: { role: 'admin' },
            select: { id: true, username: true, role: true }
        });
        console.log('✅ 사용자 역할이 업데이트되었습니다:');
        console.log('사용자명:', updatedUser.username);
        console.log('역할:', updatedUser.role);
        console.log('ID:', updatedUser.id);
        const allUsers = await prisma_1.prisma.user.findMany({
            select: { id: true, username: true, role: true }
        });
        console.log('\n📋 전체 사용자 목록:');
        allUsers.forEach((user) => {
            console.log(`- ${user.username} (ID: ${user.id}, Role: ${user.role})`);
        });
    }
    catch (error) {
        console.error('❌ 역할 업데이트 중 오류:', error);
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
updateUserRole();
//# sourceMappingURL=updateUserRole.js.map