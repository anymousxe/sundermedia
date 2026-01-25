# Backend Notes for Opus 4.5

This document outlines the database changes and backend logic needed to fully support the new Sunder frontend features.

## Database Schema Updates Required

Run these SQL statements in Supabase SQL Editor:

```sql
-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_shadowbanned BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  bg_color TEXT DEFAULT '#7c5cff',
  text_color TEXT DEFAULT '#ffffff',
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Add images column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[];

-- Enable RLS on new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles (admin only for write)
CREATE POLICY "Roles are viewable by everyone" ON roles FOR SELECT USING (true);
CREATE POLICY "Roles can be created by anyone" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Roles can be updated by anyone" ON roles FOR UPDATE USING (true);
CREATE POLICY "Roles can be deleted by anyone" ON roles FOR DELETE USING (true);

-- RLS policies for user_roles
CREATE POLICY "User roles are viewable by everyone" ON user_roles FOR SELECT USING (true);
CREATE POLICY "User roles can be assigned" ON user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "User roles can be removed" ON user_roles FOR DELETE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_priority ON roles(priority DESC);
```

## Backend Logic to Implement

### 1. Username Change Cooldown
- Track `username_changed_at` timestamp
- Frontend checks if 3 days have passed before allowing change
- When username changes, set `username_changed_at` to NOW()

### 2. Shadow Ban Logic
- Shadowbanned users' posts should NOT appear in other users' feeds
- Their posts still appear to themselves
- Modify `getFeedPosts()` to filter out shadowbanned users

### 3. Suspended Accounts
- Suspended users cannot login
- Their profile shows "This account has been suspended"
- They cannot create posts or interact

### 4. Roles System
- Roles have: name, abbreviation, bg_color, text_color, priority
- Users can have multiple roles via `user_roles` table
- Roles are sorted by priority (higher = shows first)
- Only show top 3 roles on posts, with "+X more" link

### 5. Verification
- `is_verified` boolean on users table
- Shows checkmark badge next to name
- Only admins can grant verification

### 6. Image Posts
- Images are stored as base64 or Supabase Storage URLs
- `images` column on posts table is TEXT[] array
- Max 4 images per post

### 7. Admin Detection
- Admin is determined by Firebase email matching `anymousxe.info@gmail.com`
- This is hardcoded for now
- Consider adding `is_admin` flag to users table for future flexibility

## Storage Buckets Needed

If not already created:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);
```

## API Functions to Modify

### supabase.js changes:
1. `getUserByFirebaseUid` - Should also fetch user's roles
2. `getUserByUsername` - Should also fetch user's roles  
3. `createPost` - Accept images array parameter
4. `getFeedPosts` - Filter out shadowbanned users (unless viewing own posts)
5. Add CRUD functions for roles management
6. Add function to assign/remove roles from users

## Security Notes

- Admin email is currently hardcoded - move to database flag
- RLS policies are permissive for development - tighten for production
- Image uploads should have size limits (recommend 5MB max)
- Rate limiting should be added for posts/replies
