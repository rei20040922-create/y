# デプロイ手順

## 最短

`job-news-desk` フォルダの中身を、静的サイトとして公開します。

## Vercel

1. 新しいプロジェクトを作る
2. `job-news-desk` フォルダをアップロード、またはGitHubに置く
3. Framework PresetはOther
4. Build Commandは空
5. Output Directoryは空、またはルート
6. `/api/articles` が無料記事候補の取得に使われます

## Netlify

ドラッグ&ドロップ公開では画面だけ公開できますが、Functionsが動かないため「無料記事を探す」は使えません。

無料記事取得まで使う場合:

1. GitHubに `job-news-desk` の中身を置く
2. Netlifyで `Add new project`
3. `Import an existing project`
4. GitHubリポジトリを選ぶ
5. Build commandは空
6. Publish directoryは `.`
7. Functions directoryは `netlify/functions`
8. 公開後、`/.netlify/functions/articles` が無料記事候補の取得に使われます

## GitHub Pages

1. リポジトリに `job-news-desk` の中身を置く
2. Pagesで公開ブランチを選ぶ
3. `index.html` がルートにある状態で公開

## Cloudflare Pages

1. Pagesでプロジェクトを作る
2. `job-news-desk` の中身をアップロード
3. Build Commandは空
4. Output Directoryは空、またはルート

注意: Cloudflare Pagesで無料記事候補取得を使う場合は、Functions向けに別途API移植が必要です。まずはVercelかNetlifyが簡単です。
