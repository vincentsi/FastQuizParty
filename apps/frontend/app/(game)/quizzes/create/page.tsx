'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { quizApi, type Difficulty } from '@/lib/api/quiz'
import { categoryApi } from '@/lib/api/category'
import { aiApi } from '@/lib/api/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Save, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Question = {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  timeLimit: number
  points: number
}

export default function CreateQuizPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('method')

  // Quiz Info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM')
  const [isPublic, setIsPublic] = useState(true)
  const [timeLimit, setTimeLimit] = useState(30)

  // Creation Method
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual')

  // AI Generation
  const [aiPrompt, setAiPrompt] = useState('')
  const [questionCount, setQuestionCount] = useState(10)

  // Questions
  const [questions, setQuestions] = useState<Question[]>([])

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getCategories,
  })

  // AI Generate mutation
  const generateWithAiMutation = useMutation({
    mutationFn: async () => {
      const result = await aiApi.generateQuiz({
        prompt: aiPrompt,
        count: questionCount,
        difficulty,
        category: categoryId,
      })
      return result
    },
    onSuccess: (data) => {
      const generatedQuestions: Question[] = data.questions.map((q) => ({
        id: Math.random().toString(36).substring(2, 11),
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        timeLimit: timeLimit,
        points: 100,
      }))
      setQuestions(generatedQuestions)
      setActiveTab('questions')
      toast.success(`Generated ${generatedQuestions.length} questions!`)
    },
    onError: (error: Error) => {
      toast.error('Failed to generate questions', {
        description: error.message,
      })
    },
  })

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async () => {
      const quiz = await quizApi.createQuiz({
        title,
        description,
        categoryId,
        difficulty,
        isPublic,
        questions: questions.map((q) => ({
          text: q.text,
          timeLimit: q.timeLimit,
          points: q.points,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      })
      return quiz
    },
    onSuccess: (quiz) => {
      toast.success('Quiz created successfully!')
      router.push(`/quiz/${quiz.id}`)
    },
    onError: (error: Error) => {
      toast.error('Failed to create quiz', {
        description: error.message,
      })
    },
  })

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substring(2, 11),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: timeLimit,
      points: 100,
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

  const updateQuestion = (questionId: string, field: keyof Question, value: string | number) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q))
    )
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) => (idx === optionIndex ? value : opt)),
            }
          : q
      )
    )
  }

  const setCorrectAnswer = (questionId: string, answerIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, correctAnswer: answerIndex } : q
      )
    )
  }

  const canProceedFromMethod = () => {
    if (creationMode === 'ai') {
      return aiPrompt.trim().length >= 10 && categoryId && questionCount >= 5
    }
    return true
  }

  const canSubmit = () => {
    if (!title.trim() || !categoryId || questions.length === 0) return false

    return questions.every(
      (q) =>
        q.text.trim() &&
        q.options.every((opt) => opt.trim()) &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < q.options.length
    )
  }

  const handleGenerateWithAI = () => {
    if (!canProceedFromMethod()) {
      toast.error('Please fill in all required fields')
      return
    }
    generateWithAiMutation.mutate()
  }

  const handleSubmit = () => {
    if (!canSubmit()) {
      toast.error('Please fill in all required fields')
      return
    }
    createQuizMutation.mutate()
  }

  const proceedToQuestions = () => {
    if (creationMode === 'manual') {
      setActiveTab('questions')
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Create New Quiz</h1>
          <p className="text-muted-foreground">
            Build your own quiz manually or generate it with AI
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="method">Creation Method</TabsTrigger>
          <TabsTrigger value="info">Quiz Information</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
        </TabsList>

        {/* Creation Method Tab */}
        <TabsContent value="method" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How would you like to create your quiz?</CardTitle>
              <CardDescription>
                Choose between manual creation or AI-powered generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer border-2 transition-colors ${
                    creationMode === 'manual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setCreationMode('manual')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Manual Creation
                    </CardTitle>
                    <CardDescription>
                      Create questions one by one with full control
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card
                  className={`cursor-pointer border-2 transition-colors ${
                    creationMode === 'ai'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setCreationMode('ai')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Generation
                    </CardTitle>
                    <CardDescription>
                      Generate questions automatically with AI
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {creationMode === 'ai' && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">AI Generation Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-prompt">Describe your quiz topic *</Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder="e.g., 'Create a quiz about French history focusing on the French Revolution'"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 10 characters. Be specific for better results.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ai-category">Category *</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger id="ai-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingCategories ? (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            ) : (
                              categories?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ai-difficulty">Difficulty</Label>
                        <Select
                          value={difficulty}
                          onValueChange={(value) => setDifficulty(value as Difficulty)}
                        >
                          <SelectTrigger id="ai-difficulty">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EASY">Easy</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HARD">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question-count">Number of Questions</Label>
                      <Input
                        id="question-count"
                        type="number"
                        min="5"
                        max="50"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">Between 5 and 50 questions</p>
                    </div>

                    <Button
                      onClick={handleGenerateWithAI}
                      disabled={!canProceedFromMethod() || generateWithAiMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {generateWithAiMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            {creationMode === 'manual' && (
              <Button onClick={() => setActiveTab('info')} size="lg">
                Next: Quiz Information
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Quiz Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up the basic details for your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter quiz title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your quiz"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {creationMode === 'manual' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCategories ? (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          ) : (
                            categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select
                        value={difficulty}
                        onValueChange={(value) => setDifficulty(value as Difficulty)}
                      >
                        <SelectTrigger id="difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                          <SelectItem value="MIXED">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Default Time Limit (seconds)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="5"
                      max="300"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="public">Public Quiz</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this quiz visible to all users
                  </p>
                </div>
                <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('method')}>
              Back to Method
            </Button>
            <Button onClick={proceedToQuestions} size="lg">
              Next: Add Questions
            </Button>
          </div>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
                <p className="mb-4 text-muted-foreground">No questions added yet</p>
                {creationMode === 'manual' ? (
                  <Button onClick={addQuestion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Question
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="mb-4 text-sm text-muted-foreground">
                      Go back to generate questions with AI
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab('method')}>
                      Back to Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {questions.map((question, qIndex) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Text *</Label>
                      <Input
                        placeholder="Enter your question"
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Time Limit (seconds)</Label>
                        <Input
                          type="number"
                          min="5"
                          max="300"
                          value={question.timeLimit}
                          onChange={(e) =>
                            updateQuestion(question.id, 'timeLimit', parseInt(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min="10"
                          max="1000"
                          step="10"
                          value={question.points}
                          onChange={(e) =>
                            updateQuestion(question.id, 'points', parseInt(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Options * (Select the correct one)</Label>
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optIndex}
                              onChange={() => setCorrectAnswer(question.id, optIndex)}
                              className="h-4 w-4 cursor-pointer"
                            />
                          </div>
                          <Input
                            placeholder={`Option ${optIndex + 1}`}
                            value={option}
                            onChange={(e) =>
                              updateOption(question.id, optIndex, e.target.value)
                            }
                            className={question.correctAnswer === optIndex ? 'border-green-500' : ''}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {creationMode === 'manual' && (
                <div className="flex gap-3">
                  <Button onClick={addQuestion} variant="outline" className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Question
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setActiveTab('info')}>
              Back to Info
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || createQuizMutation.isPending}
              size="lg"
            >
              {createQuizMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Quiz
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
