import './globals.css';
import AnimatedBackground from '@/components/AnimatedBackground';

export const metadata = {
    title: 'Sunder Media',
    description: 'Modern social media platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AnimatedBackground />
                {children}
            </body>
        </html>
    );
}
