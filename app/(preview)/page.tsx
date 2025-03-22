"use client"

import type React from "react"

import { useState } from "react"
import { experimental_useObject } from "ai/react"
import { questionsSchema, matchingPairsSchema } from "@/lib/schemas"
import { z } from "zod"
import { toast } from "sonner"
import { FileUp, Puzzle, ListChecks, BookOpen, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NextLink from "next/link"
import { generateQuizTitle } from "./actions"
import { AnimatePresence, motion } from "framer-motion"
import { VercelIcon, GitIcon } from "@/components/icons"
import Quiz from "@/components/quiz"
import MatchingGame from "@/components/MatchingGame"
import FlashCardList from "@/components/FlashCardLis"
import Summary from "@/components/Summary"

type Mode = "quiz" | "matching" | "flashcards" | "summary"
type EncodedFile = { name: string; type: string; data: string }

export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([])
  const [encodedFiles, setEncodedFiles] = useState<EncodedFile[]>([])
  const [questions, setQuestions] = useState<z.infer<typeof questionsSchema>>([])
  const [matchingPairs, setMatchingPairs] = useState<z.infer<typeof matchingPairsSchema>>([])
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [summary, setSummary] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [title, setTitle] = useState<string>()
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [isFileUploaded, setIsFileUploaded] = useState(false)

  const {
    submit: submitQuiz,
    object: partialQuestions,
    isLoading: isLoadingQuiz,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: questionsSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate quiz. Please try again.")
    },
    onFinish: ({ object }) => {
      setQuestions(object ?? [])
      if (object && object.length === 4) {
        setActiveTab("quiz")
      }
    },
  })

  const {
    submit: submitMatching,
    object: partialPairs,
    isLoading: isLoadingMatching,
  } = experimental_useObject({
    api: "/api/generate-matching",
    schema: matchingPairsSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate matching game. Please try again.")
    },
    onFinish: ({ object }) => {
      setMatchingPairs(object ?? [])
      if (object && object.length === 6) {
        setActiveTab("matching")
      }
    },
  })

  const { submit: submitFlashcards, isLoading: isLoadingFlashcards } = experimental_useObject({
    api: "/api/generate-flashcard",
    schema: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    ),
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate flashcards. Please try again.")
    },
    onFinish: ({ object }) => {
      setFlashcards(object ?? [])
      if (object && object.length > 0) {
        setActiveTab("flashcards")
      }
    },
  })

  const { submit: submitSummary, isLoading: isLoadingSummary } = experimental_useObject({
    api: "/api/generate-summary",
    schema: z.object({
      summary: z.string(),
    }),
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate summary. Please try again.")
    },
    onFinish: ({ object }) => {
      setSummary(object?.summary ?? "")
      if (object?.summary) {
        setActiveTab("summary")
      }
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isSafari && isDragging) {
      toast.error("Safari does not support drag & drop. Please use the file picker.")
      return
    }

    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter((file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024)

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only PDF files under 5MB are allowed.")
    }

    if (validFiles.length > 0) {
      setFiles(validFiles)
      const encoded = await Promise.all(
        validFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await encodeFileAsBase64(file),
        })),
      )
      setEncodedFiles(encoded)
      setIsFileUploaded(true)

      // Generate title based on file name
      const generatedTitle = await generateQuizTitle(encoded[0].name)
      setTitle(generatedTitle)
    }
  }

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const generateContent = (mode: Mode) => {
    if (!encodedFiles.length) {
      toast.error("Please upload a PDF file first.")
      return
    }

    if (mode === "quiz") {
      submitQuiz({ files: encodedFiles })
    } else if (mode === "matching") {
      submitMatching({ files: encodedFiles })
    } else if (mode === "flashcards") {
      submitFlashcards({ files: encodedFiles })
    } else if (mode === "summary") {
      submitSummary({ files: encodedFiles })
    }
  }

  const clearPDF = () => {
    setFiles([])
    setEncodedFiles([])
    setQuestions([])
    setMatchingPairs([])
    setFlashcards([])
    setSummary("")
    setActiveTab("upload")
    setIsFileUploaded(false)
    setTitle(undefined)
  }

  const isLoading = isLoadingQuiz || isLoadingMatching || isLoadingFlashcards || isLoadingSummary
  const progress = isLoadingQuiz
    ? partialQuestions
      ? (partialQuestions.length / 4) * 100
      : 0
    : isLoadingMatching
      ? partialPairs
        ? (partialPairs.length / 6) * 100
        : 0
      : isLoadingFlashcards
        ? 50
        : // We don't have partial data for flashcards
          isLoadingSummary
          ? 50
          : 0 // We don't have partial data for summary

  return (
    <div className="min-h-[100dvh] w-full flex justify-center">
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>Drag and drop files here</div>
            <div className="text-sm dark:text-zinc-400 text-zinc-500">{"(PDFs only)"}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-bold mb-4">{title || "PDF Learning Tools"}</h1>
            {isFileUploaded && (
              <TabsList className="mb-4">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                <TabsTrigger value="matching">Matching</TabsTrigger>
                <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
            )}
            {files.length > 0 && (
              <div className="text-sm text-muted-foreground mb-2">
                Current file: <span className="font-medium">{files[0].name}</span>
                <Button variant="ghost" size="sm" onClick={clearPDF} className="ml-2">
                  Clear
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="upload" className="w-full">
            <Card className="w-full border-0 sm:border">
              <CardHeader className="text-center space-y-6">
                <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">Upload PDF</CardTitle>
                  <CardDescription className="text-base">
                    Upload a PDF to generate interactive learning materials
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors hover:border-muted-foreground/50">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="application/pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      {files.length > 0 ? (
                        <span className="font-medium text-foreground">{files[0].name}</span>
                      ) : (
                        <span>Drop your PDF here or click to browse.</span>
                      )}
                    </p>
                  </div>

                  {isFileUploaded && (
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={() => generateContent("quiz")} className="h-24 flex-col" disabled={isLoading}>
                        <ListChecks className="h-8 w-8 mb-2" />
                        Generate Quiz
                      </Button>
                      <Button
                        onClick={() => generateContent("matching")}
                        className="h-24 flex-col"
                        disabled={isLoading}
                      >
                        <Puzzle className="h-8 w-8 mb-2" />
                        Generate Matching
                      </Button>
                      <Button
                        onClick={() => generateContent("flashcards")}
                        className="h-24 flex-col"
                        disabled={isLoading}
                      >
                        <BookOpen className="h-8 w-8 mb-2" />
                        Generate Flashcards
                      </Button>
                      <Button onClick={() => generateContent("summary")} className="h-24 flex-col" disabled={isLoading}>
                        <FileText className="h-8 w-8 mb-2" />
                        Generate Summary
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              {isLoading && (
                <div className="p-4 space-y-4">
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="w-full space-y-2">
                    <div className="grid grid-cols-6 sm:grid-cols-4 items-center space-x-2 text-sm">
                      <div
                        className={`h-2 w-2 rounded-full ${isLoading ? "bg-yellow-500/50 animate-pulse" : "bg-muted"}`}
                      />
                      <span className="text-muted-foreground text-center col-span-4 sm:col-span-2">
                        {isLoadingQuiz
                          ? partialQuestions
                            ? `Generating question ${partialQuestions.length + 1} of 4`
                            : "Analyzing PDF content"
                          : isLoadingMatching
                            ? partialPairs
                              ? `Generating pair ${partialPairs.length + 1} of 6`
                              : "Analyzing PDF content"
                            : isLoadingFlashcards
                              ? "Generating flashcards..."
                              : "Generating summary..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="quiz">
            {questions.length === 4 ? (
              <Quiz title={title ?? "Quiz"} questions={questions} clearPDF={clearPDF} />
            ) : (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="mb-4">No quiz generated yet.</p>
                  <Button onClick={() => generateContent("quiz")}>Generate Quiz</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matching">
            {matchingPairs.length === 6 ? (
              <MatchingGame title={title ?? "Matching Game"} pairs={matchingPairs} clearPDF={clearPDF} />
            ) : (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="mb-4">No matching game generated yet.</p>
                  <Button onClick={() => generateContent("matching")}>Generate Matching Game</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="flashcards">
            {flashcards.length > 0 ? (
              <Card className="p-8">
                <CardHeader>
                  <CardTitle>{title ?? "Flashcards"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FlashCardList cards={flashcards} />
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="mb-4">No flashcards generated yet.</p>
                  <Button onClick={() => generateContent("flashcards")}>Generate Flashcards</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="summary">
            {summary ? (
              <Summary title={title ?? "Summary"} content={summary} />
            ) : (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="mb-4">No summary generated yet.</p>
                  <Button onClick={() => generateContent("summary")}>Generate Summary</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <motion.div
        className="flex flex-row gap-4 items-center justify-between fixed bottom-6 text-xs "
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <NextLink
          target="_blank"
          href="https://github.com/vercel-labs/ai-sdk-preview-pdf-support"
          className="flex flex-row gap-2 items-center border px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <GitIcon />
          View Source Code
        </NextLink>

        <NextLink
          target="_blank"
          href="https://vercel.com/templates/next.js/ai-quiz-generator"
          className="flex flex-row gap-2 items-center bg-zinc-900 px-2 py-1.5 rounded-md text-zinc-50 hover:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-50"
        >
          <VercelIcon size={14} />
          Deploy with Vercel
        </NextLink>
      </motion.div>
    </div>
  )
}

