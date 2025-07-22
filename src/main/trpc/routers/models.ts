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
        lastUsed: new Date().toISOString(),
      };

      // Ensure atomicity: perform both operations as a single transaction
      let addedModel = false;
      try {
        // Step 1: Add the model
        const settings = await settingsRepository.addModel(model);
        addedModel = true;

        // Step 2: If makeDefault is true, set it as default
        if (input.makeDefault) {
          return await settingsRepository.setDefaultModel(input.name);
        }

        return settings;
      } catch (error) {
        // If we successfully added the model but failed at step 2,
        // clean up by removing the model to maintain system consistency
        if (addedModel && input.makeDefault) {
          try {
            await settingsRepository.removeModel(input.name);
            console.warn(
              `Rolled back model "${input.name}" due to failed default setting`,
            );
          } catch (cleanupError) {
            console.error(
              `Critical: Failed to rollback model "${input.name}" after default setting failed. Manual intervention may be required.`,
              cleanupError,
            );
            // Re-throw the original error with additional context
            throw new Error(
              `Model operation failed and cleanup failed. System may be in inconsistent state. Original error: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
        throw error;
      }
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
