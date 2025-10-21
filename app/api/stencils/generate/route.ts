import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const { uid, prompt } = await req.json()

    if (!uid || !prompt) {
      return NextResponse.json(
        { message: 'Missing uid or prompt' },
        { status: 400 }
      )
    }

    // Call OpenAI DALL-E API to generate image
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { message: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Generate image with DALL-E
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Create a tattoo stencil design: ${prompt}. The image should be in black and white line art style, suitable for use as a tattoo stencil with clean, bold lines.`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid'
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { message: 'Failed to generate image with AI' },
        { status: 500 }
      )
    }

    const { data } = await openaiResponse.json()
    const imageUrl = data[0].url

    // Download the generated image
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()

    // Upload to Firebase Storage
    const timestamp = Date.now()
    const fileName = `ai_generated_${timestamp}.png`
    const path = `stencils/${uid}/${fileName}`
    
    const bucket = adminStorage.bucket()
    const file = bucket.file(path)
    
    await file.save(Buffer.from(imageBuffer), {
      contentType: 'image/png',
      metadata: {
        metadata: {
          generatedBy: 'ai',
          prompt: prompt,
          timestamp: timestamp.toString()
        }
      }
    })

    // Make the file publicly accessible
    await file.makePublic()
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`

    return NextResponse.json({ 
      url: publicUrl,
      message: 'Stencil generated successfully' 
    })

  } catch (error) {
    console.error('Error generating stencil:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
