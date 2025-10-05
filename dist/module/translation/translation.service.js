import prisma from '../../config/database.js';
import pythonBackend from '../../services/python-backend.service.js';
import cacheService from '../../services/cache.service.js';
class TranslationService {
    async translate(userId, text, sourceLang, targetLang) {
        // Check cache first
        const cached = await cacheService.getTranslation(text, sourceLang, targetLang);
        if (cached && typeof cached === 'string') {
            return {
                sourceText: text,
                translatedText: cached,
                sourceLang,
                targetLang,
                cached: true,
            };
        }
        // Call Python backend
        const result = await pythonBackend.translate(text, sourceLang, targetLang);
        // Extract translated text
        const translatedText = result.translated_text || '';
        if (!translatedText) {
            throw new Error('Translation failed: No translated text returned');
        }
        // Save to database
        await prisma.translation.create({
            data: {
                userId,
                sourceText: text,
                translatedText,
                sourceLang,
                targetLang,
                metadata: {},
            },
        });
        // Cache the translation
        await cacheService.cacheTranslation(text, sourceLang, targetLang, translatedText);
        return {
            sourceText: text,
            translatedText,
            sourceLang,
            targetLang,
            cached: false,
        };
    }
    async detectLanguage(text) {
        // Validate input
        if (!text || text.trim().length === 0) {
            throw new Error('Text is required for language detection');
        }
        // Call Python backend
        const result = await pythonBackend.detectLanguage(text);
        return {
            language: result.suggested_output.language,
            display_name: result.suggested_output.display_name,
        };
    }
    async getUserTranslations(userId) {
        const translations = await prisma.translation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return translations;
    }
}
export default new TranslationService();
//# sourceMappingURL=translation.service.js.map