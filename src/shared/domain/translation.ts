import { z } from "zod";

export const SupportedLanguage = z.enum(["ja", "en"]);
export type SupportedLanguage = z.infer<typeof SupportedLanguage>;

export const DetectedLanguage = z.object({
  code: SupportedLanguage,
  confidence: z.number().min(0).max(1),
  detected: z.boolean(),
});
export type DetectedLanguage = z.infer<typeof DetectedLanguage>;

export const TranslationRequest = z.object({
  text: z.string().min(1),
  sourceLanguage: SupportedLanguage.optional(),
  targetLanguage: SupportedLanguage.optional(),
  modelName: z.string().optional(),
});
export type TranslationRequest = z.infer<typeof TranslationRequest>;

export const TranslationResponse = z.object({
  translatedText: z.string(),
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  detectedLanguage: DetectedLanguage,
  modelUsed: z.string(),
  timestamp: z.string().datetime(),
});
export type TranslationResponse = z.infer<typeof TranslationResponse>;

export const TranslationModel = z.object({
  name: z.string().min(1),
  isDefault: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  lastUsed: z.string().datetime().optional(),
});
export type TranslationModel = z.infer<typeof TranslationModel>;

export const TranslationSettings = z.object({
  defaultModel: z.string().optional(),
  autoDetectLanguage: z.boolean().default(false),
  models: z.array(TranslationModel).default([]),
});
export type TranslationSettings = z.infer<typeof TranslationSettings>;

export const TranslationError = z.object({
  code: z.enum([
    "OLLAMA_NOT_RUNNING",
    "MODEL_NOT_FOUND",
    "NETWORK_ERROR",
    "LANGUAGE_DETECTION_FAILED",
    "TRANSLATION_FAILED",
  ]),
  message: z.string(),
  details: z.string().optional(),
});
export type TranslationError = z.infer<typeof TranslationError>;
