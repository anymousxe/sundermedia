-- Sunder Social Media Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  is_shadowbanned BOOLEAN DEFAULT false,
  username_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  bg_color TEXT DEFAULT '#7c5cff',
  text_color TEXT DEFAULT '#ffffff',
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for priority ordering
CREATE INDEX IF NOT EXISTS idx_roles_priority ON roles(priority DESC);

-- ============================================
-- USER_ROLES JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster post queries
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================
-- LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================
-- FOLLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - USERS
-- ============================================
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for all" ON users;
DROP POLICY IF EXISTS "Enable read for all" ON users;
DROP POLICY IF EXISTS "Enable update for all" ON users;

CREATE POLICY "Enable read for all" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON users FOR UPDATE USING (true);

-- ============================================
-- RLS POLICIES - POSTS
-- ============================================
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (true);

-- ============================================
-- RLS POLICIES - LIKES
-- ============================================
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON likes;

CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unlike posts" ON likes FOR DELETE USING (true);

-- ============================================
-- RLS POLICIES - FOLLOWS
-- ============================================
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Users can follow" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (true);

-- ============================================
-- RLS POLICIES - ROLES
-- ============================================
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON roles;
DROP POLICY IF EXISTS "Roles can be created by anyone" ON roles;
DROP POLICY IF EXISTS "Roles can be updated by anyone" ON roles;
DROP POLICY IF EXISTS "Roles can be deleted by anyone" ON roles;

CREATE POLICY "Roles are viewable by everyone" ON roles FOR SELECT USING (true);
CREATE POLICY "Roles can be created" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Roles can be updated" ON roles FOR UPDATE USING (true);
CREATE POLICY "Roles can be deleted" ON roles FOR DELETE USING (true);

-- ============================================
-- RLS POLICIES - USER_ROLES
-- ============================================
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON user_roles;
DROP POLICY IF EXISTS "User roles can be assigned" ON user_roles;
DROP POLICY IF EXISTS "User roles can be removed" ON user_roles;

CREATE POLICY "User roles are viewable by everyone" ON user_roles FOR SELECT USING (true);
CREATE POLICY "User roles can be assigned" ON user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "User roles can be removed" ON user_roles FOR DELETE USING (true);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- ============================================
-- MIGRATION: Add new columns to existing tables
-- Run this if tables already exist
-- ============================================
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_shadowbanned BOOLEAN DEFAULT false;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;
-- ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[];
