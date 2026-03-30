import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'

// Función para hashear contraseña
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// Crear o actualizar usuario admin por defecto
async function ensureAdminExists() {
  const existingAdmin = await db.user.findUnique({
    where: { username: 'admin' }
  })

  if (!existingAdmin) {
    await db.user.create({
      data: {
        username: 'admin',
        password: hashPassword('123'),
        role: 'admin'
      }
    })
  } else {
    // Actualizar contraseña si ya existe
    await db.user.update({
      where: { username: 'admin' },
      data: { password: hashPassword('123') }
    })
  }
}

// Login
export async function POST(request: NextRequest) {
  try {
    await ensureAdminExists()

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña requeridos' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { username }
    })

    // Comparar hash de contraseña
    const hashedPassword = hashPassword(password)
    if (!user || user.password !== hashedPassword) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    // Crear sesión
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 horas

    await db.adminSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// Verificar sesión
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

// Logout
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (token) {
      await db.adminSession.deleteMany({
        where: { token }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: true })
  }
}
