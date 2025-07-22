import type {
  DetectedLanguage,
  SupportedLanguage,
  TranslationRequest,
  TranslationResponse,
} from "../../shared/domain/translation.js";
import type { TranslationSettingsRepository } from "../repository/translation-settings-repository.js";
import type { LanguageDetectionService } from "./language-detection-service.js";
import type { OllamaService } from "./ollama-service.js";

export interface TranslationService {
  translate(request: TranslationRequest): Promise<TranslationResponse>;
  translateText(text: string, modelName?: string): Promise<TranslationResponse>;
  cancelTranslation(): void;
  isTranslating(): boolean;
}

export class TranslationServiceImpl implements TranslationService {
  private activeController: AbortController | null = null;
  private isCurrentlyTranslating = false;

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly languageDetectionService: LanguageDetectionService,
    private readonly settingsRepository: TranslationSettingsRepository,
  ) {}

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    this.isCurrentlyTranslating = true;
    this.activeController = new AbortController();

    try {
      // Detect source language if not provided
      let sourceLanguage = request.sourceLanguage;
      let detectedLanguage: DetectedLanguage;

      if (!sourceLanguage) {
        detectedLanguage = await this.languageDetectionService.detectLanguage(
          request.text,
        );
        sourceLanguage = detectedLanguage.code;
      } else {
        detectedLanguage = {
          code: sourceLanguage,
          confidence: 1.0,
          detected: true,
        };
      }

      // Use provided target language or determine based on auto-switching logic
      const targetLanguage =
        request.targetLanguage || this.determineTargetLanguage(sourceLanguage);

      // Get model to use
      const modelName = await this.getModelToUse(request.modelName);

      // Check if translation is needed (same language)
      if (sourceLanguage === targetLanguage) {
        return {
          translatedText: request.text,
          sourceLanguage,
          targetLanguage,
          detectedLanguage,
          modelUsed: modelName,
          timestamp: new Date(),
        };
      }

      // Perform translation
      const translatedText = await this.performTranslation(
        request.text,
        sourceLanguage,
        targetLanguage,
        modelName,
        this.activeController.signal,
      );

      // Update model usage
      await this.updateModelUsage(modelName);

      return {
        translatedText,
        sourceLanguage,
        targetLanguage,
        detectedLanguage,
        modelUsed: modelName,
        timestamp: new Date(),
      };
    } finally {
      this.isCurrentlyTranslating = false;
      this.activeController = null;
    }
  }

  async translateText(
    text: string,
    modelName?: string,
  ): Promise<TranslationResponse> {
    return this.translate({ text, modelName });
  }

  cancelTranslation(): void {
    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
    }
    this.isCurrentlyTranslating = false;
  }

  isTranslating(): boolean {
    return this.isCurrentlyTranslating;
  }

  private determineTargetLanguage(
    sourceLanguage: SupportedLanguage,
  ): SupportedLanguage {
    // Auto-switching logic: ja → en, en → ja
    return sourceLanguage === "ja" ? "en" : "ja";
  }

  private async getModelToUse(requestedModel?: string): Promise<string> {
    if (requestedModel) {
      const modelExists = await this.ollamaService.modelExists(requestedModel);
      if (modelExists) {
        return requestedModel;
      }
    }

    // Fallback to default model
    const settings = await this.settingsRepository.getSettings();
    if (settings.defaultModel) {
      const modelExists = await this.ollamaService.modelExists(
        settings.defaultModel,
      );
      if (modelExists) {
        return settings.defaultModel;
      }
    }

    // Try first available model
    const availableModels = await this.ollamaService.listModels();
    if (availableModels.length > 0) {
      return availableModels[0].name;
    }

    throw new Error("No available models found");
  }

  private async performTranslation(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    modelName: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const prompt = this.createTranslationPrompt(
      text,
      sourceLanguage,
      targetLanguage,
    );

    const response = await this.ollamaService.chat({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Translate the given text accurately and naturally. Return only the translated text without any explanations or additional content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
      temperature: 0.3, // Lower temperature for more consistent translations
      signal,
    });

    return response.trim();
  }

  private createTranslationPrompt(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
  ): string {
    const languageNames = {
      ja: "Japanese",
      en: "English",
    };

    const sourceName = languageNames[sourceLanguage];
    const targetName = languageNames[targetLanguage];

    return `Translate the following ${sourceName} text to ${targetName}:

${text}`;
  }

  private async updateModelUsage(modelName: string): Promise<void> {
    try {
      const settings = await this.settingsRepository.getSettings();
      const modelIndex = settings.models.findIndex((m) => m.name === modelName);

      if (modelIndex >= 0) {
        settings.models[modelIndex].lastUsed = new Date();
        await this.settingsRepository.updateSettings(settings);
      }
    } catch (error) {
      // Ignore errors in usage tracking
      console.warn("Failed to update model usage:", error);
    }
  }
}
