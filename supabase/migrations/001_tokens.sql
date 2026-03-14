-- tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  ticker        text NOT NULL,
  mint_address  text,
  type          text NOT NULL DEFAULT 'token',  -- 'token' | 'banner'
  logo_url      text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- token banners
CREATE TABLE IF NOT EXISTS token_banners (
  token_id      uuid PRIMARY KEY REFERENCES tokens(id) ON DELETE CASCADE,
  bg_style      text,           -- CSS gradient string
  tag_text      text,
  tag_color     text,
  copy          text,
  cta_text      text,
  cta_url       text,
  logo_color    text,
  logo_text_color text,
  circle1       jsonb,          -- {color, top, right, bottom, left, size}
  circle2       jsonb
);

-- token links
CREATE TABLE IF NOT EXISTS token_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id   uuid REFERENCES tokens(id) ON DELETE CASCADE,
  platform   text NOT NULL,    -- 'pumpfun' | 'dexscreener' | 'x' | 'website'
  url        text NOT NULL
);

-- community links
CREATE TABLE IF NOT EXISTS community_links (
  platform   text PRIMARY KEY,  -- 'x' | 'discord' | 'telegram'
  url        text,
  is_active  boolean DEFAULT true
);

-- Seed: community links
INSERT INTO community_links (platform, url) VALUES
  ('x', 'https://x.com/035HP_'),
  ('discord', 'https://discord.gg/035hp'),
  ('telegram', 'https://t.me/035hp')
ON CONFLICT (platform) DO NOTHING;

-- Seed: tokens (the 16 eligible tokens + banners)
INSERT INTO tokens (name, ticker, mint_address, type, sort_order) VALUES
  ('OSUNEN',    '$OSUNEN',    NULL, 'token', 1),
  ('MAMBO',     '$MAMBO',     NULL, 'token', 2),
  ('GARYU',     '$GARYU',     NULL, 'token', 3),
  ('NAMENEKO',  '$NAMENEKO',  NULL, 'token', 4),
  ('INMU',      '$INMU',      NULL, 'token', 5),
  ('MISAKA',    '$MISAKA',    NULL, 'token', 6),
  ('YOP',       '$YOP',       NULL, 'token', 7),
  ('SHIRO',     '$SHIRO',     NULL, 'token', 8),
  ('ZOSS',      '$ZOSS',      NULL, 'token', 9),
  ('TSUKY',     '$TSUKY',     NULL, 'token', 10),
  ('ANIMAL',    '$ANIMAL',    NULL, 'token', 11),
  ('VT',        '$VT',        NULL, 'token', 12),
  ('OMOTENASHI','$OMOTENASHI',NULL, 'token', 13),
  ('Zreal',     '$Zreal',     NULL, 'token', 14),
  ('81041',     '$81041',     NULL, 'token', 15),
  ('SOLMYOJIN', '$SOLMYOJIN', NULL, 'token', 16)
ON CONFLICT DO NOTHING;

-- Seed: banner tokens
INSERT INTO tokens (name, ticker, mint_address, type, sort_order) VALUES
  ('YOP Banner',   '$YOP',   NULL, 'banner', 4),
  ('SHIRO Banner', '$SHIRO', NULL, 'banner', 9)
ON CONFLICT DO NOTHING;
