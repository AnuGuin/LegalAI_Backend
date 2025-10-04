import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database.js';
import { AppError } from '../../middleware/error.middleware.js';
import cacheService from '../../services/cache.service.js';
class AuthService {
    async register(email, password, name) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new AppError('User already exists', 400);
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                provider: 'LOCAL',
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
            },
        });
        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens(user.id);
        // Store refresh token
        await this.storeRefreshToken(user.id, refreshToken);
        return {
            user,
            accessToken,
            refreshToken,
        };
    }
    async login(email, password) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.password) {
            throw new AppError('Invalid credentials', 401);
        }
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens(user.id);
        // Store refresh token
        await this.storeRefreshToken(user.id, refreshToken);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
            },
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            // Check if refresh token exists in DB
            const storedToken = await prisma.refreshToken.findFirst({
                where: {
                    token: refreshToken,
                    userId: decoded.userId,
                    expiresAt: { gte: new Date() },
                },
            });
            if (!storedToken) {
                throw new AppError('Invalid refresh token', 401);
            }
            // Generate new tokens
            const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(decoded.userId);
            // Delete old refresh token
            await prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            // Store new refresh token
            await this.storeRefreshToken(decoded.userId, newRefreshToken);
            return {
                accessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            throw new AppError('Invalid refresh token', 401);
        }
    }
    async logout(userId, refreshToken) {
        // Delete refresh token
        await prisma.refreshToken.deleteMany({
            where: {
                userId,
                token: refreshToken,
            },
        });
        // Clear user cache
        await cacheService.clearUserCache(userId);
    }
    generateTokens(userId) {
        const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
        const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
        return { accessToken, refreshToken };
    }
    async storeRefreshToken(userId, token) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }
    async handleOAuthCallback(user) {
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens(user.id);
        // Store refresh token
        await this.storeRefreshToken(user.id, refreshToken);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
            },
            accessToken,
            refreshToken,
        };
    }
}
export default new AuthService();
//# sourceMappingURL=auth.service.js.map