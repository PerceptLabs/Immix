import { NextRequest, NextResponse } from 'next/server';
import pb from '@/server/pb';

export async function POST(request: NextRequest) {
  try {
    const { identity, password } = await request.json();

    const authData = await pb.collection('users').authWithPassword(identity, password);

    // After successful login, PocketBase returns a token.
    // We need to set this token in an HttpOnly cookie to be used for subsequent requests.
    const response = NextResponse.json({ ...authData });
    response.headers.set('Set-Cookie', pb.authStore.exportToCookie());

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to login' }, { status: 401 });
  }
}
