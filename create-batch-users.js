const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./dist/lib/auth');

const prisma = new PrismaClient();

const usersToCreate = [
  { username: 'kosio', password: 'kso8294!' },
  { username: 'kohogyeong', password: 'khg2688!' },
  { username: 'ryueuntae', password: 'ret4228!' },
  { username: 'maisaac', password: 'mis9234!' },
  { username: 'mangyooni', password: 'myn7415!' },
  { username: 'baniheon', password: 'bih4073!' },
  { username: 'seongonha', password: 'soh6159!' },
  { username: 'sowonmin', password: 'swm3037!' },
  { username: 'soiyeon', password: 'siy1653!' },
  { username: 'sonjaeik', password: 'sji1383!' },
  { username: 'juhwayeong', password: 'jhy3793!' },
  { username: 'chunsooju', password: 'csj6767!' },
  { username: 'paengsahwa', password: 'psh5964!' },
  { username: 'heoyeongwon', password: 'hyw8601!' },
  { username: 'hyeonsaroe', password: 'hsr9435!' },
  { username: 'hyeonagyeong', password: 'hag4967!' }
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const { username, password } of usersToCreate) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      console.log(`⏭️  이미 존재: ${username} (건너뜀)`);
      skipped++;
      continue;
    }

    const hashed = await hashPassword(password);
    await prisma.user.create({
      data: {
        username,
        password: hashed,
        hp: 100,
        energy: 100,
        gold: 1000,
        attack_power: 10,
        current_day: 1,
        is_alive: true
      }
    });
    console.log(`✅ 생성: ${username}`);
    created++;
  }

  console.log(`\n완료: 생성 ${created}명, 건너뜀 ${skipped}명`);
}

main()
  .catch((e) => {
    console.error('오류:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


