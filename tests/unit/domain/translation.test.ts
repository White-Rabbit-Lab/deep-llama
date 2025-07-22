import {
  SupportedLanguage,
  TranslationError,
  TranslationRequest,
  TranslationResponse,
  TranslationSettings,
} from "#shared/domain/translation.js";
import { describe, expect, test } from "vitest";

describe("Translation Domain", () => {
  describe("SupportedLanguage", () => {
    test("accepts valid languages", () => {
      expect(() => SupportedLanguage.parse("en")).not.toThrow();
      expect(() => SupportedLanguage.parse("ja")).not.toThrow();
    });

    test("rejects invalid languages", () => {
      expect(() => SupportedLanguage.parse("fr")).toThrow();
      expect(() => SupportedLanguage.parse("invalid")).toThrow();
      expect(() => SupportedLanguage.parse("")).toThrow();
    });

    test("rejects non-string values", () => {
      expect(() => SupportedLanguage.parse(123)).toThrow();
      expect(() => SupportedLanguage.parse(null)).toThrow();
      expect(() => SupportedLanguage.parse(undefined)).toThrow();
    });
  });

  describe("TranslationRequest", () => {
    test("accepts valid translation request", () => {
      const validRequest = {
        text: "Hello World",
        sourceLanguage: "en",
        targetLanguage: "ja",
      };
      expect(() => TranslationRequest.parse(validRequest)).not.toThrow();
    });

    test("accepts valid translation request with optional modelName", () => {
      const validRequest = {
        text: "Hello World",
        sourceLanguage: "en",
        targetLanguage: "ja",
        modelName: "llama2:latest",
      };
      expect(() => TranslationRequest.parse(validRequest)).not.toThrow();
    });

    test("rejects empty text", () => {
      const invalidRequest = {
        text: "",
        sourceLanguage: "en",
        targetLanguage: "ja",
      };
      expect(() => TranslationRequest.parse(invalidRequest)).toThrow();
    });

    test("rejects missing text", () => {
      const invalidRequest = {
        sourceLanguage: "en",
        targetLanguage: "ja",
      };
      expect(() => TranslationRequest.parse(invalidRequest)).toThrow();
    });

    test("rejects invalid source language", () => {
      const invalidRequest = {
        text: "Hello",
        sourceLanguage: "invalid",
        targetLanguage: "ja",
      };
      expect(() => TranslationRequest.parse(invalidRequest)).toThrow();
    });

    test("rejects invalid target language", () => {
      const invalidRequest = {
        text: "Hello",
        sourceLanguage: "en",
        targetLanguage: "invalid",
      };
      expect(() => TranslationRequest.parse(invalidRequest)).toThrow();
    });

    test("rejects missing source language", () => {
      const invalidRequest = {
        text: "Hello",
        targetLanguage: "ja",
      };
      expect(() => TranslationRequest.parse(invalidRequest)).toThrow();
    });

    test("rejects missing target language", () => {
      const invalidRequest = {
        text: "Hello",
        sourceLanguage: "en",
      };
      expect(() => TranslationRequest.parse(invalidRequest)).toThrow();
    });
  });

  describe("TranslationResponse", () => {
    test("accepts valid translation response", () => {
      const validResponse = {
        translatedText: "こんにちは世界",
        sourceLanguage: "en",
        targetLanguage: "ja",
        modelUsed: "llama2:latest",
        timestamp: "2024-01-01T00:00:00.000Z",
      };
      expect(() => TranslationResponse.parse(validResponse)).not.toThrow();
    });

    test("rejects missing translatedText", () => {
      const invalidResponse = {
        sourceLanguage: "en",
        targetLanguage: "ja",
        modelUsed: "llama2:latest",
        timestamp: "2024-01-01T00:00:00.000Z",
      };
      expect(() => TranslationResponse.parse(invalidResponse)).toThrow();
    });

    test("rejects invalid timestamp format", () => {
      const invalidResponse = {
        translatedText: "こんにちは世界",
        sourceLanguage: "en",
        targetLanguage: "ja",
        modelUsed: "llama2:latest",
        timestamp: "invalid-date",
      };
      expect(() => TranslationResponse.parse(invalidResponse)).toThrow();
    });

    test("rejects missing modelUsed", () => {
      const invalidResponse = {
        translatedText: "こんにちは世界",
        sourceLanguage: "en",
        targetLanguage: "ja",
        timestamp: "2024-01-01T00:00:00.000Z",
      };
      expect(() => TranslationResponse.parse(invalidResponse)).toThrow();
    });
  });

  describe("TranslationSettings", () => {
    test("accepts valid translation settings with defaults", () => {
      const validSettings = {};
      const result = TranslationSettings.parse(validSettings);
      expect(result.models).toEqual([]);
      expect(result.defaultModel).toBeUndefined();
    });

    test("accepts valid translation settings with values", () => {
      const validSettings = {
        defaultModel: "llama2:latest",
        models: [
          {
            name: "llama2:latest",
            isDefault: true,
            isAvailable: true,
          },
        ],
      };
      expect(() => TranslationSettings.parse(validSettings)).not.toThrow();
    });

    test("applies default values correctly", () => {
      const settings = {
        defaultModel: "llama2:latest",
        models: [{ name: "llama2:latest" }],
      };
      const result = TranslationSettings.parse(settings);
      expect(result.models[0].isDefault).toBe(false);
      expect(result.models[0].isAvailable).toBe(true);
    });
  });

  describe("TranslationError", () => {
    test("accepts valid translation error", () => {
      const validError = {
        code: "OLLAMA_NOT_RUNNING",
        message: "Ollama service is not running",
      };
      expect(() => TranslationError.parse(validError)).not.toThrow();
    });

    test("accepts valid translation error with details", () => {
      const validError = {
        code: "MODEL_NOT_FOUND",
        message: "Model not found",
        details: "llama2:latest is not available locally",
      };
      expect(() => TranslationError.parse(validError)).not.toThrow();
    });

    test("rejects invalid error code", () => {
      const invalidError = {
        code: "INVALID_CODE",
        message: "Some error",
      };
      expect(() => TranslationError.parse(invalidError)).toThrow();
    });

    test("rejects missing message", () => {
      const invalidError = {
        code: "OLLAMA_NOT_RUNNING",
      };
      expect(() => TranslationError.parse(invalidError)).toThrow();
    });

    test("accepts all valid error codes", () => {
      const codes = [
        "OLLAMA_NOT_RUNNING",
        "MODEL_NOT_FOUND",
        "NETWORK_ERROR",
        "TRANSLATION_FAILED",
      ];

      codes.forEach((code) => {
        const error = { code, message: "Test error" };
        expect(() => TranslationError.parse(error)).not.toThrow();
      });
    });
  });
});
