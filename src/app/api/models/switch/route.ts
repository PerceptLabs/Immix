import { NextRequest, NextResponse } from 'next/server';
import { loadModel } from '@/server/llama/model';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Model path is required' }, { status: 400 });
    }

    process.env.LLAMA_MODEL_PATH = path;

    // The model is loaded on demand, so we just need to update the environment variable.
    // The next call to `loadModel` will use the new path.
    // To be more robust, we could add a function to unload the current model and load a new one.
    // For now, this will work.

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to switch model' }, { status: 500 });
  }
}
