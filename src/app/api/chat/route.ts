import ZAI from 'z-ai-web-dev-sdk'
import { NextRequest, NextResponse } from 'next/server'

// Respuestas de fallback para MR. Q cuando el SDK no está disponible
const fallbackResponses: Record<string, string> = {
  saludo: `¡Hola! 👋 Soy **MR. Q**, tu tutor personal.

Estoy aquí para ayudarte a entender cualquier tema de forma sencilla. ¿Qué te gustaría practicar hoy?

• Matemáticas 📐
• Física ⚡
• Química 🧪
• Razonamiento 🧠`,

  explicacion: `¡Claro! Me encanta explicar cosas 📚

**Paso 1:** Identificamos el concepto principal
Primero debemos entender qué es lo que estamos buscando.

**Paso 2:** Buscamos un ejemplo de la vida real
Es más fácil entender cuando podemos relacionarlo con algo conocido.

**Paso 3:** Practicamos con ejercicios simples
La práctica hace al maestro 🎯

¿Te gustaría que te explique algún tema en específico?`,

  ejercicio: `¡Excelente idea! Vamos a practicar 💪

**Ejercicio:**

Si tengo 3 manzanas y me regalan 2 más, ¿cuántas manzanas tengo en total?

A) 4 manzanas
B) 5 manzanas  ✓
C) 6 manzanas
D) 3 manzanas

**Explicación:** Sumamos 3 + 2 = 5 manzanas.

¿Quieres otro ejercicio o prefieres que te explique algo?`,

  animo: `¡No te desanimes! 💪

Recuerda que cada error es una oportunidad de aprendizaje. Los grandes científicos e inventores también se equivocaron muchas veces antes de lograr sus objetivos.

**Consejo del día:**
"El éxito no es la clave de la felicidad. La felicidad es la clave del éxito." - Albert Schweitzer

¿En qué tema te gustaría practicar más?`,

  default: `¡Interesante pregunta! 🤔

Déjame pensar... Aunque estoy en modo de demostración, puedo ayudarte con:

• **Explicaciones** de conceptos básicos
• **Ejercicios** simples para practicar
• **Tips** de estudio y motivación
• **Dudas** sobre los temas del quiz

¿Qué te gustaría hacer? Escribe "ejercicio", "explicación" o cuéntame en qué necesitas ayuda.`
}

// Función para determinar qué respuesta de fallback usar
function getFallbackResponse(userMessage: string): string {
  const message = userMessage.toLowerCase()

  if (message.includes('hola') || message.includes('buenas') || message.includes('hey') || message.includes('saludos')) {
    return fallbackResponses.saludo
  }

  if (message.includes('ejercicio') || message.includes('practicar') || message.includes('problema')) {
    return fallbackResponses.ejercicio
  }

  if (message.includes('explica') || message.includes('qué es') || message.includes('cómo') || message.includes('por qué')) {
    return fallbackResponses.explicacion
  }

  if (message.includes('triste') || message.includes('mal') || message.includes('difícil') || message.includes('no puedo') || message.includes('ayuda')) {
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
        content: `Eres MR. Q, un tutor amigable y paciente. Tu trabajo es:

1. Explicar conceptos de forma MUY SENCILLA, como si le hablaras a un niño de 10 años
2. Usar ejemplos cotidianos y familiares
3. Dar ejercicios paso a paso
4. Ser motivador y paciente
5. Usar emojis ocasionalmente para hacer la conversación más amigable
6. Cuando expliques, usar formato claro con pasos numerados

${topicContext || 'El usuario está practicando'}

Reglas importantes:
- Si el usuario pide un ejercicio, genera UNO simple con la respuesta al final
- Si pide explicación, usa máximo 3 pasos
- Siempre pregunta si entendió o si quiere practicar más
- Sé entusiasta pero profesional`
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
    } catch (sdkError) {
      // Si el SDK falla, usar respuestas de fallback
      console.log('SDK no disponible, usando modo fallback:', sdkError)

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
