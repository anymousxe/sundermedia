'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MediaItem } from '@/types';
import styles from './media.module.css';

export default function MediaPage() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/login');
            return;
        }

        loadMedia();
    }, [router]);

    const loadMedia = async () => {
        try {
            const res = await fetch('/api/media');
            const data = await res.json();
            if (data.media) {
                setMedia(data.media);
            }
        } catch (error) {
            console.error('Failed to load media:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <nav className={`${styles.nav} glass`}>
                <h1 className="gradient-text">Sunder Media Gallery</h1>
                <div className={styles.navRight}>
                    <a href="/feed" className="hover-underline" style={{ color: 'var(--text-secondary)' }}>
                        Back to Feed
                    </a>
                </div>
            </nav>

            <main className={styles.main}>
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className="gradient-text" style={{ fontSize: '24px' }}>
                            Loading...
                        </div>
                    </div>
                ) : media.length === 0 ? (
                    <div className={`${styles.card} glass fade-in`}>
                        <h2 className="gradient-text">No media yet!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
                            Media uploads coming soon! 📸🎥
                        </p>
                    </div>
                ) : (
                    <div className={styles.gallery}>
                        {media.map((item) => (
                            <div key={item.id} className={`${styles.mediaItem} glass`}>
                                {item.type === 'image' ? (
                                    <img src={item.url} alt={item.description || 'Media'} />
                                ) : (
                                    <video src={item.url} controls />
                                )}
                                <div className={styles.mediaInfo}>
                                    <span>@{item.user?.username}</span>
                                    <div className={styles.stats}>
                                        <span>❤️ {item.likes}</span>
                                        <span>💾 {item.saves}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
