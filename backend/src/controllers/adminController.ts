import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auditLogger } from '../services/auditLogger.js';

const prisma = new PrismaClient();

// 全ユーザーの現在のステータスを取得
export const getAllUsersStatus = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        role: true,
      },
    });

    // 各ユーザーの今日の最新の記録を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userStatuses = await Promise.all(
      users.map(async (user) => {
        const latestEntry = await prisma.timeEntry.findFirst({
          where: {
            userId: user.id,
            timestamp: {
              gte: today,
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        });

        let status: 'none' | 'checked_in' | 'on_break' | 'checked_out' = 'none';
        if (latestEntry) {
          switch (latestEntry.type) {
            case 'CHECK_IN':
              status = 'checked_in';
              break;
            case 'BREAK_START':
              status = 'on_break';
              break;
            case 'BREAK_END':
              status = 'checked_in';
              break;
            case 'CHECK_OUT':
              status = 'checked_out';
              break;
          }
        }

        return {
          ...user,
          status,
          latestEntry,
        };
      })
    );

    res.json(userStatuses);
  } catch (error) {
    console.error('Error getting all users status:', error);
    res.status(500).json({ error: 'Failed to get all users status' });
  }
};

// 特定ユーザーの時間記録を取得
export const getUserTimeEntries = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
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
    console.error('Error getting user time entries:', error);
    res.status(500).json({ error: 'Failed to get user time entries' });
  }
};

// 監査ログを取得
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, action, resourceType, startDate, endDate, limit = 100 } = req.query;

    const where: {
      userId?: string;
      adminId?: string;
      action?: string;
      resourceType?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (resourceType) {
      where.resourceType = resourceType as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(limit),
    });

    res.json(logs);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

// ユーザーのロールを変更（管理者のみ）
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user?.id;

    if (!role || (role !== 'USER' && role !== 'ADMIN')) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // 監査ログに記録
    const clientInfo = auditLogger.getClientInfo(req);
    await auditLogger.log({
      adminId,
      userId,
      action: 'USER_ROLE_UPDATED',
      resourceType: 'User',
      resourceId: userId,
      details: {
        oldRole: user.role,
        newRole: role,
      },
      ...clientInfo,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

