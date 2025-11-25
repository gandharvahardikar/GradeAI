
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentResult, SubjectConfig, AttachedFile } from "../types";

export const assessAssignment = async (
  studentFiles: AttachedFile[],
  config: SubjectConfig
): Promise<AssessmentResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct the parts for the model
  const contentParts: any[] = [];

  // 1. Instructions
  const systemPrompt = `
    You are an automated academic grading system. 
    
    Your task is to:
    1. Analyze the provided STUDENT ANSWER (which may consist of multiple image/pdf pages).
    2. Perform accurate OCR to extract the handwritten text from ALL pages.
    3. Compare the extracted text with the provided MODEL ANSWER KEY.
    4. Calculate a Semantic Similarity Score (0-100).
    5. Assign a Final ML Grade (0-100) based on correctness, completeness, and clarity.
    6. Provide constructive feedback.
    7. List key concepts from the model answer that were found in the student's text, and those that were missed.
  `;
  
  contentParts.push({ text: systemPrompt });

  // 2. Model Answer Data
  contentParts.push({ text: "\n\n--- MODEL ANSWER KEY (Truth) ---" });
  
  if (config.modelAnswerType === 'text') {
    contentParts.push({ text: config.modelAnswerText });
  } else {
    contentParts.push({ text: "Refer to the following attached document(s) for the Model Answer Key:" });
    config.modelAnswerFiles.forEach(file => {
      contentParts.push({
        inlineData: {
          data: file.data,
          mimeType: file.mimeType
        }
      });
    });
  }

  // 3. Question Paper Data (Optional Context)
  if (config.questionPaperFiles.length > 0) {
    contentParts.push({ text: "\n\n--- ORIGINAL QUESTION PAPER (Reference) ---" });
    config.questionPaperFiles.forEach(file => {
      contentParts.push({
        inlineData: {
          data: file.data,
          mimeType: file.mimeType
        }
      });
    });
  }

  // 4. Student Submission
  contentParts.push({ text: "\n\n--- STUDENT SUBMISSION TO GRADE ---" });
  if (studentFiles.length > 1) {
    contentParts.push({ text: "The student submission consists of the following multiple pages/files. Treat them as a single continuous answer." });
  }

  studentFiles.forEach((file, index) => {
    contentParts.push({ text: `\n[Student Submission Part ${index + 1}/${studentFiles.length}]` });
    contentParts.push({
      inlineData: {
        data: file.data,
        mimeType: file.mimeType,
      },
    });
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
              description: "The combined raw text extracted from the student's handwritten document(s).",
            },
            similarityScore: {
              type: Type.NUMBER,
              description: "A score from 0 to 100 indicating semantic similarity.",
            },
            mlScore: {
              type: Type.NUMBER,
              description: "The final grade from 0 to 100.",
            },
            feedback: {
              type: Type.STRING,
              description: "Constructive feedback for the student.",
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
