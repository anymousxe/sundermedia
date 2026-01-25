// Sunder - Main Application (Overhauled)
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
    updatePost,
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
    uploadBanner,
    uploadPostImage,
    searchUsers,
    getAllUsers,
    getAllRoles,
    createRole,
    updateRole,
    deleteRole,
    getUserRoles,
    assignRoleToUser,
    removeRoleFromUser,
    supabase
} from './supabase.js';


// ============================================
// CONSTANTS
// ============================================
const ADMIN_EMAIL = 'anymousxe.info@gmail.com';
const USERNAME_CHANGE_COOLDOWN_DAYS = 3;

// ============================================
// STATE
// ============================================
let currentProfile = null;
let currentFirebaseUser = null;
let currentView = 'home';
let viewingProfile = null;
let newPostsSubscription = null;
let pendingNewPosts = [];
let replyingToPost = null;
let postImages = [];
let replyImages = [];

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
    navAdmin: document.getElementById('nav-admin'),
    navLogout: document.getElementById('nav-logout'),

    // Search
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results'),

    // Views
    homeView: document.getElementById('home-view'),
    profileView: document.getElementById('profile-view'),
    adminView: document.getElementById('admin-view'),

    // New Posts
    newPostsBanner: document.getElementById('new-posts-banner'),
    loadNewPostsBtn: document.getElementById('load-new-posts-btn'),

    // Post Composer
    composerAvatar: document.getElementById('composer-avatar'),
    postContent: document.getElementById('post-content'),
    postSubmitBtn: document.getElementById('post-submit-btn'),
    postsFeed: document.getElementById('posts-feed'),
    addImageBtn: document.getElementById('add-image-btn'),
    postImageInput: document.getElementById('post-image-input'),
    postImagePreview: document.getElementById('post-image-preview'),

    // Profile
    profileBanner: document.getElementById('profile-banner'),
    profileAvatar: document.getElementById('profile-avatar'),
    profileDisplayName: document.getElementById('profile-display-name'),
    profileUsername: document.getElementById('profile-username'),
    profileBio: document.getElementById('profile-bio'),
    profileVerified: document.getElementById('profile-verified'),
    profileRoles: document.getElementById('profile-roles'),
    followersCount: document.getElementById('followers-count'),
    followingCount: document.getElementById('following-count'),
    profilePosts: document.getElementById('profile-posts'),
    editBannerBtn: document.getElementById('edit-banner-btn'),
    editAvatarBtn: document.getElementById('edit-avatar-btn'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    followBtn: document.getElementById('follow-btn'),
    bannerInput: document.getElementById('banner-input'),
    avatarInput: document.getElementById('avatar-input'),

    // Edit Profile Modal
    editProfileModal: document.getElementById('edit-profile-modal'),
    editProfileClose: document.getElementById('edit-profile-close'),
    editDisplayName: document.getElementById('edit-display-name'),
    editUsername: document.getElementById('edit-username'),
    editUsernameError: document.getElementById('edit-username-error'),
    usernameCooldownText: document.getElementById('username-cooldown-text'),
    editBio: document.getElementById('edit-bio'),
    editProfileSave: document.getElementById('edit-profile-save'),
    editProfileCancel: document.getElementById('edit-profile-cancel'),

    // Reply Modal
    replyModal: document.getElementById('reply-modal'),
    replyClose: document.getElementById('reply-close'),
    replyOriginalPost: document.getElementById('reply-original-post'),
    replyContent: document.getElementById('reply-content'),
    replyCancelBtn: document.getElementById('reply-cancel-btn'),
    replySubmitBtn: document.getElementById('reply-submit-btn'),
    replyAddImageBtn: document.getElementById('reply-add-image-btn'),
    replyImageInput: document.getElementById('reply-image-input'),
    replyImagePreview: document.getElementById('reply-image-preview'),

    // Roles Modal
    rolesModal: document.getElementById('roles-modal'),
    rolesClose: document.getElementById('roles-close'),
    rolesList: document.getElementById('roles-list'),

    // Admin
    adminUsersTable: document.getElementById('admin-users-table'),
    adminUserSearch: document.getElementById('admin-user-search'),
    adminRolesTable: document.getElementById('admin-roles-table'),
    createRoleBtn: document.getElementById('create-role-btn'),
    adminVerifySearch: document.getElementById('admin-verify-search'),
    verifyUserResult: document.getElementById('verify-user-result'),

    // Role Edit Modal
    roleEditModal: document.getElementById('role-edit-modal'),
    roleModalTitle: document.getElementById('role-modal-title'),
    roleEditClose: document.getElementById('role-edit-close'),
    roleName: document.getElementById('role-name'),
    roleAbbr: document.getElementById('role-abbr'),
    roleBgColor: document.getElementById('role-bg-color'),
    roleTextColor: document.getElementById('role-text-color'),
    rolePriority: document.getElementById('role-priority'),
    rolePreview: document.getElementById('role-preview'),
    roleEditSave: document.getElementById('role-edit-save'),
    roleEditCancel: document.getElementById('role-edit-cancel'),

    // Lightbox
    lightbox: document.getElementById('lightbox'),
    lightboxImage: document.getElementById('lightbox-image')
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
    elements.adminView.classList.add('hidden');

    elements.navHome.classList.remove('active');
    elements.navProfile.classList.remove('active');
    elements.navAdmin.classList.remove('active');

    if (viewName === 'home') {
        elements.homeView.classList.remove('hidden');
        elements.navHome.classList.add('active');
    } else if (viewName === 'profile') {
        elements.profileView.classList.remove('hidden');
        elements.navProfile.classList.add('active');
    } else if (viewName === 'admin') {
        elements.adminView.classList.remove('hidden');
        elements.navAdmin.classList.add('active');
    }
}

// ============================================
// AUTHENTICATION FLOW
// ============================================
async function handleAuthStateChange(firebaseUser) {
    if (!firebaseUser) {
        showScreen('login');
        currentProfile = null;
        currentFirebaseUser = null;
        if (newPostsSubscription) {
            unsubscribe(newPostsSubscription);
            newPostsSubscription = null;
        }
        return;
    }

    currentFirebaseUser = firebaseUser;

    // Check if user has a profile in Supabase
    const profile = await getUserByFirebaseUid(firebaseUser.uid);

    if (!profile) {
        showScreen('username');
        return;
    }

    currentProfile = profile;

    // Check if user is admin
    if (firebaseUser.email === ADMIN_EMAIL) {
        elements.navAdmin.classList.remove('hidden');
    } else {
        elements.navAdmin.classList.add('hidden');
    }

    // Update composer avatar
    if (elements.composerAvatar) {
        elements.composerAvatar.src = profile.avatar_url || getDefaultAvatar();
    }

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

        if (firebaseUser.email === ADMIN_EMAIL) {
            elements.navAdmin.classList.remove('hidden');
        }

        if (elements.composerAvatar) {
            elements.composerAvatar.src = profile.avatar_url || getDefaultAvatar();
        }

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
// SEARCH
// ============================================
let searchTimeout = null;

async function handleSearch(query) {
    if (!query || query.length < 2) {
        elements.searchResults.classList.add('hidden');
        return;
    }

    try {
        const users = await searchUsers(query);

        if (users.length === 0) {
            elements.searchResults.innerHTML = '<div class="search-result-item" style="color: var(--text-secondary);">No users found</div>';
        } else {
            elements.searchResults.innerHTML = users.map(user => `
        <div class="search-result-item" data-username="${user.username}">
          <img class="search-result-avatar" src="${user.avatar_url || getDefaultAvatar()}" alt="${user.display_name}">
          <div class="search-result-info">
            <span class="search-result-name">${escapeHtml(user.display_name || user.username)}</span>
            <span class="search-result-username">@${user.username}</span>
          </div>
        </div>
      `).join('');

            // Add click handlers
            elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const username = item.dataset.username;
                    if (username) {
                        viewProfile(username);
                        elements.searchResults.classList.add('hidden');
                        elements.searchInput.value = '';
                    }
                });
            });
        }

        elements.searchResults.classList.remove('hidden');
    } catch (error) {
        console.error('Search error:', error);
    }
}

// ============================================
// POSTS & FEED
// ============================================
async function loadFeed() {
    elements.postsFeed.innerHTML = '<div class="loading"><div class="spinner"></div>Loading posts...</div>';
    const posts = await getFeedPosts(20, currentProfile?.id);
    renderPosts(posts, elements.postsFeed);
}


async function loadUserPosts(userId) {
    elements.profilePosts.innerHTML = '<div class="loading"><div class="spinner"></div>Loading posts...</div>';
    const posts = await getUserPosts(userId, 20);
    renderPosts(posts, elements.profilePosts);
}

function renderPosts(posts, container) {
    if (posts.length === 0) {
        container.innerHTML = '<div class="loading" style="color: var(--text-secondary);">No posts yet</div>';
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

    // Roles (show max 3)
    const roles = user?.roles || [];
    const displayRoles = roles.slice(0, 3);
    const remainingRoles = roles.length - 3;

    // Image handling
    const images = post.images || [];
    let imagesHtml = '';
    if (images.length > 0) {
        const gridClass = images.length === 1 ? 'single' : images.length === 2 ? 'double' : images.length === 3 ? 'triple' : 'quad';
        imagesHtml = `
      <div class="post-images ${gridClass}">
        ${images.slice(0, 4).map(img => `<img class="post-image" src="${img}" alt="Post image" data-src="${img}">`).join('')}
      </div>
    `;
    }

    return `
    <div class="post ${isReply ? 'reply' : ''}" data-post-id="${post.id}">
      <img 
        src="${user?.avatar_url || getDefaultAvatar()}" 
        alt="${user?.display_name}" 
        class="post-avatar"
        data-username="${user?.username}"
      >
      <div class="post-main">
        <div class="post-header">
          <span class="post-display-name" data-username="${user?.username}">
            ${escapeHtml(user?.display_name || 'Unknown')}
            ${user?.is_verified ? `
              <span class="verified-badge" title="Verified">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </span>
            ` : ''}
          </span>
          <span class="post-username">@${user?.username || 'unknown'}</span>
          <span class="post-time">${timeAgo}</span>
          ${displayRoles.length > 0 ? `
            <div class="post-roles">
              ${displayRoles.map(role => `
                <span class="role-badge" style="background: ${role.bg_color}; color: ${role.text_color};">
                  ${role.abbreviation}
                </span>
              `).join('')}
              ${remainingRoles > 0 ? `<span class="role-more">+${remainingRoles}</span>` : ''}
            </div>
          ` : ''}
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        ${imagesHtml}
        <div class="post-actions">
          <button class="post-action reply-btn" data-post-id="${post.id}" data-content="${escapeHtml(post.content)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            ${replyCount}
          </button>
          <button class="post-action like-btn ${hasLiked ? 'liked' : ''}" data-post-id="${post.id}">
            <svg viewBox="0 0 24 24" fill="${hasLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            ${likeCount}
          </button>
        </div>
      </div>
    </div>
  `;
}

function attachPostEventListeners(container) {
    // Like buttons
    container.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', handleLike);
    });

    // Reply buttons
    container.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', handleReplyClick);
    });

    // Profile links
    container.querySelectorAll('.post-display-name, .post-avatar').forEach(el => {
        el.addEventListener('click', () => {
            const username = el.dataset.username;
            if (username) viewProfile(username);
        });
    });

    // Image lightbox
    container.querySelectorAll('.post-image').forEach(img => {
        img.addEventListener('click', () => {
            elements.lightboxImage.src = img.dataset.src;
            elements.lightbox.classList.remove('hidden');
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
        const svg = btn.querySelector('svg');
        const currentCount = parseInt(btn.textContent.trim()) || 0;
        btn.innerHTML = `${svg.outerHTML} ${isLiked ? currentCount - 1 : currentCount + 1}`;
        if (!isLiked) btn.classList.add('liked');
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

function handleReplyClick(e) {
    const btn = e.currentTarget;
    replyingToPost = btn.dataset.postId;
    elements.replyOriginalPost.textContent = btn.dataset.content;
    elements.replyContent.value = '';
    replyImages = [];
    elements.replyImagePreview.innerHTML = '';
    elements.replyImagePreview.classList.add('hidden');
    elements.replyModal.classList.remove('hidden');
}

async function submitPost() {
    const content = elements.postContent.value.trim();
    if (!content || !currentProfile) return;

    elements.postSubmitBtn.disabled = true;

    try {
        const post = await createPost(currentProfile.id, content, null, postImages);
        elements.postContent.value = '';
        postImages = [];
        elements.postImagePreview.innerHTML = '';
        elements.postImagePreview.classList.add('hidden');
        elements.postSubmitBtn.disabled = true;

        // Prepend new post to feed
        const postHtml = renderPost(post);
        elements.postsFeed.insertAdjacentHTML('afterbegin', postHtml);
        attachPostEventListeners(elements.postsFeed);
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Error creating post. Please try again.');
    } finally {
        elements.postSubmitBtn.disabled = !elements.postContent.value.trim();
    }
}

async function submitReply() {
    const content = elements.replyContent.value.trim();
    if (!content || !currentProfile || !replyingToPost) return;

    elements.replySubmitBtn.disabled = true;

    try {
        await createPost(currentProfile.id, content, replyingToPost, replyImages);
        elements.replyModal.classList.add('hidden');
        replyingToPost = null;
        replyImages = [];

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
// IMAGE HANDLING
// ============================================
function handleImageSelect(input, previewContainer, imagesArray) {
    const files = Array.from(input.files);

    files.forEach(file => {
        if (file.type.startsWith('image/') && imagesArray.length < 4) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagesArray.push(e.target.result);
                updateImagePreview(previewContainer, imagesArray);
            };
            reader.readAsDataURL(file);
        }
    });

    input.value = '';
}

function updateImagePreview(container, imagesArray) {
    if (imagesArray.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = imagesArray.map((img, index) => `
    <div class="image-preview">
      <img src="${img}" alt="Preview">
      <button class="image-preview-remove" data-index="${index}">&times;</button>
    </div>
  `).join('');

    container.querySelectorAll('.image-preview-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            imagesArray.splice(index, 1);
            updateImagePreview(container, imagesArray);
        });
    });
}

// Paste image support
function handlePaste(e, imagesArray, previewContainer) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
        if (item.type.startsWith('image/') && imagesArray.length < 4) {
            e.preventDefault();
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (event) => {
                imagesArray.push(event.target.result);
                updateImagePreview(previewContainer, imagesArray);
            };
            reader.readAsDataURL(file);
        }
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

    // Set banner
    if (profile.banner_url) {
        elements.profileBanner.style.backgroundImage = `url(${profile.banner_url})`;
    } else {
        elements.profileBanner.style.backgroundImage = '';
    }

    // Set avatar
    elements.profileAvatar.src = profile.avatar_url || getDefaultAvatar();

    // Set name and username
    const nameText = elements.profileDisplayName.querySelector('.name-text');
    if (nameText) {
        nameText.textContent = profile.display_name || profile.username;
    } else {
        elements.profileDisplayName.innerHTML = `
      <span class="name-text">${escapeHtml(profile.display_name || profile.username)}</span>
      ${profile.is_verified ? `
        <span class="verified-badge" title="Verified">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        </span>
      ` : ''}
    `;
    }

    // Verification badge
    if (profile.is_verified) {
        elements.profileVerified?.classList.remove('hidden');
    } else {
        elements.profileVerified?.classList.add('hidden');
    }

    elements.profileUsername.textContent = `@${profile.username}`;
    elements.profileBio.textContent = profile.bio || 'No bio yet';

    // Roles
    const roles = profile.roles || [];
    if (roles.length > 0) {
        const displayRoles = roles.slice(0, 3);
        const remaining = roles.length - 3;

        elements.profileRoles.innerHTML = displayRoles.map(role => `
      <span class="role-badge" style="background: ${role.bg_color}; color: ${role.text_color};">
        ${role.name}
      </span>
    `).join('') + (remaining > 0 ? `
      <span class="role-more" id="view-all-roles" data-user-id="${profile.id}">+${remaining} more</span>
    ` : '');

        elements.profileRoles.classList.remove('hidden');

        // Add click handler for "view all roles"
        const viewAllBtn = elements.profileRoles.querySelector('#view-all-roles');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => showAllRoles(roles));
        }
    } else {
        elements.profileRoles.classList.add('hidden');
    }

    // Get follow counts
    const [followers, following] = await Promise.all([
        getFollowerCount(profile.id),
        getFollowingCount(profile.id)
    ]);

    elements.followersCount.innerHTML = `<span class="profile-stat-count">${followers}</span><span class="profile-stat-label">Followers</span>`;
    elements.followingCount.innerHTML = `<span class="profile-stat-count">${following}</span><span class="profile-stat-label">Following</span>`;

    // Show/hide buttons based on ownership
    elements.editBannerBtn.classList.toggle('hidden', !isOwnProfile);
    elements.editAvatarBtn.classList.toggle('hidden', !isOwnProfile);
    elements.editProfileBtn.classList.toggle('hidden', !isOwnProfile);
    elements.followBtn.classList.toggle('hidden', isOwnProfile);

    // Set follow button state
    if (!isOwnProfile && currentProfile) {
        const isFollowingUser = await isFollowing(currentProfile.id, profile.id);
        elements.followBtn.textContent = isFollowingUser ? 'Unfollow' : 'Follow';
        elements.followBtn.dataset.following = isFollowingUser;
    }
}

function showAllRoles(roles) {
    elements.rolesList.innerHTML = roles.map(role => `
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--void-medium); border-radius: 8px;">
      <span class="role-badge" style="background: ${role.bg_color}; color: ${role.text_color};">
        ${role.abbreviation}
      </span>
      <span style="font-weight: 600;">${role.name}</span>
    </div>
  `).join('');

    elements.rolesModal.classList.remove('hidden');
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

        const followers = await getFollowerCount(viewingProfile.id);
        elements.followersCount.innerHTML = `<span class="profile-stat-count">${followers}</span><span class="profile-stat-label">Followers</span>`;
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}

// ============================================
// PROFILE EDITING
// ============================================
function openEditProfileModal() {
    if (!currentProfile) return;

    elements.editDisplayName.value = currentProfile.display_name || '';
    elements.editUsername.value = currentProfile.username || '';
    elements.editBio.value = currentProfile.bio || '';
    elements.editUsernameError.classList.add('hidden');

    // Check username change cooldown
    const lastChange = currentProfile.username_changed_at;
    if (lastChange) {
        const daysSince = (Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < USERNAME_CHANGE_COOLDOWN_DAYS) {
            const daysLeft = Math.ceil(USERNAME_CHANGE_COOLDOWN_DAYS - daysSince);
            elements.usernameCooldownText.textContent = `(can change in ${daysLeft} day${daysLeft > 1 ? 's' : ''})`;
            elements.editUsername.disabled = true;
        } else {
            elements.usernameCooldownText.textContent = '';
            elements.editUsername.disabled = false;
        }
    } else {
        elements.usernameCooldownText.textContent = '';
        elements.editUsername.disabled = false;
    }

    elements.editProfileModal.classList.remove('hidden');
}

async function saveProfile() {
    if (!currentProfile) return;

    const displayName = elements.editDisplayName.value.trim();
    const username = elements.editUsername.value.trim().toLowerCase();
    const bio = elements.editBio.value.trim();

    const updates = {};

    if (displayName !== currentProfile.display_name) {
        updates.display_name = displayName;
    }

    if (bio !== currentProfile.bio) {
        updates.bio = bio;
    }

    // Username change (with cooldown check)
    if (username !== currentProfile.username && !elements.editUsername.disabled) {
        // Check availability
        const available = await isUsernameAvailable(username);
        if (!available) {
            elements.editUsernameError.textContent = 'Username is already taken';
            elements.editUsernameError.classList.remove('hidden');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username) || username.length < 3) {
            elements.editUsernameError.textContent = 'Invalid username format';
            elements.editUsernameError.classList.remove('hidden');
            return;
        }

        updates.username = username;
        updates.username_changed_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
        elements.editProfileModal.classList.add('hidden');
        return;
    }

    try {
        const updated = await updateUserProfile(currentProfile.id, updates);
        currentProfile = { ...currentProfile, ...updated };
        await renderProfile(currentProfile);
        elements.editProfileModal.classList.add('hidden');
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
    }
}

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentProfile) return;

    try {
        const url = await uploadAvatar(currentProfile.id, file);
        await updateUserProfile(currentProfile.id, { avatar_url: url });
        currentProfile.avatar_url = url;
        elements.profileAvatar.src = url;
        if (elements.composerAvatar) {
            elements.composerAvatar.src = url;
        }
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

// ============================================
// ADMIN PANEL
// ============================================
async function loadAdminUsers() {
    try {
        const users = await getAllUsers();
        renderAdminUsersTable(users);
    } catch (error) {
        console.error('Error loading admin users:', error);
    }
}

function renderAdminUsersTable(users) {
    elements.adminUsersTable.innerHTML = users.map(user => `
    <tr data-user-id="${user.id}">
      <td>
        <div class="admin-user-cell">
          <img class="admin-user-avatar" src="${user.avatar_url || getDefaultAvatar()}" alt="${user.display_name}">
          <div>
            <div style="font-weight: 600;">${escapeHtml(user.display_name || user.username)}</div>
          </div>
        </div>
      </td>
      <td>@${user.username}</td>
      <td>
        ${user.is_suspended ? '<span class="status-badge suspended">Suspended</span>' :
            user.is_shadowbanned ? '<span class="status-badge shadowbanned">Shadowbanned</span>' :
                '<span class="status-badge active">Active</span>'}
      </td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-ghost admin-suspend-btn" data-user-id="${user.id}" data-suspended="${user.is_suspended}">
            ${user.is_suspended ? 'Unsuspend' : 'Suspend'}
          </button>
          <button class="btn btn-ghost admin-shadowban-btn" data-user-id="${user.id}" data-shadowbanned="${user.is_shadowbanned}">
            ${user.is_shadowbanned ? 'Un-shadowban' : 'Shadowban'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');

    // Add event listeners
    elements.adminUsersTable.querySelectorAll('.admin-suspend-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleUserSuspend(btn.dataset.userId, btn.dataset.suspended === 'true'));
    });

    elements.adminUsersTable.querySelectorAll('.admin-shadowban-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleUserShadowban(btn.dataset.userId, btn.dataset.shadowbanned === 'true'));
    });
}

async function toggleUserSuspend(userId, isSuspended) {
    try {
        await updateUserProfile(userId, { is_suspended: !isSuspended });
        await loadAdminUsers();
    } catch (error) {
        console.error('Error toggling suspend:', error);
    }
}

async function toggleUserShadowban(userId, isShadowbanned) {
    try {
        await updateUserProfile(userId, { is_shadowbanned: !isShadowbanned });
        await loadAdminUsers();
    } catch (error) {
        console.error('Error toggling shadowban:', error);
    }
}

// ============================================
// ADMIN - ROLES
// ============================================
let editingRoleId = null;

async function loadAdminRoles() {
    try {
        const roles = await getAllRoles();
        renderAdminRolesTable(roles);
    } catch (error) {
        console.error('Error loading admin roles:', error);
    }
}

function renderAdminRolesTable(roles) {
    if (!elements.adminRolesTable) return;

    elements.adminRolesTable.innerHTML = roles.map(role => `
        <tr data-role-id="${role.id}">
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="role-badge" style="background: ${role.bg_color}; color: ${role.text_color};">
                        ${role.abbreviation}
                    </span>
                    <span style="font-weight: 600;">${escapeHtml(role.name)}</span>
                </div>
            </td>
            <td>${role.abbreviation}</td>
            <td>${role.priority}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-ghost admin-edit-role-btn" data-role-id="${role.id}">Edit</button>
                    <button class="btn btn-ghost admin-delete-role-btn" data-role-id="${role.id}" style="color: var(--error);">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Add event listeners
    elements.adminRolesTable.querySelectorAll('.admin-edit-role-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const roleId = btn.dataset.roleId;
            const role = roles.find(r => r.id === roleId);
            if (role) openRoleModal(role);
        });
    });

    elements.adminRolesTable.querySelectorAll('.admin-delete-role-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this role?')) {
                await handleDeleteRole(btn.dataset.roleId);
            }
        });
    });
}

function openRoleModal(role = null) {
    editingRoleId = role?.id || null;
    elements.roleModalTitle.textContent = role ? 'Edit Role' : 'Create Role';
    elements.roleName.value = role?.name || '';
    elements.roleAbbr.value = role?.abbreviation || '';
    elements.roleBgColor.value = role?.bg_color || '#7c5cff';
    elements.roleTextColor.value = role?.text_color || '#ffffff';
    elements.rolePriority.value = role?.priority || 1;
    updateRolePreview();
    elements.roleEditModal.classList.remove('hidden');
}

function updateRolePreview() {
    const abbr = elements.roleAbbr.value || 'ROLE';
    const bgColor = elements.roleBgColor.value;
    const textColor = elements.roleTextColor.value;
    elements.rolePreview.textContent = abbr.toUpperCase();
    elements.rolePreview.style.background = bgColor;
    elements.rolePreview.style.color = textColor;
}

async function handleSaveRole() {
    const name = elements.roleName.value.trim();
    const abbreviation = elements.roleAbbr.value.trim().toUpperCase();
    const bgColor = elements.roleBgColor.value;
    const textColor = elements.roleTextColor.value;
    const priority = parseInt(elements.rolePriority.value) || 1;

    if (!name || !abbreviation) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        if (editingRoleId) {
            await updateRole(editingRoleId, { name, abbreviation, bgColor, textColor, priority });
        } else {
            await createRole({ name, abbreviation, bgColor, textColor, priority });
        }

        elements.roleEditModal.classList.add('hidden');
        editingRoleId = null;
        await loadAdminRoles();
    } catch (error) {
        console.error('Error saving role:', error);
        alert('Error saving role. Please try again.');
    }
}

async function handleDeleteRole(roleId) {
    try {
        await deleteRole(roleId);
        await loadAdminRoles();
    } catch (error) {
        console.error('Error deleting role:', error);
        alert('Error deleting role. Please try again.');
    }
}


// ============================================
// ADMIN - VERIFICATION
// ============================================
async function searchUserForVerification(query) {
    if (!query || query.length < 2) {
        elements.verifyUserResult.classList.add('hidden');
        return;
    }

    const user = await getUserByUsername(query.replace('@', ''));

    if (!user) {
        elements.verifyUserResult.innerHTML = '<p style="color: var(--text-secondary);">User not found</p>';
        elements.verifyUserResult.classList.remove('hidden');
        return;
    }

    elements.verifyUserResult.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--void-medium); border-radius: 12px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${user.avatar_url || getDefaultAvatar()}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
        <div>
          <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
            ${escapeHtml(user.display_name || user.username)}
            ${user.is_verified ? '<span class="verified-badge"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></span>' : ''}
          </div>
          <div style="color: var(--text-secondary);">@${user.username}</div>
        </div>
      </div>
      <button class="btn ${user.is_verified ? 'btn-danger' : 'btn-primary'}" id="toggle-verify-btn" data-user-id="${user.id}" data-verified="${user.is_verified}">
        ${user.is_verified ? 'Remove Verification' : 'Verify User'}
      </button>
    </div>
  `;
    elements.verifyUserResult.classList.remove('hidden');

    document.getElementById('toggle-verify-btn').addEventListener('click', async (e) => {
        const userId = e.target.dataset.userId;
        const isVerified = e.target.dataset.verified === 'true';

        try {
            await updateUserProfile(userId, { is_verified: !isVerified });
            // Refresh the search
            await searchUserForVerification(query);
        } catch (error) {
            console.error('Error toggling verification:', error);
        }
    });
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

function getDefaultAvatar() {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23252533" width="100" height="100"/><circle cx="50" cy="35" r="20" fill="%23454560"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="%23454560"/></svg>';
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
    elements.navAdmin.addEventListener('click', () => {
        if (currentFirebaseUser?.email === ADMIN_EMAIL) {
            showView('admin');
            loadAdminUsers();
        }
    });
    elements.navLogout.addEventListener('click', logout);

    // Search
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleSearch(e.target.value.trim());
        }, 300);
    });

    elements.searchInput.addEventListener('focus', () => {
        if (elements.searchInput.value.trim().length >= 2) {
            elements.searchResults.classList.remove('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            elements.searchResults.classList.add('hidden');
        }
    });

    // New posts
    elements.loadNewPostsBtn.addEventListener('click', loadNewPosts);

    // Post composer
    elements.postContent.addEventListener('input', () => {
        elements.postSubmitBtn.disabled = !elements.postContent.value.trim();
    });
    elements.postSubmitBtn.addEventListener('click', submitPost);

    // Post images
    elements.addImageBtn.addEventListener('click', () => elements.postImageInput.click());
    elements.postImageInput.addEventListener('change', () => {
        handleImageSelect(elements.postImageInput, elements.postImagePreview, postImages);
    });
    elements.postContent.addEventListener('paste', (e) => {
        handlePaste(e, postImages, elements.postImagePreview);
    });

    // Profile editing
    elements.editAvatarBtn.addEventListener('click', () => elements.avatarInput.click());
    elements.editBannerBtn.addEventListener('click', () => elements.bannerInput.click());
    elements.avatarInput.addEventListener('change', handleAvatarUpload);
    elements.bannerInput.addEventListener('change', handleBannerUpload);
    elements.editProfileBtn.addEventListener('click', openEditProfileModal);
    elements.followBtn.addEventListener('click', toggleFollow);

    // Edit profile modal
    elements.editProfileClose.addEventListener('click', () => elements.editProfileModal.classList.add('hidden'));
    elements.editProfileCancel.addEventListener('click', () => elements.editProfileModal.classList.add('hidden'));
    elements.editProfileSave.addEventListener('click', saveProfile);

    // Reply modal
    elements.replyClose.addEventListener('click', () => {
        elements.replyModal.classList.add('hidden');
        replyingToPost = null;
    });
    elements.replyCancelBtn.addEventListener('click', () => {
        elements.replyModal.classList.add('hidden');
        replyingToPost = null;
    });
    elements.replySubmitBtn.addEventListener('click', submitReply);
    elements.replyAddImageBtn.addEventListener('click', () => elements.replyImageInput.click());
    elements.replyImageInput.addEventListener('change', () => {
        handleImageSelect(elements.replyImageInput, elements.replyImagePreview, replyImages);
    });
    elements.replyContent.addEventListener('paste', (e) => {
        handlePaste(e, replyImages, elements.replyImagePreview);
    });

    // Roles modal
    elements.rolesClose.addEventListener('click', () => elements.rolesModal.classList.add('hidden'));

    // Role edit modal
    elements.createRoleBtn?.addEventListener('click', () => openRoleModal());
    elements.roleEditClose.addEventListener('click', () => elements.roleEditModal.classList.add('hidden'));
    elements.roleEditCancel.addEventListener('click', () => elements.roleEditModal.classList.add('hidden'));
    elements.roleEditSave.addEventListener('click', handleSaveRole);
    elements.roleName.addEventListener('input', updateRolePreview);
    elements.roleAbbr.addEventListener('input', updateRolePreview);
    elements.roleBgColor.addEventListener('input', updateRolePreview);
    elements.roleTextColor.addEventListener('input', updateRolePreview);

    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
            tab.classList.add('active');
            const contentId = `admin-${tab.dataset.tab}-tab`;
            document.getElementById(contentId)?.classList.remove('hidden');

            // Load data for the selected tab
            if (tab.dataset.tab === 'roles') {
                loadAdminRoles();
            }
        });
    });


    // Admin verification search
    elements.adminVerifySearch?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchUserForVerification(e.target.value.trim());
        }, 300);
    });

    // Lightbox
    elements.lightbox.addEventListener('click', () => {
        elements.lightbox.classList.add('hidden');
    });

    // Close modals on backdrop click
    [elements.editProfileModal, elements.replyModal, elements.rolesModal, elements.roleEditModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
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

init();
