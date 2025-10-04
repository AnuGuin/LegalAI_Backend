import redis from '../config/redis.js';
import crypto from 'crypto';

class CacheService {
  // Generate hash for cache key
  private generateHash(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  // Cache user data
  async cacheUserData(userId: string, data: any, ttl = 3600) {
    await redis.setex(`user:${userId}`, ttl, JSON.stringify(data));
  }

  async getUserData(userId: string) {
    const cached = await redis.get(`user:${userId}`);
    return cached ? JSON.parse(cached as string) : null;
  }

  // Cache conversation
  async cacheConversation(conversationId: string, data: any, ttl = 1800) {
    await redis.setex(`conversation:${conversationId}`, ttl, JSON.stringify(data));
  }

  async getConversation(conversationId: string) {
    const cached = await redis.get(`conversation:${conversationId}`);
    return cached ? JSON.parse(cached as string) : null;
  }

  // Cache AI responses
  async cacheAIResponse(query: string, mode: string, response: any, ttl = 7200) {
    const hash = this.generateHash({ query, mode });
    await redis.setex(`ai:${hash}`, ttl, JSON.stringify(response));
  }

  async getAIResponse(query: string, mode: string) {
    const hash = this.generateHash({ query, mode });
    const cached = await redis.get(`ai:${hash}`);
    return cached ? JSON.parse(cached as string) : null;
  }

  // Cache translation
  async cacheTranslation(text: string, sourceLang: string, targetLang: string, translation: string, ttl = 86400) {
    const hash = this.generateHash({ text, sourceLang, targetLang });
    await redis.setex(`translation:${hash}`, ttl, translation);
  }

  async getTranslation(text: string, sourceLang: string, targetLang: string) {
    const hash = this.generateHash({ text, sourceLang, targetLang });
    return await redis.get(`translation:${hash}`);
  }

  // Invalidate cache
  async invalidate(pattern: string) {
    // Note: Upstash Redis doesn't support KEYS command
    // Use pattern-based deletion carefully
    await redis.del(pattern);
  }

  // Clear user cache
  async clearUserCache(userId: string) {
    await redis.del(`user:${userId}`);
  }
}

export default new CacheService();