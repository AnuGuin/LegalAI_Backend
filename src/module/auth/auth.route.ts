import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import passport from '../../config/passport.js';

const router = Router();

// Local auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, (req: Request, res: Response, next: NextFunction) => 
  authController.logout(req as AuthRequest, res, next)
);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback
);

// Meta OAuth
router.get(
  '/meta',
  passport.authenticate('facebook', { scope: ['profile','email'] })
);
router.get(
  '/meta/callback',
  passport.authenticate('facebook', { session: false }),
  authController.metaCallback
);

export default router;
