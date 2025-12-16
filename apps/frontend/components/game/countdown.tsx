'use client'

import { motion } from 'framer-motion'

interface CountdownProps {
  count: number
}

export function Countdown({ count }: CountdownProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <motion.div
        key={count}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <div className="text-9xl font-bold text-primary">{count}</div>
        <p className="text-lg text-muted-foreground">
          Get ready...
        </p>
      </motion.div>
    </div>
  )
}
