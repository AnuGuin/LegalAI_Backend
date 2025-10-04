declare class TranslationService {
    translate(userId: string, text: string, sourceLang: string, targetLang: string): Promise<{
        sourceText: string;
        translatedText: {};
        sourceLang: string;
        targetLang: string;
        cached: boolean;
    }>;
    detectLanguage(text: string): Promise<{
        language: string;
        confidence: number | undefined;
        metadata: Record<string, any> | undefined;
    }>;
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