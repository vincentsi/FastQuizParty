import OpenAI from 'openai'
import { logger } from '@/utils/logger'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export class OpenAIService {
  /**
   * Generate a complete quiz with questions
   */
  async generateQuiz(options: {
    prompt: string
    count: number
    difficulty?: 'easy' | 'medium' | 'hard'
    category?: string
  }): Promise<GeneratedQuiz> {
    const { prompt, count, difficulty = 'medium', category } = options

    const systemPrompt = `Tu es un expert en création de quiz éducatifs et divertissants.
Génère des questions de qualité avec exactement 4 options de réponse.
Format JSON attendu : { "title": "...", "questions": [...] }`

    const userPrompt = `Thème : ${prompt}
Nombre de questions : ${count}
Difficulté : ${difficulty}
${category ? `Catégorie : ${category}` : ''}

Génère un quiz complet avec ${count} questions. Chaque question doit avoir:
- text: la question
- options: un array de 4 réponses possibles
- correctAnswer: l'index (0-3) de la bonne réponse
- explanation: une explication de la réponse (optionnel)

Réponds uniquement en JSON valide.`

    try {
      if (!openai) {
        throw new Error('OpenAI API key not configured')
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content generated')
      }

      const parsed = JSON.parse(content)

      // Validate structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid quiz structure')
      }

      logger.info(
        {
          questionCount: parsed.questions.length,
          prompt: prompt.substring(0, 50),
        },
        'Quiz generated successfully'
      )

      return {
        title: parsed.title || prompt,
        questions: parsed.questions.map((q: unknown, index: number) => {
          const question = q as {
            text: string
            options: string[]
            correctAnswer: number
            explanation?: string
          }
          return {
            text: question.text,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty,
            order: index + 1,
          }
        }),
      }
    } catch (error) {
      logger.error({ error, prompt }, 'Failed to generate quiz')
      throw new Error('Failed to generate quiz with AI')
    }
  }

  /**
   * Improve an existing question
   */
  async improveQuestion(question: {
    text: string
    options: string[]
  }): Promise<ImprovedQuestion> {
    const prompt = `Améliore cette question de quiz:

Question: ${question.text}
Options: ${question.options.join(', ')}

Réponds en JSON avec:
- text: question améliorée
- options: 4 options améliorées
- explanation: explication de la bonne réponse`

    try {
      if (!openai) {
        throw new Error('OpenAI API key not configured')
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content generated')
      }

      return JSON.parse(content)
    } catch (error) {
      logger.error({ error }, 'Failed to improve question')
      throw new Error('Failed to improve question with AI')
    }
  }
}

export const openAIService = new OpenAIService()

// Types
interface GeneratedQuiz {
  title: string
  questions: Array<{
    text: string
    options: string[]
    correctAnswer: number
    explanation?: string
    difficulty: string
    order: number
  }>
}

interface ImprovedQuestion {
  text: string
  options: string[]
  explanation: string
}
