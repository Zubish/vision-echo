CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  full_name text,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  kyc_status text NOT NULL DEFAULT 'not_started',
  reporter_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyc_submissions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  location text NOT NULL,
  beat text NOT NULL,
  experience text NOT NULL,
  id_type text NOT NULL,
  id_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_applications (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  note text NOT NULL,
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  body text NOT NULL,
  category_slug text NOT NULL,
  location_name text NOT NULL,
  state text NOT NULL,
  latitude double precision,
  longitude double precision,
  source_type text NOT NULL,
  author_id text REFERENCES users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  reporter_id text REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_review',
  live boolean NOT NULL DEFAULT true,
  priority text NOT NULL DEFAULT 'normal',
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_category_idx ON reports(category_slug);
CREATE INDEX IF NOT EXISTS reports_created_idx ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS kyc_user_idx ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS role_applications_user_idx ON role_applications(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (lower(email));
