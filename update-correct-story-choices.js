const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCorrectStoryChoices() {
  try {
    console.log('🔧 올바른 스토리 선택지 업데이트 중...');
    
    // 기존 StoryChoice 데이터 삭제
    await prisma.storyChoice.deleteMany({});
    await prisma.choiceRequirement.deleteMany({});
    
    console.log('✅ 기존 선택지 데이터 삭제 완료');
    
    // 선택지 ID 카운터
    let choiceIdCounter = 1;
    
    // 노드 1 (튜토리얼) - 계속
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 1,
          choice_text: "계속",
          target_node_id: 300, // 노드 300으로 이동
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 300 (세 갈래 길) - 루트 1-1 / 루트 1-2
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 300,
          choice_text: "루트 1-1. 정보 파는 사람",
          target_node_id: 2,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 300,
          choice_text: "루트 1-2. 무장 강도",
          target_node_id: 9,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 2 (정보 파는 사람) - 정보요? / 무시한다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 2,
          choice_text: "정보요?",
          target_node_id: 3,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 2,
          choice_text: "무시한다",
          target_node_id: 7,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 3 (정보요?) - 돈 / 매력 / 무시
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 3,
          choice_text: "[돈] 네…….",
          target_node_id: 4,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 3,
          choice_text: "[매력] 그냥 알려주시면 안 돼요?",
          target_node_id: 5,
          order_index: 2,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 3,
          choice_text: "무시한다",
          target_node_id: 7,
          order_index: 3,
          is_available: true
        }
      ]
    });
    
    // 노드 4 ([돈] 네…….) - 그게 무슨 말이죠?
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 4,
          choice_text: "그게 무슨 말이죠?",
          target_node_id: 6,
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 5 ([매력] 그냥 알려주시면 안 돼요?) - 그게 무슨 말이죠?
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 5,
          choice_text: "그게 무슨 말이죠?",
          target_node_id: 6,
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 6 (그게 무슨 말이죠?) - 계속 나아간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 6,
          choice_text: "계속 나아간다",
          target_node_id: 12, // 체크포인트 2-1
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 7 (무시한다) - 계속 나아간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 7,
          choice_text: "계속 나아간다",
          target_node_id: 12, // 체크포인트 2-1
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 9 (무장 강도) - 매력/언변술 / 무슨 일 / 도망
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 9,
          choice_text: "[매력/언변술] 무슨 일 있으세요?",
          target_node_id: 10,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 9,
          choice_text: "무슨 일 있으세요? (랜덤)",
          target_node_id: 10,
          order_index: 2,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 9,
          choice_text: "도망친다",
          target_node_id: 12, // 체크포인트 2-1
          order_index: 3,
          is_available: true
        }
      ]
    });
    
    // 노드 10 ([매력/언변술] 무슨 일 있으세요?) - 총 뺏기 / 꿀밤
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 10,
          choice_text: "총을 뺏고 간다",
          target_node_id: 11,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 10,
          choice_text: "그래도 강도는 나쁜 짓이에요! 꿀밤을 쥐어박고 간다",
          target_node_id: 11,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 11 (총을 뺏고 간다 / 꿀밤) - 계속 나아간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 11,
          choice_text: "계속 나아간다",
          target_node_id: 12, // 체크포인트 2-1
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 12 (체크포인트 2-1) - 여자 따라가기 / 강도 따라가기
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 12,
          choice_text: "여자를 따라간다",
          target_node_id: 13, // 랜덤 트리거 1
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 12,
          choice_text: "강도를 따라간다",
          target_node_id: 13, // 랜덤 트리거 1
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 랜덤 트리거 노드들 (13-17) - 상황을 확인한다
    for (let i = 13; i <= 17; i++) {
      await prisma.storyChoice.createMany({
        data: [
          {
            id: choiceIdCounter++,
            story_node_id: i,
            choice_text: "상황을 확인한다",
            target_node_id: i + 1, // 다음 랜덤 트리거 또는 체크포인트
            order_index: 1,
            is_available: true
          }
        ]
      });
    }
    
    console.log(`\n🎉 올바른 스토리 선택지 업데이트 완료!`);
    console.log(`  - 생성된 선택지: ${choiceIdCounter - 1}개`);
    console.log(`  - 플로우: 튜토리얼 → 노드 300 → 루트들 → 체크포인트 2-1 → 랜덤 트리거들`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCorrectStoryChoices();
