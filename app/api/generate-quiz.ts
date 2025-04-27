import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    const { pdfText, questionType, questionCount } = await request.json()

    if (!pdfText) {
      return NextResponse.json({ error: "PDF text is required" }, { status: 400 })
    }

    // Truncate text if it's too long (Gemini has token limits)
    const truncatedText = pdfText.slice(0, 15000) // Adjust based on Gemini's limits

    // Create a prompt based on the question type
    let prompt = ""

    switch (questionType) {
      case "mcq":
        prompt = `Based on the following text, generate ${questionCount} multiple-choice questions with 4 options each. For each question, indicate the correct answer. Format the response as a JSON array with objects containing: question, options (array of 4 strings), correctAnswer (index of correct option), and explanation.
        
        Text: ${truncatedText}
        
        Response format example:
        [
          {
            "question": "What is the capital of France?",
            "options": ["Berlin", "Madrid", "Paris", "Rome"],
            "correctAnswer": 2,
            "explanation": "Paris is the capital city of France."
          }
        ]`
        break

      case "fill-blank":
        prompt = `Based on the following text, generate ${questionCount} fill-in-the-blank questions. For each question, provide the complete sentence with a blank (represented by "____") and the correct answer. Format the response as a JSON array with objects containing: question, correctAnswer, and explanation.
        
        Text: ${truncatedText}
        
        Response format example:
        [
          {
            "question": "The capital of France is ____.",
            "correctAnswer": "Paris",
            "explanation": "Paris is the capital city of France."
          }
        ]`
        break

      case "theory":
        prompt = `Based on the following text, generate ${questionCount} open-ended/theory questions that test understanding of key concepts. For each question, provide a sample answer that would be considered correct. Format the response as a JSON array with objects containing: question, sampleAnswer, and keyPoints (array of strings that should be included in a good answer).
        
        Text: ${truncatedText}
        
        Response format example:
        [
          {
            "question": "Explain the significance of the Eiffel Tower to French culture and history.",
            "sampleAnswer": "The Eiffel Tower, built in 1889 for the World's Fair, has become the most iconic symbol of Paris and France. Initially controversial among Parisians, it now represents French engineering prowess and artistic vision. It attracts millions of visitors annually and has featured prominently in literature, art, and film, cementing its place in global cultural consciousness.",
            "keyPoints": ["Built in 1889", "World's Fair", "Initially controversial", "Symbol of Paris", "Engineering achievement"]
          }
        ]`
        break

      default:
        return NextResponse.json({ error: "Invalid question type" }, { status: 400 })
    }

    // Generate content using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    try {
      // Find JSON in the response (in case there's additional text)
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response")
      }

      const jsonString = jsonMatch[0]
      const questions = JSON.parse(jsonString)

      return NextResponse.json({ questions })
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError)
      return NextResponse.json({ error: "Failed to parse quiz questions", rawResponse: text }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz questions" }, { status: 500 })
  }
}
