import type { SupportedLanguage } from "#shared/domain/translation";
import {
  getLanguageDisplayName,
  LANGUAGE_CONFIG,
} from "#shared/domain/translation";
import type { JSX } from "react";
import { useTranslationStore } from "../../stores/translation-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface LanguageSelectorProps {
  type: "source" | "target";
}

export function LanguageSelector({ type }: LanguageSelectorProps): JSX.Element {
  const {
    manualSourceLanguage,
    setManualSourceLanguage,
    manualTargetLanguage,
    setManualTargetLanguage,
  } = useTranslationStore();

  if (type === "source") {
    return (
      <Select
        value={manualSourceLanguage}
        onValueChange={(value) =>
          setManualSourceLanguage(value as SupportedLanguage)
        }
      >
        <SelectTrigger className="text-muted-foreground h-8 border-0 text-sm font-medium shadow-none focus:ring-0">
          <SelectValue>
            {getLanguageDisplayName(manualSourceLanguage)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(LANGUAGE_CONFIG).map(([code, config]) => (
            <SelectItem key={code} value={code}>
              {config.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Target language selector
  return (
    <Select
      value={manualTargetLanguage || "ja"}
      onValueChange={(value) =>
        setManualTargetLanguage(value as SupportedLanguage)
      }
    >
      <SelectTrigger className="text-muted-foreground h-8 border-0 text-sm font-medium shadow-none focus:ring-0">
        <SelectValue>
          {getLanguageDisplayName(manualTargetLanguage || "ja")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LANGUAGE_CONFIG).map(([code, config]) => (
          <SelectItem key={code} value={code}>
            {config.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
