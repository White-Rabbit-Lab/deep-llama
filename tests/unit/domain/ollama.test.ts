import {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaConnectionStatus,
  OllamaErrorResponse,
  OllamaListResponse,
  OllamaModel,
} from "#shared/domain/ollama.js";
import { describe, expect, test } from "vitest";

describe("Ollama Domain", () => {
  describe("OllamaModel", () => {
    test("accepts valid model", () => {
      const validModel = {
        name: "llama2:latest",
        modified_at: "2024-01-01T00:00:00.000Z",
        size: 3800000000,
        digest: "abc123def456",
      };
      expect(() => OllamaModel.parse(validModel)).not.toThrow();
    });

    test("accepts valid model with details", () => {
      const validModel = {
        name: "llama3:latest",
        modified_at: "2024-01-01T00:00:00.000Z",
        size: 4200000000,
        digest: "def456ghi789",
        details: {
          format: "gguf",
          family: "llama",
          parameter_size: "8B",
          quantization_level: "Q4_0",
        },
      };
      expect(() => OllamaModel.parse(validModel)).not.toThrow();
    });

    test("rejects missing required fields", () => {
      const invalidModel = {
        name: "llama2:latest",
        // missing other required fields
      };
      expect(() => OllamaModel.parse(invalidModel)).toThrow();
    });

    test("rejects invalid size type", () => {
      const invalidModel = {
        name: "llama2:latest",
        modified_at: "2024-01-01T00:00:00.000Z",
        size: "3800000000", // should be number
        digest: "abc123def456",
      };
      expect(() => OllamaModel.parse(invalidModel)).toThrow();
    });
  });

  describe("OllamaListResponse", () => {
    test("accepts valid list response", () => {
      const validResponse = {
        models: [
          {
            name: "llama2:latest",
            modified_at: "2024-01-01T00:00:00.000Z",
            size: 3800000000,
            digest: "abc123def456",
          },
        ],
      };
      expect(() => OllamaListResponse.parse(validResponse)).not.toThrow();
    });

    test("accepts empty models array", () => {
      const validResponse = { models: [] };
      expect(() => OllamaListResponse.parse(validResponse)).not.toThrow();
    });
  });

  describe("OllamaChatMessage", () => {
    test("accepts valid user message", () => {
      const validMessage = {
        role: "user",
        content: "Hello, how are you?",
      };
      expect(() => OllamaChatMessage.parse(validMessage)).not.toThrow();
    });

    test("accepts valid assistant message", () => {
      const validMessage = {
        role: "assistant",
        content: "I am doing well, thank you!",
      };
      expect(() => OllamaChatMessage.parse(validMessage)).not.toThrow();
    });

    test("accepts valid system message", () => {
      const validMessage = {
        role: "system",
        content: "You are a helpful assistant.",
      };
      expect(() => OllamaChatMessage.parse(validMessage)).not.toThrow();
    });

    test("rejects invalid role", () => {
      const invalidMessage = {
        role: "invalid",
        content: "Some content",
      };
      expect(() => OllamaChatMessage.parse(invalidMessage)).toThrow();
    });

    test("rejects missing content", () => {
      const invalidMessage = {
        role: "user",
      };
      expect(() => OllamaChatMessage.parse(invalidMessage)).toThrow();
    });
  });

  describe("OllamaChatRequest", () => {
    test("accepts valid chat request", () => {
      const validRequest = {
        model: "llama2:latest",
        messages: [{ role: "user", content: "Hello" }],
      };
      expect(() => OllamaChatRequest.parse(validRequest)).not.toThrow();
    });

    test("applies default stream value", () => {
      const request = {
        model: "llama2:latest",
        messages: [{ role: "user", content: "Hello" }],
      };
      const result = OllamaChatRequest.parse(request);
      expect(result.stream).toBe(false);
    });

    test("accepts optional parameters", () => {
      const validRequest = {
        model: "llama2:latest",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
        temperature: 0.8,
        top_p: 0.9,
      };
      expect(() => OllamaChatRequest.parse(validRequest)).not.toThrow();
    });

    test("validates temperature range", () => {
      const invalidRequest = {
        model: "llama2:latest",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 3.0, // exceeds max of 2
      };
      expect(() => OllamaChatRequest.parse(invalidRequest)).toThrow();
    });

    test("validates top_p range", () => {
      const invalidRequest = {
        model: "llama2:latest",
        messages: [{ role: "user", content: "Hello" }],
        top_p: 1.5, // exceeds max of 1
      };
      expect(() => OllamaChatRequest.parse(invalidRequest)).toThrow();
    });
  });

  describe("OllamaChatResponse", () => {
    test("accepts valid chat response", () => {
      const validResponse = {
        model: "llama2:latest",
        created_at: "2024-01-01T00:00:00.000Z",
        message: { role: "assistant", content: "Hello back!" },
        done: true,
      };
      expect(() => OllamaChatResponse.parse(validResponse)).not.toThrow();
    });

    test("accepts response with performance metrics", () => {
      const validResponse = {
        model: "llama2:latest",
        created_at: "2024-01-01T00:00:00.000Z",
        message: { role: "assistant", content: "Hello back!" },
        done: true,
        total_duration: 1000000000,
        load_duration: 100000000,
        prompt_eval_count: 10,
        prompt_eval_duration: 200000000,
        eval_count: 20,
        eval_duration: 700000000,
      };
      expect(() => OllamaChatResponse.parse(validResponse)).not.toThrow();
    });
  });

  describe("OllamaErrorResponse", () => {
    test("accepts valid error response", () => {
      const validError = { error: "Model not found" };
      expect(() => OllamaErrorResponse.parse(validError)).not.toThrow();
    });

    test("rejects missing error field", () => {
      const invalidError = {};
      expect(() => OllamaErrorResponse.parse(invalidError)).toThrow();
    });
  });

  describe("OllamaConnectionStatus", () => {
    test("accepts all valid status values", () => {
      const validStatuses = [
        "connected",
        "disconnected",
        "connecting",
        "error",
      ];

      validStatuses.forEach((status) => {
        expect(() => OllamaConnectionStatus.parse(status)).not.toThrow();
      });
    });

    test("rejects invalid status", () => {
      expect(() => OllamaConnectionStatus.parse("invalid")).toThrow();
      expect(() => OllamaConnectionStatus.parse("ready")).toThrow();
      expect(() => OllamaConnectionStatus.parse("")).toThrow();
    });
  });
});
