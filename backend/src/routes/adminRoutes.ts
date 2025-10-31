import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  getAllUsersStatus,
  getUserTimeEntries,
  getAuditLogs,
  updateUserRole,
} from '../controllers/adminController.js';

const router = express.Router();

// 認証と管理者権限が必要
router.use(requireAuth);
router.use(requireAdmin);

router.get('/users/status', getAllUsersStatus);
router.get('/users/:userId/time-entries', getUserTimeEntries);
router.get('/audit-logs', getAuditLogs);
router.patch('/users/:userId/role', updateUserRole);

export default router;

