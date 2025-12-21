'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, PenTool, Target } from 'lucide-react'

const AIQuizForm = dynamic(() => import('@/components/quiz/ai-quiz-form').then(mod => ({ default: mod.AIQuizForm })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>,
  ssr: false,
})

const ManualQuizForm = dynamic(() => import('@/components/quiz/manual-quiz-form').then(mod => ({ default: mod.ManualQuizForm })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>,
  ssr: false,
})

export default function CreateQuizPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('manual')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="container max-w-6xl mx-auto px-4 pt-8">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Create Your Quiz
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Design engaging quizzes your way. Choose manual creation for complete control, or use AI to generate questions in seconds.
            </p>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 pb-12">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ai' | 'manual')} className="space-y-8">
          {/* Modern Tab Selector */}
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl h-auto">
              <TabsTrigger
                value="manual"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 rounded-lg px-6 py-4 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Manual Creation</div>
                    <div className="text-xs text-muted-foreground">Full control</div>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6 py-4 transition-all"
              >
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">AI Generation</div>
                    <div className="text-xs opacity-90">Quick & smart</div>
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Manual Creation Content */}
          <TabsContent value="manual" className="space-y-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 px-8 py-6 border-b">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 text-white rounded-xl">
                    <Target className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">Craft Your Perfect Quiz</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Design every question, customize difficulty, and create an engaging experience for your players
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <ManualQuizForm />
              </div>
            </div>
          </TabsContent>

          {/* AI Generation Content */}
          <TabsContent value="ai" className="space-y-0">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-1 shadow-xl">
              <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 px-8 py-6 border-b">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold">AI-Powered Quiz Generation</h2>
                        <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                          PREMIUM
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Describe your topic and watch as AI creates a complete quiz with intelligent questions
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <AIQuizForm />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
