import { jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const strictSqlFactory = (responses: any[]) => {
  let callIndex = 0

  return jest.fn((firstArg: unknown, ...rest: unknown[]) => {
    if (typeof firstArg === 'string' && rest.length > 0) {
      throw new Error('Neon tagged-template client does not support sql(query, params)')
    }

    const response = responses[callIndex++]
    return Promise.resolve(response)
  })
}

let mockSql: ReturnType<typeof strictSqlFactory>

jest.mock('@/lib/db', () => ({
  createDbConnection: () => mockSql,
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/demo-mode', () => ({
  shouldUseDemoData: jest.fn(() => false),
  createDemoResponse: jest.fn((data) => data),
}))

jest.mock('@/lib/demo-data', () => ({
  getDemoBrands: jest.fn(() => [{ id: 'demo-brand' }]),
  getDemoCreators: jest.fn(() => [{ id: 'demo-creator' }]),
}))

describe('Brands and creators API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('queries brands without falling back to demo data', async () => {
    mockSql = strictSqlFactory([
      [{ count: '1' }],
      [{ id: 'brand-1', name: 'Test Brand', followers: 25, categories: ['fitness'] }],
    ])

    const { GET } = await import('@/app/api/brands/route')
    const response = await GET(new NextRequest('http://localhost:3000/api/brands?category=fitness'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Brands retrieved successfully')
    expect(data.brands).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'brand-1', name: 'Test Brand' })]),
    )
  })

  it('queries creators without falling back to demo data', async () => {
    mockSql = strictSqlFactory([
      [{ count: '1' }],
      [{ id: 'creator-1', name: 'Test Creator', followers: 40, categories: ['fitness'] }],
    ])

    const { GET } = await import('@/app/api/creators/route')
    const response = await GET(new NextRequest('http://localhost:3000/api/creators?category=fitness'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Creators retrieved successfully')
    expect(data.creators).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'creator-1', name: 'Test Creator' })]),
    )
  })
})
