"use client";

import { useState } from "react";
import { experimental_useObject } from "ai/react";
import { questionsSchema, matchingPairsSchema } from "@/lib/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader2, Puzzle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/components/ui/link";
import NextLink from "next/link";
import { generateQuizTitle, generateMatchingTitle } from "./actions";
import { AnimatePresence, motion } from "framer-motion";
import { VercelIcon, GitIcon } from "@/components/icons";
import Quiz from "@/components/quiz";
import MatchingGame from "@/components/MatchingGame";

type Mode = "quiz" | "matching" | null;

export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<z.infer<typeof questionsSchema>>([]);
  const [matchingPairs, setMatchingPairs] = useState<z.infer<typeof matchingPairsSchema>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();
  const [mode, setMode] = useState<Mode>(null);

  const {
    submit: submitQuiz,
    object: partialQuestions,
    isLoading: isLoadingQuiz,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: questionsSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate quiz. Please try again.");
      setFiles([]);
    },
    onFinish: ({ object }) => {
      setQuestions(object ?? []);
    },
  });

  const {
    submit: submitMatching,
    object: partialPairs,
    isLoading: isLoadingMatching,
  } = experimental_useObject({
    api: "/api/generate-matching",
    schema: matchingPairsSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate matching game. Please try again.");
      setFiles([]);
    },
    onFinish: ({ object }) => {
      setMatchingPairs(object ?? []);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      toast.error(
        "Safari does not support drag & drop. Please use the file picker.",
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024,
    );
    console.log(validFiles);

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only PDF files under 5MB are allowed.");
    }

    setFiles(validFiles);
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await encodeFileAsBase64(file),
      })),
    );

    if (mode === "quiz") {
      submitQuiz({ files: encodedFiles });
      const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
      setTitle(generatedTitle);
    } else if (mode === "matching") {
      submitMatching({ files: encodedFiles });
      const generatedTitle = await generateMatchingTitle(encodedFiles[0].name);
      setTitle(generatedTitle);
    }
  };

  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
    setMatchingPairs([]);
    setMode(null);
    setTitle(undefined);
  };

  const isLoading = isLoadingQuiz || isLoadingMatching;
  const progress = mode === "quiz" 
    ? (partialQuestions ? (partialQuestions.length / 4) * 100 : 0)
    : (partialPairs ? (partialPairs.length / 6) * 100 : 0);

  if (questions.length === 4 && mode === "quiz") {
    return <Quiz title={title ?? "Quiz"} questions={questions} clearPDF={clearPDF} />;
  }

  if (matchingPairs.length === 6 && mode === "matching") {
    return <MatchingGame title={title ?? "Matching Game"} pairs={matchingPairs} clearPDF={clearPDF} />;
  }

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
            <div className="text-sm dark:text-zinc-400 text-zinc-500">
              {"(PDFs only)"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="w-full max-w-md h-full border-0 sm:border sm:h-fit mt-12">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
            <div className="rounded-full bg-primary/10 p-2">
              <FileUp className="h-6 w-6" />
            </div>
            <Plus className="h-4 w-4" />
            <div className="rounded-full bg-primary/10 p-2">
              <Loader2 className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              PDF Learning Tools
            </CardTitle>
            <CardDescription className="text-base">
              Upload a PDF to generate interactive learning materials using AI
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!mode ? (
            <div className="flex gap-4">
              <Button
                className="flex-1 h-24 flex-col"
                onClick={() => setMode("quiz")}
              >
                <ListChecks className="h-8 w-8 mb-2" />
                Quiz
              </Button>
              <Button
                className="flex-1 h-24 flex-col"
                onClick={() => setMode("matching")}
              >
                <Puzzle className="h-8 w-8 mb-2" />
                Matching
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitWithFiles} className="space-y-4">
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
                    <span className="font-medium text-foreground">
                      {files[0].name}
                    </span>
                  ) : (
                    <span>Drop your PDF here or click to browse.</span>
                  )}
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setMode(null)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={files.length === 0}
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating {mode === "quiz" ? "Quiz" : "Matching Game"}...</span>
                    </span>
                  ) : (
                    `Generate ${mode === "quiz" ? "Quiz" : "Matching Game"}`
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        {isLoading && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="w-full space-y-2">
              <div className="grid grid-cols-6 sm:grid-cols-4 items-center space-x-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${isLoading ? "bg-yellow-500/50 animate-pulse" : "bg-muted"}`} />
                <span className="text-muted-foreground text-center col-span-4 sm:col-span-2">
                  {mode === "quiz" 
                    ? partialQuestions
                      ? `Generating question ${partialQuestions.length + 1} of 4`
                      : "Analyzing PDF content"
                    : partialPairs
                      ? `Generating pair ${partialPairs.length + 1} of 6`
                      : "Analyzing PDF content"
                  }
                </span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
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
  );
}
