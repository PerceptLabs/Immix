import { NextRequest, NextResponse } from 'next/server';
import pb from '@/server/pb';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    pb.authStore.loadFromCookie(cookieStore.get('pb_auth')?.value || '');

    const records = await pb.collection('conversations').getFullList({
      sort: '-lastActivity',
    });

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    pb.authStore.loadFromCookie(cookieStore.get('pb_auth')?.value || '');

    const { title } = await request.json();
    const userId = pb.authStore.model?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const data = {
      title,
      owner: userId,
      lastActivity: new Date().toISOString(),
    };

    const record = await pb.collection('conversations').create(data);

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 400 });
  }
}
