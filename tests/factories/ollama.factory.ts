import type {
  OllamaChatMessage,
  OllamaChatResponse,
  OllamaModel,
} from "#shared/domain/ollama.js";

export const createOllamaModel = (
  overrides: Partial<OllamaModel> = {},
): OllamaModel => ({
  name: "llama2:latest",
  modified_at: "2024-01-01T00:00:00.000Z",
  size: 3800000000,
  digest: "abc123def456",
  details: {
    format: "gguf",
    family: "llama",
    parameter_size: "7B",
    quantization_level: "Q4_0",
  },
  ...overrides,
});

export const createOllamaChatMessage = (
  overrides: Partial<OllamaChatMessage> = {},
): OllamaChatMessage => ({
  role: "assistant",
  content: "This is a test message",
  ...overrides,
});

export const createOllamaChatResponse = (
  overrides: Partial<OllamaChatResponse> = {},
): OllamaChatResponse => ({
  model: "llama2:latest",
  created_at: "2024-01-01T00:00:00.000Z",
  message: createOllamaChatMessage(),
  done: true,
  total_duration: 1000000000,
  load_duration: 100000000,
  prompt_eval_count: 10,
  prompt_eval_duration: 200000000,
  eval_count: 20,
  eval_duration: 700000000,
  ...overrides,
});
