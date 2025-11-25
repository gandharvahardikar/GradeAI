
import React, { useRef } from 'react';
import { BookOpen, Save, Users, ChevronDown, BarChart3, Upload, FileText, X, FileType, Database, LogOut } from 'lucide-react';
import { Subject, Submission, SubjectConfig, AttachedFile } from '../types';
import { fileToBase64, getMimeType } from '../services/utils';

interface TeacherDashboardProps {
  currentSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  config: SubjectConfig;
  onConfigChange: (config: SubjectConfig) => void;
  submissions: Submission[];
  onLogout: () => void;
  onResetData: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentSubject,
  onSubjectChange,
  config,
  onConfigChange,
  submissions,
  onLogout,
  onResetData
}) => {
  const subjects: Subject[] = ['Physics', 'History', 'Mathematics', 'Computer Science'];
  
  // Refs for file inputs
  const qpInputRef = useRef<HTMLInputElement>(null);
  const maInputRef = useRef<HTMLInputElement>(null);

  // Filter submissions for current subject
  const subjectSubmissions = submissions.filter(s => s.subject === currentSubject);
  const avgScore = subjectSubmissions.length 
    ? Math.round(subjectSubmissions.reduce((acc, curr) => acc + curr.score, 0) / subjectSubmissions.length) 
    : 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'qp' | 'ma') => {
    if (e.target.files) {
      const newFiles: AttachedFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        try {
          const base64 = await fileToBase64(file);
          newFiles.push({
            id: Date.now() + '-' + i,
            name: file.name,
            mimeType: getMimeType(file),
            data: base64
          });
        } catch (err) {
          console.error("File upload failed", err);
        }
      }

      if (target === 'qp') {
        onConfigChange({
          ...config,
          questionPaperFiles: [...config.questionPaperFiles, ...newFiles]
        });
      } else {
        onConfigChange({
          ...config,
          modelAnswerFiles: [...config.modelAnswerFiles, ...newFiles]
        });
      }
      
      // Reset input
      e.target.value = '';
    }
  };

  const removeFile = (id: string, target: 'qp' | 'ma') => {
    if (target === 'qp') {
      onConfigChange({
        ...config,
        questionPaperFiles: config.questionPaperFiles.filter(f => f.id !== id)
      });
    } else {
      onConfigChange({
        ...config,
        modelAnswerFiles: config.modelAnswerFiles.filter(f => f.id !== id)
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl">Teacher Portal</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={onResetData} 
              className="flex items-center gap-2 text-xs font-medium bg-indigo-800/50 hover:bg-red-900/50 hover:text-red-200 px-3 py-2 rounded-lg transition-colors border border-indigo-700 hover:border-red-800"
              title="Clear all local data and reset to defaults"
            >
              <Database className="w-3 h-3" />
              Reset DB
            </button>
            <div className="h-6 w-px bg-indigo-700"></div>
            <button onClick={onLogout} className="flex items-center gap-2 text-sm hover:bg-indigo-800 px-3 py-2 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Subject Selection */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Class Dashboard</h2>
            <p className="text-slate-500">Manage assessments and model answers for {currentSubject}</p>
          </div>
          
          <div className="relative">
            <select 
              value={currentSubject}
              onChange={(e) => onSubjectChange(e.target.value as Subject)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium w-64 cursor-pointer"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Configuration Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Question Paper Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Question Paper
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Upload the question paper (PDF) for reference.
              </p>

              <div className="space-y-3">
                {config.questionPaperFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded">
                        <FileType className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{file.name}</span>
                    </div>
                    <button onClick={() => removeFile(file.id, 'qp')} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => qpInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-medium w-full justify-center"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Question PDF
                  </button>
                  <input 
                    type="file" 
                    ref={qpInputRef} 
                    className="hidden" 
                    accept="application/pdf" 
                    multiple
                    onChange={(e) => handleFileUpload(e, 'qp')} 
                  />
                </div>
              </div>
            </div>

            {/* Model Answer Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Model Answer Key
                </h3>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => onConfigChange({...config, modelAnswerType: 'text'})}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      config.modelAnswerType === 'text' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Text Input
                  </button>
                  <button
                    onClick={() => onConfigChange({...config, modelAnswerType: 'file'})}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      config.modelAnswerType === 'file' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Upload PDF/Image
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mb-4">
                Provide the correct answer key. This is the source of truth for the AI grader.
              </p>
              
              {config.modelAnswerType === 'text' ? (
                <textarea
                  value={config.modelAnswerText}
                  onChange={(e) => onConfigChange({...config, modelAnswerText: e.target.value})}
                  className="w-full h-64 p-4 text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none leading-relaxed"
                  placeholder="Type or paste the correct answer key here..."
                />
              ) : (
                <div className="space-y-3">
                   <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-center">
                      {config.modelAnswerFiles.length > 0 ? (
                        <div className="space-y-2">
                           {config.modelAnswerFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm text-left">
                              <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 p-2 rounded">
                                  <FileType className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{file.name}</span>
                              </div>
                              <button onClick={() => removeFile(file.id, 'ma')} className="text-slate-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => maInputRef.current?.click()}
                            className="text-xs text-indigo-600 font-medium hover:underline mt-2 block"
                          >
                            + Add another file
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="bg-indigo-100 p-3 rounded-full mb-3">
                             <Upload className="w-6 h-6 text-indigo-600" />
                          </div>
                          <p className="text-sm font-medium text-slate-700 mb-1">Upload Answer Key PDF/Image</p>
                          <button 
                            onClick={() => maInputRef.current?.click()}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            Browse Files
                          </button>
                        </div>
                      )}
                   </div>
                   <input 
                    type="file" 
                    ref={maInputRef} 
                    className="hidden" 
                    accept="application/pdf,image/*" 
                    multiple
                    onChange={(e) => handleFileUpload(e, 'ma')} 
                  />
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                  <Save className="w-4 h-4" />
                  Auto-saved
                </button>
              </div>
            </div>
          </div>

          {/* Right: Student Progress */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Student Progress
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                  <div className="text-2xl font-bold text-blue-700">{subjectSubmissions.length}</div>
                  <div className="text-xs text-blue-600 font-medium">Submissions</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-center">
                  <div className="text-2xl font-bold text-purple-700">{avgScore}%</div>
                  <div className="text-xs text-purple-600 font-medium">Avg Score</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-600">Recent Activity</h4>
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
                  {subjectSubmissions.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">No submissions yet.</p>
                  ) : (
                    subjectSubmissions.map((sub) => (
                      <div key={sub.id} className="p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm text-slate-800">{sub.studentName}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            sub.score >= 80 ? 'bg-green-100 text-green-700' :
                            sub.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {sub.score}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(sub.timestamp).toLocaleDateString()} • {new Date(sub.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
