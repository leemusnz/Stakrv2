# 🧠 Stakr AI Systems Documentation

## Overview

Stakr uses a comprehensive AI system for challenge analysis and verification, creating an intelligent pipeline from challenge creation to proof validation.

## System Architecture

```
Challenge Creation → AI Analysis → Database Storage → AI Verification → Decision
      ✅               ✅              ✅               ✅            ✅
```

## 🎯 AI Challenge Analyzer

### Purpose
Analyzes challenge descriptions during creation to:
- Extract daily requirements and success criteria
- Identify potential ambiguities and edge cases
- Generate evidence requirements for verification
- Optimize verification methods for the activity type
- Assess security risks and recommend improvements

### Key Features

#### 1. Context-Aware Analysis
- **Physical Skills**: Focuses on technique, measurement precision, safety
- **Habits**: Emphasizes completion definitions, timing, quality standards  
- **Learning**: Concentrates on progress measurement, demonstration requirements
- **Fitness**: Optimizes for auto-sync capabilities and measurement accuracy
- **Creative**: Addresses quality standards, originality, submission formats

#### 2. Intelligent Question Generation
- Skips obvious questions based on activity type
- Focuses on genuine ambiguities that could cause disputes
- Adapts question complexity to challenge stakes and difficulty

#### 3. Verification Optimization
- Analyzes current verification settings (photo/video/text/auto-sync)
- Considers security features (camera-only enforcement)
- Recommends optimal verification methods for the specific activity
- Assesses stakes vs. verification security balance

### API Usage

```typescript
import { AIChallengeAnalyzer } from '@/lib/ai-challenge-analyzer'

const analysis = await AIChallengeAnalyzer.analyzeChallengeDescription({
  title: "Handstand Walk Challenge",
  description: "Walk 10m on your hands every day for 3 days",
  selectedProofTypes: ["video"],
  cameraOnly: true,
  proofInstructions: "Record from side showing whole body throughout walk",
  minStake: 50,
  maxStake: 200,
  devSettings: {
    challengeTypePreset: 'physical_skills',
    contextAwareness: 85,
    skipObviousQuestions: true
  }
})
```

### Response Format

```typescript
interface ChallengeAnalysis {
  dailyRequirement: string           // "Walk 10 meters on hands"
  confidence: number                 // 0-100 confidence score
  validationMethod: string           // "video_measurement"
  evidenceRequirements: string[]     // ["Side view", "Whole body visible"]
  activityType: string[]             // ["handstand", "walking"]
  measurementType: string            // "distance"
  minimumValue?: number              // 10
  unit?: string                      // "meters"
  potentialAmbiguities: string[]     // Potential issues found
  clarificationQuestions: string[]   // Questions for challenge creator
  riskFactors: string[]              // Security/gaming risks
  designRecommendations: string[]    // Suggestions for improvement
  interpretation: string             // AI's understanding of the challenge
}
```

## 🔐 AI Verification System

### Purpose
Validates proof submissions using challenge analysis context to make intelligent approval/rejection decisions.

### Architecture

#### 1. Context Retrieval
```typescript
// Retrieves stored challenge analysis from database
const challengeContext = await getChallengeAnalysisContext(challengeId)
```

#### 2. Enhanced Verification
```typescript
// Uses Enhanced AI Verification with full context
const result = await EnhancedAIVerification.verify({
  challengeId,
  challengeText: `${title}: ${description}`,
  aiChallengeAnalysis: {
    dailyRequirement: "Walk 10 meters on hands",
    evidenceRequirements: ["Side view", "Whole body visible"],
    validationMethod: "video_measurement",
    minimumValue: 10,
    unit: "meters"
  },
  manualData: {
    type: "video",
    content: submissionContent,
    metadata: submissionMetadata
  }
})
```

#### 3. Intelligent Decision Making
```typescript
interface VerificationResponse {
  approved: boolean                  // Final decision
  confidence: number                 // 0-100 confidence
  reasoning: string                  // Explanation of decision
  action: 'approve' | 'review' | 'reject' | 'ban'
  flags: string[]                    // Any concerns identified
  suggestions: string[]              // Improvement suggestions
}
```

### Verification Flow

1. **Proof Submission** → AI Anti-Cheat Engine
2. **Context Retrieval** → Database query for challenge analysis
3. **Multi-Layer Analysis**:
   - Layer 1: Proof validation with challenge context
   - Layer 2: Behavioral analysis 
   - Layer 3: Social network analysis
   - Layer 4: Context intelligence
   - Layer 5: Economic fraud detection
4. **Decision Engine** → Approve/Review/Reject with reasoning

### Key Improvements

#### Context-Aware Validation
- **Before**: Generic verification without challenge understanding
- **After**: Specific validation using stored challenge analysis
  
#### Intelligent Reasoning
- **Before**: Basic pass/fail without explanation
- **After**: Detailed reasoning and actionable feedback

#### Activity-Specific Logic
- **Handstand Challenge**: Validates distance, form, camera angle
- **Guitar Challenge**: Analyzes audio quality, technique demonstration
- **Running Challenge**: Validates GPS data, pace, distance consistency

## 🛠️ Dev Tools System

### Purpose
Allows fine-tuning of AI analyzer behavior for optimal results across different challenge types.

### Features

#### 1. Behavior Controls
- **Context Awareness** (0-100): Skip obvious questions at higher levels
- **Analysis Depth** (0-100): Control detail level of analysis
- **Critical Level** (0-100): Adjust strictness of evaluation

#### 2. Challenge Type Presets
- **Auto**: Intelligent preset detection
- **Physical Skills**: Optimized for technique-based activities
- **Habits**: Focused on daily habit tracking
- **Learning**: Tailored for skill development
- **Fitness**: Designed for measurable activities
- **Creative**: Specialized for creative challenges

#### 3. Feature Toggles
- Skip obvious questions
- Verification optimization
- Risk analysis
- Design recommendations

#### 4. Testing Playground
- Live testing with sample challenges
- Verification type override controls
- Real-time results display
- Settings comparison

### Usage

#### URL Parameters
```
/create-challenge?preset=physical_skills&context=90&skip_obvious=true
/create-challenge?preset=habits&verbosity=40&format=minimal
```

#### Programmatic Control
```typescript
const devSettings = {
  challengeTypePreset: 'physical_skills',
  contextAwareness: 85,
  verbosityLevel: 60,
  skipObviousQuestions: true,
  customPromptAdditions: "Focus on measurement precision"
}
```

#### Global Application
```typescript
// Apply tested settings globally
localStorage.setItem('stakr-analyzer-global-settings', JSON.stringify({
  ...settings,
  enabled: true,
  timestamp: Date.now()
}))
```

## 🔄 Data Flow

### Challenge Creation Flow
1. User creates challenge with description and proof requirements
2. AI Challenge Analyzer processes the challenge:
   - Extracts daily requirements
   - Identifies evidence needs
   - Generates clarification questions
   - Assesses security risks
3. Analysis stored in `challenges.ai_analysis` (JSONB)
4. Challenge saved with complete analysis context

### Verification Flow
1. User submits proof (video/photo/text)
2. AI Anti-Cheat Engine:
   - Retrieves challenge analysis from database
   - Passes context to Enhanced AI Verification
   - Gets intelligent approval/rejection decision
3. Decision stored with detailed reasoning
4. User receives feedback with specific explanations

### Database Schema

```sql
-- Challenges table stores AI analysis
CREATE TABLE challenges (
  ...
  ai_analysis JSONB,  -- Complete challenge analysis from creation
  proof_requirements JSONB,  -- Verification settings
  ...
)

-- Proof submissions store AI decisions
CREATE TABLE proof_submissions (
  ...
  ai_verification_score DECIMAL(4,2),  -- Confidence score
  ai_decision VARCHAR(20),              -- approve/review/reject
  ai_reasons TEXT[],                    -- Reasoning array
  ...
)
```

## 🧪 Testing

### Test Coverage
- **AI Challenge Analyzer**: Unit tests for prompt generation, dev settings, presets
- **AI Verification Integration**: End-to-end flow tests with mock data
- **Dev Tools**: UI component tests and settings application tests

### Key Test Scenarios
1. **Context Awareness**: Different challenge types get appropriate analysis
2. **Data Flow Integrity**: Challenge analysis reaches verification system
3. **Error Handling**: Graceful fallbacks when AI services fail
4. **Security Validation**: Camera-only settings properly recognized
5. **Reasoning Quality**: Decisions include actionable explanations

### Running Tests
```bash
npm test ai-challenge-analyzer
npm test ai-verification-integration
npm run test:ai-systems
```

## 🚀 Performance

### Optimization Features
- **Caching**: Challenge analysis cached in database
- **Fallback Logic**: Graceful degradation when AI services unavailable
- **Parallel Processing**: Multiple verification layers run concurrently
- **Smart Prompting**: Context-aware prompts reduce token usage

### Monitoring
- Processing time tracking for all AI operations
- Confidence score distributions
- Error rate monitoring
- User feedback correlation

## 🔧 Configuration

### Environment Variables
```env
OPENAI_API_KEY=your_openai_key
AI_ANALYZER_DEFAULT_MODEL=gpt-4
AI_VERIFICATION_TIMEOUT=30000
ENABLE_AI_DEV_TOOLS=true
```

### Feature Flags
```typescript
const config = {
  enableContextAwareVerification: true,
  enableDevTools: process.env.NODE_ENV === 'development',
  enableAnalyzerCaching: true,
  enableFallbackVerification: true
}
```

This documentation covers the complete AI system architecture and usage patterns for Stakr's intelligent challenge analysis and verification pipeline.

