import { z } from "zod";
import { container } from "../../../main/di/container.js";
import {
  TranslationModel,
  TranslationSettings,
} from "../../../shared/domain/translation.js";
import { publicProcedure, router } from "../core.js";

export const modelsRouter = router({
  getModels: publicProcedure
    .output(z.array(TranslationModel))
    .query(async () => {
      const settingsRepository =
        await container.getTranslationSettingsRepository();
      return await settingsRepository.getModels();
    }),

  addModel: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        makeDefault: z.boolean().default(false),
      }),
    )
    .output(TranslationSettings)
    .mutation(async ({ input }) => {
      const settingsRepository =
        await container.getTranslationSettingsRepository();
      const ollamaService = await container.getOllamaService();

      // Validate model exists in Ollama
      const modelExists = await ollamaService.modelExists(input.name);
      if (!modelExists) {
        throw new Error(`Model "${input.name}" not found in Ollama`);
      }

      const model: TranslationModel = {
        name: input.name,
        isDefault: input.makeDefault,
        isAvailable: true,
        lastUsed: new Date(),
      };

      const settings = await settingsRepository.addModel(model);

      if (input.makeDefault) {
        return await settingsRepository.setDefaultModel(input.name);
      }

      return settings;
    }),

  removeModel: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .output(TranslationSettings)
    .mutation(async ({ input }) => {
      const settingsRepository =
        await container.getTranslationSettingsRepository();
      return await settingsRepository.removeModel(input.name);
    }),

  setDefaultModel: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .output(TranslationSettings)
    .mutation(async ({ input }) => {
      const settingsRepository =
        await container.getTranslationSettingsRepository();
      return await settingsRepository.setDefaultModel(input.name);
    }),

  getSettings: publicProcedure.output(TranslationSettings).query(async () => {
    const settingsRepository =
      await container.getTranslationSettingsRepository();
    return await settingsRepository.getSettings();
  }),

  updateSettings: publicProcedure
    .input(
      z.object({
        debounceMs: z.number().int().min(100).max(5000).optional(),
        autoDetectLanguage: z.boolean().optional(),
        defaultModel: z.string().optional(),
      }),
    )
    .output(TranslationSettings)
    .mutation(async ({ input }) => {
      const settingsRepository =
        await container.getTranslationSettingsRepository();
      return await settingsRepository.updateSettings(input);
    }),

  validateAllModels: publicProcedure
    .output(
      z.array(
        z.object({
          name: z.string(),
          isAvailable: z.boolean(),
          error: z.string().optional(),
        }),
      ),
    )
    .query(async () => {
      const settingsRepository =
        await container.getTranslationSettingsRepository();
      const ollamaService = await container.getOllamaService();
      const models = await settingsRepository.getModels();

      const validationResults = await Promise.all(
        models.map(async (model) => {
          try {
            const isAvailable = await ollamaService.modelExists(model.name);
            return {
              name: model.name,
              isAvailable,
              error: isAvailable ? undefined : "Model not found in Ollama",
            };
          } catch (error) {
            return {
              name: model.name,
              isAvailable: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }),
      );

      return validationResults;
    }),

  refreshModelAvailability: publicProcedure
    .output(TranslationSettings)
    .mutation(async () => {
      const settingsRepository =
        await container.getTranslationSettingsRepository();
      const ollamaService = await container.getOllamaService();
      const settings = await settingsRepository.getSettings();

      // Update availability for all models
      const updatedModels = await Promise.all(
        settings.models.map(async (model) => {
          try {
            const isAvailable = await ollamaService.modelExists(model.name);
            return { ...model, isAvailable };
          } catch {
            return { ...model, isAvailable: false };
          }
        }),
      );

      return await settingsRepository.updateSettings({
        ...settings,
        models: updatedModels,
      });
    }),
});
