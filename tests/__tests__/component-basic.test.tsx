import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { jest } from '@jest/globals'

// Simple test component
const TestComponent = ({ title, children }: { title: string; children?: React.ReactNode }) => {
  return (
    <div data-testid="test-component">
      <h1 data-testid="title">{title}</h1>
      {children && <div data-testid="content">{children}</div>}
    </div>
  )
}

// Mock component with state
const CounterComponent = () => {
  const [count, setCount] = React.useState(0)
  
  return (
    <div data-testid="counter">
      <span data-testid="count">{count}</span>
      <button 
        data-testid="increment" 
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
    </div>
  )
}

describe('Basic Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Simple Component Rendering', () => {
    it('should render a basic component correctly', () => {
      render(<TestComponent title="Hello World" />)
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
      expect(screen.getByTestId('title')).toHaveTextContent('Hello World')
    })

    it('should render component with children', () => {
      render(
        <TestComponent title="Parent">
          <span data-testid="child">Child Content</span>
        </TestComponent>
      )
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
      expect(screen.getByTestId('title')).toHaveTextContent('Parent')
      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
    })

    it('should render component without children', () => {
      render(<TestComponent title="No Children" />)
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
      expect(screen.getByTestId('title')).toHaveTextContent('No Children')
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })

  describe('Component with State', () => {
    it('should render counter component with initial state', () => {
      render(<CounterComponent />)
      
      expect(screen.getByTestId('counter')).toBeInTheDocument()
      expect(screen.getByTestId('count')).toHaveTextContent('0')
      expect(screen.getByTestId('increment')).toBeInTheDocument()
    })

    it('should update state when button is clicked', async () => {
      render(<CounterComponent />)
      
      const incrementButton = screen.getByTestId('increment')
      const countDisplay = screen.getByTestId('count')
      
      expect(countDisplay).toHaveTextContent('0')
      
      await act(async () => {
        fireEvent.click(incrementButton)
      })
      
      expect(countDisplay).toHaveTextContent('1')
    })

    it('should handle multiple state updates', async () => {
      render(<CounterComponent />)
      
      const incrementButton = screen.getByTestId('increment')
      const countDisplay = screen.getByTestId('count')
      
      expect(countDisplay).toHaveTextContent('0')
      
      // Update state one by one to ensure each update is processed
      await act(async () => {
        fireEvent.click(incrementButton)
      })
      expect(countDisplay).toHaveTextContent('1')
      
      await act(async () => {
        fireEvent.click(incrementButton)
      })
      expect(countDisplay).toHaveTextContent('2')
      
      await act(async () => {
        fireEvent.click(incrementButton)
      })
      expect(countDisplay).toHaveTextContent('3')
    })
  })

  describe('Component Props', () => {
    it('should handle different prop values', () => {
      const { rerender } = render(<TestComponent title="First Title" />)
      
      expect(screen.getByTestId('title')).toHaveTextContent('First Title')
      
      rerender(<TestComponent title="Second Title" />)
      
      expect(screen.getByTestId('title')).toHaveTextContent('Second Title')
    })

    it('should handle empty string props', () => {
      render(<TestComponent title="" />)
      
      expect(screen.getByTestId('title')).toHaveTextContent('')
    })
  })
})
