import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';
import { sanitizeInput } from '@/lib/security';
import { validateContent } from '@/lib/profanity';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// GET - Fetch comments for a post
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const postId = params.id;

        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
        *,
        user:users(id, username, avatar)
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
        }

        return NextResponse.json({ comments: comments || [] });
    } catch (error) {
        console.error('Fetch comments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create comment
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const postId = params.id;
        const body = await request.json();
        const content = sanitizeInput(body.content);

        if (!content || content.length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Validate content
        const contentCheck = validateContent(content);
        if (!contentCheck.valid) {
            return NextResponse.json({ error: contentCheck.error }, { status: 400 });
        }

        // Create comment
        const { data: comment, error } = await supabase
            .from('comments')
            .insert([{ user_id: decoded.userId, post_id: postId, content }])
            .select(`
        *,
        user:users(id, username, avatar)
      `)
            .single();

        if (error || !comment) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
        }

        return NextResponse.json({ comment });
    } catch (error) {
        console.error('Create comment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
