import { db } from '../src/lib/db'

async function main() {
  console.log('Agregando preguntas de porcentajes...')

  const questions = [
    {
      id: 'porc-1',
      question: 'Si un producto cuesta $80 y tiene 25% de descuento, ¿cuánto pagarás?',
      optionA: '$60',
      optionB: '$55',
      optionC: '$65',
      optionD: '$50',
      correctAnswer: 0,
      explanation: '25% de $80 = $20 de descuento. Pagas $80 - $20 = $60',
      category: 'razonamiento',
      university: 'uta',
      type: 'numerico',
      topic: 'porcentajes'
    },
    {
      id: 'porc-2',
      question: '¿Cuál es el 15% de 200?',
      optionA: '25',
      optionB: '30',
      optionC: '35',
      optionD: '40',
      correctAnswer: 1,
      explanation: '15% de 200 = 200 × 0.15 = 30',
      category: 'razonamiento',
      university: 'uta',
      type: 'numerico',
      topic: 'porcentajes'
    },
    {
      id: 'porc-3',
      question: 'Si el precio de un artículo subió de $50 a $65, ¿cuál fue el porcentaje de aumento?',
      optionA: '20%',
      optionB: '25%',
      optionC: '30%',
      optionD: '35%',
      correctAnswer: 2,
      explanation: 'Aumento = $15. Porcentaje = (15/50) × 100 = 30%',
      category: 'razonamiento',
      university: 'uta',
      type: 'numerico',
      topic: 'porcentajes'
    },
    {
      id: 'porc-4',
      question: 'En una tienda hay 120 productos. Si el 40% son electrónicos, ¿cuántos productos electrónicos hay?',
      optionA: '36',
      optionB: '42',
      optionC: '48',
      optionD: '52',
      correctAnswer: 2,
      explanation: '40% de 120 = 120 × 0.40 = 48 productos electrónicos',
      category: 'razonamiento',
      university: 'uta',
      type: 'numerico',
      topic: 'porcentajes'
    },
    {
      id: 'porc-5',
      question: 'Si un estudiante obtuvo 18 respuestas correctas de 20 preguntas, ¿qué porcentaje de aciertos tuvo?',
      optionA: '85%',
      optionB: '88%',
      optionC: '90%',
      optionD: '92%',
      correctAnswer: 2,
      explanation: 'Porcentaje = (18/20) × 100 = 90%',
      category: 'razonamiento',
      university: 'uta',
      type: 'numerico',
      topic: 'porcentajes'
    }
  ]

  for (const q of questions) {
    try {
      await db.question.create({ data: q })
      console.log(`✓ Pregunta agregada: ${q.question.substring(0, 50)}...`)
    } catch (error) {
      console.log(`⚠ Pregunta ya existe o error: ${q.id}`)
    }
  }

  console.log('\n¡Listo! Se agregaron las preguntas de porcentajes.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
