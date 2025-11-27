
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentResult, SubjectConfig, AttachedFile } from "../types";

export const assessAssignment = async (
  studentFiles: AttachedFile[],
  config: SubjectConfig
): Promise<AssessmentResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Handle files that might be URLs (Firebase Storage) or Base64
  const processedStudentFiles = await Promise.all(studentFiles.map(async (file) => {
    if (file.data) return file;
    if (file.url) {
      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        return new Promise<AttachedFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result?.toString().split(',')[1];
                resolve({ ...file, data: base64data });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Failed to fetch file from URL", e);
        return file;
      }
    }
    return file;
  }));

  // Construct the parts for the model
  const contentParts: any[] = [];

  // 1. Instructions: strictly defining the ML Pipeline steps with Multi-Source OCR and Question Validation
  const systemPrompt = `
    You are an expert Automated Grading System powered by multimodal AI.
    Your goal is to perform a high-precision assessment of handwritten student assignments.

    --- INPUT SOURCES ---
    1. MODEL ANSWER KEY: The ground truth. Can be provided as plain text OR as images/PDFs.
    2. QUESTION PAPER: The original questions. Critical for "Per-Question Grading".
    3. STUDENT ANSWER SHEET: The handwritten submission to be graded.

    --- PROCESSING PIPELINE (Execute Logically) ---

    PHASE 1: QUESTION PAPER PARSING & OCR
    1.  **Analyze the Question Paper**: Identify specific Question Numbers (e.g., Q1, Q2, 1a, 1b) and their allocated Maximum Marks.
    2.  **Model Answer OCR**: Extract the correct answer content to establish the Ground Truth.
    3.  **Student Answer OCR**: Transcribe the student's handwritten text.

    PHASE 2: QUESTION-WISE GRADING & VALIDATION
    1.  **Map Answers**: Match the student's responses to the specific questions found in the Question Paper.
    2.  **Validate**: Check if the student attempted the question.
    3.  **Score**: Assign marks for EACH question based on:
        - Correctness against Model Answer.
        - Completeness of derivation/explanation.
    4.  **Remark**: Provide a brief reason for the marks given for that specific question.

    PHASE 3: OVERALL ML METRICS
    Calculate the overall metrics for the entire paper:
    - **Similarity Score** (0-100): Semantic alignment with model answer.
    - **Correctness (40%)**: Factual accuracy.
    - **Completeness (40%)**: Coverage of required points.
    - **Clarity (20%)**: Legibility and structure.
    - **Final ML Score**: The aggregate percentage score.

    --- OUTPUT REQUIREMENT ---
    Return the results strictly in JSON format matching the requested schema.
    Ensure 'questionGrades' array contains an entry for every question identified in the Question Paper.
  `;
  
  contentParts.push({ text: systemPrompt });

  // 2. Model Answer Data
  contentParts.push({ text: "\n\n--- INPUT: MODEL ANSWER KEY (Ground Truth) ---" });
  
  if (config.modelAnswerType === 'text') {
    contentParts.push({ text: config.modelAnswerText });
  } else {
    contentParts.push({ text: "Refer to the following attached document(s) for the Model Answer Key. Perform OCR on these to establish the Ground Truth:" });
    config.modelAnswerFiles.forEach(file => {
      if (file.data) {
        contentParts.push({
            inlineData: {
            data: file.data,
            mimeType: file.mimeType
            }
        });
      }
    });
  }

  // 3. Question Paper Data (Optional Context)
  if (config.questionPaperFiles.length > 0) {
    contentParts.push({ text: "\n\n--- INPUT: ORIGINAL QUESTION PAPER (Reference Context for Max Marks) ---" });
    config.questionPaperFiles.forEach(file => {
        if (file.data) {
            contentParts.push({
                inlineData: {
                data: file.data,
                mimeType: file.mimeType
                }
            });
        }
    });
  } else {
    contentParts.push({ text: "No separate Question Paper file provided. Infer question structure from the Model Answer Key." });
  }

  // 4. Student Submission
  contentParts.push({ text: "\n\n--- INPUT: STUDENT ANSWER SHEET (To be graded) ---" });
  if (processedStudentFiles.length > 1) {
    contentParts.push({ text: "The student submission consists of the following multiple pages. Treat them as a single continuous answer." });
  }

  processedStudentFiles.forEach((file, index) => {
    if (file.data) {
        contentParts.push({ text: `\n[Page ${index + 1}]` });
        contentParts.push({
        inlineData: {
            data: file.data,
            mimeType: file.mimeType,
        },
        });
    }
  });


  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: contentParts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: {
              type: Type.STRING,
              description: "The raw text extracted via OCR from the student's handwritten document.",
            },
            similarityScore: {
              type: Type.NUMBER,
              description: "Semantic/Cosine similarity score (0-100) between Student Text and Model Answer Text.",
            },
            mlScore: {
              type: Type.NUMBER,
              description: "The final calculated weighted grade (0-100).",
            },
            mlScoreDetails: {
              type: Type.OBJECT,
              description: "Breakdown of the ML scoring metrics.",
              properties: {
                correctness: { type: Type.NUMBER, description: "Score for factual accuracy (0-100)." },
                completeness: { type: Type.NUMBER, description: "Score for coverage of key points (0-100)." },
                clarity: { type: Type.NUMBER, description: "Score for structure and legibility (0-100)." },
              },
              required: ["correctness", "completeness", "clarity"]
            },
            questionGrades: {
              type: Type.ARRAY,
              description: "Detailed grading for each question found in the question paper.",
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: { type: Type.STRING, description: "The question number (e.g., '1', '2a', 'Q3')." },
                  maxMarks: { type: Type.NUMBER, description: "The maximum marks allocated for this question." },
                  obtainedMarks: { type: Type.NUMBER, description: "The marks awarded to the student." },
                  remarks: { type: Type.STRING, description: "Reasoning for the marks awarded." }
                },
                required: ["questionNumber", "maxMarks", "obtainedMarks", "remarks"]
              }
            },
            feedback: {
              type: Type.STRING,
              description: "Constructive feedback and explanation of the grade.",
            },
            keyConceptsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of concepts correctly identified.",
            },
            missedConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of concepts missing from the student answer.",
            },
          },
          required: [
            "extractedText",
            "similarityScore",
            "mlScore",
            "mlScoreDetails",
            "questionGrades",
            "feedback",
            "keyConceptsFound",
            "missedConcepts",
          ],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AssessmentResult;
    } else {
      throw new Error("No response received from AI");
    }
  } catch (error) {
    console.error("Gemini Grading Error:", error);
    throw error;
  }
};
