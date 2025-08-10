// Stakr Third-Party App Integration System
// Support for MyFitnessPal, Headspace, Duolingo, Noom, and more

export interface AppIntegrationData {
  id: string
  userId: string
  appType: IntegratedApp
  dataType: AppDataType
  value: any
  timestamp: Date
  metadata: {
    appVersion?: string
    sessionId?: string
    accuracy?: 'low' | 'medium' | 'high'
    source: string
    rawData?: any
    progress?: number
    streak?: number
    level?: number
    score?: number
  }
  verificationStatus: 'pending' | 'verified' | 'failed'
  challengeId?: string
  submissionId?: string
}

export type IntegratedApp = 
  | 'myfitnesspal'
  | 'headspace'
  | 'duolingo'
  | 'noom'
  | 'coursera'
  | 'khan_academy'
  | 'spotify'
  | 'youtube_music'
  | 'goodreads'
  | 'todoist'
  | 'notion'
  | 'github'
  | 'linkedin_learning'

export type AppDataType = 
  | 'nutrition_log'
  | 'meditation_session'
  | 'language_lesson'
  | 'course_completion'
  | 'reading_progress'
  | 'task_completion'
  | 'code_commit'
  | 'learning_streak'
  | 'habit_tracking'
  | 'skill_progress'

export interface AppIntegrationConfig {
  app: IntegratedApp
  enabled: boolean
  apiKey?: string
  accessToken?: string
  refreshToken?: string
  username?: string
  lastSync?: Date
  autoSync: boolean
  dataTypes: AppDataType[]
  privacyLevel: 'minimal' | 'standard' | 'detailed'
  webhookUrl?: string
}

export interface AppVerificationResult {
  valid: boolean
  confidence: number // 0-100
  reasons: string[]
  metadata: {
    appVerified: boolean
    dataAuthentic: boolean
    timelineValid: boolean
    progressConsistent: boolean
  }
}

// MyFitnessPal Integration
export class MyFitnessPalIntegration {
  private config: AppIntegrationConfig

  constructor(config: AppIntegrationConfig) {
    this.config = config
  }

  async connect(): Promise<boolean> {
    try {
      // MyFitnessPal uses Under Armour's API
      if (!this.config.accessToken) {
        console.log('🍎 MyFitnessPal OAuth required')
        return false
      }

      // Test connection
      const response = await fetch('https://api.ua.com/v7.1/user_profile_summary', {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Api-Key': this.config.apiKey || '',
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('MyFitnessPal connection failed:', error)
      return false
    }
  }

  async fetchNutritionData(startDate: Date, endDate: Date): Promise<AppIntegrationData[]> {
    if (!this.config.accessToken) {
      throw new Error('MyFitnessPal access token required')
    }

    try {
      // Fetch nutrition data from MyFitnessPal
      const dateStr = startDate.toISOString().split('T')[0]
      
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        return this.generateMockNutritionData(startDate, endDate)
      }

      // Real API implementation would go here
      return []
    } catch (error) {
      console.error('Failed to fetch MyFitnessPal data:', error)
      return []
    }
  }

  private generateMockNutritionData(startDate: Date, endDate: Date): AppIntegrationData[] {
    return [{
      id: `mfp_${Date.now()}`,
      userId: 'current-user',
      appType: 'myfitnesspal',
      dataType: 'nutrition_log',
      value: {
        meals: ['breakfast', 'lunch', 'dinner'],
        calories: 2150,
        protein: 120,
        carbs: 250,
        fat: 80
      },
      timestamp: new Date(),
      metadata: {
        appVersion: '23.14.0',
        source: 'MyFitnessPal API',
        accuracy: 'high',
        streak: 15
      },
      verificationStatus: 'pending'
    }]
  }
}

// Headspace Integration
export class HeadspaceIntegration {
  private config: AppIntegrationConfig

  constructor(config: AppIntegrationConfig) {
    this.config = config
  }

  async connect(): Promise<boolean> {
    try {
      // Headspace doesn't have a public API, so this would require:
      // 1. Email integration (parsing email reports)
      // 2. Screen time API (iOS/Android)
      // 3. Manual verification with screenshots
      
      console.log('🧘 Headspace integration via email/manual verification')
      return true
    } catch (error) {
      console.error('Headspace connection failed:', error)
      return false
    }
  }

  async fetchMeditationData(startDate: Date, endDate: Date): Promise<AppIntegrationData[]> {
    try {
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        return this.generateMockMeditationData(startDate, endDate)
      }

      // Real implementation would parse email reports or use manual verification
      return []
    } catch (error) {
      console.error('Failed to fetch Headspace data:', error)
      return []
    }
  }

  private generateMockMeditationData(startDate: Date, endDate: Date): AppIntegrationData[] {
    return [{
      id: `headspace_${Date.now()}`,
      userId: 'current-user',
      appType: 'headspace',
      dataType: 'meditation_session',
      value: {
        sessionType: 'focus',
        duration: 15,
        completed: true
      },
      timestamp: new Date(),
      metadata: {
        appVersion: '4.20.0',
        source: 'Headspace',
        accuracy: 'medium',
        streak: 7,
        sessionId: 'session_12345'
      },
      verificationStatus: 'pending'
    }]
  }
}

// Duolingo Integration
export class DuolingoIntegration {
  private config: AppIntegrationConfig

  constructor(config: AppIntegrationConfig) {
    this.config = config
  }

  async connect(): Promise<boolean> {
    try {
      if (!this.config.username) {
        console.log('🦉 Duolingo username required')
        return false
      }

      // Duolingo has an unofficial public API
      const response = await fetch(`https://www.duolingo.com/2017-06-30/users?username=${this.config.username}`)
      return response.ok
    } catch (error) {
      console.error('Duolingo connection failed:', error)
      return false
    }
  }

  async fetchLanguageData(startDate: Date, endDate: Date): Promise<AppIntegrationData[]> {
    if (!this.config.username) {
      throw new Error('Duolingo username required')
    }

    try {
      // Fetch from Duolingo's unofficial API
      const userResponse = await fetch(`https://www.duolingo.com/2017-06-30/users?username=${this.config.username}`)
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch Duolingo user data')
      }

      const userData = await userResponse.json()
      return this.parseDuolingoData(userData)
    } catch (error) {
      console.error('Failed to fetch Duolingo data:', error)
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return this.generateMockLanguageData(startDate, endDate)
      }
      
      return []
    }
  }

  private parseDuolingoData(userData: any): AppIntegrationData[] {
    const user = userData.users?.[0]
    if (!user) return []

    return [{
      id: `duolingo_${user.id}`,
      userId: 'current-user',
      appType: 'duolingo',
      dataType: 'language_lesson',
      value: {
        language: user.learningLanguage,
        xp: user.totalXp,
        lessonsCompleted: user.courses?.length || 0,
        currentStreak: user.streak
      },
      timestamp: new Date(),
      metadata: {
        source: 'Duolingo API',
        accuracy: 'high',
        streak: user.streak,
        level: user.courses?.[0]?.level || 1,
        rawData: user
      },
      verificationStatus: 'pending'
    }]
  }

  private generateMockLanguageData(startDate: Date, endDate: Date): AppIntegrationData[] {
    return [{
      id: `duolingo_mock_${Date.now()}`,
      userId: 'current-user',
      appType: 'duolingo',
      dataType: 'language_lesson',
      value: {
        language: 'Spanish',
        xp: 150,
        lessonsCompleted: 3,
        currentStreak: 12
      },
      timestamp: new Date(),
      metadata: {
        source: 'Duolingo',
        accuracy: 'high',
        streak: 12,
        level: 8
      },
      verificationStatus: 'pending'
    }]
  }
}

// Spotify Integration
export class SpotifyIntegration {
  private config: AppIntegrationConfig

  constructor(config: AppIntegrationConfig) {
    this.config = config
  }

  async connect(): Promise<boolean> {
    try {
      // If we have an access token, test the connection
      if (this.config.accessToken) {
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          console.log('🎵 Spotify connection verified')
          return true
        } else {
          console.log('🎵 Spotify token expired or invalid')
          return false
        }
      }

      // No access token - need OAuth flow
      console.log('🎵 Spotify OAuth flow required')
      return false
    } catch (error) {
      console.error('Spotify connection failed:', error)
      return false
    }
  }

  async fetchMusicData(startDate: Date, endDate: Date): Promise<AppIntegrationData[]> {
    if (!this.config.accessToken) {
      throw new Error('Spotify access token required')
    }

    try {
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        return this.generateMockMusicData(startDate, endDate)
      }

      // Real implementation would fetch listening history
      return []
    } catch (error) {
      console.error('Failed to fetch Spotify data:', error)
      return []
    }
  }

  private generateMockMusicData(startDate: Date, endDate: Date): AppIntegrationData[] {
    return [{
      id: `spotify_${Date.now()}`,
      userId: 'current-user',
      appType: 'spotify',
      dataType: 'habit_tracking',
      value: {
        tracksPlayed: 45,
        minutesListened: 180,
        podcasts: 3,
        mostPlayedGenre: 'Focus'
      },
      timestamp: new Date(),
      metadata: {
        source: 'Spotify',
        accuracy: 'high',
        streak: 12
      },
      verificationStatus: 'pending'
    }]
  }
}

// Noom Integration
export class NoomIntegration {
  private config: AppIntegrationConfig

  constructor(config: AppIntegrationConfig) {
    this.config = config
  }

  async connect(): Promise<boolean> {
    try {
      // Noom doesn't have a public API, manual verification
      console.log('⚖️ Noom integration via manual verification')
      return true
    } catch (error) {
      console.error('Noom connection failed:', error)
      return false
    }
  }

  async fetchNutritionData(startDate: Date, endDate: Date): Promise<AppIntegrationData[]> {
    // Mock data for development
    if (process.env.NODE_ENV === 'development') {
      return this.generateMockNoomData(startDate, endDate)
    }
    return []
  }

  private generateMockNoomData(startDate: Date, endDate: Date): AppIntegrationData[] {
    return [{
      id: `noom_${Date.now()}`,
      userId: 'current-user',
      appType: 'noom',
      dataType: 'nutrition_log',
      value: {
        calories: 1800,
        weightLog: true,
        mealLogged: 3
      },
      timestamp: new Date(),
      metadata: {
        source: 'Noom',
        accuracy: 'medium',
        streak: 8
      },
      verificationStatus: 'pending'
    }]
  }
}

// Todoist Integration
export class TodoistIntegration {
  private config: AppIntegrationConfig

  constructor(config: AppIntegrationConfig) {
    this.config = config
  }

  async connect(): Promise<boolean> {
    try {
      // In development mode, allow connection without API keys
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Todoist integration connected (development mode)')
        return true
      }

      if (!this.config.accessToken) {
        console.log('✅ Todoist API token required for production')
        return false
      }

      const response = await fetch('https://api.todoist.com/rest/v2/projects', {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Todoist connection failed:', error)
      return false
    }
  }

  async fetchTaskData(startDate: Date, endDate: Date): Promise<AppIntegrationData[]> {
    if (!this.config.accessToken) {
      throw new Error('Todoist access token required')
    }

    try {
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        return this.generateMockTodoistData(startDate, endDate)
      }

      // Real implementation would fetch completed tasks
      return []
    } catch (error) {
      console.error('Failed to fetch Todoist data:', error)
      return []
    }
  }

  private generateMockTodoistData(startDate: Date, endDate: Date): AppIntegrationData[] {
    return [{
      id: `todoist_${Date.now()}`,
      userId: 'current-user',
      appType: 'todoist',
      dataType: 'task_completion',
      value: {
        tasksCompleted: 8,
        karma: 250,
        streakDays: 5
      },
      timestamp: new Date(),
      metadata: {
        source: 'Todoist API',
        accuracy: 'high',
        streak: 5
      },
      verificationStatus: 'pending'
    }]
  }
}

// GitHub Integration
export class GitHubIntegration {
  private config: AppIntegrationConfig

  constructor(config: AppIntegrationConfig) {
    this.config = config
  }

  async connect(): Promise<boolean> {
    try {
      // In development mode, allow connection without API keys
      if (process.env.NODE_ENV === 'development') {
        console.log('🐙 GitHub integration connected (development mode)')
        return true
      }

      if (!this.config.accessToken) {
        console.log('🐙 GitHub access token required for production')
        return false
      }

      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'User-Agent': 'Stakr-Verification'
        }
      })

      return response.ok
    } catch (error) {
      console.error('GitHub connection failed:', error)
      return false
    }
  }

  async fetchCodingData(startDate: Date, endDate: Date): Promise<AppIntegrationData[]> {
    if (!this.config.accessToken) {
      throw new Error('GitHub access token required')
    }

    try {
      const since = startDate.toISOString()
      const until = endDate.toISOString()
      
      // Get user's repositories
      const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'User-Agent': 'Stakr-Verification'
        }
      })

      if (!reposResponse.ok) {
        throw new Error('Failed to fetch GitHub repositories')
      }

      const repos = await reposResponse.json()
      const commits: AppIntegrationData[] = []

      // Get commits from user's repositories
      for (const repo of repos.slice(0, 10)) { // Limit to 10 repos for performance
        try {
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/commits?since=${since}&until=${until}`,
            {
              headers: {
                'Authorization': `token ${this.config.accessToken}`,
                'User-Agent': 'Stakr-Verification'
              }
            }
          )

          if (commitsResponse.ok) {
            const repoCommits = await commitsResponse.json()
            commits.push(...this.parseGitHubCommits(repoCommits, repo.name))
          }
        } catch (error) {
          console.warn(`Failed to fetch commits for ${repo.name}:`, error)
        }
      }

      return commits
    } catch (error) {
      console.error('Failed to fetch GitHub data:', error)
      return []
    }
  }

  private parseGitHubCommits(commits: any[], repoName: string): AppIntegrationData[] {
    return commits.map((commit: any) => ({
      id: `github_${commit.sha}`,
      userId: 'current-user',
      appType: 'github' as IntegratedApp,
      dataType: 'code_commit' as AppDataType,
      value: {
        repository: repoName,
        message: commit.commit.message,
        sha: commit.sha,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0
      },
      timestamp: new Date(commit.commit.author.date),
      metadata: {
        source: 'GitHub API',
        accuracy: 'high',
        rawData: commit
      },
      verificationStatus: 'pending'
    }))
  }
}

// Add remaining app integrations with basic implementations
export class CourseraIntegration {
  private config: AppIntegrationConfig
  constructor(config: AppIntegrationConfig) { this.config = config }
  async connect(): Promise<boolean> {
    console.log('🎓 Coursera integration via manual verification')
    return true
  }
}

export class KhanAcademyIntegration {
  private config: AppIntegrationConfig
  constructor(config: AppIntegrationConfig) { this.config = config }
  async connect(): Promise<boolean> {
    console.log('📚 Khan Academy integration via manual verification')
    return true
  }
}

export class YouTubeMusicIntegration {
  private config: AppIntegrationConfig
  constructor(config: AppIntegrationConfig) { this.config = config }
  async connect(): Promise<boolean> {
    console.log('🎶 YouTube Music integration via manual verification')
    return true
  }
}

export class GoodreadsIntegration {
  private config: AppIntegrationConfig
  constructor(config: AppIntegrationConfig) { this.config = config }
  async connect(): Promise<boolean> {
    console.log('📖 Goodreads integration via manual verification')
    return true
  }
}

export class NotionIntegration {
  private config: AppIntegrationConfig
  constructor(config: AppIntegrationConfig) { this.config = config }
  async connect(): Promise<boolean> {
    console.log('📝 Notion integration via manual verification')
    return true
  }
}

export class LinkedInLearningIntegration {
  private config: AppIntegrationConfig
  constructor(config: AppIntegrationConfig) { this.config = config }
  async connect(): Promise<boolean> {
    console.log('💼 LinkedIn Learning integration via manual verification')
    return true
  }
}

// Main App Integration Manager
export class AppIntegrationManager {
  private integrations: Map<IntegratedApp, any> = new Map()
  private configs: Map<IntegratedApp, AppIntegrationConfig> = new Map()

  constructor() {
    this.initializeIntegrations()
  }

  private initializeIntegrations() {
    console.log('📱 Initializing app integrations...')
  }

  async addIntegration(app: IntegratedApp, config: AppIntegrationConfig): Promise<boolean> {
    try {
      let integration

      switch (app) {
        case 'myfitnesspal':
          integration = new MyFitnessPalIntegration(config)
          break
        case 'headspace':
          integration = new HeadspaceIntegration(config)
          break
        case 'duolingo':
          integration = new DuolingoIntegration(config)
          break
        case 'github':
          integration = new GitHubIntegration(config)
          break
        case 'spotify':
          integration = new SpotifyIntegration(config)
          break
        case 'noom':
          integration = new NoomIntegration(config)
          break
        case 'todoist':
          integration = new TodoistIntegration(config)
          break
        case 'coursera':
          integration = new CourseraIntegration(config)
          break
        case 'khan_academy':
          integration = new KhanAcademyIntegration(config)
          break
        case 'youtube_music':
          integration = new YouTubeMusicIntegration(config)
          break
        case 'goodreads':
          integration = new GoodreadsIntegration(config)
          break
        case 'notion':
          integration = new NotionIntegration(config)
          break
        case 'linkedin_learning':
          integration = new LinkedInLearningIntegration(config)
          break
        default:
          throw new Error(`Unsupported app: ${app}`)
      }

      const connected = await integration.connect()
      if (connected) {
        this.integrations.set(app, integration)
        this.configs.set(app, config)
        console.log(`✅ ${app} integration added successfully`)
        return true
      } else {
        console.error(`❌ Failed to connect ${app}`)
        return false
      }
    } catch (error) {
      console.error(`Failed to add ${app} integration:`, error)
      return false
    }
  }

  async fetchAllData(startDate: Date, endDate: Date): Promise<AppIntegrationData[]> {
    const allData: AppIntegrationData[] = []

    for (const [app, integration] of this.integrations) {
      try {
        console.log(`📊 Fetching data from ${app}...`)
        
        let data: AppIntegrationData[] = []
        
        // Call appropriate fetch method based on app type
        if (app === 'myfitnesspal') {
          data = await integration.fetchNutritionData(startDate, endDate)
        } else if (app === 'headspace') {
          data = await integration.fetchMeditationData(startDate, endDate)
        } else if (app === 'duolingo') {
          data = await integration.fetchLanguageData(startDate, endDate)
        } else if (app === 'github') {
          data = await integration.fetchCodingData(startDate, endDate)
        }
        
        allData.push(...data)
      } catch (error) {
        console.error(`Failed to fetch data from ${app}:`, error)
      }
    }

    return allData
  }

  async verifyData(data: AppIntegrationData, challengeRequirements: any): Promise<AppVerificationResult> {
    try {
      const appVerified = this.verifyApp(data)
      const dataAuthentic = this.checkDataAuthenticity(data)
      const timelineValid = this.validateTimeline(data, challengeRequirements)
      const progressConsistent = this.checkProgressConsistency(data)
      
      const confidence = Math.min(
        appVerified ? 85 : 20,
        dataAuthentic,
        timelineValid ? 90 : 30,
        progressConsistent
      )

      const valid = confidence >= 70

      return {
        valid,
        confidence,
        reasons: this.generateVerificationReasons(appVerified, dataAuthentic, timelineValid, progressConsistent),
        metadata: {
          appVerified,
          dataAuthentic,
          timelineValid,
          progressConsistent
        }
      }
    } catch (error) {
      console.error('App data verification failed:', error)
      return {
        valid: false,
        confidence: 0,
        reasons: ['Verification system error'],
        metadata: {
          appVerified: false,
          dataAuthentic: false,
          timelineValid: false,
          progressConsistent: false
        }
      }
    }
  }

  private verifyApp(data: AppIntegrationData): boolean {
    // Verify the app source is legitimate
    const trustedApps = ['MyFitnessPal', 'Headspace', 'Duolingo', 'GitHub']
    return trustedApps.some(app => 
      data.metadata.source.includes(app)
    )
  }

  private checkDataAuthenticity(data: AppIntegrationData): number {
    let score = 100

    // Check for realistic values based on data type
    if (data.dataType === 'meditation_session') {
      const duration = data.value.duration
      if (duration > 120) score -= 20 // More than 2 hours is suspicious
      if (duration < 1) score -= 30 // Less than 1 minute is suspicious
    }

    if (data.dataType === 'nutrition_log') {
      const calories = data.value.calories
      if (calories > 5000 || calories < 800) score -= 25 // Unrealistic calorie intake
    }

    return Math.max(0, score)
  }

  private validateTimeline(data: AppIntegrationData, requirements: any): boolean {
    const now = new Date()
    const activityTime = new Date(data.timestamp)
    
    // Activity shouldn't be in the future
    if (activityTime > now) return false
    
    // Activity shouldn't be too old
    const daysDiff = (now.getTime() - activityTime.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 7) return false
    
    return true
  }

  private checkProgressConsistency(data: AppIntegrationData): number {
    // Check if progress/streak data is consistent
    let score = 100

    if (data.metadata.streak !== undefined) {
      const streak = data.metadata.streak
      if (streak > 365) score -= 15 // More than a year streak is rare
      if (streak < 0) score -= 50 // Negative streak is impossible
    }

    return Math.max(0, score)
  }

  private generateVerificationReasons(
    appVerified: boolean, 
    dataAuthentic: number, 
    timelineValid: boolean, 
    progressConsistent: number
  ): string[] {
    const reasons: string[] = []
    
    if (!appVerified) reasons.push('App authentication failed')
    if (dataAuthentic < 70) reasons.push('Data authenticity issues detected')
    if (!timelineValid) reasons.push('Activity timeline validation failed')
    if (progressConsistent < 70) reasons.push('Progress consistency issues detected')
    
    if (reasons.length === 0) {
      reasons.push('All verification checks passed')
    }
    
    return reasons
  }

  getAvailableApps(): IntegratedApp[] {
    return Array.from(this.integrations.keys())
  }

  getAppConfig(app: IntegratedApp): AppIntegrationConfig | undefined {
    return this.configs.get(app)
  }
}

// Export singleton instance
export const appIntegrationManager = new AppIntegrationManager()

// Helper functions for frontend
export function getAppIcon(app: IntegratedApp): string {
  const icons = {
    myfitnesspal: '🍎',
    headspace: '🧘',
    duolingo: '🦉',
    noom: '⚖️',
    coursera: '🎓',
    khan_academy: '📚',
    spotify: '🎵',
    youtube_music: '🎶',
    goodreads: '📖',
    todoist: '✅',
    notion: '📝',
    github: '🐙',
    linkedin_learning: '💼'
  }
  return icons[app] || '📱'
}

export function getAppName(app: IntegratedApp): string {
  const names = {
    myfitnesspal: 'MyFitnessPal',
    headspace: 'Headspace',
    duolingo: 'Duolingo',
    noom: 'Noom',
    coursera: 'Coursera',
    khan_academy: 'Khan Academy',
    spotify: 'Spotify',
    youtube_music: 'YouTube Music',
    goodreads: 'Goodreads',
    todoist: 'Todoist',
    notion: 'Notion',
    github: 'GitHub',
    linkedin_learning: 'LinkedIn Learning'
  }
  return names[app] || app
}
