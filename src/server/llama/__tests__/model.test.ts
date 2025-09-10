import { describe, it, expect, vi } from 'vitest';
import { loadModel } from '../model';

// Mock the node-llama-cpp module
vi.mock('node-llama-cpp', () => {
  return {
    LlamaModel: vi.fn().mockImplementation(() => {
      return {
        load: vi.fn(),
      };
    }),
    LlamaContext: vi.fn(),
    LlamaChatSession: vi.fn(),
  };
});

describe('Llama Model', () => {
  it('should load the model', async () => {
    process.env.LLAMA_MODEL_PATH = './models/llama3.1-8b.q4_k_m.gguf';
    const model = await loadModel();
    expect(model).toBeDefined();
  });
});
