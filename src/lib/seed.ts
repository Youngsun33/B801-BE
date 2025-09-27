import { prisma } from './prisma';

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 1. 기본 아이템들 생성
  console.log('📦 아이템 생성 중...');
  
  const items = await Promise.all([
    // 스토리 아이템들
    prisma.item.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: '치료 포션',
        description: 'HP를 50 회복합니다.',
        type: 'story'
      }
    }),
    prisma.item.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: '에너지 드링크',
        description: '에너지를 30 회복합니다.',
        type: 'story'
      }
    }),
    prisma.item.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: '마스터키',
        description: '잠긴 문을 열 수 있는 특별한 열쇠입니다.',
        type: 'story'
      }
    }),
    prisma.item.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4,
        name: '손전등',
        description: '어두운 곳을 밝혀줍니다.',
        type: 'story'
      }
    }),
    // 레이드 아이템들
    prisma.item.upsert({
      where: { id: 5 },
      update: {},
      create: {
        id: 5,
        name: '공격력 부스터',
        description: '공격력을 일시적으로 증가시킵니다.',
        type: 'raid'
      }
    }),
    prisma.item.upsert({
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

  // 2. 테스트 유저 생성
  console.log('👤 테스트 유저 생성 중...');
  
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.k5vVEFIm', // password123
      hp: 100,
      energy: 100,
      gold: 1000,
      attack_power: 15,
      current_day: 1,
      is_alive: true
    }
  });

  console.log(`✅ 테스트 유저 생성: ${testUser.username}`);

  // 3. 관리자 유저 생성
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.k5vVEFIm', // password123
      hp: 100,
      energy: 100,
      gold: 10000,
      attack_power: 99,
      current_day: 1,
      is_alive: true
    }
  });

  console.log(`✅ 관리자 유저 생성: ${adminUser.username}`);

  // 4. 테스트 유저 인벤토리 생성
  console.log('🎒 테스트 인벤토리 생성 중...');
  
  const inventoryItems = await Promise.all([
    prisma.inventory.upsert({
      where: { id: 1 },
      update: {},
      create: {
        user_id: testUser.id,
        item_id: 1, // 치료 포션
        quantity: 3
      }
    }),
    prisma.inventory.upsert({
      where: { id: 2 },
      update: {},
      create: {
        user_id: testUser.id,
        item_id: 2, // 에너지 드링크
        quantity: 2
      }
    }),
    prisma.inventory.upsert({
      where: { id: 3 },
      update: {},
      create: {
        user_id: testUser.id,
        item_id: 4, // 손전등
        quantity: 1
      }
    }),
    prisma.inventory.upsert({
      where: { id: 4 },
      update: {},
      create: {
        user_id: testUser.id,
        item_id: 5, // 공격력 부스터 (레이드)
        quantity: 2
      }
    })
  ]);

  console.log(`✅ ${inventoryItems.length}개 인벤토리 아이템 생성`);

  // 5. 스토리 진행 상황 생성
  console.log('📖 스토리 진행상황 생성 중...');
  
  const storyProgress = await prisma.storyProgress.upsert({
    where: { id: 1 },
    update: {},
    create: {
      user_id: testUser.id,
      current_chapter: 1,
      last_node_id: 1001,
      investigation_count: 3
    }
  });

  console.log(`✅ 스토리 진행상황 생성 완료`);

  // 6. 보스 생성
  console.log('👹 보스 생성 중...');
  
  const bosses = await Promise.all([
    prisma.boss.upsert({
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
    prisma.boss.upsert({
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
    prisma.boss.upsert({
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
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 