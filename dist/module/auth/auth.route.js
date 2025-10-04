import { Router } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import passport from '../../config/passport.js';
const router = Router();
// Local auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);
// Meta OAuth
router.get('/meta', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/meta/callback', passport.authenticate('facebook', { session: false }), authController.metaCallback);
export default router;
//# sourceMappingURL=auth.route.js.map