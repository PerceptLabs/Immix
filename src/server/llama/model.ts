import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import path from 'path';

let model: LlamaModel;

export async function loadModel() {
  if (model) {
    return model;
  }

  const modelPath = path.resolve(process.cwd(), process.env.LLAMA_MODEL_PATH || '');
  model = new LlamaModel({
    modelPath,
  });

  return model;
}

export async function generateStream(prompt: string, params: any) {
  const model = await loadModel();
  const context = new LlamaContext({ model });
  const session = new LlamaChatSession({ context });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const q = prompt;
        session.prompt(q, {
          onToken(chunk) {
            controller.enqueue(
              `data: ${JSON.stringify({ text: model.decode(chunk) })}\n\n`
            );
          },
        });

        await session.getChatHistory();

        controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);
        controller.close();
      } catch (error) {
        console.error('Error during stream generation:', error);
        controller.enqueue(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        controller.close();
      }
    },
  });

  return stream;
}
