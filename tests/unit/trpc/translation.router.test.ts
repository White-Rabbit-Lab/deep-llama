import type { OllamaService } from "@main/services/ollama-service.js";
import type { TranslationService } from "@main/services/translation-service.js";
import { translationRouter } from "@main/trpc/routers/translation.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createOllamaModel } from "../../factories/ollama.factory.js";
import {
  createTranslationRequest,
  createTranslationResponse,
} from "../../factories/translation.factory.js";
import { createMockOllamaService } from "../../mocks/ollama-service.mock.js";
import { createMockTranslationService } from "../../mocks/services.mock.js";

// Mock the DI container
vi.mock("@main/di/container.js", () => ({
  container: {
    getTranslationService: vi.fn(),
    getOllamaService: vi.fn(),
  },
}));

describe("Translation Router", () => {
  let mockTranslationService: jest.Mocked<TranslationService>;
  let mockOllamaService: jest.Mocked<OllamaService>;
  let caller: ReturnType<typeof translationRouter.createCaller>;

  beforeEach(async () => {
    mockTranslationService = createMockTranslationService();
    mockOllamaService = createMockOllamaService();

    const { container } = await import("@main/di/container.js");
    vi.mocked(container.getTranslationService).mockResolvedValue(
      mockTranslationService,
    );
    vi.mocked(container.getOllamaService).mockResolvedValue(mockOllamaService);

    caller = translationRouter.createCaller({});
  });

  describe("translate", () => {
    test("validates input and calls service", async () => {
      const input = createTranslationRequest({
        text: "Hello World",
        sourceLanguage: "en",
        targetLanguage: "ja",
      });
      const expectedOutput = createTranslationResponse({
        translatedText: "こんにちは世界",
        modelUsed: "llama2:latest",
      });
      mockTranslationService.translate.mockResolvedValue(expectedOutput);

      const result = await caller.translate(input);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedOutput);
    });

    test("rejects invalid input - empty text", async () => {
      const invalidInput = {
        text: "",
        sourceLanguage: "en" as const,
        targetLanguage: "ja" as const,
      };

      await expect(caller.translate(invalidInput)).rejects.toThrow();
    });

    test("rejects invalid input - invalid source language", async () => {
      const invalidInput = {
        text: "Hello",
        sourceLanguage: "invalid" as const,
        targetLanguage: "ja" as const,
      };

      await expect(caller.translate(invalidInput as never)).rejects.toThrow();
    });

    test("rejects invalid input - missing required fields", async () => {
      const invalidInput = {
        text: "Hello",
        // missing sourceLanguage and targetLanguage
      };

      await expect(caller.translate(invalidInput as never)).rejects.toThrow();
    });

    test("handles service errors gracefully", async () => {
      const input = createTranslationRequest();
      mockTranslationService.translate.mockRejectedValue(
        new Error("Service error"),
      );

      await expect(caller.translate(input)).rejects.toThrow("Service error");
    });

    test("accepts optional modelName", async () => {
      const input = createTranslationRequest({
        modelName: "custom-model",
      });
      const expectedOutput = createTranslationResponse();
      mockTranslationService.translate.mockResolvedValue(expectedOutput);

      const result = await caller.translate(input);

      expect(mockTranslationService.translate).toHaveBeenCalledWith(
        expect.objectContaining({ modelName: "custom-model" }),
      );
      expect(result).toEqual(expectedOutput);
    });
  });

  describe("translateText", () => {
    test("calls service with converted input format", async () => {
      const input = {
        text: "Hello World",
        sourceLanguage: "en" as const,
        targetLanguage: "ja" as const,
        modelName: "custom-model",
      };
      const expectedOutput = createTranslationResponse();
      mockTranslationService.translate.mockResolvedValue(expectedOutput);

      const result = await caller.translateText(input);

      expect(mockTranslationService.translate).toHaveBeenCalledWith({
        text: input.text,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        modelName: input.modelName,
      });
      expect(result).toEqual(expectedOutput);
    });

    test("works without optional modelName", async () => {
      const input = {
        text: "Hello World",
        sourceLanguage: "en" as const,
        targetLanguage: "ja" as const,
      };
      const expectedOutput = createTranslationResponse();
      mockTranslationService.translate.mockResolvedValue(expectedOutput);

      await caller.translateText(input);

      expect(mockTranslationService.translate).toHaveBeenCalledWith({
        text: input.text,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        modelName: undefined,
      });
    });

    test("validates input parameters", async () => {
      const invalidInput = {
        text: "", // empty text should be rejected
        sourceLanguage: "en" as const,
        targetLanguage: "ja" as const,
      };

      await expect(caller.translateText(invalidInput)).rejects.toThrow();
    });
  });

  describe("getAvailableModels", () => {
    test("returns list of models from ollama service", async () => {
      const expectedModels = [
        createOllamaModel({ name: "llama2:latest" }),
        createOllamaModel({ name: "llama3:latest" }),
      ];
      mockOllamaService.listModels.mockResolvedValue(expectedModels);

      const result = await caller.getAvailableModels();

      expect(mockOllamaService.listModels).toHaveBeenCalled();
      expect(result).toEqual(expectedModels);
    });

    test("returns empty array when no models available", async () => {
      mockOllamaService.listModels.mockResolvedValue([]);

      const result = await caller.getAvailableModels();

      expect(result).toEqual([]);
    });

    test("handles service errors", async () => {
      mockOllamaService.listModels.mockRejectedValue(
        new Error("Service error"),
      );

      await expect(caller.getAvailableModels()).rejects.toThrow(
        "Service error",
      );
    });
  });

  describe("validateModel", () => {
    test("returns validation result when model exists and ollama is connected", async () => {
      const input = { modelName: "llama2:latest" };
      mockOllamaService.modelExists.mockResolvedValue(true);
      mockOllamaService.isConnected.mockResolvedValue(true);

      const result = await caller.validateModel(input);

      expect(mockOllamaService.modelExists).toHaveBeenCalledWith(
        "llama2:latest",
      );
      expect(mockOllamaService.isConnected).toHaveBeenCalled();
      expect(result).toEqual({ exists: true, available: true });
    });

    test("returns exists=true, available=false when model exists but ollama disconnected", async () => {
      const input = { modelName: "llama2:latest" };
      mockOllamaService.modelExists.mockResolvedValue(true);
      mockOllamaService.isConnected.mockResolvedValue(false);

      const result = await caller.validateModel(input);

      expect(result).toEqual({ exists: true, available: false });
    });

    test("returns exists=false, available=false when model does not exist", async () => {
      const input = { modelName: "nonexistent-model" };
      mockOllamaService.modelExists.mockResolvedValue(false);
      // isConnected should not be called when model doesn't exist
      mockOllamaService.isConnected.mockResolvedValue(true);

      const result = await caller.validateModel(input);

      expect(result).toEqual({ exists: false, available: false });
    });

    test("handles service errors gracefully", async () => {
      const input = { modelName: "error-model" };
      mockOllamaService.modelExists.mockRejectedValue(
        new Error("Service error"),
      );

      const result = await caller.validateModel(input);

      expect(result).toEqual({ exists: false, available: false });
    });

    test("rejects invalid input - empty model name", async () => {
      const invalidInput = { modelName: "" };

      await expect(caller.validateModel(invalidInput)).rejects.toThrow();
    });

    test("rejects invalid input - missing model name", async () => {
      const invalidInput = {};

      await expect(
        caller.validateModel(invalidInput as never),
      ).rejects.toThrow();
    });
  });

  describe("getConnectionStatus", () => {
    test("returns connection status from ollama service", async () => {
      mockOllamaService.getConnectionStatus.mockResolvedValue("connected");

      const result = await caller.getConnectionStatus();

      expect(mockOllamaService.getConnectionStatus).toHaveBeenCalled();
      expect(result).toBe("connected");
    });

    test("returns different connection statuses", async () => {
      const statuses = [
        "connected",
        "disconnected",
        "connecting",
        "error",
      ] as const;

      for (const status of statuses) {
        mockOllamaService.getConnectionStatus.mockResolvedValue(status);
        const result = await caller.getConnectionStatus();
        expect(result).toBe(status);
      }
    });

    test("handles service errors", async () => {
      mockOllamaService.getConnectionStatus.mockRejectedValue(
        new Error("Service error"),
      );

      await expect(caller.getConnectionStatus()).rejects.toThrow(
        "Service error",
      );
    });
  });

  describe("cancelTranslation", () => {
    test("calls service cancel method and returns result", async () => {
      mockTranslationService.cancelTranslation.mockReturnValue(true);

      const result = await caller.cancelTranslation();

      expect(mockTranslationService.cancelTranslation).toHaveBeenCalled();
      expect(result).toEqual({ cancelled: true });
    });

    test("returns false when no active translation to cancel", async () => {
      mockTranslationService.cancelTranslation.mockReturnValue(false);

      const result = await caller.cancelTranslation();

      expect(result).toEqual({ cancelled: false });
    });

    test("handles service errors", async () => {
      mockTranslationService.cancelTranslation.mockImplementation(() => {
        throw new Error("Service error");
      });

      await expect(caller.cancelTranslation()).rejects.toThrow("Service error");
    });
  });

  describe("isTranslating", () => {
    test("returns translation status from service", async () => {
      mockTranslationService.isTranslating.mockReturnValue(true);

      const result = await caller.isTranslating();

      expect(mockTranslationService.isTranslating).toHaveBeenCalled();
      expect(result).toEqual({ translating: true });
    });

    test("returns false when not translating", async () => {
      mockTranslationService.isTranslating.mockReturnValue(false);

      const result = await caller.isTranslating();

      expect(result).toEqual({ translating: false });
    });

    test("handles service errors", async () => {
      mockTranslationService.isTranslating.mockImplementation(() => {
        throw new Error("Service error");
      });

      await expect(caller.isTranslating()).rejects.toThrow("Service error");
    });
  });
});
