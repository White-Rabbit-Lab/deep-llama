import { ArrowLeftRight } from "lucide-react";
import type { JSX } from "react";
import { useEffect } from "react";
import { ConnectionStatus } from "../components/translation/connection-status";
import { LanguageSelector } from "../components/translation/language-selector";
import { ModelSelector } from "../components/translation/model-selector";
import { TranslationInput } from "../components/translation/translation-input";
import { TranslationOutput } from "../components/translation/translation-output";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { useTranslationStore } from "../stores/translation-store";

export function TranslationPage(): JSX.Element {
  const { initialize, connectionStatus, translationError, swapLanguages } =
    useTranslationStore();

  useEffect(() => {
    // Initialize the store when component mounts
    initialize();
  }, [initialize]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="bg-background flex-shrink-0 border-b">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">DeepLlama</h1>
            <ConnectionStatus status={connectionStatus} />
          </div>
          <div className="flex items-center space-x-4">
            <ModelSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-0 flex-1 flex-col">
        {/* Error Display */}
        {translationError && (
          <div className="bg-destructive/10 border-destructive/20 border-b px-6 py-3">
            <p className="text-destructive text-sm">{translationError}</p>
          </div>
        )}

        {/* Translation Interface */}
        <div className="relative flex min-h-0 flex-1">
          {/* Input Section */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Source Language Header */}
            <div className="border-b px-2 py-2">
              <LanguageSelector type="source" />
            </div>
            <div className="flex-1 p-4">
              <TranslationInput />
            </div>
          </div>

          {/* Separator with Swap Button */}
          <div className="relative flex-shrink-0">
            <Separator orientation="vertical" className="h-full" />
            {/* Centered Swap Button */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <Button
                variant="ghost"
                size="sm"
                onClick={swapLanguages}
                className="hover:bg-muted bg-background h-8 w-8 rounded-full border p-0"
                title="Swap languages"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Target Language Header */}
            <div className="border-b px-2 py-2">
              <LanguageSelector type="target" />
            </div>
            <div className="flex-1 p-4">
              <TranslationOutput />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
