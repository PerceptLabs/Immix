import { NextRequest, NextResponse } from 'next/server';
import { generateStream } from '@/server/llama/model';
import pb from '@/server/pb';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function agentChatCore(token: string | undefined, body: any) {
    pb.authStore.loadFromCookie(token || '');

    const { conversationId, messages, params } = body;

    // Persist the last user message to PB if not already stored.
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === 'user') {
        const data = {
            conversation: conversationId,
            role: 'user',
            content: lastUserMessage.content,
        };
        await pb.collection('messages').create(data);
    }


    // Create a prompt from the messages
    const prompt = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');

    const stream = await generateStream(prompt, params);

    // After the stream is complete, persist the assistant message to PB.
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let assistantResponse = '';

    const newStream = new ReadableStream({
        async start(controller) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.text) {
                            assistantResponse += data.text;
                        }
                    }
                }
                controller.enqueue(value);
            }

            const data = {
                conversation: conversationId,
                role: 'assistant',
                content: assistantResponse,
            };
            await pb.collection('messages').create(data);

            // After creating a message, update the lastActivity of the conversation
            const conversation = await pb.collection('conversations').getOne(conversationId);
            await pb.collection('conversations').update(conversation.id, {
                lastActivity: new Date().toISOString(),
            });

            controller.close();
        }
    });

    return new Response(newStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('pb_auth')?.value;
    const body = await request.json();
    return await agentChatCore(token, body);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate chat stream' }, { status: 500 });
  }
}
