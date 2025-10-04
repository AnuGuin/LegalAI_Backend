import authService from './auth.service.js';
class AuthController {
    async register(req, res, next) {
        try {
            const { email, password, name } = req.body;
            const result = await authService.register(email, password, name);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const userId = req.user.id;
            await authService.logout(userId, refreshToken);
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async googleCallback(req, res, next) {
        try {
            const user = req.user;
            const result = await authService.handleOAuthCallback(user);
            // Redirect to frontend with tokens
            const frontendUrl = process.env.FRONTEND_URL;
            res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`);
        }
        catch (error) {
            next(error);
        }
    }
    async metaCallback(req, res, next) {
        try {
            const user = req.user;
            const result = await authService.handleOAuthCallback(user);
            // Redirect to frontend with tokens
            const frontendUrl = process.env.FRONTEND_URL;
            res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`);
        }
        catch (error) {
            next(error);
        }
    }
}
export default new AuthController();
//# sourceMappingURL=auth.controller.js.map