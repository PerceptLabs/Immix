import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const modelsDir = path.resolve(process.cwd(), './models');

  try {
    const files = fs.readdirSync(modelsDir);
    const models = files
      .filter(file => file.endsWith('.gguf'))
      .map(file => {
        const stats = fs.statSync(path.join(modelsDir, file));
        return {
          name: file,
          path: path.join('./models', file),
          size: stats.size,
        };
      });

    return NextResponse.json(models);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // The models directory does not exist.
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: 'Failed to list models' }, { status: 500 });
  }
}
