import { Request, Response } from 'express';
import { PrismaClient, TimeEntryType } from '@prisma/client';
import { auditLogger } from '../services/auditLogger.js';

const prisma = new PrismaClient();

// 現在のステータスを取得
export const getCurrentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 今日の最新の記録を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        timestamp: {
          gte: today,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // ステータスを判定
    let status: 'none' | 'checked_in' | 'on_break' | 'checked_out' = 'none';
    if (latestEntry) {
      switch (latestEntry.type) {
        case TimeEntryType.CHECK_IN:
          status = 'checked_in';
          break;
        case TimeEntryType.BREAK_START:
          status = 'on_break';
          break;
        case TimeEntryType.BREAK_END:
          status = 'checked_in';
          break;
        case TimeEntryType.CHECK_OUT:
          status = 'checked_out';
          break;
      }
    }

    res.json({ status, latestEntry });
  } catch (error) {
    console.error('Error getting current status:', error);
    res.status(500).json({ error: 'Failed to get current status' });
  }
};

// 時間記録を作成（出勤、退勤、休憩開始、休憩終了）
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type } = req.body;
    if (!type || !Object.values(TimeEntryType).includes(type)) {
      return res.status(400).json({ error: 'Invalid time entry type' });
    }

    // 今日の最新の記録を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        timestamp: {
          gte: today,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // 状態遷移のバリデーション
    if (!isValidTransition(latestEntry?.type, type)) {
      return res.status(400).json({
        error: `Invalid transition from ${latestEntry?.type || 'none'} to ${type}`,
      });
    }

    // 新しい記録を作成
    const newEntry = await prisma.timeEntry.create({
      data: {
        userId,
        type: type as TimeEntryType,
      },
    });

    // 監査ログに記録
    const clientInfo = auditLogger.getClientInfo(req);
    await auditLogger.log({
      userId,
      action: type,
      resourceType: 'TimeEntry',
      resourceId: newEntry.id,
      details: {
        type,
        timestamp: newEntry.timestamp,
      },
      ...clientInfo,
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating time entry:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
};

// 履歴を取得
export const getTimeEntries = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { startDate, endDate, limit = 100 } = req.query;

    const where: {
      userId: string;
      timestamp?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      userId,
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: Number(limit),
    });

    res.json(entries);
  } catch (error) {
    console.error('Error getting time entries:', error);
    res.status(500).json({ error: 'Failed to get time entries' });
  }
};

// 状態遷移のバリデーション関数
function isValidTransition(
  currentType: TimeEntryType | null | undefined,
  newType: TimeEntryType
): boolean {
  // 初回の記録の場合、出勤のみ許可
  if (!currentType) {
    return newType === TimeEntryType.CHECK_IN;
  }

  // 現在の状態から遷移可能な状態を定義
  const validTransitions: Record<TimeEntryType, TimeEntryType[]> = {
    [TimeEntryType.CHECK_IN]: [TimeEntryType.BREAK_START, TimeEntryType.CHECK_OUT],
    [TimeEntryType.BREAK_START]: [TimeEntryType.BREAK_END],
    [TimeEntryType.BREAK_END]: [TimeEntryType.BREAK_START, TimeEntryType.CHECK_OUT],
    [TimeEntryType.CHECK_OUT]: [], // 退勤後は追加の操作不可
  };

  return validTransitions[currentType].includes(newType);
}

