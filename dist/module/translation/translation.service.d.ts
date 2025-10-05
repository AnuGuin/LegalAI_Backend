interface TranslationResult {
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    cached: boolean;
}
interface LanguageDetectionResult {
    language: string;
    display_name: string;
}
declare class TranslationService {
    translate(userId: string, text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>;
    detectLanguage(text: string): Promise<LanguageDetectionResult>;
    getUserTranslations(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        sourceText: string;
        translatedText: string;
        sourceLang: string;
        targetLang: string;
    }[]>;
}
declare const _default: TranslationService;
export default _default;
//# sourceMappingURL=translation.service.d.ts.map