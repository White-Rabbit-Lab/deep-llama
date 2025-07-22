import type { TranslationSettingsRepository } from "@main/repository/translation-settings-repository.js";
import type { OllamaService } from "@main/services/ollama-service.js";
import { TranslationServiceImpl } from "@main/services/translation-service.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  createTranslationRequest,
  createTranslationSettings,
} from "../../factories/translation.factory.js";
import { createMockOllamaService } from "../../mocks/ollama-service.mock.js";
import { createMockTranslationSettingsRepository } from "../../mocks/repositories.mock.js";

describe("TranslationService", () => {
  let service: TranslationServiceImpl;
  let mockOllamaService: jest.Mocked<OllamaService>;
  let mockSettingsRepo: jest.Mocked<TranslationSettingsRepository>;

  beforeEach(() => {
    mockOllamaService = createMockOllamaService();
    mockSettingsRepo = createMockTranslationSettingsRepository();
    service = new TranslationServiceImpl(mockOllamaService, mockSettingsRepo);
  });

  describe("translate", () => {
    test("returns original text when source equals target language", async () => {
      const request = createTranslationRequest({
        sourceLanguage: "en",
        targetLanguage: "en",
        text: "Hello World",
      });

      const result = await service.translate(request);

      expect(result.translatedText).toBe("Hello World");
      expect(result.sourceLanguage).toBe("en");
      expect(result.targetLanguage).toBe("en");
      expect(mockOllamaService.chat).not.toHaveBeenCalled();
    });

    test("throws error when source language is missing", async () => {
      const request = createTranslationRequest();
      // @ts-expect-error - intentionally setting to undefined for test
      request.sourceLanguage = undefined;

      await expect(service.translate(request)).rejects.toThrow(
        "Source and target languages are required",
      );
    });

    test("throws error when target language is missing", async () => {
      const request = createTranslationRequest();
      // @ts-expect-error - intentionally setting to undefined for test
      request.targetLanguage = undefined;

      await expect(service.translate(request)).rejects.toThrow(
        "Source and target languages are required",
      );
    });

    test("uses requested model when it exists", async () => {
      const request = createTranslationRequest({
        text: "Hello World",
        sourceLanguage: "en",
        targetLanguage: "ja",
        modelName: "custom-model",
      });
      mockOllamaService.modelExists.mockResolvedValue(true);
      mockOllamaService.chat.mockResolvedValue("こんにちは世界");

      await service.translate(request);

      expect(mockOllamaService.modelExists).toHaveBeenCalledWith(
        "custom-model",
      );
      expect(mockOllamaService.chat).toHaveBeenCalledWith(
        expect.objectContaining({ model: "custom-model" }),
      );
    });

    test("falls back to default model when requested model does not exist", async () => {
      const request = createTranslationRequest({
        modelName: "nonexistent-model",
      });
      mockOllamaService.modelExists
        .mockResolvedValueOnce(false) // requested model doesn't exist
        .mockResolvedValueOnce(true); // default model exists
      mockSettingsRepo.getSettings.mockResolvedValue(
        createTranslationSettings({ defaultModel: "default-model" }),
      );
      mockOllamaService.chat.mockResolvedValue("translated");

      await service.translate(request);

      expect(mockOllamaService.chat).toHaveBeenCalledWith(
        expect.objectContaining({ model: "default-model" }),
      );
    });

    test("uses first available model when no default model exists", async () => {
      const request = createTranslationRequest({ modelName: undefined });
      mockSettingsRepo.getSettings.mockResolvedValue(
        createTranslationSettings({ defaultModel: undefined }),
      );
      mockOllamaService.listModels.mockResolvedValue([
        {
          name: "first-available",
          size: 1000,
          digest: "test",
          modified_at: "2024-01-01T00:00:00Z",
        },
      ]);
      mockOllamaService.chat.mockResolvedValue("translated");

      await service.translate(request);

      expect(mockOllamaService.chat).toHaveBeenCalledWith(
        expect.objectContaining({ model: "first-available" }),
      );
    });

    test("throws error when no models are available", async () => {
      const request = createTranslationRequest({ modelName: undefined });
      mockSettingsRepo.getSettings.mockResolvedValue(
        createTranslationSettings({ defaultModel: undefined }),
      );
      mockOllamaService.listModels.mockResolvedValue([]);

      await expect(service.translate(request)).rejects.toThrow(
        "No available models found",
      );
    });

    test("performs translation and returns response", async () => {
      const request = createTranslationRequest({
        text: "Hello World",
        sourceLanguage: "en",
        targetLanguage: "ja",
      });
      mockOllamaService.chat.mockResolvedValue("こんにちは世界");

      const result = await service.translate(request);

      expect(result.translatedText).toBe("こんにちは世界");
      expect(result.sourceLanguage).toBe("en");
      expect(result.targetLanguage).toBe("ja");
      expect(result.modelUsed).toBe("llama2:latest");
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test("calls ollama service with correct system prompt", async () => {
      const request = createTranslationRequest();
      mockOllamaService.chat.mockResolvedValue("translated");

      await service.translate(request);

      expect(mockOllamaService.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "system",
              content: expect.stringContaining("professional translator"),
            }),
          ]),
        }),
      );
    });

    test("updates model usage after successful translation", async () => {
      const request = createTranslationRequest();
      mockOllamaService.chat.mockResolvedValue("translated");

      await service.translate(request);

      expect(mockSettingsRepo.updateModelUsage).toHaveBeenCalledWith(
        "llama2:latest",
      );
    });

    test("sets translation state correctly during operation", async () => {
      const request = createTranslationRequest();
      let isTranslatingDuringCall = false;

      mockOllamaService.chat.mockImplementation(async () => {
        isTranslatingDuringCall = service.isTranslating();
        return "translated";
      });

      expect(service.isTranslating()).toBe(false);
      await service.translate(request);

      expect(isTranslatingDuringCall).toBe(true);
      expect(service.isTranslating()).toBe(false);
    });

    test("resets translation state even when translation fails", async () => {
      const request = createTranslationRequest();
      mockOllamaService.chat.mockRejectedValue(new Error("Translation failed"));

      expect(service.isTranslating()).toBe(false);

      await expect(service.translate(request)).rejects.toThrow();

      expect(service.isTranslating()).toBe(false);
    });
  });

  describe("translateText", () => {
    test("calls translate with default ja->en translation", async () => {
      const translateSpy = vi.spyOn(service, "translate");
      translateSpy.mockResolvedValue({
        translatedText: "Hello World",
        sourceLanguage: "ja",
        targetLanguage: "en",
        modelUsed: "llama2:latest",
        timestamp: "2024-01-01T00:00:00.000Z",
      });

      await service.translateText("こんにちは世界", "custom-model");

      expect(translateSpy).toHaveBeenCalledWith({
        text: "こんにちは世界",
        sourceLanguage: "ja",
        targetLanguage: "en",
        modelName: "custom-model",
      });
    });

    test("calls translate without modelName when not provided", async () => {
      const translateSpy = vi.spyOn(service, "translate");
      translateSpy.mockResolvedValue({
        translatedText: "Hello World",
        sourceLanguage: "ja",
        targetLanguage: "en",
        modelUsed: "llama2:latest",
        timestamp: "2024-01-01T00:00:00.000Z",
      });

      await service.translateText("こんにちは世界");

      expect(translateSpy).toHaveBeenCalledWith({
        text: "こんにちは世界",
        sourceLanguage: "ja",
        targetLanguage: "en",
        modelName: undefined,
      });
    });
  });

  describe("cancelTranslation", () => {
    test("returns false when no active translation", () => {
      const result = service.cancelTranslation();
      expect(result).toBe(false);
    });

    test("cancels active translation and returns true", async () => {
      mockOllamaService.chat.mockImplementation(async (request) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => resolve("translated"), 100);
          if (request.signal) {
            request.signal.addEventListener("abort", () => {
              clearTimeout(timeoutId);
              reject(new Error("Translation cancelled"));
            });
          }
        });
      });

      const request = createTranslationRequest();
      const translationPromise = service.translate(request);

      // Small delay to ensure translation has started
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = service.cancelTranslation();

      expect(result).toBe(true);
      expect(service.isTranslating()).toBe(false);

      await expect(translationPromise).rejects.toThrow();
    });
  });

  describe("isTranslating", () => {
    test("returns false initially", () => {
      expect(service.isTranslating()).toBe(false);
    });

    test("returns true during translation", async () => {
      let isTranslatingDuringCall = false;

      mockOllamaService.chat.mockImplementation(async () => {
        isTranslatingDuringCall = service.isTranslating();
        return "translated";
      });

      await service.translate(createTranslationRequest());

      expect(isTranslatingDuringCall).toBe(true);
      expect(service.isTranslating()).toBe(false); // After completion
    });
  });
});
