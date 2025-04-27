"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { BookOpen, FileQuestion } from "lucide-react"
import { toast } from "sonner"

interface QuizSelectorProps {
  selectedPdf: {
    id: string
    name: string
    path: string
  } | null
  onClose: () => void
}

export default function QuizSelector({ selectedPdf, onClose }: QuizSelectorProps) {
  const [questionType, setQuestionType] = useState<string>("mcq")
  const [questionCount, setQuestionCount] = useState<string>("5")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (!selectedPdf) {
    return null
  }

  const handleStartQuiz = async () => {
    setIsLoading(true)
    try {
      // Navigate to the quiz page with the necessary parameters
      router.push(`/quiz?pdfId=${selectedPdf.id}&type=${questionType}&count=${questionCount}`)
    } catch (error) {
      console.error("Error starting quiz:", error)
      toast.error("Failed to start quiz. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-blue-600" />
          Take a Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
          <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="text-sm font-medium">{selectedPdf.name}</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-type">Question Type</Label>
          <RadioGroup
            id="question-type"
            value={questionType}
            onValueChange={setQuestionType}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mcq" id="mcq" />
              <Label htmlFor="mcq">Multiple Choice Questions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fill-blank" id="fill-blank" />
              <Label htmlFor="fill-blank">Fill in the Blank</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="theory" id="theory" />
              <Label htmlFor="theory">Theory/Open-ended</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-count">Number of Questions</Label>
          <Select value={questionCount} onValueChange={setQuestionCount}>
            <SelectTrigger id="question-count">
              <SelectValue placeholder="Select number of questions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Questions</SelectItem>
              <SelectItem value="5">5 Questions</SelectItem>
              <SelectItem value="10">10 Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleStartQuiz} disabled={isLoading}>
          {isLoading ? "Preparing Quiz..." : "Start Quiz"}
        </Button>
      </CardFooter>
    </Card>
  )
}
