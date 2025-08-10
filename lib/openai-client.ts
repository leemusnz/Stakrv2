// Lightweight OpenAI client wrapper for both runtime and tests
// Tests will mock this module via jest.mock('@/lib/openai-client')

type ChatCompletionArgs = {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  max_tokens?: number
}

export const openai = {
  chat: {
    completions: {
      async create(_args: ChatCompletionArgs): Promise<any> {
        throw new Error('openai.chat.completions.create not mocked in tests and no runtime impl provided')
      },
    },
  },
}


