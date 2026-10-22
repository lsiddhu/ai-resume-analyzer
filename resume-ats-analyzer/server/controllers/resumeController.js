import Resume from "../models/Resume.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { calculateATSScore } from "../utils/atsScorer.js";
import { analyzeWithGemini } from "../utils/gemini.js";

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF resume",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        message: "Only PDF files are allowed",
      });
    }

    // Convert uploaded PDF buffer into Uint8Array
    const uint8Array = new Uint8Array(req.file.buffer);

    // Load PDF
    const pdf = await pdfjsLib.getDocument({
      data: uint8Array,
    }).promise;

    let extractedText = "";

    // Extract text from every page
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ");

      extractedText += pageText + "\n";
    }

    // Save resume
    const resume = await Resume.create({
      user: req.userId,
      fileName: req.file.originalname,
      extractedText,
    });

    res.status(201).json({
      message: "Resume uploaded successfully",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);

    res.status(500).json({
      message: "Failed to process resume",
    });
  }
};

export const analyzeResume = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({
        message: "Resume ID and job description are required",
      });
    }

    // Find the resume belonging to the logged-in user
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.userId,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    // Calculate ATS score
    const atsResult = calculateATSScore(
      resume.extractedText,
      jobDescription
    );
    const aiAnalysis = await analyzeWithGemini(
        resume.extractedText,
        jobDescription
    );

    res.json({
        message: "Resume analyzed successfully",

        result: {
            atsScore: atsResult.score,
            matchingKeywords: atsResult.matchingKeywords,
            missingKeywords: atsResult.missingKeywords,
            totalJobKeywords: atsResult.totalJobKeywords,
            aiAnalysis,
        },
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    res.status(500).json({
      message: "Failed to analyze resume",
    });
  }
};
