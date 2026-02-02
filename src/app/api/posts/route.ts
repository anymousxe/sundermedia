import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';
import { sanitizeInput } from '@/lib/security';
import { validateContent } from '@/lib/profanity';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// GET - Fetch all posts
export async function GET(request: NextRequest) {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
        *,
        user:users(id, username, avatar)
      `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
        }

        // Count likes for each post
        const postsWithLikes = await Promise.all(
            (posts || []).map(async (post) => {
                const { count } = await supabase
                    .from('likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                return { ...post, likes: count || 0 };
            })
        );

        return NextResponse.json({ posts: postsWithLikes });
    } catch (error) {
        console.error('Fetch posts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new post
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const content = sanitizeInput(body.content);
        const images = body.images || [];

        if (!content || content.length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Validate content
        const contentCheck = validateContent(content);
        if (!contentCheck.valid) {
            return NextResponse.json({ error: contentCheck.error }, { status: 400 });
        }

        // Create post
        const { data: post, error } = await supabase
            .from('posts')
            .insert([{ user_id: decoded.userId, content, images }])
            .select()
            .single();

        if (error || !post) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
        }

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Create post error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
