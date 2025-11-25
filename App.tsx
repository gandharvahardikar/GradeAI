
import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Activity } from 'lucide-react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { UserRole, Subject, Submission, SubjectConfigs, SubjectConfig } from './types';

// Initial Mock Data
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
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    result: {} as any // simplified for mock
  },
  {
    id: '2',
    studentName: 'Bob Smith',
    subject: 'Physics',
    score: 62,
    timestamp: new Date(Date.now() - 40000000), // 12 hours ago
    result: {} as any
  }
];

const App: React.FC = () => {
  // Auth State
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  // Data State (Simulating DB with LocalStorage)
  const [currentSubject, setCurrentSubject] = useState<Subject>('Physics');
  
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfigs>(() => {
    try {
      const saved = localStorage.getItem('autograde_configs');
      return saved ? JSON.parse(saved) : INITIAL_CONFIGS;
    } catch (e) {
      console.error("Failed to load configs", e);
      return INITIAL_CONFIGS;
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem('autograde_submissions');
      if (saved) {
        // Hydrate date strings back to Date objects
        return JSON.parse(saved).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        }));
      }
      return INITIAL_SUBMISSIONS;
    } catch (e) {
      console.error("Failed to load submissions", e);
      return INITIAL_SUBMISSIONS;
    }
  });

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('autograde_configs', JSON.stringify(subjectConfigs));
    } catch (e) {
      console.warn("LocalStorage quota exceeded (likely due to file size). Data not saved.");
    }
  }, [subjectConfigs]);

  useEffect(() => {
    try {
      localStorage.setItem('autograde_submissions', JSON.stringify(submissions));
    } catch (e) {
      console.warn("LocalStorage quota exceeded. Submissions not saved.");
    }
  }, [submissions]);

  // Handlers
  const handleConfigUpdate = (newConfig: SubjectConfig) => {
    setSubjectConfigs(prev => ({
      ...prev,
      [currentSubject]: newConfig
    }));
  };

  const handleNewSubmission = (submission: Submission) => {
    setSubmissions(prev => [submission, ...prev]);
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This will clear all submissions and custom answer keys.")) {
      setSubjectConfigs(INITIAL_CONFIGS);
      setSubmissions(INITIAL_SUBMISSIONS);
      localStorage.removeItem('autograde_configs');
      localStorage.removeItem('autograde_submissions');
    }
  };

  // Login Screen
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
             <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <Activity className="w-10 h-10 text-indigo-600" />
             </div>
             <h1 className="text-3xl font-bold text-slate-900">AutoGrade AI</h1>
             <p className="text-slate-500">Automated Handwritten Assessment System</p>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-center text-sm font-medium text-slate-400 uppercase tracking-wider">Select your role</p>
            
            <button
              onClick={() => setUserRole('teacher')}
              className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex items-center gap-4 text-left"
            >
              <div className="bg-indigo-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Teacher Login</h3>
                <p className="text-sm text-slate-500">Upload keys, monitor progress</p>
              </div>
            </button>

            <button
              onClick={() => setUserRole('student')}
              className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group flex items-center gap-4 text-left"
            >
              <div className="bg-emerald-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Student Login</h3>
                <p className="text-sm text-slate-500">Submit assignments, get grades</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Application View based on Role
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
          onLogout={() => setUserRole(null)}
        />
      ) : (
        <StudentDashboard
          currentSubject={currentSubject}
          onSubjectChange={setCurrentSubject}
          config={subjectConfigs[currentSubject]}
          onSubmissionComplete={handleNewSubmission}
          onLogout={() => setUserRole(null)}
        />
      )}
    </>
  );
};

export default App;
