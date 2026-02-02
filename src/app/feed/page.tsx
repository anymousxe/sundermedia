'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/types';
import Button from '@/components/ui/Button';
import PostComposer from '@/components/PostComposer';
import PostComponent from '@/components/Post';
import styles from './feed.module.css';

export default function FeedPage() {
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            const parsedUser = JSON.parse(userData);
            if (!parsedUser.username) {
                router.push('/create-profile');
                return;
            }
            setUser(parsedUser);
        }

        loadPosts();
        setLoading(false);
    }, [router]);

    const loadPosts = async () => {
        try {
            const res = await fetch('/api/posts');
            const data = await res.json();
            if (data.posts) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
        }
    };

    const handleCreatePost = async (content: string, images: string[]) => {
        const token = localStorage.getItem('auth_token');
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content, images }),
            });

            if (res.ok) {
                await loadPosts(); // Reload posts
            }
        } catch (error) {
            console.error('Failed to create post:', error);
        }
    };

    const handleLike = async (postId: string) => {
        const token = localStorage.getItem('auth_token');
        try {
            await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            await loadPosts(); // Reload to get updated likes
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="gradient-text" style={{ fontSize: '24px' }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <nav className={`${styles.nav} glass`}>
                <h1 className="gradient-text">Sunder Media</h1>
                <div className={styles.navRight}>
                    <a href="/media" className="hover-underline" style={{ marginRight: '16px', color: 'var(--text-secondary)' }}>
                        Gallery
                    </a>
                    <span className={styles.username}>@{user?.username}</span>
                    <Button variant="ghost" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </nav>

            <main className={styles.main}>
                <PostComposer onPost={handleCreatePost} />

                {posts.length === 0 ? (
                    <div className={`${styles.card} glass`}>
                        <h2 className="gradient-text">No posts yet!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
                            Be the first to post something! ✨
                        </p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostComponent key={post.id} post={post} onLike={handleLike} />
                    ))
                )}
            </main>
        </div>
    );
}
