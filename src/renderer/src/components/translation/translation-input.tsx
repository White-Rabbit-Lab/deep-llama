import type { JSX } from "react";
import { useCallback, useEffect } from "react";
import { useTranslationStore } from "../../stores/translation-store";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export function TranslationInput(): JSX.Element {
  const { inputText, setInputText, translate, isTranslating } =
    useTranslationStore();

  const handleInputChange = (value: string): void => {
    setInputText(value);
  };

  const handleTranslate = useCallback(() => {
    if (inputText.trim() && !isTranslating) {
      translate(inputText);
    }
  }, [inputText, translate, isTranslating]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleTranslate();
      }
    },
    [handleTranslate],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-full flex-col">
      {/* Text Input Area */}
      <div className="relative flex-1">
        <Textarea
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter text to translate..."
          className="h-full resize-none border-0 text-base shadow-none focus-visible:ring-0"
          disabled={isTranslating}
        />

        {/* Loading indicator */}
        {isTranslating && (
          <div className="absolute top-4 right-4">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="text-muted-foreground flex items-center justify-between border-t pt-4 text-sm">
        <div>Characters: {inputText.length}</div>
        <Button
          onClick={handleTranslate}
          disabled={!inputText.trim() || isTranslating}
          size="sm"
          className=""
        >
          {isTranslating ? (
            <div className="border-background border-t-foreground animate-spin rounded-full border-2" />
          ) : (
            <>Translate (⌘+Enter)</>
          )}
        </Button>
      </div>
    </div>
  );
}
