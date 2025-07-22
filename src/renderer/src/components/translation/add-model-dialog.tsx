import type { JSX } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslationStore } from "../../stores/translation-store";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddModelDialog({
  open,
  onOpenChange,
}: AddModelDialogProps): JSX.Element {
  const { addModel, ollamaModels } = useTranslationStore();

  const [modelName, setModelName] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!modelName.trim()) {
      toast.error("Please enter a model name");
      return;
    }

    setIsLoading(true);

    try {
      await addModel(modelName.trim(), makeDefault);
      toast.success(`Model "${modelName}" added successfully`);
      setModelName("");
      setMakeDefault(false);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add model";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (): void => {
    setModelName("");
    setMakeDefault(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Ollama Model</DialogTitle>
          <DialogDescription>
            Add a new model from your Ollama installation. Make sure the model
            is already downloaded in Ollama.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-name">Model Name</Label>
            <Input
              id="model-name"
              type="text"
              placeholder="e.g., llama2, codellama, mistral"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-xs">
              Enter the exact model name as it appears in Ollama
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="make-default"
              checked={makeDefault}
              onCheckedChange={(checked) => setMakeDefault(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="make-default" className="text-sm">
              Set as default model
            </Label>
          </div>

          {ollamaModels.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Available in Ollama:</Label>
              <div className="max-h-32 overflow-y-auto rounded-md border p-2">
                {ollamaModels.map((model) => (
                  <div
                    key={model.name}
                    className="hover:bg-muted cursor-pointer rounded px-2 py-1 text-xs"
                    onClick={() => setModelName(model.name)}
                  >
                    {model.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Model"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
