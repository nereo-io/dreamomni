const mockQwenModelFactory = jest.fn((modelId: string) => ({ modelId }));

jest.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: jest.fn(() => mockQwenModelFactory),
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

import { generateText } from 'ai';
import { optimizeVideoPrompt } from '@/services/promptOptimization';

describe('optimizeVideoPrompt', () => {
  const mockGenerateText = generateText as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateText.mockResolvedValue({ text: ' optimized prompt ' });
  });

  it('uses qwen3-vl-flash for image prompt optimization', async () => {
    const result = await optimizeVideoPrompt(
      'make this cinematic',
      'veo3',
      'https://example.com/input.png'
    );

    expect(result).toBe('optimized prompt');
    expect(mockQwenModelFactory).toHaveBeenCalledWith('qwen3-vl-flash');
  });

  it('keeps qwen-plus-latest for text-only prompt optimization', async () => {
    const result = await optimizeVideoPrompt('make this cinematic', 'veo3');

    expect(result).toBe('optimized prompt');
    expect(mockQwenModelFactory).toHaveBeenCalledWith('qwen-plus-latest');
  });
});
