import { NextRequest, NextResponse } from 'next/server'
import { validateFileEnhanced } from '@/lib/enhanced-file-validation'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing enhanced file validation...')
    
    // Create test files to validate our system
    const testCases = [
      {
        name: 'Valid image',
        file: createMockFile('proof.jpg', 'image/jpeg', 1024 * 500), // 500KB
        expectedValid: true
      },
      {
        name: 'Oversized file',
        file: createMockFile('huge.jpg', 'image/jpeg', 1024 * 1024 * 60), // 60MB
        expectedValid: false
      },
      {
        name: 'Suspicious filename',
        file: createMockFile('stock_photo_123.jpg', 'image/jpeg', 1024 * 100),
        expectedValid: false // Should trigger fraud detection
      },
      {
        name: 'Invalid file type',
        file: createMockFile('malware.exe', 'application/x-msdownload', 1024),
        expectedValid: false
      },
      {
        name: 'Valid video',
        file: createMockFile('workout.mp4', 'video/mp4', 1024 * 1024 * 5), // 5MB
        expectedValid: true
      }
    ]

    const results = []

    for (const testCase of testCases) {
      console.log(`📋 Testing: ${testCase.name}`)
      
      const validation = await validateFileEnhanced(testCase.file)
      
      const result = {
        testName: testCase.name,
        expectedValid: testCase.expectedValid,
        actualValid: validation.valid,
        passed: validation.valid === testCase.expectedValid,
        riskScore: validation.riskScore,
        errors: validation.errors,
        warnings: validation.warnings,
        securityFlags: validation.securityFlags,
        metadata: {
          hash: validation.metadata.hash,
          sanitizedName: validation.metadata.sanitizedName,
          actualMimeType: validation.metadata.actualMimeType
        }
      }
      
      results.push(result)
      
      console.log(`${result.passed ? '✅' : '❌'} ${testCase.name}: ${result.passed ? 'PASSED' : 'FAILED'}`)
    }

    const overallSuccess = results.every(r => r.passed)
    
    console.log(`🎯 Overall test result: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`)

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? 'Enhanced file validation system working correctly' : 'Some validation tests failed',
      testResults: results,
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    })

  } catch (error) {
    console.error('🚨 Test failed with error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function createMockFile(name: string, type: string, size: number): File {
  // Create a realistic mock File object for testing
  const file = {
    name,
    type,
    size,
    lastModified: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time in last 7 days
    webkitRelativePath: '',
    arrayBuffer: async () => {
      // Create realistic array buffer with some content
      const buffer = new ArrayBuffer(Math.min(size, 1024)) // Limit to 1KB for testing
      const view = new Uint8Array(buffer)
      
      // Add some realistic file signatures for testing
      if (type === 'image/jpeg') {
        view[0] = 0xFF; view[1] = 0xD8; view[2] = 0xFF // JPEG signature
      } else if (type === 'image/png') {
        view[0] = 0x89; view[1] = 0x50; view[2] = 0x4E; view[3] = 0x47 // PNG signature
      } else if (type === 'video/mp4') {
        view[4] = 0x66; view[5] = 0x74; view[6] = 0x79; view[7] = 0x70 // MP4 signature
      } else if (type === 'application/x-msdownload') {
        view[0] = 0x4D; view[1] = 0x5A // EXE signature
      }
      
      return buffer
    },
    slice: (start?: number, end?: number) => {
      const sliceSize = Math.min((end || size) - (start || 0), 1024)
      return createMockFile(name, type, sliceSize)
    },
    stream: () => new ReadableStream(),
    text: async () => '',
    bytes: async () => new Uint8Array(0)
  } as unknown as File

  return file
}
