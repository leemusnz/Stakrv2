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
        // Use real OpenAI if key present; otherwise return deterministic fallback
        const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
        if (apiKey) {
          const url = 'https://api.openai.com/v1/chat/completions'
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(_args),
          })
          if (!res.ok) {
            const text = await res.text()
            throw new Error(`OpenAI HTTP ${res.status}: ${text}`)
          }
          const json = await res.json()
          return json
        }
        // Fallback minimal response
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  dailyRequirement: 'Complete declared daily task',
                  activityType: ['general'],
                  measurementType: 'completion',
                  durationType: 'daily',
                  validationMethod: 'manual',
                  recommendedProofTypes: ['photo', 'text'],
                  evidenceRequirements: [],
                  designRecommendations: [],
                  riskFactors: [],
                  interpretation: 'Daily requirement derived from description',
                  confidence: 75,
                }),
              },
            },
          ],
        }
      },
    },
  },
}


