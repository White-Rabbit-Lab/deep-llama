import { Plus, Star, Trash2 } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslationStore } from "../../stores/translation-store";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AddModelDialog } from "./add-model-dialog";

interface ModelManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelManagementDialog({
  open,
  onOpenChange,
}: ModelManagementDialogProps): JSX.Element {
  const {
    availableModels,
    settings,
    removeModel,
    updateSettings,
    refreshModels,
  } = useTranslationStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);

  const handleSetDefault = async (modelName: string): Promise<void> => {
    try {
      await updateSettings({ defaultModel: modelName });
      toast.success(`Set "${modelName}" as default model`);
    } catch {
      toast.error("Failed to set default model");
    }
  };

  const handleRemoveModel = async (modelName: string): Promise<void> => {
    if (availableModels.length <= 1) {
      toast.error("Cannot remove the last model");
      return;
    }

    setDeletingModel(modelName);
    try {
      await removeModel(modelName);
      toast.success(`Removed model "${modelName}"`);
    } catch {
      toast.error("Failed to remove model");
    } finally {
      setDeletingModel(null);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    try {
      await refreshModels();
      toast.success("Models refreshed");
    } catch {
      toast.error("Failed to refresh models");
    }
  };

  const handleAddModel = (): void => {
    setShowAddDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Models</DialogTitle>
            <DialogDescription>
              Manage your Ollama models. You can add new models, set default
              models, and remove unused ones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button onClick={handleAddModel} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Model
              </Button>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Refresh Models
              </Button>
            </div>

            {/* Models List */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                Configured Models ({availableModels.length})
              </h4>

              {availableModels.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <p className="text-sm">No models configured</p>
                  <p className="mt-1 text-xs">Add a model to get started</p>
                </div>
              ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {availableModels.map((model) => (
                    <div
                      key={model.name}
                      className="bg-card flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {model.name}
                          </span>
                          {model.name === settings?.defaultModel && (
                            <Badge variant="default" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {!model.isAvailable && (
                            <Badge variant="destructive" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        {model.lastUsed && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Last used:{" "}
                            {new Date(model.lastUsed).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {model.name !== settings?.defaultModel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(model.name)}
                            className="text-xs"
                          >
                            <Star className="mr-1 h-3 w-3" />
                            Set Default
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveModel(model.name)}
                          disabled={
                            deletingModel === model.name ||
                            availableModels.length <= 1
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Summary */}
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="mb-2 text-sm font-medium">Settings</h4>
              <div className="text-sm">
                <div>
                  <span className="text-muted-foreground">Default Model:</span>
                  <span className="ml-2 font-medium">
                    {settings?.defaultModel || "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddModelDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </>
  );
}
