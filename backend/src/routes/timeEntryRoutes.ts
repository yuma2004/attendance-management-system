import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  getCurrentStatus,
  createTimeEntry,
  getTimeEntries,
} from '../controllers/timeEntriesController.js';

const router = express.Router();

// 認証が必要なすべてのルートにミドルウェアを適用
router.use(requireAuth);

router.get('/current-status', getCurrentStatus);
router.post('/', createTimeEntry);
router.get('/', getTimeEntries);

export default router;

