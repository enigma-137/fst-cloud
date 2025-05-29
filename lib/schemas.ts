import { z } from "zod";

export const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.number(), z.string()]).optional(),
  explanation: z.string().optional(),
  sampleAnswer: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
});

export const questionsSchema = z.array(questionSchema); 