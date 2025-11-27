import { Submission } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getMimeType = (file: File): string => {
  return file.type;
};

// Disabled: Returns undefined to force Base64 usage in the app logic
export const uploadFileToFirebase = async (file: File, folder: string): Promise<string | undefined> => {
  return undefined;
};

export const generateExcelReport = (submissions: Submission[], subject: string) => {
  // 1. Identify all unique question numbers across all submissions to create headers
  const allQuestionNumbers = new Set<string>();
  submissions.forEach(sub => {
    if (sub.result.questionGrades) {
      sub.result.questionGrades.forEach(q => allQuestionNumbers.add(q.questionNumber));
    }
  });
  // Sort naturally (1, 2, 3...)
  const sortedQuestions = Array.from(allQuestionNumbers).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // 2. Create CSV Headers
  let csvContent = "data:text/csv;charset=utf-8,";
  const headers = [
    "Student Name", 
    "Date Submitted", 
    "Total Score (%)", 
    ...sortedQuestions.map(q => `Q${q} Marks`),
    "Remarks"
  ];
  csvContent += headers.join(",") + "\r\n";

  // 3. Add Data Rows
  submissions.forEach(sub => {
    const date = new Date(sub.timestamp).toLocaleDateString();
    
    // Map question marks
    const questionMarks = sortedQuestions.map(qNum => {
      const q = sub.result.questionGrades?.find(item => item.questionNumber === qNum);
      return q ? q.obtainedMarks : "-";
    });

    // Escape feedback text for CSV (replace quotes with double quotes)
    const feedbackSafe = `"${sub.result.feedback.replace(/"/g, '""')}"`;

    const row = [
      `"${sub.studentName}"`,
      date,
      sub.score,
      ...questionMarks,
      feedbackSafe
    ];
    csvContent += row.join(",") + "\r\n";
  });

  // 4. Trigger Download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${subject}_Grading_Report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};