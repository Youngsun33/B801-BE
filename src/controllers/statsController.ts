import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hp: true,
        energy: true,
        gold: true,
        attack_power: true,
        is_alive: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json(user);

  } catch (error) {
    console.error('Get user stats error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};

export const reviveUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdNum }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 소생 (HP 회복, is_alive true)
    await prisma.user.update({
      where: { id: userIdNum },
      data: {
        hp: 100, // 최대 HP로 회복
        is_alive: true
      }
    });

    return res.status(204).send();

  } catch (error) {
    console.error('Revive user error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}; 