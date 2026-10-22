
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from environment variables");
}

const ai = new GoogleGenAI({ apiKey });

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const analyzeWithGemini = async (
  resumeText,
  jobDescription
) => {
  const prompt = `
You are an ATS resume analyzer.

Analyze the following resume against the provided job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY valid JSON in this exact format:
{
  "summary": "Short summary of the resume's suitability for this job",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "missingSkills": ["skill 1", "skill 2"]
}

Do not include markdown or code fences.
Return only the JSON object.
`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash",
        input: prompt,
      });

      const responseText = interaction.output_text;

      if (!responseText) {
        throw new Error("Gemini returned an empty response");
      }

      const cleanedText = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleanedText);
    } catch (error) {
      const status = error.status ?? error.statusCode;
      const retryable =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504;

      if (!retryable || attempt === 2) {
        console.error("Gemini API error:", error.message);
        throw error;
      }

      const delay = 2000 * (2 ** attempt);
      console.warn(
        `Gemini temporarily unavailable. Retry ${attempt + 1}/2 in ${delay}ms`
      );

      await sleep(delay);
    }
  }
};
