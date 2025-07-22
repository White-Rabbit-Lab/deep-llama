import type { OllamaConnectionStatus } from "#shared/domain/ollama";
import type {
  SupportedLanguage,
  TranslationModel,
  TranslationSettings,
} from "#shared/domain/translation";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { trpc } from "../lib/trpc";

/**
 * Helper function to normalize model objects (previously converted dates)
 * @param models Array of models with ISO string lastUsed dates
 * @returns Array of models as-is (no conversion needed)
 */
function convertModelDates(
  models: Array<
    Omit<TranslationModel, "lastUsed"> & {
      lastUsed?: string | undefined;
    }
  >,
): TranslationModel[] {
  return models.map((model) => ({
    ...model,
    lastUsed: model.lastUsed,
  }));
}

interface TranslationState {
  // Input state
  inputText: string;
  setInputText: (text: string) => void;

  // Language selection state
  manualSourceLanguage: SupportedLanguage;
  setManualSourceLanguage: (language: SupportedLanguage) => void;
  manualTargetLanguage: SupportedLanguage | undefined;
  setManualTargetLanguage: (language: SupportedLanguage) => void;
  swapLanguages: () => void;

  // Translation state
  translatedText: string;
  isTranslating: boolean;
  translationError: string | null;
  sourceLanguage: SupportedLanguage | null;
  targetLanguage: SupportedLanguage | null;

  // Model state
  selectedModel: string | null;
  availableModels: TranslationModel[];
  ollamaModels: Array<{
    name: string;
    description?: string;
    isInstalled?: boolean;
  }>;
  connectionStatus: OllamaConnectionStatus;

  // Settings state
  settings: TranslationSettings | null;

  // Actions
  translate: (text: string, modelName?: string) => Promise<void>;
  clearTranslation: () => void;
  setSelectedModel: (modelName: string) => void;
  setTranslationError: (error: string | null) => void;
  updateSettings: (settings: Partial<TranslationSettings>) => Promise<void>;
  addModel: (modelName: string, makeDefault?: boolean) => Promise<void>;
  removeModel: (modelName: string) => Promise<void>;
  refreshModels: () => Promise<void>;
  refreshOllamaModels: () => Promise<void>;
  checkConnection: () => Promise<void>;

  // Initialization
  initialize: () => Promise<void>;
}

export const useTranslationStore = create<TranslationState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    inputText: "",
    manualSourceLanguage: "en",
    manualTargetLanguage: "ja",
    translatedText: "",
    isTranslating: false,
    translationError: null,
    sourceLanguage: null,
    targetLanguage: null,
    selectedModel: null,
    availableModels: [],
    ollamaModels: [],
    connectionStatus: "disconnected",
    settings: null,

    // Actions
    setInputText: (text: string) => set({ inputText: text }),
    setManualSourceLanguage: (language: SupportedLanguage) => {
      const newState: {
        manualSourceLanguage: SupportedLanguage;
        manualTargetLanguage?: SupportedLanguage;
      } = {
        manualSourceLanguage: language,
      };

      // Auto-switch target language based on source language selection
      if (language === "en") {
        newState.manualTargetLanguage = "ja";
      } else if (language === "ja") {
        newState.manualTargetLanguage = "en";
      }

      set(newState);
    },
    setManualTargetLanguage: (language: SupportedLanguage) =>
      set({ manualTargetLanguage: language }),

    swapLanguages: () => {
      const state = get();
      if (state.manualTargetLanguage) {
        set({
          manualSourceLanguage: state.manualTargetLanguage,
          manualTargetLanguage: state.manualSourceLanguage,
        });
      }
    },

    translate: async (text: string, modelName?: string) => {
      if (!text.trim()) {
        set({
          translatedText: "",
          sourceLanguage: null,
          targetLanguage: null,
        });
        return;
      }

      set({
        isTranslating: true,
        translationError: null,
      });

      try {
        const state = get();
        const sourceLanguage = state.manualSourceLanguage;

        const result = await trpc.translation.translateText.mutate({
          text,
          sourceLanguage,
          targetLanguage: state.manualTargetLanguage,
          modelName: modelName || state.selectedModel || undefined,
        });

        set({
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
          isTranslating: false,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Translation failed";
        set({
          translationError: errorMessage,
          isTranslating: false,
        });
      }
    },

    clearTranslation: () =>
      set({
        inputText: "",
        translatedText: "",
        sourceLanguage: null,
        targetLanguage: null,
        translationError: null,
      }),

    setSelectedModel: (modelName: string) => set({ selectedModel: modelName }),

    setTranslationError: (error: string | null) =>
      set({ translationError: error }),

    updateSettings: async (settingsUpdate: Partial<TranslationSettings>) => {
      try {
        const updatedSettings =
          await trpc.models.updateSettings.mutate(settingsUpdate);

        const convertedSettings = {
          ...updatedSettings,
          models: convertModelDates(updatedSettings.models),
        };

        set({
          settings: convertedSettings,
          selectedModel: updatedSettings.defaultModel || get().selectedModel,
        });
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    },

    addModel: async (modelName: string, makeDefault = false) => {
      try {
        const updatedSettings = await trpc.models.addModel.mutate({
          name: modelName,
          makeDefault,
        });

        const convertedSettings = {
          ...updatedSettings,
          models: convertModelDates(updatedSettings.models),
        };

        set({
          settings: convertedSettings,
          availableModels: convertedSettings.models,
          selectedModel: makeDefault ? modelName : get().selectedModel,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add model";
        set({ translationError: errorMessage });
        throw error;
      }
    },

    removeModel: async (modelName: string) => {
      try {
        const updatedSettings = await trpc.models.removeModel.mutate({
          name: modelName,
        });

        const convertedSettings = {
          ...updatedSettings,
          models: convertModelDates(updatedSettings.models),
        };

        set({
          settings: convertedSettings,
          availableModels: convertedSettings.models,
          selectedModel:
            get().selectedModel === modelName
              ? convertedSettings.defaultModel || null
              : get().selectedModel,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to remove model";
        set({ translationError: errorMessage });
        throw error;
      }
    },

    refreshModels: async () => {
      try {
        const models = await trpc.models.getModels.query();
        const settings = await trpc.models.getSettings.query();

        const convertedModels = convertModelDates(models);

        const convertedSettings = {
          ...settings,
          models: convertedModels,
        };

        set({
          availableModels: convertedModels,
          settings: convertedSettings,
          selectedModel:
            settings.defaultModel ||
            (convertedModels.length > 0 ? convertedModels[0].name : null),
        });
      } catch (error) {
        console.error("Failed to refresh models:", error);
      }
    },

    refreshOllamaModels: async () => {
      try {
        const models = await trpc.translation.getAvailableModels.query();
        set({ ollamaModels: models });
      } catch (error) {
        console.error("Failed to refresh Ollama models:", error);
      }
    },

    checkConnection: async () => {
      try {
        const status = await trpc.translation.getConnectionStatus.query();
        set({ connectionStatus: status });
      } catch {
        set({ connectionStatus: "error" });
      }
    },

    initialize: async () => {
      // Initialize all data
      try {
        await Promise.all([
          get().refreshModels(),
          get().refreshOllamaModels(),
          get().checkConnection(),
        ]);
      } catch (error) {
        console.error("Failed to initialize translation store:", error);

        // Set error state to indicate initialization failure
        set({
          translationError:
            "Failed to initialize application. Please check your connection and try again.",
          connectionStatus: "error",
        });

        // Re-throw to allow calling code to handle the failure if needed
        throw error;
      }
    },
  })),
);

// Translation is now handled manually, with state management provided by the store.
