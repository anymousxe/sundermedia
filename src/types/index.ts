export interface User {
    id: string;
    email: string;
    username: string;
    bio?: string;
    avatar?: string;
    created_at: string;
}

export interface Post {
    id: string;
    user_id: string;
    content: string;
    images?: string[];
    likes: number;
    created_at: string;
    user?: User;
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    likes: number;
    created_at: string;
    user?: User;
}

export interface MediaItem {
    id: string;
    user_id: string;
    type: 'image' | 'video';
    url: string;
    description?: string;
    likes: number;
    saves: number;
    created_at: string;
    user?: User;
}
