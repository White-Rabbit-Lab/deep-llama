import type { TranslationService } from "@main/services/translation-service.js";
import { vi } from "vitest";
import { createTranslationResponse } from "../factories/translation.factory.js";

export const createMockTranslationService =
  (): jest.Mocked<TranslationService> =>
    ({
      translate: vi.fn().mockResolvedValue(createTranslationResponse()),
      translateText: vi.fn().mockResolvedValue(createTranslationResponse()),
      cancelTranslation: vi.fn().mockReturnValue(false),
      isTranslating: vi.fn().mockReturnValue(false),
    }) as unknown as jest.Mocked<TranslationService>;
