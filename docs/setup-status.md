# セットアップ進捗ステータス

最終更新: 自動生成（このファイルは手動で追記してOK）

## 完了済み
- PostgreSQL ローカルインストール（CLI: Command Line Tools 利用可能）
- データベース作成: `attendance_db`
- バックエンド環境変数ファイル作成: `backend/.env`
  - `DATABASE_URL` 設定済み（ローカルPostgreSQL）
  - `SESSION_SECRET` 設定済み
  - `JWT_SECRET` 設定済み
  - `NODE_ENV=development`, `PORT=5000`, `FRONTEND_URL=http://localhost:5173`
- 依存関係インストール（ワークスペース全体）
- Prisma マイグレーション適用（DBスキーマ同期済み）
- Prisma Client 生成

## 完了済み（追加）
- Google OAuth 認証情報設定
  - `GOOGLE_CLIENT_ID`: 設定済み（実値は `.env` ファイル参照）
  - `GOOGLE_CLIENT_SECRET`: 設定済み（実値は `.env` ファイル参照）
  - `GOOGLE_CALLBACK_URL`: `http://localhost:5000/api/auth/google/callback`
- フロントエンド環境変数ファイル `frontend/.env`
  - `VITE_API_URL=http://localhost:5000/api`
  - `VITE_GOOGLE_CLIENT_ID`: 設定済み（実値は `.env` ファイル参照）
- 開発サーバー起動と動作確認
  - フロントエンド: `http://localhost:5173` 正常起動
  - バックエンド: `http://localhost:5000` 正常起動
  - Google OAuth 認証フロー: 正常動作（ログインページへのリダイレクト確認済み）

## 未完了（要対応）
- Google OAuth同意画面でのテストユーザー追加
  - 実際にログインするには、Google Cloud Consoleの「OAuth同意画面」でテストユーザーとして自分のGoogleアカウントを追加する必要があります

## 次に実行するコマンド
```bash
# 1) （未設定なら）frontend/.env を作成
cd frontend
printf "VITE_API_URL=http://localhost:5000/api\nVITE_GOOGLE_CLIENT_ID=<your-google-client-id>\n" > .env

# 2) 開発サーバーの起動
# ルートで同時起動
pnpm dev
# または個別
cd backend && pnpm dev
# 別ターミナルで
cd frontend && pnpm dev
```

## 参考
- 詳細手順: `docs/setup-env.md`
- スキーマ: `backend/prisma/schema.prisma`
