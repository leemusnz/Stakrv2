import { jest } from '@jest/globals'

describe('Basic Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle basic math operations', () => {
    expect(2 * 3).toBe(6)
    expect(10 / 2).toBe(5)
    expect(7 - 3).toBe(4)
  })

  it('should work with strings', () => {
    expect('hello' + ' world').toBe('hello world')
    expect('test'.length).toBe(4)
  })

  it('should work with arrays', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr[0]).toBe(1)
    expect(arr.includes(2)).toBe(true)
  })

  it('should work with objects', () => {
    const obj = { name: 'test', value: 42 }
    expect(obj.name).toBe('test')
    expect(obj.value).toBe(42)
    expect(Object.keys(obj)).toHaveLength(2)
  })
})
