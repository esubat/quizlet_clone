import { matchingPairSchema, matchingPairsSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { files } = await req.json();
  const firstFile = files[0].data;

  const result = streamObject({
    model: google("gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content:
          "You are a teacher. Your job is to take a document and create 6 matching pairs based on its content. Each pair should have a term and its corresponding definition. Make sure the terms and definitions are clear and concise.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Create matching pairs based on this document. Each pair should test understanding of key concepts.",
          },
          {
            type: "file",
            data: firstFile,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    schema: matchingPairSchema,
    output: "array",
    onFinish: ({ object }) => {
      const res = matchingPairsSchema.safeParse(object);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join("\n"));
      }
    },
  });

  return result.toTextStreamResponse();
} 