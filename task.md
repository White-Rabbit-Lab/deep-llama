# DeepLlama翻訳機能実装タスク

## プロジェクト概要

DeepLlamaは、完全ローカルで動作するOllama統合翻訳アプリケーションです。既存のElectron + React + TypeScriptアーキテクチャ基盤を活用し、翻訳機能を実装します。

## 現在の状況

### ✅ 完了済み（強固な基盤）

- レイヤードアーキテクチャ（tRPC over IPC、DI、Repository pattern）
- 国際化システム（i18next）
- テーマシステム（ライト/ダーク/システム）
- 永続化システム（electron-store）
- 型安全なIPC通信（tRPC）

### ✅ 実装完了（翻訳機能）

- Ollama統合サービス
- 翻訳UI（横並びレイアウト）
- モデル管理機能
- 手動翻訳ロジック
- エラーハンドリング（sonner）
- 言語選択・スワップ機能
- キーボードショートカット（Command+Enter）

## 技術仕様

### アーキテクチャ

- **Framework**: Electron + React + TypeScript
- **Architecture**: Layered Architecture with DI Container
- **IPC**: tRPC over Electron IPC
- **State Management**: Zustand
- **UI**: shadcn/ui + Tailwind CSS

### 主要ライブラリ

```json
{
  "新規追加": {
    "ollama": "^0.5.16",
    "franc": "^6.2.0",
    "react-use-clipboard": "latest",
    "sonner": "latest"
  }
}
```

## 実装タスク

### Phase 1: 基盤構築

#### Task 1.1: 依存関係追加

- [x] `ollama`, `franc`, `react-use-clipboard`, `sonner`をインストール
- [x] TypeScript型定義の確認・追加

#### Task 1.2: Domain Layer拡張

- [x] `src/shared/domain/translation.ts` - 翻訳関連スキーマ定義
  - TranslationRequest, TranslationResponse
  - SupportedLanguage, DetectedLanguage
  - TranslationModel, TranslationSettings
- [x] `src/shared/domain/ollama.ts` - Ollama関連スキーマ定義

#### Task 1.3: Repository Layer

- [x] `src/main/repository/translation-settings-repository.ts`
  - モデル設定の永続化（選択モデル、モデルリスト）
  - 翻訳設定の永続化（デバウンス時間等）

### Phase 2: Service Layer実装

#### Task 2.1: Ollama統合サービス

- [x] `src/main/services/ollama-service.ts`
  - Ollama HTTP API クライアント
  - ストリーミング対応翻訳メソッド
  - モデル存在確認・リスト取得
  - エラーハンドリング（接続失敗、モデル不存在等）

#### Task 2.2: 言語検出サービス（削除）

- [x] ~~`src/main/services/language-detection-service.ts`~~（Auto Detect機能削除のため不要）
  - ~~francライブラリ統合~~
  - ~~日本語・英語検出（3文字以上）~~
  - ~~フォールバック処理（前回設定使用）~~
  - ~~パフォーマンス最適化（100ms以内）~~

#### Task 2.3: 翻訳サービス

- [x] `src/main/services/translation-service.ts`
  - 手動翻訳フロー制御（手動言語選択 → 翻訳実行）
  - 言語スワップロジック（日↔英）
  - リクエストキャンセル機能
  - 翻訳履歴管理（非永続化、プライバシー配慮）

### Phase 3: tRPC API設計

#### Task 3.1: Translation Router

- [x] `src/main/trpc/routers/translation.ts`
  - `translateText(text, sourceLanguage, targetLanguage, model)` - メイン翻訳API
  - ~~`detectLanguage(text: string)` - 言語検出API~~（削除）
  - `getAvailableModels()` - 利用可能モデル取得
  - `getConnectionStatus()` - Ollama接続状態確認

#### Task 3.2: Model Management Router

- [x] `src/main/trpc/routers/models.ts`
  - `addModel(name: string, makeDefault?: boolean)` - モデル追加
  - `removeModel(name: string)` - モデル削除
  - `updateSettings(settings)` - 設定更新
  - `getModels()` - 登録済みモデル一覧
  - `getSettings()` - 設定取得

#### Task 3.3: DI Container更新

- [x] `src/main/di/container.ts`に新サービス登録
  - OllamaService, TranslationService
  - TranslationSettingsRepository

### Phase 4: UI実装

#### Task 4.1: 翻訳メイン画面

- [x] `src/renderer/src/pages/translation.tsx`
  - 横並びレイアウト（原文 | 翻訳結果）
  - 言語セレクター
  - 言語スワップボタン
  - 手動翻訳システム

#### Task 4.2: 翻訳入力コンポーネント

- [x] `src/renderer/src/components/translation/translation-input.tsx`
  - テキストエリア
  - 文字数カウンター
  - 翻訳ボタン
  - Command+Enterショートカット
  - ローディング状態表示

#### Task 4.3: 翻訳結果コンポーネント

- [x] `src/renderer/src/components/translation/translation-output.tsx`
  - 翻訳結果表示
  - コピーボタン（📋アイコン）
  - コピー成功フィードバック
  - ローディング状態表示
  - Target言語表示

#### Task 4.4: モデル管理UI

- [x] `src/renderer/src/components/translation/model-selector.tsx`
  - ドロップダウンセレクト
  - モデル追加ダイアログ
  - デフォルトモデル表示
- [x] `src/renderer/src/components/settings/model-management.tsx`
  - モデル一覧表示
  - 追加・削除・デフォルト設定

#### Task 4.5: 言語選択UI

- [x] `src/renderer/src/components/translation/language-selector.tsx`
  - ソース言語・ターゲット言語セレクター
  - 自動切り替え機能
  - 統一されたデザイン

### Phase 5: 状態管理

#### Task 5.1: Translation Store

- [x] `src/renderer/src/stores/translation-store.ts`
  - Zustandストア実装
  - 翻訳状態管理（原文、翻訳結果、手動言語選択）
  - 選択モデル状態
  - ローディング・エラー状態
  - 言語スワップ機能
  - 手動翻訳実行

#### Task 5.2: Model Store（統合済み）

- [x] ~~`src/renderer/src/stores/model-store.ts`~~（Translation Storeに統合）
  - モデル一覧状態（Translation Store内で管理）
  - デフォルトモデル状態
  - モデル追加・削除・設定更新

### Phase 6: エラーハンドリング・UX

#### Task 6.1: エラーハンドリング

- [x] Sonner統合（トースト通知）
- [x] エラー分類・ユーザーフレンドリーメッセージ
  - Ollama未起動エラー
  - モデル不存在エラー
  - ネットワークエラー
  - 接続状態表示

#### Task 6.2: UX改善

- [x] ローディングアニメーション
- [x] コピー成功フィードバック
- [x] キーボードショートカット（Command+Enter）
- [x] アクセシビリティ対応（title属性、適切なラベル）

### Phase 7: 設定・永続化

#### Task 7.1: 設定画面拡張

- [x] 既存設定画面にモデル管理セクション追加
- [x] モデル管理ダイアログ実装
- [x] デフォルトモデル表示・変更

#### Task 7.2: 設定永続化

- [x] モデル設定の永続化
- [x] 翻訳設定の永続化（electron-store）
- [x] 前回選択モデルの記憶

### Phase 8: テスト・品質保証

#### Task 8.1: ユニットテスト

- [ ] 言語検出サービステスト（franc統合）
- [ ] 翻訳サービステスト（モック使用）
- [ ] リポジトリテスト（永続化）
- [ ] ストアテスト（状態管理）

#### Task 8.2: 統合テスト

- [ ] Ollama統合テスト（実際のモデル使用）
- [ ] tRPC API テスト
- [ ] E2E翻訳フローテスト

#### Task 8.3: パフォーマンステスト

- [ ] 言語検出パフォーマンス（100ms以内）
- [ ] 翻訳レスポンステスト
- [ ] UIレスポンシブネステスト（60fps）

## 実装優先順位

### 最高優先度（MVP必須）

1. Task 1.1-1.3: 基盤構築
2. Task 2.1-2.3: Service Layer
3. Task 3.1-3.3: tRPC API
4. Task 4.1-4.3: 基本UI
5. Task 5.1: Translation Store

### 高優先度

6. Task 4.4: モデル管理UI
7. Task 5.2: Model Store
8. Task 6.1: エラーハンドリング

### 中優先度

9. Task 6.2: UX改善
10. Task 7.1-7.2: 設定・永続化

### 低優先度（将来拡張）

11. Task 8.1-8.3: テスト

## 技術的注意事項

### パフォーマンス

- 言語検出: デバウンス処理で過剰実行防止
- 翻訳リクエスト: キャンセル機能実装
- UI: 60fps維持、アニメーション最適化

### セキュリティ・プライバシー

- 翻訳履歴は一切保存しない
- すべての処理をローカル完結
- 外部通信はOllamaのみ

### アーキテクチャ原則

- 既存のレイヤード構造を踏襲
- tRPCによる型安全性維持
- DIコンテナによる疎結合
- 単一責任原則の徹底

## 成功指標

- [x] 日本語⇔英語の手動言語選択・翻訳
- [x] 手動翻訳トリガー（ボタン・キーボードショートカット）
- [x] 複数Ollamaモデルの切り替え・管理
- [x] ワンクリックコピー機能
- [x] 適切なエラーハンドリング・ユーザー通知
- [x] 設定の永続化・復元
- [x] 既存のテーマ・国際化システムとの統合
- [x] UI実装
- [x] 言語スワップ機能
- [x] Command+Enterショートカット

## 実装変更履歴

### 主要な設計変更

1. **自動翻訳から手動翻訳への変更**
   - デバウンス自動翻訳を削除
   - 翻訳ボタン・Command+Enterショートカット実装
2. **Auto Detect機能の削除**
   - francライブラリベースの言語検出を削除
   - 手動言語選択のみに変更
3. **UI実装**
   - 言語セレクターを各翻訳エリア上部に配置
   - 中央に言語スワップボタンを配置
   - Target言語表示を動的更新

4. **統合ストア設計**
   - Translation StoreでModel管理機能も統合
   - 単一ストアによる状態管理

### 完了した機能

✅ **MVP機能はすべて実装完了** - 手動翻訳、言語選択、モデル管理、コピー機能、エラーハンドリング、設定永続化など、すべての基本機能が動作可能な状態です。
