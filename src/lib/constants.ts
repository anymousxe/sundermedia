// Maximum username length
export const MAX_USERNAME_LENGTH = 12;

// Allowed username characters
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// API endpoints
export const API_ROUTES = {
    AUTH: {
        SIGNUP: '/api/auth/signup',
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
    },
    USERS: {
        CHECK_USERNAME: '/api/users/check-username',
        CREATE_PROFILE: '/api/users/create-profile',
    },
    POSTS: {
        BASE: '/api/posts',
        LIKE: (id: string) => `/api/posts/${id}/like`,
    },
    MEDIA: {
        BASE: '/api/media',
        UPLOAD: '/api/media/upload',
        SAVE: (id: string) => `/api/media/${id}/save`,
    },
};
