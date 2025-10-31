# デプロイ手順

このドキュメントでは、出退勤管理システムをRailway（バックエンド）とVercel（フロントエンド）にデプロイする手順を説明します。

## 前提条件

- Node.js 18以上がインストールされていること
- pnpm 8以上がインストールされていること
- Railwayアカウント（https://railway.app）
- Vercelアカウント（https://vercel.com）
- Google Cloud Platformアカウント（OAuth認証用）

## 1. Google OAuth認証の設定

### Google Cloud Consoleでの設定

1. Google Cloud Console（https://console.cloud.google.com）にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択
3. 「APIとサービス」>「認証情報」に移動
4. 「認証情報を作成」>「OAuth 2.0 クライアントID」を選択
5. アプリケーションの種類を「ウェブアプリケーション」に設定
6. 承認済みのリダイレクトURIに以下を追加：
   - 開発環境: `http://localhost:5000/api/auth/google/callback`
   - 本番環境: `https://your-backend-domain.railway.app/api/auth/google/callback`
7. クライアントIDとクライアントシークレットをコピーして保存

## 2. Railwayでのバックエンドデプロイ

### Railway CLIのインストール

```bash
# npm経由でインストール
npm i -g @railway/cli

# またはpnpm経由でインストール
pnpm add -g @railway/cli
```

### Railwayへのログイン

```bash
railway login
```

### プロジェクトの初期化

```bash
cd backend
railway init
```

### PostgreSQLデータベースの追加

```bash
railway add postgresql
```

データベースURLが自動的に環境変数として追加されます。

### 環境変数の設定

Railwayダッシュボードで環境変数を設定するか、CLIで設定：

```bash
railway variables set DATABASE_URL="<postgresql-url-from-railway>"
railway variables set SESSION_SECRET="<generate-a-random-secret>"
railway variables set GOOGLE_CLIENT_ID="<your-google-client-id>"
railway variables set GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
railway variables set GOOGLE_CALLBACK_URL="https://<your-backend-domain>.railway.app/api/auth/google/callback"
railway variables set JWT_SECRET="<generate-a-random-secret>"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://<your-frontend-domain>.vercel.app"
```

### Railway.jsonの設定

`backend/railway.json` を作成：

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm prisma generate && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### デプロイ

```bash
railway up
```

### データベースマイグレーションの実行

```bash
railway run pnpm prisma migrate deploy
```

## 3. Vercelでのフロントエンドデプロイ

### Vercel CLIのインストール

```bash
npm i -g vercel
# または
pnpm add -g vercel
```

### Vercelへのログイン

```bash
cd frontend
vercel login
```

### vercel.jsonの設定

`frontend/vercel.json` を作成：

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-backend-domain.railway.app/api",
    "VITE_GOOGLE_CLIENT_ID": "your-google-client-id"
  }
}
```

### デプロイ

```bash
vercel --prod
```

初回デプロイ時は対話形式で設定が求められます。

### 環境変数の設定

VercelダッシュボードまたはCLIで環境変数を設定：

```bash
vercel env add VITE_API_URL production
vercel env add VITE_GOOGLE_CLIENT_ID production
```

## 4. 本番環境での確認事項

### バックエンド

- [ ] ヘルスチェックエンドポイント (`/api/health`) が動作しているか
- [ ] Google OAuth認証が正常に動作するか
- [ ] データベースマイグレーションが完了しているか
- [ ] CORS設定がフロントエンドのドメインを許可しているか

### フロントエンド

- [ ] バックエンドAPIへの接続が正常に動作するか
- [ ] Google認証が正常に動作するか
- [ ] 環境変数が正しく設定されているか

## 5. トラブルシューティング

### データベース接続エラー

- RailwayダッシュボードでPostgreSQLサービスのステータスを確認
- `DATABASE_URL`環境変数が正しく設定されているか確認

### CORSエラー

- `FRONTEND_URL`環境変数が正しく設定されているか確認
- バックエンドのCORS設定を確認

### 認証エラー

- Google OAuth設定のリダイレクトURIが本番環境のURLと一致しているか確認
- `GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`が正しく設定されているか確認

## 6. 継続的デプロイの設定（オプション）

### RailwayでのGitHub連携

1. Railwayダッシュボードで「GitHub」を選択
2. リポジトリを選択
3. ブランチを選択（通常は`main`または`master`）
4. 自動デプロイが有効になります

### VercelでのGitHub連携

1. Vercelダッシュボードで「Add New Project」を選択
2. GitHubリポジトリを選択
3. プロジェクト設定を確認
4. 自動デプロイが有効になります

