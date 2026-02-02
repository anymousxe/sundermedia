import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
    return (
        <div className={styles.container}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.inputWrapper}>
                <input className={`${styles.input} ${error ? styles.error : ''} ${className || ''}`} {...props} />
                <div className={styles.underline} />
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}
