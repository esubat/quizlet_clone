import { flashcardSchema, flashcardsSchema } from "@/lib/schemas"
import { google } from "@ai-sdk/google"
import { streamObject } from "ai"

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

  const result = streamObject({
    model: google("gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content: `
          You are an expert educator. Your task is to generate 5 engaging flashcards from a provided document. 
          Ensure the flashcards cover key concepts and include a mix of the following question types:
          - **Direct Questions** (e.g., "What is X?")
          - **Fill-in-the-Blank** (e.g., "The process of X is called _____.")
          - **True/False** (e.g., "X is always true. True or False?")
          - **Scenario-based Questions** (Real-world applications)
          
          Each flashcard should have:
          - A concise and clear **question**.
          - A **detailed but simple answer** explaining the concept in an easy-to-understand way.
          - For fill-in-the-blank questions, ensure the blanks are key terms and provide a straightforward explanation.
          
          Keep language simple and avoid cutting explanations short. Ensure the flashcards enhance understanding.
        `,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract 5 well-structured flashcards from this document with diverse question types.",
          },
          {
            type: "file",
            data: firstFile,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    schema: flashcardSchema,
    output: "array",
    onFinish: ({ object }) => {
      const res = flashcardsSchema.safeParse(object)
      if (!res.success) {
        throw new Error(`Flashcard generation failed: ${res.error.errors.map((e) => e.message).join("\n")}`)
      }
    },
  })

  return result.toTextStreamResponse()
}

