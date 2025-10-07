import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { parseTwineDocument } from '../lib/parseTwineToMainStory';

// Multer 설정 - 메모리 스토리지 사용
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // .twine, .twee, .txt 파일만 허용
    const allowedTypes = ['application/octet-stream', 'text/plain', 'text/twee'];
    const allowedExtensions = ['.twine', '.twee', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Twine 파일(.twine, .twee) 또는 텍스트 파일(.txt)만 업로드 가능합니다.'));
    }
  }
});

// Twine 파일 임포트 함수
export const importTwineFile = async (req: Request, res: Response) => {
  try {
    console.log('📁 Twine 파일 임포트 시작...');
    
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    // 업로드된 파일 내용을 문자열로 변환
    const twineContent = req.file.buffer.toString('utf-8');
    console.log(`📖 파일 크기: ${twineContent.length} 문자`);

    // Twine 문서 파싱
    const parsedStories = parseTwineDocument(twineContent);
    console.log(`📊 ${parsedStories.length}개의 스토리 노드 파싱 완료`);
    
    // 디버깅: 처음 3개 노드의 위치 정보 출력
    console.log('\n📍 처음 3개 노드의 위치 정보:');
    parsedStories.slice(0, 3).forEach((story, idx) => {
      console.log(`  ${idx + 1}. "${story.title}": position_x=${story.position_x}, position_y=${story.position_y}`);
    });

    if (parsedStories.length === 0) {
      return res.status(400).json({ error: '유효한 스토리 노드를 찾을 수 없습니다.' });
    }

    // 트랜잭션으로 기존 데이터 삭제 후 새 데이터 삽입 (타임아웃 30초로 증가)
    await prisma.$transaction(async (tx: any) => {
      // 기존 메인 스토리 삭제
      const deletedCount = await tx.mainStory.deleteMany({});
      console.log(`🗑️ 기존 메인 스토리 ${deletedCount.count}개 삭제 완료`);

      // 새 스토리 노드들 배치 삽입 (더 빠름)
      console.log(`📝 ${parsedStories.length}개 노드 삽입 시작...`);
      
      // 100개씩 배치로 삽입
      const batchSize = 100;
      for (let i = 0; i < parsedStories.length; i += batchSize) {
        const batch = parsedStories.slice(i, i + batchSize);
        await tx.mainStory.createMany({
          data: batch
        });
        console.log(`✅ ${Math.min(i + batchSize, parsedStories.length)}/${parsedStories.length} 노드 삽입 완료`);
      }
    }, {
      maxWait: 30000, // 최대 대기 시간 30초
      timeout: 30000, // 트랜잭션 타임아웃 30초
    });

    console.log('✅ 메인 스토리 임포트 완료!');

    // 임포트 결과 통계 생성
    const stats = {
      totalNodes: parsedStories.length,
      checkpointNodes: parsedStories.filter(s => s.node_type === 'checkpoint').length,
      mainNodes: parsedStories.filter(s => s.node_type === 'main').length,
      routeNames: [...new Set(parsedStories.map(s => s.route_name).filter(Boolean))]
    };

    return res.status(200).json({
      message: 'Twine 파일이 성공적으로 임포트되었습니다!',
      stats: stats
    });

  } catch (error) {
    console.error('❌ Twine 파일 임포트 중 오류:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Twine 파일')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    return res.status(500).json({ 
      error: '파일 임포트 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// 스토리 노드 목록 조회 (새 ERD 구조)
export const getStoryNodes = async (req: Request, res: Response) => {
  try {
    const nodes = await prisma.$queryRaw`
      SELECT * FROM nodes 
      ORDER BY story_id, node_id ASC
    `;

    return res.status(200).json({
      nodes: nodes,
      totalCount: (nodes as any[]).length
    });

  } catch (error) {
    console.error('❌ 스토리 노드 조회 중 오류:', error);
    return res.status(500).json({ error: '스토리 노드를 불러오는 중 오류가 발생했습니다.' });
  }
};

// 스토리 노드 업데이트 (임시 비활성화 - 새 ERD 구조로 재구현 필요)
export const updateStoryNode = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '이 기능은 현재 재구현 중입니다.',
    message: '새로운 ERD 구조에 맞게 업데이트 예정입니다.'
  });
};

// 스토리 노드 삭제 (임시 비활성화 - 새 ERD 구조로 재구현 필요)
export const deleteStoryNode = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '이 기능은 현재 재구현 중입니다.',
    message: '새로운 ERD 구조에 맞게 업데이트 예정입니다.'
  });
};

// 새 스토리 노드 생성 (임시 비활성화 - 새 ERD 구조로 재구현 필요)
export const createStoryNode = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: '이 기능은 현재 재구현 중입니다.',
    message: '새로운 ERD 구조에 맞게 업데이트 예정입니다.'
  });
};

// 관리자 통계 조회
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    
    // 새 ERD 구조에서 노드 카운트
    const storyNodeResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM nodes
    `;
    const rawCount = storyNodeResult[0]?.count;
    const storyNodeCount = typeof rawCount === 'bigint'
      ? Number(rawCount)
      : Number(rawCount || 0);
    
    // 현재는 last_login 필드가 없으므로 전체 사용자 수를 활성 사용자로 간주
    const activeUsers = userCount;

    return res.status(200).json({
      stats: {
        totalUsers: Number(userCount),
        activeUsers: Number(activeUsers),
        storyNodes: Number(storyNodeCount),
        completedPlays: 0 // TODO: 실제 완료된 플레이 수 계산
      }
    });

  } catch (error) {
    console.error('❌ 관리자 통계 조회 중 오류:', error);
    return res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
};

export { upload };

// ===== 임시 관리자 API: 사용자/리소스 목록 =====
export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        hp: true,
        energy: true,
        gold: true,
        attack_power: true,
        current_day: true,
        is_alive: true
      },
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({ users, totalCount: users.length });
  } catch (error) {
    console.error('❌ 관리자 사용자 조회 오류:', error);
    return res.status(500).json({ error: '사용자 목록 조회 중 오류가 발생했습니다.' });
  }
};

export const getAdminResources = async (req: Request, res: Response) => {
  try {
    const { type } = req.query as { type?: string };
    const where = type ? { type: String(type) } : {} as any;
    const resources = await prisma.resource.findMany({
      where,
      select: { id: true, name: true, description: true, type: true },
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({ resources, totalCount: resources.length });
  } catch (error) {
    console.error('❌ 관리자 리소스 조회 오류:', error);
    return res.status(500).json({ error: '리소스 목록 조회 중 오류가 발생했습니다.' });
  }
};