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

### ❌ 実装が必要（翻訳機能）

- Ollama統合サービス
- 言語自動検出（franc）
- 翻訳UI（横並びレイアウト）
- モデル管理機能
- リアルタイム翻訳ロジック
- エラーハンドリング（sonner）

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
    "use-debounce": "latest",
    "react-use-clipboard": "latest",
    "sonner": "latest"
  }
}
```

## 実装タスク

### Phase 1: 基盤構築

#### Task 1.1: 依存関係追加

- [ ] `ollama`, `franc`, `use-debounce`, `react-use-clipboard`, `sonner`をインストール
- [ ] TypeScript型定義の確認・追加

#### Task 1.2: Domain Layer拡張

- [ ] `src/shared/domain/translation.ts` - 翻訳関連スキーマ定義
  - TranslationRequest, TranslationResponse
  - SupportedLanguage, DetectedLanguage
  - TranslationModel, TranslationSettings
- [ ] `src/shared/domain/ollama.ts` - Ollama関連スキーマ定義

#### Task 1.3: Repository Layer

- [ ] `src/main/repository/translation-settings-repository.ts`
  - モデル設定の永続化（選択モデル、モデルリスト）
  - 翻訳設定の永続化（デバウンス時間等）

### Phase 2: Service Layer実装

#### Task 2.1: Ollama統合サービス

- [ ] `src/main/services/ollama-service.ts`
  - Ollama HTTP API クライアント
  - ストリーミング対応翻訳メソッド
  - モデル存在確認・リスト取得
  - エラーハンドリング（接続失敗、モデル不存在等）

#### Task 2.2: 言語検出サービス

- [ ] `src/main/services/language-detection-service.ts`
  - francライブラリ統合
  - 日本語・英語検出（3文字以上）
  - フォールバック処理（前回設定使用）
  - パフォーマンス最適化（100ms以内）

#### Task 2.3: 翻訳サービス

- [ ] `src/main/services/translation-service.ts`
  - 翻訳フロー制御（言語検出 → 翻訳実行）
  - 自動言語切り替えロジック（日↔英）
  - リクエストキャンセル機能
  - 翻訳履歴管理（非永続化、プライバシー配慮）

### Phase 3: tRPC API設計

#### Task 3.1: Translation Router

- [ ] `src/main/trpc/routers/translation.ts`
  - `translate(text: string, fromModel?: string)` - メイン翻訳API
  - `detectLanguage(text: string)` - 言語検出API
  - `getAvailableModels()` - 利用可能モデル取得
  - `validateModel(modelName: string)` - モデル存在確認

#### Task 3.2: Model Management Router

- [ ] `src/main/trpc/routers/models.ts`
  - `addModel(name: string)` - モデル追加
  - `removeModel(name: string)` - モデル削除
  - `setDefaultModel(name: string)` - デフォルトモデル設定
  - `getModels()` - 登録済みモデル一覧

#### Task 3.3: DI Container更新

- [ ] `src/main/di/container.ts`に新サービス登録
  - OllamaService, LanguageDetectionService, TranslationService
  - TranslationSettingsRepository

### Phase 4: UI実装

#### Task 4.1: 翻訳メイン画面

- [ ] `src/renderer/src/pages/translation.tsx`
  - 横並びレイアウト（原文 | 翻訳結果）
  - モデル選択ドロップダウン
  - 入力デバウンス処理（500ms）
  - リアルタイム翻訳表示

#### Task 4.2: 翻訳入力コンポーネント

- [ ] `src/renderer/src/components/translation/translation-input.tsx`
  - 自動リサイズテキストエリア
  - 文字数カウンター
  - 言語検出状態表示
  - プレースホルダー・フォーカス管理

#### Task 4.3: 翻訳結果コンポーネント

- [ ] `src/renderer/src/components/translation/translation-output.tsx`
  - 翻訳結果表示
  - コピーボタン（📋アイコン）
  - コピー成功フィードバック
  - ローディング状態表示

#### Task 4.4: モデル管理UI

- [ ] `src/renderer/src/components/translation/model-selector.tsx`
  - ドロップダウンセレクト
  - モデル追加ダイアログ
  - デフォルトモデル表示
- [ ] `src/renderer/src/components/settings/model-management.tsx`
  - モデル一覧表示
  - 追加・削除・デフォルト設定

### Phase 5: 状態管理

#### Task 5.1: Translation Store

- [ ] `src/renderer/src/stores/translation-store.ts`
  - Zustandストア実装
  - 翻訳状態管理（原文、翻訳結果、言語検出結果）
  - 選択モデル状態
  - ローディング・エラー状態

#### Task 5.2: Model Store

- [ ] `src/renderer/src/stores/model-store.ts`
  - モデル一覧状態
  - デフォルトモデル状態
  - モデル追加・削除・設定更新

### Phase 6: エラーハンドリング・UX

#### Task 6.1: エラーハンドリング

- [ ] Sonner統合（トースト通知）
- [ ] エラー分類・ユーザーフレンドリーメッセージ
  - Ollama未起動エラー
  - モデル不存在エラー
  - ネットワークエラー
  - 言語検出失敗

#### Task 6.2: UX改善

- [ ] ローディングアニメーション
- [ ] コピー成功フィードバック
- [ ] キーボードショートカット
- [ ] アクセシビリティ対応

### Phase 7: 設定・永続化

#### Task 7.1: 設定画面拡張

- [ ] 既存設定画面にモデル管理セクション追加
- [ ] 翻訳設定セクション（デバウンス時間等）
- [ ] デフォルトモデル表示・変更

#### Task 7.2: 設定永続化

- [ ] モデル設定の永続化
- [ ] 翻訳設定の永続化
- [ ] 前回選択モデルの記憶

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

- [ ] 日本語⇔英語の自動言語検出・翻訳
- [ ] 500ms以内のリアルタイム翻訳トリガー
- [ ] 複数Ollamaモデルの切り替え・管理
- [ ] ワンクリックコピー機能
- [ ] 適切なエラーハンドリング・ユーザー通知
- [ ] 設定の永続化・復元
- [ ] 既存のテーマ・国際化システムとの統合

この包括的なタスクリストにより、DeepLlamaの翻訳機能を段階的に実装し、仕様書要件を満たすローカル翻訳アプリケーションを完成させることができます。
