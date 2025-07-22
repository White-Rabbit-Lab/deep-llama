import type { TypedStore } from "@main/persistence/store.js";
import { vi } from "vitest";

export const createMockStore = (): jest.Mocked<TypedStore> =>
  ({
    get: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockResolvedValue(false),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<TypedStore>;
