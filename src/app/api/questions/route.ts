import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Verificar sesión
async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  const session = await db.adminSession.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

// Obtener preguntas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const university = searchParams.get('university')
    const type = searchParams.get('type')
    const topic = searchParams.get('topic')

    const where: Record<string, string> = {}
    if (category) where.category = category
    if (university) where.university = university
    if (type) where.type = type
    if (topic) where.topic = topic

    const questions = await db.question.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json(
      { error: 'Error al obtener preguntas' },
      { status: 500 }
    )
  }
}

// Crear pregunta
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()

    const question = await db.question.create({
      data: {
        question: data.question,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || null,
        category: data.category,
        university: data.university,
        type: data.type,
        topic: data.topic,
        questionImage: data.questionImage || null,
        optionAImage: data.optionAImage || null,
        optionBImage: data.optionBImage || null,
        optionCImage: data.optionCImage || null,
        optionDImage: data.optionDImage || null
      }
    })

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json(
      { error: 'Error al crear pregunta' },
      { status: 500 }
    )
  }
}

// Eliminar pregunta
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await db.question.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pregunta' },
      { status: 500 }
    )
  }
}

// Parser formato AIKEN
function parseAiken(text: string): Array<{
  question: string
  options: string[]
  correctAnswer: number
}> {
  const questions: Array<{
    question: string
    options: string[]
    correctAnswer: number
  }> = []

  const lines = text.split('\n').map(line => line.trim()).filter(line => line)

  let currentQuestion: {
    question: string
    options: string[]
    correctAnswer: number
  } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detectar respuesta correcta (ANSWER: X)
    if (line.toUpperCase().startsWith('ANSWER:')) {
      if (currentQuestion && currentQuestion.options.length === 4) {
        const answerLetter = line.split(':')[1]?.trim().toUpperCase()
        const answerMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 }
        currentQuestion.correctAnswer = answerMap[answerLetter] ?? 0
        questions.push(currentQuestion)
        currentQuestion = null
      }
      continue
    }

    // Detectar opción (A. B. C. D.)
    const optionMatch = line.match(/^([A-Da-d])[.\)]\s*(.+)$/)
    if (optionMatch && currentQuestion) {
      currentQuestion.options.push(optionMatch[2].trim())
      continue
    }

    // Nueva pregunta
    if (!line.match(/^[A-Da-d][.\)]/i) && !line.toUpperCase().startsWith('ANSWER:')) {
      if (currentQuestion && currentQuestion.options.length === 4) {
        // Pregunta anterior incompleta, guardar con respuesta por defecto
        questions.push(currentQuestion)
      }
      currentQuestion = {
        question: line,
        options: [],
        correctAnswer: 0
      }
    }
  }

  // Agregar última pregunta si existe
  if (currentQuestion && currentQuestion.options.length === 4) {
    questions.push(currentQuestion)
  }

  return questions
}

// Importar formato AIKEN
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { aikenText, category, university, type, topic } = data

    if (!aikenText || !category || !university || !type || !topic) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const parsedQuestions = parseAiken(aikenText)

    if (parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron preguntas válidas en el formato AIKEN' },
        { status: 400 }
      )
    }

    // Crear preguntas en la base de datos
    const createdQuestions = await Promise.all(
      parsedQuestions.map(q =>
        db.question.create({
          data: {
            question: q.question,
            optionA: q.options[0] || '',
            optionB: q.options[1] || '',
            optionC: q.options[2] || '',
            optionD: q.options[3] || '',
            correctAnswer: q.correctAnswer,
            category,
            university,
            type,
            topic
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      imported: createdQuestions.length,
      questions: createdQuestions
    })
  } catch (error) {
    console.error('Import AIKEN error:', error)
    return NextResponse.json(
      { error: 'Error al importar preguntas' },
      { status: 500 }
    )
  }
}
