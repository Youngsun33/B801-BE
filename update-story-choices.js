const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateStoryChoices() {
  try {
    console.log('🔧 스토리 선택지 업데이트 중...');
    
    // 기존 StoryChoice 데이터 삭제
    await prisma.storyChoice.deleteMany({});
    await prisma.choiceRequirement.deleteMany({});
    
    console.log('✅ 기존 선택지 데이터 삭제 완료');
    
    // 선택지 ID 카운터
    let choiceIdCounter = 1;
    
    // 노드 1 (시작) - 루트 선택
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 1,
          choice_text: "루트 1",
          target_node_id: 2,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 1,
          choice_text: "루트 2", 
          target_node_id: 19,
          order_index: 2,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 1,
          choice_text: "루트 3",
          target_node_id: 23,
          order_index: 3,
          is_available: true
        }
      ]
    });
    
    // 노드 2 (루트 1) - 정보 파는 사람 / 무장 강도
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 2,
          choice_text: "루트 1-1. 정보 파는 사람",
          target_node_id: 3,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 2,
          choice_text: "루트 1-2. 무장 강도",
          target_node_id: 9,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 3 (정보 파는 사람) - 정보요? / 무시한다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 3,
          choice_text: "정보요?",
          target_node_id: 4,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 3,
          choice_text: "무시한다",
          target_node_id: 8,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 4 (정보요?) - 돈 / 매력 / 무시
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 4,
          choice_text: "[돈] 네…….",
          target_node_id: 5,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 4,
          choice_text: "[매력] 그냥 알려주시면 안 돼요?",
          target_node_id: 6,
          order_index: 2,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 4,
          choice_text: "무시한다",
          target_node_id: 8,
          order_index: 3,
          is_available: true
        }
      ]
    });
    
    // 노드 5 ([돈] 네…….) - 그럼 어떤데요?
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 5,
          choice_text: "그럼 어떤데요?",
          target_node_id: 7,
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 6 ([매력] 그냥 알려주시면 안 돼요?) - 그럼 어떤데요?
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 6,
          choice_text: "그럼 어떤데요?",
          target_node_id: 7,
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 7 (그게 무슨 말이죠?) - 계속 나아간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 7,
          choice_text: "계속 나아간다",
          target_node_id: 15, // 체크포인트 2-1
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 8 (무시한다) - 계속 나아간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 8,
          choice_text: "계속 나아간다",
          target_node_id: 15, // 체크포인트 2-1
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
          target_node_id: 15, // 체크포인트 2-1
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
          target_node_id: 12,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 11 (총을 뺏고 간다) - 계속 나아간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 11,
          choice_text: "계속 나아간다",
          target_node_id: 15, // 체크포인트 2-1
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 12 (그래도 강도는 나쁜 짓이에요!) - 계속 나아간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 12,
          choice_text: "계속 나아간다",
          target_node_id: 15, // 체크포인트 2-1
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 15 (체크포인트 2-1) - 여자 따라가기 / 강도 따라가기
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 15,
          choice_text: "여자를 따라간다",
          target_node_id: 16,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 15,
          choice_text: "강도를 따라간다",
          target_node_id: 17,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 16 (여자를 따라간다) - 계속 간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 16,
          choice_text: "계속 간다",
          target_node_id: 22, // 랜덤 트리거 1
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 노드 17 (강도를 따라간다) - 계속 간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 17,
          choice_text: "계속 간다",
          target_node_id: 22, // 랜덤 트리거 1
          order_index: 1,
          is_available: true
        }
      ]
    });
    
    // 루트 2와 3의 선택지들도 추가
    // 노드 19 (루트 2) - 쫓기는 학생 / 수상한 테러범
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 19,
          choice_text: "루트 2-1. 쫓기는 학생",
          target_node_id: 20,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 19,
          choice_text: "루트 2-2. 수상한 테러범",
          target_node_id: 21,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 20 (쫓기는 학생) - 숨겨준다 / 무시하고 간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 20,
          choice_text: "숨겨준다",
          target_node_id: 23, // 랜덤 트리거 2
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 20,
          choice_text: "무시하고 간다",
          target_node_id: 23, // 랜덤 트리거 2
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 21 (수상한 테러범) - 은신술 / 확인 / 지나간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 21,
          choice_text: "(은신술) 확인해 본다",
          target_node_id: 24, // 랜덤 트리거 3
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 21,
          choice_text: "확인해 본다. (확률 50)",
          target_node_id: 24, // 랜덤 트리거 3
          order_index: 2,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 21,
          choice_text: "그냥 지나간다",
          target_node_id: 24, // 랜덤 트리거 3
          order_index: 3,
          is_available: true
        }
      ]
    });
    
    // 노드 23 (루트 3) - 부상 당한 미군 / 사기꾼
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 23,
          choice_text: "루트 3-1. 부상 당한 미군",
          target_node_id: 24,
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 23,
          choice_text: "루트 3-2. 사기꾼",
          target_node_id: 25,
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 24 (부상 당한 미군) - 괜찮으세요? / 무시하고 간다
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 24,
          choice_text: "괜찮으세요?",
          target_node_id: 26, // 랜덤 트리거 4
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 24,
          choice_text: "무시하고 간다",
          target_node_id: 26, // 랜덤 트리거 4
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    // 노드 25 (사기꾼) - 뭘 팔면 되죠? / 사기나 칠까
    await prisma.storyChoice.createMany({
      data: [
        {
          id: choiceIdCounter++,
          story_node_id: 25,
          choice_text: "음. 뭘 팔면 되죠?",
          target_node_id: 27, // 랜덤 트리거 5
          order_index: 1,
          is_available: true
        },
        {
          id: choiceIdCounter++,
          story_node_id: 25,
          choice_text: "사기나 칠까…….",
          target_node_id: 27, // 랜덤 트리거 5
          order_index: 2,
          is_available: true
        }
      ]
    });
    
    console.log(`\n🎉 스토리 선택지 업데이트 완료!`);
    console.log(`  - 생성된 선택지: ${choiceIdCounter - 1}개`);
    console.log(`  - 노드 연결: 완료`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStoryChoices();
