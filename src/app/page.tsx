'use client'

import { useState, useRef, useEffect } from 'react'

// StudyMaster - Quiz App for Ecuador University Entrance Exams
// Updated: March 2026 - Added Preguntados Game

// Types
interface Question {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: number
  explanation?: string | null
  questionImage?: string | null
  optionAImage?: string | null
  optionBImage?: string | null
  optionCImage?: string | null
  optionDImage?: string | null
  category: string
  university: string
  type: string
  topic: string
}

interface TopicResult {
  topicId: string
  topicName: string
  total: number
  correct: number
  errors: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AdminUser {
  id: string
  username: string
  role: string
}

interface Student {
  ci: string
  nombre: string
  apodo: string
  sede: string
}

// Power-ups disponibles
interface PowerUps {
  fiftyFifty: number    // 50/50 - Elimina 2 opciones
  extraTime: number     // +Tiempo - Añade 10 segundos
  changeQuestion: number // Cambiar - Cambia la pregunta
  hint: number          // Pista - Muestra una pista
}

// Estadísticas del estudiante
interface StudentStats {
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  bestStreak: number
  currentStreak: number
  bestScore: number
  gamesPlayed: number
  simulacrosPlayed: number
  preguntadosWins: number
}

// Insignia con niveles
interface Badge {
  id: string
  name: string
  icon: string
  color: string
  type: 'razonamiento' | 'conocimiento' | 'universidad'
  level: number        // 0-6 (0 = sin insignia, 6 = completa)
  progress: number     // Preguntas correctas actuales
  thresholds: number[] // [5, 15, 30, 50, 75, 100]
}

// Logros desbloqueados
interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date | null
  unlocked: boolean
}

// Progreso completo del estudiante
interface StudentProgress {
  stats: StudentStats
  powerUps: PowerUps
  badges: Badge[]
  achievements: Achievement[]
  razonamientoCorrect: number  // Total correctas en razonamiento
  conocimientoCorrect: number  // Total correctas en conocimiento
  universityProgress: Record<string, number> // correctas por universidad
}

// Color Palette
const COLORS = {
  primary: '#172BDE',
  secondary: '#FF8000',
  accent: '#FFFFFF',
  success: '#22C55E',
  error: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B'
}

// ============================================
// SISTEMA DE INSIGNIAS Y LOGROS
// ============================================

// Niveles de insignias: 5→15→30→50→75→100
const BADGE_THRESHOLDS = [5, 15, 30, 50, 75, 100]
const BADGE_LEVELS = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐', '🏆']

// Insignias principales
const MAIN_BADGES: Badge[] = [
  { id: 'razonamiento', name: 'Razonamiento', icon: '🧠', color: '#8B5CF6', type: 'razonamiento', level: 0, progress: 0, thresholds: BADGE_THRESHOLDS },
  { id: 'conocimiento', name: 'Conocimiento', icon: '📚', color: '#3B82F6', type: 'conocimiento', level: 0, progress: 0, thresholds: BADGE_THRESHOLDS }
]

// Logros disponibles
const AVAILABLE_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', name: 'Primera Victoria', description: 'Responde tu primera pregunta correctamente', icon: '🎉', unlockedAt: null, unlocked: false },
  { id: 'streak_5', name: 'En Racha', description: 'Responde 5 preguntas correctas seguidas', icon: '🔥', unlockedAt: null, unlocked: false },
  { id: 'streak_10', name: 'Imparable', description: 'Responde 10 preguntas correctas seguidas', icon: '💪', unlockedAt: null, unlocked: false },
  { id: 'perfect_quiz', name: 'Perfecto', description: 'Completa un quiz sin errores', icon: '💯', unlockedAt: null, unlocked: false },
  { id: 'questions_100', name: 'Medio Millar', description: 'Responde 100 preguntas', icon: '📊', unlockedAt: null, unlocked: false },
  { id: 'questions_500', name: 'Maestro', description: 'Responde 500 preguntas', icon: '👑', unlockedAt: null, unlocked: false },
  { id: 'simulacro_5', name: 'Estudioso', description: 'Completa 5 simulacros', icon: '📖', unlockedAt: null, unlocked: false },
  { id: 'simulacro_20', name: 'Dedicado', description: 'Completa 20 simulacros', icon: '🏅', unlockedAt: null, unlocked: false },
  { id: 'badge_level_3', name: 'Experto', description: 'Alcanza nivel 3 en una insignia', icon: '🎖️', unlockedAt: null, unlocked: false },
  { id: 'badge_level_6', name: 'Leyenda', description: 'Completa una insignia al máximo', icon: '🌟', unlockedAt: null, unlocked: false },
  { id: 'all_universities', name: 'Explorador', description: 'Practica con todas las universidades', icon: '🗺️', unlockedAt: null, unlocked: false },
  { id: 'preguntados_3_wins', name: 'Campeón', description: 'Gana 3 juegos de Preguntados', icon: '🏆', unlockedAt: null, unlocked: false }
]

// Progreso inicial por defecto
const DEFAULT_PROGRESS: StudentProgress = {
  stats: {
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    bestStreak: 0,
    currentStreak: 0,
    bestScore: 0,
    gamesPlayed: 0,
    simulacrosPlayed: 0,
    preguntadosWins: 0
  },
  powerUps: {
    fiftyFifty: 2,
    extraTime: 2,
    changeQuestion: 1,
    hint: 2
  },
  badges: [...MAIN_BADGES],
  achievements: [...AVAILABLE_ACHIEVEMENTS],
  razonamientoCorrect: 0,
  conocimientoCorrect: 0,
  universityProgress: {}
}

// Lista de sedes
const SEDES = [
  'Ambato', 'Quito', 'Cuenca', 'Riobamba', 'Loja',
  'Puyo', 'Tena', 'Coca', 'Baños', 'Pelileo', 'Alausí', 'Otra'
]

// ============================================
// PREGUNTADOS - CONFIGURACIÓN DE REINOS
// ============================================

// Universidades por categoría
const UNIVERSIDADES_RAZONAMIENTO = ['uce', 'unach', 'utmach']
const UNIVERSIDADES_CONOCIMIENTO = ['espoch', 'epn', 'utn', 'espe']

// Reinos Modo Razonamiento (3 reinos, 5 correctas cada uno)
const REINOS_RAZONAMIENTO = [
  { id: 'numerico', name: 'Reino de Numérico', icon: '🔢', color: '#3B82F6', topics: ['series', 'proporciones', 'porcentajes', 'edades', 'operaciones', 'fracciones'] },
  { id: 'verbal', name: 'Reino de Verbal', icon: '📝', color: '#10B981', topics: ['sinonimos', 'antonimos', 'analogias', 'comprension', 'ordenacion'] },
  { id: 'abstracto', name: 'Reino de Abstracto', icon: '🧩', color: '#8B5CF6', topics: ['figuras', 'dominos', 'dados', 'matrices', 'giros', 'secuencias'] }
]

// Reinos Modo Conocimiento (6 reinos, 5 correctas cada uno)
const REINOS_CONOCIMIENTO = [
  { id: 'matematica', name: 'Reino de Matemática', icon: '📐', color: '#3B82F6', topics: ['algebra', 'geometria', 'trigonometria', 'matematicas'] },
  { id: 'fisica', name: 'Reino de Física', icon: '⚡', color: '#F59E0B', topics: ['movimiento', 'fuerzas', 'energia', 'ondas', 'fisica'] },
  { id: 'quimica', name: 'Reino de Química', icon: '🧪', color: '#10B981', topics: ['atomo', 'tabla periodica', 'reacciones', 'quimica'] },
  { id: 'lengua', name: 'Reino de Lengua y Literatura', icon: '📚', color: '#EC4899', topics: ['gramatica', 'ortografia', 'literatura', 'lenguaje'] },
  { id: 'ciudadania', name: 'Reino de Ciudadanía/Sociales', icon: '🏛️', color: '#6366F1', topics: ['ciudadania', 'historia', 'sociedad', 'emprendimiento'] },
  { id: 'biologia', name: 'Reino de Biología', icon: '🧬', color: '#14B8A6', topics: ['celula', 'genetica', 'anatomia', 'biologia'] }
]

// Reinos Modo Aleatorio (3 reinos por dificultad)
const REINOS_ALEATORIO = [
  { id: 'facil', name: 'Reino Fácil', icon: '🟢', color: '#22C55E', difficulty: 'easy' },
  { id: 'medio', name: 'Reino Medio', icon: '🟡', color: '#EAB308', difficulty: 'medium' },
  { id: 'dificil', name: 'Reino Difícil', icon: '🔴', color: '#EF4444', difficulty: 'hard' }
]

const PREGUNTADOS_QUESTIONS_TO_WIN = 5

// ============================================
// ESTRUCTURA ESPOCH
// ============================================

// Áreas de ESPOCH con sus temas
const espochAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  matematicas: {
    id: 'matematicas',
    name: 'Matemáticas',
    icon: '📐',
    topics: [
      { id: 'enteros_fracciones', name: 'Operaciones con enteros y fracciones' },
      { id: 'potencias_radicales', name: 'Potencias y radicales' },
      { id: 'productos_notables', name: 'Productos notables' },
      { id: 'dominio_rango', name: 'Dominio y rango' },
      { id: 'ecuacion_exponencial', name: 'Ecuación exponencial' },
      { id: 'funciones_compuestas', name: 'Funciones compuestas' },
      { id: 'matrices', name: 'Matrices' },
      { id: 'funciones', name: 'Funciones' },
      { id: 'logaritmos', name: 'Logaritmos' },
      { id: 'ecuaciones', name: 'Ecuaciones' },
      { id: 'conjuntos', name: 'Conjuntos' },
      { id: 'trigonometria', name: 'Trigonometría' },
      { id: 'sistemas_ecuaciones', name: 'Sistemas de ecuaciones e inecuaciones' }
    ]
  },
  fisica: {
    id: 'fisica',
    name: 'Física',
    icon: '⚡',
    topics: [
      { id: 'ley_hooke', name: 'Ley de Hooke' },
      { id: 'cargas', name: 'Cargas eléctricas' },
      { id: 'circuitos', name: 'Circuitos' },
      { id: 'fem', name: 'Fuerza electromotriz' },
      { id: 'ondas', name: 'Ondas' },
      { id: 'vectores', name: 'Vectores' },
      { id: 'gravitacion', name: 'Gravitación universal' },
      { id: 'keppler', name: 'Leyes de Keppler' },
      { id: 'calor', name: 'Calor' },
      { id: 'trabajo_energia', name: 'Trabajo y energía' },
      { id: 'momento', name: 'Momento' },
      { id: 'movimiento_parabolico', name: 'Movimiento parabólico' },
      { id: 'induccion_magnetismo', name: 'Inducción y magnetismo' },
      { id: 'lanzamiento_vertical', name: 'Lanzamiento vertical' },
      { id: 'mru', name: 'MRU' },
      { id: 'relatividad', name: 'Relatividad' },
      { id: 'newton', name: 'Leyes de Newton' }
    ]
  },
  quimica: {
    id: 'quimica',
    name: 'Química',
    icon: '🧪',
    topics: [
      { id: 'atomo', name: 'Átomo' },
      { id: 'tabla_periodica', name: 'Tabla periódica' },
      { id: 'configuracion_electronica', name: 'Configuración electrónica' },
      { id: 'enlaces', name: 'Enlaces químicos' },
      { id: 'inorganica', name: 'Química inorgánica' },
      { id: 'organica', name: 'Química orgánica' },
      { id: 'estequiometria', name: 'Estequiometría' },
      { id: 'gases', name: 'Gases' },
      { id: 'acidos_bases', name: 'Ácidos y bases' },
      { id: 'cinetica', name: 'Cinética química' },
      { id: 'velocidad_reaccion', name: 'Velocidad de reacción' },
      { id: 'equilibrio_quimico', name: 'Equilibrio químico' }
    ]
  },
  biologia: {
    id: 'biologia',
    name: 'Biología/Anatomía',
    icon: '🧬',
    topics: [
      { id: 'celula', name: 'La célula' },
      { id: 'genetica', name: 'Genética' },
      { id: 'sistemas_cuerpo', name: 'Sistemas del cuerpo humano' },
      { id: 'anatomia', name: 'Anatomía' },
      { id: 'ecologia', name: 'Ecología' }
    ]
  },
  ciudadania: {
    id: 'ciudadania',
    name: 'Ciudadanía',
    icon: '🏛️',
    topics: [
      { id: 'constitucion', name: 'Constitución' },
      { id: 'derechos', name: 'Derechos y deberes' },
      { id: 'democracia', name: 'Democracia' },
      { id: 'estado', name: 'El Estado' }
    ]
  },
  historia: {
    id: 'historia',
    name: 'Historia',
    icon: '📜',
    topics: [
      { id: 'historia_ecuador', name: 'Historia del Ecuador' },
      { id: 'historia_universal', name: 'Historia Universal' },
      { id: 'independencia', name: 'Independencia' },
      { id: 'epocas', name: 'Épocas históricas' }
    ]
  },
  emprendimiento: {
    id: 'emprendimiento',
    name: 'Emprendimiento',
    icon: '💡',
    topics: [
      { id: 'conceptos', name: 'Conceptos básicos' },
      { id: 'plan_negocio', name: 'Plan de negocios' },
      { id: 'marketing', name: 'Marketing' },
      { id: 'finanzas', name: 'Finanzas básicas' }
    ]
  },
  lengua: {
    id: 'lengua',
    name: 'Lengua y Literatura',
    icon: '📖',
    topics: [
      { id: 'gramatica', name: 'Gramática' },
      { id: 'ortografia', name: 'Ortografía' },
      { id: 'literatura', name: 'Literatura' },
      { id: 'comprension', name: 'Comprensión lectora' },
      { id: 'redaccion', name: 'Redacción' }
    ]
  }
}

// Simulacros por carrera ESPOCH
const espochCarreras: { id: string; name: string; distribution: Record<string, number> }[] = [
  {
    id: 'artes',
    name: 'Artes y Humanísticas',
    distribution: {
      emprendimiento: 12, matematicas: 20, fisica: 4, historia: 8,
      lengua: 20, quimica: 4, biologia: 4, ciudadania: 8
    }
  },
  {
    id: 'administracion',
    name: 'Administración',
    distribution: {
      emprendimiento: 16, matematicas: 20, fisica: 4, historia: 8,
      lengua: 16, quimica: 4, biologia: 4, ciudadania: 8
    }
  },
  {
    id: 'ciencias',
    name: 'Ciencias Naturales',
    distribution: {
      emprendimiento: 4, matematicas: 20, fisica: 16, historia: 4,
      lengua: 4, quimica: 16, biologia: 12, ciudadania: 4
    }
  },
  {
    id: 'tic',
    name: 'Tecnologías de la Información',
    distribution: {
      emprendimiento: 8, matematicas: 24, fisica: 16, historia: 4,
      lengua: 8, quimica: 12, biologia: 4, ciudadania: 4
    }
  },
  {
    id: 'ingenieria',
    name: 'Ingeniería',
    distribution: {
      emprendimiento: 4, matematicas: 24, fisica: 24, historia: 4,
      lengua: 8, quimica: 8, biologia: 4, ciudadania: 4
    }
  },
  {
    id: 'agricultura',
    name: 'Agricultura',
    distribution: {
      emprendimiento: 4, matematicas: 20, fisica: 16, historia: 4,
      lengua: 4, quimica: 16, biologia: 12, ciudadania: 4
    }
  },
  {
    id: 'salud',
    name: 'Salud y Bienestar',
    distribution: {
      emprendimiento: 4, matematicas: 8, fisica: 4, historia: 4,
      lengua: 16, quimica: 20, biologia: 20, ciudadania: 4
    }
  },
  {
    id: 'servicios',
    name: 'Servicios',
    distribution: {
      emprendimiento: 12, matematicas: 24, fisica: 4, historia: 8,
      lengua: 16, quimica: 4, biologia: 4, ciudadania: 8
    }
  }
]

// ============================================
// ESTRUCTURA UTA (existente)
// ============================================

const utaTypes: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  numerico: {
    id: 'numerico',
    name: 'Numérico',
    icon: '📊',
    topics: [
      { id: 'porcentajes', name: 'Porcentajes' },
      { id: 'aritmetica', name: 'Aritmética' },
      { id: 'algebra', name: 'Álgebra' },
      { id: 'geometria', name: 'Geometría' },
      { id: 'series', name: 'Series Numéricas' }
    ]
  },
  logico: {
    id: 'logico',
    name: 'Lógico',
    icon: '🔢',
    topics: [
      { id: 'silogismos', name: 'Silogismos' },
      { id: 'secuencias', name: 'Secuencias Lógicas' },
      { id: 'analogias', name: 'Analogías' },
      { id: 'deductivo', name: 'Razonamiento Deductivo' }
    ]
  },
  verbal: {
    id: 'verbal',
    name: 'Verbal',
    icon: '📝',
    topics: [
      { id: 'sinonimos', name: 'Sinónimos y Antónimos' },
      { id: 'comprension', name: 'Comprensión Lectora' },
      { id: 'analogias_verbales', name: 'Analogías Verbales' },
      { id: 'orden_ideas', name: 'Orden de Ideas' }
    ]
  }
}

// ============================================
// ESTRUCTURA UCE
// ============================================

const uceAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  numerico: {
    id: 'numerico',
    name: 'Numérico',
    icon: '📊',
    topics: [
      { id: 'porcentajes_uce', name: 'Porcentajes' },
      { id: 'proporcionalidad', name: 'Proporcionalidad' },
      { id: 'edades', name: 'Edades' },
      { id: 'razones_proporciones', name: 'Razones y Proporciones' },
      { id: 'numeros_reales', name: 'Operaciones con Números Reales' },
      { id: 'fracciones_uce', name: 'Fracciones' },
      { id: 'conjuntos_uce', name: 'Conjuntos' },
      { id: 'logica_proporcional', name: 'Lógica Proporcional' },
      { id: 'ecuaciones_uce', name: 'Ecuaciones' },
      { id: 'sistemas_ecuaciones_uce', name: 'Sistemas de Ecuaciones' },
      { id: 'series_aritmeticas', name: 'Series Aritméticas y Geométricas' },
      { id: 'series_alfanumericas', name: 'Series Alfanuméricas' }
    ]
  },
  verbal: {
    id: 'verbal',
    name: 'Verbal',
    icon: '📝',
    topics: [
      { id: 'sinonimos_antonimos_uce', name: 'Sinónimos y Antónimos' },
      { id: 'analogias_verbal_uce', name: 'Analogías' },
      { id: 'termino_excluido', name: 'Término Excluido' },
      { id: 'completacion_oraciones', name: 'Completación de Oraciones' },
      { id: 'ordenacion_oraciones', name: 'Ordenación de Oraciones' },
      { id: 'lectura_comprensiva', name: 'Lectura Comprensiva' },
      { id: 'refranes', name: 'Refranes' },
      { id: 'seleccion_logica', name: 'Selección Lógica' },
      { id: 'homonimas', name: 'Homónimas' }
    ]
  },
  abstracto: {
    id: 'abstracto',
    name: 'Abstracto',
    icon: '🧩',
    topics: [
      { id: 'dados', name: 'Dados' },
      { id: 'dominos', name: 'Dominós' },
      { id: 'analogias_abstracto', name: 'Analogías' },
      { id: 'secuencias_abstracto', name: 'Secuencias' },
      { id: 'matrices_uce', name: 'Matrices' },
      { id: 'giros', name: 'Giros' },
      { id: 'vistas', name: 'Vistas' },
      { id: 'imagen_excluyente', name: 'Imagen Excluyente' },
      { id: 'espejos', name: 'Espejos' }
    ]
  }
}

// Configuración de simulacro UCE: 150 preguntas en 120 minutos
const uceConfig = {
  totalQuestions: 150,
  timeMinutes: 120,
  distribution: {
    numerico: 50,
    verbal: 50,
    abstracto: 50
  }
}

// ============================================
// ESTRUCTURA EPN
// ============================================

const epnAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  matematicas: {
    id: 'matematicas',
    name: 'Matemáticas',
    icon: '📐',
    topics: [] // Sin temas específicos - práctica general
  },
  geometria: {
    id: 'geometria',
    name: 'Geometría',
    icon: '📏',
    topics: [] // Sin temas específicos - práctica general
  },
  fisica: {
    id: 'fisica',
    name: 'Física',
    icon: '⚡',
    topics: [] // Sin temas específicos - práctica general
  },
  quimica: {
    id: 'quimica',
    name: 'Química',
    icon: '🧪',
    topics: [] // Sin temas específicos - práctica general
  },
  lenguaje: {
    id: 'lenguaje',
    name: 'Lenguaje',
    icon: '📖',
    topics: [] // Sin temas específicos - práctica general
  }
}

// Configuración de simulacro EPN: 10 preguntas por dominio (50 total) en 90 minutos
const epnConfig = {
  totalQuestions: 50,
  timeMinutes: 90,
  distribution: {
    matematicas: 10,
    geometria: 10,
    fisica: 10,
    quimica: 10,
    lenguaje: 10
  }
}

// ============================================
// ESTRUCTURA UTN
// ============================================

const utnAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  matematica: {
    id: 'matematica',
    name: 'Matemática',
    icon: '📐',
    topics: [
      { id: 'algebra_utn', name: 'Álgebra' },
      { id: 'ecuaciones_utn', name: 'Ecuaciones' },
      { id: 'funciones_utn', name: 'Funciones' },
      { id: 'trigonometria_utn', name: 'Trigonometría' },
      { id: 'limites_utn', name: 'Límites' },
      { id: 'derivadas_utn', name: 'Derivadas' },
      { id: 'matrices_utn', name: 'Matrices' }
    ]
  },
  geometria: {
    id: 'geometria',
    name: 'Geometría',
    icon: '📏',
    topics: [
      { id: 'plana_analitica', name: 'Plana y Analítica' },
      { id: 'conicas_utn', name: 'Cónicas' }
    ]
  },
  fisica: {
    id: 'fisica',
    name: 'Física',
    icon: '⚡',
    topics: [
      { id: 'magnitudes_utn', name: 'Magnitudes' },
      { id: 'vectores_utn', name: 'Vectores' },
      { id: 'movimiento_utn', name: 'Movimiento' },
      { id: 'mru_utn', name: 'MRU' },
      { id: 'mruv_utn', name: 'MRUV' },
      { id: 'mcu_utn', name: 'MCU' },
      { id: 'mcuv_utn', name: 'MCUV' },
      { id: 'parabolico_utn', name: 'Parabólico' },
      { id: 'caida_libre', name: 'Caída Libre' },
      { id: 'lanzamiento_vertical_utn', name: 'Lanzamiento Vertical' },
      { id: 'leyes_newton_utn', name: 'Leyes de Newton' },
      { id: 'mas', name: 'Movimiento Armónico Simple' },
      { id: 'cantidad_movimiento', name: 'Cantidad de Movimiento' },
      { id: 'energia_utn', name: 'Energía' },
      { id: 'estatica_utn', name: 'Estática' },
      { id: 'electricidad_utn', name: 'Electricidad' },
      { id: 'ondas_utn', name: 'Ondas' }
    ]
  },
  quimica: {
    id: 'quimica',
    name: 'Química',
    icon: '🧪',
    topics: [
      { id: 'atomo_utn', name: 'Átomo' },
      { id: 'tabla_periodica_utn', name: 'Tabla Periódica' },
      { id: 'enlaces_utn', name: 'Enlaces' },
      { id: 'reacciones_utn', name: 'Reacciones' },
      { id: 'estequiometria_utn', name: 'Estequiometría' },
      { id: 'soluciones_utn', name: 'Soluciones' },
      { id: 'gases_utn', name: 'Gases' },
      { id: 'organica_utn', name: 'Orgánica' }
    ]
  },
  biologia: {
    id: 'biologia',
    name: 'Biología',
    icon: '🧬',
    topics: [
      { id: 'biomoleculas', name: 'Biomoléculas' },
      { id: 'celula_utn', name: 'Célula' },
      { id: 'genetica_utn', name: 'Genética' },
      { id: 'evolucion_utn', name: 'Evolución' },
      { id: 'microbiologia', name: 'Microbiología' },
      { id: 'ecologia_utn', name: 'Ecología' }
    ]
  },
  lenguaje_utn: {
    id: 'lenguaje_utn',
    name: 'Lenguaje',
    icon: '📖',
    topics: [
      { id: 'comprension_lectora_utn', name: 'Comprensión Lectora' },
      { id: 'redaccion_utn', name: 'Redacción' },
      { id: 'gramatica_utn', name: 'Gramática' },
      { id: 'ortografia_utn', name: 'Ortografía' },
      { id: 'oratoria', name: 'Oratoria' }
    ]
  },
  estadistica: {
    id: 'estadistica',
    name: 'Estadística',
    icon: '📊',
    topics: [
      { id: 'datos_utn', name: 'Datos' },
      { id: 'graficos_utn', name: 'Gráficos' },
      { id: 'medidas_estadisticas', name: 'Medidas Estadísticas' },
      { id: 'probabilidad_utn', name: 'Probabilidad' }
    ]
  },
  emprendimiento: {
    id: 'emprendimiento',
    name: 'Emprendimiento',
    icon: '💡',
    topics: [
      { id: 'negocios_utn', name: 'Negocios' },
      { id: 'costos_utn', name: 'Costos' },
      { id: 'mercado_utn', name: 'Mercado' },
      { id: 'proyectos_utn', name: 'Proyectos' }
    ]
  },
  anatomia: {
    id: 'anatomia',
    name: 'Anatomía',
    icon: '🏥',
    topics: [
      { id: 'sistemas_cuerpo_utn', name: 'Sistemas del Cuerpo' },
      { id: 'tejidos', name: 'Tejidos' },
      { id: 'fisiologia', name: 'Fisiología' }
    ]
  }
}

// Configuración de simulacro UTN: 15 preguntas por materia (120 total) en 120 minutos
const utnConfig = {
  totalQuestions: 120,
  timeMinutes: 120,
  distribution: {
    matematica: 15,
    geometria: 15,
    fisica: 15,
    quimica: 15,
    biologia: 15,
    lenguaje_utn: 15,
    estadistica: 15,
    emprendimiento: 15,
    anatomia: 15
  }
}

// ============================================
// ESTRUCTURA ESPOL
// ============================================

const espolAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  matematicas: {
    id: 'matematicas',
    name: 'Matemáticas',
    icon: '📐',
    topics: [] // Sin temas específicos - solo práctica general
  },
  fisica: {
    id: 'fisica',
    name: 'Física',
    icon: '⚡',
    topics: [] // Sin temas específicos - solo práctica general
  },
  quimica: {
    id: 'quimica',
    name: 'Química',
    icon: '🧪',
    topics: [] // Sin temas específicos - solo práctica general
  },
  razonamiento_numerico: {
    id: 'razonamiento_numerico',
    name: 'Razonamiento Numérico',
    icon: '🔢',
    topics: [] // Sin temas específicos - solo práctica general
  },
  razonamiento_verbal: {
    id: 'razonamiento_verbal',
    name: 'Razonamiento Verbal',
    icon: '📝',
    topics: [] // Sin temas específicos - solo práctica general
  },
  razonamiento_logico: {
    id: 'razonamiento_logico',
    name: 'Razonamiento Lógico',
    icon: '🧩',
    topics: [] // Sin temas específicos - solo práctica general
  }
}

// Configuración de simulacro ESPOL: 80 preguntas en 120 minutos
const espolConfig = {
  totalQuestions: 80,
  timeMinutes: 120,
  distribution: {
    matematicas: 14,
    fisica: 13,
    quimica: 13,
    razonamiento_numerico: 14,
    razonamiento_verbal: 13,
    razonamiento_logico: 13
  }
}

// ============================================
// ESTRUCTURA ESPE
// ============================================

const espeAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  algebra: {
    id: 'algebra',
    name: 'Álgebra',
    icon: '📐',
    topics: [
      { id: 'funciones_espe', name: 'Funciones' },
      { id: 'logica_proposicional', name: 'Lógica Proposicional' },
      { id: 'conjuntos_espe', name: 'Conjuntos' },
      { id: 'ecuaciones_exponenciales', name: 'Ecuaciones Exponenciales' },
      { id: 'inecuaciones_espe', name: 'Inecuaciones' }
    ]
  },
  geometria: {
    id: 'geometria',
    name: 'Geometría',
    icon: '📏',
    topics: [] // Práctica general
  },
  razonamiento_numerico: {
    id: 'razonamiento_numerico',
    name: 'Razonamiento Numérico',
    icon: '🔢',
    topics: [
      { id: 'operaciones_combinadas', name: 'Operaciones Combinadas' },
      { id: 'proporcionalidad_espe', name: 'Proporcionalidad' },
      { id: 'porcentajes_espe', name: 'Porcentajes' },
      { id: 'racionales', name: 'Operaciones con Racionales' }
    ]
  },
  quimica: {
    id: 'quimica',
    name: 'Química',
    icon: '🧪',
    topics: [] // Práctica general
  },
  fisica: {
    id: 'fisica',
    name: 'Física',
    icon: '⚡',
    topics: [
      { id: 'mru_espe', name: 'MRU' },
      { id: 'mruv_espe', name: 'MRUV' },
      { id: 'energias_espe', name: 'Energías' },
      { id: 'leyes_newton_espe', name: 'Leyes de Newton' }
    ]
  }
}

// Grupos ESPE para simulacro
const espeGrupos: { id: string; name: string; distribution: Record<string, number> }[] = [
  {
    id: 'grupo_a',
    name: 'Grupo A (Geometría + Álgebra)',
    distribution: { algebra: 20, geometria: 10 }
  },
  {
    id: 'grupo_b',
    name: 'Grupo B (Razonamiento Numérico)',
    distribution: { razonamiento_numerico: 30 }
  },
  {
    id: 'grupo_c',
    name: 'Grupo C (Química + Álgebra)',
    distribution: { algebra: 20, quimica: 10 }
  },
  {
    id: 'grupo_d',
    name: 'Grupo D (Física + Álgebra)',
    distribution: { algebra: 20, fisica: 10 }
  },
  {
    id: 'grupo_e',
    name: 'Grupo E (Razonamiento + Álgebra)',
    distribution: { razonamiento_numerico: 20, algebra: 10 }
  }
]

// Configuración ESPE: 30 preguntas en 90 minutos
const espeConfig = {
  totalQuestions: 30,
  timeMinutes: 90
}

// ============================================
// ESTRUCTURA UTC
// ============================================

const utcAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  biologia: {
    id: 'biologia',
    name: 'Biología',
    icon: '🧬',
    topics: [
      { id: 'celula_utc', name: 'Célula' },
      { id: 'organos', name: 'Órganos' }
    ]
  },
  quimica: {
    id: 'quimica',
    name: 'Química',
    icon: '🧪',
    topics: [
      { id: 'estequiometria_utc', name: 'Estequiometría' },
      { id: 'tabla_periodica_utc', name: 'Tabla Periódica' }
    ]
  },
  fisica: {
    id: 'fisica',
    name: 'Física',
    icon: '⚡',
    topics: [
      { id: 'mru_utc', name: 'MRU' },
      { id: 'mruv_utc', name: 'MRUV' }
    ]
  },
  numerico: {
    id: 'numerico',
    name: 'Numérico',
    icon: '🔢',
    topics: [
      { id: 'probabilidad_utc', name: 'Probabilidad' },
      { id: 'combinatoria', name: 'Combinatoria' },
      { id: 'fracciones_utc', name: 'Fracciones' },
      { id: 'areas_utc', name: 'Áreas' }
    ]
  },
  matematicas: {
    id: 'matematicas',
    name: 'Matemáticas',
    icon: '📐',
    topics: [
      { id: 'algebra_utc', name: 'Álgebra' }
    ]
  },
  verbal: {
    id: 'verbal',
    name: 'Verbal',
    icon: '📝',
    topics: [
      { id: 'homonimas', name: 'Homónimas' },
      { id: 'paronimas', name: 'Parónimas' },
      { id: 'lecturas', name: 'Lecturas - Idea Principal' },
      { id: 'ortografia_utc', name: 'Ortografía' }
    ]
  },
  abstracto: {
    id: 'abstracto',
    name: 'Abstracto',
    icon: '🧩',
    topics: [] // Práctica general
  }
}

// Configuración UTC: 90 preguntas en 90 minutos
const utcConfig = {
  totalQuestions: 90,
  timeMinutes: 90,
  distribution: {
    verbal: 28,
    numerico: 18,
    abstracto: 20,
    matematicas: 9,
    fisica: 6,
    quimica: 5,
    biologia: 4
  }
}

// ============================================
// ESTRUCTURA YACHAY
// ============================================

const yachayAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  numerico: {
    id: 'numerico',
    name: 'Numérico',
    icon: '📊',
    topics: [
      { id: 'porcentajes_yachay', name: 'Porcentajes' },
      { id: 'proporcionalidad_yachay', name: 'Proporcionalidad' },
      { id: 'edades_yachay', name: 'Edades' },
      { id: 'razones_proporciones_yachay', name: 'Razones y Proporciones' },
      { id: 'numeros_reales_yachay', name: 'Operaciones con Números Reales' },
      { id: 'fracciones_yachay', name: 'Fracciones' },
      { id: 'conjuntos_yachay', name: 'Conjuntos' },
      { id: 'logica_proporcional_yachay', name: 'Lógica Proporcional' },
      { id: 'ecuaciones_yachay', name: 'Ecuaciones' },
      { id: 'sistemas_ecuaciones_yachay', name: 'Sistemas de Ecuaciones' },
      { id: 'series_aritmeticas_yachay', name: 'Series Aritméticas y Geométricas' },
      { id: 'series_alfanumericas_yachay', name: 'Series Alfanuméricas' }
    ]
  },
  verbal: {
    id: 'verbal',
    name: 'Verbal',
    icon: '📝',
    topics: [
      { id: 'analogias_yachay', name: 'Analogías' },
      { id: 'ordenacion_sintactica', name: 'Ordenación Sintáctica' },
      { id: 'ortografia_gramatica', name: 'Ortografía y Gramática' },
      { id: 'seleccion_logica_yachay', name: 'Selección Lógica' },
      { id: 'conectores_logicos', name: 'Conectores Lógicos' },
      { id: 'sinonimia_antonimia', name: 'Sinonimia y Antonimia Contextual' },
      { id: 'inferencia_logica', name: 'Inferencia Lógica' },
      { id: 'lectura_comprensiva_yachay', name: 'Lectura Comprensiva' },
      { id: 'termino_excluido', name: 'Término Excluido' }
    ]
  },
  abstracto: {
    id: 'abstracto',
    name: 'Abstracto',
    icon: '🧩',
    topics: [
      { id: 'dados_yachay', name: 'Dados' },
      { id: 'dominos_yachay', name: 'Dominós' },
      { id: 'analogias_abstracto_yachay', name: 'Analogías' },
      { id: 'secuencias_graficas', name: 'Secuencias Gráficas Horizontales' },
      { id: 'giros_yachay', name: 'Giros' },
      { id: 'vistas_proyecciones', name: 'Vistas y Proyecciones' }
    ]
  }
}

// Configuración YACHAY: 80 preguntas en 90 minutos
const yachayConfig = {
  totalQuestions: 80,
  timeMinutes: 90,
  distribution: {
    numerico: 30,
    verbal: 20,
    abstracto: 30
  }
}

// ============================================
// ESTRUCTURA UNACH
// ============================================

const unachAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  numerico: {
    id: 'numerico',
    name: 'Razonamiento Numérico',
    icon: '📊',
    topics: [
      { id: 'porcentajes_unach', name: 'Porcentajes' },
      { id: 'operaciones_basicas', name: 'Operaciones Básicas' },
      { id: 'area_perimetro', name: 'Área y Perímetros' },
      { id: 'ecuaciones_unach', name: 'Ecuaciones' },
      { id: 'proporcionalidad_unach', name: 'Proporcionalidad' },
      { id: 'series_numericas_unach', name: 'Series Numéricas' }
    ]
  },
  verbal: {
    id: 'verbal',
    name: 'Razonamiento Verbal',
    icon: '📝',
    topics: [
      { id: 'inferencias_unach', name: 'Inferencias' },
      { id: 'sinonimos_unach', name: 'Sinónimos' },
      { id: 'antonimos_unach', name: 'Antónimos' },
      { id: 'termino_excluido_unach', name: 'Término Excluido' },
      { id: 'analogias_unach', name: 'Analogías' }
    ]
  },
  abstracto: {
    id: 'abstracto',
    name: 'Razonamiento Abstracto',
    icon: '🧩',
    topics: [
      { id: 'dados_unach', name: 'Dados' },
      { id: 'dominos_unach', name: 'Dominós' },
      { id: 'analogias_abstracto_unach', name: 'Analogías' },
      { id: 'secuencias_graficas_unach', name: 'Secuencias Gráficas' },
      { id: 'giros_unach', name: 'Giros' },
      { id: 'vistas_proyecciones_unach', name: 'Vistas y Proyecciones' }
    ]
  }
}

// Configuración UNACH: 80 preguntas en 90 minutos (20 verbal, 30 numérico, 30 abstracto)
const unachConfig = {
  totalQuestions: 80,
  timeMinutes: 90,
  distribution: {
    numerico: 30,
    verbal: 20,
    abstracto: 30
  }
}

// ============================================
// ESTRUCTURA UTMACH
// ============================================

const utmachAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  numerico: {
    id: 'numerico',
    name: 'Numérico',
    icon: '📊',
    topics: [
      { id: 'porcentajes_utmach', name: 'Porcentajes' },
      { id: 'proporcionalidad_utmach', name: 'Proporcionalidad' },
      { id: 'edades_utmach', name: 'Edades' },
      { id: 'razones_proporciones_utmach', name: 'Razones y Proporciones' },
      { id: 'numeros_reales_utmach', name: 'Operaciones con Números Reales' },
      { id: 'fracciones_utmach', name: 'Fracciones' },
      { id: 'conjuntos_utmach', name: 'Conjuntos' },
      { id: 'ecuaciones_utmach', name: 'Ecuaciones' },
      { id: 'sistemas_ecuaciones_utmach', name: 'Sistemas de Ecuaciones' },
      { id: 'series_aritmeticas_utmach', name: 'Series Aritméticas y Geométricas' },
      { id: 'series_alfanumericas_utmach', name: 'Series Alfanuméricas' }
    ]
  },
  verbal: {
    id: 'verbal',
    name: 'Verbal',
    icon: '📝',
    topics: [
      { id: 'tiempo_verbal', name: 'Tiempo Verbal y Término Excluido' },
      { id: 'tipo_textos', name: 'Tipo de Textos' },
      { id: 'tipo_oraciones', name: 'Tipo de Oraciones' },
      { id: 'completar_oraciones', name: 'Completar Oraciones' },
      { id: 'sinonimos_antonimos_utmach', name: 'Sinónimos y Antónimos' },
      { id: 'inferencias_homofonas', name: 'Inferencias Homófonas' },
      { id: 'analogias_utmach', name: 'Analogías' },
      { id: 'refranes', name: 'Refranes' }
    ]
  },
  abstracto: {
    id: 'abstracto',
    name: 'Abstracto',
    icon: '🧩',
    topics: [
      { id: 'dados_utmach', name: 'Dados' },
      { id: 'dominos_utmach', name: 'Dominós' },
      { id: 'analogias_abstracto_utmach', name: 'Analogías' },
      { id: 'secuencias_graficas_utmach', name: 'Secuencias Gráficas Horizontales' },
      { id: 'giros_utmach', name: 'Giros' },
      { id: 'vistas_proyecciones_utmach', name: 'Vistas y Proyecciones' },
      { id: 'matrices_utmach', name: 'Matrices' }
    ]
  }
}

// Configuración UTMACH: 50 preguntas en 90 minutos (15 verbal, 20 numérico, 15 abstracto)
const utmachConfig = {
  totalQuestions: 50,
  timeMinutes: 90,
  distribution: {
    verbal: 15,
    numerico: 20,
    abstracto: 15
  }
}

// ============================================
// ESTRUCTURA UNL
// ============================================

// Áreas de Razonamiento UNL
const unlRazonamientoAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  numerico: {
    id: 'numerico',
    name: 'Numérico',
    icon: '📊',
    topics: [
      { id: 'proporcionalidad_unl', name: 'Proporcionalidad' },
      { id: 'conversion_unidades', name: 'Conversión de Unidades' },
      { id: 'planteamiento_ecuaciones', name: 'Planteamiento de Ecuaciones' },
      { id: 'edades_unl', name: 'Edades' },
      { id: 'porcentajes_unl', name: 'Porcentajes' },
      { id: 'aplicacion_fracciones', name: 'Aplicación de Fracciones' },
      { id: 'razones_proporciones_unl', name: 'Razones y Proporciones' }
    ]
  },
  verbal: {
    id: 'verbal',
    name: 'Verbal',
    icon: '📝',
    topics: [
      { id: 'sinonimos_unl', name: 'Sinónimos' },
      { id: 'antonimos_unl', name: 'Antónimos' },
      { id: 'termino_excluido_unl', name: 'Término Excluido' },
      { id: 'analogias_unl', name: 'Analogías' },
      { id: 'completar_oraciones_unl', name: 'Completar Oraciones' },
      { id: 'seleccion_logica_unl', name: 'Selección Lógica' },
      { id: 'premisas_conclusiones', name: 'Premisas y Conclusiones' },
      { id: 'comprension_lectora_unl', name: 'Comprensión Lectora' }
    ]
  },
  logico: {
    id: 'logico',
    name: 'Lógico',
    icon: '🧩',
    topics: [
      { id: 'series_verbales_unl', name: 'Series Verbales' },
      { id: 'series_numericas_unl', name: 'Series Numéricas' },
      { id: 'series_alfabeticas', name: 'Series Alfabéticas' }
    ]
  }
}

// Áreas de Conocimientos UNL por carrera
const unlConocimientosAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  agropecuaria: {
    id: 'agropecuaria',
    name: 'Agropecuaria y RR.NN.',
    icon: '🌾',
    topics: [
      { id: 'quimica_agro', name: 'Química' },
      { id: 'fisica_agro', name: 'Física' },
      { id: 'biologia_agro', name: 'Biología' },
      { id: 'etica_agro', name: 'Ética' }
    ]
  },
  pedagogias: {
    id: 'pedagogias',
    name: 'Pedagogías',
    icon: '📖',
    topics: [
      { id: 'pedagogia', name: 'Pedagogías' },
      { id: 'filosofia_ped', name: 'Filosofía' },
      { id: 'etica_ped', name: 'Ética' }
    ]
  },
  juridica: {
    id: 'juridica',
    name: 'Jurídica, Social y Admin.',
    icon: '⚖️',
    topics: [
      { id: 'sociedad_politica', name: 'Sociedad y Política' },
      { id: 'filosofia_jur', name: 'Filosofía' },
      { id: 'etica_jur', name: 'Ética' }
    ]
  },
  salud: {
    id: 'salud',
    name: 'Salud Humana',
    icon: '🏥',
    topics: [
      { id: 'quimica_salud', name: 'Química' },
      { id: 'fisica_salud', name: 'Física' },
      { id: 'biologia_salud', name: 'Biología' },
      { id: 'etica_salud', name: 'Ética' }
    ]
  },
  ingenierias: {
    id: 'ingenierias',
    name: 'Ingenierías',
    icon: '🔧',
    topics: [
      { id: 'matematica_ing', name: 'Matemática' },
      { id: 'fisica_ing', name: 'Física' },
      { id: 'etica_ing', name: 'Ética' }
    ]
  }
}

// Configuración UNL: 100 preguntas (40 razonamiento + 60 conocimientos)
const unlConfig = {
  totalQuestions: 100,
  timeMinutes: 120, // 2 horas
  razonamientoQuestions: 40,
  conocimientoQuestions: 60
}

// ============================================
// ESTRUCTURA UTPL
// ============================================

// Áreas base para todas las carreras UTPL
const utplBaseAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  matematica: {
    id: 'matematica',
    name: 'Matemática',
    icon: '📐',
    topics: [
      { id: 'algebra_utpl', name: 'Álgebra' },
      { id: 'aritmetica_utpl', name: 'Aritmética' },
      { id: 'geometria_utpl', name: 'Geometría' },
      { id: 'funciones_utpl', name: 'Funciones' }
    ]
  },
  verbal: {
    id: 'verbal',
    name: 'Verbal',
    icon: '📝',
    topics: [
      { id: 'sinonimos_utpl', name: 'Sinónimos y Antónimos' },
      { id: 'analogias_utpl', name: 'Analogías' },
      { id: 'comprension_utpl', name: 'Comprensión Lectora' },
      { id: 'orden_ideas_utpl', name: 'Orden de Ideas' }
    ]
  },
  abstracto: {
    id: 'abstracto',
    name: 'Abstracto',
    icon: '🧩',
    topics: [
      { id: 'series_utpl', name: 'Series' },
      { id: 'matrices_utpl', name: 'Matrices' },
      { id: 'dominos_utpl', name: 'Dominós' },
      { id: 'dados_utpl', name: 'Dados' }
    ]
  }
}

// Áreas adicionales para carreras de salud UTPL
const utplSaludAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  quimica: {
    id: 'quimica',
    name: 'Química',
    icon: '🧪',
    topics: [
      { id: 'quimica_organica_utpl', name: 'Química Orgánica' },
      { id: 'quimica_inorganica_utpl', name: 'Química Inorgánica' },
      { id: 'estequiometria_utpl', name: 'Estequiometría' }
    ]
  },
  biologia: {
    id: 'biologia',
    name: 'Biología',
    icon: '🧬',
    topics: [
      { id: 'celula_utpl', name: 'La Célula' },
      { id: 'genetica_utpl', name: 'Genética' },
      { id: 'sistemas_utpl', name: 'Sistemas del Cuerpo' }
    ]
  },
  fisica: {
    id: 'fisica',
    name: 'Física',
    icon: '⚡',
    topics: [
      { id: 'mecanica_utpl', name: 'Mecánica' },
      { id: 'electricidad_utpl', name: 'Electricidad' },
      { id: 'ondas_utpl', name: 'Ondas' }
    ]
  }
}

// Configuración UTPL: 15 preguntas por dominio en 60 minutos
const utplConfig = {
  totalQuestions: 45, // 3 áreas base × 15 = 45 (o 6 áreas × 15 = 90 para salud)
  timeMinutes: 60,
  questionsPerArea: 15,
  baseAreas: ['matematica', 'verbal', 'abstracto'],
  saludAreas: ['quimica', 'biologia', 'fisica']
}

// ============================================
// ESTRUCTURA U CUENCA
// ============================================

const ucuencaAreas: Record<string, { id: string; name: string; icon: string; topics: { id: string; name: string }[] }> = {
  ciencias_naturales: {
    id: 'ciencias_naturales',
    name: 'Ciencias Naturales',
    icon: '🔬',
    topics: [
      { id: 'biologia_ucuenca', name: 'Biología' },
      { id: 'quimica_ucuenca', name: 'Química' },
      { id: 'fisica_ucuenca', name: 'Física' },
      { id: 'ecologia_ucuenca', name: 'Ecología' }
    ]
  },
  ciencias_sociales: {
    id: 'ciencias_sociales',
    name: 'Ciencias Sociales',
    icon: '🌍',
    topics: [
      { id: 'historia_ucuenca', name: 'Historia' },
      { id: 'geografia_ucuenca', name: 'Geografía' },
      { id: 'civica_ucuenca', name: 'Cívica' },
      { id: 'economia_ucuenca', name: 'Economía' }
    ]
  },
  matematica: {
    id: 'matematica',
    name: 'Matemática',
    icon: '📐',
    topics: [
      { id: 'algebra_ucuenca', name: 'Álgebra' },
      { id: 'aritmetica_ucuenca', name: 'Aritmética' },
      { id: 'geometria_ucuenca', name: 'Geometría' },
      { id: 'estadistica_ucuenca', name: 'Estadística' }
    ]
  },
  abstracto: {
    id: 'abstracto',
    name: 'Abstracto',
    icon: '🧩',
    topics: [
      { id: 'series_ucuenca', name: 'Series' },
      { id: 'razonamiento_ucuenca', name: 'Razonamiento Lógico' },
      { id: 'matrices_ucuenca', name: 'Matrices' },
      { id: 'figuras_ucuenca', name: 'Figuras' }
    ]
  },
  lengua_literatura: {
    id: 'lengua_literatura',
    name: 'Lengua y Literatura',
    icon: '📖',
    topics: [
      { id: 'gramatica_ucuenca', name: 'Gramática' },
      { id: 'ortografia_ucuenca', name: 'Ortografía' },
      { id: 'literatura_ucuenca', name: 'Literatura' },
      { id: 'comprension_ucuenca', name: 'Comprensión Lectora' }
    ]
  }
}

// Configuración U Cuenca: 60 preguntas en 120 minutos
const ucuencaConfig = {
  totalQuestions: 60,
  timeMinutes: 120,
  distribution: {
    ciencias_naturales: 9,
    ciencias_sociales: 9,
    matematica: 14,
    abstracto: 14,
    lengua_literatura: 14
  }
}

// ============================================
// CATEGORÍAS Y UNIVERSIDADES
// ============================================

const categories: Record<string, { name: string; icon: string; description: string }> = {
  razonamiento: { 
    name: 'Razonamiento', 
    icon: '🧠',
    description: 'Desarrolla tu mente lógica'
  },
  conocimiento: { 
    name: 'Conocimiento', 
    icon: '📚',
    description: 'Amplía tu cultura general'
  },
  conocimiento_razonamiento: { 
    name: 'Conocimientos y Razonamiento', 
    icon: '🎓',
    description: 'Combina conocimiento y habilidad'
  }
}

const universities: Record<string, { id: string; name: string; fullName: string; color: string }[]> = {
  razonamiento: [
    { id: 'uta', name: 'UTA', fullName: 'Universidad Técnica de Ambato', color: '#172BDE' },
    { id: 'unach', name: 'UNACH', fullName: 'Universidad Nacional de Chimborazo', color: '#8B5CF6' },
    { id: 'uce', name: 'UCE', fullName: 'Universidad Central del Ecuador', color: '#DC2626' },
    { id: 'yachay', name: 'YACHAY', fullName: 'Universidad YACHAY Tech', color: '#00BCD4' },
    { id: 'utmach', name: 'UTMACH', fullName: 'Universidad Técnica de Machala', color: '#FF6B35' }
  ],
  conocimiento: [
    { id: 'espoch', name: 'ESPOCH', fullName: 'Escuela Superior Politécnica de Chimborazo', color: '#059669' },
    { id: 'epn', name: 'EPN', fullName: 'Escuela Politécnica Nacional', color: '#F59E0B' },
    { id: 'utn', name: 'UTN', fullName: 'Universidad Técnica del Norte', color: '#7C3AED' },
    { id: 'espe', name: 'ESPE', fullName: 'Escuela Politécnica del Ejército', color: '#2E7D32' }
  ],
  conocimiento_razonamiento: [
    { id: 'espol', name: 'ESPOL', fullName: 'Escuela Superior Politécnica del Litoral', color: '#0EA5E9' },
    { id: 'utc', name: 'UTC', fullName: 'Universidad Técnica de Cotopaxi', color: '#E91E63' },
    { id: 'unl', name: 'UNL', fullName: 'Universidad Nacional de Loja', color: '#1E88E5' },
    { id: 'utpl', name: 'UTPL', fullName: 'Universidad Técnica Particular de Loja', color: '#FFB300' },
    { id: 'ucuenca', name: 'U Cuenca', fullName: 'Universidad de Cuenca', color: '#D32F2F' }
  ]
}

// Configuración de tiempos por universidad
const universityConfig: Record<string, { simulacroTime: number; simulacroQuestions: number }> = {
  espoch: { simulacroTime: 150, simulacroQuestions: 80 }, // 2h 30min
  espol: { simulacroTime: 120, simulacroQuestions: 80 },  // 2h
  uce: { simulacroTime: 120, simulacroQuestions: 150 },   // 2h - 150 preguntas
  epn: { simulacroTime: 90, simulacroQuestions: 50 },     // 1h 30min - 50 preguntas
  utn: { simulacroTime: 120, simulacroQuestions: 120 },   // 2h - 120 preguntas
  espe: { simulacroTime: 90, simulacroQuestions: 30 },    // 1h 30min - 30 preguntas
  utc: { simulacroTime: 90, simulacroQuestions: 90 },     // 1h 30min - 90 preguntas
  yachay: { simulacroTime: 90, simulacroQuestions: 80 },  // 1h 30min - 80 preguntas
  unach: { simulacroTime: 90, simulacroQuestions: 80 },   // 1h 30min - 80 preguntas
  utmach: { simulacroTime: 90, simulacroQuestions: 50 },  // 1h 30min - 50 preguntas
  unl: { simulacroTime: 120, simulacroQuestions: 100 },   // 2h - 100 preguntas
  utpl: { simulacroTime: 60, simulacroQuestions: 45 },    // 1h - 45 preguntas (base)
  ucuenca: { simulacroTime: 120, simulacroQuestions: 60 } // 2h - 60 preguntas
}

// Helper to get saved student from localStorage
function getSavedStudent(): Student | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem('studentData')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    localStorage.removeItem('studentData')
  }
  return null
}

export default function StudyMaster() {
  // Student state - inicializar como null para evitar hydration mismatch
  const [student, setStudent] = useState<Student | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [registrationForm, setRegistrationForm] = useState({
    nombre: '', apodo: '', ci: '', sede: ''
  })
  const [registering, setRegistering] = useState(false)

  // ============================================
  // SISTEMA DE PROGRESO Y POWER-UPS
  // ============================================
  const [studentProgress, setStudentProgress] = useState<StudentProgress>(DEFAULT_PROGRESS)
  const [showProfile, setShowProfile] = useState(false)
  
  // Power-ups activos durante el quiz
  const [activePowerUps, setActivePowerUps] = useState({
    fiftyFiftyUsed: false,
    eliminatedOptions: [] as number[],
    hintShown: false,
    extraTimeAdded: false
  })

  // Hydration effect - leer localStorage después del montaje
  useEffect(() => {
    const saved = getSavedStudent()
    if (saved) {
      setStudent(saved)
      setShowRegistration(false)
      // Cargar progreso guardado
      const savedProgress = localStorage.getItem('studentProgress')
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress)
          setStudentProgress(parsed)
        } catch {
          setStudentProgress(DEFAULT_PROGRESS)
        }
      }
    } else {
      setShowRegistration(true)
    }
    setIsHydrated(true)
  }, [])

  // Guardar progreso cuando cambie
  useEffect(() => {
    if (student) {
      localStorage.setItem('studentProgress', JSON.stringify(studentProgress))
    }
  }, [studentProgress, student])

  // Función para actualizar progreso
  const updateProgress = (correct: boolean, category: string, university: string) => {
    setStudentProgress(prev => {
      const newStats = { ...prev.stats }
      newStats.totalQuestions += 1
      
      if (correct) {
        newStats.correctAnswers += 1
        newStats.currentStreak += 1
        if (newStats.currentStreak > newStats.bestStreak) {
          newStats.bestStreak = newStats.currentStreak
        }
        
        // Actualizar insignias principales
        let newRazonamiento = prev.razonamientoCorrect
        let newConocimiento = prev.conocimientoCorrect
        
        if (category === 'razonamiento') {
          newRazonamiento += 1
        } else if (category === 'conocimiento') {
          newConocimiento += 1
        }
        
        // Actualizar progreso por universidad
        const newUniProgress = { ...prev.universityProgress }
        newUniProgress[university] = (newUniProgress[university] || 0) + 1
        
        // Actualizar nivel de insignias
        const newBadges = prev.badges.map(badge => {
          const progress = badge.type === 'razonamiento' ? newRazonamiento : newConocimiento
          let newLevel = 0
          for (let i = 0; i < BADGE_THRESHOLDS.length; i++) {
            if (progress >= BADGE_THRESHOLDS[i]) newLevel = i + 1
          }
          return { ...badge, progress, level: newLevel }
        })
        
        // Verificar logros
        const newAchievements = [...prev.achievements]
        
        // Primera pregunta correcta
        if (newStats.correctAnswers === 1) {
          const idx = newAchievements.findIndex(a => a.id === 'first_win')
          if (idx >= 0 && !newAchievements[idx].unlocked) {
            newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: new Date() }
          }
        }
        
        // Rachas
        if (newStats.currentStreak >= 5) {
          const idx = newAchievements.findIndex(a => a.id === 'streak_5')
          if (idx >= 0 && !newAchievements[idx].unlocked) {
            newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: new Date() }
          }
        }
        if (newStats.currentStreak >= 10) {
          const idx = newAchievements.findIndex(a => a.id === 'streak_10')
          if (idx >= 0 && !newAchievements[idx].unlocked) {
            newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: new Date() }
          }
        }
        
        // Total de preguntas
        if (newStats.totalQuestions >= 100) {
          const idx = newAchievements.findIndex(a => a.id === 'questions_100')
          if (idx >= 0 && !newAchievements[idx].unlocked) {
            newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: new Date() }
          }
        }
        if (newStats.totalQuestions >= 500) {
          const idx = newAchievements.findIndex(a => a.id === 'questions_500')
          if (idx >= 0 && !newAchievements[idx].unlocked) {
            newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: new Date() }
          }
        }
        
        // Nivel de insignia
        const maxLevel = Math.max(...newBadges.map(b => b.level))
        if (maxLevel >= 3) {
          const idx = newAchievements.findIndex(a => a.id === 'badge_level_3')
          if (idx >= 0 && !newAchievements[idx].unlocked) {
            newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: new Date() }
          }
        }
        if (maxLevel >= 6) {
          const idx = newAchievements.findIndex(a => a.id === 'badge_level_6')
          if (idx >= 0 && !newAchievements[idx].unlocked) {
            newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: new Date() }
          }
        }
        
        return {
          ...prev,
          stats: newStats,
          badges: newBadges,
          achievements: newAchievements,
          razonamientoCorrect: newRazonamiento,
          conocimientoCorrect: newConocimiento,
          universityProgress: newUniProgress
        }
      } else {
        newStats.wrongAnswers += 1
        newStats.currentStreak = 0
        return { ...prev, stats: newStats }
      }
    })
  }

  // Función para usar power-up
  const usePowerUp = (type: 'fiftyFifty' | 'extraTime' | 'changeQuestion' | 'hint') => {
    if (studentProgress.powerUps[type] <= 0) return false
    
    setStudentProgress(prev => ({
      ...prev,
      powerUps: {
        ...prev.powerUps,
        [type]: prev.powerUps[type] - 1
      }
    }))
    
    return true
  }

  // Función para ganar power-ups (al completar actividades)
  const earnPowerUps = () => {
    setStudentProgress(prev => ({
      ...prev,
      powerUps: {
        fiftyFifty: prev.powerUps.fiftyFifty + 1,
        extraTime: prev.powerUps.extraTime + 1,
        changeQuestion: prev.powerUps.changeQuestion + 1,
        hint: prev.powerUps.hint + 1
      }
    }))
  }

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<string>('home')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedUniversity, setSelectedUniversity] = useState<string>('')
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedCarrera, setSelectedCarrera] = useState<string>('')
  const [quizMode, setQuizMode] = useState<'area' | 'simulacro'>('area')

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [topicResults, setTopicResults] = useState<TopicResult[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(0) // en segundos
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Auth state (admin)
  const [showLogin, setShowLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string>('')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')

  // Admin state
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminTab, setAdminTab] = useState<'single' | 'aiken' | 'games'>('single')
  const [adminCat, setAdminCat] = useState<string>('')
  const [adminUni, setAdminUni] = useState<string>('')
  const [adminArea, setAdminArea] = useState<string>('')
  const [adminTopic, setAdminTopic] = useState<string>('')
  const [adminQuestions, setAdminQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState({
    text: '', optA: '', optB: '', optC: '', optD: '', correct: '0', explanation: ''
  })
  const [questionImages, setQuestionImages] = useState({
    question: '', optA: '', optB: '', optC: '', optD: ''
  })
  const [aikenText, setAikenText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; count: number } | null>(null)

  // Game Admin states
  const [adminGames, setAdminGames] = useState<any[]>([])
  const [gameCode, setGameCode] = useState('')
  const [gameForm, setGameForm] = useState({
    name: '',
    description: '',
    gameType: 'quiz',
    difficulty: 'medium',
    timeLimit: '',
    category: '',
    university: '',
    area: '',
    topic: ''
  })
  const [savingGame, setSavingGame] = useState(false)
  const [gameImportResult, setGameImportResult] = useState<{ success: boolean; message: string } | null>(null)

  // MR. Q Chat states
  const [showMrQ, setShowMrQ] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [mrqMood, setMrqMood] = useState<'feliz' | 'triste' | 'pensativo'>('feliz')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Avatar helper
  const getMrqAvatar = (mood: 'feliz' | 'triste' | 'pensativo' = mrqMood) => {
    switch(mood) {
      case 'triste': return '/avatars/avatar-triste.png'
      case 'pensativo': return '/avatars/avatar-pensativo.png'
      default: return '/avatars/avatar-feliz.png'
    }
  }

  // Game states
  const [showGame, setShowGame] = useState(false)
  const [gameQuestions, setGameQuestions] = useState<Question[]>([])
  const [gameIndex, setGameIndex] = useState(0)
  const [gameScore, setGameScore] = useState(0)
  const [gameAnswer, setGameAnswer] = useState<number | null>(null)
  const [gameAnswered, setGameAnswered] = useState(false)

  // Preguntados Game States
  const [preguntadosMode, setPreguntadosMode] = useState<'razonamiento' | 'conocimiento' | 'aleatorio' | null>(null)
  const [preguntadosPlayers, setPreguntadosPlayers] = useState<string[]>([])
  const [preguntadosCurrentPlayer, setPreguntadosCurrentPlayer] = useState<number>(0)
  const [preguntadosPlayerOrder, setPreguntadosPlayerOrder] = useState<number[]>([])
  const [preguntadosReinos, setPreguntadosReinos] = useState<Record<string, number>>({})
  const [preguntadosCurrentReino, setPreguntadosCurrentReino] = useState<string>('')
  const [preguntadosQuestion, setPreguntadosQuestion] = useState<Question | null>(null)
  const [preguntadosAnswered, setPreguntadosAnswered] = useState(false)
  const [preguntadosSelectedAnswer, setPreguntadosSelectedAnswer] = useState<number | null>(null)
  const [preguntadosTimer, setPreguntadosTimer] = useState(20)
  const [preguntadosShowWheel, setPreguntadosShowWheel] = useState(false)
  const [preguntadosSpinning, setPreguntadosSpinning] = useState(false)
  const [preguntadosWinner, setPreguntadosWinner] = useState<string | null>(null)
  const [preguntadosSetupStep, setPreguntadosSetupStep] = useState<'mode' | 'players' | 'game'>('mode')
  const [showPreguntados, setShowPreguntados] = useState(false)
  const [preguntadosPlayerNames, setPreguntadosPlayerNames] = useState<string[]>(Array(8).fill(''))

  // Tutorial states
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialContent, setTutorialContent] = useState<{
    title: string
    youtubeUrl?: string
    imageUrl?: string
    description?: string
  } | null>(null)

  // File input refs
  const questionImageRef = useRef<HTMLInputElement>(null)
  const optAImageRef = useRef<HTMLInputElement>(null)
  const optBImageRef = useRef<HTMLInputElement>(null)
  const optCImageRef = useRef<HTMLInputElement>(null)
  const optDImageRef = useRef<HTMLInputElement>(null)

  // Init mount ref
  const mountedRef = useRef(false)

  // Check for admin session
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true
    
    const savedToken = localStorage.getItem('adminToken')
    if (savedToken) {
      fetch('/api/auth', { headers: { Authorization: `Bearer ${savedToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setToken(savedToken)
            setAdminUser(data.user)
            setIsLoggedIn(true)
          } else {
            localStorage.removeItem('adminToken')
          }
        })
        .catch(() => localStorage.removeItem('adminToken'))
    }
  }, [])

  // Scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Timer effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && timerActive) {
      // Tiempo agotado
      setTimerActive(false)
      if (questions.length > 0) {
        alert('¡Tiempo agotado! El simulacro ha finalizado.')
        setCurrentScreen('results')
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timerActive, timeRemaining])

  // Format time helper
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Start timer for simulacro
  const startTimer = (minutes: number) => {
    setTimeRemaining(minutes * 60)
    setTimerActive(true)
  }

  // Stop timer
  const stopTimer = () => {
    setTimerActive(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  // Load admin questions when filters change
  useEffect(() => {
    if (!showAdmin || !adminCat || !adminUni || !adminArea || !adminTopic) return
    
    const params = new URLSearchParams({
      category: adminCat,
      university: adminUni,
      type: adminArea,
      topic: adminTopic
    })
    fetch(`/api/questions?${params}`)
      .then(res => res.json())
      .then(data => setAdminQuestions(data.questions || []))
      .catch(() => setAdminQuestions([]))
  }, [showAdmin, adminCat, adminUni, adminArea, adminTopic])

  // Load questions from DB
  const fetchQuestions = async (cat: string, uni: string, area: string, topic: string) => {
    setLoadingQuestions(true)
    try {
      const params = new URLSearchParams({ category: cat, university: uni, type: area, topic })
      const res = await fetch(`/api/questions?${params}`)
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error('Error loading questions:', error)
      setQuestions([])
    }
    setLoadingQuestions(false)
  }

  // Load questions for simulacro from multiple areas
  const fetchSimulacroQuestions = async (
    university: string,
    distribution: Record<string, number>,
    category: string = 'conocimiento'
  ) => {
    setLoadingQuestions(true)
    try {
      const allQuestions: Question[] = []
      
      // Fetch questions from each area according to distribution
      for (const [area, count] of Object.entries(distribution)) {
        const params = new URLSearchParams({
          category,
          university,
          type: area,
          topic: area,
          limit: count.toString()
        })
        
        const res = await fetch(`/api/questions?${params}`)
        const data = await res.json()
        const areaQuestions = (data.questions || []).slice(0, count)
        allQuestions.push(...areaQuestions)
      }
      
      // Shuffle questions
      const shuffled = allQuestions.sort(() => Math.random() - 0.5)
      setQuestions(shuffled)
      
      return shuffled.length
    } catch (error) {
      console.error('Error loading simulacro questions:', error)
      setQuestions([])
      return 0
    } finally {
      setLoadingQuestions(false)
    }
  }

  // Send report to Google Sheets
  const sendReport = async (actividad: string, tipoActividad: string, nota: string, porcentaje: number) => {
    if (!student) return

    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoRegistro: 'actividad',
          ci: student.ci,
          nombre: student.nombre,
          actividad,
          tipoActividad,
          universidad: universities[selectedCategory]?.find(u => u.id === selectedUniversity)?.name || '',
          nota,
          porcentaje: porcentaje.toFixed(1)
        })
      })
    } catch (error) {
      console.error('Error sending report:', error)
    }
  }

  // Student registration
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registrationForm.nombre.trim() || !registrationForm.ci.trim() || !registrationForm.sede) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    setRegistering(true)

    const newStudent: Student = {
      ci: registrationForm.ci.trim(),
      nombre: registrationForm.nombre.trim(),
      apodo: registrationForm.apodo.trim() || registrationForm.nombre.trim().split(' ')[0],
      sede: registrationForm.sede
    }

    localStorage.setItem('studentData', JSON.stringify(newStudent))
    setStudent(newStudent)

    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoRegistro: 'registro',
          ci: newStudent.ci,
          nombre: newStudent.nombre,
          apodo: newStudent.apodo,
          sede: newStudent.sede
        })
      })
    } catch (error) {
      console.error('Error registering:', error)
    }

    setRegistering(false)
    setShowRegistration(false)
  }

  const handleLogoutStudent = () => {
    if (confirm('¿Estás seguro que quieres cerrar sesión?')) {
      localStorage.removeItem('studentData')
      setStudent(null)
      setShowRegistration(true)
      setCurrentScreen('home')
    }
  }

  // Auth functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()

      if (data.success) {
        setToken(data.token)
        setAdminUser(data.user)
        setIsLoggedIn(true)
        localStorage.setItem('adminToken', data.token)
        setShowLogin(false)
        setLoginForm({ username: '', password: '' })
        setShowAdmin(true)
      } else {
        setLoginError(data.error || 'Error al iniciar sesión')
      }
    } catch {
      setLoginError('Error de conexión')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch { /* ignore */ }
    
    setToken('')
    setAdminUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem('adminToken')
    setShowAdmin(false)
  }

  // File upload
  const uploadImage = async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo excede el tamaño máximo de 5MB')
      return null
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      return data.url || null
    } catch {
      return null
    }
  }

  // ============================================
  // PREGUNTADOS GAME FUNCTIONS
  // ============================================

  // Inicializar reinos para todos los jugadores
  const initPreguntadosReinos = (playerCount: number, mode: 'razonamiento' | 'conocimiento' | 'aleatorio') => {
    const reinos = mode === 'razonamiento' ? REINOS_RAZONAMIENTO :
                   mode === 'conocimiento' ? REINOS_CONOCIMIENTO : REINOS_ALEATORIO
    
    const initialReinos: Record<string, number> = {}
    for (let i = 0; i < playerCount; i++) {
      if (reinos) {
        reinos.forEach((reino: { id: string }) => {
          initialReinos[`${i}-${reino.id}`] = 0
        })
      }
    }
    return initialReinos
  }

  // Generar orden aleatorio de jugadores
  const shufflePlayerOrder = (count: number) => {
    const order = Array.from({ length: count }, (_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    return order
  }

  // Iniciar juego de Preguntados
  const startPreguntados = (mode: 'razonamiento' | 'conocimiento' | 'aleatorio', players: string[]) => {
    setPreguntadosMode(mode)
    setPreguntadosPlayers(players)
    setPreguntadosPlayerOrder(shufflePlayerOrder(players.length))
    setPreguntadosCurrentPlayer(0)
    setPreguntadosReinos(initPreguntadosReinos(players.length, mode))
    setPreguntadosSetupStep('game')
    setPreguntadosShowWheel(true)
    setPreguntadosWinner(null)
  }

  // Girar ruleta para seleccionar reino
  const spinWheel = () => {
    if (!preguntadosMode) return
    
    setPreguntadosSpinning(true)
    
    const reinos = preguntadosMode === 'razonamiento' ? REINOS_RAZONAMIENTO :
                   preguntadosMode === 'conocimiento' ? REINOS_CONOCIMIENTO : REINOS_ALEATORIO
    
    // Seleccionar reino aleatorio
    setTimeout(() => {
      const randomReino = reinos[Math.floor(Math.random() * reinos.length)]
      setPreguntadosCurrentReino(randomReino.id)
      setPreguntadosSpinning(false)
      setPreguntadosShowWheel(false)
      
      // Cargar pregunta del reino
      loadPreguntadosQuestion(randomReino)
    }, 1500)
  }

  // Cargar pregunta según el reino
  const loadPreguntadosQuestion = async (reino: { id: string; topics?: string[]; difficulty?: string }) => {
    if (!preguntadosMode) return
    
    try {
      let universities: string[] = []
      let topics: string[] = reino.topics || []
      
      if (preguntadosMode === 'razonamiento') {
        universities = UNIVERSIDADES_RAZONAMIENTO
      } else if (preguntadosMode === 'conocimiento') {
        universities = UNIVERSIDADES_CONOCIMIENTO
      } else {
        // Aleatorio: todas las universidades
        universities = [...UNIVERSIDADES_RAZONAMIENTO, ...UNIVERSIDADES_CONOCIMIENTO]
      }

      // Construir URL de la API
      const params = new URLSearchParams()
      params.append('limit', '1')
      if (universities.length > 0) {
        params.append('university', universities.join(','))
      }
      if (topics.length > 0) {
        params.append('topic', topics.join(','))
      }
      if (reino.difficulty) {
        params.append('difficulty', reino.difficulty)
      }

      const res = await fetch(`/api/questions?${params.toString()}`)
      const data = await res.json()
      
      if (data.questions && data.questions.length > 0) {
        setPreguntadosQuestion(data.questions[0])
      } else {
        // Pregunta demo si no hay en la base de datos
        setPreguntadosQuestion({
          id: `demo-${Date.now()}`,
          question: `Pregunta de ${reino.id}`,
          optionA: 'Opción A',
          optionB: 'Opción B',
          optionC: 'Opción C',
          optionD: 'Opción D',
          correctAnswer: 0,
          category: preguntadosMode,
          university: universities[0] || 'general',
          type: preguntadosMode,
          topic: reino.id
        })
      }
      
      setPreguntadosTimer(20)
      setPreguntadosAnswered(false)
      setPreguntadosSelectedAnswer(null)
    } catch (error) {
      console.error('Error loading question:', error)
      // Pregunta de respaldo
      setPreguntadosQuestion({
        id: `fallback-${Date.now()}`,
        question: '¿Cuál es la respuesta correcta?',
        optionA: 'Esta es la correcta',
        optionB: 'Incorrecta',
        optionC: 'Incorrecta',
        optionD: 'Incorrecta',
        correctAnswer: 0,
        category: preguntadosMode || 'general',
        university: 'general',
        type: preguntadosMode || 'general',
        topic: reino.id
      })
      setPreguntadosTimer(20)
      setPreguntadosAnswered(false)
      setPreguntadosSelectedAnswer(null)
    }
  }

  // Responder pregunta
  const answerPreguntados = (answerIndex: number) => {
    if (preguntadosAnswered || !preguntadosQuestion) return
    
    setPreguntadosSelectedAnswer(answerIndex)
    setPreguntadosAnswered(true)
    
    const isCorrect = answerIndex === preguntadosQuestion.correctAnswer
    
    if (isCorrect) {
      // Incrementar progreso en el reino
      const key = `${preguntadosPlayerOrder[preguntadosCurrentPlayer]}-${preguntadosCurrentReino}`
      const currentProgress = preguntadosReinos[key] || 0
      const newProgress = currentProgress + 1
      
      setPreguntadosReinos(prev => ({
        ...prev,
        [key]: newProgress
      }))
      
      // Verificar si completó el reino
      if (newProgress >= PREGUNTADOS_QUESTIONS_TO_WIN) {
        // Verificar si ganó todos los reinos
        checkWinner()
      }
    }
  }

  // Verificar si hay ganador
  const checkWinner = () => {
    if (!preguntadosMode) return
    
    const reinos = preguntadosMode === 'razonamiento' ? REINOS_RAZONAMIENTO :
                   preguntadosMode === 'conocimiento' ? REINOS_CONOCIMIENTO : REINOS_ALEATORIO
    
    const currentPlayerIndex = preguntadosPlayerOrder[preguntadosCurrentPlayer]
    
    // Verificar si el jugador actual completó todos los reinos
    const allComplete = reinos.every(reino => {
      const key = `${currentPlayerIndex}-${reino.id}`
      return (preguntadosReinos[key] || 0) >= PREGUNTADOS_QUESTIONS_TO_WIN
    })
    
    if (allComplete) {
      setPreguntadosWinner(preguntadosPlayers[currentPlayerIndex])
    }
  }

  // Siguiente turno
  const nextTurn = () => {
    if (preguntadosWinner) return
    
    // Pasar al siguiente jugador en el orden aleatorio
    const nextPlayerIndex = (preguntadosCurrentPlayer + 1) % preguntadosPlayers.length
    setPreguntadosCurrentPlayer(nextPlayerIndex)
    setPreguntadosShowWheel(true)
    setPreguntadosQuestion(null)
    setPreguntadosAnswered(false)
    setPreguntadosSelectedAnswer(null)
  }

  // Timer effect
  useEffect(() => {
    if (preguntadosQuestion && !preguntadosAnswered && preguntadosTimer > 0) {
      const timer = setTimeout(() => {
        setPreguntadosTimer(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (preguntadosTimer === 0 && !preguntadosAnswered && preguntadosQuestion) {
      // Tiempo agotado
      setPreguntadosAnswered(true)
    }
  }, [preguntadosTimer, preguntadosQuestion, preguntadosAnswered])

  // Reset Preguntados
  const resetPreguntados = () => {
    setPreguntadosMode(null)
    setPreguntadosPlayers([])
    setPreguntadosCurrentPlayer(0)
    setPreguntadosPlayerOrder([])
    setPreguntadosReinos({})
    setPreguntadosCurrentReino('')
    setPreguntadosQuestion(null)
    setPreguntadosAnswered(false)
    setPreguntadosSelectedAnswer(null)
    setPreguntadosTimer(20)
    setPreguntadosShowWheel(false)
    setPreguntadosSpinning(false)
    setPreguntadosWinner(null)
    setPreguntadosSetupStep('mode')
    setShowPreguntados(false)
    setPreguntadosPlayerNames(Array(8).fill(''))
  }

  // ============================================
  // NAVIGATION FUNCTIONS
  // ============================================

  const goToScreen = (screen: string, category?: string) => {
    if (screen === 'universities' && category) {
      setSelectedCategory(category)
    }
    setCurrentScreen(screen)
  }

  const selectUniversity = (uniId: string) => {
    setSelectedUniversity(uniId)
    setCurrentScreen('areas')
  }

  // For ESPOCH: select area or simulacro
  const selectMode = (mode: 'area' | 'simulacro') => {
    setQuizMode(mode)
    if (mode === 'area') {
      setCurrentScreen('areas_list')
    } else {
      setCurrentScreen('carreras')
    }
  }

  const selectArea = (areaId: string) => {
    setSelectedArea(areaId)
    setCurrentScreen('topics')
  }

  const selectTopic = (topicId: string) => {
    setSelectedTopic(topicId)
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    setTimeout(() => {
      fetchQuestions(selectedCategory, selectedUniversity, selectedArea, topicId)
    }, 0)
  }

  const selectCarrera = (carreraId: string) => {
    setSelectedCarrera(carreraId)
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador para simulacro ESPOCH (150 min = 2h 30min)
    startTimer(150)
    
    // Cargar preguntas según distribución de la carrera
    const carrera = espochCarreras.find(c => c.id === carreraId)
    if (carrera) {
      fetchSimulacroQuestions('espoch', carrera.distribution, 'conocimiento')
    }
  }

  // Para ESPOL - iniciar simulacro directamente
  const startEspolSimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador ESPOL (120 minutos)
    startTimer(espolConfig.timeMinutes)
    // Cargar preguntas según distribución (80 preguntas)
    fetchSimulacroQuestions('espol', espolConfig.distribution, 'conocimiento_razonamiento')
  }

  // Para UCE - iniciar simulacro directamente
  const startUceSimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador UCE (120 minutos)
    startTimer(uceConfig.timeMinutes)
    // Cargar preguntas según distribución (50 numérico, 50 verbal, 50 abstracto)
    fetchSimulacroQuestions('uce', uceConfig.distribution, 'razonamiento')
  }

  // Para EPN - iniciar simulacro directamente
  const startEpnSimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador EPN (90 minutos)
    startTimer(epnConfig.timeMinutes)
    // Cargar preguntas según distribución (10 por dominio)
    fetchSimulacroQuestions('epn', epnConfig.distribution, 'conocimiento')
  }

  // Para UTN - iniciar simulacro directamente
  const startUtnSimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador UTN (120 minutos)
    startTimer(utnConfig.timeMinutes)
    // Cargar preguntas según distribución (15 por materia)
    fetchSimulacroQuestions('utn', utnConfig.distribution, 'conocimiento')
  }

  // Para ESPE - iniciar simulacro según grupo seleccionado
  const startEspeSimulacro = (grupoId: string) => {
    setSelectedCarrera(grupoId)
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador ESPE (90 minutos)
    startTimer(espeConfig.timeMinutes)
    // Cargar preguntas según distribución del grupo
    const grupo = espeGrupos.find(g => g.id === grupoId)
    if (grupo) {
      fetchSimulacroQuestions('espe', grupo.distribution, 'conocimiento')
    }
  }

  // Para UTC - iniciar simulacro directamente
  const startUtcSimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador UTC (90 minutos)
    startTimer(utcConfig.timeMinutes)
    // Cargar preguntas según distribución (28 verbal, 18 numérico, 20 abstracto, etc.)
    fetchSimulacroQuestions('utc', utcConfig.distribution, 'conocimiento_razonamiento')
  }

  // Para YACHAY - iniciar simulacro directamente
  const startYachaySimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador YACHAY (90 minutos)
    startTimer(yachayConfig.timeMinutes)
    // Cargar preguntas según distribución (30 numérico, 20 verbal, 30 abstracto)
    fetchSimulacroQuestions('yachay', yachayConfig.distribution, 'razonamiento')
  }

  // Para UNACH - iniciar simulacro directamente
  const startUnachSimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador UNACH (90 minutos)
    startTimer(unachConfig.timeMinutes)
    // Cargar preguntas según distribución (30 numérico, 20 verbal, 30 abstracto)
    fetchSimulacroQuestions('unach', unachConfig.distribution, 'razonamiento')
  }

  // Para UTMACH - iniciar simulacro directamente
  const startUtmachSimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador UTMACH (90 minutos)
    startTimer(utmachConfig.timeMinutes)
    // Cargar preguntas según distribución (15 verbal, 20 numérico, 15 abstracto)
    fetchSimulacroQuestions('utmach', utmachConfig.distribution, 'razonamiento')
  }

  // Para UNL - iniciar simulacro con selección de área de conocimiento
  const startUnlSimulacro = (conocimientoArea?: string) => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setSelectedArea(conocimientoArea || 'razonamiento')
    setCurrentScreen('quiz')
    
    // Iniciar temporizador UNL (120 minutos)
    startTimer(unlConfig.timeMinutes)
    // Cargar preguntas según distribución (40 razonamiento + 60 conocimiento según área)
    const razDistribution = { numerico: 14, verbal: 13, logico: 13 }
    if (conocimientoArea) {
      const conocimientoDistribution: Record<string, Record<string, number>> = {
        agropecuaria: { quimica_agro: 20, fisica_agro: 20, biologia_agro: 20 },
        pedagogias: { pedagogia: 20, filosofia_ped: 20, etica_ped: 20 },
        juridica: { sociedad_politica: 20, filosofia_jur: 20, etica_jur: 20 },
        salud: { quimica_salud: 20, fisica_salud: 20, biologia_salud: 20 },
        ingenierias: { matematica_ing: 20, fisica_ing: 20, etica_ing: 20 }
      }
      fetchSimulacroQuestions('unl', { ...razDistribution, ...conocimientoDistribution[conocimientoArea] }, 'conocimiento_razonamiento')
    } else {
      fetchSimulacroQuestions('unl', razDistribution, 'razonamiento')
    }
  }

  // Para UTPL - iniciar simulacro (base o con salud)
  const startUtplSimulacro = (includeSalud: boolean = false) => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setSelectedArea(includeSalud ? 'salud' : 'base')
    setCurrentScreen('quiz')
    
    // Iniciar temporizador UTPL (60 minutos)
    startTimer(utplConfig.timeMinutes)
    // Cargar preguntas (15 por área: base=45, con salud=90)
    if (includeSalud) {
      fetchSimulacroQuestions('utpl', { matematica: 15, verbal: 15, abstracto: 15, quimica: 15, biologia: 15, fisica: 15 }, 'conocimiento_razonamiento')
    } else {
      fetchSimulacroQuestions('utpl', { matematica: 15, verbal: 15, abstracto: 15 }, 'conocimiento_razonamiento')
    }
  }

  // Para U Cuenca - iniciar simulacro
  const startUcuencaSimulacro = () => {
    setQuizMode('simulacro')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setCurrentScreen('quiz')
    
    // Iniciar temporizador U Cuenca (120 minutos)
    startTimer(ucuencaConfig.timeMinutes)
    // Cargar preguntas según distribución (9 nat, 9 soc, 14 mat, 14 abs, 14 len)
    fetchSimulacroQuestions('ucuenca', ucuencaConfig.distribution, 'conocimiento_razonamiento')
  }

  // Para práctica por área (10 preguntas al azar)
  const startAreaPractice = (areaId: string) => {
    setSelectedArea(areaId)
    setSelectedTopic(areaId) // En áreas sin temas, el área funciona como tema
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    setQuestions([])
    setQuizMode('area')
    setCurrentScreen('quiz')
    // Cargar 10 preguntas al azar del área
    setTimeout(() => {
      fetchQuestions(selectedCategory, selectedUniversity, areaId, areaId)
    }, 0)
  }

  // Quiz functions
  const confirmAnswer = () => {
    if (selectedAnswer === null || answered) return

    setAnswered(true)
    const q = questions[currentQuestionIndex]
    const isCorrect = selectedAnswer === q.correctAnswer

    if (isCorrect) setScore(prev => prev + 1)
    
    // Actualizar progreso del estudiante
    updateProgress(isCorrect, selectedCategory, selectedUniversity)
    
    // Reset power-ups para la siguiente pregunta
    setActivePowerUps({
      fiftyFiftyUsed: false,
      eliminatedOptions: [],
      hintShown: false,
      extraTimeAdded: false
    })
  }

  const nextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      setCurrentScreen('results')
      const finalScore = score + (selectedAnswer === questions[currentQuestionIndex]?.correctAnswer ? 1 : 0)
      const percentage = (finalScore / questions.length) * 100
      const uniName = universities[selectedCategory]?.find(u => u.id === selectedUniversity)?.name || ''
      
      sendReport(
        `Quiz ${selectedArea} - ${uniName}`,
        quizMode === 'simulacro' ? 'simulacro' : 'quiz',
        `${finalScore}/${questions.length}`,
        percentage
      )
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    }
  }

  const restartQuiz = () => {
    stopTimer() // Detener temporizador
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTopicResults([])
    // Reset power-ups activos
    setActivePowerUps({
      fiftyFiftyUsed: false,
      eliminatedOptions: [],
      hintShown: false,
      extraTimeAdded: false
    })
    if (quizMode === 'simulacro') {
      if (selectedUniversity === 'espol' || selectedUniversity === 'uce' || selectedUniversity === 'epn' || selectedUniversity === 'utn' || selectedUniversity === 'utc' || selectedUniversity === 'yachay' || selectedUniversity === 'unach' || selectedUniversity === 'utmach' || selectedUniversity === 'unl') {
        setCurrentScreen('areas') // ESPOL, UCE, EPN, UTN, UTC, YACHAY, UNACH, UTMACH, UNL no tienen carreras, regresa a áreas
      } else if (selectedUniversity === 'espe') {
        setCurrentScreen('areas') // ESPE tiene grupos, regresa a áreas
      } else {
        setCurrentScreen('carreras')
      }
    } else {
      setCurrentScreen('topics')
    }
  }

  // ============================================
  // FUNCIONES DE POWER-UPS
  // ============================================
  
  // 50/50 - Eliminar 2 opciones incorrectas
  const handleFiftyFifty = () => {
    if (!usePowerUp('fiftyFifty') || answered || activePowerUps.fiftyFiftyUsed) return
    
    const q = questions[currentQuestionIndex]
    const correctIdx = q.correctAnswer
    const wrongOptions = [0, 1, 2, 3].filter(i => i !== correctIdx)
    
    // Eliminar 2 opciones incorrectas aleatorias
    const shuffled = wrongOptions.sort(() => Math.random() - 0.5)
    const toEliminate = shuffled.slice(0, 2)
    
    setActivePowerUps(prev => ({
      ...prev,
      fiftyFiftyUsed: true,
      eliminatedOptions: toEliminate
    }))
  }
  
  // +Tiempo - Añadir 10 segundos
  const handleExtraTime = () => {
    if (!usePowerUp('extraTime') || activePowerUps.extraTimeAdded) return
    
    setTimeRemaining(prev => prev + 10)
    setActivePowerUps(prev => ({
      ...prev,
      extraTimeAdded: true
    }))
  }
  
  // Cambiar pregunta
  const handleChangeQuestion = async () => {
    if (!usePowerUp('changeQuestion') || answered) return
    
    // Cargar una nueva pregunta
    setLoadingQuestions(true)
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        university: selectedUniversity,
        type: selectedArea,
        topic: selectedTopic,
        limit: '1'
      })
      const res = await fetch(`/api/questions?${params}`)
      const data = await res.json()
      if (data.questions && data.questions.length > 0) {
        // Reemplazar la pregunta actual
        const newQuestions = [...questions]
        newQuestions[currentQuestionIndex] = data.questions[0]
        setQuestions(newQuestions)
        setSelectedAnswer(null)
        setActivePowerUps({
          fiftyFiftyUsed: false,
          eliminatedOptions: [],
          hintShown: false,
          extraTimeAdded: false
        })
      }
    } catch (error) {
      console.error('Error changing question:', error)
    }
    setLoadingQuestions(false)
  }
  
  // Mostrar pista
  const handleShowHint = () => {
    if (!usePowerUp('hint') || activePowerUps.hintShown) return
    
    setActivePowerUps(prev => ({
      ...prev,
      hintShown: true
    }))
  }

  // Calcular nivel de insignia para mostrar
  const getBadgeDisplay = (badge: Badge) => {
    const { level, progress, thresholds } = badge
    const nextThreshold = level < 6 ? thresholds[level] : thresholds[5]
    const prevThreshold = level > 0 ? thresholds[level - 1] : 0
    const progressInLevel = level < 6 ? ((progress - prevThreshold) / (nextThreshold - prevThreshold)) * 100 : 100
    
    return {
      stars: BADGE_LEVELS[Math.min(level, 5)],
      progressPercent: Math.min(progressInLevel, 100),
      currentProgress: progress,
      nextGoal: level < 6 ? nextThreshold : null
    }
  }

  // MR. Q
  const initMrQ = async () => {
    setMrqMood('feliz')
    
    // Mensaje personalizado según el resultado
    const scorePercent = (score / Math.max(questions.length, 1))
    let greeting = ''
    
    if (scorePercent >= 0.7) {
      greeting = `¡Hola! 👋 **Soy MR. Q y estoy aquí para ayudarte.**\n\n¡Felicitaciones por tu excelente resultado! 🎉 Obtuviste ${score} de ${questions.length} respuestas correctas.\n\nSi quieres seguir mejorando, puedo:\n\n• 📚 Explicarte temas avanzados\n• 💡 Darte ejercicios de mayor dificultad\n• 🎯 Ayudarte a perfeccionar tu técnica\n\n¿En qué puedo ayudarte?`
    } else if (scorePercent >= 0.4) {
      greeting = `¡Hola! 👋 **Soy MR. Q y estoy aquí para ayudarte.**\n\nBuen trabajo obtuviste ${score} de ${questions.length} respuestas correctas. Con un poco más de práctica llegarás más lejos.\n\nPuedo ayudarte a:\n\n• 📚 Explicarte los temas que te costaron\n• 💡 Darte ejercicios de práctica\n• ❓ Resolver tus dudas específicas\n\n¿Qué te gustaría practicar?`
    } else {
      greeting = `¡Hola! 👋 **Soy MR. Q y estoy aquí para ayudarte.**\n\nVeo que obtuviste ${score} de ${questions.length} respuestas correctas. ¡No te desanimes! Estoy aquí para ayudarte a mejorar.\n\nPuedo:\n\n• 📚 Explicarte los temas paso a paso\n• 💡 Darte ejercicios sencillos para practicar\n• ❓ Resolver todas tus dudas\n• 🎯 Darte tips de estudio\n\n¿Por dónde quieres empezar?`
    }
    
    setChatMessages([{
      role: 'assistant',
      content: greeting
    }])
    setShowMrQ(true)
  }

  // Tutorial
  const openTutorial = () => {
    // Aquí puedes personalizar el contenido del tutorial según el tema
    setTutorialContent({
      title: `Tutorial: ${selectedTopic || selectedArea}`,
      youtubeUrl: '', // Se puede configurar con un link de YouTube
      description: 'Mira este video tutorial para entender mejor el tema. Si eres administrador, puedes agregar un video de YouTube desde el panel de administración.',
      imageUrl: '/tutorial-preview.png'
    })
    setShowTutorial(true)
  }

  // Extraer ID de YouTube de una URL
  const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isTyping) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)
    setMrqMood('pensativo') // Avatar pensativo mientras escribe

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: userMessage }],
          topicContext: 'El usuario está practicando'
        })
      })

      const data = await response.json()
      setMrqMood('feliz') // Avatar feliz al responder
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMrqMood('triste') // Avatar triste si hay error
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '😔 Tuve un problema para responder. Por favor intenta de nuevo.'
      }])
    }

    setIsTyping(false)
  }

  // Game
  const startGame = async () => {
    try {
      const response = await fetch(`/api/chat?topic=matemáticas`)
      const data = await response.json()

      if (data.questions && data.questions.length > 0) {
        setGameQuestions(data.questions.map((q: Question, i: number) => ({ ...q, id: `game-${i}` })))
        setGameIndex(0)
        setGameScore(0)
        setGameAnswer(null)
        setGameAnswered(false)
        setShowGame(true)
      } else {
        alert('No pude generar los ejercicios. Intenta con MR. Q.')
      }
    } catch {
      alert('Hubo un error al generar el juego. Intenta con MR. Q.')
    }
  }

  const confirmGameAnswer = () => {
    if (gameAnswer === null || gameAnswered) return
    setGameAnswered(true)
    if (gameAnswer === gameQuestions[gameIndex].correctAnswer) {
      setGameScore(prev => prev + 1)
    }
  }

  const nextGameQuestion = () => {
    if (gameIndex >= gameQuestions.length - 1) {
      const finalScore = gameScore + (gameAnswer === gameQuestions[gameIndex].correctAnswer ? 1 : 0)
      setShowGame(false)
      const percentage = (finalScore / gameQuestions.length) * 100
      sendReport('Juego de Práctica', 'juego', `${finalScore}/${gameQuestions.length}`, percentage)
      alert(`¡Juego terminado! Puntuación: ${finalScore}/${gameQuestions.length}`)
    } else {
      setGameIndex(prev => prev + 1)
      setGameAnswer(null)
      setGameAnswered(false)
    }
  }

  // Admin functions
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'question' | 'optA' | 'optB' | 'optC' | 'optD'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadImage(file)
    if (url) {
      setQuestionImages(prev => ({ ...prev, [field]: url }))
    }
  }

  const saveNewQuestion = async () => {
    const { text, optA, optB, optC, optD, correct, explanation } = newQuestion

    if (!text.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Por favor completa todos los campos')
      return
    }

    if (!adminCat || !adminUni || !adminArea || !adminTopic) {
      alert('Selecciona categoría, universidad, área y tema')
      return
    }

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: text.trim(),
          optionA: optA.trim(),
          optionB: optB.trim(),
          optionC: optC.trim(),
          optionD: optD.trim(),
          correctAnswer: parseInt(correct),
          explanation: explanation.trim() || null,
          category: adminCat,
          university: adminUni,
          type: adminArea,
          topic: adminTopic,
          questionImage: questionImages.question || null,
          optionAImage: questionImages.optA || null,
          optionBImage: questionImages.optB || null,
          optionCImage: questionImages.optC || null,
          optionDImage: questionImages.optD || null
        })
      })

      const data = await res.json()
      if (data.success) {
        setNewQuestion({ text: '', optA: '', optB: '', optC: '', optD: '', correct: '0', explanation: '' })
        setQuestionImages({ question: '', optA: '', optB: '', optC: '', optD: '' })
        const params = new URLSearchParams({ category: adminCat, university: adminUni, type: adminArea, topic: adminTopic })
        const qRes = await fetch(`/api/questions?${params}`)
        const qData = await qRes.json()
        setAdminQuestions(qData.questions || [])
        alert('Pregunta guardada correctamente')
      } else {
        alert('Error al guardar pregunta')
      }
    } catch {
      alert('Error de conexión')
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return

    try {
      await fetch(`/api/questions?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setAdminQuestions(prev => prev.filter(q => q.id !== id))
    } catch {
      alert('Error al eliminar')
    }
  }

  const importAiken = async () => {
    if (!aikenText.trim()) {
      alert('Pega las preguntas en formato AIKEN')
      return
    }

    if (!adminCat || !adminUni || !adminArea || !adminTopic) {
      alert('Selecciona categoría, universidad, área y tema')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          aikenText,
          category: adminCat,
          university: adminUni,
          type: adminArea,
          topic: adminTopic
        })
      })

      const data = await res.json()
      if (data.success) {
        setImportResult({ success: true, count: data.imported })
        setAikenText('')
        const params = new URLSearchParams({ category: adminCat, university: adminUni, type: adminArea, topic: adminTopic })
        const qRes = await fetch(`/api/questions?${params}`)
        const qData = await qRes.json()
        setAdminQuestions(qData.questions || [])
      } else {
        setImportResult({ success: false, count: 0 })
        alert(data.error || 'Error al importar')
      }
    } catch {
      alert('Error de conexión')
    }

    setImporting(false)
  }

  // Game Admin functions
  const loadAdminGames = async () => {
    try {
      const res = await fetch('/api/games')
      const data = await res.json()
      setAdminGames(data.games || [])
    } catch {
      console.error('Error loading games')
    }
  }

  const saveGameFromCode = async () => {
    if (!gameCode.trim()) {
      alert('Pega el código del juego')
      return
    }

    if (!gameForm.name.trim()) {
      alert('Ingresa un nombre para el juego')
      return
    }

    setSavingGame(true)
    setGameImportResult(null)

    try {
      // Parsear el código JSON
      let gameData
      try {
        gameData = JSON.parse(gameCode)
      } catch {
        alert('El código no es un JSON válido. Asegúrate de copiar correctamente el código generado.')
        setSavingGame(false)
        return
      }

      // Crear el juego
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: gameForm.name,
          description: gameForm.description,
          gameType: gameForm.gameType,
          difficulty: gameForm.difficulty,
          timeLimit: gameForm.timeLimit ? parseInt(gameForm.timeLimit) : null,
          gameData: JSON.stringify(gameData),
          category: gameForm.category || null,
          university: gameForm.university || null,
          area: gameForm.area || null,
          topic: gameForm.topic || null,
          questions: gameData.questions || [] // Si el juego tiene preguntas
        })
      })

      const data = await res.json()
      if (data.success) {
        setGameImportResult({ success: true, message: `Juego "${gameForm.name}" guardado correctamente` })
        setGameCode('')
        setGameForm({
          name: '',
          description: '',
          gameType: 'quiz',
          difficulty: 'medium',
          timeLimit: '',
          category: '',
          university: '',
          area: '',
          topic: ''
        })
        loadAdminGames()
      } else {
        setGameImportResult({ success: false, message: data.error || 'Error al guardar el juego' })
      }
    } catch (error) {
      setGameImportResult({ success: false, message: 'Error de conexión' })
    }

    setSavingGame(false)
  }

  const deleteGame = async (id: string) => {
    if (!confirm('¿Eliminar este juego?')) return

    try {
      await fetch(`/api/games?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setAdminGames(prev => prev.filter(g => g.id !== id))
    } catch {
      alert('Error al eliminar el juego')
    }
  }

  // Cargar juegos cuando se abre la pestaña de juegos
  useEffect(() => {
    if (showAdmin && adminTab === 'games') {
      loadAdminGames()
    }
  }, [showAdmin, adminTab])

  // Get current data based on selection
  const getCurrentAreas = () => {
    if (selectedUniversity === 'espoch') {
      return Object.values(espochAreas)
    } else if (selectedUniversity === 'espol') {
      return Object.values(espolAreas)
    } else if (selectedUniversity === 'uce') {
      return Object.values(uceAreas)
    } else if (selectedUniversity === 'epn') {
      return Object.values(epnAreas)
    } else if (selectedUniversity === 'utn') {
      return Object.values(utnAreas)
    } else if (selectedUniversity === 'espe') {
      return Object.values(espeAreas)
    } else if (selectedUniversity === 'utc') {
      return Object.values(utcAreas)
    } else if (selectedUniversity === 'yachay') {
      return Object.values(yachayAreas)
    } else if (selectedUniversity === 'unach') {
      return Object.values(unachAreas)
    } else if (selectedUniversity === 'utmach') {
      return Object.values(utmachAreas)
    } else if (selectedUniversity === 'unl') {
      // UNL tiene razonamiento + conocimientos
      return [
        { id: 'razonamiento', name: 'Razonamiento', icon: '🧠', topics: [] },
        { id: 'conocimientos', name: 'Conocimientos', icon: '📚', topics: [] }
      ]
    } else if (selectedUniversity === 'utpl') {
      // UTPL tiene áreas base + áreas de salud
      return [
        { id: 'base', name: 'Áreas Base (Todas las carreras)', icon: '📐', topics: [] },
        { id: 'salud', name: 'Áreas de Salud', icon: '🏥', topics: [] }
      ]
    } else if (selectedUniversity === 'ucuenca') {
      return Object.values(ucuencaAreas)
    } else if (selectedUniversity === 'uta') {
      return Object.values(utaTypes)
    }
    return []
  }

  const getCurrentTopics = () => {
    if (selectedUniversity === 'espoch') {
      return espochAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'espol') {
      return espolAreas[selectedArea]?.topics || [] // Vacío para ESPOL
    } else if (selectedUniversity === 'uce') {
      return uceAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'epn') {
      return epnAreas[selectedArea]?.topics || [] // Vacío para EPN
    } else if (selectedUniversity === 'utn') {
      return utnAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'espe') {
      return espeAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'utc') {
      return utcAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'yachay') {
      return yachayAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'unach') {
      return unachAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'utmach') {
      return utmachAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'unl') {
      // UNL: mostrar áreas según si es razonamiento o conocimientos
      if (selectedArea === 'razonamiento') {
        return Object.values(unlRazonamientoAreas)
      } else if (selectedArea === 'conocimientos') {
        return Object.values(unlConocimientosAreas)
      }
      return []
    } else if (selectedUniversity === 'utpl') {
      // UTPL: mostrar áreas base o de salud
      if (selectedArea === 'base') {
        return Object.values(utplBaseAreas)
      } else if (selectedArea === 'salud') {
        return [...Object.values(utplBaseAreas), ...Object.values(utplSaludAreas)]
      }
      return []
    } else if (selectedUniversity === 'ucuenca') {
      return ucuencaAreas[selectedArea]?.topics || []
    } else if (selectedUniversity === 'uta') {
      return utaTypes[selectedArea]?.topics || []
    }
    return []
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex >= questions.length - 1

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: COLORS.background }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        /* Fondo principal con imagen */
        body {
          background-image: url('/fondo.jpg');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          background-repeat: no-repeat;
        }
        
        /* Overlay semi-transparente para legibilidad */
        .app-container {
          background: rgba(248, 250, 252, 0.92);
          min-height: 100vh;
        }
        
        .card { background: ${COLORS.surface}; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.3s ease; }
        .card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(23, 43, 222, 0.15); }
        .btn-primary { background: ${COLORS.primary}; color: white; font-weight: 600; border-radius: 12px; transition: all 0.2s ease; }
        .btn-primary:hover { opacity: 0.9; transform: scale(1.02); }
        .btn-secondary { background: ${COLORS.secondary}; color: white; font-weight: 600; border-radius: 12px; transition: all 0.2s ease; }
        .btn-secondary:hover { opacity: 0.9; transform: scale(1.02); }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slideUp 0.6s ease forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-icon { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .option-btn { background: ${COLORS.surface}; border: 2px solid #E2E8F0; border-radius: 12px; transition: all 0.2s ease; }
        .option-btn:hover:not(:disabled) { border-color: ${COLORS.primary}; background: #F0F4FF; }
        .option-btn.selected { background: #F0F4FF; border-color: ${COLORS.primary}; }
        .option-btn.correct { background: #DCFCE7; border-color: ${COLORS.success}; }
        .option-btn.wrong { background: #FEE2E2; border-color: ${COLORS.error}; }
        .progress-fill { transition: width 0.5s ease; background: ${COLORS.primary}; }
        .chat-bubble-user { background: ${COLORS.primary}; color: white; }
        .chat-bubble-assistant { background: #F1F5F9; color: ${COLORS.text}; }
        .typing-indicator span { animation: typing 1.4s infinite both; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        .question-image { max-width: 100%; max-height: 200px; border-radius: 8px; margin: 8px 0; }
        .input-field { width: 100%; padding: 12px 16px; border: 2px solid #E2E8F0; border-radius: 12px; font-size: 16px; transition: border-color 0.2s; }
        .input-field:focus { outline: none; border-color: ${COLORS.primary}; }
        .select-field { width: 100%; padding: 12px 16px; border: 2px solid #E2E8F0; border-radius: 12px; font-size: 16px; background: white; cursor: pointer; }
        .select-field:focus { outline: none; border-color: ${COLORS.primary}; }
        
        /* Avatar MR. Q */
        .mrq-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .mrq-avatar-large { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        
        /* Animación del avatar */
        @keyframes avatarBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .avatar-bounce { animation: avatarBounce 2s ease-in-out infinite; }
        
        /* Glassmorphism para cards */
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        /* Loading spinner */
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #E2E8F0;
          border-top-color: ${COLORS.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* LOADING SCREEN - Para evitar hydration mismatch */}
      {!isHydrated && (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="loading-spinner mb-4"></div>
          <p style={{ color: COLORS.textMuted }}>Cargando StudyMaster...</p>
        </div>
      )}

      {/* REGISTRATION SCREEN */}
      {isHydrated && showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && !showLogin && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Avatar MR. Q y Bienvenida */}
            <div className="text-center mb-8 fade-in">
              <div className="relative inline-block mb-4">
                <img 
                  src="/mr-q-avatar.png" 
                  alt="Mr. Q" 
                  className="w-32 h-32 rounded-full object-cover border-4 shadow-xl avatar-bounce"
                  style={{ borderColor: COLORS.primary }}
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                     style={{ background: COLORS.secondary }}>
                  🎓
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.primary }}>StudyMaster</h1>
              <p style={{ color: COLORS.textMuted }}>¡Hola! Soy <strong>Mr. Q</strong>, tu tutor personal</p>
              <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>
                Te ayudaré a preparar tu examen de ingreso a la universidad 🚀
              </p>
            </div>

            <div className="card p-6 slide-up">
              <h2 className="text-xl font-bold mb-4 text-center" style={{ color: COLORS.text }}>
                ¡Regístrate para comenzar!
              </h2>
              
              <form onSubmit={handleRegistration} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>Nombre completo *</label>
                  <input type="text" value={registrationForm.nombre} onChange={(e) => setRegistrationForm({ ...registrationForm, nombre: e.target.value })} className="input-field" placeholder="Ej: Juan Pérez" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>Apodo (opcional)</label>
                  <input type="text" value={registrationForm.apodo} onChange={(e) => setRegistrationForm({ ...registrationForm, apodo: e.target.value })} className="input-field" placeholder="Ej: Juanchi" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>Cédula de identidad *</label>
                  <input type="text" value={registrationForm.ci} onChange={(e) => setRegistrationForm({ ...registrationForm, ci: e.target.value })} className="input-field" placeholder="Ej: 1234567890" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>Sede *</label>
                  <select value={registrationForm.sede} onChange={(e) => setRegistrationForm({ ...registrationForm, sede: e.target.value })} className="select-field" required>
                    <option value="">Selecciona tu sede</option>
                    {SEDES.map(sede => <option key={sede} value={sede}>{sede}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={registering} className="w-full py-4 btn-primary text-lg flex items-center justify-center gap-2" style={{ opacity: registering ? 0.7 : 1 }}>
                  {registering ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      ¡Comenzar! <img src="/mr-q-avatar.png" alt="" className="w-6 h-6 rounded-full" />
                    </>
                  )}
                </button>
              </form>

              <button onClick={() => setShowLogin(true)} className="w-full mt-4 py-3 text-sm font-medium" style={{ color: COLORS.textMuted }}>
                ⚙️ Soy administrador
              </button>
            </div>
            
            {/* Features preview */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.8)' }}>
                <div className="text-2xl mb-1">📚</div>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>+10 Universidades</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.8)' }}>
                <div className="text-2xl mb-1">🤖</div>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>IA Mr. Q</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.8)' }}>
                <div className="text-2xl mb-1">🎮</div>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Preguntados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: COLORS.surface }}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🔐</div>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>Acceso Administrador</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>Usuario</label>
                <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="input-field" placeholder="Usuario" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>Contraseña</label>
                <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="input-field" placeholder="Contraseña" required />
              </div>
              {loginError && <p className="text-sm text-center" style={{ color: COLORS.error }}>{loginError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-3 font-medium rounded-xl" style={{ background: '#F1F5F9', color: COLORS.text }}>Cancelar</button>
                <button type="submit" className="flex-1 py-3 btn-primary">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN APP HEADER */}
      {isHydrated && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && !showLogin && !showProfile && (
        <>
          <div className="fixed top-0 left-0 right-0 z-40 p-4" style={{ background: COLORS.surface, borderBottom: '1px solid #E2E8F0' }}>
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 hover:opacity-80 transition">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: COLORS.primary }}>
                  <span className="text-white font-bold">{student?.apodo?.charAt(0) || student?.nombre?.charAt(0) || '?'}</span>
                </div>
                <div className="text-left">
                  <p className="font-bold" style={{ color: COLORS.text }}>{student?.apodo || student?.nombre}</p>
                  <div className="flex items-center gap-1">
                    {/* Mini insignias */}
                    {studentProgress.badges.map(badge => (
                      <span key={badge.id} className="text-xs" style={{ color: badge.color }}>
                        {badge.icon} {BADGE_LEVELS[badge.level] || ''}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-2">
                {/* Power-ups rápidos */}
                <div className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: '#F0F4FF' }}>
                  <span title="50/50">🎯{studentProgress.powerUps.fiftyFifty}</span>
                  <span title="+Tiempo">⏰{studentProgress.powerUps.extraTime}</span>
                  <span title="Cambiar">🔄{studentProgress.powerUps.changeQuestion}</span>
                  <span title="Pista">💡{studentProgress.powerUps.hint}</span>
                </div>
                <button onClick={() => setShowLogin(true)} className="p-2 rounded-full hover:bg-gray-100" title="Admin">
                  <svg className="w-5 h-5" style={{ color: isLoggedIn ? COLORS.success : COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button onClick={handleLogoutStudent} className="p-2 rounded-full hover:bg-gray-100" title="Cerrar sesión">
                  <svg className="w-5 h-5" style={{ color: COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="h-20" />
        </>
      )}

      {/* PROFILE SCREEN */}
      {showProfile && (
        <div className="fixed inset-0 z-50 overflow-auto" style={{ background: COLORS.background }}>
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setShowProfile(false)} className="flex items-center gap-2" style={{ color: COLORS.textMuted }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              <h2 className="text-xl font-bold" style={{ color: COLORS.text }}>Mi Perfil</h2>
              <div className="w-16"></div>
            </div>

            {/* User Info Card */}
            <div className="card p-6 mb-4">
              <div className="flex items-center gap-4">
                <img src="/mr-q-avatar.png" alt="Avatar" className="w-16 h-16 rounded-full object-cover border-4" style={{ borderColor: COLORS.primary }} />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.text }}>{student?.nombre}</h3>
                  <p style={{ color: COLORS.textMuted }}>CI: {student?.ci} • Sede: {student?.sede}</p>
                  <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
                    @{student?.apodo || student?.nombre?.split(' ')[0]}
                  </p>
                </div>
              </div>
            </div>

            {/* Power-ups Card */}
            <div className="card p-4 mb-4">
              <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>⚡ POWER-UPS DISPONIBLES</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 rounded-xl" style={{ background: '#F0F4FF' }}>
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="font-bold" style={{ color: COLORS.primary }}>{studentProgress.powerUps.fiftyFifty}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>50/50</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: '#FEF3C7' }}>
                  <div className="text-2xl mb-1">⏰</div>
                  <div className="font-bold" style={{ color: COLORS.secondary }}>{studentProgress.powerUps.extraTime}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>+Tiempo</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: '#DCFCE7' }}>
                  <div className="text-2xl mb-1">🔄</div>
                  <div className="font-bold" style={{ color: COLORS.success }}>{studentProgress.powerUps.changeQuestion}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>Cambiar</div>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: '#FCE7F3' }}>
                  <div className="text-2xl mb-1">💡</div>
                  <div className="font-bold" style={{ color: '#EC4899' }}>{studentProgress.powerUps.hint}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>Pista</div>
                </div>
              </div>
            </div>

            {/* Main Badges */}
            <div className="card p-4 mb-4">
              <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>🏆 INSIGNIAS PRINCIPALES</h4>
              <div className="space-y-4">
                {studentProgress.badges.map(badge => {
                  const nextGoal = badge.level < 6 ? BADGE_THRESHOLDS[badge.level] : null
                  const progressPercent = badge.level < 6 
                    ? ((badge.progress - (badge.level > 0 ? BADGE_THRESHOLDS[badge.level - 1] : 0)) / (BADGE_THRESHOLDS[badge.level] - (badge.level > 0 ? BADGE_THRESHOLDS[badge.level - 1] : 0))) * 100
                    : 100
                  
                  return (
                    <div key={badge.id} className="p-3 rounded-xl" style={{ background: `${badge.color}15` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{badge.icon}</span>
                          <span className="font-medium" style={{ color: COLORS.text }}>{badge.name}</span>
                        </div>
                        <span style={{ color: badge.color }}>{BADGE_LEVELS[badge.level] || '☆'}</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, background: badge.color }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs" style={{ color: COLORS.textMuted }}>
                        <span>{badge.progress} correctas</span>
                        {nextGoal && <span>Próximo: {nextGoal}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="card p-4 mb-4">
              <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>📊 ESTADÍSTICAS</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background: '#F8FAFC' }}>
                  <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{studentProgress.stats.totalQuestions}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>Preguntas</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: '#F8FAFC' }}>
                  <div className="text-2xl font-bold" style={{ color: COLORS.success }}>{studentProgress.stats.correctAnswers}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>Correctas</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: '#F8FAFC' }}>
                  <div className="text-2xl font-bold" style={{ color: COLORS.secondary }}>🔥 {studentProgress.stats.bestStreak}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>Mejor racha</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: '#F8FAFC' }}>
                  <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>🎮 {studentProgress.stats.preguntadosWins}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>Victorias</div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="card p-4 mb-4">
              <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>🎖️ LOGROS</h4>
              <div className="grid grid-cols-3 gap-2">
                {studentProgress.achievements.filter(a => a.unlocked).map(achievement => (
                  <div key={achievement.id} className="p-2 rounded-xl text-center" style={{ background: '#DCFCE7' }}>
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="text-xs font-medium" style={{ color: COLORS.text }}>{achievement.name}</div>
                  </div>
                ))}
                {studentProgress.achievements.filter(a => !a.unlocked).slice(0, 6).map(achievement => (
                  <div key={achievement.id} className="p-2 rounded-xl text-center opacity-50" style={{ background: '#F1F5F9' }}>
                    <div className="text-2xl grayscale">{achievement.icon}</div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>{achievement.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* University Progress */}
            {Object.keys(studentProgress.universityProgress).length > 0 && (
              <div className="card p-4">
                <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>🏛️ PROGRESO POR UNIVERSIDAD</h4>
                <div className="space-y-2">
                  {Object.entries(studentProgress.universityProgress).map(([uniId, correct]) => {
                    const uni = Object.values(universities).flat().find(u => u.id === uniId)
                    if (!uni) return null
                    const level = BADGE_THRESHOLDS.findIndex(t => correct < t)
                    const displayLevel = level === -1 ? 5 : level - 1
                    
                    return (
                      <div key={uniId} className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#F8FAFC' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: uni.color }}>
                            {uni.name.substring(0, 2)}
                          </div>
                          <span style={{ color: COLORS.text }}>{uni.name}</span>
                        </div>
                        <div className="text-right">
                          <span style={{ color: uni.color }}>{BADGE_LEVELS[Math.max(0, displayLevel)] || '☆'}</span>
                          <span className="text-xs ml-2" style={{ color: COLORS.textMuted }}>{correct} ✓</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HOME SCREEN */}
      {isHydrated && currentScreen === 'home' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && !showPreguntados && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-0">
          <div className="text-center mb-12 fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: COLORS.text }}>¿Qué quieres estudiar hoy?</h1>
            <p style={{ color: COLORS.textMuted }}>Selecciona una categoría</p>
          </div>

          <div className="w-full max-w-md space-y-4">
            {Object.entries(categories).map(([key, cat], index) => (
              <div key={key} className="card p-5 cursor-pointer slide-up" style={{ animationDelay: `${0.2 + index * 0.1}s` }} onClick={() => goToScreen('universities', key)}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: key === 'razonamiento' ? COLORS.primary : '#0EA5E9' }}>
                    <span className="text-2xl">{cat.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>{cat.name}</h3>
                    <p style={{ color: COLORS.textMuted }} className="text-sm">{cat.description}</p>
                  </div>
                  <svg className="w-6 h-6" style={{ color: COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}

            {/* Preguntados Button */}
            <div 
              className="card p-5 cursor-pointer slide-up"
              style={{ animationDelay: '0.6s', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
              onClick={() => setShowPreguntados(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg bg-white/20">
                  <span className="text-2xl">🎮</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">Preguntados</h3>
                  <p className="text-white/80 text-sm">¡Juega y aprende con 8 jugadores!</p>
                </div>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* MR. Q Button - Ayuda IA */}
            <div 
              className="card p-5 cursor-pointer slide-up"
              style={{ animationDelay: '0.7s', background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
              onClick={() => {
                setChatMessages([{
                  role: 'assistant',
                  content: `¡Hola! 👋 **Soy MR. Q y estoy aquí para ayudarte.**\n\nSoy tu tutor personal con inteligencia artificial. Puedo:\n\n• 📚 Explicarte cualquier tema\n• 💡 Ayudarte con ejercicios\n• ❓ Resolver tus dudas\n• 🎯 Darte tips de estudio\n\n¿En qué puedo ayudarte hoy?`
                }])
                setShowMrQ(true)
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg bg-white/20">
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">MR. Q - Ayuda IA</h3>
                  <p className="text-white/80 text-sm">Tu tutor personal con IA</p>
                </div>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSITIES SCREEN */}
      {isHydrated && currentScreen === 'universities' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('home')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-10 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>{categories[selectedCategory]?.name}</h2>
            <p style={{ color: COLORS.textMuted }}>Selecciona tu universidad</p>
          </div>

          <div className="w-full max-w-md space-y-4">
            {(universities[selectedCategory] || []).map((uni, index) => (
              <div key={uni.id} className="card p-5 cursor-pointer slide-up" style={{ animationDelay: `${0.2 + index * 0.1}s` }} onClick={() => selectUniversity(uni.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: uni.color || '#6366F1' }}>
                    <span className="text-2xl">🏛️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>{uni.name}</h3>
                    <p style={{ color: COLORS.textMuted }} className="text-sm">{uni.fullName}</p>
                  </div>
                  <svg className="w-6 h-6" style={{ color: COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AREAS/MODE SCREEN (ESPOCH specific) */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'espoch' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-10 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>ESPOCH</h2>
            <p style={{ color: COLORS.textMuted }}>80 preguntas • 2h 30min</p>
          </div>

          <div className="w-full max-w-md space-y-4">
            <div className="card p-6 cursor-pointer text-center" onClick={() => selectMode('area')}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: COLORS.primary }}>
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Practicar por Área</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">Elige un área y tema específico</p>
            </div>

            <div className="card p-6 cursor-pointer text-center" onClick={() => selectMode('simulacro')} style={{ border: `2px solid ${COLORS.secondary}` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: COLORS.secondary }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro por Carrera</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">80 preguntas en 2h 30min</p>
            </div>
          </div>
        </div>
      )}

      {/* AREAS LIST SCREEN (ESPOCH) */}
      {isHydrated && currentScreen === 'areas_list' && selectedUniversity === 'espoch' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('areas')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>Áreas de Estudio</h2>
            <p style={{ color: COLORS.textMuted }}>Selecciona un área para practicar</p>
          </div>

          <div className="w-full max-w-lg grid grid-cols-2 gap-3">
            {Object.values(espochAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => {
                  if (area.topics.length > 0) {
                    selectArea(area.id);
                  } else {
                    // Áreas sin temas: practicar 10 preguntas al azar
                    startAreaPractice(area.id);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#F0F4FF' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                    {area.topics.length > 0 ? `${area.topics.length} temas` : '10 preguntas'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CARRERAS SCREEN (ESPOCH Simulacro) */}
      {isHydrated && currentScreen === 'carreras' && selectedUniversity === 'espoch' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('areas')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>Simulacro por Carrera</h2>
            <p style={{ color: COLORS.textMuted }}>Selecciona tu área de interés (80 preguntas)</p>
          </div>

          <div className="w-full max-w-md space-y-3">
            {espochCarreras.map((carrera, index) => (
              <div key={carrera.id} className="card p-4 cursor-pointer slide-up" style={{ animationDelay: `${0.1 + index * 0.05}s` }} onClick={() => selectCarrera(carrera.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: COLORS.secondary }}>
                    <span className="text-xl">🎯</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold" style={{ color: COLORS.text }}>{carrera.name}</h3>
                    <p style={{ color: COLORS.textMuted }} className="text-xs">
                      Mat: {carrera.distribution.matematicas} | Fís: {carrera.distribution.fisica} | Quím: {carrera.distribution.quimica}
                    </p>
                  </div>
                  <svg className="w-5 h-5" style={{ color: COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOPICS SCREEN */}
      {isHydrated && currentScreen === 'topics' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => {
            if (selectedUniversity === 'espoch') {
              setCurrentScreen('areas_list')
            } else if (selectedUniversity === 'uce' || selectedUniversity === 'espol') {
              setCurrentScreen('areas')
            } else {
              setCurrentScreen('areas')
            }
          }} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>
              {selectedUniversity === 'espoch' ? espochAreas[selectedArea]?.name : 
               selectedUniversity === 'uce' ? uceAreas[selectedArea]?.name :
               selectedUniversity === 'espol' ? espolAreas[selectedArea]?.name :
               selectedUniversity === 'epn' ? epnAreas[selectedArea]?.name :
               selectedUniversity === 'utn' ? utnAreas[selectedArea]?.name :
               utaTypes[selectedArea]?.name}
            </h2>
            <p style={{ color: COLORS.textMuted }}>Selecciona un tema</p>
          </div>

          <div className="w-full max-w-md space-y-2">
            {getCurrentTopics().map((topic, index) => (
              <div key={topic.id} className="card p-4 cursor-pointer slide-up" style={{ animationDelay: `${0.1 + index * 0.05}s` }} onClick={() => selectTopic(topic.id)}>
                <div className="flex items-center justify-between">
                  <span style={{ color: COLORS.text }}>{topic.name}</span>
                  <svg className="w-5 h-5" style={{ color: COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTA/UNACH AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && (selectedUniversity === 'uta' || selectedUniversity === 'unach') && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-10 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>{universities[selectedCategory]?.find(u => u.id === selectedUniversity)?.name}</h2>
            <p style={{ color: COLORS.textMuted }}>Elige el tipo de ejercicio</p>
          </div>

          <div className="w-full max-w-lg grid grid-cols-3 gap-4">
            {Object.values(utaTypes).map(type => (
              <div key={type.id} className="card p-6 cursor-pointer text-center" onClick={() => { setSelectedArea(type.id); setCurrentScreen('topics'); }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: type.id === 'numerico' ? COLORS.primary : type.id === 'logico' ? '#8B5CF6' : '#EC4899' }}>
                  <span className="text-2xl">{type.icon}</span>
                </div>
                <h3 className="font-bold" style={{ color: COLORS.text }}>{type.name}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UCE AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'uce' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>UCE</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad Central del Ecuador</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">150 preguntas • 2 horas</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startUceSimulacro} style={{ border: `2px solid #DC2626` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#DC2626' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">150 preguntas (50 Numérico, 50 Verbal, 50 Abstracto)</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 2 horas</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona un área y tema</p>
          </div>

          <div className="w-full max-w-lg grid grid-cols-3 gap-3">
            {Object.values(uceAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => {
                  setSelectedArea(area.id);
                  setCurrentScreen('topics');
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: area.id === 'numerico' ? '#172BDE' : area.id === 'verbal' ? '#EC4899' : '#8B5CF6' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">{area.topics.length} temas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESPOL AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'espol' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>ESPOL</h2>
            <p style={{ color: COLORS.textMuted }}>80 preguntas • 120 minutos</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startEspolSimulacro} style={{ border: `2px solid ${COLORS.secondary}` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: COLORS.secondary }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">80 preguntas en 2 horas</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">10 preguntas al azar</p>
          </div>

          <div className="w-full max-w-lg grid grid-cols-2 gap-3">
            {Object.values(espolAreas).map((area, index) => (
              <div key={area.id} className="card p-4 cursor-pointer slide-up" style={{ animationDelay: `${0.1 + index * 0.05}s` }} onClick={() => startAreaPractice(area.id)}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#E0F2FE' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">10 preguntas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EPN AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'epn' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>EPN</h2>
            <p style={{ color: COLORS.textMuted }}>Escuela Politécnica Nacional</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">50 preguntas • 90 minutos</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startEpnSimulacro} style={{ border: `2px solid #F59E0B` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#F59E0B' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">50 preguntas (10 por dominio)</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 1h 30min</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">10 preguntas al azar</p>
          </div>

          <div className="w-full max-w-lg grid grid-cols-3 gap-3">
            {Object.values(epnAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => startAreaPractice(area.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#FEF3C7' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">10 preguntas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTN AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'utn' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>UTN</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad Técnica del Norte</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">120 preguntas • 2 horas</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startUtnSimulacro} style={{ border: `2px solid #7C3AED` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">120 preguntas (15 por materia)</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 2 horas</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Materia</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona una materia y tema</p>
          </div>

          <div className="w-full max-w-2xl grid grid-cols-3 gap-3">
            {Object.values(utnAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => {
                  setSelectedArea(area.id);
                  setCurrentScreen('topics');
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#EDE9FE' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">{area.topics.length} temas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESPE AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'espe' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>ESPE</h2>
            <p style={{ color: COLORS.textMuted }}>Escuela Politécnica del Ejército</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">30 preguntas • 1h 30min</p>
          </div>

          {/* Simulacro por Grupo */}
          <div className="w-full max-w-md mb-8">
            <h3 className="text-lg font-bold text-center mb-4" style={{ color: COLORS.text }}>Simulacro por Grupo</h3>
            <div className="space-y-3">
              {espeGrupos.map((grupo) => (
                <div 
                  key={grupo.id} 
                  className="card p-4 cursor-pointer" 
                  onClick={() => startEspeSimulacro(grupo.id)}
                  style={{ border: `2px solid #2E7D32` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#2E7D32' }}>
                      <span className="text-xl">🎯</span>
                    </div>
                    <div>
                      <h4 className="font-bold" style={{ color: COLORS.text }}>{grupo.name}</h4>
                      <p style={{ color: COLORS.textMuted }} className="text-xs">
                        {Object.entries(grupo.distribution).map(([area, count]) => `${count} ${area}`).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona un área y tema</p>
          </div>

          <div className="w-full max-w-md grid grid-cols-2 gap-3">
            {Object.values(espeAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => {
                  setSelectedArea(area.id);
                  if (area.topics.length > 0) {
                    setCurrentScreen('topics');
                  } else {
                    startAreaPractice(area.id);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#E8F5E9' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                    {area.topics.length > 0 ? `${area.topics.length} temas` : 'Práctica general'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTC AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'utc' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>UTC</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad Técnica de Cotopaxi</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">90 preguntas • 1h 30min</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startUtcSimulacro} style={{ border: `2px solid #E91E63` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#E91E63' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">28 verbal • 18 numérico • 20 abstracto</p>
              <p style={{ color: COLORS.textMuted }} className="text-xs">9 matemáticas • 6 física • 5 química • 4 biología</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 1h 30min</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona un área y tema</p>
          </div>

          <div className="w-full max-w-2xl grid grid-cols-3 gap-3">
            {Object.values(utcAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => {
                  setSelectedArea(area.id);
                  if (area.topics.length > 0) {
                    setCurrentScreen('topics');
                  } else {
                    startAreaPractice(area.id);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#FCE4EC' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                    {area.topics.length > 0 ? `${area.topics.length} temas` : 'Práctica general'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YACHAY AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'yachay' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>YACHAY Tech</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad de Investigación de Tecnología Experimental</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">80 preguntas • 1h 30min</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startYachaySimulacro} style={{ border: `2px solid #00BCD4` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#00BCD4' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">30 numérico • 20 verbal • 30 abstracto</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 1h 30min</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona un área y tema</p>
          </div>

          <div className="w-full max-w-md grid grid-cols-3 gap-3">
            {Object.values(yachayAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => {
                  setSelectedArea(area.id);
                  if (area.topics.length > 0) {
                    setCurrentScreen('topics');
                  } else {
                    startAreaPractice(area.id);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#E0F7FA' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                    {area.topics.length > 0 ? `${area.topics.length} temas` : 'Práctica general'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNACH AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'unach' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>UNACH</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad Nacional de Chimborazo</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">80 preguntas • 1h 30min</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startUnachSimulacro} style={{ border: `2px solid #8B5CF6` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#8B5CF6' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">30 numérico • 20 verbal • 30 abstracto</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 1h 30min</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona un área y tema</p>
          </div>

          <div className="w-full max-w-md grid grid-cols-3 gap-3">
            {Object.values(unachAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => {
                  setSelectedArea(area.id);
                  if (area.topics.length > 0) {
                    setCurrentScreen('topics');
                  } else {
                    startAreaPractice(area.id);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#EDE9FE' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                    {area.topics.length > 0 ? `${area.topics.length} temas` : 'Práctica general'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UTMACH AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'utmach' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>UTMACH</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad Técnica de Machala</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">50 preguntas • 1h 30min</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startUtmachSimulacro} style={{ border: `2px solid #FF6B35` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#FF6B35' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">20 numérico • 15 verbal • 15 abstracto</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 1h 30min</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona un área y tema</p>
          </div>

          <div className="w-full max-w-md grid grid-cols-3 gap-3">
            {Object.values(utmachAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }} 
                onClick={() => {
                  setSelectedArea(area.id);
                  if (area.topics.length > 0) {
                    setCurrentScreen('topics');
                  } else {
                    startAreaPractice(area.id);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#FFE4DE' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                    {area.topics.length > 0 ? `${area.topics.length} temas` : 'Práctica general'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNL AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'unl' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>UNL</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad Nacional de Loja</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">100 preguntas • 2 horas</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={() => startUnlSimulacro()} style={{ border: `2px solid #1E88E5` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#1E88E5' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">40 razonamiento + 60 conocimientos</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 2 horas</p>
            </div>
          </div>

          {/* Secciones principales */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Sección</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona una sección</p>
          </div>

          <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-8">
            {/* Razonamiento */}
            <div 
              className="card p-5 cursor-pointer slide-up"
              onClick={() => {
                setSelectedArea('razonamiento');
                setCurrentScreen('unl_subareas');
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ background: '#E3F2FD' }}>
                  <span className="text-3xl">🧠</span>
                </div>
                <h3 className="font-bold" style={{ color: COLORS.text }}>Razonamiento</h3>
                <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">Numérico, Verbal, Lógico</p>
              </div>
            </div>
            
            {/* Conocimientos */}
            <div 
              className="card p-5 cursor-pointer slide-up"
              onClick={() => {
                setSelectedArea('conocimientos');
                setCurrentScreen('unl_subareas');
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ background: '#FFF3E0' }}>
                  <span className="text-3xl">📚</span>
                </div>
                <h3 className="font-bold" style={{ color: COLORS.text }}>Conocimientos</h3>
                <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">Según área de carrera</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNL SUB-AREAS SCREEN (Razonamiento o Conocimientos) */}
      {isHydrated && currentScreen === 'unl_subareas' && selectedUniversity === 'unl' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('areas')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>
              {selectedArea === 'razonamiento' ? '🧠 Razonamiento' : '📚 Conocimientos'}
            </h2>
            <p style={{ color: COLORS.textMuted }}>UNL - Selecciona un área</p>
          </div>

          <div className="w-full max-w-md grid gap-3">
            {selectedArea === 'razonamiento' ? (
              // Áreas de Razonamiento
              Object.values(unlRazonamientoAreas).map((area, index) => (
                <div 
                  key={area.id} 
                  className="card p-5 cursor-pointer slide-up flex items-center gap-4"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  onClick={() => {
                    setSelectedArea(area.id);
                    if (area.topics.length > 0) {
                      setCurrentScreen('topics');
                    } else {
                      startAreaPractice(area.id);
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#E3F2FD' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold" style={{ color: COLORS.text }}>{area.name}</h3>
                    <p style={{ color: COLORS.textMuted }} className="text-sm">
                      {area.topics.length} temas
                    </p>
                  </div>
                  <svg className="w-5 h-5" style={{ color: COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))
            ) : (
              // Áreas de Conocimientos por carrera
              Object.values(unlConocimientosAreas).map((area, index) => (
                <div 
                  key={area.id} 
                  className="card p-5 cursor-pointer slide-up flex items-center gap-4"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  onClick={() => {
                    setSelectedArea(area.id);
                    if (area.topics.length > 0) {
                      setCurrentScreen('topics');
                    } else {
                      startAreaPractice(area.id);
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFF3E0' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold" style={{ color: COLORS.text }}>{area.name}</h3>
                    <p style={{ color: COLORS.textMuted }} className="text-sm">
                      {area.topics.length > 0 ? `${area.topics.length} materias` : 'Práctica general'}
                    </p>
                  </div>
                  <svg className="w-5 h-5" style={{ color: COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* UTPL AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'utpl' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>UTPL</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad Técnica Particular de Loja</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">15 preguntas por área • 1 hora</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={() => startUtplSimulacro(false)} style={{ border: `2px solid #FFB300` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#FFB300' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Base</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">Matemática • Verbal • Abstracto</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">45 preguntas • 1 hora</p>
            </div>
          </div>

          {/* Simulacro Salud */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={() => startUtplSimulacro(true)} style={{ border: `2px solid #4CAF50` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#4CAF50' }}>
                <span className="text-3xl">🏥</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Salud</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">+ Química • Biología • Física</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">90 preguntas • 1 hora</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona un área</p>
          </div>

          <div className="w-full max-w-md grid grid-cols-3 gap-3">
            {[...Object.values(utplBaseAreas), ...Object.values(utplSaludAreas)].map((area, index) => (
              <div 
                key={area.id} 
                className="card p-4 cursor-pointer slide-up" 
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                onClick={() => {
                  setSelectedArea(area.id);
                  if (area.topics.length > 0) {
                    setCurrentScreen('topics');
                  } else {
                    startAreaPractice(area.id);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: '#FFF8E1' }}>
                    <span className="text-2xl">{area.icon}</span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-xs mt-1">
                    {area.topics.length > 0 ? `${area.topics.length} temas` : 'Práctica'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* U CUENCA AREAS SCREEN */}
      {isHydrated && currentScreen === 'areas' && selectedUniversity === 'ucuenca' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center p-6 pt-24">
          <button onClick={() => setCurrentScreen('universities')} className="absolute top-24 left-6 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>Volver</span>
          </button>

          <div className="text-center mb-6 fade-in">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.text }}>U Cuenca</h2>
            <p style={{ color: COLORS.textMuted }}>Universidad de Cuenca</p>
            <p style={{ color: COLORS.secondary }} className="text-sm font-medium mt-1">60 preguntas • 2 horas</p>
          </div>

          {/* Simulacro Button */}
          <div className="w-full max-w-md mb-8">
            <div className="card p-6 cursor-pointer text-center" onClick={startUcuencaSimulacro} style={{ border: `2px solid #D32F2F` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: '#D32F2F' }}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.text }}>Simulacro Completo</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm">9 Nat • 9 Soc • 14 Mat • 14 Abs • 14 Len</p>
              <p style={{ color: COLORS.secondary }} className="text-xs mt-1 font-medium">Tiempo: 2 horas</p>
            </div>
          </div>

          {/* Áreas de práctica */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Practicar por Área</h3>
            <p style={{ color: COLORS.textMuted }} className="text-sm">Selecciona un área y tema</p>
          </div>

          <div className="w-full max-w-md grid gap-3">
            {Object.values(ucuencaAreas).map((area, index) => (
              <div 
                key={area.id} 
                className="card p-5 cursor-pointer slide-up flex items-center gap-4"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                onClick={() => {
                  setSelectedArea(area.id);
                  if (area.topics.length > 0) {
                    setCurrentScreen('topics');
                  } else {
                    startAreaPractice(area.id);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFEBEE' }}>
                  <span className="text-2xl">{area.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold" style={{ color: COLORS.text }}>{area.name}</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-sm">
                    {ucuencaConfig.distribution[area.id as keyof typeof ucuencaConfig.distribution]} preguntas
                  </p>
                </div>
                <svg className="w-5 h-5" style={{ color: COLORS.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUIZ SCREEN */}
      {isHydrated && currentScreen === 'quiz' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col p-6 pt-24">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { 
              stopTimer(); 
              quizMode === 'simulacro' 
                ? (selectedUniversity === 'espol' || selectedUniversity === 'uce' || selectedUniversity === 'epn' || selectedUniversity === 'utn' ? setCurrentScreen('areas') : setCurrentScreen('carreras')) 
                : setCurrentScreen('topics'); 
            }} className="flex items-center gap-2" style={{ color: COLORS.textMuted }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span>Salir</span>
            </button>

            <div className="flex items-center gap-4">
              {/* Temporizador para simulacros */}
              {quizMode === 'simulacro' && timerActive && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: timeRemaining < 600 ? '#FEE2E2' : '#DBEAFE' }}>
                  <span className={timeRemaining < 600 ? 'text-red-500' : 'text-blue-500'}>⏱️</span>
                  <span className="font-bold" style={{ color: timeRemaining < 600 ? COLORS.error : COLORS.text }}>{formatTime(timeRemaining)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: '#FEF3C7' }}>
                <span className="text-amber-500">⭐</span>
                <span className="font-bold" style={{ color: COLORS.text }}>{score}</span>
              </div>
              <div style={{ color: COLORS.textMuted }}>
                <span style={{ color: COLORS.text, fontWeight: 'bold' }}>{currentQuestionIndex + 1}</span> / <span>{questions.length || '?'}</span>
              </div>
            </div>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
            <div className="progress-fill h-full rounded-full" style={{ width: `${((currentQuestionIndex + 1) / Math.max(questions.length, 1)) * 100}%` }} />
          </div>

          {loadingQuestions ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p style={{ color: COLORS.textMuted }}>Cargando preguntas...</p>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-6xl mb-4">✨</span>
              <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text }}>¡No hay preguntas!</h2>
              <p style={{ color: COLORS.textMuted }} className="mb-6">Agrega preguntas desde el panel de administración</p>
              <button onClick={() => setShowLogin(true)} className="btn-primary px-6 py-3">Agregar Preguntas</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="card p-6 mb-4">
                {currentQuestion?.questionImage && <img src={currentQuestion.questionImage} alt="Imagen" className="question-image" />}
                <h2 className="text-xl md:text-2xl font-medium leading-relaxed" style={{ color: COLORS.text }}>{currentQuestion?.question}</h2>
              </div>

              {/* Power-ups Bar */}
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <button
                  onClick={handleFiftyFifty}
                  disabled={answered || activePowerUps.fiftyFiftyUsed || studentProgress.powerUps.fiftyFifty <= 0}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition ${
                    activePowerUps.fiftyFiftyUsed ? 'opacity-50' : 'hover:scale-105'
                  }`}
                  style={{ 
                    background: activePowerUps.fiftyFiftyUsed ? '#E2E8F0' : '#F0F4FF',
                    color: activePowerUps.fiftyFiftyUsed ? COLORS.textMuted : COLORS.primary
                  }}
                >
                  🎯 50/50
                  <span className="text-xs opacity-70">({studentProgress.powerUps.fiftyFifty})</span>
                </button>
                
                {quizMode === 'simulacro' && timerActive && (
                  <button
                    onClick={handleExtraTime}
                    disabled={answered || activePowerUps.extraTimeAdded || studentProgress.powerUps.extraTime <= 0}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition ${
                      activePowerUps.extraTimeAdded ? 'opacity-50' : 'hover:scale-105'
                    }`}
                    style={{ 
                      background: activePowerUps.extraTimeAdded ? '#E2E8F0' : '#FEF3C7',
                      color: activePowerUps.extraTimeAdded ? COLORS.textMuted : COLORS.secondary
                    }}
                  >
                    ⏰ +10s
                    <span className="text-xs opacity-70">({studentProgress.powerUps.extraTime})</span>
                  </button>
                )}
                
                <button
                  onClick={handleChangeQuestion}
                  disabled={answered || studentProgress.powerUps.changeQuestion <= 0 || loadingQuestions}
                  className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition hover:scale-105"
                  style={{ 
                    background: '#DCFCE7',
                    color: COLORS.success
                  }}
                >
                  🔄 Cambiar
                  <span className="text-xs opacity-70">({studentProgress.powerUps.changeQuestion})</span>
                </button>
                
                <button
                  onClick={handleShowHint}
                  disabled={answered || activePowerUps.hintShown || studentProgress.powerUps.hint <= 0}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition ${
                    activePowerUps.hintShown ? 'opacity-50' : 'hover:scale-105'
                  }`}
                  style={{ 
                    background: activePowerUps.hintShown ? '#E2E8F0' : '#FCE7F3',
                    color: activePowerUps.hintShown ? COLORS.textMuted : '#EC4899'
                  }}
                >
                  💡 Pista
                  <span className="text-xs opacity-70">({studentProgress.powerUps.hint})</span>
                </button>
              </div>

              {/* Hint Display */}
              {activePowerUps.hintShown && currentQuestion?.explanation && !answered && (
                <div className="card p-4 mb-4" style={{ background: '#FCE7F3', borderColor: '#EC4899' }}>
                  <p className="text-sm font-medium" style={{ color: '#BE185D' }}>
                    💡 Pista: {currentQuestion.explanation}
                  </p>
                </div>
              )}

              <div className="grid gap-3 mb-6">
                {[ 
                  { text: currentQuestion?.optionA, img: currentQuestion?.optionAImage },
                  { text: currentQuestion?.optionB, img: currentQuestion?.optionBImage },
                  { text: currentQuestion?.optionC, img: currentQuestion?.optionCImage },
                  { text: currentQuestion?.optionD, img: currentQuestion?.optionDImage }
                ].map((opt, i) => {
                  // Check if option is eliminated by 50/50
                  const isEliminated = activePowerUps.eliminatedOptions.includes(i)
                  
                  let btnClass = 'option-btn p-4 text-left w-full'
                  if (isEliminated) {
                    btnClass += ' opacity-30'
                  } else {
                    if (answered) {
                      if (i === currentQuestion?.correctAnswer) btnClass += ' correct'
                      else if (i === selectedAnswer && selectedAnswer !== currentQuestion?.correctAnswer) btnClass += ' wrong'
                    } else if (selectedAnswer === i) {
                      btnClass += ' selected'
                    }
                  }

                  return (
                    <button key={i} className={btnClass} onClick={() => !answered && !isEliminated && setSelectedAnswer(i)} disabled={answered || isEliminated}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: isEliminated ? '#F1F5F9' : '#F1F5F9', color: COLORS.text }}>
                          {isEliminated ? '✗' : String.fromCharCode(65 + i)}
                        </div>
                        <div className="flex-1">
                          {opt.img && !isEliminated && <img src={opt.img} alt={`Opción ${String.fromCharCode(65 + i)}`} className="question-image" style={{ maxHeight: '100px' }} />}
                          <span style={{ color: isEliminated ? COLORS.textMuted : COLORS.text }}>{opt.text}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={answered ? nextQuestion : confirmAnswer}
                disabled={!answered && selectedAnswer === null}
                className={`py-4 font-bold text-lg ${(!answered && selectedAnswer === null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ background: COLORS.primary, color: 'white', borderRadius: 12 }}
              >
                {answered ? (isLastQuestion ? 'Ver Resultados' : 'Siguiente') : 'Confirmar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULTS SCREEN */}
      {isHydrated && currentScreen === 'results' && !showRegistration && !showAdmin && !showMrQ && !showGame && !showTutorial && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
          {/* Avatar MR. Q según resultado */}
          <div className="text-center mb-6 fade-in">
            <img 
              src={getMrqAvatar((score / Math.max(questions.length, 1)) >= 0.7 ? 'feliz' : (score / Math.max(questions.length, 1)) >= 0.4 ? 'pensativo' : 'triste')} 
              alt="MR. Q" 
              className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg avatar-bounce object-cover"
            />
          </div>
          
          <div className="text-center mb-6 fade-in">
            <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.text }}>
              {(score / Math.max(questions.length, 1)) >= 0.7 ? '¡Excelente trabajo!' : 
               (score / Math.max(questions.length, 1)) >= 0.4 ? '¡Buen intento!' : '¡Sigue practicando!'}
            </h1>
          </div>

          <div className="card p-8 mb-6 text-center w-full max-w-md">
            <div className="text-5xl font-bold mb-2" style={{ color: COLORS.primary }}>
              <span>{score}</span> / <span>{questions.length}</span>
            </div>
            <p style={{ color: COLORS.textMuted }} className="mb-4">Respuestas correctas</p>
            <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden mx-auto">
              <div className="h-full rounded-full" style={{ width: `${(score / Math.max(questions.length, 1)) * 100}%`, background: COLORS.success }} />
            </div>
            <p style={{ color: COLORS.textMuted }} className="text-sm mt-2">{Math.round((score / Math.max(questions.length, 1)) * 100)}% de aciertos</p>
          </div>

          <div className="card p-6 mb-6 w-full max-w-md" style={{ background: '#FEF3C7' }}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mt-2" style={{ color: COLORS.text }}>
                {(score / Math.max(questions.length, 1)) >= 0.7 ? '💪 ¡Vas muy bien!' : '💪 ¡No te rindas!'}
              </h3>
              <p style={{ color: COLORS.textMuted }}>Recursos disponibles para ti</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button onClick={openTutorial} className="py-4 font-bold" style={{ background: '#FF5722', color: 'white', borderRadius: 12 }}>
                <span className="text-2xl block mb-1">📚</span>
                Tutorial
              </button>
              <button onClick={startGame} className="py-4 font-bold" style={{ background: COLORS.success, color: 'white', borderRadius: 12 }}>
                <span className="text-2xl block mb-1">🎮</span>
                Juego
              </button>
              <button onClick={initMrQ} className="py-4 font-bold" style={{ background: '#8B5CF6', color: 'white', borderRadius: 12 }}>
                <span className="text-2xl block mb-1">🤖</span>
                MR. Q
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={restartQuiz} className="btn-primary px-6 py-3">Intentar de Nuevo</button>
            <button onClick={() => setCurrentScreen('home')} className="px-6 py-3 font-medium" style={{ background: '#F1F5F9', color: COLORS.text, borderRadius: 12 }}>Volver al Inicio</button>
          </div>
        </div>
      )}

      {/* MR. Q Chat Modal */}
      {showMrQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md h-[600px] flex flex-col rounded-2xl overflow-hidden shadow-2xl" style={{ background: COLORS.surface }}>
            <div className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}>
              <div className="flex items-center gap-3">
                <img src={getMrqAvatar('feliz')} alt="MR. Q" className="mrq-avatar avatar-bounce" />
                <div>
                  <h3 className="font-bold text-white text-lg">MR. Q</h3>
                  <p className="text-white/70 text-sm">Tu tutor personal 🎓</p>
                </div>
              </div>
              <button onClick={() => setShowMrQ(false)} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {msg.role === 'assistant' && (
                    <img src={getMrqAvatar('feliz')} alt="MR. Q" className="w-8 h-8 rounded-full object-cover" />
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`} style={{ borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start items-end gap-2">
                  <img src={getMrqAvatar('pensativo')} alt="MR. Q" className="w-8 h-8 rounded-full object-cover" />
                  <div className="chat-bubble-assistant p-3 rounded-2xl typing-indicator">
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mx-0.5">•</span>
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mx-0.5">•</span>
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mx-0.5">•</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} placeholder="Escribe tu pregunta..." className="flex-1 px-4 py-3 rounded-xl border-2 focus:outline-none" style={{ borderColor: '#E2E8F0' }} />
                <button onClick={sendChatMessage} disabled={!chatInput.trim() || isTyping} className="px-4 py-3 rounded-xl font-bold text-white" style={{ background: '#8B5CF6', opacity: chatInput.trim() && !isTyping ? 1 : 0.5 }}>Enviar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Modal */}
      {showGame && gameQuestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: COLORS.surface }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: COLORS.text }}>🎮 Juego de Práctica</h3>
              <button onClick={() => setShowGame(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span style={{ color: COLORS.textMuted }}>Pregunta {gameIndex + 1} de {gameQuestions.length}</span>
              <span className="font-bold" style={{ color: COLORS.success }}>⭐ {gameScore}</span>
            </div>

            <div className="card p-4 mb-4">
              <p className="text-lg font-medium" style={{ color: COLORS.text }}>{gameQuestions[gameIndex].question}</p>
            </div>

            <div className="space-y-2 mb-4">
              {[gameQuestions[gameIndex].optionA, gameQuestions[gameIndex].optionB, gameQuestions[gameIndex].optionC, gameQuestions[gameIndex].optionD].map((opt, i) => {
                let btnClass = 'option-btn p-3 text-left w-full'
                if (gameAnswered) {
                  if (i === gameQuestions[gameIndex].correctAnswer) btnClass += ' correct'
                  else if (i === gameAnswer && gameAnswer !== gameQuestions[gameIndex].correctAnswer) btnClass += ' wrong'
                } else if (gameAnswer === i) {
                  btnClass += ' selected'
                }

                return (
                  <button key={i} className={btnClass} onClick={() => !gameAnswered && setGameAnswer(i)} disabled={gameAnswered}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#F1F5F9' }}>{String.fromCharCode(65 + i)}</div>
                      <span>{opt}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <button onClick={gameAnswered ? nextGameQuestion : confirmGameAnswer} disabled={!gameAnswered && gameAnswer === null} className="w-full py-3 font-bold" style={{ background: COLORS.success, color: 'white', borderRadius: 12, opacity: (!gameAnswered && gameAnswer === null) ? 0.5 : 1 }}>
              {gameAnswered ? 'Siguiente' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {/* TUTORIAL MODAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: COLORS.surface }}>
            <div className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)' }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <div>
                  <h3 className="font-bold text-white text-lg">{tutorialContent?.title || 'Tutorial'}</h3>
                  <p className="text-white/70 text-sm">Aprende con videos y recursos</p>
                </div>
              </div>
              <button onClick={() => setShowTutorial(false)} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {/* Video de YouTube */}
              {tutorialContent?.youtubeUrl && getYouTubeId(tutorialContent.youtubeUrl) && (
                <div className="mb-6">
                  <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>🎥 Video Tutorial</h4>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-xl"
                      src={`https://www.youtube.com/embed/${getYouTubeId(tutorialContent.youtubeUrl)}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Imagen del tutorial */}
              {tutorialContent?.imageUrl && (
                <div className="mb-6">
                  <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>🖼️ Material Visual</h4>
                  <img 
                    src={tutorialContent.imageUrl} 
                    alt="Tutorial" 
                    className="w-full rounded-xl shadow-md"
                  />
                </div>
              )}

              {/* Descripción */}
              {tutorialContent?.description && (
                <div className="mb-6 p-4 rounded-xl" style={{ background: '#F8FAFC' }}>
                  <p style={{ color: COLORS.text }}>{tutorialContent.description}</p>
                </div>
              )}

              {/* Placeholder cuando no hay contenido */}
              {!tutorialContent?.youtubeUrl && !tutorialContent?.imageUrl && (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">📚</span>
                  <h4 className="font-bold text-xl mb-2" style={{ color: COLORS.text }}>Tutorial próximamente</h4>
                  <p style={{ color: COLORS.textMuted }}>
                    El contenido de este tutorial estará disponible pronto. 
                    <br />
                    Mientras tanto, puedes usar MR. Q para resolver tus dudas.
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => {
                    setShowTutorial(false);
                    initMrQ();
                  }} 
                  className="flex-1 py-3 font-bold rounded-xl"
                  style={{ background: '#8B5CF6', color: 'white' }}
                >
                  🤖 Preguntar a MR. Q
                </button>
                <button 
                  onClick={() => setShowTutorial(false)} 
                  className="flex-1 py-3 font-medium rounded-xl"
                  style={{ background: '#F1F5F9', color: COLORS.text }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PANEL */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl" style={{ background: COLORS.surface }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>⚙️ Panel de Administración</h2>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>Bienvenido, {adminUser?.username}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleLogout} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#FEE2E2', color: COLORS.error }}>Cerrar Sesión</button>
                <button onClick={() => setShowAdmin(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <select value={adminCat} onChange={(e) => setAdminCat(e.target.value)} className="select-field">
                <option value="">Categoría</option>
                {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select>
              <select value={adminUni} onChange={(e) => setAdminUni(e.target.value)} className="select-field" disabled={!adminCat}>
                <option value="">Universidad</option>
                {(universities[adminCat] || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select value={adminArea} onChange={(e) => setAdminArea(e.target.value)} className="select-field" disabled={!adminUni}>
                <option value="">Área</option>
                {adminUni === 'espoch' 
                  ? Object.values(espochAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'espol'
                  ? Object.values(espolAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'uce'
                  ? Object.values(uceAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'epn'
                  ? Object.values(epnAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'utn'
                  ? Object.values(utnAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'espe'
                  ? Object.values(espeAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'utc'
                  ? Object.values(utcAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'yachay'
                  ? Object.values(yachayAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'unach'
                  ? Object.values(unachAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'utmach'
                  ? Object.values(utmachAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'unl'
                  ? [...Object.values(unlRazonamientoAreas), ...Object.values(unlConocimientosAreas)].map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'utpl'
                  ? [...Object.values(utplBaseAreas), ...Object.values(utplSaludAreas)].map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : adminUni === 'ucuenca'
                  ? Object.values(ucuencaAreas).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  : Object.values(utaTypes).map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                }
              </select>
              <select value={adminTopic} onChange={(e) => setAdminTopic(e.target.value)} className="select-field" disabled={!adminArea}>
                <option value="">Tema</option>
                {adminUni === 'espoch' 
                  ? (espochAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'espol'
                  ? [{ id: adminArea, name: 'Práctica general' }].map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'uce'
                  ? (uceAreas[adminArea]?.topics || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'epn'
                  ? [{ id: adminArea, name: 'Práctica general' }].map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'utn'
                  ? (utnAreas[adminArea]?.topics || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'espe'
                  ? (espeAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'utc'
                  ? (utcAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'yachay'
                  ? (yachayAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'unach'
                  ? (unachAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'utmach'
                  ? (utmachAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'unl'
                  ? ((unlRazonamientoAreas[adminArea]?.topics || unlConocimientosAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }])).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'utpl'
                  ? ((utplBaseAreas[adminArea]?.topics || utplSaludAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }])).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : adminUni === 'ucuenca'
                  ? (ucuencaAreas[adminArea]?.topics || [{ id: adminArea, name: 'Práctica general' }]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  : (utaTypes[adminArea]?.topics || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                }
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b overflow-x-auto" style={{ borderColor: '#E2E8F0' }}>
              <button onClick={() => setAdminTab('single')} className={`pb-3 px-4 font-medium whitespace-nowrap ${adminTab === 'single' ? 'border-b-2' : ''}`} style={{ borderColor: adminTab === 'single' ? COLORS.primary : 'transparent', color: adminTab === 'single' ? COLORS.primary : COLORS.textMuted }}>
                📝 Agregar Pregunta
              </button>
              <button onClick={() => setAdminTab('aiken')} className={`pb-3 px-4 font-medium whitespace-nowrap ${adminTab === 'aiken' ? 'border-b-2' : ''}`} style={{ borderColor: adminTab === 'aiken' ? COLORS.primary : 'transparent', color: adminTab === 'aiken' ? COLORS.primary : COLORS.textMuted }}>
                📄 Importar AIKEN
              </button>
              <button onClick={() => setAdminTab('games')} className={`pb-3 px-4 font-medium whitespace-nowrap ${adminTab === 'games' ? 'border-b-2' : ''}`} style={{ borderColor: adminTab === 'games' ? COLORS.primary : 'transparent', color: adminTab === 'games' ? COLORS.primary : COLORS.textMuted }}>
                🎮 Administrar Juegos
              </button>
            </div>

            {/* Single Question Form */}
            {adminTab === 'single' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>Nueva Pregunta</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pregunta</label>
                      <textarea value={newQuestion.text} onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })} className="input-field" rows={2} />
                      <input ref={questionImageRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'question')} />
                      <button onClick={() => questionImageRef.current?.click()} className="text-sm mt-1" style={{ color: COLORS.primary }}>📎 Agregar imagen</button>
                      {questionImages.question && (
                        <div className="mt-2 relative inline-block">
                          <img src={questionImages.question} alt="Preview" className="h-20 rounded" />
                          <button onClick={() => setQuestionImages({ ...questionImages, question: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                        </div>
                      )}
                    </div>

                    {['A', 'B', 'C', 'D'].map((letter, idx) => {
                      const key = `opt${letter}` as keyof typeof newQuestion
                      const imgKey = `opt${letter}` as keyof typeof questionImages
                      const ref = [optAImageRef, optBImageRef, optCImageRef, optDImageRef][idx]
                      
                      return (
                        <div key={letter}>
                          <label className="block text-sm font-medium mb-1">Opción {letter}</label>
                          <input type="text" value={newQuestion[key]} onChange={(e) => setNewQuestion({ ...newQuestion, [key]: e.target.value })} className="input-field" />
                          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, imgKey)} />
                          <button onClick={() => ref.current?.click()} className="text-xs mt-1" style={{ color: COLORS.primary }}>📎 Imagen</button>
                          {questionImages[imgKey] && (
                            <div className="mt-1 relative inline-block ml-2">
                              <img src={questionImages[imgKey]} alt={`Opción ${letter}`} className="h-10 rounded" />
                              <button onClick={() => setQuestionImages({ ...questionImages, [imgKey]: '' })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs">×</button>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    <div className="flex gap-3 items-center">
                      <div>
                        <label className="block text-sm font-medium mb-1">Correcta</label>
                        <select value={newQuestion.correct} onChange={(e) => setNewQuestion({ ...newQuestion, correct: e.target.value })} className="select-field">
                          <option value="0">A</option>
                          <option value="1">B</option>
                          <option value="2">C</option>
                          <option value="3">D</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Explicación</label>
                        <input type="text" value={newQuestion.explanation} onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })} className="input-field" />
                      </div>
                    </div>

                    <button onClick={saveNewQuestion} className="w-full py-3 btn-primary">Guardar Pregunta</button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>Preguntas Guardadas ({adminQuestions.length})</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {adminQuestions.map(q => (
                      <div key={q.id} className="p-3 border rounded-xl" style={{ background: '#F8FAFC' }}>
                        <div className="flex justify-between items-start">
                          <p className="text-sm flex-1" style={{ color: COLORS.text }}>{q.question}</p>
                          <button onClick={() => deleteQuestion(q.id)} className="text-red-500 ml-2 text-sm">✕</button>
                        </div>
                        <p className="text-xs mt-1" style={{ color: COLORS.success }}>Respuesta: {String.fromCharCode(65 + q.correctAnswer)}</p>
                      </div>
                    ))}
                    {adminQuestions.length === 0 && <p className="text-center py-8" style={{ color: COLORS.textMuted }}>No hay preguntas</p>}
                  </div>
                </div>
              </div>
            )}

            {/* AIKEN Import */}
            {adminTab === 'aiken' && (
              <div>
                <div className="mb-4 p-4 rounded-xl" style={{ background: '#F0F4FF' }}>
                  <h4 className="font-bold mb-2" style={{ color: COLORS.primary }}>📝 Formato AIKEN</h4>
                  <pre className="text-xs overflow-x-auto" style={{ color: COLORS.textMuted }}>{`¿Pregunta?
A. Opción 1
B. Opción 2
C. Opción 3
D. Opción 4
ANSWER: B`}</pre>
                </div>

                <textarea value={aikenText} onChange={(e) => setAikenText(e.target.value)} placeholder="Pega aquí las preguntas en formato AIKEN..." className="input-field mb-4" rows={10} />

                {importResult && (
                  <div className={`p-3 rounded-xl mb-4 ${importResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    {importResult.success ? `✅ Se importaron ${importResult.count} preguntas` : '❌ Error al importar'}
                  </div>
                )}

                <button onClick={importAiken} disabled={importing || !aikenText.trim()} className="w-full py-3 btn-primary" style={{ opacity: importing || !aikenText.trim() ? 0.5 : 1 }}>
                  {importing ? 'Importando...' : 'Importar Preguntas'}
                </button>
              </div>
            )}

            {/* Games Admin */}
            {adminTab === 'games' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Formulario para añadir juego */}
                <div>
                  <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>🎮 Añadir Nuevo Juego</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre del Juego *</label>
                      <input
                        type="text"
                        value={gameForm.name}
                        onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
                        className="input-field"
                        placeholder="Ej: Juego de Porcentajes"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Descripción</label>
                      <input
                        type="text"
                        value={gameForm.description}
                        onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                        className="input-field"
                        placeholder="Breve descripción del juego"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select
                          value={gameForm.gameType}
                          onChange={(e) => setGameForm({ ...gameForm, gameType: e.target.value })}
                          className="select-field"
                        >
                          <option value="quiz">Quiz</option>
                          <option value="memory">Memoria</option>
                          <option value="drag_drop">Arrastrar</option>
                          <option value="crossword">Crucigrama</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Dificultad</label>
                        <select
                          value={gameForm.difficulty}
                          onChange={(e) => setGameForm({ ...gameForm, difficulty: e.target.value })}
                          className="select-field"
                        >
                          <option value="easy">Fácil</option>
                          <option value="medium">Medio</option>
                          <option value="hard">Difícil</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tiempo (seg)</label>
                        <input
                          type="number"
                          value={gameForm.timeLimit}
                          onChange={(e) => setGameForm({ ...gameForm, timeLimit: e.target.value })}
                          className="input-field"
                          placeholder="Opcional"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl" style={{ background: '#F0F4FF' }}>
                      <h5 className="font-medium mb-2" style={{ color: COLORS.primary }}>📋 Clasificación (Opcional)</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={gameForm.category}
                          onChange={(e) => setGameForm({ ...gameForm, category: e.target.value })}
                          className="select-field text-sm"
                        >
                          <option value="">Categoría</option>
                          {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                        </select>
                        <select
                          value={gameForm.university}
                          onChange={(e) => setGameForm({ ...gameForm, university: e.target.value })}
                          className="select-field text-sm"
                        >
                          <option value="">Universidad</option>
                          {Object.values(universities).flat().map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Código del Juego (JSON) *</label>
                      <textarea
                        value={gameCode}
                        onChange={(e) => setGameCode(e.target.value)}
                        className="input-field font-mono text-sm"
                        rows={8}
                        placeholder={`{
  "questions": [
    {
      "question": "¿Pregunta?",
      "optionA": "Opción A",
      "optionB": "Opción B",
      "optionC": "Opción C",
      "optionD": "Opción D",
      "correctAnswer": 0
    }
  ]
}`}
                      />
                      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                        Pega aquí el código JSON que te proporcione el asistente
                      </p>
                    </div>

                    {gameImportResult && (
                      <div className={`p-3 rounded-xl ${gameImportResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                        {gameImportResult.success ? '✅ ' : '❌ '}{gameImportResult.message}
                      </div>
                    )}

                    <button
                      onClick={saveGameFromCode}
                      disabled={savingGame || !gameCode.trim() || !gameForm.name.trim()}
                      className="w-full py-3 btn-primary"
                      style={{ opacity: savingGame || !gameCode.trim() || !gameForm.name.trim() ? 0.5 : 1 }}
                    >
                      {savingGame ? 'Guardando...' : '💾 Guardar Juego'}
                    </button>
                  </div>
                </div>

                {/* Lista de juegos existentes */}
                <div>
                  <h4 className="font-bold mb-3" style={{ color: COLORS.text }}>Juegos Guardados ({adminGames.length})</h4>
                  <div className="max-h-[500px] overflow-y-auto space-y-2">
                    {adminGames.map(game => (
                      <div key={game.id} className="p-3 border rounded-xl" style={{ background: '#F8FAFC' }}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {game.gameType === 'quiz' ? '📝' :
                                 game.gameType === 'memory' ? '🧠' :
                                 game.gameType === 'drag_drop' ? '🎯' :
                                 game.gameType === 'crossword' ? '🔠' : '🎮'}
                              </span>
                              <h5 className="font-medium" style={{ color: COLORS.text }}>{game.name}</h5>
                            </div>
                            {game.description && (
                              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{game.description}</p>
                            )}
                            <div className="flex gap-2 mt-2 text-xs">
                              <span className="px-2 py-1 rounded" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                                {game.difficulty === 'easy' ? 'Fácil' : game.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                              </span>
                              {game.timeLimit && (
                                <span className="px-2 py-1 rounded" style={{ background: '#FEF3C7', color: '#B45309' }}>
                                  ⏱️ {game.timeLimit}s
                                </span>
                              )}
                              <span className="px-2 py-1 rounded" style={{ background: '#DCFCE7', color: '#166534' }}>
                                Jugado: {game.playCount} veces
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteGame(game.id)}
                            className="text-red-500 ml-2 p-1 hover:bg-red-50 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {adminGames.length === 0 && (
                      <div className="text-center py-12">
                        <span className="text-4xl mb-2 block">🎮</span>
                        <p style={{ color: COLORS.textMuted }}>No hay juegos guardados</p>
                        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                          Pega el código de un juego para añadirlo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREGUNTADOS GAME */}
      {showPreguntados && (
        <div className="fixed inset-0 z-50 overflow-auto" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
          {/* Close button */}
          <button 
            onClick={resetPreguntados}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
          >
            ✕ Salir
          </button>

          {/* SETUP: Mode Selection */}
          {preguntadosSetupStep === 'mode' && (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
              <h1 className="text-3xl font-bold text-white mb-2">🎮 Preguntados</h1>
              <p className="text-white/70 mb-8">Selecciona el modo de juego</p>
              
              <div className="w-full max-w-md space-y-4">
                <button
                  onClick={() => { setPreguntadosMode('razonamiento'); setPreguntadosSetupStep('players'); }}
                  className="w-full p-6 rounded-2xl text-left transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🧠</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Razonamiento</h3>
                      <p className="text-white/80 text-sm">3 Reinos: Numérico, Verbal, Abstracto</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setPreguntadosMode('conocimiento'); setPreguntadosSetupStep('players'); }}
                  className="w-full p-6 rounded-2xl text-left transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">📚</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Conocimiento</h3>
                      <p className="text-white/80 text-sm">6 Reinos: Matemática, Física, Química, etc.</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setPreguntadosMode('aleatorio'); setPreguntadosSetupStep('players'); }}
                  className="w-full p-6 rounded-2xl text-left transition hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🎲</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Aleatorio</h3>
                      <p className="text-white/80 text-sm">3 Reinos: Fácil, Medio, Difícil</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* SETUP: Players Names */}
          {preguntadosSetupStep === 'players' && (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
              <h2 className="text-2xl font-bold text-white mb-2">👥 Nombres de Jugadores</h2>
              <p className="text-white/70 mb-6">Ingresa los nombres de los 8 jugadores</p>
              
              <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-6">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <input
                    key={i}
                    type="text"
                    value={preguntadosPlayerNames[i]}
                    onChange={(e) => {
                      const newNames = [...preguntadosPlayerNames]
                      newNames[i] = e.target.value
                      setPreguntadosPlayerNames(newNames)
                    }}
                    placeholder={`Jugador ${i + 1}`}
                    className="p-3 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-white/50 outline-none"
                  />
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setPreguntadosSetupStep('mode')}
                  className="px-6 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30"
                >
                  ← Volver
                </button>
                <button
                  onClick={() => {
                    const validPlayers = preguntadosPlayerNames.filter(n => n.trim())
                    if (validPlayers.length < 2) {
                      alert('Ingresa al menos 2 jugadores')
                      return
                    }
                    startPreguntados(preguntadosMode!, validPlayers)
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:opacity-90"
                >
                  ¡Empezar! 🎮
                </button>
              </div>
            </div>
          )}

          {/* GAME: Main Game Screen */}
          {preguntadosSetupStep === 'game' && (
            <div className="min-h-screen flex flex-col p-4">
              {/* Header with current player and progress */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/70 text-sm">Turno de:</p>
                    <h3 className="text-xl font-bold text-white">
                      🎯 {preguntadosPlayers[preguntadosPlayerOrder[preguntadosCurrentPlayer]]}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-sm">Modo</p>
                    <p className="text-white font-bold">
                      {preguntadosMode === 'razonamiento' ? '🧠 Razonamiento' :
                       preguntadosMode === 'conocimiento' ? '📚 Conocimiento' : '🎲 Aleatorio'}
                    </p>
                  </div>
                </div>

                {/* Crown Progress */}
                <div className="mt-4 flex justify-center gap-2">
                  {(preguntadosMode === 'razonamiento' ? REINOS_RAZONAMIENTO :
                    preguntadosMode === 'conocimiento' ? REINOS_CONOCIMIENTO : REINOS_ALEATORIO
                  ).map((reino) => {
                    const progress = preguntadosReinos[`${preguntadosPlayerOrder[preguntadosCurrentPlayer]}-${reino.id}`] || 0
                    const completed = progress >= PREGUNTADOS_QUESTIONS_TO_WIN
                    return (
                      <div key={reino.id} className="text-center">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${completed ? 'ring-4 ring-yellow-400' : ''}`}
                          style={{ background: completed ? reino.color : `${reino.color}40` }}
                          title={reino.name}
                        >
                          {completed ? '👑' : reino.icon}
                        </div>
                        <p className="text-[10px] text-white/70 mt-1">{progress}/5</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Winner Screen */}
              {preguntadosWinner && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2">¡GANADOR!</h2>
                  <p className="text-2xl text-white mb-6">{preguntadosWinner}</p>
                  <button
                    onClick={resetPreguntados}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg"
                  >
                    🔄 Nuevo Juego
                  </button>
                </div>
              )}

              {/* Spinning Wheel */}
              {!preguntadosWinner && preguntadosShowWheel && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48 mb-6">
                    <div 
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{ 
                        background: 'conic-gradient(from 0deg, #8B5CF6, #3B82F6, #10B981, #F59E0B, #EF4444, #EC4899, #8B5CF6)',
                        animationDuration: preguntadosSpinning ? '0.5s' : '0s'
                      }}
                    />
                    <div className="absolute inset-4 rounded-full bg-gray-900 flex items-center justify-center">
                      <span className="text-4xl">{preguntadosSpinning ? '🎰' : '🎡'}</span>
                    </div>
                  </div>
                  <p className="text-white text-xl mb-4">
                    {preguntadosSpinning ? 'Girando...' : '¡Gira la ruleta!'}
                  </p>
                  {!preguntadosSpinning && (
                    <button
                      onClick={spinWheel}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg"
                    >
                      🎡 GIRAR
                    </button>
                  )}
                </div>
              )}

              {/* Question Screen */}
              {!preguntadosWinner && !preguntadosShowWheel && preguntadosQuestion && (
                <div className="flex-1 flex flex-col">
                  {/* Current Reino & Timer */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const reino = (preguntadosMode === 'razonamiento' ? REINOS_RAZONAMIENTO :
                                       preguntadosMode === 'conocimiento' ? REINOS_CONOCIMIENTO : REINOS_ALEATORIO
                                      ).find(r => r.id === preguntadosCurrentReino)
                        return reino ? (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: reino.color }}
                          >
                            <span className="text-xl">{reino.icon}</span>
                          </div>
                        ) : null
                      })()}
                      <span className="text-white font-bold capitalize">{preguntadosCurrentReino}</span>
                    </div>
                    <div className={`text-2xl font-bold ${preguntadosTimer <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                      ⏱️ {preguntadosTimer}s
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-white rounded-3xl p-6 flex-1 flex flex-col">
                    <p className="text-lg font-medium text-center mb-6 flex-1">{preguntadosQuestion.question}</p>

                    {/* Options */}
                    <div className="space-y-3">
                      {['A', 'B', 'C', 'D'].map((letter, idx) => {
                        const option = idx === 0 ? preguntadosQuestion.optionA :
                                       idx === 1 ? preguntadosQuestion.optionB :
                                       idx === 2 ? preguntadosQuestion.optionC : preguntadosQuestion.optionD
                        const isSelected = preguntadosSelectedAnswer === idx
                        const isCorrect = preguntadosQuestion.correctAnswer === idx
                        const showResult = preguntadosAnswered
                        
                        return (
                          <button
                            key={letter}
                            onClick={() => !preguntadosAnswered && answerPreguntados(idx)}
                            disabled={preguntadosAnswered}
                            className={`w-full p-4 rounded-xl text-left font-medium transition-all flex items-center gap-3 ${
                              showResult
                                ? isCorrect
                                  ? 'bg-green-500 text-white'
                                  : isSelected
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-500'
                                : isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 hover:bg-blue-100 text-gray-800'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              showResult && isCorrect ? 'bg-white text-green-500' : 'bg-gray-200'
                            }`}>
                              {letter}
                            </span>
                            {option}
                          </button>
                        )
                      })}
                    </div>

                    {/* Next Button */}
                    {preguntadosAnswered && !preguntadosWinner && (
                      <button
                        onClick={nextTurn}
                        className="w-full mt-4 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-bold text-lg"
                      >
                        Siguiente →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
