import { z } from "zod";

export const OllamaModel = z.object({
  name: z.string(),
  modified_at: z.string(),
  size: z.number(),
  digest: z.string(),
  details: z
    .object({
      format: z.string().optional(),
      family: z.string().optional(),
      families: z.array(z.string()).optional(),
      parameter_size: z.string().optional(),
      quantization_level: z.string().optional(),
    })
    .optional(),
});
export type OllamaModel = z.infer<typeof OllamaModel>;

export const OllamaListResponse = z.object({
  models: z.array(OllamaModel),
});
export type OllamaListResponse = z.infer<typeof OllamaListResponse>;

export const OllamaChatMessage = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});
export type OllamaChatMessage = z.infer<typeof OllamaChatMessage>;

export const OllamaChatRequest = z.object({
  model: z.string(),
  messages: z.array(OllamaChatMessage),
  stream: z.boolean().default(false),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
});
export type OllamaChatRequest = z.infer<typeof OllamaChatRequest>;

export const OllamaChatResponse = z.object({
  model: z.string(),
  created_at: z.string(),
  message: OllamaChatMessage,
  done: z.boolean(),
  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),
});
export type OllamaChatResponse = z.infer<typeof OllamaChatResponse>;

export const OllamaErrorResponse = z.object({
  error: z.string(),
});
export type OllamaErrorResponse = z.infer<typeof OllamaErrorResponse>;

export const OllamaConnectionStatus = z.enum([
  "connected",
  "disconnected",
  "connecting",
  "error",
]);
export type OllamaConnectionStatus = z.infer<typeof OllamaConnectionStatus>;
