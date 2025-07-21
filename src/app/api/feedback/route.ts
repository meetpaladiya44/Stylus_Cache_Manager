import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient } from '../../../lib/mongodb'
import { feedbackFormSchema } from '../../../lib/validations/feedback'

// POST /api/feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input with Zod schema
    const validationResult = feedbackFormSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      )
    }

    const { name, email, topic, rating, comments } = validationResult.data

    // Connect to MongoDB
    const client = await getMongoClient()
    const db = client.db('feedback')
    const collection = db.collection('entries')

    // Save validated feedback
    const feedback = {
      name,
      email,
      topic,
      rating,
      comments,
      timestamp: new Date(),
    }
    
    await collection.insertOne(feedback)

    return NextResponse.json({ 
      success: true,
      message: 'Feedback submitted successfully'
    })
  } catch (error: any) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to submit feedback. Please try again later.'
      }, 
      { status: 500 }
    )
  }
} 