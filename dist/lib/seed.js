"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./prisma");
const seedMainStory_1 = require("./seedMainStory");
async function main() {
    console.log('🌱 시드 데이터 생성 시작...');
    console.log('📦 아이템 생성 중...');
    const items = await Promise.all([
        prisma_1.prisma.item.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                name: '치료 포션',
                description: 'HP를 50 회복합니다.',
                type: 'story'
            }
        }),
        prisma_1.prisma.item.upsert({
            where: { id: 2 },
            update: {},
            create: {
                id: 2,
                name: '에너지 드링크',
                description: '에너지를 30 회복합니다.',
                type: 'story'
            }
        }),
        prisma_1.prisma.item.upsert({
            where: { id: 3 },
            update: {},
            create: {
                id: 3,
                name: '마스터키',
                description: '잠긴 문을 열 수 있는 특별한 열쇠입니다.',
                type: 'story'
            }
        }),
        prisma_1.prisma.item.upsert({
            where: { id: 4 },
            update: {},
            create: {
                id: 4,
                name: '손전등',
                description: '어두운 곳을 밝혀줍니다.',
                type: 'story'
            }
        }),
        prisma_1.prisma.item.upsert({
            where: { id: 5 },
            update: {},
            create: {
                id: 5,
                name: '공격력 부스터',
                description: '공격력을 일시적으로 증가시킵니다.',
                type: 'raid'
            }
        }),
        prisma_1.prisma.item.upsert({
            where: { id: 6 },
            update: {},
            create: {
                id: 6,
                name: '방어막',
                description: '받는 피해를 줄여줍니다.',
                type: 'raid'
            }
        })
    ]);
    console.log(`✅ ${items.length}개 아이템 생성 완료`);
    console.log('⚡ 스토리 능력 생성 중...');
    const storyAbilities = await Promise.all([
        prisma_1.prisma.storyAbility.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                name: '관찰력',
                description: '당신의 장점은 눈이 아주 좋다는 것입니다. 다른 사람이 쉽게 찾지 못할 것들도 매의 눈으로 찾아내기 마련이죠.'
            }
        }),
        prisma_1.prisma.storyAbility.upsert({
            where: { id: 2 },
            update: {},
            create: {
                id: 2,
                name: '근력',
                description: '당신의 장점은 힘이 아주 세다는 겁니다. 이 같은 세상에서 힘이란 무엇과도 바꿀 수 없는 능력입니다.'
            }
        }),
        prisma_1.prisma.storyAbility.upsert({
            where: { id: 3 },
            update: {},
            create: {
                id: 3,
                name: '민첩함',
                description: '당신의 장점은 다리가 아주 빠르다는 겁니다. 웬만한 사람들은 당신이 마음만 먹으면 모두 따돌릴 수 있습니다. 물론 기계 앞에서는 무용지물이겠지만요.'
            }
        }),
        prisma_1.prisma.storyAbility.upsert({
            where: { id: 4 },
            update: {},
            create: {
                id: 4,
                name: '은신술',
                description: '당신은 인기척을 숨기는 데 달인입니다. 이상한 피에로 옷만 입지 않는 이상 당신이 마음만 먹으면 몰래 다니는 것쯤이야 아주 쉬운 일입니다.'
            }
        }),
        prisma_1.prisma.storyAbility.upsert({
            where: { id: 5 },
            update: {},
            create: {
                id: 5,
                name: '손재주',
                description: '당신은 손으로 만드는 모든 것에 재능이 있습니다. 만들기, 기계 수리, 많게는 도박까지……. 뭐, 거기까지 쓸 일이 있겠어요.'
            }
        }),
        prisma_1.prisma.storyAbility.upsert({
            where: { id: 6 },
            update: {},
            create: {
                id: 6,
                name: '언변술',
                description: '당신은 말의 귀재입니다. 입 하나로 잘하면 차까지 살 수 있을 정도예요. 조금 더 노력하면 나라까지 얻을 수 있지 않겠어요?'
            }
        }),
        prisma_1.prisma.storyAbility.upsert({
            where: { id: 7 },
            update: {},
            create: {
                id: 7,
                name: '매력',
                description: '당신의 장점은 멋진 외모! 모두가 당신을 보는 순간 깊은 매력에 빠지게 될 겁니다.'
            }
        }),
        prisma_1.prisma.storyAbility.upsert({
            where: { id: 8 },
            update: {},
            create: {
                id: 8,
                name: '직감',
                description: '하잘것없어 보여도 세상 무엇보다도 귀한 재능이 바로 직감입니다. 당신은 빠른 눈치로 모든 장애물을 헤쳐 나갈 수 있을 겁니다.'
            }
        })
    ]);
    console.log(`✅ ${storyAbilities.length}개 스토리 능력 생성 완료`);
    console.log('📦 스토리 아이템 생성 중...');
    const storyItems = await Promise.all([
        prisma_1.prisma.storyItem.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                name: '진통제',
                description: '고통을 줄여주는 약물'
            }
        }),
        prisma_1.prisma.storyItem.upsert({
            where: { id: 2 },
            update: {},
            create: {
                id: 2,
                name: '붕대',
                description: '상처를 감싸는 의료용품'
            }
        }),
        prisma_1.prisma.storyItem.upsert({
            where: { id: 3 },
            update: {},
            create: {
                id: 3,
                name: '에너지 드링크',
                description: '일시적으로 기력을 회복시켜준다'
            }
        }),
        prisma_1.prisma.storyItem.upsert({
            where: { id: 4 },
            update: {},
            create: {
                id: 4,
                name: '돈',
                description: '전쟁 후에도 가치가 있는 화폐'
            }
        }),
        prisma_1.prisma.storyItem.upsert({
            where: { id: 5 },
            update: {},
            create: {
                id: 5,
                name: '권총',
                description: '가장 귀중한 무기'
            }
        }),
    ]);
    console.log(`✅ ${storyItems.length}개 스토리 아이템 생성 완료`);
    console.log('⚡ 레이드 능력 생성 중...');
    const abilities = await Promise.all([
        prisma_1.prisma.ability.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                name: '전기 조작',
                description: '전기를 자유자재로 다룰 수 있습니다. 공격력 +20',
                effect_type: 'attack',
                effect_value: 20
            }
        }),
        prisma_1.prisma.ability.upsert({
            where: { id: 2 },
            update: {},
            create: {
                id: 2,
                name: '염력',
                description: '물체를 마음대로 움직일 수 있습니다. 공격력 +15',
                effect_type: 'attack',
                effect_value: 15
            }
        }),
        prisma_1.prisma.ability.upsert({
            where: { id: 3 },
            update: {},
            create: {
                id: 3,
                name: '강철 피부',
                description: '피부가 강철처럼 단단해집니다. 방어력 +30',
                effect_type: 'defense',
                effect_value: 30
            }
        }),
        prisma_1.prisma.ability.upsert({
            where: { id: 4 },
            update: {},
            create: {
                id: 4,
                name: '초고속 재생',
                description: '부상을 빠르게 회복합니다. HP 회복 +25',
                effect_type: 'support',
                effect_value: 25
            }
        }),
        prisma_1.prisma.ability.upsert({
            where: { id: 5 },
            update: {},
            create: {
                id: 5,
                name: '투시',
                description: '벽 너머를 볼 수 있습니다. 탐색 효율 +20',
                effect_type: 'support',
                effect_value: 20
            }
        }),
        prisma_1.prisma.ability.upsert({
            where: { id: 6 },
            update: {},
            create: {
                id: 6,
                name: '순간이동',
                description: '짧은 거리를 순간이동 할 수 있습니다. 회피율 +30',
                effect_type: 'support',
                effect_value: 30
            }
        }),
        prisma_1.prisma.ability.upsert({
            where: { id: 7 },
            update: {},
            create: {
                id: 7,
                name: '화염 생성',
                description: '화염을 만들어낼 수 있습니다. 공격력 +25',
                effect_type: 'attack',
                effect_value: 25
            }
        }),
        prisma_1.prisma.ability.upsert({
            where: { id: 8 },
            update: {},
            create: {
                id: 8,
                name: '얼음 조작',
                description: '얼음을 만들고 조작할 수 있습니다. 공격력 +22',
                effect_type: 'attack',
                effect_value: 22
            }
        })
    ]);
    console.log(`✅ ${abilities.length}개 레이드 능력 생성 완료`);
    console.log('⚔️ 레이드 아이템 생성 중...');
    const raidItems = await Promise.all([
        prisma_1.prisma.item.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                name: '강화 갑옷',
                description: '방어력을 높여주는 특수 갑옷',
                type: 'raid'
            }
        }),
        prisma_1.prisma.item.upsert({
            where: { id: 2 },
            update: {},
            create: {
                id: 2,
                name: '회복 물약',
                description: 'HP를 회복시켜주는 물약',
                type: 'raid'
            }
        }),
    ]);
    console.log(`✅ ${raidItems.length}개 레이드 아이템 생성 완료`);
    console.log('👤 테스트 유저 생성 중...');
    const testUser = await prisma_1.prisma.user.upsert({
        where: { username: 'testuser' },
        update: {},
        create: {
            username: 'testuser',
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.k5vVEFIm',
            hp: 100,
            energy: 100,
            gold: 1000,
            attack_power: 15,
            current_day: 1,
            is_alive: true
        }
    });
    console.log(`✅ 테스트 유저 생성: ${testUser.username}`);
    const adminUser = await prisma_1.prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.k5vVEFIm',
            hp: 100,
            energy: 100,
            gold: 10000,
            attack_power: 99,
            current_day: 1,
            is_alive: true
        }
    });
    console.log(`✅ 관리자 유저 생성: ${adminUser.username}`);
    console.log('💪 테스트 유저 능력 부여 중...');
    const userAbilities = await Promise.all([
        prisma_1.prisma.userAbility.upsert({
            where: { id: 1 },
            update: {},
            create: {
                user_id: testUser.id,
                ability_id: 1,
                is_active: true
            }
        }),
        prisma_1.prisma.userAbility.upsert({
            where: { id: 2 },
            update: {},
            create: {
                user_id: testUser.id,
                ability_id: 4,
                is_active: false
            }
        })
    ]);
    console.log(`✅ ${userAbilities.length}개 능력 부여 완료`);
    console.log('🎒 테스트 인벤토리 생성 중...');
    const inventoryItems = await Promise.all([
        prisma_1.prisma.inventory.upsert({
            where: { id: 1 },
            update: {},
            create: {
                user_id: testUser.id,
                item_id: 1,
                quantity: 3
            }
        }),
        prisma_1.prisma.inventory.upsert({
            where: { id: 2 },
            update: {},
            create: {
                user_id: testUser.id,
                item_id: 2,
                quantity: 2
            }
        }),
        prisma_1.prisma.inventory.upsert({
            where: { id: 3 },
            update: {},
            create: {
                user_id: testUser.id,
                item_id: 4,
                quantity: 1
            }
        }),
        prisma_1.prisma.inventory.upsert({
            where: { id: 4 },
            update: {},
            create: {
                user_id: testUser.id,
                item_id: 5,
                quantity: 2
            }
        })
    ]);
    console.log(`✅ ${inventoryItems.length}개 인벤토리 아이템 생성`);
    console.log('📖 스토리 진행상황 생성 중...');
    const storyProgress = await prisma_1.prisma.storyProgress.upsert({
        where: { id: 1 },
        update: {},
        create: {
            user_id: testUser.id,
            current_node_id: 1001
        }
    });
    console.log(`✅ 스토리 진행상황 생성 완료`);
    console.log('👹 보스 생성 중...');
    const bosses = await Promise.all([
        prisma_1.prisma.boss.upsert({
            where: { id: 1 },
            update: {},
            create: {
                name: '그림자 드래곤',
                hp: 1000,
                skills: JSON.stringify([
                    { name: '화염 브레스', damage: 150, description: '강력한 화염 공격' },
                    { name: '날개 공격', damage: 100, description: '광범위 물리 공격' }
                ])
            }
        }),
        prisma_1.prisma.boss.upsert({
            where: { id: 2 },
            update: {},
            create: {
                name: '얼음 거인',
                hp: 1200,
                skills: JSON.stringify([
                    { name: '얼음 창', damage: 120, description: '관통하는 얼음 공격' },
                    { name: '동결', damage: 80, description: '적을 얼려서 행동 불가' }
                ])
            }
        }),
        prisma_1.prisma.boss.upsert({
            where: { id: 3 },
            update: {},
            create: {
                name: '어둠의 군주',
                hp: 1500,
                skills: JSON.stringify([
                    { name: '어둠의 파동', damage: 200, description: '최강의 어둠 마법' },
                    { name: '생명력 흡수', damage: 100, description: '적의 HP를 흡수' }
                ])
            }
        })
    ]);
    console.log(`✅ ${bosses.length}개 보스 생성 완료`);
    console.log('🎉 시드 데이터 생성 완료!');
    console.log('\n📋 생성된 테스트 계정:');
    console.log('- 일반 유저: testuser / password123');
    console.log('- 관리자: admin / password123');
    console.log('\n🌱 메인 스토리 시드 시작...');
    await (0, seedMainStory_1.seedMainStory)();
}
main()
    .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map