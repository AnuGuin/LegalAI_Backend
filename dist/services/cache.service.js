import redis from '../config/redis.js';
import crypto from 'crypto';
class CacheService {
    // Generate hash for cache key
    generateHash(data) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 16);
    }
    // Cache user data
    async cacheUserData(userId, data, ttl = 3600) {
        await redis.setex(`user:${userId}`, ttl, JSON.stringify(data));
    }
    async getUserData(userId) {
        const cached = await redis.get(`user:${userId}`);
        return cached ? JSON.parse(cached) : null;
    }
    // Cache conversation
    async cacheConversation(conversationId, data, ttl = 1800) {
        await redis.setex(`conversation:${conversationId}`, ttl, JSON.stringify(data));
    }
    async getConversation(conversationId) {
        const cached = await redis.get(`conversation:${conversationId}`);
        return cached ? JSON.parse(cached) : null;
    }
    // Cache AI responses
    async cacheAIResponse(query, mode, response, ttl = 7200) {
        const hash = this.generateHash({ query, mode });
        await redis.setex(`ai:${hash}`, ttl, JSON.stringify(response));
    }
    async getAIResponse(query, mode) {
        const hash = this.generateHash({ query, mode });
        const cached = await redis.get(`ai:${hash}`);
        return cached ? JSON.parse(cached) : null;
    }
    // Cache translation
    async cacheTranslation(text, sourceLang, targetLang, translation, ttl = 86400) {
        const hash = this.generateHash({ text, sourceLang, targetLang });
        await redis.setex(`translation:${hash}`, ttl, translation);
    }
    async getTranslation(text, sourceLang, targetLang) {
        const hash = this.generateHash({ text, sourceLang, targetLang });
        return await redis.get(`translation:${hash}`);
    }
    // Invalidate cache
    async invalidate(pattern) {
        // Note: Upstash Redis doesn't support KEYS command
        // Use pattern-based deletion carefully
        await redis.del(pattern);
    }
    // Clear user cache
    async clearUserCache(userId) {
        await redis.del(`user:${userId}`);
    }
}
export default new CacheService();
//# sourceMappingURL=cache.service.js.map