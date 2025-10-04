import { prisma } from './prisma';
import { hashPassword } from './auth';

interface CreateUserOptions {
  username: string;
  password: string;
  hp?: number;
  energy?: number;
  gold?: number;
  attack_power?: number;
}

export async function createUser(options: CreateUserOptions) {
  const {
    username,
    password,
    hp = 100,
    energy = 100,
    gold = 1000,
    attack_power = 10
  } = options;

  // 중복 확인
  const existing = await prisma.user.findUnique({
    where: { username }
  });

  if (existing) {
    throw new Error(`사용자 "${username}"는 이미 존재합니다.`);
  }

  // 비밀번호 해싱
  const hashedPassword = await hashPassword(password);

  // 사용자 생성
  const user = await prisma.user.create({
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

// 직접 실행 시
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

