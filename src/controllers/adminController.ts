import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Validation schemas
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['story', 'raid'])
});

const updateItemSchema = z.object({
  id: z.number().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  type: z.enum(['story', 'raid']).optional()
});

const deleteItemSchema = z.object({
  id: z.number().min(1)
});

const createBossSchema = z.object({
  name: z.string().min(1).max(100),
  hp: z.number().min(1).max(100000),
  skills: z.string(), // JSON string
  aoePattern: z.string().optional() // JSON string
});

const updateBossSchema = z.object({
  id: z.number().min(1),
  name: z.string().min(1).max(100).optional(),
  hp: z.number().min(1).max(100000).optional(),
  skills: z.string().optional(),
  aoePattern: z.string().optional()
});

const deleteBossSchema = z.object({
  id: z.number().min(1)
});

const createMapSchema = z.object({
  day: z.number().min(1).max(3),
  locations: z.string(), // JSON string
  blockSchedule: z.string().optional() // JSON string
});

const updateMapSchema = z.object({
  id: z.number().min(1),
  day: z.number().min(1).max(3).optional(),
  locations: z.string().optional(),
  blockSchedule: z.string().optional()
});

const deleteMapSchema = z.object({
  id: z.number().min(1)
});

const createNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  startsAt: z.string().optional(),
  endsAt: z.string().optional()
});

// ==================== 아이템 관리 ====================

export const createItem = async (req: Request, res: Response) => {
  try {
    const data = createItemSchema.parse(req.body);

    const item = await prisma.item.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type
      }
    });

    console.log(`✨ 아이템 생성: ${item.name} (ID: ${item.id})`);

    return res.status(201).json({
      message: '아이템이 생성되었습니다.',
      item: item
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Create item error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const data = updateItemSchema.parse(req.body);

    const existingItem = await prisma.item.findUnique({
      where: { id: data.id }
    });

    if (!existingItem) {
      return res.status(404).json({ error: '아이템을 찾을 수 없습니다.' });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;

    const item = await prisma.item.update({
      where: { id: data.id },
      data: updateData
    });

    console.log(`📝 아이템 수정: ${item.name} (ID: ${item.id})`);

    return res.status(200).json({
      message: '아이템이 수정되었습니다.',
      item: item
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Update item error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const data = deleteItemSchema.parse(req.body);

    const existingItem = await prisma.item.findUnique({
      where: { id: data.id }
    });

    if (!existingItem) {
      return res.status(404).json({ error: '아이템을 찾을 수 없습니다.' });
    }

    // 연관된 인벤토리/레이드 아이템이 있는지 확인
    const inventoryCount = await prisma.inventory.count({
      where: { item_id: data.id }
    });

    const raidItemCount = await prisma.raidItem.count({
      where: { item_id: data.id }
    });

    if (inventoryCount > 0 || raidItemCount > 0) {
      return res.status(409).json({ 
        error: '해당 아이템을 사용중인 데이터가 있어 삭제할 수 없습니다.',
        inventoryCount: inventoryCount,
        raidItemCount: raidItemCount
      });
    }

    await prisma.item.delete({
      where: { id: data.id }
    });

    console.log(`🗑️  아이템 삭제: ${existingItem.name} (ID: ${data.id})`);

    return res.status(204).send();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Delete item error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({
      count: items.length,
      items: items
    });

  } catch (error) {
    console.error('Get all items error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// ==================== 보스 관리 ====================

export const createBoss = async (req: Request, res: Response) => {
  try {
    const data = createBossSchema.parse(req.body);

    // JSON 유효성 검증
    try {
      JSON.parse(data.skills);
      if (data.aoePattern) JSON.parse(data.aoePattern);
    } catch (e) {
      return res.status(400).json({ error: 'skills 또는 aoePattern이 유효한 JSON이 아닙니다.' });
    }

    const boss = await prisma.boss.create({
      data: {
        name: data.name,
        hp: data.hp,
        skills: data.skills
      }
    });

    console.log(`👹 보스 생성: ${boss.name} (ID: ${boss.id})`);

    return res.status(201).json({
      message: '보스가 생성되었습니다.',
      boss: boss
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Create boss error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const updateBoss = async (req: Request, res: Response) => {
  try {
    const data = updateBossSchema.parse(req.body);

    const existingBoss = await prisma.boss.findUnique({
      where: { id: data.id }
    });

    if (!existingBoss) {
      return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });
    }

    // JSON 유효성 검증
    if (data.skills) {
      try {
        JSON.parse(data.skills);
      } catch (e) {
        return res.status(400).json({ error: 'skills가 유효한 JSON이 아닙니다.' });
      }
    }

    if (data.aoePattern) {
      try {
        JSON.parse(data.aoePattern);
      } catch (e) {
        return res.status(400).json({ error: 'aoePattern이 유효한 JSON이 아닙니다.' });
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.hp !== undefined) updateData.hp = data.hp;
    if (data.skills !== undefined) updateData.skills = data.skills;

    const boss = await prisma.boss.update({
      where: { id: data.id },
      data: updateData
    });

    console.log(`📝 보스 수정: ${boss.name} (ID: ${boss.id})`);

    return res.status(200).json({
      message: '보스가 수정되었습니다.',
      boss: boss
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Update boss error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const deleteBoss = async (req: Request, res: Response) => {
  try {
    const data = deleteBossSchema.parse(req.body);

    const existingBoss = await prisma.boss.findUnique({
      where: { id: data.id }
    });

    if (!existingBoss) {
      return res.status(404).json({ error: '보스를 찾을 수 없습니다.' });
    }

    // 연관된 레이드 팀이 있는지 확인
    const teamCount = await prisma.raidTeam.count({
      where: { boss_id: data.id }
    });

    if (teamCount > 0) {
      return res.status(409).json({ 
        error: '해당 보스를 사용중인 레이드 팀이 있어 삭제할 수 없습니다.',
        teamCount: teamCount
      });
    }

    await prisma.boss.delete({
      where: { id: data.id }
    });

    console.log(`🗑️  보스 삭제: ${existingBoss.name} (ID: ${data.id})`);

    return res.status(204).send();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Delete boss error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getAllBosses = async (req: Request, res: Response) => {
  try {
    const bosses = await prisma.boss.findMany({
      orderBy: { id: 'asc' }
    });

    const formattedBosses = bosses.map(boss => ({
      ...boss,
      skills: typeof boss.skills === 'string' ? JSON.parse(boss.skills) : boss.skills
    }));

    return res.status(200).json({
      count: bosses.length,
      bosses: formattedBosses
    });

  } catch (error) {
    console.error('Get all bosses error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// ==================== 맵 템플릿 관리 ====================
// 맵 데이터는 별도 테이블이 없으므로 메모리/파일로 관리하거나 새 테이블 생성 필요

const mapTemplates: Record<number, {
  id: number;
  day: number;
  locations: any;
  blockSchedule?: any;
}> = {};
let mapIdCounter = 1;

export const createMap = async (req: Request, res: Response) => {
  try {
    const data = createMapSchema.parse(req.body);

    // JSON 유효성 검증
    try {
      JSON.parse(data.locations);
      if (data.blockSchedule) JSON.parse(data.blockSchedule);
    } catch (e) {
      return res.status(400).json({ error: 'locations 또는 blockSchedule이 유효한 JSON이 아닙니다.' });
    }

    const mapId = mapIdCounter++;
    mapTemplates[mapId] = {
      id: mapId,
      day: data.day,
      locations: JSON.parse(data.locations),
      blockSchedule: data.blockSchedule ? JSON.parse(data.blockSchedule) : undefined
    };

    console.log(`🗺️  맵 템플릿 생성: ${data.day}일차 (ID: ${mapId})`);

    return res.status(201).json({
      message: '맵 템플릿이 생성되었습니다.',
      map: mapTemplates[mapId]
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Create map error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const updateMap = async (req: Request, res: Response) => {
  try {
    const data = updateMapSchema.parse(req.body);

    if (!mapTemplates[data.id]) {
      return res.status(404).json({ error: '맵 템플릿을 찾을 수 없습니다.' });
    }

    // JSON 유효성 검증
    if (data.locations) {
      try {
        JSON.parse(data.locations);
      } catch (e) {
        return res.status(400).json({ error: 'locations가 유효한 JSON이 아닙니다.' });
      }
    }

    if (data.blockSchedule) {
      try {
        JSON.parse(data.blockSchedule);
      } catch (e) {
        return res.status(400).json({ error: 'blockSchedule이 유효한 JSON이 아닙니다.' });
      }
    }

    if (data.day !== undefined) mapTemplates[data.id].day = data.day;
    if (data.locations !== undefined) mapTemplates[data.id].locations = JSON.parse(data.locations);
    if (data.blockSchedule !== undefined) mapTemplates[data.id].blockSchedule = JSON.parse(data.blockSchedule);

    console.log(`📝 맵 템플릿 수정: ${mapTemplates[data.id].day}일차 (ID: ${data.id})`);

    return res.status(200).json({
      message: '맵 템플릿이 수정되었습니다.',
      map: mapTemplates[data.id]
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Update map error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const deleteMap = async (req: Request, res: Response) => {
  try {
    const data = deleteMapSchema.parse(req.body);

    if (!mapTemplates[data.id]) {
      return res.status(404).json({ error: '맵 템플릿을 찾을 수 없습니다.' });
    }

    const map = mapTemplates[data.id];
    delete mapTemplates[data.id];

    console.log(`🗑️  맵 템플릿 삭제: ${map.day}일차 (ID: ${data.id})`);

    return res.status(204).send();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Delete map error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getAllMaps = async (req: Request, res: Response) => {
  try {
    const maps = Object.values(mapTemplates);

    return res.status(200).json({
      count: maps.length,
      maps: maps
    });

  } catch (error) {
    console.error('Get all maps error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// ==================== 공지 관리 ====================
// 공지도 별도 테이블이 없으므로 메모리로 관리 (실제로는 DB 테이블 생성 권장)

const notices: Array<{
  id: number;
  title: string;
  body: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}> = [];
let noticeIdCounter = 1;

export const createNotice = async (req: Request, res: Response) => {
  try {
    const data = createNoticeSchema.parse(req.body);

    const notice = {
      id: noticeIdCounter++,
      title: data.title,
      body: data.body,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdAt: new Date().toISOString()
    };

    notices.push(notice);

    console.log(`📢 공지 등록: ${notice.title} (ID: ${notice.id})`);

    return res.status(201).json({
      message: '공지가 등록되었습니다.',
      notice: notice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Create notice error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getAllNotices = async (req: Request, res: Response) => {
  try {
    // 현재 시간 기준 활성 공지만 필터링
    const now = new Date().toISOString();
    const activeNotices = notices.filter(notice => {
      const isStarted = !notice.startsAt || notice.startsAt <= now;
      const isNotEnded = !notice.endsAt || notice.endsAt >= now;
      return isStarted && isNotEnded;
    });

    return res.status(200).json({
      count: activeNotices.length,
      notices: activeNotices
    });

  } catch (error) {
    console.error('Get all notices error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// ==================== 스토리 노드 관리 ====================

const createStoryNodeSchema = z.object({
  nodeId: z.number().min(1),
  day: z.number().min(1).max(3),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  location: z.string().optional(),
  choices: z.array(z.object({
    choiceId: z.number().min(1),
    text: z.string().min(1).max(500),
    nextNodeId: z.number().min(1),
    actionPointCost: z.number().min(0).max(3).optional(),
    requirements: z.object({
      items: z.array(z.number()).optional(),
      energy: z.number().optional()
    }).optional()
  })).optional(),
  rewards: z.object({
    gold: z.number().optional(),
    items: z.array(z.object({
      itemId: z.number(),
      quantity: z.number()
    })).optional(),
    hp: z.number().optional(),
    energy: z.number().optional()
  }).optional(),
  isEndNode: z.boolean().optional()
});

const updateStoryNodeSchema = z.object({
  nodeId: z.number().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  location: z.string().optional(),
  choices: z.array(z.object({
    choiceId: z.number().min(1),
    text: z.string().min(1).max(500),
    nextNodeId: z.number().min(1),
    actionPointCost: z.number().min(0).max(3).optional(),
    requirements: z.object({
      items: z.array(z.number()).optional(),
      energy: z.number().optional()
    }).optional()
  })).optional(),
  rewards: z.object({
    gold: z.number().optional(),
    items: z.array(z.object({
      itemId: z.number(),
      quantity: z.number()
    })).optional(),
    hp: z.number().optional(),
    energy: z.number().optional()
  }).optional(),
  isEndNode: z.boolean().optional()
});

const deleteStoryNodeSchema = z.object({
  nodeId: z.number().min(1)
});

export const getAllStoryNodes = async (req: Request, res: Response) => {
  try {
    const { STORY_NODES } = require('../lib/storyNodes');
    
    const nodes = Object.entries(STORY_NODES).map(([nodeId, node]: [string, any]) => ({
      nodeId: parseInt(nodeId),
      ...node
    }));

    return res.status(200).json({
      count: nodes.length,
      nodes: nodes
    });

  } catch (error) {
    console.error('Get all story nodes error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const getStoryNodeById = async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const nodeIdNum = parseInt(nodeId);

    if (isNaN(nodeIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 노드 ID입니다.' });
    }

    const { STORY_NODES } = require('../lib/storyNodes');
    const node = STORY_NODES[nodeIdNum];

    if (!node) {
      return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
    }

    return res.status(200).json({
      nodeId: nodeIdNum,
      ...node
    });

  } catch (error) {
    console.error('Get story node error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const createStoryNode = async (req: Request, res: Response) => {
  try {
    const data = createStoryNodeSchema.parse(req.body);
    
    // storyNodes 모듈 동적으로 수정
    const storyNodesModule = require('../lib/storyNodes');
    const { STORY_NODES, CHOICE_TO_NODE } = storyNodesModule;

    // 이미 존재하는 노드 ID인지 확인
    if (STORY_NODES[data.nodeId]) {
      return res.status(409).json({ error: '이미 존재하는 노드 ID입니다.' });
    }

    // 새 노드 생성
    const newNode = {
      day: data.day,
      title: data.title,
      description: data.description,
      location: data.location,
      choices: data.choices || [],
      rewards: data.rewards,
      isEndNode: data.isEndNode || false
    };

    STORY_NODES[data.nodeId] = newNode;

    // 선택지 매핑 업데이트
    if (data.choices) {
      data.choices.forEach(choice => {
        CHOICE_TO_NODE[choice.choiceId] = choice.nextNodeId;
      });
    }

    console.log(`📖 스토리 노드 생성: ${data.title} (ID: ${data.nodeId})`);

    return res.status(201).json({
      message: '스토리 노드가 생성되었습니다.',
      node: {
        nodeId: data.nodeId,
        ...newNode
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Create story node error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const updateStoryNode = async (req: Request, res: Response) => {
  try {
    const data = updateStoryNodeSchema.parse(req.body);
    
    const storyNodesModule = require('../lib/storyNodes');
    const { STORY_NODES, CHOICE_TO_NODE } = storyNodesModule;

    if (!STORY_NODES[data.nodeId]) {
      return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
    }

    // 노드 업데이트
    const node = STORY_NODES[data.nodeId];
    if (data.title !== undefined) node.title = data.title;
    if (data.description !== undefined) node.description = data.description;
    if (data.location !== undefined) node.location = data.location;
    if (data.choices !== undefined) {
      node.choices = data.choices;
      
      // 선택지 매핑도 업데이트
      data.choices.forEach(choice => {
        CHOICE_TO_NODE[choice.choiceId] = choice.nextNodeId;
      });
    }
    if (data.rewards !== undefined) node.rewards = data.rewards;
    if (data.isEndNode !== undefined) node.isEndNode = data.isEndNode;

    console.log(`📝 스토리 노드 수정: ${node.title} (ID: ${data.nodeId})`);

    return res.status(200).json({
      message: '스토리 노드가 수정되었습니다.',
      node: {
        nodeId: data.nodeId,
        ...node
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Update story node error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const deleteStoryNode = async (req: Request, res: Response) => {
  try {
    const data = deleteStoryNodeSchema.parse(req.body);
    
    const storyNodesModule = require('../lib/storyNodes');
    const { STORY_NODES, CHOICE_TO_NODE } = storyNodesModule;

    if (!STORY_NODES[data.nodeId]) {
      return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
    }

    // 다른 노드에서 이 노드를 참조하는지 확인
    const referencingChoices: number[] = [];
    Object.entries(CHOICE_TO_NODE).forEach(([choiceId, nextNodeId]) => {
      if (nextNodeId === data.nodeId) {
        referencingChoices.push(parseInt(choiceId));
      }
    });

    if (referencingChoices.length > 0) {
      return res.status(409).json({
        error: '다른 노드의 선택지가 이 노드를 참조하고 있어 삭제할 수 없습니다.',
        referencingChoices: referencingChoices
      });
    }

    const nodeName = STORY_NODES[data.nodeId].title;
    delete STORY_NODES[data.nodeId];

    // 이 노드의 선택지들도 매핑에서 제거
    const choicesToRemove: number[] = [];
    Object.entries(CHOICE_TO_NODE).forEach(([choiceId, nextNodeId]) => {
      if (nextNodeId === data.nodeId) {
        choicesToRemove.push(parseInt(choiceId));
      }
    });

    choicesToRemove.forEach(choiceId => {
      delete CHOICE_TO_NODE[choiceId];
    });

    console.log(`🗑️  스토리 노드 삭제: ${nodeName} (ID: ${data.nodeId})`);

    return res.status(204).send();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Delete story node error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

// ==================== 선택지 관리 ====================

const createChoiceSchema = z.object({
  choiceId: z.number().min(1),
  nodeId: z.number().min(1),
  text: z.string().min(1).max(500),
  nextNodeId: z.number().min(1),
  actionPointCost: z.number().min(0).max(3).optional(),
  requirements: z.object({
    items: z.array(z.number()).optional(),
    energy: z.number().optional()
  }).optional()
});

const updateChoiceSchema = z.object({
  choiceId: z.number().min(1),
  text: z.string().min(1).max(500).optional(),
  nextNodeId: z.number().min(1).optional(),
  actionPointCost: z.number().min(0).max(3).optional(),
  requirements: z.object({
    items: z.array(z.number()).optional(),
    energy: z.number().optional()
  }).optional()
});

const deleteChoiceSchema = z.object({
  nodeId: z.number().min(1),
  choiceId: z.number().min(1)
});

export const createChoice = async (req: Request, res: Response) => {
  try {
    const data = createChoiceSchema.parse(req.body);
    
    const storyNodesModule = require('../lib/storyNodes');
    const { STORY_NODES, CHOICE_TO_NODE } = storyNodesModule;

    // 노드가 존재하는지 확인
    if (!STORY_NODES[data.nodeId]) {
      return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
    }

    // 이미 존재하는 선택지 ID인지 확인
    const node = STORY_NODES[data.nodeId];
    if (node.choices?.some((c: any) => c.choiceId === data.choiceId)) {
      return res.status(409).json({ error: '이미 존재하는 선택지 ID입니다.' });
    }

    // 다음 노드가 존재하는지 확인
    if (!STORY_NODES[data.nextNodeId]) {
      return res.status(400).json({ error: '다음 노드가 존재하지 않습니다.' });
    }

    // 선택지 생성
    const newChoice = {
      choiceId: data.choiceId,
      text: data.text,
      nextNodeId: data.nextNodeId,
      actionPointCost: data.actionPointCost,
      requirements: data.requirements
    };

    if (!node.choices) {
      node.choices = [];
    }
    node.choices.push(newChoice);

    // 매핑 업데이트
    CHOICE_TO_NODE[data.choiceId] = data.nextNodeId;

    console.log(`➕ 선택지 추가: ${data.text} (노드: ${data.nodeId}, 선택지: ${data.choiceId})`);

    return res.status(201).json({
      message: '선택지가 추가되었습니다.',
      choice: newChoice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Create choice error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const updateChoice = async (req: Request, res: Response) => {
  try {
    const data = updateChoiceSchema.parse(req.body);
    
    const storyNodesModule = require('../lib/storyNodes');
    const { STORY_NODES, CHOICE_TO_NODE } = storyNodesModule;

    // 선택지가 속한 노드 찾기
    let foundNode: any = null;
    let foundChoice: any = null;

    Object.values(STORY_NODES).forEach((node: any) => {
      if (node.choices) {
        const choice = node.choices.find((c: any) => c.choiceId === data.choiceId);
        if (choice) {
          foundNode = node;
          foundChoice = choice;
        }
      }
    });

    if (!foundChoice) {
      return res.status(404).json({ error: '선택지를 찾을 수 없습니다.' });
    }

    // 선택지 업데이트
    if (data.text !== undefined) foundChoice.text = data.text;
    if (data.nextNodeId !== undefined) {
      if (!STORY_NODES[data.nextNodeId]) {
        return res.status(400).json({ error: '다음 노드가 존재하지 않습니다.' });
      }
      foundChoice.nextNodeId = data.nextNodeId;
      CHOICE_TO_NODE[data.choiceId] = data.nextNodeId;
    }
    if (data.actionPointCost !== undefined) foundChoice.actionPointCost = data.actionPointCost;
    if (data.requirements !== undefined) foundChoice.requirements = data.requirements;

    console.log(`📝 선택지 수정: ${foundChoice.text} (ID: ${data.choiceId})`);

    return res.status(200).json({
      message: '선택지가 수정되었습니다.',
      choice: foundChoice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Update choice error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const deleteChoice = async (req: Request, res: Response) => {
  try {
    const data = deleteChoiceSchema.parse(req.body);
    
    const storyNodesModule = require('../lib/storyNodes');
    const { STORY_NODES, CHOICE_TO_NODE } = storyNodesModule;

    const node = STORY_NODES[data.nodeId];
    if (!node) {
      return res.status(404).json({ error: '스토리 노드를 찾을 수 없습니다.' });
    }

    if (!node.choices) {
      return res.status(404).json({ error: '해당 노드에 선택지가 없습니다.' });
    }

    const choiceIndex = node.choices.findIndex((c: any) => c.choiceId === data.choiceId);
    if (choiceIndex === -1) {
      return res.status(404).json({ error: '선택지를 찾을 수 없습니다.' });
    }

    const choiceText = node.choices[choiceIndex].text;
    node.choices.splice(choiceIndex, 1);
    delete CHOICE_TO_NODE[data.choiceId];

    console.log(`🗑️  선택지 삭제: ${choiceText} (노드: ${data.nodeId}, 선택지: ${data.choiceId})`);

    return res.status(204).send();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '입력 데이터가 유효하지 않습니다.',
        details: error.issues
      });
    }

    console.error('Delete choice error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

