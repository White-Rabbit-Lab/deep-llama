import { z } from "zod";
import { container } from "../../../main/di/container.js";
import {
  SupportedLanguage,
  TranslationRequest,
  TranslationResponse,
} from "../../../shared/domain/translation.js";
import { publicProcedure, router } from "../core.js";

export const translationRouter = router({
  translate: publicProcedure
    .input(TranslationRequest)
    .output(TranslationResponse)
    .mutation(async ({ input }) => {
      const translationService = await container.getTranslationService();
      return await translationService.translate(input);
    }),

  translateText: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        sourceLanguage: SupportedLanguage.optional(),
        targetLanguage: SupportedLanguage.optional(),
        modelName: z.string().optional(),
      }),
    )
    .output(TranslationResponse)
    .mutation(async ({ input }) => {
      const translationService = await container.getTranslationService();
      return await translationService.translate({
        text: input.text,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        modelName: input.modelName,
      });
    }),

  detectLanguage: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
      }),
    )
    .output(
      z.object({
        code: SupportedLanguage,
        confidence: z.number().min(0).max(1),
        detected: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      const languageDetectionService =
        await container.getLanguageDetectionService();
      return await languageDetectionService.detectLanguage(input.text);
    }),

  getSupportedLanguages: publicProcedure
    .output(z.array(SupportedLanguage))
    .query(async () => {
      const languageDetectionService =
        await container.getLanguageDetectionService();
      return languageDetectionService.getSupportedLanguages();
    }),

  getAvailableModels: publicProcedure
    .output(
      z.array(
        z.object({
          name: z.string(),
          modified_at: z.string(),
          size: z.number(),
          digest: z.string(),
          details: z
            .object({
              format: z.string().optional(),
              family: z.string().optional(),
              families: z.array(z.string()).optional(),
              parameter_size: z.string().optional(),
              quantization_level: z.string().optional(),
            })
            .optional(),
        }),
      ),
    )
    .query(async () => {
      const ollamaService = await container.getOllamaService();
      return await ollamaService.listModels();
    }),

  validateModel: publicProcedure
    .input(
      z.object({
        modelName: z.string().min(1),
      }),
    )
    .output(
      z.object({
        exists: z.boolean(),
        available: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      const ollamaService = await container.getOllamaService();
      try {
        const exists = await ollamaService.modelExists(input.modelName);
        const available = exists && (await ollamaService.isConnected());
        return { exists, available };
      } catch {
        return { exists: false, available: false };
      }
    }),

  getConnectionStatus: publicProcedure
    .output(z.enum(["connected", "disconnected", "connecting", "error"]))
    .query(async () => {
      const ollamaService = await container.getOllamaService();
      return await ollamaService.getConnectionStatus();
    }),

  cancelTranslation: publicProcedure
    .output(z.object({ cancelled: z.boolean() }))
    .mutation(async () => {
      const translationService = await container.getTranslationService();
      const result = translationService.cancelTranslation();
      return { cancelled: result };
    }),

  isTranslating: publicProcedure
    .output(z.object({ translating: z.boolean() }))
    .query(async () => {
      const translationService = await container.getTranslationService();
      return { translating: translationService.isTranslating() };
    }),
});
