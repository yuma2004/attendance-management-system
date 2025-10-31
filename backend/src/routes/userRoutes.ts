import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);

// 自分のユーザー情報を取得
router.get('/me', (req, res) => {
  if (req.user) {
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      role: req.user.role,
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;

