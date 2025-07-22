/**
 * Dependency Injection Container
 * Central location for managing application dependencies
 */

import type { TypedStore } from "../persistence/store.js";
import { getAppStore } from "../persistence/store.js";
import { LanguageRepository } from "../repository/language-repository.js";
import { ThemeRepository } from "../repository/theme-repository.js";
import { TranslationSettingsRepositoryImpl } from "../repository/translation-settings-repository.js";
import { OllamaServiceImpl } from "../services/ollama-service.js";
import { TranslationServiceImpl } from "../services/translation-service.js";

/**
 * Lazy-loaded singleton container for application dependencies
 */
class DIContainer {
  private initialized = false;
  private store: TypedStore | undefined;
  private themeRepository: ThemeRepository | undefined;
  private languageRepository: LanguageRepository | undefined;
  private translationSettingsRepository:
    | TranslationSettingsRepositoryImpl
    | undefined;
  private ollamaService: OllamaServiceImpl | undefined;
  private translationService: TranslationServiceImpl | undefined;

  /**
   * Ensure container is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    // Initialize core dependencies
    this.store = await getAppStore();

    // Initialize repositories
    this.themeRepository = new ThemeRepository(this.store);
    this.languageRepository = new LanguageRepository(this.store);
    this.translationSettingsRepository = new TranslationSettingsRepositoryImpl(
      this.store,
    );

    // Initialize services
    this.ollamaService = new OllamaServiceImpl();
    this.translationService = new TranslationServiceImpl(
      this.ollamaService,
      this.translationSettingsRepository,
    );

    this.initialized = true;
  }

  /**
   * Get the application store
   */
  async getStore(): Promise<TypedStore> {
    await this.ensureInitialized();
    return this.store!;
  }

  /**
   * Get the Theme repository
   */
  async getThemeRepository(): Promise<ThemeRepository> {
    await this.ensureInitialized();
    return this.themeRepository!;
  }

  /**
   * Get the Language repository
   */
  async getLanguageRepository(): Promise<LanguageRepository> {
    await this.ensureInitialized();
    return this.languageRepository!;
  }

  /**
   * Get the Translation Settings repository
   */
  async getTranslationSettingsRepository(): Promise<TranslationSettingsRepositoryImpl> {
    await this.ensureInitialized();
    return this.translationSettingsRepository!;
  }

  /**
   * Get the Ollama service
   */
  async getOllamaService(): Promise<OllamaServiceImpl> {
    await this.ensureInitialized();
    return this.ollamaService!;
  }

  /**
   * Get the Translation service
   */
  async getTranslationService(): Promise<TranslationServiceImpl> {
    await this.ensureInitialized();
    return this.translationService!;
  }
}

// Export singleton instance
export const container = new DIContainer();
