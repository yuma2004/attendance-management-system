# 環境変数セットアップガイド

このドキュメントでは、出退勤管理システムの環境変数設定方法を詳細に説明します。

## 目次

0. [Railway クイックスタート（推奨）](#0-railway-クイックスタート推奨)
1. [PostgreSQLデータベースの設定](#1-postgresqlデータベースの設定)
2. [Google OAuth認証の設定](#2-google-oauth認証の設定)
3. [秘密鍵の生成](#3-秘密鍵の生成)
4. [環境変数ファイルの作成](#4-環境変数ファイルの作成)
5. [動作確認](#5-動作確認)

---

## 0. Railway クイックスタート（推奨）

本番を見据えた最短構成として、バックエンドとPostgreSQLをRailwayで動かします。

```bash
# 事前準備
npm i -g @railway/cli

# 初期化（backend ディレクトリで）
cd backend
railway init

# PostgreSQL 追加（DATABASE_URL が自動で設定されます）
railway add postgresql

# 必須の環境変数
railway variables set SESSION_SECRET="<random-hex-32>"
railway variables set JWT_SECRET="<random-hex-32>"
railway variables set NODE_ENV="production"

# Google 認証 + フロントエンド連携（必要に応じて）
railway variables set GOOGLE_CLIENT_ID="<your-google-client-id>"
railway variables set GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
railway variables set GOOGLE_CALLBACK_URL="https://<your-backend>.railway.app/api/auth/google/callback"
railway variables set FRONTEND_URL="https://<your-frontend>.vercel.app"

# デプロイ
railway up

# 本番DBへマイグレーション適用
railway run pnpm prisma migrate deploy
```

ローカル開発では `.env` を用い、Railway 本番では Railway の変数を使用します。

---

## 1. PostgreSQLデータベースの設定

### 方法A: ローカルPostgreSQLを使用する場合

#### 1-1. PostgreSQLのインストール

**Windowsの場合:**
1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からインストーラーをダウンロード
2. インストール時に以下を設定：
   - **ユーザー名**: `postgres`（デフォルト）
   - **パスワード**: 覚えておく必要がある（後で使用）
   - **ポート**: `5432`（デフォルト）

#### 1-2. データベースの作成

PostgreSQLがインストールされたら、コマンドプロンプトまたはPgAdminを使用してデータベースを作成します。

**コマンドラインの場合:**
```bash
# PostgreSQLにログイン
psql -U postgres

# データベースを作成
CREATE DATABASE attendance_db;

# 確認（オプション）
\l

# 終了
\q
```

**PgAdminを使用する場合:**
1. PgAdminを起動
2. サーバー（PostgreSQL）を右クリック → 「データベースを作成」
3. データベース名: `attendance_db`
4. 「保存」をクリック

#### 1-3. DATABASE_URLの設定

`DATABASE_URL`は以下の形式で設定します：

```
postgresql://[ユーザー名]:[パスワード]@[ホスト]:[ポート]/[データベース名]
```

**例（ローカル環境）:**
```
postgresql://postgres:yourpassword@localhost:5432/attendance_db
```

- `postgres`: ユーザー名
- `yourpassword`: インストール時に設定したパスワード
- `localhost`: ホスト名（ローカルの場合）
- `5432`: ポート番号（デフォルト）
- `attendance_db`: データベース名

### 方法B: RailwayのPostgreSQLを使用する場合

1. [Railway](https://railway.app/)にアカウント作成・ログイン
2. 「New Project」をクリック
3. 「Add Service」→「Database」→「PostgreSQL」を選択
4. データベースが作成されたら、「Variables」タブで`DATABASE_URL`をコピー

**RailwayのDATABASE_URL例:**
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

---

## 2. Google OAuth認証の設定

### 2-1. Google Cloud Consoleでの設定手順

#### ステップ1: プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. Googleアカウントでログイン（まだアカウントがない場合は作成）
3. 画面上部の「プロジェクトを選択」をクリック
4. 「新しいプロジェクト」をクリック
5. プロジェクト名を入力（例: `出退勤管理システム`）
6. 「作成」をクリック
7. 作成されたプロジェクトを選択

#### ステップ2: OAuth同意画面の設定

1. 左メニューから「APIとサービス」→「OAuth同意画面」を選択
2. ユーザータイプを選択：
   - **外部**: 一般ユーザーが使用する場合は「外部」を選択
   - **内部**: Google Workspace内でのみ使用する場合は「内部」を選択
3. 「作成」をクリック
4. アプリ情報を入力：
   - **アプリ名**: 出退勤管理システム
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **アプリのロゴ**: （オプション）任意のロゴ画像
   - **アプリのホームページ**: `http://localhost:5173`（開発環境）
   - **アプリのプライバシーポリシーリンク**: （オプション）
   - **アプリの利用規約リンク**: （オプション）
   - **承認済みのドメイン**: （外部の場合のみ必要）
5. 「保存して次へ」をクリック
6. スコープ設定（デフォルトのままでもOK）:
   - 「スコープを追加または削除」はスキップ可能
   - デフォルトの`userinfo.email`と`userinfo.profile`で十分
7. 「保存して次へ」をクリック
8. テストユーザー（外部の場合）:
   - 開発中に使用するGoogleアカウントを追加
   - 後で本番環境に移行する際に削除可能
9. 「保存して次へ」→「ダッシュボードに戻る」

#### ステップ3: OAuth 2.0クライアントIDの作成

1. 左メニューから「APIとサービス」→「認証情報」を選択
2. 画面上部の「認証情報を作成」をクリック
3. 「OAuth 2.0 クライアントID」を選択
4. 「アプリケーションの種類」で「ウェブアプリケーション」を選択
5. 名前を入力（例: `出退勤管理システム - 開発環境`）
6. **承認済みのリダイレクトURI**に以下を追加：
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. 「作成」をクリック
8. **クライアントID**と**クライアントシークレット**が表示されます：
   - これらをコピーして保存してください
   - **重要**: クライアントシークレットは一度しか表示されません

#### ステップ4: 認証情報の保存

表示された認証情報をメモ帳などに保存してください：

- **GOOGLE_CLIENT_ID**: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
- **GOOGLE_CLIENT_SECRET**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`

### 2-2. 本番環境用の設定（将来的に）

本番環境にデプロイする際は、以下の手順を追加で実行します：

1. Google Cloud Consoleで新しいOAuth 2.0クライアントIDを作成
2. 承認済みのリダイレクトURIに本番環境のURLを追加：
   ```
   https://your-backend-domain.railway.app/api/auth/google/callback
   ```
3. 環境変数に本番用のクライアントIDとシークレットを設定

---

## 3. 秘密鍵の生成

`SESSION_SECRET`と`JWT_SECRET`にはランダムな文字列を設定する必要があります。以下の方法で生成できます：

### 方法A: OpenSSLを使用（推奨）

```bash
# SESSION_SECRETの生成（32文字の16進数文字列）
openssl rand -hex 32

# JWT_SECRETの生成（32文字の16進数文字列）
openssl rand -hex 32
```

**出力例:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 方法B: Node.jsを使用

```bash
# Node.jsのREPLで実行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 方法C: オンラインツールを使用

1. [Random.org](https://www.random.org/strings/)などのランダム文字列生成サイトを利用
2. 32文字以上のランダムな文字列を生成
3. 複数生成して、それぞれを`SESSION_SECRET`と`JWT_SECRET`に使用

### 方法D: PowerShellを使用（Windows）

```powershell
# SESSION_SECRETの生成
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# または、より安全な方法
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**重要:**
- これらの秘密鍵は**絶対に他人に知られてはいけません**
- GitHubなどにコミットしないでください（.gitignoreに含まれています）
- 本番環境では、より長く複雑な文字列を使用してください

---

## 4. 環境変数ファイルの作成

### 4-1. バックエンド環境変数ファイル（backend/.env）

プロジェクトルートの`backend`フォルダに`.env`ファイルを作成します。

**ファイルパス:** `backend/.env`

**内容:**
```env
# データベース接続URL
# ローカルの場合: postgresql://postgres:yourpassword@localhost:5432/attendance_db
# Railwayの場合: RailwayのダッシュボードからコピーしたURL
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/attendance_db"

# セッション用の秘密鍵（ランダムな文字列）
SESSION_SECRET="your-generated-session-secret-here"

# Google OAuth認証情報
GOOGLE_CLIENT_ID="your-google-client-id-from-google-cloud-console"
GOOGLE_CLIENT_SECRET="your-google-client-secret-from-google-cloud-console"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"

# JWT用の秘密鍵（ランダムな文字列）
JWT_SECRET="your-generated-jwt-secret-here"

# 環境設定
NODE_ENV="development"

# サーバーポート
PORT=5000

# フロントエンドのURL
FRONTEND_URL="http://localhost:5173"
```

### 4-2. フロントエンド環境変数ファイル（frontend/.env）

プロジェクトルートの`frontend`フォルダに`.env`ファイルを作成します。

**ファイルパス:** `frontend/.env`

**内容:**
```env
# バックエンドAPIのURL
VITE_API_URL=http://localhost:5000/api

# Google OAuth クライアントID（バックエンドと同じ値）
VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-google-cloud-console
```

**重要:**
- フロントエンドの環境変数は`VITE_`で始まる必要があります（Viteの仕様）
- `GOOGLE_CLIENT_ID`はフロントエンドでも使用するため、同じ値を設定します
- 本番（Railway）では `.env` ではなく Railway 側の環境変数に設定してください

### 4-3. ファイル作成の確認方法

以下のコマンドでファイルが正しく作成されたか確認できます：

```bash
# バックエンドの.envファイルを確認（内容は表示されない）
ls backend/.env

# フロントエンドの.envファイルを確認
ls frontend/.env
```

**注意:** `.env`ファイルは`.gitignore`に含まれているため、Gitにはコミットされません。

---

## 5. 動作確認

### 5-1. 環境変数の読み込み確認

環境変数が正しく読み込まれているか確認するには、一時的に以下のコードを追加してログ出力を確認できます（**開発環境のみ**）：

**バックエンドの場合（backend/src/app.ts）:**
```typescript
console.log('Environment check:', {
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasSessionSecret: !!process.env.SESSION_SECRET,
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  port: process.env.PORT,
  frontendUrl: process.env.FRONTEND_URL,
});
```

**注意:** 本番環境では環境変数の内容をログに出力しないでください。

### 5-2. データベース接続の確認

Prismaマイグレーションを実行して、データベース接続を確認します：

```bash
cd backend
npx --yes pnpm@8 prisma migrate dev
```

エラーが発生した場合は、`DATABASE_URL`が正しいか確認してください。

### 5-3. Google認証の確認

1. 開発サーバーを起動：
   ```bash
   npx --yes pnpm@8 dev
   ```
2. ブラウザで `http://localhost:5173` にアクセス
3. ログインページでGoogle認証を試す
4. 認証が正常に動作するか確認

---

## トラブルシューティング

### 問題1: DATABASE_URL接続エラー

**エラーメッセージ例:**
```
Error: Can't reach database server
```

**解決方法:**
- PostgreSQLが起動しているか確認
- `DATABASE_URL`の形式が正しいか確認（特にパスワードに特殊文字がある場合はエスケープ）
- ファイアウォールがポート5432をブロックしていないか確認

### 問題2: Google OAuth認証エラー

**エラーメッセージ例:**
```
Error 400: redirect_uri_mismatch
```

**解決方法:**
- Google Cloud Consoleの「承認済みのリダイレクトURI」に`http://localhost:5000/api/auth/google/callback`が追加されているか確認
- `GOOGLE_CALLBACK_URL`が正しく設定されているか確認

### 問題3: 環境変数が読み込まれない

**解決方法:**
- `.env`ファイルが正しい場所（`backend/`と`frontend/`フォルダ）にあるか確認
- `.env`ファイルの構文エラーがないか確認（値に引用符が必要な場合は忘れずに）
- サーバーを再起動して環境変数を再読み込み

### 問題4: 秘密鍵の長さが不足している

**解決方法:**
- `SESSION_SECRET`と`JWT_SECRET`は最低32文字以上を推奨
- より長いランダム文字列を生成して設定

---

## セキュリティに関する注意事項

1. **`.env`ファイルは絶対にGitにコミットしない**
   - `.gitignore`に含まれていますが、念のため確認してください

2. **本番環境ではより強固な秘密鍵を使用**
   - 開発環境より長く複雑な文字列を使用してください

3. **Google OAuthシークレットの保護**
   - クライアントシークレットは他人に知られないようにしてください

4. **環境変数の定期確認**
   - 定期的に環境変数が正しく設定されているか確認してください

---

## 次のステップ

環境変数の設定が完了したら、以下を実行してください：

1. データベースマイグレーションの実行
2. 開発サーバーの起動
3. 動作確認

詳細は`README.md`の「セットアップ」セクションを参照してください。
