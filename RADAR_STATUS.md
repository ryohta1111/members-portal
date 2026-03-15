# CT Radar — 実装ステータス（2026-03-16）

## Phase 1 実装済み

### コンポーネント（src/components/radar/）
| ファイル | 状態 | 内容 |
|---------|------|------|
| RadarIntro.tsx | ✅ | アクセスアニメーション（CSSのみ、SVGレーダー+ターミナルテキスト） |
| EventBanner.tsx | ✅ | イベントバナー + ブロック式カウントダウン（日:時:分:秒） |
| EventTabs.tsx | ✅ | イベント期間タブ切替 |
| KpiGrid.tsx | ✅ | KPI 5枚グリッド（投稿数/リーチ/参加国/ユーザー/順位） |
| PowerScore.tsx | ✅ | CT Power Score + 内訳バー（フォロワー/投稿/いいね/RT/国際リーチ） |
| ContentTabs.tsx | ✅ | コンテンツタブ（アンカースクロール方式） |
| MapView.tsx | ✅ | 拡散マップ（SVGプレースホルダー、D3.js未実装） |
| CountryList.tsx | ✅ | 参加国 TOP6（3カラムグリッド） |
| RankingTable.tsx | ✅ | 影響ランキング（TOP10 + もっと見る展開） |
| UsernameModal.tsx | ✅ | Xユーザー名入力モーダル（@プレフィックス付き） |

### ページ（src/app/radar/）
| ファイル | 状態 | 内容 |
|---------|------|------|
| layout.tsx | ✅ | メタデータ |
| page.tsx | ✅ | メインページ（ゲート→アニメ→ダッシュボード、全セクション表示） |
| radar.css | ✅ | ダークテーマCSS（全クラスr-プレフィックス） |

### API（src/app/api/radar/）
| エンドポイント | 状態 | 内容 |
|-------------|------|------|
| GET /api/radar/events | ✅ | イベント一覧 + アクティブイベント |
| GET /api/radar/summary | ✅ | KPI集計（投稿数/リーチ/参加国/ユーザー） |
| GET /api/radar/map | ✅ | 国別投稿数 |
| GET /api/radar/ranking | ✅ | CT Power Scoreランキング |
| GET /api/radar/me | ✅ | ユーザー情報 + x_id自動リンク |
| POST /api/radar/register | ✅ | Xユーザー名登録 |
| GET /api/cron/radar-collect | ✅ | X APIバッチ収集（ページネーション、7日/1時間切替） |

### Supabaseテーブル（raajibdwoarwjloqurky）
| テーブル | 状態 | 内容 |
|---------|------|------|
| events | ✅ | イベント管理（hashtags配列、start_at/end_at） |
| radar_posts | ✅ | X投稿キャッシュ（tweet_id UNIQUE） |
| radar_x_users | ✅ | Xユーザー情報キャッシュ |
| radar_users | ✅ | wallet_address ↔ x_username 紐付け |
| radar_scores | ✅ | CT Power Score（event_id × x_id UNIQUE） |

### 環境変数（Vercel members-portal）
```
NEXT_PUBLIC_RADAR_SUPABASE_URL（設定済み）
NEXT_PUBLIC_RADAR_SUPABASE_ANON_KEY（設定済み）
RADAR_SUPABASE_SERVICE_ROLE_KEY（設定済み）
TWITTER_BEARER_TOKEN（設定済み）
```

---

## Phase 2 残タスク

- [ ] D3.js世界地図（topojson NaturalEarth投影、choropleth）
- [ ] D3.jsネットワーク図（force-directed graph）
- [ ] バズ投稿フィード（実際のツイート内容表示、APIルート追加）
- [ ] X OAuth連携（Sign in with X）
- [ ] Vercel Cronスケジュール設定（vercel.json: "0 * * * *"）
- [ ] admin CTレーダー管理画面（イベントCRUD、手動Cron実行、APIクレジット表示）
- [ ] 枚数別アクセス権（10,000枚/100,000枚）
- [ ] Xユーザー名変更機能（ウォレットチップクリック）

---

## 技術メモ

- CSSクラス: 全て `r-` プレフィックス必須（portal.cssの`.hero`等と衝突するため）
- X API search/recent: 直近7日間のみ取得可能
- X API Pay-Per-Use: $0.005/投稿、クレジット枯渇注意
- Cron初回実行: existingCount < 50 なら7日分、以降1時間分を取得
- 国コード推定: location テキスト → langベースフォールバック（ja→JP, ko→KR等）
- radarSupabase: 遅延初期化必須（ビルド時エラー回避）
- me API: x_username → radar_x_users.username のilike照合でx_idを自動リンク
