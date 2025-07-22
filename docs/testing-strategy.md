# Unit Testing Strategy

## Overview

This document outlines the unit testing strategy for the DeepLlama application. The focus is on **unit tests only** - integration and end-to-end tests are excluded from this strategy.

## Testing Philosophy

### Core Principles

1. **Complete Isolation**: Each unit test must be completely isolated from external dependencies
2. **Fast Execution**: Each test should run in under 10ms
3. **Deterministic**: Tests must produce the same results on every run
4. **Single Responsibility**: One test validates one behavior
5. **Zero Side Effects**: Tests have no impact on the system state

### Test Framework: Vitest

**Recommended**: Vitest is the optimal choice for this project due to:

- **Vite Integration**: Seamless integration with existing Vite build setup
- **ESM Support**: Native ES modules support (project uses `"type": "module"`)
- **TypeScript Support**: Zero-configuration TypeScript support
- **Jest Compatibility**: Jest-compatible API for familiar syntax
- **High Performance**: Fast execution with Vite's optimization

## Layer-by-Layer Testing Strategy

### 1. Domain Layer (`src/shared/domain/`)

**Focus**: Zod schema validation and type safety

```typescript
// tests/unit/domain/translation.test.ts
describe("Translation Schema", () => {
  describe("TranslationRequest validation", () => {
    test("accepts valid translation request", () => {
      const validRequest = {
        text: "Hello",
        sourceLanguage: "en",
        targetLanguage: "ja",
      };
      expect(() => TranslationRequestSchema.parse(validRequest)).not.toThrow();
    });

    test("rejects empty text", () => {
      const invalidRequest = {
        text: "",
        sourceLanguage: "en",
        targetLanguage: "ja",
      };
      expect(() => TranslationRequestSchema.parse(invalidRequest)).toThrow();
    });

    test("rejects invalid language codes", () => {
      const invalidRequest = {
        text: "Hello",
        sourceLanguage: "invalid",
        targetLanguage: "ja",
      };
      expect(() => TranslationRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe("SupportedLanguage enum", () => {
    test("includes expected languages", () => {
      expect(SupportedLanguage.EN).toBe("en");
      expect(SupportedLanguage.JA).toBe("ja");
    });

    test("rejects invalid language strings", () => {
      expect(() => SupportedLanguageSchema.parse("invalid")).toThrow();
    });
  });
});
```

### 2. Repository Layer (`src/main/repository/`)

**Focus**: CRUD operations with mocked storage

```typescript
// tests/unit/repository/todo-repository.test.ts
describe("TodoRepository", () => {
  let repository: TodoRepository;
  let mockStore: jest.Mocked<TypedStore>;

  beforeEach(() => {
    mockStore = createMockStore();
    repository = new TodoRepository(mockStore);
  });

  describe("findAll", () => {
    test("returns all todos from store", async () => {
      const mockTodos = [createTodo(), createTodo()];
      mockStore.get.mockResolvedValue(mockTodos);

      const result = await repository.findAll();

      expect(mockStore.get).toHaveBeenCalledWith("todos");
      expect(result).toEqual(mockTodos);
    });

    test("returns empty array when no todos", async () => {
      mockStore.get.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    test("returns todo when found", async () => {
      const targetTodo = createTodo({ id: "test-id" });
      mockStore.get.mockResolvedValue([targetTodo, createTodo()]);

      const result = await repository.findById("test-id");

      expect(result).toEqual(targetTodo);
    });

    test("returns undefined when not found", async () => {
      mockStore.get.mockResolvedValue([createTodo()]);

      const result = await repository.findById("nonexistent");

      expect(result).toBeUndefined();
    });
  });

  describe("getById", () => {
    test("returns todo when found", async () => {
      const targetTodo = createTodo({ id: "test-id" });
      mockStore.get.mockResolvedValue([targetTodo]);

      const result = await repository.getById("test-id");

      expect(result).toEqual(targetTodo);
    });

    test("throws NotFoundError when todo not found", async () => {
      mockStore.get.mockResolvedValue([]);

      await expect(repository.getById("nonexistent")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("save", () => {
    test("adds new todo to store", async () => {
      const existingTodos = [createTodo()];
      const newTodo = createTodo({ id: undefined }); // New todo without ID
      mockStore.get.mockResolvedValue(existingTodos);

      const result = await repository.save(newTodo);

      expect(result.id).toBeDefined();
      expect(mockStore.set).toHaveBeenCalledWith(
        "todos",
        expect.arrayContaining([
          ...existingTodos,
          expect.objectContaining(newTodo),
        ]),
      );
    });

    test("updates existing todo in store", async () => {
      const existingTodo = createTodo({ id: "existing-id" });
      const updatedTodo = { ...existingTodo, title: "Updated Title" };
      mockStore.get.mockResolvedValue([existingTodo]);

      await repository.save(updatedTodo);

      expect(mockStore.set).toHaveBeenCalledWith("todos", [updatedTodo]);
    });
  });
});
```

### 3. Service Layer (`src/main/services/`)

**Focus**: Business logic with mocked dependencies

```typescript
// tests/unit/services/translation-service.test.ts
describe("TranslationService", () => {
  let service: TranslationServiceImpl;
  let mockOllamaService: jest.Mocked<OllamaService>;
  let mockSettingsRepo: jest.Mocked<TranslationSettingsRepository>;

  beforeEach(() => {
    mockOllamaService = createMockOllamaService();
    mockSettingsRepo = createMockTranslationSettingsRepository();
    service = new TranslationServiceImpl(mockOllamaService, mockSettingsRepo);
  });

  describe("translate", () => {
    test("returns original text when source equals target language", async () => {
      const request = createTranslationRequest({
        sourceLanguage: "en",
        targetLanguage: "en",
      });

      const result = await service.translate(request);

      expect(result.translatedText).toBe(request.text);
      expect(result.sourceLanguage).toBe("en");
      expect(result.targetLanguage).toBe("en");
      expect(mockOllamaService.translateText).not.toHaveBeenCalled();
    });

    test("throws error when source language is missing", async () => {
      const request = createTranslationRequest({ sourceLanguage: undefined });

      await expect(service.translate(request)).rejects.toThrow(
        "Source and target languages are required",
      );
    });

    test("throws error when target language is missing", async () => {
      const request = createTranslationRequest({ targetLanguage: undefined });

      await expect(service.translate(request)).rejects.toThrow(
        "Source and target languages are required",
      );
    });

    test("calls ollama service with correct parameters", async () => {
      const request = createTranslationRequest({
        text: "Hello World",
        sourceLanguage: "en",
        targetLanguage: "ja",
        modelName: "custom-model",
      });
      mockSettingsRepo.getDefaultModel.mockResolvedValue("default-model");
      mockOllamaService.translateText.mockResolvedValue("こんにちは世界");

      await service.translate(request);

      expect(mockOllamaService.translateText).toHaveBeenCalledWith(
        "Hello World",
        "en",
        "ja",
        "custom-model", // Should use provided model, not default
      );
    });

    test("uses default model when none provided", async () => {
      const request = createTranslationRequest({ modelName: undefined });
      mockSettingsRepo.getDefaultModel.mockResolvedValue("default-model");
      mockOllamaService.translateText.mockResolvedValue("translated");

      await service.translate(request);

      expect(mockOllamaService.translateText).toHaveBeenCalledWith(
        request.text,
        request.sourceLanguage,
        request.targetLanguage,
        "default-model",
      );
    });

    test("sets translation state correctly during operation", async () => {
      mockOllamaService.translateText.mockImplementation(async () => {
        // Verify state during translation
        expect(service.isTranslating()).toBe(true);
        return "translated";
      });

      const request = createTranslationRequest();

      expect(service.isTranslating()).toBe(false);
      await service.translate(request);
      expect(service.isTranslating()).toBe(false);
    });
  });

  describe("cancelTranslation", () => {
    test("returns false when no active translation", () => {
      const result = service.cancelTranslation();
      expect(result).toBe(false);
    });

    test("cancels active translation", async () => {
      mockOllamaService.translateText.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Operation cancelled")), 100),
          ),
      );

      const translatePromise = service.translate(createTranslationRequest());

      // Small delay to ensure translation has started
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = service.cancelTranslation();

      expect(result).toBe(true);
      await expect(translatePromise).rejects.toThrow();
    });
  });

  describe("isTranslating", () => {
    test("returns false initially", () => {
      expect(service.isTranslating()).toBe(false);
    });

    test("returns true during translation", async () => {
      let isTranslatingDuringCall = false;

      mockOllamaService.translateText.mockImplementation(async () => {
        isTranslatingDuringCall = service.isTranslating();
        return "translated";
      });

      await service.translate(createTranslationRequest());

      expect(isTranslatingDuringCall).toBe(true);
      expect(service.isTranslating()).toBe(false); // After completion
    });
  });
});
```

### 4. tRPC Routers (`src/main/trpc/routers/`)

**Focus**: API endpoint validation and service integration

```typescript
// tests/unit/trpc/translation.router.test.ts
describe("Translation Router", () => {
  let mockService: jest.Mocked<TranslationService>;
  let router: ReturnType<typeof createTranslationRouter>;

  beforeEach(() => {
    mockService = createMockTranslationService();
    router = createTranslationRouter(mockService);
  });

  describe("translate procedure", () => {
    test("validates input and calls service", async () => {
      const input = {
        text: "Hello",
        sourceLanguage: "en" as SupportedLanguage,
        targetLanguage: "ja" as SupportedLanguage,
      };
      const expectedOutput = createTranslationResponse({
        translatedText: "こんにちは",
        modelUsed: "llama2",
      });
      mockService.translate.mockResolvedValue(expectedOutput);

      const result = await router.createCaller({}).translate(input);

      expect(mockService.translate).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedOutput);
    });

    test("rejects invalid input - empty text", async () => {
      const invalidInput = {
        text: "",
        sourceLanguage: "en" as SupportedLanguage,
        targetLanguage: "ja" as SupportedLanguage,
      };

      await expect(
        router.createCaller({}).translate(invalidInput),
      ).rejects.toThrow("Validation error");
    });

    test("rejects invalid input - invalid source language", async () => {
      const invalidInput = {
        text: "Hello",
        sourceLanguage: "invalid" as SupportedLanguage,
        targetLanguage: "ja" as SupportedLanguage,
      };

      await expect(
        router.createCaller({}).translate(invalidInput),
      ).rejects.toThrow("Validation error");
    });

    test("handles service errors gracefully", async () => {
      const input = createTranslationRequest();
      mockService.translate.mockRejectedValue(new Error("Service error"));

      await expect(router.createCaller({}).translate(input)).rejects.toThrow(
        "Service error",
      );
    });
  });

  describe("cancel procedure", () => {
    test("calls service cancel method", async () => {
      mockService.cancelTranslation.mockReturnValue(true);

      const result = await router.createCaller({}).cancel();

      expect(mockService.cancelTranslation).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("status procedure", () => {
    test("returns translation status", async () => {
      mockService.isTranslating.mockReturnValue(true);

      const result = await router.createCaller({}).status();

      expect(mockService.isTranslating).toHaveBeenCalled();
      expect(result).toEqual({ isTranslating: true });
    });
  });
});
```

## Mock Strategy

### Core Mock Factories

```typescript
// tests/mocks/store.mock.ts
export const createMockStore = (): jest.Mocked<TypedStore> => ({
  get: jest.fn().mockResolvedValue([]),
  set: jest.fn().mockResolvedValue(undefined),
  has: jest.fn().mockResolvedValue(false),
  delete: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
});

// tests/mocks/ollama-service.mock.ts
export const createMockOllamaService = (): jest.Mocked<OllamaService> => ({
  translateText: jest.fn().mockResolvedValue("mocked translation"),
  isAvailable: jest.fn().mockResolvedValue(true),
  listModels: jest.fn().mockResolvedValue(["llama2", "llama3"]),
  pullModel: jest.fn().mockResolvedValue(undefined),
  deleteModel: jest.fn().mockResolvedValue(undefined),
});

// tests/mocks/repositories.mock.ts
export const createMockTranslationSettingsRepository =
  (): jest.Mocked<TranslationSettingsRepository> => ({
    getDefaultModel: jest.fn().mockResolvedValue("llama2"),
    setDefaultModel: jest.fn().mockResolvedValue(undefined),
    getSettings: jest.fn().mockResolvedValue(createTranslationSettings()),
    updateSettings: jest.fn().mockResolvedValue(undefined),
  });
```

### Test Data Factories

```typescript
// tests/factories/translation.factory.ts
export const createTranslationRequest = (
  overrides: Partial<TranslationRequest> = {},
): TranslationRequest => ({
  text: "Hello World",
  sourceLanguage: "en",
  targetLanguage: "ja",
  modelName: "llama2",
  ...overrides,
});

export const createTranslationResponse = (
  overrides: Partial<TranslationResponse> = {},
): TranslationResponse => ({
  translatedText: "こんにちは世界",
  sourceLanguage: "en",
  targetLanguage: "ja",
  modelUsed: "llama2",
  timestamp: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createTranslationSettings = (
  overrides: Partial<TranslationSettings> = {},
): TranslationSettings => ({
  defaultModel: "llama2",
  temperature: 0.7,
  maxTokens: 1000,
  ...overrides,
});

// tests/factories/todo.factory.ts
export const createTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: `todo-${Math.random().toString(36).substr(2, 9)}`,
  title: "Test Todo",
  description: "Test Description",
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// tests/factories/ollama.factory.ts
export const createOllamaModel = (
  overrides: Partial<OllamaModel> = {},
): OllamaModel => ({
  name: "llama2",
  size: "7B",
  family: "llama",
  format: "gguf",
  modified_at: new Date().toISOString(),
  ...overrides,
});
```

## Test File Structure

```
tests/
├── unit/
│   ├── domain/
│   │   ├── todo.test.ts
│   │   ├── translation.test.ts
│   │   ├── ollama.test.ts
│   │   ├── language.test.ts
│   │   └── theme.test.ts
│   ├── repository/
│   │   ├── todo-repository.test.ts
│   │   ├── theme-repository.test.ts
│   │   ├── language-repository.test.ts
│   │   └── translation-settings-repository.test.ts
│   ├── services/
│   │   ├── translation-service.test.ts
│   │   ├── ollama-service.test.ts
│   │   ├── theme-service.test.ts
│   │   ├── language-service.test.ts
│   │   └── todo-service.test.ts
│   └── trpc/
│       ├── translation.router.test.ts
│       ├── models.router.test.ts
│       ├── todo.router.test.ts
│       ├── theme.router.test.ts
│       └── language.router.test.ts
├── mocks/
│   ├── store.mock.ts
│   ├── ollama-service.mock.ts
│   ├── repositories.mock.ts
│   └── services.mock.ts
├── factories/
│   ├── translation.factory.ts
│   ├── todo.factory.ts
│   ├── ollama.factory.ts
│   ├── theme.factory.ts
│   └── language.factory.ts
└── setup/
    ├── vitest.config.ts
    ├── test-setup.ts
    └── jest-dom.setup.ts
```

## Test Configuration

### Vitest Configuration (`tests/setup/vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "out/",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
  },
  resolve: {
    alias: {
      "#shared": path.resolve(__dirname, "../src/shared"),
      "@main": path.resolve(__dirname, "../src/main"),
      "@renderer": path.resolve(__dirname, "../src/renderer/src"),
      "@": path.resolve(__dirname, "../src/renderer/src"),
    },
  },
});
```

### Test Setup (`tests/setup/test-setup.ts`)

```typescript
import { beforeEach, vi } from "vitest";

// Mock Electron APIs
vi.mock("electron", () => ({
  app: {
    getPath: vi.fn().mockReturnValue("/tmp/test-app"),
    getName: vi.fn().mockReturnValue("DeepLlama Test"),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
  },
}));

// Mock electron-store
vi.mock("electron-store", () => ({
  default: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  })),
}));

// Mock ollama
vi.mock("ollama", () => ({
  Ollama: vi.fn(() => ({
    generate: vi.fn(),
    list: vi.fn(),
    pull: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
global.createMockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);
  return mockDate;
};

global.restoreDate = () => {
  vi.useRealTimers();
};
```

## Testing Guidelines

### Do's

1. **Test Behavior, Not Implementation**: Focus on what the function does, not how it does it
2. **Use Descriptive Test Names**: Test names should clearly describe the expected behavior
3. **Arrange, Act, Assert**: Structure tests clearly with setup, execution, and verification
4. **Mock All External Dependencies**: Ensure complete isolation
5. **Test Edge Cases**: Cover boundary conditions and error scenarios
6. **Keep Tests Simple**: One assertion per test when possible

### Don'ts

1. **Don't Test Private Methods**: Test public APIs only
2. **Don't Test Third-Party Libraries**: Trust that external libraries work correctly
3. **Don't Use Real Resources**: No real files, networks, or databases
4. **Don't Make Tests Dependent**: Each test should be independent
5. **Don't Skip Error Testing**: Always test error scenarios
6. **Don't Use Production Data**: Use factory-generated test data only

### Example Test Structure

```typescript
describe("ComponentUnderTest", () => {
  // Setup
  let component: ComponentUnderTest;
  let mockDependency: jest.Mocked<Dependency>;

  beforeEach(() => {
    // Arrange: Create fresh mocks and instances for each test
    mockDependency = createMockDependency();
    component = new ComponentUnderTest(mockDependency);
  });

  describe("methodUnderTest", () => {
    test("should return expected result when given valid input", async () => {
      // Arrange
      const input = createValidInput();
      const expectedOutput = createExpectedOutput();
      mockDependency.someMethod.mockResolvedValue(expectedOutput);

      // Act
      const result = await component.methodUnderTest(input);

      // Assert
      expect(mockDependency.someMethod).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedOutput);
    });

    test("should throw error when given invalid input", async () => {
      // Arrange
      const invalidInput = createInvalidInput();

      // Act & Assert
      await expect(component.methodUnderTest(invalidInput)).rejects.toThrow(
        "Expected error message",
      );
    });
  });
});
```

## Coverage Goals

- **Minimum Coverage**: 80% line coverage
- **Preferred Coverage**: 90%+ for critical business logic
- **Focus Areas**:
  - Services: 95%+ coverage
  - Repositories: 90%+ coverage
  - Domain validation: 95%+ coverage
  - tRPC routers: 85%+ coverage

## Implementation Priority

1. **Phase 1**: Domain layer and core services
2. **Phase 2**: Repositories and data access
3. **Phase 3**: tRPC routers and API layer
4. **Phase 4**: Enhanced error scenarios and edge cases

This testing strategy ensures comprehensive unit test coverage while maintaining fast, reliable, and maintainable tests that support confident refactoring and development.
