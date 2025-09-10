import { NextRequest, NextResponse } from 'next/server';
import pb from '@/server/pb';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    pb.authStore.loadFromCookie(cookieStore.get('pb_auth')?.value || '');

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const records = await pb.collection('messages').getFullList({
      filter: `conversation = "${conversationId}"`,
      sort: 'created',
    });

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    pb.authStore.loadFromCookie(cookieStore.get('pb_auth')?.value || '');

    const data = await request.json();
    const record = await pb.collection('messages').create(data);

    // After creating a message, update the lastActivity of the conversation
    const conversation = await pb.collection('conversations').getOne(data.conversation);
    await pb.collection('conversations').update(conversation.id, {
        lastActivity: new Date().toISOString(),
    });

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 400 });
  }
}
