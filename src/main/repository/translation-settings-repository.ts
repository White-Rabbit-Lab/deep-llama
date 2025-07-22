import type {
  TranslationModel,
  TranslationSettings,
} from "../../shared/domain/translation.js";
import { TranslationSettings as TranslationSettingsSchema } from "../../shared/domain/translation.js";
import type { TypedStore } from "../persistence/store.js";

export interface TranslationSettingsRepository {
  getSettings(): Promise<TranslationSettings>;
  updateSettings(
    settings: Partial<TranslationSettings>,
  ): Promise<TranslationSettings>;
  addModel(model: TranslationModel): Promise<TranslationSettings>;
  removeModel(modelName: string): Promise<TranslationSettings>;
  setDefaultModel(modelName: string): Promise<TranslationSettings>;
  getModels(): Promise<TranslationModel[]>;
  updateModelUsage(modelName: string): Promise<void>;
}

export class TranslationSettingsRepositoryImpl
  implements TranslationSettingsRepository
{
  private readonly SETTINGS_KEY = "translation-settings";
  private readonly DEFAULT_SETTINGS: TranslationSettings = {
    defaultModel: undefined,
    debounceMs: 500,
    autoDetectLanguage: false,
    models: [],
  };

  constructor(private readonly store: TypedStore) {}

  async getSettings(): Promise<TranslationSettings> {
    try {
      const data = await this.store.get(
        this.SETTINGS_KEY as "translation-settings",
      );
      if (!data) {
        return this.DEFAULT_SETTINGS;
      }

      const parsed = TranslationSettingsSchema.safeParse(data);
      return parsed.success ? parsed.data : this.DEFAULT_SETTINGS;
    } catch {
      return this.DEFAULT_SETTINGS;
    }
  }

  async updateSettings(
    settings: Partial<TranslationSettings>,
  ): Promise<TranslationSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await this.store.set(this.SETTINGS_KEY as "translation-settings", updated);
    return updated;
  }

  async addModel(model: TranslationModel): Promise<TranslationSettings> {
    const settings = await this.getSettings();
    const existingIndex = settings.models.findIndex(
      (m) => m.name === model.name,
    );

    if (existingIndex >= 0) {
      settings.models[existingIndex] = model;
    } else {
      settings.models.push(model);
    }

    // If this is the first model, make it default
    if (settings.models.length === 1 && !settings.defaultModel) {
      settings.defaultModel = model.name;
    }

    await this.store.set(this.SETTINGS_KEY as "translation-settings", settings);
    return settings;
  }

  async removeModel(modelName: string): Promise<TranslationSettings> {
    const settings = await this.getSettings();
    settings.models = settings.models.filter((m) => m.name !== modelName);

    // If removed model was default, set new default
    if (settings.defaultModel === modelName) {
      settings.defaultModel =
        settings.models.length > 0 ? settings.models[0].name : undefined;
    }

    await this.store.set(this.SETTINGS_KEY as "translation-settings", settings);
    return settings;
  }

  async setDefaultModel(modelName: string): Promise<TranslationSettings> {
    const settings = await this.getSettings();
    const modelExists = settings.models.some((m) => m.name === modelName);

    if (!modelExists) {
      throw new Error(`Model "${modelName}" not found in registered models`);
    }

    settings.defaultModel = modelName;
    await this.store.set(this.SETTINGS_KEY as "translation-settings", settings);
    return settings;
  }

  async getModels(): Promise<TranslationModel[]> {
    const settings = await this.getSettings();
    return settings.models;
  }

  async updateModelUsage(modelName: string): Promise<void> {
    // Perform atomic update by getting current settings and updating only the specific model
    const settings = await this.getSettings();
    const modelIndex = settings.models.findIndex((m) => m.name === modelName);

    if (modelIndex >= 0) {
      // Create a deep copy to avoid mutations affecting the original
      const updatedSettings = { ...settings };
      updatedSettings.models = [...settings.models];
      updatedSettings.models[modelIndex] = {
        ...settings.models[modelIndex],
        lastUsed: new Date().toISOString(),
      };

      // Save the updated settings atomically
      await this.store.set(
        this.SETTINGS_KEY as "translation-settings",
        updatedSettings,
      );
    } else {
      console.warn(`Model "${modelName}" not found for usage tracking`);
    }
  }
}
