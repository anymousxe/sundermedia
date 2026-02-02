'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { MAX_USERNAME_LENGTH } from '@/lib/constants';
import styles from './create-profile.module.css';

export default function CreateProfilePage() {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const router = useRouter();

    // Check username availability as user types
    useEffect(() => {
        const checkUsername = async () => {
            if (username.length === 0) {
                setUsernameError('');
                return;
            }

            if (username.length > MAX_USERNAME_LENGTH) {
                setUsernameError(`Username must be ${MAX_USERNAME_LENGTH} characters or less`);
                return;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                setUsernameError('Username can only contain letters, numbers, and underscores');
                return;
            }

            setCheckingUsername(true);

            try {
                const res = await fetch(`/api/users/check-username?username=${username}`);
                const data = await res.json();

                if (!data.available) {
                    setUsernameError(data.error || 'Username not available');
                } else {
                    setUsernameError('');
                }
            } catch (err) {
                console.error('Error checking username:', err);
            } finally {
                setCheckingUsername(false);
            }
        };

        const timeout = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeout);
    }, [username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (usernameError) {
            return;
        }

        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/users/create-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username, bio }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create profile');
            }

            // Update local user data
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to feed
            router.push('/feed');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.card} glass fade-in`}>
                <h1 className={`${styles.title} gradient-text`}>Create Your Profile</h1>
                <p className={styles.subtitle}>Choose a unique username</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div>
                        <Input
                            type="text"
                            label={`Username (max ${MAX_USERNAME_LENGTH} characters)`}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter username"
                            error={usernameError}
                        />
                        {checkingUsername && (
                            <span className={styles.checking}>Checking availability...</span>
                        )}
                        {username && !usernameError && !checkingUsername && (
                            <span className={styles.available}>✓ Username available</span>
                        )}
                    </div>

                    <div>
                        <label className={styles.label}>Bio (optional)</label>
                        <textarea
                            className={styles.textarea}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={4}
                            maxLength={200}
                        />
                        <span className={styles.charCount}>{bio.length}/200</span>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <Button type="submit" disabled={loading || !!usernameError || !username}>
                        {loading ? 'Creating profile...' : 'Create Profile'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
