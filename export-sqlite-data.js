const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('📊 SQLite 데이터 내보내기 시작...');
    
    const exportData = {
      users: await prisma.user.findMany(),
      stories: await prisma.story.findMany(),
      nodes: await prisma.node.findMany(),
      choices: await prisma.choice.findMany(),
      resources: await prisma.resource.findMany(),
      userResources: await prisma.userResource.findMany(),
      choiceConstraints: await prisma.choiceConstraint.findMany(),
      choiceResults: await prisma.choiceResult.findMany(),
      checkpoints: await prisma.checkpoint.findMany(),
      userCheckpoints: await prisma.userCheckpoint.findMany(),
      userSaveStates: await prisma.userSaveState.findMany(),
      items: await prisma.item.findMany(),
      inventory: await prisma.inventory.findMany(),
      raidTeams: await prisma.raidTeam.findMany(),
      teamMembers: await prisma.teamMember.findMany(),
      raidItems: await prisma.raidItem.findMany(),
      bosses: await prisma.boss.findMany(),
      abilities: await prisma.ability.findMany(),
      userAbilities: await prisma.userAbility.findMany(),
      investigationSessions: await prisma.investigationSession.findMany(),
      dailyInvestigationCount: await prisma.dailyInvestigationCount.findMany(),
      storyAbilities: await prisma.storyAbility.findMany(),
      userStoryAbilities: await prisma.userStoryAbility.findMany(),
      storyItems: await prisma.storyItem.findMany(),
      userStoryItems: await prisma.userStoryItem.findMany(),
      randomStories: await prisma.randomStory.findMany(),
      mainStories: await prisma.mainStory.findMany(),
      storyChoices: await prisma.storyChoice.findMany(),
      choiceRequirements: await prisma.choiceRequirement.findMany(),
      storyProgress: await prisma.storyProgress.findMany(),
    };

    const filename = `sqlite-export-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ 데이터 내보내기 완료: ${filename}`);
    console.log(`📈 총 레코드 수: ${Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0)}`);
    
    // 각 테이블별 레코드 수 출력
    Object.entries(exportData).forEach(([table, data]) => {
      if (data.length > 0) {
        console.log(`  - ${table}: ${data.length}개 레코드`);
      }
    });

  } catch (error) {
    console.error('❌ 데이터 내보내기 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
