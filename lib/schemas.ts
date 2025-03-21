import { z } from "zod";

export const questionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .length(4)
    .describe(
      "Four possible answers to the question. Only one should be correct. They should all be of equal lengths.",
    ),
  answer: z
    .enum(["A", "B", "C", "D"])
    .describe(
      "The correct answer, where A is the first option, B is the second, and so on.",
    ),
});

export type Question = z.infer<typeof questionSchema>;

export const questionsSchema = z.array(questionSchema).length(4);

export const matchingPairSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const matchingPairsSchema = z.array(matchingPairSchema);

export type MatchingPair = z.infer<typeof matchingPairSchema>;
