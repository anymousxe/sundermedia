// Sunder - Main Application
import {
    signInWithGoogle,
    logout,
    onAuthChange,
    getCurrentUser,
    getCurrentUserId
} from './firebase.js';

import {
    getUserByFirebaseUid,
    getUserByUsername,
    getUserById,
    isUsernameAvailable,
    createUser,
    updateUserProfile,
    createPost,
    getFeedPosts,
    getUserPosts,
    getPostReplies,
    likePost,
    unlikePost,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowerCount,
    getFollowingCount,
    subscribeToNewPosts,
    unsubscribe,
    uploadAvatar,
    uploadBanner
} from './supabase.js';

// ============================================
// STATE
// ============================================
let currentProfile = null; // Supabase user profile
let currentView = 'home';
let viewingProfile = null; // Profile being viewed (could be other user)
let newPostsSubscription = null;
let pendingNewPosts = [];
let replyingToPost = null;

// ============================================
// DOM ELEMENTS
// ============================================
const screens = {
    login: document.getElementById('login-screen'),
    username: document.getElementById('username-screen'),
    main: document.getElementById('main-screen')
};

const elements = {
    // Login
    googleSignInBtn: document.getElementById('google-signin-btn'),

    // Username
    usernameInput: document.getElementById('username-input'),
    usernameError: document.getElementById('username-error'),
    usernameSuccess: document.getElementById('username-success'),
    usernameSubmitBtn: document.getElementById('username-submit-btn'),

    // Navigation
    navHome: document.getElementById('nav-home'),
    navProfile: document.getElementById('nav-profile'),
    navLogout: document.getElementById('nav-logout'),

    // Views
    homeView: document.getElementById('home-view'),
    profileView: document.getElementById('profile-view'),

    // New Posts
    newPostsBanner: document.getElementById('new-posts-banner'),
    loadNewPostsBtn: document.getElementById('load-new-posts-btn'),

    // Post Composer
    postContent: document.getElementById('post-content'),
    postSubmitBtn: document.getElementById('post-submit-btn'),
    postsFeed: document.getElementById('posts-feed'),

    // Profile
    profileBanner: document.getElementById('profile-banner'),
    profileAvatar: document.getElementById('profile-avatar'),
    profileDisplayName: document.getElementById('profile-display-name'),
    profileUsername: document.getElementById('profile-username'),
    profileBio: document.getElementById('profile-bio'),
    followersCount: document.getElementById('followers-count'),
    followingCount: document.getElementById('following-count'),
    profilePosts: document.getElementById('profile-posts'),
    editBannerBtn: document.getElementById('edit-banner-btn'),
    editAvatarBtn: document.getElementById('edit-avatar-btn'),
    editBioBtn: document.getElementById('edit-bio-btn'),
    followBtn: document.getElementById('follow-btn'),
    bannerInput: document.getElementById('banner-input'),
    avatarInput: document.getElementById('avatar-input'),

    // Bio Modal
    bioModal: document.getElementById('bio-modal'),
    bioInput: document.getElementById('bio-input'),
    bioCancelBtn: document.getElementById('bio-cancel-btn'),
    bioSaveBtn: document.getElementById('bio-save-btn'),

    // Reply Modal
    replyModal: document.getElementById('reply-modal'),
    replyOriginalPost: document.getElementById('reply-original-post'),
    replyContent: document.getElementById('reply-content'),
    replyCancelBtn: document.getElementById('reply-cancel-btn'),
    replySubmitBtn: document.getElementById('reply-submit-btn')
};

// ============================================
// SCREEN MANAGEMENT
// ============================================
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

function showView(viewName) {
    currentView = viewName;
    elements.homeView.classList.add('hidden');
    elements.profileView.classList.add('hidden');

    elements.navHome.classList.remove('active');
    elements.navProfile.classList.remove('active');

    if (viewName === 'home') {
        elements.homeView.classList.remove('hidden');
        elements.navHome.classList.add('active');
    } else if (viewName === 'profile') {
        elements.profileView.classList.remove('hidden');
        elements.navProfile.classList.add('active');
    }
}

// ============================================
// AUTHENTICATION FLOW
// ============================================
async function handleAuthStateChange(firebaseUser) {
    if (!firebaseUser) {
        // Not logged in
        showScreen('login');
        currentProfile = null;
        if (newPostsSubscription) {
            unsubscribe(newPostsSubscription);
            newPostsSubscription = null;
        }
        return;
    }

    // Check if user has a profile in Supabase
    const profile = await getUserByFirebaseUid(firebaseUser.uid);

    if (!profile) {
        // New user, needs to set username
        showScreen('username');
        return;
    }

    // Existing user, go to main app
    currentProfile = profile;
    showScreen('main');
    showView('home');
    await loadFeed();
    setupRealtimeSubscription();
}

// ============================================
// USERNAME SELECTION
// ============================================
let usernameCheckTimeout = null;

async function checkUsername(username) {
    elements.usernameError.classList.add('hidden');
    elements.usernameSuccess.classList.add('hidden');
    elements.usernameSubmitBtn.disabled = true;

    if (!username || username.length < 3) {
        elements.usernameError.textContent = 'Username must be at least 3 characters';
        elements.usernameError.classList.remove('hidden');
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        elements.usernameError.textContent = 'Only letters, numbers, and underscores allowed';
        elements.usernameError.classList.remove('hidden');
        return;
    }

    // Check availability
    const available = await isUsernameAvailable(username);

    if (available) {
        elements.usernameSuccess.classList.remove('hidden');
        elements.usernameSubmitBtn.disabled = false;
    } else {
        elements.usernameError.textContent = 'Username is already taken';
        elements.usernameError.classList.remove('hidden');
    }
}

async function submitUsername() {
    const username = elements.usernameInput.value.trim();
    const firebaseUser = getCurrentUser();

    if (!username || !firebaseUser) return;

    elements.usernameSubmitBtn.disabled = true;
    elements.usernameSubmitBtn.textContent = 'Creating account...';

    try {
        const profile = await createUser({
            firebaseUid: firebaseUser.uid,
            username: username,
            displayName: firebaseUser.displayName || username,
            avatarUrl: firebaseUser.photoURL
        });

        currentProfile = profile;
        showScreen('main');
        showView('home');
        await loadFeed();
        setupRealtimeSubscription();
    } catch (error) {
        elements.usernameError.textContent = 'Error creating account. Please try again.';
        elements.usernameError.classList.remove('hidden');
        elements.usernameSubmitBtn.disabled = false;
        elements.usernameSubmitBtn.textContent = 'Continue';
    }
}

// ============================================
// POSTS & FEED
// ============================================
async function loadFeed() {
    elements.postsFeed.innerHTML = '<div class="loading">Loading posts...</div>';
    const posts = await getFeedPosts(20);
    renderPosts(posts, elements.postsFeed);
}

async function loadUserPosts(userId) {
    elements.profilePosts.innerHTML = '<div class="loading">Loading posts...</div>';
    const posts = await getUserPosts(userId, 20);
    renderPosts(posts, elements.profilePosts);
}

function renderPosts(posts, container) {
    if (posts.length === 0) {
        container.innerHTML = '<div class="loading">No posts yet</div>';
        return;
    }

    container.innerHTML = posts.map(post => renderPost(post)).join('');
    attachPostEventListeners(container);
}

function renderPost(post, isReply = false) {
    const user = post.user;
    const likeCount = post.likes?.length || 0;
    const replyCount = post.replies?.length || 0;
    const hasLiked = currentProfile && post.likes?.some(like => like.user_id === currentProfile.id);
    const timeAgo = getTimeAgo(new Date(post.created_at));

    return `
    <div class="post ${isReply ? 'reply' : ''}" data-post-id="${post.id}">
      <div class="post-header">
        <img 
          src="${user?.avatar_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/></svg>'}" 
          alt="${user?.display_name}" 
          class="post-avatar"
        >
        <div class="post-user-info">
          <span class="post-display-name" data-username="${user?.username}">${user?.display_name || 'Unknown'}</span>
          <span class="post-username">@${user?.username || 'unknown'}</span>
        </div>
        <span class="post-time">${timeAgo}</span>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      <div class="post-actions">
        <button class="post-action like-btn ${hasLiked ? 'liked' : ''}" data-post-id="${post.id}">
          ♥ ${likeCount}
        </button>
        <button class="post-action reply-btn" data-post-id="${post.id}" data-content="${escapeHtml(post.content)}">
          💬 ${replyCount}
        </button>
      </div>
    </div>
  `;
}

async function attachPostEventListeners(container) {
    // Like buttons
    container.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', handleLike);
    });

    // Reply buttons
    container.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', handleReplyClick);
    });

    // Profile links
    container.querySelectorAll('.post-display-name').forEach(name => {
        name.addEventListener('click', () => {
            const username = name.dataset.username;
            if (username) viewProfile(username);
        });
    });
}

async function handleLike(e) {
    if (!currentProfile) return;

    const btn = e.currentTarget;
    const postId = btn.dataset.postId;
    const isLiked = btn.classList.contains('liked');

    try {
        if (isLiked) {
            await unlikePost(currentProfile.id, postId);
            btn.classList.remove('liked');
        } else {
            await likePost(currentProfile.id, postId);
            btn.classList.add('liked');
        }

        // Update count
        const currentCount = parseInt(btn.textContent.replace('♥ ', '')) || 0;
        btn.textContent = `♥ ${isLiked ? currentCount - 1 : currentCount + 1}`;
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

function handleReplyClick(e) {
    const btn = e.currentTarget;
    replyingToPost = btn.dataset.postId;
    elements.replyOriginalPost.textContent = btn.dataset.content;
    elements.replyContent.value = '';
    elements.replyModal.classList.remove('hidden');
}

async function submitPost() {
    const content = elements.postContent.value.trim();
    if (!content || !currentProfile) return;

    elements.postSubmitBtn.disabled = true;

    try {
        const post = await createPost(currentProfile.id, content);
        elements.postContent.value = '';

        // Prepend new post to feed
        const postHtml = renderPost(post);
        elements.postsFeed.insertAdjacentHTML('afterbegin', postHtml);
        attachPostEventListeners(elements.postsFeed);
    } catch (error) {
        console.error('Error creating post:', error);
    } finally {
        elements.postSubmitBtn.disabled = false;
    }
}

async function submitReply() {
    const content = elements.replyContent.value.trim();
    if (!content || !currentProfile || !replyingToPost) return;

    elements.replySubmitBtn.disabled = true;

    try {
        await createPost(currentProfile.id, content, replyingToPost);
        elements.replyModal.classList.add('hidden');
        replyingToPost = null;

        // Refresh feed to show reply
        if (currentView === 'home') {
            await loadFeed();
        }
    } catch (error) {
        console.error('Error creating reply:', error);
    } finally {
        elements.replySubmitBtn.disabled = false;
    }
}

// ============================================
// REAL-TIME UPDATES
// ============================================
function setupRealtimeSubscription() {
    if (newPostsSubscription) {
        unsubscribe(newPostsSubscription);
    }

    newPostsSubscription = subscribeToNewPosts((newPost) => {
        // Don't show notification for own posts
        if (newPost.user_id === currentProfile?.id) return;

        pendingNewPosts.push(newPost);
        elements.newPostsBanner.classList.remove('hidden');
        elements.loadNewPostsBtn.textContent = `${pendingNewPosts.length} new post${pendingNewPosts.length > 1 ? 's' : ''} available! Click to refresh`;
    });
}

async function loadNewPosts() {
    elements.newPostsBanner.classList.add('hidden');
    pendingNewPosts = [];
    await loadFeed();
}

// ============================================
// PROFILE
// ============================================
async function viewProfile(username) {
    const profile = username === currentProfile?.username
        ? currentProfile
        : await getUserByUsername(username);

    if (!profile) {
        alert('User not found');
        return;
    }

    viewingProfile = profile;
    await renderProfile(profile);
    showView('profile');
    await loadUserPosts(profile.id);
}

async function renderProfile(profile) {
    const isOwnProfile = profile.id === currentProfile?.id;

    // Set profile data
    if (profile.banner_url) {
        elements.profileBanner.style.backgroundImage = `url(${profile.banner_url})`;
    } else {
        elements.profileBanner.style.backgroundImage = '';
    }

    elements.profileAvatar.src = profile.avatar_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/></svg>';
    elements.profileDisplayName.textContent = profile.display_name || profile.username;
    elements.profileUsername.textContent = `@${profile.username}`;
    elements.profileBio.textContent = profile.bio || 'No bio yet';

    // Get follow counts
    const [followers, following] = await Promise.all([
        getFollowerCount(profile.id),
        getFollowingCount(profile.id)
    ]);

    elements.followersCount.textContent = `${followers} Followers`;
    elements.followingCount.textContent = `${following} Following`;

    // Show/hide edit buttons based on ownership
    elements.editBannerBtn.classList.toggle('hidden', !isOwnProfile);
    elements.editAvatarBtn.classList.toggle('hidden', !isOwnProfile);
    elements.editBioBtn.classList.toggle('hidden', !isOwnProfile);
    elements.followBtn.classList.toggle('hidden', isOwnProfile);

    // Set follow button state
    if (!isOwnProfile && currentProfile) {
        const isFollowingUser = await isFollowing(currentProfile.id, profile.id);
        elements.followBtn.textContent = isFollowingUser ? 'Unfollow' : 'Follow';
        elements.followBtn.dataset.following = isFollowingUser;
    }
}

async function toggleFollow() {
    if (!currentProfile || !viewingProfile || viewingProfile.id === currentProfile.id) return;

    const wasFollowing = elements.followBtn.dataset.following === 'true';

    try {
        if (wasFollowing) {
            await unfollowUser(currentProfile.id, viewingProfile.id);
        } else {
            await followUser(currentProfile.id, viewingProfile.id);
        }

        elements.followBtn.textContent = wasFollowing ? 'Follow' : 'Unfollow';
        elements.followBtn.dataset.following = !wasFollowing;

        // Update follower count
        const followers = await getFollowerCount(viewingProfile.id);
        elements.followersCount.textContent = `${followers} Followers`;
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}

// ============================================
// PROFILE EDITING
// ============================================
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentProfile) return;

    try {
        const url = await uploadAvatar(currentProfile.id, file);
        await updateUserProfile(currentProfile.id, { avatar_url: url });
        currentProfile.avatar_url = url;
        elements.profileAvatar.src = url;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Error uploading avatar. Please try again.');
    }
}

async function handleBannerUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentProfile) return;

    try {
        const url = await uploadBanner(currentProfile.id, file);
        await updateUserProfile(currentProfile.id, { banner_url: url });
        currentProfile.banner_url = url;
        elements.profileBanner.style.backgroundImage = `url(${url})`;
    } catch (error) {
        console.error('Error uploading banner:', error);
        alert('Error uploading banner. Please try again.');
    }
}

function showBioModal() {
    elements.bioInput.value = currentProfile?.bio || '';
    elements.bioModal.classList.remove('hidden');
}

async function saveBio() {
    const bio = elements.bioInput.value.trim();
    if (!currentProfile) return;

    try {
        await updateUserProfile(currentProfile.id, { bio });
        currentProfile.bio = bio;
        elements.profileBio.textContent = bio || 'No bio yet';
        elements.bioModal.classList.add('hidden');
    } catch (error) {
        console.error('Error saving bio:', error);
    }
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

    return date.toLocaleDateString();
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Login
    elements.googleSignInBtn.addEventListener('click', signInWithGoogle);

    // Username
    elements.usernameInput.addEventListener('input', (e) => {
        clearTimeout(usernameCheckTimeout);
        usernameCheckTimeout = setTimeout(() => {
            checkUsername(e.target.value.trim());
        }, 300);
    });
    elements.usernameSubmitBtn.addEventListener('click', submitUsername);

    // Navigation
    elements.navHome.addEventListener('click', () => {
        showView('home');
        loadFeed();
    });
    elements.navProfile.addEventListener('click', () => {
        if (currentProfile) {
            viewProfile(currentProfile.username);
        }
    });
    elements.navLogout.addEventListener('click', logout);

    // New posts
    elements.loadNewPostsBtn.addEventListener('click', loadNewPosts);

    // Post composer
    elements.postSubmitBtn.addEventListener('click', submitPost);

    // Profile editing
    elements.editAvatarBtn.addEventListener('click', () => elements.avatarInput.click());
    elements.editBannerBtn.addEventListener('click', () => elements.bannerInput.click());
    elements.avatarInput.addEventListener('change', handleAvatarUpload);
    elements.bannerInput.addEventListener('change', handleBannerUpload);
    elements.editBioBtn.addEventListener('click', showBioModal);
    elements.followBtn.addEventListener('click', toggleFollow);

    // Bio modal
    elements.bioCancelBtn.addEventListener('click', () => elements.bioModal.classList.add('hidden'));
    elements.bioSaveBtn.addEventListener('click', saveBio);

    // Reply modal
    elements.replyCancelBtn.addEventListener('click', () => {
        elements.replyModal.classList.add('hidden');
        replyingToPost = null;
    });
    elements.replySubmitBtn.addEventListener('click', submitReply);

    // Close modals on backdrop click
    elements.bioModal.addEventListener('click', (e) => {
        if (e.target === elements.bioModal) elements.bioModal.classList.add('hidden');
    });
    elements.replyModal.addEventListener('click', (e) => {
        if (e.target === elements.replyModal) {
            elements.replyModal.classList.add('hidden');
            replyingToPost = null;
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    setupEventListeners();
    onAuthChange(handleAuthStateChange);
}

// Start the app
init();
