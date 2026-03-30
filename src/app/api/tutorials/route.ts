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

// GET - Listar tutoriales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const university = searchParams.get('university')
    const area = searchParams.get('area')
    const topic = searchParams.get('topic')

    const where: any = { isActive: true }

    if (category) where.category = category
    if (university) where.university = university
    if (area) where.area = area
    if (topic) where.topic = topic

    const tutorials = await prisma.tutorial.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ tutorials })
  } catch (error) {
    console.error('Error fetching tutorials:', error)
    return NextResponse.json({ tutorials: [] })
  }
}

// POST - Crear tutorial
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
    const { title, description, youtubeUrl, imageUrl, documentUrl, content, category, university, area, topic, order } = body

    if (!title) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    const tutorial = await prisma.tutorial.create({
      data: {
        title,
        description: description || null,
        youtubeUrl: youtubeUrl || null,
        imageUrl: imageUrl || null,
        documentUrl: documentUrl || null,
        content: content || null,
        category: category || null,
        university: university || null,
        area: area || null,
        topic: topic || null,
        order: order || 0
      }
    })

    return NextResponse.json({ success: true, tutorial })
  } catch (error) {
    console.error('Error creating tutorial:', error)
    return NextResponse.json({ error: 'Error al crear tutorial' }, { status: 500 })
  }
}

// PUT - Actualizar tutorial
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
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const tutorial = await prisma.tutorial.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, tutorial })
  } catch (error) {
    console.error('Error updating tutorial:', error)
    return NextResponse.json({ error: 'Error al actualizar tutorial' }, { status: 500 })
  }
}

// DELETE - Eliminar tutorial
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

    // Soft delete - marcar como inactivo
    await prisma.tutorial.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tutorial:', error)
    return NextResponse.json({ error: 'Error al eliminar tutorial' }, { status: 500 })
  }
}
