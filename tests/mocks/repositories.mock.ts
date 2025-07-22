import type { TranslationSettingsRepository } from "@main/repository/translation-settings-repository.js";
import { vi } from "vitest";
import { createTranslationSettings } from "../factories/translation.factory.js";

export const createMockTranslationSettingsRepository =
  (): jest.Mocked<TranslationSettingsRepository> =>
    ({
      getSettings: vi.fn().mockResolvedValue(createTranslationSettings()),
      updateSettings: vi.fn().mockResolvedValue(createTranslationSettings()),
      addModel: vi.fn().mockResolvedValue(createTranslationSettings()),
      removeModel: vi.fn().mockResolvedValue(createTranslationSettings()),
      setDefaultModel: vi.fn().mockResolvedValue(createTranslationSettings()),
      getModels: vi.fn().mockResolvedValue([]),
      updateModelUsage: vi.fn().mockResolvedValue(undefined),
    }) as unknown as jest.Mocked<TranslationSettingsRepository>;
