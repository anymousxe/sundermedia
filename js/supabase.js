// Supabase client and database operations
import { config } from './config.js';

// Import Supabase from CDN
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
let supabase;
try {
    if (!config.supabase.url || config.supabase.url.includes("YOUR_SUPABASE_URL")) {
        console.warn("Supabase URL is missing or using placeholder. Database features will be disabled.");
    } else {
        supabase = createClient(config.supabase.url, config.supabase.anonKey);
    }
} catch (e) {
    console.error("Failed to initialize Supabase:", e);
}

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get user by Firebase UID
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByFirebaseUid(firebaseUid) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user:', error);
    }
    return data;
}

/**
 * Get user by username
 * @param {string} username - Username to lookup
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByUsername(username) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user by username:', error);
    }
    return data;
}

/**
 * Get user by ID
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserById(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user by ID:', error);
    }
    return data;
}

/**
 * Check if username is available
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if available
 */
export async function isUsernameAvailable(username) {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

    if (error && error.code === 'PGRST116') {
        return true; // No user found, username is available
    }
    return !data;
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData) {
    const { data, error } = await supabase
        .from('users')
        .insert({
            firebase_uid: userData.firebaseUid,
            username: userData.username.toLowerCase(),
            display_name: userData.displayName || userData.username,
            avatar_url: userData.avatarUrl || null,
            bio: ''
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating user:', error.message, error.details, error.hint);
        alert('Table Error: ' + error.message);
        throw error;
    }
    return data;
}

/**
 * Update user profile
 * @param {string} userId - User UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserProfile(userId, updates) {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error);
        throw error;
    }
    return data;
}

/**
 * Search users by username or display name
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Matching users
 */
export async function searchUsers(query, limit = 10) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit);

    if (error) {
        console.error('Error searching users:', error);
        return [];
    }
    return data || [];
}

/**
 * Get all users (for admin panel)
 * @returns {Promise<Array>} All users
 */
export async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
    return data || [];
}


// ============================================
// POST OPERATIONS
// ============================================

/**
 * Create a new post
 * @param {string} userId - User UUID
 * @param {string} content - Post content
 * @param {string|null} parentId - Parent post ID for replies
 * @returns {Promise<Object>} Created post
 */
export async function createPost(userId, content, parentId = null) {
    const { data, error } = await supabase
        .from('posts')
        .insert({
            user_id: userId,
            content: content,
            parent_id: parentId
        })
        .select(`
      *,
      user:users(id, username, display_name, avatar_url)
    `)
        .single();

    if (error) {
        console.error('Error creating post:', error);
        throw error;
    }
    return data;
}

/**
 * Get posts for feed (with user info and like counts)
 * @param {number} limit - Number of posts to fetch
 * @param {string|null} beforeId - For pagination
 * @returns {Promise<Array>} Posts array
 */
export async function getFeedPosts(limit = 20, beforeId = null) {
    let query = supabase
        .from('posts')
        .select(`
      *,
      user:users(id, username, display_name, avatar_url),
      likes(user_id),
      replies:posts(id)
    `)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (beforeId) {
        const { data: beforePost } = await supabase
            .from('posts')
            .select('created_at')
            .eq('id', beforeId)
            .single();

        if (beforePost) {
            query = query.lt('created_at', beforePost.created_at);
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
    return data || [];
}

/**
 * Get posts by a specific user
 * @param {string} userId - User UUID
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Posts array
 */
export async function getUserPosts(userId, limit = 20) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      user:users(id, username, display_name, avatar_url),
      likes(user_id),
      replies:posts(id)
    `)
        .eq('user_id', userId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching user posts:', error);
        return [];
    }
    return data || [];
}

/**
 * Get replies to a post
 * @param {string} postId - Parent post ID
 * @returns {Promise<Array>} Replies array
 */
export async function getPostReplies(postId) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      user:users(id, username, display_name, avatar_url),
      likes(user_id)
    `)
        .eq('parent_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching replies:', error);
        return [];
    }
    return data || [];
}

/**
 * Delete a post
 * @param {string} postId - Post ID to delete
 */
export async function deletePost(postId) {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

    if (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
}

// ============================================
// LIKE OPERATIONS
// ============================================

/**
 * Like a post
 * @param {string} userId - User UUID
 * @param {string} postId - Post ID
 */
export async function likePost(userId, postId) {
    const { error } = await supabase
        .from('likes')
        .insert({ user_id: userId, post_id: postId });

    if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Error liking post:', error);
        throw error;
    }
}

/**
 * Unlike a post
 * @param {string} userId - User UUID
 * @param {string} postId - Post ID
 */
export async function unlikePost(userId, postId) {
    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

    if (error) {
        console.error('Error unliking post:', error);
        throw error;
    }
}

/**
 * Check if user has liked a post
 * @param {string} userId - User UUID
 * @param {string} postId - Post ID
 * @returns {Promise<boolean>}
 */
export async function hasUserLikedPost(userId, postId) {
    const { data } = await supabase
        .from('likes')
        .select('user_id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

    return !!data;
}

// ============================================
// FOLLOW OPERATIONS
// ============================================

/**
 * Follow a user
 * @param {string} followerId - Follower's user UUID
 * @param {string} followingId - User to follow UUID
 */
export async function followUser(followerId, followingId) {
    const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });

    if (error && error.code !== '23505') {
        console.error('Error following user:', error);
        throw error;
    }
}

/**
 * Unfollow a user
 * @param {string} followerId - Follower's user UUID
 * @param {string} followingId - User to unfollow UUID
 */
export async function unfollowUser(followerId, followingId) {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    if (error) {
        console.error('Error unfollowing user:', error);
        throw error;
    }
}

/**
 * Check if user is following another user
 * @param {string} followerId - Follower's user UUID
 * @param {string} followingId - Target user UUID
 * @returns {Promise<boolean>}
 */
export async function isFollowing(followerId, followingId) {
    const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    return !!data;
}

/**
 * Get follower count
 * @param {string} userId - User UUID
 * @returns {Promise<number>}
 */
export async function getFollowerCount(userId) {
    const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    return count || 0;
}

/**
 * Get following count
 * @param {string} userId - User UUID
 * @returns {Promise<number>}
 */
export async function getFollowingCount(userId) {
    const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    return count || 0;
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to new posts
 * @param {Function} callback - Called when new post is created
 * @returns {Object} Subscription object with unsubscribe method
 */
export function subscribeToNewPosts(callback) {
    const subscription = supabase
        .channel('public:posts')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'posts' },
            (payload) => {
                if (!payload.new.parent_id) { // Only notify for top-level posts
                    callback(payload.new);
                }
            }
        )
        .subscribe();

    return subscription;
}

/**
 * Unsubscribe from a channel
 * @param {Object} subscription - Subscription to unsubscribe from
 */
export function unsubscribe(subscription) {
    if (subscription) {
        supabase.removeChannel(subscription);
    }
}

// ============================================
// FILE UPLOADS
// ============================================

/**
 * Upload avatar image
 * @param {string} userId - User UUID
 * @param {File} file - Image file
 * @returns {Promise<string>} Public URL
 */
export async function uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    return data.publicUrl;
}

/**
 * Upload banner image
 * @param {string} userId - User UUID
 * @param {File} file - Image file
 * @returns {Promise<string>} Public URL
 */
export async function uploadBanner(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading banner:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

    return data.publicUrl;
}

export { supabase };
