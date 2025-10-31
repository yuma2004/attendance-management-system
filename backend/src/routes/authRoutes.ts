import express from 'express';
import passport from '../config/passport.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Google認証開始
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google認証コールバック
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL + '/login?error=auth_failed',
  }),
  (req, res) => {
    // 認証成功後、フロントエンドにリダイレクト
    res.redirect(process.env.FRONTEND_URL + '/');
  }
);

// 現在のユーザー情報を取得
router.get('/me', requireAuth, (req, res) => {
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

// ログアウト
router.post('/logout', requireAuth, (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;

