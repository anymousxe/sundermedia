import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// GET - Fetch all media
export async function GET() {
    try {
        const { data: media, error } = await supabase
            .from('media')
            .select(`
        *,
        user:users(id, username, avatar)
      `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
        }

        // Count likes and saves for each media
        const mediaWithCounts = await Promise.all(
            (media || []).map(async (item) => {
                const { count: likesCount } = await supabase
                    .from('media_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('media_id', item.id);

                const { count: savesCount } = await supabase
                    .from('saves')
                    .select('*', { count: 'exact', head: true })
                    .eq('media_id', item.id);

                return { ...item, likes: likesCount || 0, saves: savesCount || 0 };
            })
        );

        return NextResponse.json({ media: mediaWithCounts });
    } catch (error) {
        console.error('Fetch media error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create media (placeholder - implement file upload later)
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
        const { type, url, description } = body;

        if (!type || !url) {
            return NextResponse.json({ error: 'Type and URL are required' }, { status: 400 });
        }

        const { data: mediaItem, error } = await supabase
            .from('media')
            .insert([{ user_id: decoded.userId, type, url, description }])
            .select()
            .single();

        if (error || !mediaItem) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
        }

        return NextResponse.json({ media: mediaItem });
    } catch (error) {
        console.error('Create media error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
