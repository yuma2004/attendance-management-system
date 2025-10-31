# 出退勤管理システム

出退勤、休憩、休憩戻りを記録できる管理システムです。

## 構成

- **フロントエンド**: React + Vite + TypeScript
- **バックエンド**: Express + TypeScript + Prisma
- **データベース**: PostgreSQL
- **認証**: Google OAuth 2.0

## セットアップ

### 必要な環境

- Node.js 18以上
- pnpm 8以上
- PostgreSQL（ローカルまたは Railway）

### インストール

```bash
# 全パッケージのインストール
pnpm install
```

### 環境変数の設定

#### バックエンド

`backend/.env` ファイルを作成し、以下を設定してください：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/attendance_db"
SESSION_SECRET="your-secret-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
JWT_SECRET="your-jwt-secret"
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

#### フロントエンド

`frontend/.env` ファイルを作成し、以下を設定してください：

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### データベースのセットアップ

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma generate
```

### 開発サーバーの起動

```bash
# フロントエンドとバックエンドを同時に起動
pnpm dev

# または個別に起動
cd frontend && pnpm dev
cd backend && pnpm dev
```

## デプロイ

詳細は `docs/deployment.md` を参照してください。

## 監査について

監査対策の詳細は `docs/audit.md` を参照してください。

