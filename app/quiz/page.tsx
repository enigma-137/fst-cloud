"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

interface MCQQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface FillBlankQuestion {
  question: string
  correctAnswer: string
  explanation: string
}

interface TheoryQuestion {
  question: string
  sampleAnswer: string
  keyPoints: string[]
}

type Question = MCQQuestion | FillBlankQuestion | TheoryQuestion

interface PdfInfo {
  id: string
  name: string
  path: string
}

export default function QuizPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const pdfId = searchParams.get("pdfId")
  const questionType = searchParams.get("type") || "mcq"
  const questionCount = Number.parseInt(searchParams.get("count") || "5")

  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<(string | number | string[])[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [extractingText, setExtractingText] = useState(true)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)

  useEffect(() => {
    async function fetchPdfAndGenerateQuiz() {
      if (!pdfId) {
        setError("No PDF selected")
        setLoading(false)
        return
      }

      try {
        // Fetch PDF info
        const { data: pdfData, error: pdfError } = await supabase
          .from("pdf_files")
          .select("id, name, path")
          .eq("id", pdfId)
          .single()

        if (pdfError || !pdfData) {
          throw new Error("Failed to fetch PDF information")
        }

        setPdfInfo(pdfData)

        // Extract text from PDF
        setExtractingText(true)
        const extractResponse = await axios.post("/api/process-pdf", {
          pdfId: pdfData.id,
          pdfPath: pdfData.path,
          title: pdfData.name
        })

        if (extractResponse.status !== 200) {
          throw new Error("Failed to extract PDF text")
        }

        const extractData = extractResponse.data
        setExtractingText(false)
        setGeneratingQuestions(true)

        // Generate quiz questions
        const generateResponse = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfText: extractData.text,
            questionType,
            questionCount,
          }),
        })

        if (!generateResponse.ok) {
          throw new Error("Failed to generate quiz questions")
        }

        const generateData = await generateResponse.json()
        setQuestions(generateData.questions)

        // Initialize answers array with empty values
        setAnswers(
          new Array(generateData.questions.length).fill(
            questionType === "mcq" ? -1 : questionType === "fill-blank" ? "" : [],
          ),
        )

        setGeneratingQuestions(false)
        setLoading(false)
      } catch (err) {
        console.error("Error setting up quiz:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
        setLoading(false)
        setExtractingText(false)
        setGeneratingQuestions(false)
      }
    }

    fetchPdfAndGenerateQuiz()
  }, [pdfId, questionType, questionCount, supabase])

  const handleAnswerChange = (value: string | number | string[]) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = value
    setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = () => {
    // Calculate score
    let correctCount = 0

    questions.forEach((question, index) => {
      if ("options" in question) {
        // MCQ question
        if (answers[index] === question.correctAnswer) {
          correctCount++
        }
      } else if ("correctAnswer" in question && !("options" in question)) {
        // Fill in the blank question
        const userAnswer = (answers[index] as string).trim().toLowerCase()
        const correctAnswer = question.correctAnswer.trim().toLowerCase()
        if (userAnswer === correctAnswer) {
          correctCount++
        }
      }
      // For theory questions, no automatic scoring
    })

    const finalScore = (correctCount / questions.length) * 100
    setScore(finalScore)
    setIsSubmitted(true)
    toast.success("Quiz submitted successfully!")
  }

  const handleReturnToDashboard = () => {
    router.push("/dashboard")
  }

  const handleRetakeQuiz = () => {
    setIsSubmitted(false)
    setCurrentQuestionIndex(0)
    setAnswers(new Array(questions.length).fill(questionType === "mcq" ? -1 : questionType === "fill-blank" ? "" : []))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-medium text-lg">
                  {extractingText
                    ? "Extracting PDF content..."
                    : generatingQuestions
                      ? "Generating quiz questions..."
                      : "Loading..."}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {extractingText
                    ? "This may take a moment depending on the PDF size."
                    : generatingQuestions
                      ? "Our AI is creating personalized questions based on the content."
                      : "Please wait..."}
                </p>
              </div>
              <Progress value={extractingText ? 30 : generatingQuestions ? 70 : 50} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleReturnToDashboard}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {isSubmitted ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Quiz Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Your Score</h3>
                <p className="text-3xl font-bold text-primary">{Math.round(score)}%</p>
              </div>
              <div className="text-right">
                <h3 className="font-medium">PDF</h3>
                <p className="text-sm text-muted-foreground">{pdfInfo?.name}</p>
              </div>
            </div>

            <div className="space-y-6 mt-6">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    {"options" in question && answers[index] === question.correctAnswer && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Correct
                      </Badge>
                    )}
                    {"correctAnswer" in question &&
                      !("options" in question) &&
                      (answers[index] as string).trim().toLowerCase() ===
                        question.correctAnswer.trim().toLowerCase() && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Correct
                        </Badge>
                      )}
                  </div>

                  <p className="mb-3">{question.question}</p>

                  {"options" in question ? (
                    <div className="space-y-2 mb-3">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded-md ${
                            question.correctAnswer === optIndex
                              ? "bg-green-50 border border-green-200"
                              : answers[index] === optIndex && question.correctAnswer !== optIndex
                                ? "bg-red-50 border border-red-200"
                                : "bg-gray-50"
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  ) : "correctAnswer" in question && !("options" in question) ? (
                    <div className="space-y-2 mb-3">
                      <div className="font-medium">Your answer:</div>
                      <div
                        className={`p-2 rounded-md ${
                          (answers[index] as string).trim().toLowerCase() ===
                          question.correctAnswer.trim().toLowerCase()
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        {(answers[index] as string) || "(No answer provided)"}
                      </div>
                      <div className="font-medium mt-2">Correct answer:</div>
                      <div className="p-2 rounded-md bg-green-50 border border-green-200">{question.correctAnswer}</div>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-3">
                      <div className="font-medium">Your answer:</div>
                      <div className="p-2 rounded-md bg-gray-50">
                        {(answers[index] as string) || "(No answer provided)"}
                      </div>
                      <div className="font-medium mt-2">Key points to include:</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {(question as TheoryQuestion).keyPoints.map((point, pointIndex) => (
                          <li key={pointIndex}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3">
                    <h4 className="font-medium text-sm">Explanation:</h4>
                    <p className="text-sm text-gray-600">
                      {"explanation" in question ? question.explanation : (question as TheoryQuestion).sampleAnswer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReturnToDashboard}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
            <Button onClick={handleRetakeQuiz}>
              <FileText className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {questionType === "mcq"
                  ? "Multiple Choice Quiz"
                  : questionType === "fill-blank"
                    ? "Fill in the Blank Quiz"
                    : "Theory Questions"}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="font-medium text-sm text-blue-700">PDF: {pdfInfo?.name}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>

                {"options" in currentQuestion ? (
                  <RadioGroup
                    value={currentAnswer.toString()}
                    onValueChange={(value) => handleAnswerChange(Number.parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : questionType === "fill-blank" ? (
                  <Input
                    value={currentAnswer as string}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full"
                  />
                ) : (
                  <Textarea
                    value={currentAnswer as string}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full min-h-[150px]"
                  />
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>
            <div>
              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={handleSubmit}>Submit Quiz</Button>
              ) : (
                <Button onClick={handleNextQuestion}>Next Question</Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
