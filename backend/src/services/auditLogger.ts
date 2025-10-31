import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  adminId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const auditLogger = {
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          adminId: data.adminId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          details: data.details || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // 監査ログの記録失敗は例外を投げずにログに記録
      // 監査ログが記録できない場合でも処理は継続
    }
  },

  getClientInfo(req: { ip?: string; headers?: { 'user-agent'?: string } }): {
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      ipAddress: req.ip || req.headers?.['x-forwarded-for']?.toString() || undefined,
      userAgent: req.headers?.['user-agent'] || undefined,
    };
  },
};

