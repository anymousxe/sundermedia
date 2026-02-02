'use client';

import { useState } from 'react';
import Button from './ui/Button';
import styles from './PostComposer.module.css';

interface PostComposerProps {
    onPost: (content: string, images: string[]) => Promise<void>;
}

export default function PostComposer({ onPost }: PostComposerProps) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setLoading(true);
        try {
            await onPost(content, []);
            setContent('');
        } catch (error) {
            console.error('Failed to post:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.composer} glass`}>
            <textarea
                className={styles.textarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                maxLength={500}
            />
            <div className={styles.footer}>
                <span className={styles.charCount}>{content.length}/500</span>
                <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
                    {loading ? 'Posting...' : 'Post'}
                </Button>
            </div>
        </div>
    );
}
