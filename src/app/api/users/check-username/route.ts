import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeInput } from '@/lib/security';
import { validateContent } from '@/lib/profanity';
import { MAX_USERNAME_LENGTH, USERNAME_REGEX } from '@/lib/constants';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = sanitizeInput(searchParams.get('username') || '');

        if (!username) {
            return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
        }

        if (username.length > MAX_USERNAME_LENGTH) {
            return NextResponse.json({
                available: false,
                error: `Username must be ${MAX_USERNAME_LENGTH} characters or less`,
            }, { status: 400 });
        }

        if (!USERNAME_REGEX.test(username)) {
            return NextResponse.json({
                available: false,
                error: 'Username can only contain letters, numbers, and underscores',
            }, { status: 400 });
        }

        // Check profanity
        const profanityCheck = validateContent(username);
        if (!profanityCheck.valid) {
            return NextResponse.json({
                available: false,
                error: profanityCheck.error,
            }, { status: 400 });
        }

        // Check if username already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return NextResponse.json({
                available: false,
                error: 'Username is already taken',
            });
        }

        return NextResponse.json({ available: true });
    } catch (error) {
        console.error('Username check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
