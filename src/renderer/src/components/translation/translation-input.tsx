import { IconLoader2, IconSend } from "@tabler/icons-react";
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
      {/* Set px-[8px] to align Taget language */}
      <div className="flex-1 px-[8px] py-2">
        <Textarea
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter text to translate..."
          className="h-full resize-none rounded-none border-0 text-base shadow-none focus-visible:ring-0"
          disabled={isTranslating}
        />
      </div>

      {/* Status Bar */}
      <div className="text-muted-foreground flex items-center justify-between border-t px-5 py-4 text-sm">
        <div>Characters: {inputText.length}</div>
        <Button
          onClick={handleTranslate}
          disabled={!inputText.trim() || isTranslating}
          size="sm"
          className=""
        >
          {isTranslating ? (
            <>
              <IconLoader2 className="animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <IconSend />
              Translate (⌘↵)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
