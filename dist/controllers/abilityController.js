"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAbilities = exports.toggleAbility = exports.getUserAbilities = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const activateAbilitySchema = zod_1.z.object({
    userAbilityId: zod_1.z.number().min(1)
});
const getUserAbilities = async (req, res) => {
    try {
        const userId = req.user.userId;
        const abilities = await prisma_1.prisma.userAbility.findMany({
            where: { user_id: userId },
            include: {
                ability: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        effect_type: true,
                        effect_value: true
                    }
                }
            },
            orderBy: {
                obtained_at: 'desc'
            }
        });
        const formattedAbilities = abilities.map((ua) => ({
            userAbilityId: ua.id,
            isActive: ua.is_active,
            obtainedAt: ua.obtained_at,
            ability: ua.ability
        }));
        return res.status(200).json({
            abilities: formattedAbilities
        });
    }
    catch (error) {
        console.error('Get user abilities error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getUserAbilities = getUserAbilities;
const toggleAbility = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { userAbilityId } = activateAbilitySchema.parse(req.body);
        const userAbility = await prisma_1.prisma.userAbility.findFirst({
            where: {
                id: userAbilityId,
                user_id: userId
            },
            include: {
                ability: true
            }
        });
        if (!userAbility) {
            return res.status(404).json({ error: '해당 능력을 찾을 수 없습니다.' });
        }
        const updated = await prisma_1.prisma.userAbility.update({
            where: { id: userAbilityId },
            data: {
                is_active: !userAbility.is_active
            },
            include: {
                ability: true
            }
        });
        return res.status(200).json({
            message: updated.is_active ? '능력이 활성화되었습니다.' : '능력이 비활성화되었습니다.',
            userAbilityId: updated.id,
            isActive: updated.is_active,
            ability: updated.ability
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: '입력 데이터가 유효하지 않습니다.',
                details: error.issues
            });
        }
        console.error('Toggle ability error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.toggleAbility = toggleAbility;
const getAllAbilities = async (req, res) => {
    try {
        const abilities = await prisma_1.prisma.ability.findMany({
            orderBy: {
                id: 'asc'
            }
        });
        return res.status(200).json({
            abilities
        });
    }
    catch (error) {
        console.error('Get all abilities error:', error);
        return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
};
exports.getAllAbilities = getAllAbilities;
//# sourceMappingURL=abilityController.js.map