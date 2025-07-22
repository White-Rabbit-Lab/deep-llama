# DeepLlama

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/sotayamashita/DeepLlama) [![CI](https://github.com/sotayamashita/DeepLlama/actions/workflows/ci.yml/badge.svg)](https://github.com/sotayamashita/DeepLlama/actions/workflows/ci.yml)

A desktop translation application powered by Ollama LLMs, built with Electron, React, and TypeScript. DeepLlama provides a translation using local language models for privacy and offline capability.

## Features

### Translation

- 🔄 **AI Translation** - High-quality translation powered by Ollama LLMs
- 🌐 **Language Support** - English ↔ Japanese translation pairs
- 🎯 **Manual Translation** - On-demand translation with button or Command+Enter
- ⚡ **Language Swap** - Quick swap between source and target languages
- 📊 **Character Counting** - Real-time character count for both source and translation
- 📋 **Copy to Clipboard** - One-click copy of translation results

### Model Management

- 🤖 **Ollama Integration** - Seamless integration with local Ollama models
- ➕ **Model Management** - Add, remove, and configure translation models
- ✅ **Model Validation** - Real-time model availability checking
- ⭐ **Default Models** - Set preferred models for consistent translations
- 🔄 **Auto Refresh** - Automatic synchronization with Ollama server

### Core Features

- 🌓 **Theme System** - Light, dark, and system theme options with persistence
- 🌐 **Internationalization** - Full i18n support with English and Japanese locales
- 🔄 **Type-safe IPC** - End-to-end type safety with tRPC
- 💾 **Persistence** - Settings and preferences stored locally
- 🌍 **Menu Localization** - Dynamically translated application menus

## Tech Stack

### Core Technologies

- **Electron** - Cross-platform desktop application framework
- **React 19** - Modern UI library with the latest features
- **TypeScript** - Type-safe JavaScript superset
- **ESM** - Native ES Modules throughout the application
- **Vite** - Next-generation frontend build tool

### AI & Translation

- **Ollama** - Local LLM integration for translation services
- **Zustand** - Lightweight state management for React

### State Management & Communication

- **tRPC** - End-to-end typesafe API for IPC communication
- **electron-store** - Persistent storage solution
- **Zod** - Schema validation and type generation

### UI Components & Styling

- **Shadcn/ui** - Re-usable UI components built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Sonner** - Toast notifications for user feedback

### Internationalization

- **i18next** - Powerful internationalization framework
- **react-i18next** - React bindings for i18next
- **English and Japanese** - Full localization including application UI and menus

## Architecture

The application follows a modern, well-structured architecture with clean separation of concerns:

### Core Patterns

- **Domain-Driven Design** - Clear domain models with Zod schema validation
- **Repository Pattern** - Abstract persistence layer for data access
- **Service Layer** - Business logic encapsulation for translation and model management
- **Dependency Injection** - Centralized dependency management via container
- **tRPC over IPC** - Type-safe communication between main and renderer processes

### Translation Architecture

- **Translation Service** - Handles AI-powered translation using Ollama models
- **Ollama Service** - Manages communication with local Ollama server
- **Model Repository** - Persists user model preferences and settings
- **Language Detection** - Automatic language identification (optional)
- **State Management** - Zustand store for translation UI state

### File Structure

```
src/
├── main/                          # Electron main process
│   ├── services/                  # Business logic layer
│   │   ├── translation-service.ts # Translation orchestration
│   │   └── ollama-service.ts      # Ollama API integration
│   ├── repository/                # Data access layer
│   │   └── translation-settings-repository.ts
│   ├── trpc/routers/              # API endpoints
│   │   ├── translation.ts         # Translation operations
│   │   └── models.ts              # Model management
│   └── di/container.ts            # Dependency injection
├── renderer/                      # React frontend
│   ├── pages/translation.tsx      # Main translation interface
│   ├── components/translation/    # Translation UI components
│   └── stores/translation-store.ts # Zustand state management
└── shared/                        # Shared types and schemas
    └── domain/                    # Domain models
        ├── translation.ts         # Translation types
        └── ollama.ts              # Ollama integration types
```

## Prerequisites

Before running DeepLlama, you need to have Ollama installed and running:

1. **Install Ollama** - Download from [ollama.ai](https://ollama.ai)
2. **Start Ollama** - Run `ollama serve` in your terminal
3. **Download Models** - Install translation models like:
   ```bash
   ollama pull llama2
   ollama pull mistral
   ollama pull codellama
   ```

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

The application will start with:

- Main window running the Electron app
- Hot reload for both main and renderer processes
- Automatic TypeScript compilation

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

### Code Quality Commands

```bash
# Run all linters (ESLint + Prettier + TypeScript)
$ pnpm lint

# Fix formatting and linting issues
$ pnpm fix

# Type checking only
$ pnpm lint:typecheck

# Preview built application
$ pnpm start
```

## Usage

### Getting Started

1. **Launch the Application** - Start DeepLlama after installing
2. **Check Connection** - Verify Ollama connection status in the header
3. **Add Models** - Use the model selector to add your Ollama models
4. **Start Translating** - Enter text and click Translate or press Command+Enter

### Translation Interface

- **Source Text** - Enter text in the left panel
- **Language Selection** - Choose source and target languages
- **Language Swap** - Click the swap button to reverse translation direction
- **Manual Translation** - Click "Translate" or use Command+Enter shortcut
- **Copy Results** - Copy translated text to clipboard with one click

### Model Management

- **Add Models** - Select models from your Ollama installation
- **Set Defaults** - Configure your preferred translation model
- **Model Status** - View real-time availability of models
- **Remove Models** - Clean up unused models from the interface

## Code Quality

- **Conventional Commits** - Standardized commit message format
- **TypeScript** - Strong typing throughout the application
- **Prettier & ESLint** - Consistent formatting and linting
- **Pre-commit Hooks** - Automatic linting and formatting
- **Type Safety** - End-to-end type safety with tRPC and Zod

## Architecture Documentation

The project maintains Architecture Decision Records (ADRs) in the `docs/adr` directory, documenting key architectural decisions including:

- tRPC over IPC communication
- Repository pattern with Electron Store
- Internationalization with persistent language settings
- Split router architecture

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## License

MIT License - see the [LICENSE](LICENSE) file for details.
