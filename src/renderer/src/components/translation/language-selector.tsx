import type { SupportedLanguage } from "#shared/domain/translation";
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
            {manualSourceLanguage === "ja" ? "Japanese" : "English"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ja">Japanese</SelectItem>
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
          {manualTargetLanguage === "ja" ? "Japanese" : "English"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ja">Japanese</SelectItem>
      </SelectContent>
    </Select>
  );
}
