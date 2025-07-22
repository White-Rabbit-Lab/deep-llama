import { franc } from "franc";
import type {
  DetectedLanguage,
  SupportedLanguage,
} from "../../shared/domain/translation.js";

export interface LanguageDetectionService {
  detectLanguage(text: string): Promise<DetectedLanguage>;
  isLanguageSupported(languageCode: string): boolean;
  getSupportedLanguages(): SupportedLanguage[];
}

export class LanguageDetectionServiceImpl implements LanguageDetectionService {
  private readonly MIN_TEXT_LENGTH = 3;
  private readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = ["ja", "en"];
  private readonly LANGUAGE_MAP: Record<string, SupportedLanguage> = {
    jpn: "ja",
    eng: "en",
    ja: "ja",
    en: "en",
  };
  private lastDetectedLanguage: SupportedLanguage = "en";

  async detectLanguage(text: string): Promise<DetectedLanguage> {
    const startTime = Date.now();

    try {
      // Input validation
      if (!text || text.trim().length < this.MIN_TEXT_LENGTH) {
        return {
          code: this.lastDetectedLanguage,
          confidence: 0,
          detected: false,
        };
      }

      // Use franc for language detection
      const detectedCode = franc(text, {
        minLength: this.MIN_TEXT_LENGTH,
        only: ["jpn", "eng"],
      });

      // Map to supported language
      const mappedLanguage = this.LANGUAGE_MAP[detectedCode];

      if (mappedLanguage && this.isLanguageSupported(mappedLanguage)) {
        this.lastDetectedLanguage = mappedLanguage;

        // Calculate confidence based on text characteristics
        const confidence = this.calculateConfidence(text, mappedLanguage);

        const result: DetectedLanguage = {
          code: mappedLanguage,
          confidence,
          detected: true,
        };

        // Performance check (should be under 100ms)
        const duration = Date.now() - startTime;
        if (duration > 100) {
          console.warn(
            `Language detection took ${duration}ms, which exceeds 100ms target`,
          );
        }

        return result;
      } else {
        // Fallback to previous detection
        return {
          code: this.lastDetectedLanguage,
          confidence: 0.5,
          detected: false,
        };
      }
    } catch (error) {
      console.error("Language detection failed:", error);

      // Return fallback
      return {
        code: this.lastDetectedLanguage,
        confidence: 0,
        detected: false,
      };
    }
  }

  isLanguageSupported(languageCode: string): boolean {
    return this.SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguage);
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  private calculateConfidence(
    text: string,
    detectedLanguage: SupportedLanguage,
  ): number {
    // Basic confidence calculation based on text characteristics
    let confidence = 0.7; // Base confidence

    // Japanese text characteristics
    if (detectedLanguage === "ja") {
      const hasHiragana = /[\u3040-\u309F]/.test(text);
      const hasKatakana = /[\u30A0-\u30FF]/.test(text);
      const hasKanji = /[\u4E00-\u9FAF]/.test(text);

      if (hasHiragana || hasKatakana || hasKanji) {
        confidence += 0.2;
      }

      // Boost confidence if multiple Japanese character types
      const typeCount = [hasHiragana, hasKatakana, hasKanji].filter(
        Boolean,
      ).length;
      confidence += typeCount * 0.05;
    }

    // English text characteristics
    if (detectedLanguage === "en") {
      const hasAlphabet = /[a-zA-Z]/.test(text);
      const hasCommonWords =
        /\b(the|and|is|to|of|in|it|you|that|he|was|for|on|are|as|with|his|they|at|be|or|an|were|had|been|their)\b/i.test(
          text,
        );

      if (hasAlphabet) {
        confidence += 0.1;
      }

      if (hasCommonWords) {
        confidence += 0.2;
      }
    }

    // Length-based confidence adjustment
    if (text.length < 10) {
      confidence *= 0.8;
    } else if (text.length > 50) {
      confidence = Math.min(confidence * 1.1, 1.0);
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
