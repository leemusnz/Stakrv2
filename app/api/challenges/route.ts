import { NextRequest, NextResponse } from 'next/server'

// GET challenges with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Mock challenges data that matches our database schema
    const allChallenges = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '30-Day Fitness Challenge',
        description: 'Complete 30 minutes of exercise every day for 30 days',
        long_description: 'Transform your fitness routine with this comprehensive 30-day challenge. Whether you\'re a beginner or experienced athlete, this challenge will help you build consistency and see real results.',
        category: 'fitness',
        duration: '30 days',
        difficulty: 'medium',
        min_stake: 25.00,
        max_stake: 500.00,
        host_id: '550e8400-e29b-41d4-a716-446655440000',
        host_contribution: 100.00,
        entry_fee_percentage: 5.00,
        failed_stake_cut: 20.00,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        status: 'active',
        verification_type: 'photo',
        proof_requirements: {
          type: 'photo',
          description: 'Upload a photo showing your completed workout',
          required_frequency: 'daily'
        },
        rules: [
          'Complete at least 30 minutes of exercise daily',
          'Submit proof within 24 hours of workout',
          'Exercise can include running, gym, yoga, sports, etc.',
          'Rest days are allowed but must be declared in advance'
        ],
        participants_count: 47,
        total_stake_pool: 2350.00,
        created_at: '2023-12-15T10:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Read 12 Books Challenge',
        description: 'Read one book per month for a full year',
        long_description: 'Expand your mind and develop a consistent reading habit. Perfect for book lovers who want accountability and community support.',
        category: 'education',
        duration: '12 months',
        difficulty: 'easy',
        min_stake: 50.00,
        max_stake: 1000.00,
        host_id: '550e8400-e29b-41d4-a716-446655440001',
        host_contribution: 200.00,
        entry_fee_percentage: 5.00,
        failed_stake_cut: 20.00,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        status: 'active',
        verification_type: 'manual',
        proof_requirements: {
          type: 'text',
          description: 'Write a brief summary or review of the book you completed',
          required_frequency: 'monthly'
        },
        rules: [
          'Complete one book per month (minimum 200 pages)',
          'Submit book summary by the last day of each month',
          'Fiction and non-fiction both count',
          'Audiobooks are acceptable'
        ],
        participants_count: 23,
        total_stake_pool: 1450.00,
        created_at: '2023-12-10T14:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Daily Meditation Practice',
        description: '10 minutes of meditation every day for 21 days',
        long_description: 'Build a sustainable meditation practice that will reduce stress and improve focus. Perfect for beginners and experienced practitioners alike.',
        category: 'wellness',
        duration: '21 days',
        difficulty: 'easy',
        min_stake: 15.00,
        max_stake: 200.00,
        host_id: '550e8400-e29b-41d4-a716-446655440000',
        host_contribution: 50.00,
        entry_fee_percentage: 5.00,
        failed_stake_cut: 20.00,
        start_date: '2024-01-15T00:00:00Z',
        end_date: '2024-02-05T23:59:59Z',
        status: 'active',
        verification_type: 'app_sync',
        proof_requirements: {
          type: 'app_integration',
          description: 'Connect with Headspace, Calm, or similar meditation app',
          required_frequency: 'daily'
        },
        rules: [
          'Meditate for at least 10 minutes daily',
          'Use a supported meditation app for automatic tracking',
          'Guided or unguided meditation both count',
          'Missed days can be made up within 48 hours'
        ],
        participants_count: 89,
        total_stake_pool: 3560.00,
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        title: 'Learn Spanish in 90 Days',
        description: 'Complete daily Spanish lessons and reach conversational level',
        long_description: 'Master Spanish fundamentals through daily practice and structured learning. Includes conversation practice and cultural immersion activities.',
        category: 'education',
        duration: '90 days',
        difficulty: 'hard',
        min_stake: 100.00,
        max_stake: 2000.00,
        host_id: '550e8400-e29b-41d4-a716-446655440001',
        host_contribution: 500.00,
        entry_fee_percentage: 5.00,
        failed_stake_cut: 20.00,
        start_date: '2024-02-01T00:00:00Z',
        end_date: '2024-05-01T23:59:59Z',
        status: 'upcoming',
        verification_type: 'test',
        proof_requirements: {
          type: 'assessment',
          description: 'Weekly quizzes and final conversation test',
          required_frequency: 'weekly'
        },
        rules: [
          'Complete daily lessons on approved language apps',
          'Submit weekly quiz results',
          'Participate in live conversation sessions',
          'Pass final speaking assessment'
        ],
        participants_count: 0,
        total_stake_pool: 0.00,
        created_at: '2024-01-20T11:00:00Z',
        updated_at: '2024-01-20T11:00:00Z'
      }
    ]
    
    // Filter challenges based on query parameters
    let filteredChallenges = allChallenges
    
    if (category) {
      filteredChallenges = filteredChallenges.filter(c => c.category === category)
    }
    
    if (status !== 'all') {
      filteredChallenges = filteredChallenges.filter(c => c.status === status)
    }
    
    // Apply limit
    filteredChallenges = filteredChallenges.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      challenges: filteredChallenges,
      count: filteredChallenges.length,
      total_available: allChallenges.length,
      filters_applied: { category, status, limit },
      message: 'Challenges retrieved successfully'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get challenges',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// CREATE new challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      duration,
      difficulty,
      min_stake,
      max_stake,
      host_contribution,
      start_date,
      end_date,
      verification_type,
      rules
    } = body
    
    // Validate required fields
    if (!title || !description || !category || !duration || !difficulty) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, description, category, duration, difficulty'
      }, { status: 400 })
    }
    
    if (!min_stake || !max_stake || min_stake > max_stake) {
      return NextResponse.json({
        success: false,
        error: 'Invalid stake amounts: min_stake must be less than max_stake'
      }, { status: 400 })
    }
    
    // Create new challenge (mock data)
    const newChallenge = {
      id: crypto.randomUUID(),
      title,
      description,
      long_description: description, // Could be expanded
      category,
      duration,
      difficulty,
      min_stake: parseFloat(min_stake),
      max_stake: parseFloat(max_stake),
      host_id: '550e8400-e29b-41d4-a716-446655440000', // Mock host ID
      host_contribution: parseFloat(host_contribution || '0'),
      entry_fee_percentage: 5.00,
      failed_stake_cut: 20.00,
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      verification_type: verification_type || 'manual',
      proof_requirements: {
        type: verification_type || 'manual',
        description: 'Submit proof of completion',
        required_frequency: 'daily'
      },
      rules: rules || ['Complete the challenge requirements', 'Submit proof as required'],
      participants_count: 0,
      total_stake_pool: 0.00,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      challenge: newChallenge,
      message: 'Challenge created successfully',
      note: 'This is mock data. Will be replaced with real database insert.'
    }, { status: 201 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create challenge',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 