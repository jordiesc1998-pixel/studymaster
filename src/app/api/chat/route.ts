import ZAI from 'z-ai-web-dev-sdk'
import { NextRequest, NextResponse } from 'next/server'

// Respuestas de fallback mejoradas para MR. Q
const fallbackResponses: Record<string, string> = {
  saludo: `¡Hola! 👋 Soy **MR. Q**, tu tutor personal de StudyMaster.

Estoy aquí para ayudarte a preparar tus exámenes de ingreso a la universidad. Puedo ayudarte con:

• 📐 **Matemáticas**: álgebra, geometría, trigonometría
• ⚡ **Física**: movimiento, fuerzas, energía
• 🧪 **Química**: átomos, tabla periódica, reacciones
• 🧠 **Razonamiento**: numérico, verbal, abstracto
• 📚 **Biología**: célula, genética, anatomía

¿Qué tema te gustaría practicar hoy?`,

  mate: `¡Excelente! Me encantan las matemáticas 📐

Aquí tienes algunos temas que puedo explicarte:

• **Álgebra**: Ecuaciones, factorización, productos notables
• **Aritmética**: Fracciones, porcentajes, proporciones
• **Geometría**: Áreas, perímetros, volúmenes
• **Trigonometría**: Funciones trigonométricas, identidades

¿Sobre cuál tema quieres que te explique? Solo dime "explica [tema]" y te ayudo paso a paso.`,

  fisica: `¡La física es fascinante! ⚡

Puedo ayudarte con estos temas:

• **Cinemática**: MRU, MRUV, movimiento parabólico
• **Dinámica**: Leyes de Newton, fuerzas
• **Energía**: Trabajo, energía cinética y potencial
• **Electricidad**: Circuitos, ley de Ohm

¿Qué tema de física te interesa? Dime "explica [tema]" y te lo explico de forma sencilla.`,

  quimica: `¡La química es mágica! 🧪

Temas que puedo explicarte:

• **Átomo**: Estructura, configuración electrónica
• **Tabla Periódica**: Propiedades, grupos, períodos
• **Enlaces**: Iónicos, covalentes, metálicos
• **Reacciones**: Balanceo, estequiometría

¿Qué necesitas repasar? Escribe "explica [tema]" y te ayudo.`,

  razonamiento: `¡El razonamiento es clave para los exámenes! 🧠

Puedo ayudarte con:

• **Numérico**: Series, proporciones, porcentajes, edades
• **Verbal**: Sinónimos, antónimos, analogías, comprensión
• **Abstracto**: Figuras, dominós, dados, matrices

Estos temas son muy importantes para UCE, UNACH, UTMACH y YACHAY.

¿Qué tipo de razonamiento quieres practicar?`,

  explicacion: `¡Claro! Me encanta explicar 📚

**Para explicarte mejor, dime específicamente qué tema:**

• "Explica fracciones" - Te enseño a sumar, restar, multiplicar
• "Explica leyes de Newton" - Las 3 leyes con ejemplos
• "Explica analogías" - Cómo resolverlas paso a paso
• "Explica porcentajes" - Cálculos y problemas prácticos

Mientras más específico seas, mejor te puedo ayudar.`,

  ejercicio: `¡Vamos a practicar! 💪

Dime el tema y te genero un ejercicio:

• "Ejercicio de fracciones"
• "Ejercicio de porcentajes" 
• "Ejercicio de analogías"
• "Ejercicio de movimiento rectilíneo"

También puedo darte tips para resolver más rápido en el examen.`,

  ayuda: `¡Estoy aquí para ayudarte! 🤝

Puedo:

1. **Explicar** cualquier tema paso a paso
2. **Crear ejercicios** para practicar
3. **Darte tips** para el examen
4. **Resolver dudas** específicas

Solo escribe tu pregunta o el tema que quieres estudiar.

Ejemplo: "Explícame cómo se resuelven las analogías"`,

  animo: `¡No te rindas! 💪 Cada error es un paso más hacia el éxito.

**Consejos para estudiar mejor:**

1. 📅 **Organiza tu tiempo**: Estudia en bloques de 25-45 min
2. 📝 **Practica diario**: 10-15 ejercicios al día
3. ✅ **Repasa tus errores**: Aprende de lo que fallaste
4. 😴 **Descansa bien**: El cerebro aprende mientras duermes

Recuerda: Los mejores estudiantes no son los más inteligentes, sino los más constantes.

¿En qué tema necesitas ayuda?`,

  examen: `¡Prepararse para el examen es clave! 📋

**Tips para el día del examen:**

1. ⏰ **Llega temprano** y relajado
2. 📖 **Lee toda la pregunta** antes de responder
3. ✏️ **No te estanques** en una pregunta difícil
4. 🔍 **Revisa tus respuestas** si tienes tiempo
5. 💧 **Mantente hidratado**

**Estrategias:**
• Primero responde lo que sabes seguro
• Elimina opciones obvias
• Usa el proceso de eliminación

¿Quieres que practiquemos algún tema específico?`,

  default: `¡Interesante! 🤔

No estoy seguro de entender tu pregunta, pero puedo ayudarte con:

• **Matemáticas**: álgebra, geometría, trigonometría
• **Física**: movimiento, fuerzas, energía
• **Química**: átomos, reacciones
• **Razonamiento**: numérico, verbal, abstracto
• **Biología**: célula, genética

Escribe el tema que quieres estudiar o tu pregunta específica.

Ejemplos:
• "Explícame las fracciones"
• "Dame un ejercicio de analogías"
• "¿Cómo se resuelven los problemas de edades?"`
}

// Función para determinar qué respuesta de fallback usar
function getFallbackResponse(userMessage: string): string {
  const message = userMessage.toLowerCase()

  // Saludos
  if (message.includes('hola') || message.includes('buenas') || message.includes('hey') || message.includes('saludos') || message.includes('buenos')) {
    return fallbackResponses.saludo
  }

  // Matemáticas
  if (message.includes('matemática') || message.includes('algebra') || message.includes('geometría') || message.includes('trigonometría') || message.includes('aritmetica') || message.includes('fracci') || message.includes('ecuaci')) {
    return fallbackResponses.mate
  }

  // Física
  if (message.includes('física') || message.includes('fisica') || message.includes('movimiento') || message.includes('fuerza') || message.includes('newton') || message.includes('energía') || message.includes('mru') || message.includes('circuit')) {
    return fallbackResponses.fisica
  }

  // Química
  if (message.includes('química') || message.includes('quimica') || message.includes('atomo') || message.includes('átomo') || message.includes('tabla periódica') || message.includes('enlace') || message.includes('reacci')) {
    return fallbackResponses.quimica
  }

  // Razonamiento
  if (message.includes('razonamiento') || message.includes('numérico') || message.includes('verbal') || message.includes('abstracto') || message.includes('analogía') || message.includes('sinónimo') || message.includes('antónimo') || message.includes('serie')) {
    return fallbackResponses.razonamiento
  }

  // Ejercicios
  if (message.includes('ejercicio') || message.includes('practicar') || message.includes('problema') || message.includes('resolver')) {
    return fallbackResponses.ejercicio
  }

  // Explicaciones
  if (message.includes('explica') || message.includes('qué es') || message.includes('como funciona') || message.includes('cómo se') || message.includes('por qué') || message.includes('enseña')) {
    return fallbackResponses.explicacion
  }

  // Ayuda y motivación
  if (message.includes('ayuda') || message.includes('ayudar') || message.includes('qué puedes') || message.includes('que puedes')) {
    return fallbackResponses.ayuda
  }

  // Examen
  if (message.includes('examen') || message.includes('prueba') || message.includes('test') || message.includes('simulacro')) {
    return fallbackResponses.examen
  }

  // Ánimo
  if (message.includes('triste') || message.includes('mal') || message.includes('difícil') || message.includes('no puedo') || message.includes('rindo') || message.includes('frustrado')) {
    return fallbackResponses.animo
  }

  return fallbackResponses.default
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, topicContext } = body

    // Intentar usar el SDK de ZAI
    try {
      const zai = await ZAI.create()

      const systemMessage = {
        role: 'system' as const,
        content: `Eres MR. Q, un tutor amigable y paciente para exámenes de ingreso a universidades de Ecuador. Tu trabajo es:

1. Explicar conceptos de forma MUY SENCILLA, como si le hablaras a un niño de 10 años
2. Usar ejemplos cotidianos y familiares de Ecuador
3. Dar ejercicios paso a paso con números concretos
4. Ser motivador y paciente siempre
5. Usar emojis ocasionalmente para hacer la conversación más amigable
6. Cuando expliques, usar formato claro con pasos numerados
7. Conocer sobre las universidades ecuatorianas: UCE, ESPOCH, EPN, UTN, ESPE, UNACH, UTMACH, YACHAY, UTPL, UNL, UTC, U Cuenca

${topicContext || 'El usuario está practicando para su examen de ingreso'}

Reglas importantes:
- Si el usuario pide un ejercicio, genera UNO simple con 4 opciones (A, B, C, D) y marca la correcta
- Si pide explicación, usa máximo 3 pasos claros
- Siempre pregunta si entendió o si quiere practicar más
- Sé entusiasta pero profesional
- Si pregunta sobre porcentajes, proporciones, fracciones, etc., da ejemplos numéricos concretos`
      }

      const completion = await zai.chat.completions.create({
        messages: [
          systemMessage,
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))
        ]
      })

      const response = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentarlo de nuevo?'

      return NextResponse.json({ response })
    } catch (sdkError: unknown) {
      // Si el SDK falla, usar respuestas de fallback
      const errorMessage = sdkError instanceof Error ? sdkError.message : 'Unknown error'
      console.log('SDK no disponible, usando modo fallback:', errorMessage)

      const lastMessage = messages[messages.length - 1]?.content || ''
      const fallbackResponse = getFallbackResponse(lastMessage)

      // Simular un pequeño delay para que parezca natural
      await new Promise(resolve => setTimeout(resolve, 500))

      return NextResponse.json({
        response: fallbackResponse,
        mode: 'demo'
      })
    }
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Hubo un error al procesar tu mensaje' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicName = searchParams.get('topic') || 'matemáticas'

    // Intentar usar el SDK
    try {
      const zai = await ZAI.create()

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Genera 5 ejercicios simples de ${topicName} para un estudiante que necesita practicar.

Responde SOLO en formato JSON, sin texto adicional:
[
  {
    "question": "Pregunta clara",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0
  }
]

Importante:
- Preguntas MÁS FÁCILES que las del quiz original
- correctAnswer es el índice (0, 1, 2 o 3) de la respuesta correcta
- Exactamente 4 opciones por pregunta`
          },
          {
            role: 'user',
            content: `Genera 5 ejercicios simples de ${topicName}`
          }
        ]
      })

      const content = completion.choices[0]?.message?.content || '[]'

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : []

      return NextResponse.json({ questions })
    } catch (sdkError) {
      // Fallback: ejercicios predefinidos
      console.log('SDK no disponible para ejercicios, usando fallback')
      const fallbackQuestions = [
        {
          question: "¿Cuánto es 5 + 3?",
          options: ["6", "7", "8", "9"],
          correctAnswer: 2
        },
        {
          question: "¿Cuánto es 10 - 4?",
          options: ["5", "6", "7", "8"],
          correctAnswer: 1
        },
        {
          question: "¿Cuánto es 3 × 4?",
          options: ["10", "11", "12", "13"],
          correctAnswer: 2
        },
        {
          question: "¿Cuánto es 20 ÷ 4?",
          options: ["3", "4", "5", "6"],
          correctAnswer: 2
        },
        {
          question: "¿Cuál es el número par?",
          options: ["3", "5", "7", "8"],
          correctAnswer: 3
        }
      ]
      return NextResponse.json({ questions: fallbackQuestions, mode: 'demo' })
    }
  } catch (error) {
    console.error('Game generation error:', error)
    return NextResponse.json({ questions: [] })
  }
}
