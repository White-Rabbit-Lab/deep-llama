import { IconCopy, IconCopyCheck, IconLoader2 } from "@tabler/icons-react";
import type { JSX } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslationStore } from "../../stores/translation-store";
import { Button } from "../ui/button";

export function TranslationOutput(): JSX.Element {
  const { translatedText, isTranslating } = useTranslationStore();

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    if (!translatedText) return;

    try {
      await navigator.clipboard.writeText(translatedText);
      setIsCopied(true);
      toast.success("Translation copied to clipboard");

      // Reset copy state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Translation Output Area */}
      <div className="relative flex-1">
        {isTranslating ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground flex items-center space-x-2">
              <IconLoader2 className="animate-spin" />
              <span>Translating...</span>
            </div>
          </div>
        ) : translatedText ? (
          <div className="relative h-full">
            <div className="bg-muted/20 h-full overflow-auto rounded-lg p-4">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {translatedText}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <p>Translation will appear here...</p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="text-muted-foreground flex items-center justify-between border-t px-5 py-4 text-sm">
        <div>
          {translatedText && <span>Characters: {translatedText.length}</span>}
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!translatedText}
          >
            {isCopied ? (
              <>
                <IconCopyCheck />
                Copied
              </>
            ) : (
              <>
                <IconCopy />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
