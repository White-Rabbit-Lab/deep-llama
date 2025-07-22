import { Ollama } from "ollama";
import type {
  OllamaChatRequest,
  OllamaConnectionStatus,
  OllamaModel,
} from "../../shared/domain/ollama.js";
import type { TranslationError } from "../../shared/domain/translation.js";

export interface OllamaService {
  isConnected(): Promise<boolean>;
  getConnectionStatus(): Promise<OllamaConnectionStatus>;
  listModels(): Promise<OllamaModel[]>;
  modelExists(modelName: string): Promise<boolean>;
  chat(request: OllamaChatRequest): Promise<string>;
  chatStream(request: OllamaChatRequest): AsyncGenerator<string, void, unknown>;
}

export class OllamaServiceImpl implements OllamaService {
  private readonly ollama: Ollama;
  private connectionStatus: OllamaConnectionStatus = "disconnected";

  constructor(host: string = "http://localhost:11434") {
    this.ollama = new Ollama({ host });
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.ollama.list();
      this.connectionStatus = "connected";
      return true;
    } catch {
      this.connectionStatus = "disconnected";
      return false;
    }
  }

  async getConnectionStatus(): Promise<OllamaConnectionStatus> {
    await this.isConnected();
    return this.connectionStatus;
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      this.connectionStatus = "connecting";
      const response = await this.ollama.list();
      this.connectionStatus = "connected";
      return response.models.map((model) => ({
        ...model,
        modified_at:
          model.modified_at instanceof Date
            ? model.modified_at.toISOString()
            : model.modified_at,
      }));
    } catch (error) {
      this.connectionStatus = "error";
      throw this.handleError(error, "Failed to list models");
    }
  }

  async modelExists(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      console.log(`[OllamaService] Checking if model "${modelName}" exists`);
      console.log(
        `[OllamaService] Available models:`,
        models.map((m) => m.name),
      );

      // Check exact match first
      const exactMatch = models.some((model) => model.name === modelName);
      if (exactMatch) {
        console.log(`[OllamaService] Found exact match for "${modelName}"`);
        return true;
      }

      // Check if modelName without :latest matches any model
      const baseModelName = modelName.replace(":latest", "");
      const baseMatch = models.some(
        (model) =>
          model.name === baseModelName ||
          model.name === `${baseModelName}:latest`,
      );
      if (baseMatch) {
        console.log(
          `[OllamaService] Found base match for "${modelName}" (base: "${baseModelName}")`,
        );
        return true;
      }

      console.log(`[OllamaService] No match found for "${modelName}"`);
      return false;
    } catch (error) {
      console.error(`[OllamaService] Error checking model existence:`, error);
      return false;
    }
  }

  async chat(request: OllamaChatRequest): Promise<string> {
    try {
      this.connectionStatus = "connecting";

      // Verify model exists
      if (!(await this.modelExists(request.model))) {
        throw new Error(`Model "${request.model}" not found in Ollama`);
      }

      const response = await this.ollama.chat({
        model: request.model,
        messages: request.messages,
        stream: false,
        options: {
          temperature: request.temperature,
          top_p: request.top_p,
        },
      });

      this.connectionStatus = "connected";
      return response.message.content;
    } catch (error) {
      this.connectionStatus = "error";
      throw this.handleError(error, "Translation failed");
    }
  }

  async *chatStream(
    request: OllamaChatRequest,
  ): AsyncGenerator<string, void, unknown> {
    try {
      this.connectionStatus = "connecting";

      // Verify model exists
      if (!(await this.modelExists(request.model))) {
        throw new Error(`Model "${request.model}" not found in Ollama`);
      }

      const stream = await this.ollama.chat({
        model: request.model,
        messages: request.messages,
        stream: true,
        options: {
          temperature: request.temperature,
          top_p: request.top_p,
        },
      });

      this.connectionStatus = "connected";

      for await (const chunk of stream) {
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
      }
    } catch (error) {
      this.connectionStatus = "error";
      throw this.handleError(error, "Streaming translation failed");
    }
  }

  private handleError(error: unknown, context: string): TranslationError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for common Ollama errors
    if (
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("connect")
    ) {
      return {
        code: "OLLAMA_NOT_RUNNING",
        message: "Ollama server is not running",
        details: `${context}: ${errorMessage}`,
      };
    }

    if (errorMessage.includes("not found") || errorMessage.includes("model")) {
      return {
        code: "MODEL_NOT_FOUND",
        message: "Model not found",
        details: `${context}: ${errorMessage}`,
      };
    }

    if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
      return {
        code: "NETWORK_ERROR",
        message: "Network connection error",
        details: `${context}: ${errorMessage}`,
      };
    }

    return {
      code: "TRANSLATION_FAILED",
      message: "Translation failed",
      details: `${context}: ${errorMessage}`,
    };
  }
}
