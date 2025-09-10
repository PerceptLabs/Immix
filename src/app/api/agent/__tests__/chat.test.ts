import { describe, it, expect, vi } from 'vitest';
import { agentChatCore } from '../chat/route';

vi.mock('@/server/llama/model', () => {
  return {
    generateStream: vi.fn().mockImplementation(async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"text": "Hello"}\n\n'));
          controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
          controller.close();
        },
      });
      return stream;
    }),
  };
});

vi.mock('@/server/pb', () => {
    const mock = {
        collection: vi.fn().mockReturnThis(),
        create: vi.fn(),
        getOne: vi.fn().mockResolvedValue({ id: '123' }),
        update: vi.fn(),
        authStore: {
            loadFromCookie: vi.fn(),
            model: { id: '123' }
        }
    };
    return { default: mock };
});

describe('agentChatCore', () => {
  it('should return a streaming response', async () => {
    const body = {
        conversationId: '123',
        messages: [{ role: 'user', content: 'Hello' }],
    };
    const response = await agentChatCore('test-token', body);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
    }
    expect(result).toContain('data: {"text": "Hello"}');
    expect(result).toContain('data: {"done": true}');
  });
});
