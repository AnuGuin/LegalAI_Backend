import prisma from "../../config/database.js";
import cacheService from "../../services/cache.service.js";
import { AppError } from "../../middleware/error.middleware.js";

class UserService {
  async getUserProfile(userId: string) {
    // Check cache
    const cached = await cacheService.getUserData(userId);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        preferences: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Cache for 1 hour
    await cacheService.cacheUserData(userId, user, 3600);

    return user;
  }

  async updateUserProfile(
    userId: string,
    data: { name?: string; avatar?: string; preferences?: any }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        preferences: true,
      },
    });

    // Clear cache
    await cacheService.clearUserCache(userId);

    return user;
  }

  async getUserStats(userId: string) {
    const [conversationCount, documentCount, translationCount] = await Promise.all([
      prisma.conversation.count({ where: { userId } }),
      prisma.document.count({ where: { userId } }),
      prisma.translation.count({ where: { userId } }),
    ]);

    return {
      conversations: conversationCount,
      documents: documentCount,
      translations: translationCount,
    };
  }

  async deleteUser(userId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete user and related data (using cascade delete or manual cleanup)
    await prisma.$transaction(async (tx) => {
      // Delete related data first
      await tx.conversation.deleteMany({ where: { userId } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.translation.deleteMany({ where: { userId } });
      
      // Delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    // Clear cache
    await cacheService.clearUserCache(userId);

    return { message: 'User deleted successfully' };
  }
}

export default new UserService();