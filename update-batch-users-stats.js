const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const usernames = [
  'kosio',
  'kohogyeong',
  'ryueuntae',
  'maisaac',
  'mangyooni',
  'baniheon',
  'seongonha',
  'sowonmin',
  'soiyeon',
  'sonjaeik',
  'juhwayeong',
  'chunsooju',
  'paengsahwa',
  'heoyeongwon',
  'hyeonsaroe',
  'hyeonagyeong'
];

async function main() {
  const users = await prisma.user.findMany({ where: { username: { in: usernames } }, select: { id: true, username: true } });
  if (users.length === 0) {
    console.log('대상 사용자가 없습니다.');
    return;
  }

  let updated = 0;
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { hp: 3, energy: 3, gold: 0 }
    });
    console.log(`✅ 업데이트: ${u.username} -> hp=3, energy=3, gold=0`);
    updated++;
  }

  console.log(`\n완료: ${updated}명 업데이트됨.`);
}

main()
  .catch((e) => {
    console.error('오류:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


