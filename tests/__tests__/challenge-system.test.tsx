import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Challenge Creation Component for testing
const ChallengeCreationComponent = () => {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [stake, setStake] = React.useState('')
  const [duration, setDuration] = React.useState('7')
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !description || !stake) {
      setError('All fields are required')
      return
    }

    if (parseFloat(stake) < 1) {
      setError('Minimum stake is $1')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Simulate successful creation
      setSuccess(true)
      setTitle('')
      setDescription('')
      setStake('')
      
    } catch (err) {
      setError('Failed to create challenge')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div data-testid="challenge-creation">
      <h2>Create Challenge</h2>
      
      {error && (
        <div data-testid="creation-error" className="error">
          {error}
        </div>
      )}
      
      {success && (
        <div data-testid="creation-success" className="success">
          Challenge created successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit} data-testid="creation-form">
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="title-input"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="description-input"
            required
          />
        </div>
        
        <div>
          <label htmlFor="stake">Stake Amount ($)</label>
          <input
            id="stake"
            type="number"
            min="1"
            step="0.01"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            data-testid="stake-input"
            required
          />
        </div>
        
        <div>
          <label htmlFor="duration">Duration (days)</label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            data-testid="duration-select"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isCreating}
          data-testid="create-button"
        >
          {isCreating ? 'Creating...' : 'Create Challenge'}
        </button>
      </form>
    </div>
  )
}

// Challenge Joining Component for testing
const ChallengeJoiningComponent = () => {
  const [challengeId, setChallengeId] = React.useState('')
  const [isJoining, setIsJoining] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleJoin = async () => {
    if (!challengeId) {
      setError('Challenge ID is required')
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Simulate successful join
      setSuccess(true)
      setChallengeId('')
      
    } catch (err) {
      setError('Failed to join challenge')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div data-testid="challenge-joining">
      <h2>Join Challenge</h2>
      
      {error && (
        <div data-testid="join-error" className="error">
          {error}
        </div>
      )}
      
      {success && (
        <div data-testid="join-success" className="success">
          Successfully joined challenge!
        </div>
      )}
      
      <div>
        <label htmlFor="challenge-id">Challenge ID</label>
        <input
          id="challenge-id"
          type="text"
          value={challengeId}
          onChange={(e) => setChallengeId(e.target.value)}
          data-testid="challenge-id-input"
          placeholder="Enter challenge ID"
        />
      </div>
      
      <button
        onClick={handleJoin}
        disabled={isJoining}
        data-testid="join-button"
      >
        {isJoining ? 'Joining...' : 'Join Challenge'}
      </button>
    </div>
  )
}

// Proof Submission Component for testing
const ProofSubmissionComponent = () => {
  const [proofText, setProofText] = React.useState('')
  const [proofImage, setProofImage] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProofImage(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!proofText.trim()) {
      setError('Proof description is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Simulate successful submission
      setSuccess(true)
      setProofText('')
      setProofImage(null)
      
    } catch (err) {
      setError('Failed to submit proof')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div data-testid="proof-submission">
      <h2>Submit Proof</h2>
      
      {error && (
        <div data-testid="proof-error" className="error">
          {error}
        </div>
      )}
      
      {success && (
        <div data-testid="proof-success" className="success">
          Proof submitted successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit} data-testid="proof-form">
        <div>
          <label htmlFor="proof-text">Proof Description</label>
          <textarea
            id="proof-text"
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            data-testid="proof-text-input"
            placeholder="Describe how you completed the challenge..."
            required
          />
        </div>
        
        <div>
          <label htmlFor="proof-image">Proof Image (optional)</label>
          <input
            id="proof-image"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            data-testid="proof-image-input"
          />
          {proofImage && (
            <div data-testid="selected-image">
              Selected: {proofImage.name}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-proof-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Proof'}
        </button>
      </form>
    </div>
  )
}

// Challenge Completion Component for testing
const ChallengeCompletionComponent = () => {
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [completionStatus, setCompletionStatus] = React.useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [reward, setReward] = React.useState<number | null>(null)

  const handleComplete = async () => {
    setIsCompleting(true)
    setCompletionStatus('pending')
    
    try {
      // Simulate completion process with shorter delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Simulate approval
      setCompletionStatus('approved')
      setReward(25.50) // Example reward amount
      
    } catch (err) {
      setCompletionStatus('rejected')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div data-testid="challenge-completion">
      <h2>Complete Challenge</h2>
      
      {completionStatus === 'pending' && (
        <div data-testid="completion-pending">
          Processing completion...
        </div>
      )}
      
      {completionStatus === 'approved' && (
        <div data-testid="completion-approved">
          <h3>Challenge Completed!</h3>
          <p>Congratulations! You've earned ${reward}</p>
        </div>
      )}
      
      {completionStatus === 'rejected' && (
        <div data-testid="completion-rejected">
          <h3>Proof Rejected</h3>
          <p>Your proof was not sufficient. Please try again.</p>
        </div>
      )}
      
      {(completionStatus === null || completionStatus === 'pending') && (
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          data-testid="complete-button"
        >
          {isCompleting ? 'Completing...' : 'Complete Challenge'}
        </button>
      )}
    </div>
  )
}

describe('Challenge System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Challenge Creation', () => {
    it('should render challenge creation form correctly', () => {
      render(<ChallengeCreationComponent />)
      
      expect(screen.getByTestId('challenge-creation')).toBeInTheDocument()
      expect(screen.getByTestId('creation-form')).toBeInTheDocument()
      expect(screen.getByTestId('title-input')).toBeInTheDocument()
      expect(screen.getByTestId('description-input')).toBeInTheDocument()
      expect(screen.getByTestId('stake-input')).toBeInTheDocument()
      expect(screen.getByTestId('duration-select')).toBeInTheDocument()
      expect(screen.getByTestId('create-button')).toBeInTheDocument()
    })

    it('should handle successful challenge creation', async () => {
      render(<ChallengeCreationComponent />)
      
      const titleInput = screen.getByTestId('title-input')
      const descriptionInput = screen.getByTestId('description-input')
      const stakeInput = screen.getByTestId('stake-input')
      const createButton = screen.getByTestId('create-button')
      
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Test Challenge' } })
        fireEvent.change(descriptionInput, { target: { value: 'Complete this test challenge' } })
        fireEvent.change(stakeInput, { target: { value: '10' } })
      })
      
      await act(async () => {
        fireEvent.click(createButton)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('creation-success')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('creation-success')).toHaveTextContent('Challenge created successfully!')
    })

    it('should validate required fields', async () => {
      render(<ChallengeCreationComponent />)
      
      const form = screen.getByTestId('creation-form')
      
      await act(async () => {
        fireEvent.submit(form)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('creation-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('creation-error')).toHaveTextContent('All fields are required')
    })

    it('should validate minimum stake amount', async () => {
      render(<ChallengeCreationComponent />)
      
      const titleInput = screen.getByTestId('title-input')
      const descriptionInput = screen.getByTestId('description-input')
      const stakeInput = screen.getByTestId('stake-input')
      const form = screen.getByTestId('creation-form')
      
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Test Challenge' } })
        fireEvent.change(descriptionInput, { target: { value: 'Complete this test challenge' } })
        fireEvent.change(stakeInput, { target: { value: '0.50' } })
      })
      
      await act(async () => {
        fireEvent.submit(form)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('creation-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('creation-error')).toHaveTextContent('Minimum stake is $1')
    })

    it('should disable submit button during creation', async () => {
      render(<ChallengeCreationComponent />)
      
      const titleInput = screen.getByTestId('title-input')
      const descriptionInput = screen.getByTestId('description-input')
      const stakeInput = screen.getByTestId('stake-input')
      const createButton = screen.getByTestId('create-button')
      
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Test Challenge' } })
        fireEvent.change(descriptionInput, { target: { value: 'Complete this test challenge' } })
        fireEvent.change(stakeInput, { target: { value: '10' } })
      })
      
      expect(createButton).not.toBeDisabled()
      
      await act(async () => {
        fireEvent.click(createButton)
      })
      
      expect(createButton).toBeDisabled()
      expect(createButton).toHaveTextContent('Creating...')
      
      await waitFor(() => {
        expect(createButton).not.toBeDisabled()
      })
    })
  })

  describe('Challenge Joining', () => {
    it('should render challenge joining form correctly', () => {
      render(<ChallengeJoiningComponent />)
      
      expect(screen.getByTestId('challenge-joining')).toBeInTheDocument()
      expect(screen.getByTestId('challenge-id-input')).toBeInTheDocument()
      expect(screen.getByTestId('join-button')).toBeInTheDocument()
    })

    it('should handle successful challenge joining', async () => {
      render(<ChallengeJoiningComponent />)
      
      const challengeIdInput = screen.getByTestId('challenge-id-input')
      const joinButton = screen.getByTestId('join-button')
      
      await act(async () => {
        fireEvent.change(challengeIdInput, { target: { value: 'challenge-123' } })
      })
      
      await act(async () => {
        fireEvent.click(joinButton)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('join-success')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('join-success')).toHaveTextContent('Successfully joined challenge!')
    })

    it('should validate challenge ID is required', async () => {
      render(<ChallengeJoiningComponent />)
      
      const joinButton = screen.getByTestId('join-button')
      
      await act(async () => {
        fireEvent.click(joinButton)
      })
      
      expect(screen.getByTestId('join-error')).toBeInTheDocument()
      expect(screen.getByTestId('join-error')).toHaveTextContent('Challenge ID is required')
    })

    it('should disable join button during joining process', async () => {
      render(<ChallengeJoiningComponent />)
      
      const challengeIdInput = screen.getByTestId('challenge-id-input')
      const joinButton = screen.getByTestId('join-button')
      
      await act(async () => {
        fireEvent.change(challengeIdInput, { target: { value: 'challenge-123' } })
      })
      
      expect(joinButton).not.toBeDisabled()
      
      await act(async () => {
        fireEvent.click(joinButton)
      })
      
      expect(joinButton).toBeDisabled()
      expect(joinButton).toHaveTextContent('Joining...')
      
      await waitFor(() => {
        expect(joinButton).not.toBeDisabled()
      })
    })
  })

  describe('Proof Submission', () => {
    it('should render proof submission form correctly', () => {
      render(<ProofSubmissionComponent />)
      
      expect(screen.getByTestId('proof-submission')).toBeInTheDocument()
      expect(screen.getByTestId('proof-form')).toBeInTheDocument()
      expect(screen.getByTestId('proof-text-input')).toBeInTheDocument()
      expect(screen.getByTestId('proof-image-input')).toBeInTheDocument()
      expect(screen.getByTestId('submit-proof-button')).toBeInTheDocument()
    })

    it('should handle successful proof submission', async () => {
      render(<ProofSubmissionComponent />)
      
      const proofTextInput = screen.getByTestId('proof-text-input')
      const submitButton = screen.getByTestId('submit-proof-button')
      
      await act(async () => {
        fireEvent.change(proofTextInput, { target: { value: 'I completed the challenge by doing X, Y, and Z' } })
      })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('proof-success')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('proof-success')).toHaveTextContent('Proof submitted successfully!')
    })

    it('should validate proof description is required', async () => {
      render(<ProofSubmissionComponent />)
      
      const form = screen.getByTestId('proof-form')
      
      await act(async () => {
        fireEvent.submit(form)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('proof-error')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('proof-error')).toHaveTextContent('Proof description is required')
    })

    it('should handle image file selection', async () => {
      render(<ProofSubmissionComponent />)
      
      const imageInput = screen.getByTestId('proof-image-input')
      const file = new File(['image'], 'proof.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(imageInput, { target: { files: [file] } })
      })
      
      expect(screen.getByTestId('selected-image')).toBeInTheDocument()
      expect(screen.getByTestId('selected-image')).toHaveTextContent('Selected: proof.jpg')
    })

    it('should disable submit button during submission', async () => {
      render(<ProofSubmissionComponent />)
      
      const proofTextInput = screen.getByTestId('proof-text-input')
      const submitButton = screen.getByTestId('submit-proof-button')
      
      await act(async () => {
        fireEvent.change(proofTextInput, { target: { value: 'I completed the challenge' } })
      })
      
      expect(submitButton).not.toBeDisabled()
      
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('Submitting...')
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Challenge Completion', () => {
    it('should render challenge completion component correctly', () => {
      render(<ChallengeCompletionComponent />)
      
      expect(screen.getByTestId('challenge-completion')).toBeInTheDocument()
      expect(screen.getByTestId('complete-button')).toBeInTheDocument()
    })

    it('should handle successful challenge completion', async () => {
      render(<ChallengeCompletionComponent />)
      
      const completeButton = screen.getByTestId('complete-button')
      
      await act(async () => {
        fireEvent.click(completeButton)
      })
      
      // Check loading state
      expect(screen.getByTestId('completion-pending')).toBeInTheDocument()
      
      // Wait for completion with shorter timeout
      await waitFor(() => {
        expect(screen.getByTestId('completion-approved')).toBeInTheDocument()
      }, { timeout: 500 })
      
      expect(screen.getByTestId('completion-approved')).toHaveTextContent('Challenge Completed!')
      expect(screen.getByTestId('completion-approved')).toHaveTextContent('You\'ve earned $25.5')
    })

    it('should disable complete button during completion process', async () => {
      render(<ChallengeCompletionComponent />)
      
      const completeButton = screen.getByTestId('complete-button')
      
      expect(completeButton).not.toBeDisabled()
      
      // Click the button and check if it's disabled
      await act(async () => {
        fireEvent.click(completeButton)
      })
      
      // The button should be disabled after clicking
      expect(completeButton).toBeDisabled()
      expect(completeButton).toHaveTextContent('Completing...')
    })

    it('should show completion status after process', async () => {
      render(<ChallengeCompletionComponent />)
      
      const completeButton = screen.getByTestId('complete-button')
      
      await act(async () => {
        fireEvent.click(completeButton)
      })
      
      // Wait for completion with shorter timeout
      await waitFor(() => {
        expect(screen.getByTestId('completion-approved')).toBeInTheDocument()
      }, { timeout: 500 })
      
      // Button should be hidden after completion
      expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument()
    })
  })
}) 