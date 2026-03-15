import React from 'react'
import '@testing-library/jest-dom'

// Set NODE_ENV to test for proper conditional logic in APIs
process.env.NODE_ENV = 'test'

// Ensure React.act is available for testing library
if (typeof React.act !== 'function') {
  React.act = async (fn) => {
    return fn()
  }
}

// Polyfill TextEncoder/TextDecoder for jsdom environment (needed by postal-mime and other libs)
const { TextEncoder, TextDecoder } = require('util')
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder
}

// Polyfill TransformStream for jsdom environment
const { TransformStream, ReadableStream, WritableStream } = require('stream/web')
if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = TransformStream
}
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream
}
if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = WritableStream
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock next-auth server module to avoid ESM/jose imports in tests
const mockGetServerSession = jest.fn(async () => ({ user: { id: 'test-user', email: 'test@example.com' } }))
jest.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}))

// Also mock next-auth/next for compatibility with tests that import from there
jest.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSession,
}))

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => 'https://mock-presigned-url.com'),
}))

// Mock database
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => jest.fn()),
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.fetch
global.fetch = jest.fn()

// Polyfill minimal Web Request/Response to satisfy next/server import in tests
if (typeof global.Request === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // @ts-ignore
  global.Request = function () {}
}
if (typeof global.Response === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // @ts-ignore
  global.Response = function () {}
}

// Mock next/server primitives for API route unit tests
jest.mock('next/server', () => {
  class MockNextRequest {
    constructor(input, init = {}) {
      this.url = String(input)
      this.nextUrl = new URL(this.url)
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers || {})
      this._body = init.body
    }
    async json() {
      if (!this._body) return undefined
      if (typeof this._body === 'string') return JSON.parse(this._body)
      return this._body
    }
    async text() {
      if (typeof this._body === 'string') return this._body
      return this._body ? JSON.stringify(this._body) : ''
    }
  }

  class MockNextResponse {
    constructor(body, init = {}) {
      this.status = init.status ?? 200
      this.headers = new Headers(init.headers || {})
      this._body = body
    }
    static json(body, init = {}) {
      const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) }
      return new MockNextResponse(body, { ...init, headers })
    }
    async json() {
      if (typeof this._body === 'string') {
        try { return JSON.parse(this._body) } catch { return this._body }
      }
      return this._body
    }
    async arrayBuffer() {
      if (this._body instanceof Uint8Array) {
        return this._body.buffer.slice(this._body.byteOffset, this._body.byteOffset + this._body.byteLength)
      }
      if (this._body instanceof ArrayBuffer) return this._body
      if (typeof this._body === 'string') {
        return new TextEncoder().encode(this._body).buffer
      }
      return new TextEncoder().encode(JSON.stringify(this._body ?? {})).buffer
    }
  }

  // Make instanceof checks pass
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.Response = MockNextResponse

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse }
})

// Suppress console errors in tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
