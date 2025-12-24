'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { quizApi, type GetQuizzesQuery, type Difficulty } from '@/lib/api/quiz'
import { QuizList } from '@/components/quiz'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/useDebounce'

export default function QuizzesPage() {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  // Debounce search to reduce API calls (300ms delay)
  const debouncedSearch = useDebounce(search, 300)

  const queryParams: GetQuizzesQuery = {
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    difficulty: difficulty !== 'ALL' ? difficulty : undefined,
    isPublic: true,
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['quizzes', queryParams],
    queryFn: () => quizApi.getQuizzes(queryParams),
    staleTime: 2 * 60 * 1000, // 2 minutes for quiz list (data changes less frequently)
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Browse Quizzes</h1>
        <p className="mt-2 text-muted-foreground">
          Find your next challenge from our collection of quizzes
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={difficulty}
          onValueChange={(value: string) => {
            setDifficulty(value as Difficulty | 'ALL')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Difficulties</SelectItem>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
            <SelectItem value="MIXED">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading quizzes...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-destructive">Failed to load quizzes</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      )}

      {/* Quiz List */}
      {data && (
        <>
          <QuizList
            quizzes={data.quizzes}
            emptyMessage="No quizzes match your filters"
          />

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>

              <Button
                variant="outline"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
