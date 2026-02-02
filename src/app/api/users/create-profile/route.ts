import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';
import { sanitizeInput } from '@/lib/security';
import { validateContent } from '@/lib/profanity';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request: NextRequest) {
    try {
        // Get token from headers
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify JWT
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const username = sanitizeInput(body.username);
        const bio = sanitizeInput(body.bio || '');

        // Validate username (already checked in check-username, but double-check)
        const usernameCheck = validateContent(username);
        if (!usernameCheck.valid) {
            return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
        }

        // Validate bio
        if (bio) {
            const bioCheck = validateContent(bio);
            if (!bioCheck.valid) {
                return NextResponse.json({ error: bioCheck.error }, { status: 400 });
            }
        }

        // Update user profile
        const { data: user, error } = await supabase
            .from('users')
            .update({ username, bio })
            .eq('id', decoded.userId)
            .select()
            .single();

        if (error || !user) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
        }

        // Remove password hash from response
        const { password_hash, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Create profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
