import { ChevronDown, Plus, Settings } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { useTranslationStore } from "../../stores/translation-store";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { AddModelDialog } from "./add-model-dialog";
import { ModelManagementDialog } from "./model-management-dialog";

export function ModelSelector(): JSX.Element {
  const { selectedModel, availableModels, setSelectedModel } =
    useTranslationStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

  const currentModel = availableModels.find((m) => m.name === selectedModel);
  const displayName = currentModel ? currentModel.name : "Select Model";

  const handleModelSelect = (modelName: string): void => {
    setSelectedModel(modelName);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-64 justify-between">
            <span className="truncate">
              Model: {displayName}
              {currentModel?.isDefault && (
                <span className="text-muted-foreground ml-1 text-xs">
                  (default)
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          {availableModels.length > 0 ? (
            <>
              {availableModels.map((model) => (
                <DropdownMenuItem
                  key={model.name}
                  onClick={() => handleModelSelect(model.name)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    {model.isDefault && (
                      <span className="text-muted-foreground text-xs">
                        Default
                      </span>
                    )}
                  </div>
                  {!model.isAvailable && (
                    <span className="text-destructive text-xs">
                      Unavailable
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled>No models configured</DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Model
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowManageDialog(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Models
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddModelDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

      <ModelManagementDialog
        open={showManageDialog}
        onOpenChange={setShowManageDialog}
      />
    </>
  );
}
