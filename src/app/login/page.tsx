'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './login.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save token
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on user profile completion
            if (data.user.username) {
                router.push('/feed');
            } else {
                router.push('/create-profile');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.card} glass fade-in`}>
                <h1 className={`${styles.title} gradient-text`}>Welcome Back</h1>
                <p className={styles.subtitle}>Log in to Sunder Media</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        type="email"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                    />
                    <Input
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                    />

                    {error && <div className={styles.error}>{error}</div>}

                    <Button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </Button>
                </form>

                <p className={styles.footer}>
                    Don't have an account?{' '}
                    <a href="/signup" className="hover-underline">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
