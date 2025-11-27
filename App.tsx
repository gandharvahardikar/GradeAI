import React, { useState, useEffect } from 'react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { LoginScreen } from './components/LoginScreen';
import { UserRole, Subject, Submission, SubjectConfigs, SubjectConfig } from './types';

// Initial Seed Data (Used if LocalStorage is empty)
const INITIAL_CONFIGS: SubjectConfigs = {
  'Physics': {
    modelAnswerType: 'text',
    modelAnswerText: "Newton's second law of motion pertains to the behavior of objects for which all existing forces are not balanced. The second law states that the acceleration of an object is dependent upon two variables - the net force acting upon the object and the mass of the object.",
    modelAnswerFiles: [],
    questionPaperFiles: []
  },
  'History': {
    modelAnswerType: 'text',
    modelAnswerText: "The Industrial Revolution was a period of major industrialization and innovation that took place during the late 1700s and early 1800s. It began in Great Britain and quickly spread throughout the world.",
    modelAnswerFiles: [],
    questionPaperFiles: []
  },
  'Mathematics': {
    modelAnswerType: 'text',
    modelAnswerText: "To solve a quadratic equation ax^2 + bx + c = 0, you can use the quadratic formula: x = (-b ± √(b^2 - 4ac)) / 2a.",
    modelAnswerFiles: [],
    questionPaperFiles: []
  },
  'Computer Science': {
    modelAnswerType: 'text',
    modelAnswerText: "Object-oriented programming (OOP) is a computer programming model that organizes software design around data, or objects, rather than functions and logic.",
    modelAnswerFiles: [],
    questionPaperFiles: []
  }
};

const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: '1',
    studentName: 'Alice Johnson',
    subject: 'Physics',
    score: 85,
    timestamp: new Date('2024-03-10T10:00:00'),
    result: {
      extractedText: "Newton's second law says force equals mass times acceleration.",
      similarityScore: 90,
      mlScore: 85,
      mlScoreDetails: { correctness: 90, completeness: 80, clarity: 85 },
      questionGrades: [],
      feedback: "Good understanding of the core concept.",
      keyConceptsFound: ["Force", "Mass", "Acceleration"],
      missedConcepts: ["Net force"]
    }
  }
];

const App: React.FC = () => {
  // Auth State
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  // Data State (Managed via LocalStorage)
  const [currentSubject, setCurrentSubject] = useState<Subject>('Physics');
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfigs>(INITIAL_CONFIGS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initialize from LocalStorage
  useEffect(() => {
    // Restore Session
    const savedSession = localStorage.getItem('autograde_session');
    if (savedSession) {
      try {
        const { role, name } = JSON.parse(savedSession);
        setUserRole(role);
        setUserName(name);
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }

    // Restore Data
    const savedDb = localStorage.getItem('gradeai_db');
    if (savedDb) {
      try {
        const parsed = JSON.parse(savedDb);
        setSubjectConfigs(parsed.subjects || INITIAL_CONFIGS);
        
        // Rehydrate Dates in submissions
        const hydratedSubmissions = (parsed.submissions || []).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        }));
        setSubmissions(hydratedSubmissions);
      } catch (e) {
        console.error("Failed to restore DB", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Persist Data Updates to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('gradeai_db', JSON.stringify({
        subjects: subjectConfigs,
        submissions: submissions
      }));
    }
  }, [subjectConfigs, submissions, isLoaded]);

  // Handlers
  const handleConfigUpdate = (newConfig: SubjectConfig) => {
    setSubjectConfigs(prev => ({
      ...prev,
      [currentSubject]: newConfig
    }));
  };

  const handleNewSubmission = (submission: Submission) => {
    // Tag with authenticated user
    const authenticatedSubmission: Submission = {
      ...submission,
      studentName: userName
    };

    setSubmissions(prev => [authenticatedSubmission, ...prev]);
  };

  const handleAddSubject = (subjectName: string) => {
    if (subjectConfigs[subjectName]) return;
    
    setSubjectConfigs(prev => ({
      ...prev,
      [subjectName]: {
        modelAnswerType: 'text',
        modelAnswerText: '',
        modelAnswerFiles: [],
        questionPaperFiles: []
      }
    }));
    setCurrentSubject(subjectName);
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      localStorage.removeItem('gradeai_db');
      setSubjectConfigs(INITIAL_CONFIGS);
      setSubmissions(INITIAL_SUBMISSIONS);
      window.location.reload();
    }
  };

  const handleLogin = (role: UserRole, name: string) => {
    setUserRole(role);
    setUserName(name);
    localStorage.setItem('autograde_session', JSON.stringify({ role, name }));
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserName('');
    localStorage.removeItem('autograde_session');
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Local Database...</div>;
  }

  // Login Screen
  if (!userRole) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const availableSubjects = Object.keys(subjectConfigs);

  return (
    <>
      {userRole === 'teacher' ? (
        <TeacherDashboard 
          currentSubject={currentSubject}
          onSubjectChange={setCurrentSubject}
          config={subjectConfigs[currentSubject]}
          onConfigChange={handleConfigUpdate}
          submissions={submissions}
          onResetData={handleResetData}
          onLogout={handleLogout}
          availableSubjects={availableSubjects}
          onAddSubject={handleAddSubject}
        />
      ) : (
        <StudentDashboard
          currentSubject={currentSubject}
          onSubjectChange={setCurrentSubject}
          config={subjectConfigs[currentSubject]}
          onSubmissionComplete={handleNewSubmission}
          onLogout={handleLogout}
          submissions={submissions}
          studentName={userName}
          availableSubjects={availableSubjects}
        />
      )}
    </>
  );
};

export default App;