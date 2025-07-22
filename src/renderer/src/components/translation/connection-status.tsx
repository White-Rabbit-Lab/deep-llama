import type { OllamaConnectionStatus } from "#shared/domain/ollama";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import type { JSX } from "react";

interface ConnectionStatusProps {
  status: OllamaConnectionStatus;
}

export function ConnectionStatus({
  status,
}: ConnectionStatusProps): JSX.Element {
  const getStatusConfig = (
    status: OllamaConnectionStatus,
  ): { color: string; bgColor: string; label: string; description: string } => {
    switch (status) {
      case "connected":
        return {
          color: "text-green-500",
          bgColor: "bg-green-500",
          label: "Connected",
          description: "Ollama is running and accessible",
        };
      case "connecting":
        return {
          color: "text-yellow-500",
          bgColor: "bg-yellow-500",
          label: "Connecting",
          description: "Connecting to Ollama server",
        };
      case "disconnected":
        return {
          color: "text-gray-500",
          bgColor: "bg-gray-500",
          label: "Disconnected",
          description: "Not connected to Ollama",
        };
      case "error":
        return {
          color: "text-red-500",
          bgColor: "bg-red-500",
          label: "Error",
          description: "Failed to connect to Ollama",
        };
      default:
        return {
          color: "text-gray-500",
          bgColor: "bg-gray-500",
          label: "Unknown",
          description: "Unknown connection status",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Circle className={cn("h-3 w-3 fill-current", config.color)} />
        {status === "connecting" && (
          <div
            className={cn(
              "absolute inset-0 h-3 w-3 animate-ping rounded-full",
              config.bgColor,
              "opacity-75",
            )}
          />
        )}
      </div>
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}
