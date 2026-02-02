'use client';

import { useState } from 'react';
import { Post } from '@/types';
import styles from './Post.module.css';

interface PostProps {
    post: Post;
    onLike?: (postId: string) => void;
    onComment?: (postId: string, content: string) => void;
}

export default function PostComponent({ post, onLike, onComment }: PostProps) {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    const handleLike = () => {
        if (onLike) onLike(post.id);
    };

    const handleComment = () => {
        if (onComment && commentText.trim()) {
            onComment(post.id, commentText);
            setCommentText('');
        }
    };

    return (
        <div className={`${styles.post} glass fade-in`}>
            <div className={styles.header}>
                <div className={styles.avatar}>
                    {post.user?.avatar ? (
                        <img src={post.user.avatar} alt={post.user.username} />
                    ) : (
                        <div className={styles.defaultAvatar}>
                            {post.user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
                <div className={styles.userInfo}>
                    <span className={styles.username}>@{post.user?.username || 'unknown'}</span>
                    <span className={styles.timestamp}>
                        {new Date(post.created_at).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className={styles.content}>
                <p>{post.content}</p>
                {post.images && post.images.length > 0 && (
                    <div className={styles.images}>
                        {post.images.map((img, idx) => (
                            <img key={idx} src={img} alt="Post image" />
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                <button onClick={handleLike} className={`${styles.actionBtn} hover-underline`}>
                    ❤️ {post.likes || 0}
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`${styles.actionBtn} hover-underline`}
                >
                    💬 Comment
                </button>
            </div>

            {showComments && (
                <div className={styles.commentSection}>
                    <div className={styles.commentInput}>
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                        />
                        <button onClick={handleComment}>Post</button>
                    </div>
                </div>
            )}
        </div>
    );
}
