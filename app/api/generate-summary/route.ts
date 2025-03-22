import { google } from "@ai-sdk/google"
import { streamObject } from "ai"
import { z } from "zod"

export const maxDuration = 60

export async function POST(req: Request) {
  const { files } = await req.json()
  const firstFile = files?.[0]?.data

  if (!firstFile) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const summarySchema = z.object({
    summary: z.string().describe("A comprehensive summary of the document content"),
  })

  const result = streamObject({
    model: google("gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content: `
          You are an expert summarizer. Your task is to create a concise but comprehensive summary of the provided document.
          Focus on the main ideas, key points, and important details.
          Structure the summary with clear paragraphs and use bullet points for key takeaways if appropriate.
          Keep the language clear and accessible.
        `,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please provide a comprehensive summary of this document.",
          },
          {
            type: "file",
            data: firstFile,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    schema: summarySchema,
  })

  return result.toTextStreamResponse()
}

