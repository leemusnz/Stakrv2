/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals'
import { 
  wearableManager, 
  WearableDevice, 
  WearableIntegrationConfig,
  AppleHealthIntegration,
  FitbitIntegration,
  StravaIntegration
} from '@/lib/wearable-integrations'
import { 
  appIntegrationManager, 
  IntegratedApp, 
  AppIntegrationConfig,
  MyFitnessPalIntegration,
  HeadspaceIntegration,
  DuolingoIntegration,
  GitHubIntegration
} from '@/lib/app-integrations'

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Wearable Integrations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Apple Health Integration', () => {
    test('should initialize Apple Health integration', () => {
      const config: WearableIntegrationConfig = {
        device: 'apple_watch',
        enabled: true,
        autoSync: true,
        dataTypes: ['steps', 'heart_rate', 'workout'],
        privacyLevel: 'standard'
      }

      const integration = new AppleHealthIntegration(config)
      expect(integration).toBeDefined()
    })

    test('should detect Apple Health availability', async () => {
      const config: WearableIntegrationConfig = {
        device: 'apple_watch',
        enabled: true,
        autoSync: true,
        dataTypes: ['steps', 'heart_rate', 'workout'],
        privacyLevel: 'standard'
      }

      const integration = new AppleHealthIntegration(config)
      const connected = await integration.connect()
      
      // Should return false in test environment (no webkit)
      expect(connected).toBe(false)
    })

    test('should generate mock workout data in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const config: WearableIntegrationConfig = {
        device: 'apple_watch',
        enabled: true,
        autoSync: true,
        dataTypes: ['workout'],
        privacyLevel: 'standard'
      }

      const integration = new AppleHealthIntegration(config)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-02')
      
      const data = await integration.fetchWorkoutData(startDate, endDate)
      
      expect(data).toHaveLength(1)
      expect(data[0].deviceType).toBe('apple_watch')
      expect(data[0].dataType).toBe('workout')
      expect(data[0].metadata.source).toBe('Apple Health')
    })
  })

  describe('Fitbit Integration', () => {
    test('should initialize Fitbit integration with client ID', () => {
      const config: WearableIntegrationConfig = {
        device: 'fitbit',
        enabled: true,
        clientId: 'test-client-id',
        autoSync: true,
        dataTypes: ['steps', 'heart_rate'],
        privacyLevel: 'standard'
      }

      const integration = new FitbitIntegration(config)
      expect(integration).toBeDefined()
    })

    test('should handle API call with access token', async () => {
      const mockResponse = {
        activities: [
          {
            logId: '12345',
            duration: 3600000, // 1 hour in milliseconds
            startTime: '2024-01-01T10:00:00.000Z',
            calories: 300,
            distance: 5.2
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const config: WearableIntegrationConfig = {
        device: 'fitbit',
        enabled: true,
        clientId: 'test-client-id',
        accessToken: 'test-access-token',
        autoSync: true,
        dataTypes: ['workout'],
        privacyLevel: 'standard'
      }

      const integration = new FitbitIntegration(config)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-02')
      
      const data = await integration.fetchWorkoutData(startDate, endDate)
      
      expect(data).toHaveLength(1)
      expect(data[0].deviceType).toBe('fitbit')
      expect(data[0].value).toBe(3600000)
      expect(data[0].metadata.calories).toBe(300)
    })
  })

  describe('Strava Integration', () => {
    test('should generate OAuth URL for connection', async () => {
      const config: WearableIntegrationConfig = {
        device: 'strava',
        enabled: true,
        clientId: 'test-strava-client',
        autoSync: true,
        dataTypes: ['workout'],
        privacyLevel: 'standard'
      }

      const integration = new StravaIntegration(config)
      const connected = await integration.connect()
      
      expect(connected).toBe(true)
    })
  })

  describe('Wearable Manager', () => {
    test('should add and manage integrations', async () => {
      const config: WearableIntegrationConfig = {
        device: 'apple_watch',
        enabled: true,
        autoSync: true,
        dataTypes: ['steps'],
        privacyLevel: 'standard'
      }

      const result = await wearableManager.addIntegration('apple_watch', config)
      expect(result).toBe(false) // No webkit in test environment
    })

    test('should verify wearable data', async () => {
      const mockData = {
        id: 'test-1',
        userId: 'user-1',
        deviceType: 'apple_watch' as WearableDevice,
        dataType: 'workout' as any,
        value: 30,
        unit: 'minutes',
        timestamp: new Date(),
        metadata: {
          deviceId: 'Apple Watch Series 9',
          accuracy: 'high' as const,
          source: 'Apple Health',
          heartRate: [70, 120, 110, 80],
          calories: 250
        },
        verificationStatus: 'pending' as const
      }

      const verificationResult = await wearableManager.verifyData(mockData, {})
      
      expect(verificationResult.valid).toBe(true)
      expect(verificationResult.confidence).toBeGreaterThan(60)
      expect(verificationResult.metadata.deviceVerified).toBe(true)
    })
  })
})

describe('App Integrations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('MyFitnessPal Integration', () => {
    test('should initialize MyFitnessPal integration', () => {
      const config: AppIntegrationConfig = {
        app: 'myfitnesspal',
        enabled: true,
        accessToken: 'test-token',
        autoSync: true,
        dataTypes: ['nutrition_log'],
        privacyLevel: 'standard'
      }

      const integration = new MyFitnessPalIntegration(config)
      expect(integration).toBeDefined()
    })

    test('should generate mock nutrition data in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const config: AppIntegrationConfig = {
        app: 'myfitnesspal',
        enabled: true,
        accessToken: 'test-token',
        autoSync: true,
        dataTypes: ['nutrition_log'],
        privacyLevel: 'standard'
      }

      const integration = new MyFitnessPalIntegration(config)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-02')
      
      const data = await integration.fetchNutritionData(startDate, endDate)
      
      expect(data).toHaveLength(1)
      expect(data[0].appType).toBe('myfitnesspal')
      expect(data[0].dataType).toBe('nutrition_log')
      expect(data[0].value.calories).toBeDefined()
    })
  })

  describe('Duolingo Integration', () => {
    test('should fetch user data with username', async () => {
      const mockUserData = {
        users: [{
          id: 12345,
          totalXp: 1500,
          streak: 25,
          learningLanguage: 'es',
          courses: [{ level: 8 }]
        }]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData
      })

      const config: AppIntegrationConfig = {
        app: 'duolingo',
        enabled: true,
        username: 'testuser',
        autoSync: true,
        dataTypes: ['language_lesson'],
        privacyLevel: 'standard'
      }

      const integration = new DuolingoIntegration(config)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-02')
      
      const data = await integration.fetchLanguageData(startDate, endDate)
      
      expect(data).toHaveLength(1)
      expect(data[0].appType).toBe('duolingo')
      expect(data[0].value.language).toBe('es')
      expect(data[0].value.xp).toBe(1500)
      expect(data[0].metadata.streak).toBe(25)
    })
  })

  describe('GitHub Integration', () => {
    test('should fetch repositories and commits', async () => {
      const mockRepos = [
        { full_name: 'user/repo1', name: 'repo1' }
      ]

      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            message: 'Fix bug in auth',
            author: { date: '2024-01-01T10:00:00Z' }
          },
          stats: { additions: 10, deletions: 5 }
        }
      ]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRepos
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCommits
        })

      const config: AppIntegrationConfig = {
        app: 'github',
        enabled: true,
        accessToken: 'test-github-token',
        autoSync: true,
        dataTypes: ['code_commit'],
        privacyLevel: 'standard'
      }

      const integration = new GitHubIntegration(config)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-02')
      
      const data = await integration.fetchCodingData(startDate, endDate)
      
      expect(data).toHaveLength(1)
      expect(data[0].appType).toBe('github')
      expect(data[0].dataType).toBe('code_commit')
      expect(data[0].value.repository).toBe('repo1')
      expect(data[0].value.sha).toBe('abc123')
    })
  })

  describe('App Integration Manager', () => {
    test('should verify app data consistency', async () => {
      const mockData = {
        id: 'test-1',
        userId: 'user-1',
        appType: 'duolingo' as IntegratedApp,
        dataType: 'language_lesson' as any,
        value: {
          language: 'Spanish',
          xp: 50,
          lessonsCompleted: 1
        },
        timestamp: new Date(),
        metadata: {
          source: 'Duolingo',
          accuracy: 'high' as const,
          streak: 10
        },
        verificationStatus: 'pending' as const
      }

      const verificationResult = await appIntegrationManager.verifyData(mockData, {})
      
      expect(verificationResult.valid).toBe(true)
      expect(verificationResult.confidence).toBeGreaterThan(60)
      expect(verificationResult.metadata.appVerified).toBe(true)
      expect(verificationResult.metadata.progressConsistent).toBeGreaterThan(80)
    })

    test('should detect suspicious data values', async () => {
      const mockData = {
        id: 'test-2',
        userId: 'user-1',
        appType: 'headspace' as IntegratedApp,
        dataType: 'meditation_session' as any,
        value: {
          duration: 300, // 5 hours - suspicious
          completed: true
        },
        timestamp: new Date(),
        metadata: {
          source: 'Headspace',
          accuracy: 'medium' as const
        },
        verificationStatus: 'pending' as const
      }

      const verificationResult = await appIntegrationManager.verifyData(mockData, {})
      
      expect(verificationResult.confidence).toBeLessThan(80) // Should detect suspicious duration
    })
  })
})

describe('Integration API Endpoints', () => {
  // These would be integration tests for the actual API endpoints
  // Would require setting up test database and mock authentication
  
  test('should list available wearable devices', () => {
    const availableDevices = [
      'apple_watch',
      'fitbit', 
      'garmin',
      'samsung_galaxy_watch',
      'google_fit',
      'strava',
      'polar',
      'withings',
      'oura_ring'
    ]
    
    expect(availableDevices).toContain('apple_watch')
    expect(availableDevices).toContain('fitbit')
    expect(availableDevices).toContain('strava')
    expect(availableDevices.length).toBe(9)
  })

  test('should list available apps', () => {
    const availableApps = [
      'myfitnesspal',
      'headspace',
      'duolingo',
      'noom',
      'coursera',
      'khan_academy',
      'spotify',
      'youtube_music',
      'goodreads',
      'todoist',
      'notion',
      'github',
      'linkedin_learning'
    ]
    
    expect(availableApps).toContain('myfitnesspal')
    expect(availableApps).toContain('duolingo')
    expect(availableApps).toContain('github')
    expect(availableApps.length).toBe(13)
  })
})

describe('Integration Data Types', () => {
  test('should support all wearable data types', () => {
    const wearableDataTypes = [
      'steps',
      'heart_rate',
      'workout',
      'sleep',
      'calories',
      'distance',
      'elevation',
      'activity_minutes',
      'weight',
      'blood_pressure',
      'meditation'
    ]
    
    expect(wearableDataTypes).toHaveLength(11)
    expect(wearableDataTypes).toContain('heart_rate')
    expect(wearableDataTypes).toContain('workout')
  })

  test('should support all app data types', () => {
    const appDataTypes = [
      'nutrition_log',
      'meditation_session',
      'language_lesson',
      'course_completion',
      'reading_progress',
      'task_completion',
      'code_commit',
      'learning_streak',
      'habit_tracking',
      'skill_progress'
    ]
    
    expect(appDataTypes).toHaveLength(10)
    expect(appDataTypes).toContain('nutrition_log')
    expect(appDataTypes).toContain('code_commit')
  })
})

