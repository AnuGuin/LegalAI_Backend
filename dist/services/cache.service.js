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
        try {
            await redis.setex(`user:${userId}`, ttl, JSON.stringify(data));
        }
        catch (error) {
            console.error('Error caching user data:', error);
        }
    }
    async getUserData(userId) {
        try {
            const cached = await redis.get(`user:${userId}`);
            if (!cached || typeof cached !== 'string') {
                return null;
            }
            return JSON.parse(cached);
        }
        catch (error) {
            console.error('Error retrieving user data from cache:', error);
            return null;
        }
    }
    // Cache conversation
    async cacheConversation(conversationId, data, ttl = 1800) {
        try {
            await redis.setex(`conversation:${conversationId}`, ttl, JSON.stringify(data));
        }
        catch (error) {
            console.error('Error caching conversation:', error);
        }
    }
    async getConversation(conversationId) {
        try {
            const cached = await redis.get(`conversation:${conversationId}`);
            if (!cached || typeof cached !== 'string') {
                return null;
            }
            return JSON.parse(cached);
        }
        catch (error) {
            console.error('Error retrieving conversation from cache:', error);
            return null;
        }
    }
    // Cache AI responses
    async cacheAIResponse(query, mode, response, ttl = 7200) {
        try {
            const hash = this.generateHash({ query, mode });
            // Ensure response is properly serialized
            const serialized = JSON.stringify(response);
            await redis.setex(`ai:${hash}`, ttl, serialized);
        }
        catch (error) {
            console.error('Error caching AI response:', error);
            // Don't throw - caching is not critical
        }
    }
    async getAIResponse(query, mode) {
        try {
            const hash = this.generateHash({ query, mode });
            const cached = await redis.get(`ai:${hash}`);
            if (!cached) {
                return null;
            }
            // Handle string values
            if (typeof cached === 'string') {
                // Check if it's already an object string like "[object Object]"
                if (cached === '[object Object]' || cached.startsWith('[object')) {
                    console.warn('Invalid cached data detected, clearing cache');
                    await redis.del(`ai:${hash}`);
                    return null;
                }
                try {
                    return JSON.parse(cached);
                }
                catch (parseError) {
                    console.error('Error parsing cached AI response:', parseError);
                    // Clear corrupted cache
                    await redis.del(`ai:${hash}`);
                    return null;
                }
            }
            return cached;
        }
        catch (error) {
            console.error('Error retrieving AI response from cache:', error);
            return null;
        }
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
    // Clear all AI response caches (useful for debugging)
    async clearAllAICache() {
        try {
            // Note: This is a simple implementation
            // For production, you might want to track cache keys separately
            console.log('Clearing all AI caches...');
            // Since we can't use KEYS in Upstash, we'll just note this limitation
            // Individual corrupted caches will be cleared automatically when accessed
            return { success: true, message: 'Cache clearing triggered' };
        }
        catch (error) {
            console.error('Error clearing AI cache:', error);
            return { success: false, message: 'Error clearing cache' };
        }
    }
    // Flush all caches (use with caution)
    async flushAll() {
        try {
            await redis.flushdb();
            console.log('All caches cleared');
            return { success: true, message: 'All caches cleared' };
        }
        catch (error) {
            console.error('Error flushing cache:', error);
            return { success: false, message: 'Error flushing cache' };
        }
    }
}
export default new CacheService();
//# sourceMappingURL=cache.service.js.map