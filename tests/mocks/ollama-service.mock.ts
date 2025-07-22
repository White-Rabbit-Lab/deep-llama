import type { OllamaService } from "@main/services/ollama-service.js";
import { vi } from "vitest";

export const createMockOllamaService = (): jest.Mocked<OllamaService> =>
  ({
    isConnected: vi.fn().mockResolvedValue(true),
    getConnectionStatus: vi.fn().mockResolvedValue("connected"),
    listModels: vi.fn().mockResolvedValue([
      {
        name: "llama2:latest",
        size: 3800000000,
        digest: "test",
        modified_at: "2024-01-01T00:00:00Z",
      },
      {
        name: "llama3:latest",
        size: 4200000000,
        digest: "test",
        modified_at: "2024-01-01T00:00:00Z",
      },
    ]),
    modelExists: vi.fn().mockResolvedValue(true),
    chat: vi.fn().mockResolvedValue("mocked translation"),
    chatStream: vi.fn().mockImplementation(async function* () {
      yield "mocked";
      yield " stream";
      yield " response";
    }),
  }) as unknown as jest.Mocked<OllamaService>;
