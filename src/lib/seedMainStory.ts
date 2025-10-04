import { prisma } from './prisma';
import { parseTwineDocument } from './parseTwineToMainStory';
import * as fs from 'fs';
import * as path from 'path';

// Twine 파일을 읽어서 DB에 시드
export async function seedMainStory() {
  try {
    console.log('🌱 메인 스토리 시딩 시작...');

    // 기존 메인 스토리 삭제
    await prisma.mainStory.deleteMany({});
    console.log('✅ 기존 메인 스토리 삭제 완료');

    // Twine 파일 읽기
    const twineFilePath = path.join(__dirname, '../data/mainStory.twine.txt');
    const twineContent = fs.readFileSync(twineFilePath, 'utf-8');

    // Twine 콘텐츠 파싱
    const parsedStories = parseTwineDocument(twineContent);
    console.log(`📖 ${parsedStories.length}개의 스토리 노드 파싱 완료`);

    // DB에 삽입
    for (const story of parsedStories) {
      await prisma.mainStory.create({
        data: story
      });
    }

    console.log('✅ 메인 스토리 시딩 완료!');
    console.log(`📊 총 ${parsedStories.length}개의 노드가 저장되었습니다.`);

  } catch (error) {
    console.error('❌ 메인 스토리 시딩 중 오류:', error);
    throw error;
  }
}

// 직접 실행 시
if (require.main === module) {
  seedMainStory()
    .then(() => {
      console.log('완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('실패:', error);
      process.exit(1);
    });
}

