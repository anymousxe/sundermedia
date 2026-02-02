import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

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

        // Check if already liked
        const { data: existingLike } = await supabase
            .from('likes')
            .select('*')
            .eq('user_id', decoded.userId)
            .eq('post_id', postId)
            .single();

        if (existingLike) {
            // Unlike
            await supabase
                .from('likes')
                .delete()
                .eq('user_id', decoded.userId)
                .eq('post_id', postId);

            return NextResponse.json({ liked: false });
        } else {
            // Like
            await supabase
                .from('likes')
                .insert([{ user_id: decoded.userId, post_id: postId }]);

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error('Like error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
