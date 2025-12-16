'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import type { AnswerResult } from '@/types/game'

interface AnswerRevealProps {
  result: AnswerResult
}

export function AnswerReveal({ result }: AnswerRevealProps) {
  const { isCorrect, points, timeMs, newScore, rank } = result

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className={`rounded-3xl border-4 p-8 text-center shadow-2xl ${
          isCorrect
            ? 'border-green-500 bg-green-50 dark:bg-green-950'
            : 'border-red-500 bg-red-50 dark:bg-red-950'
        }`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        >
          {isCorrect ? (
            <CheckCircle className="mx-auto h-24 w-24 text-green-500" />
          ) : (
            <XCircle className="mx-auto h-24 w-24 text-red-500" />
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mt-4 text-3xl font-bold ${
            isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}
        >
          {isCorrect ? 'Correct!' : 'Wrong!'}
        </motion.h2>

        {isCorrect && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="mt-6"
            >
              <div className="text-6xl font-bold text-green-600 dark:text-green-400">
                +{points}
              </div>
              <p className="text-sm text-muted-foreground">points</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-4 space-y-2"
            >
              <div className="text-lg">
                <span className="text-muted-foreground">Time:</span>{' '}
                <span className="font-semibold">{(timeMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="text-lg">
                <span className="text-muted-foreground">Total Score:</span>{' '}
                <span className="font-bold text-primary">{newScore}</span>
              </div>
              <div className="text-lg">
                <span className="text-muted-foreground">Rank:</span>{' '}
                <span className="font-bold text-primary">#{rank}</span>
              </div>
            </motion.div>
          </>
        )}

        {!isCorrect && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 text-muted-foreground"
          >
            Better luck next time!
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
}
