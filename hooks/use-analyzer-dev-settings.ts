"use client"

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

interface AnalyzerDevSettings {
  contextAwareness?: number
  verbosityLevel?: number
  criticalLevel?: number
  challengeTypePreset?: 'auto' | 'physical_skills' | 'habits' | 'learning' | 'fitness_tracking' | 'creative'
  skipObviousQuestions?: boolean
  includeVerificationOptimization?: boolean
  includeRiskAnalysis?: boolean
  includeDesignRecommendations?: boolean
  customPromptAdditions?: string
  confidenceThreshold?: number
  responseFormat?: 'standard' | 'detailed' | 'minimal'
}

/**
 * Hook to extract AI analyzer dev settings from URL parameters
 * 
 * URL Examples:
 * ?analyzer_mode=physical_skills&context=90&verbosity=30&skip_obvious=true
 * ?analyzer_debug=true&preset=habits&critical=80
 * ?analyzer_quick=minimal&context=100
 */
export function useAnalyzerDevSettings(): AnalyzerDevSettings | null {
  const searchParams = useSearchParams()
  
  return useMemo(() => {
    // Check if any analyzer dev params are present
    const hasAnalyzerParams = Array.from(searchParams.keys()).some(key => 
      key.startsWith('analyzer_') || 
      key.startsWith('context') || 
      key.startsWith('verbosity') || 
      key.startsWith('critical') ||
      key.startsWith('preset')
    )
    
    if (!hasAnalyzerParams) return null
    
    const settings: AnalyzerDevSettings = {}
    
    // Parse numeric parameters (0-100)
    const contextAwareness = searchParams.get('context') || searchParams.get('analyzer_context')
    if (contextAwareness) {
      const value = parseInt(contextAwareness)
      if (!isNaN(value) && value >= 0 && value <= 100) {
        settings.contextAwareness = value
      }
    }
    
    const verbosityLevel = searchParams.get('verbosity') || searchParams.get('analyzer_verbosity')
    if (verbosityLevel) {
      const value = parseInt(verbosityLevel)
      if (!isNaN(value) && value >= 0 && value <= 100) {
        settings.verbosityLevel = value
      }
    }
    
    const criticalLevel = searchParams.get('critical') || searchParams.get('analyzer_critical')
    if (criticalLevel) {
      const value = parseInt(criticalLevel)
      if (!isNaN(value) && value >= 0 && value <= 100) {
        settings.criticalLevel = value
      }
    }
    
    const confidenceThreshold = searchParams.get('confidence') || searchParams.get('analyzer_confidence')
    if (confidenceThreshold) {
      const value = parseInt(confidenceThreshold)
      if (!isNaN(value) && value >= 50 && value <= 100) {
        settings.confidenceThreshold = value
      }
    }
    
    // Parse preset/mode
    const preset = searchParams.get('preset') || searchParams.get('analyzer_mode') || searchParams.get('analyzer_preset')
    if (preset) {
      const validPresets = ['auto', 'physical_skills', 'habits', 'learning', 'fitness_tracking', 'creative']
      if (validPresets.includes(preset)) {
        settings.challengeTypePreset = preset as any
      }
    }
    
    // Parse response format
    const format = searchParams.get('format') || searchParams.get('analyzer_format') || searchParams.get('analyzer_quick')
    if (format) {
      const validFormats = ['standard', 'detailed', 'minimal']
      if (validFormats.includes(format)) {
        settings.responseFormat = format as any
      }
    }
    
    // Parse boolean flags
    const skipObvious = searchParams.get('skip_obvious') || searchParams.get('analyzer_skip_obvious')
    if (skipObvious) {
      settings.skipObviousQuestions = skipObvious === 'true' || skipObvious === '1'
    }
    
    const includeVerification = searchParams.get('verification') || searchParams.get('analyzer_verification')
    if (includeVerification) {
      settings.includeVerificationOptimization = includeVerification === 'true' || includeVerification === '1'
    }
    
    const includeRisk = searchParams.get('risk') || searchParams.get('analyzer_risk')
    if (includeRisk) {
      settings.includeRiskAnalysis = includeRisk === 'true' || includeRisk === '1'
    }
    
    const includeDesign = searchParams.get('design') || searchParams.get('analyzer_design')
    if (includeDesign) {
      settings.includeDesignRecommendations = includeDesign === 'true' || includeDesign === '1'
    }
    
    // Parse custom prompt additions
    const customPrompt = searchParams.get('custom_prompt') || searchParams.get('analyzer_custom')
    if (customPrompt) {
      settings.customPromptAdditions = decodeURIComponent(customPrompt)
    }
    
    // Special quick modes
    const debugMode = searchParams.get('analyzer_debug')
    if (debugMode === 'true') {
      settings.verbosityLevel = 90
      settings.criticalLevel = 90
      settings.responseFormat = 'detailed'
    }
    
    const quickMode = searchParams.get('analyzer_quick')
    if (quickMode === 'true') {
      settings.verbosityLevel = 30
      settings.contextAwareness = 90
      settings.responseFormat = 'minimal'
      settings.skipObviousQuestions = true
    }
    
    console.log('🛠️ URL Dev Settings:', settings)
    return settings
    
  }, [searchParams])
}

/**
 * Generate URL parameters string from settings
 */
export function generateAnalyzerUrl(settings: AnalyzerDevSettings): string {
  const params = new URLSearchParams()
  
  if (settings.contextAwareness !== undefined) {
    params.set('context', settings.contextAwareness.toString())
  }
  
  if (settings.verbosityLevel !== undefined) {
    params.set('verbosity', settings.verbosityLevel.toString())
  }
  
  if (settings.criticalLevel !== undefined) {
    params.set('critical', settings.criticalLevel.toString())
  }
  
  if (settings.challengeTypePreset && settings.challengeTypePreset !== 'auto') {
    params.set('preset', settings.challengeTypePreset)
  }
  
  if (settings.responseFormat && settings.responseFormat !== 'standard') {
    params.set('format', settings.responseFormat)
  }
  
  if (settings.skipObviousQuestions === true) {
    params.set('skip_obvious', 'true')
  }
  
  if (settings.customPromptAdditions) {
    params.set('custom_prompt', encodeURIComponent(settings.customPromptAdditions))
  }
  
  return params.toString() ? '?' + params.toString() : ''
}

/**
 * Common preset URLs for quick testing
 */
export const ANALYZER_PRESETS = {
  // Quick testing modes
  quick: '?analyzer_quick=true',
  debug: '?analyzer_debug=true',
  minimal: '?format=minimal&context=100&skip_obvious=true',
  detailed: '?format=detailed&verbosity=90&critical=80',
  
  // Challenge type presets
  handstands: '?preset=physical_skills&context=90&skip_obvious=true',
  habits: '?preset=habits&context=85&verbosity=40',
  learning: '?preset=learning&context=80&verbosity=60',
  fitness: '?preset=fitness_tracking&context=75&verification=true',
  creative: '?preset=creative&context=70&verbosity=80',
  
  // Testing specific scenarios
  high_context: '?context=95&skip_obvious=true&verbosity=30',
  low_context: '?context=20&verbosity=90&critical=90',
  supportive: '?critical=20&verbosity=60&format=standard',
  strict: '?critical=95&verbosity=80&format=detailed'
} as const

