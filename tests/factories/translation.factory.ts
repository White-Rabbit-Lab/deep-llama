import type {
  SupportedLanguage,
  TranslationModel,
  TranslationRequest,
  TranslationResponse,
  TranslationSettings,
} from "#shared/domain/translation.js";

export const createTranslationRequest = (
  overrides: Partial<TranslationRequest> = {},
): TranslationRequest => ({
  text: "Hello World",
  sourceLanguage: "en" as SupportedLanguage,
  targetLanguage: "ja" as SupportedLanguage,
  modelName: "llama2:latest",
  ...overrides,
});

export const createTranslationResponse = (
  overrides: Partial<TranslationResponse> = {},
): TranslationResponse => ({
  translatedText: "こんにちは世界",
  sourceLanguage: "en" as SupportedLanguage,
  targetLanguage: "ja" as SupportedLanguage,
  modelUsed: "llama2:latest",
  timestamp: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createTranslationModel = (
  overrides: Partial<TranslationModel> = {},
): TranslationModel => ({
  name: "llama2:latest",
  isDefault: false,
  isAvailable: true,
  lastUsed: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createTranslationSettings = (
  overrides: Partial<TranslationSettings> = {},
): TranslationSettings => ({
  defaultModel: "llama2:latest",
  models: [
    createTranslationModel(),
    createTranslationModel({ name: "llama3:latest", isDefault: false }),
  ],
  ...overrides,
});
