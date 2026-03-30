import { NextRequest, NextResponse } from 'next/server'

// URL de tu Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxCv0pFzv2W1vyX_WASskXRGZxgA9LE6E9nKw-gVFZUNQH8QM1G9sN4q6BC4OnRYn7ZrQ/exec'

// Registrar nuevo usuario o enviar reporte de actividad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipoRegistro, ci, nombre, apodo, sede, actividad, tipoActividad, universidad, nota, porcentaje } = body

    console.log('Recibiendo solicitud:', body)

    const params = new URLSearchParams()
    
    if (tipoRegistro === 'registro') {
      // Registro de usuario nuevo
      params.append('tipo', 'registro')
      params.append('ci', ci || '')
      params.append('nombre', nombre || '')
      params.append('apodo', apodo || '')
      params.append('sede', sede || '')
    } else {
      // Reporte de actividad
      params.append('tipo', 'actividad')
      params.append('ci', ci || '')
      params.append('nombre', nombre || '')
      params.append('actividad', actividad || '')
      params.append('tipoActividad', tipoActividad || 'quiz')
      params.append('universidad', universidad || '')
      params.append('nota', nota || '')
      params.append('porcentaje', String(porcentaje || '0'))
    }

    console.log('Enviando a Google Sheets:', params.toString())

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })

    const data = await response.text()
    console.log('Respuesta de Google:', data)
    
    try {
      const json = JSON.parse(data)
      return NextResponse.json(json)
    } catch {
      // Si la respuesta no es JSON válido, asumimos éxito
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error sending to Google Sheets:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar datos' },
      { status: 500 }
    )
  }
}
