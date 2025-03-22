"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

interface SummaryProps {
  title: string
  content: string
  clearPDF?: () => void
}

export default function Summary({ title, content, clearPDF }: SummaryProps) {
  // Function to format the summary with proper paragraphs and bullet points
  const formatSummary = (text: string) => {
    // Split by double newlines to get paragraphs
    const paragraphs = text.split(/\n\n+/)

    return paragraphs.map((paragraph, index) => {
      // Check if paragraph contains bullet points
      if (paragraph.includes("• ") || paragraph.includes("- ")) {
        const bulletItems = paragraph
          .split(/\n/)
          .filter((item) => item.trim().startsWith("• ") || item.trim().startsWith("- "))

        if (bulletItems.length > 0) {
          return (
            <div key={index} className="mb-4">
              <ul className="list-disc pl-5 space-y-2">
                {bulletItems.map((item, itemIndex) => (
                  <li key={itemIndex}>{item.replace(/^[•-]\s/, "")}</li>
                ))}
              </ul>
            </div>
          )
        }
      }

      // Regular paragraph
      return (
        <p key={index} className="mb-4">
          {paragraph}
        </p>
      )
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none">
        {formatSummary(content)}

        {clearPDF && (
          <div className="mt-8 flex justify-center">
            <Button onClick={clearPDF}>
              <FileText className="mr-2 h-4 w-4" /> Try Another PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

