-- Sunder Social Media Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Users table (extends Firebase auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster post queries
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_parent_id ON posts(parent_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Likes table
CREATE TABLE likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Follows table
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (true);

-- RLS Policies for likes
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unlike posts" ON likes FOR DELETE USING (true);

-- RLS Policies for follows
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (true);

-- Enable realtime for posts (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Create storage bucket for profile images (run separately in Storage settings)
-- Or use: INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
