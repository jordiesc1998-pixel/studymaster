import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Verificar token de admin
async function verifyAdmin(token: string) {
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

// GET - Listar juegos o obtener uno específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const university = searchParams.get('university')
    const area = searchParams.get('area')
    const topic = searchParams.get('topic')
    const gameType = searchParams.get('gameType')

    // Si se pide un juego específico
    if (id) {
      const game = await prisma.game.findUnique({
        where: { id },
        include: {
          questions: {
            orderBy: { order: 'asc' }
          }
        }
      })

      if (!game || !game.isActive) {
        return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 })
      }

      // Incrementar contador de jugadas
      await prisma.game.update({
        where: { id },
        data: { playCount: { increment: 1 } }
      })

      return NextResponse.json({ game })
    }

    // Listar juegos
    const where: any = { isActive: true }

    if (category) where.category = category
    if (university) where.university = university
    if (area) where.area = area
    if (topic) where.topic = topic
    if (gameType) where.gameType = gameType

    const games = await prisma.game.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    })

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ games: [] })
  }
}

// POST - Crear juego
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, gameType, difficulty, timeLimit, gameData, category, university, area, topic, questions } = body

    if (!name || !gameType || !gameData) {
      return NextResponse.json({ error: 'Nombre, tipo de juego y datos son requeridos' }, { status: 400 })
    }

    // Crear el juego
    const game = await prisma.game.create({
      data: {
        name,
        description: description || null,
        gameType,
        difficulty: difficulty || 'medium',
        timeLimit: timeLimit || null,
        gameData,
        category: category || null,
        university: university || null,
        area: area || null,
        topic: topic || null
      }
    })

    // Si vienen preguntas, crearlas
    if (questions && Array.isArray(questions) && questions.length > 0) {
      await prisma.gameQuestion.createMany({
        data: questions.map((q: any, index: number) => ({
          gameId: game.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
          questionImage: q.questionImage || null,
          order: index
        }))
      })
    }

    return NextResponse.json({ success: true, game })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Error al crear juego' }, { status: 500 })
  }
}

// PUT - Actualizar juego
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { id, questions, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Actualizar el juego
    const game = await prisma.game.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    // Si vienen preguntas nuevas, eliminar las anteriores y crear las nuevas
    if (questions && Array.isArray(questions)) {
      await prisma.gameQuestion.deleteMany({
        where: { gameId: id }
      })

      if (questions.length > 0) {
        await prisma.gameQuestion.createMany({
          data: questions.map((q: any, index: number) => ({
            gameId: id,
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            questionImage: q.questionImage || null,
            order: index
          }))
        })
      }
    }

    return NextResponse.json({ success: true, game })
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json({ error: 'Error al actualizar juego' }, { status: 500 })
  }
}

// DELETE - Eliminar juego
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Soft delete
    await prisma.game.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json({ error: 'Error al eliminar juego' }, { status: 500 })
  }
}
