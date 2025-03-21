"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const generateQuizTitle = async (file: string) => {
  const result = await generateObject({
    model: google("gemini-1.5-flash-latest"),
    schema: z.object({
      title: z
        .string()
        .describe(
          "A max three word title for the quiz based on the file provided as context",
        ),
    }),
    prompt:
      "Generate a title for a quiz based on the following (PDF) file name. Try and extract as much info from the file name as possible. If the file name is just numbers or incoherent, just return quiz.\n\n " + file,
  });
  return result.object.title;
};

export const generateMatchingTitle = async (file: string) => {
  const result = await generateObject({
    model: google("gemini-1.5-flash-latest"),
    schema: z.object({
      title: z
        .string()
        .describe(
          "A max three word title for the matching game based on the file provided as context",
        ),
    }),
    prompt:
      "Generate a title for a matching game based on the following (PDF) file name. Try and extract as much info from the file name as possible. If the file name is just numbers or incoherent, just return 'Matching Game'.\n\n " + file,
  });
  return result.object.title;
};

export const generateMatchingPairs = async (content: string) => {
  const result = await generateObject({
    model: google("gemini-1.5-pro-latest"),
    schema: z.array(z.object({
      term: z.string(),
      definition: z.string(),
    })).length(6),
    prompt:
      `Create 6 matching pairs based on this content. Each pair should have:
      1. A clear, concise term
      2. A detailed but concise definition
      3. Focus on key concepts from the content
      
      Format as pairs of terms and definitions that test understanding of the material.
      
      Content: ${content}`,
  });
  return result.object;
};
