import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { parseTwineDocument } from '../lib/parseTwineToMainStory';

const prisma = new PrismaClient();

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
    await prisma.$transaction(async (tx) => {
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

// 스토리 노드 목록 조회
export const getStoryNodes = async (req: Request, res: Response) => {
  try {
    const nodes = await prisma.mainStory.findMany({
      orderBy: { node_id: 'asc' },
      select: {
        id: true,
        node_id: true,
        title: true,
        text: true,
        node_type: true,
        route_name: true,
        choices: true,
        rewards: true,
        position_x: true,
        position_y: true,
        created_at: true
      }
    });

    return res.status(200).json({
      nodes: nodes,
      totalCount: nodes.length
    });

  } catch (error) {
    console.error('❌ 스토리 노드 조회 중 오류:', error);
    return res.status(500).json({ error: '스토리 노드를 불러오는 중 오류가 발생했습니다.' });
  }
};

// 스토리 노드 업데이트
export const updateStoryNode = async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const { title, text, choices, rewards, route_name } = req.body;

    // 선택지를 JSON 배열로 변환
    let choicesArray: string[] = [];
    if (typeof choices === 'string' && choices.trim()) {
      choicesArray = choices.split('|').map((choice: string) => choice.trim()).filter(Boolean);
    }

    // 보상을 JSON 객체로 변환
    let rewardsObject: any = null;
    if (typeof rewards === 'string' && rewards.trim()) {
      try {
        rewardsObject = JSON.parse(rewards);
      } catch {
        // 간단한 파싱: "골드:100, 에너지:50" 형태
        const rewardPairs = rewards.split(',').map((pair: string) => pair.trim());
        rewardsObject = {};
        rewardPairs.forEach(pair => {
          const [key, value] = pair.split(':').map(s => s.trim());
          if (key && value) {
            rewardsObject[key] = parseInt(value) || value;
          }
        });
      }
    }

    const updatedNode = await prisma.mainStory.update({
      where: { node_id: parseInt(nodeId) },
      data: {
        title: title || undefined,
        text: text || undefined,
        choices: JSON.stringify(choicesArray),
        rewards: rewardsObject ? JSON.stringify(rewardsObject) : null,
        route_name: route_name || undefined
      }
    });

    return res.status(200).json({
      message: '스토리 노드가 성공적으로 업데이트되었습니다.',
      node: updatedNode
    });

  } catch (error) {
    console.error('❌ 스토리 노드 업데이트 중 오류:', error);
    return res.status(500).json({ error: '스토리 노드 업데이트 중 오류가 발생했습니다.' });
  }
};

// 스토리 노드 삭제
export const deleteStoryNode = async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;

    const deletedNode = await prisma.mainStory.delete({
      where: { node_id: parseInt(nodeId) }
    });

    return res.status(200).json({
      message: '스토리 노드가 성공적으로 삭제되었습니다.',
      deletedNode: deletedNode
    });

  } catch (error) {
    console.error('❌ 스토리 노드 삭제 중 오류:', error);
    return res.status(500).json({ error: '스토리 노드 삭제 중 오류가 발생했습니다.' });
  }
};

// 새 스토리 노드 생성
export const createStoryNode = async (req: Request, res: Response) => {
  try {
    const { title, text, choices, rewards, route_name, node_type = 'main' } = req.body;

    // 새로운 노드 ID 생성 (기존 최대값 + 1)
    const maxNode = await prisma.mainStory.findFirst({
      orderBy: { node_id: 'desc' }
    });
    const newNodeId = (maxNode?.node_id || 400) + 1;

    // 선택지를 JSON 배열로 변환
    let choicesArray: string[] = [];
    if (typeof choices === 'string' && choices.trim()) {
      choicesArray = choices.split('|').map((choice: string) => choice.trim()).filter(Boolean);
    }

    // 보상을 JSON 객체로 변환
    let rewardsObject: any = null;
    if (typeof rewards === 'string' && rewards.trim()) {
      try {
        rewardsObject = JSON.parse(rewards);
      } catch {
        // 간단한 파싱: "골드:100, 에너지:50" 형태
        const rewardPairs = rewards.split(',').map((pair: string) => pair.trim());
        rewardsObject = {};
        rewardPairs.forEach(pair => {
          const [key, value] = pair.split(':').map(s => s.trim());
          if (key && value) {
            rewardsObject[key] = parseInt(value) || value;
          }
        });
      }
    }

    const newNode = await prisma.mainStory.create({
      data: {
        node_id: newNodeId,
        title: title || `새 노드 ${newNodeId}`,
        text: text || '',
        choices: JSON.stringify(choicesArray),
        rewards: rewardsObject ? JSON.stringify(rewardsObject) : null,
        route_name: route_name || null,
        node_type: node_type
      }
    });

    return res.status(201).json({
      message: '새 스토리 노드가 성공적으로 생성되었습니다.',
      node: newNode
    });

  } catch (error) {
    console.error('❌ 스토리 노드 생성 중 오류:', error);
    return res.status(500).json({ error: '스토리 노드 생성 중 오류가 발생했습니다.' });
  }
};

// 관리자 통계 조회
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const [userCount, storyNodeCount] = await Promise.all([
      prisma.user.count(),
      prisma.mainStory.count()
    ]);
    
    // 현재는 last_login 필드가 없으므로 전체 사용자 수를 활성 사용자로 간주
    const activeUsers = userCount;

    return res.status(200).json({
      stats: {
        totalUsers: userCount,
        activeUsers: activeUsers,
        storyNodes: storyNodeCount,
        completedPlays: 0 // TODO: 실제 완료된 플레이 수 계산
      }
    });

  } catch (error) {
    console.error('❌ 관리자 통계 조회 중 오류:', error);
    return res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
};

export { upload };