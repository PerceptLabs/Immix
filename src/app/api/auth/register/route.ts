import { NextRequest, NextResponse } from 'next/server';
import pb from '@/server/pb';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const record = await pb.collection('users').create(data);

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to register' }, { status: 400 });
  }
}
