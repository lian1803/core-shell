-- =============================================
-- PLATFORM MVP - Initial Schema
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE region AS ENUM ('kr', 'us', 'cn', 'jp');
CREATE TYPE user_role AS ENUM ('client', 'marketer');
CREATE TYPE request_status AS ENUM ('open', 'in_progress', 'completed', 'closed');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE specialty AS ENUM ('sns', 'blog', 'place', 'ads');

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        user_role NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  region      region NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketer_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialties     specialty[] NOT NULL DEFAULT '{}',
  experience_years INT,
  bio             TEXT,
  price_range_min INT,
  price_range_max INT,
  rating_avg      DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count    INT NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  region          region NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE portfolios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketer_id     UUID NOT NULL REFERENCES marketer_profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL,
  image_urls      TEXT[],
  result_summary  TEXT,
  client_industry TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  industry       TEXT NOT NULL,
  marketing_type TEXT NOT NULL,
  budget_min     INT,
  budget_max     INT,
  description    TEXT NOT NULL,
  status         request_status NOT NULL DEFAULT 'open',
  proposal_count INT NOT NULL DEFAULT 0,
  region         region NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days')
);

CREATE TABLE proposals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id   UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  marketer_id  UUID NOT NULL REFERENCES marketer_profiles(id) ON DELETE CASCADE,
  price        INT NOT NULL,
  duration_days INT,
  content      TEXT NOT NULL,
  portfolio_ids UUID[],
  status       proposal_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, marketer_id)  -- 중복 제안 방지
);

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marketer_id UUID NOT NULL REFERENCES marketer_profiles(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id)  -- 의뢰당 후기 1개
);

CREATE TABLE event_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name  TEXT NOT NULL,
  event_data  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own"  ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own"  ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"  ON users FOR UPDATE USING (auth.uid() = id);

-- marketer_profiles (같은 region만 조회)
CREATE POLICY "mp_select_same_region" ON marketer_profiles FOR SELECT USING (
  region = (SELECT region FROM users WHERE id = auth.uid())
);
CREATE POLICY "mp_insert_own" ON marketer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mp_update_own" ON marketer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mp_delete_own" ON marketer_profiles FOR DELETE USING (auth.uid() = user_id);

-- portfolios (마케터 region 기준)
CREATE POLICY "portfolios_select_same_region" ON portfolios FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM marketer_profiles mp
    WHERE mp.id = portfolios.marketer_id
      AND mp.region = (SELECT region FROM users WHERE id = auth.uid())
  )
);
CREATE POLICY "portfolios_insert_own" ON portfolios FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM marketer_profiles WHERE id = marketer_id AND user_id = auth.uid())
);
CREATE POLICY "portfolios_update_own" ON portfolios FOR UPDATE USING (
  EXISTS (SELECT 1 FROM marketer_profiles WHERE id = marketer_id AND user_id = auth.uid())
);
CREATE POLICY "portfolios_delete_own" ON portfolios FOR DELETE USING (
  EXISTS (SELECT 1 FROM marketer_profiles WHERE id = marketer_id AND user_id = auth.uid())
);

-- requests (같은 region + open, 또는 본인)
CREATE POLICY "requests_select" ON requests FOR SELECT USING (
  (status = 'open' AND region = (SELECT region FROM users WHERE id = auth.uid()))
  OR client_id = auth.uid()
);
CREATE POLICY "requests_insert_own" ON requests FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "requests_update_own" ON requests FOR UPDATE USING (client_id = auth.uid());

-- proposals (의뢰 주인 + 해당 마케터만)
CREATE POLICY "proposals_select_authorized" ON proposals FOR SELECT USING (
  EXISTS (SELECT 1 FROM requests WHERE id = request_id AND client_id = auth.uid())
  OR EXISTS (SELECT 1 FROM marketer_profiles WHERE id = marketer_id AND user_id = auth.uid())
);
CREATE POLICY "proposals_insert_own" ON proposals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM marketer_profiles WHERE id = marketer_id AND user_id = auth.uid())
);
CREATE POLICY "proposals_update_authorized" ON proposals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM requests WHERE id = request_id AND client_id = auth.uid())
  OR EXISTS (SELECT 1 FROM marketer_profiles WHERE id = marketer_id AND user_id = auth.uid())
);

-- reviews (같은 region 조회, client만 작성)
CREATE POLICY "reviews_select_same_region" ON reviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM marketer_profiles mp
    WHERE mp.id = reviews.marketer_id
      AND mp.region = (SELECT region FROM users WHERE id = auth.uid())
  )
);
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT WITH CHECK (client_id = auth.uid());

-- event_logs (본인만 write, read 불가)
CREATE POLICY "event_logs_insert_own" ON event_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- 후기 등록 시 rating_avg, review_count 재계산
CREATE OR REPLACE FUNCTION update_marketer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketer_profiles SET
    rating_avg   = (SELECT COALESCE(AVG(rating::DECIMAL), 0) FROM reviews WHERE marketer_id = NEW.marketer_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE marketer_id = NEW.marketer_id)
  WHERE id = NEW.marketer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_marketer_rating
  AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_marketer_rating();

-- 제안 등록 시 proposal_count 증가
CREATE OR REPLACE FUNCTION increment_proposal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE requests SET proposal_count = proposal_count + 1 WHERE id = NEW.request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_proposal_count
  AFTER INSERT ON proposals FOR EACH ROW EXECUTE FUNCTION increment_proposal_count();

-- 제안 수락 시: 나머지 제안 자동 거절 + 의뢰 상태 변경
CREATE OR REPLACE FUNCTION handle_proposal_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE proposals SET status = 'rejected'
    WHERE request_id = NEW.request_id AND id != NEW.id AND status = 'pending';

    UPDATE requests SET status = 'in_progress' WHERE id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_handle_proposal_accepted
  AFTER UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION handle_proposal_accepted();

-- =============================================
-- STORAGE BUCKETS
-- (Supabase Dashboard > Storage에서 생성하거나 아래 SQL 실행)
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolios', 'portfolios', true) ON CONFLICT DO NOTHING;

-- Storage RLS
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "portfolios_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'portfolios');
CREATE POLICY "portfolios_auth_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]
);
