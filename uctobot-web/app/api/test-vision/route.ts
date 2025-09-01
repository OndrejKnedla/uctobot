import { NextResponse } from 'next/server'

export async function GET() {
  const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY
  
  if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY === 'your_google_vision_api_key_here') {
    return NextResponse.json({
      error: 'Google Vision API key not configured',
      configured: false
    })
  }

  // Test with a simple base64 image (small 1x1 pixel white image)
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA4849OQAAAABJRU5ErkJggg=='
  const base64Data = testImage.split(',')[1]

  try {
    console.log('Testing Google Vision API with key:', GOOGLE_VISION_API_KEY.substring(0, 10) + '...')
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 10
                }
              ]
            }
          ]
        })
      }
    )
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Google Vision API Error:', result)
      return NextResponse.json({
        error: 'Google Vision API Error',
        status: response.status,
        details: result,
        configured: true,
        working: false
      })
    }
    
    console.log('Google Vision API Success:', result)
    
    return NextResponse.json({
      success: true,
      configured: true,
      working: true,
      message: 'Google Vision API is working correctly',
      response: result
    })
    
  } catch (error) {
    console.error('Vision API test error:', error)
    return NextResponse.json({
      error: 'Network or API error',
      details: error instanceof Error ? error.message : 'Unknown error',
      configured: true,
      working: false
    })
  }
}