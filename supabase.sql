-- Supabase 마이그레이션 SQL
-- Supabase Dashboard > SQL Editor 에서 실행

-- 1. public_posts 테이블 생성
CREATE TABLE public_posts (
  id BIGINT PRIMARY KEY,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  "weightBefore" INTEGER DEFAULT 30,
  "weightAfter" INTEGER DEFAULT 5,
  "weightDiff" INTEGER DEFAULT 25,
  timestamp BIGINT NOT NULL,
  privacy TEXT DEFAULT 'public',
  "trashType" TEXT DEFAULT '캔',
  reactions JSONB DEFAULT '{}'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Row Level Security
ALTER TABLE public_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read" ON public_posts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert" ON public_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update" ON public_posts
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete" ON public_posts
  FOR DELETE USING (true);

-- 3. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public_posts;
