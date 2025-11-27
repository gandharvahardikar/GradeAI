
import React, { useRef, useState, useCallback } from 'react';
import { BookOpen, Save, Users, ChevronDown, BarChart3, Upload, FileText, X, FileType, Database, LogOut, Plus, Check, Trash2, CloudUpload, Download } from 'lucide-react';
import { Subject, Submission, SubjectConfig, AttachedFile } from '../types';
import { fileToBase64, getMimeType, generateExcelReport } from '../services/utils';

interface TeacherDashboardProps {
  currentSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  config: SubjectConfig;
  onConfigChange: (config: SubjectConfig) => void;
  submissions: Submission[];
  onLogout: () => void;
  onResetData: () => void;
  availableSubjects: string[];
  onAddSubject: (subject: string) => void;
}

const DropZone = ({ 
  label, 
  onFilesAdded, 
  files, 
  onRemove, 
  accept,
  icon: Icon
}: { 
  label: string, 
  onFilesAdded: (files: File[]) => void, 
  files: AttachedFile[], 
  onRemove: (id: string) => void,
  accept: string,
  icon: React.ElementType
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, [onFilesAdded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = ''; // reset
    }
  };

  return (
    <div className="space-y-3">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' 
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }
        `}
      >
        <input 
          type="file" 
          ref={inputRef}
          className="hidden" 
          accept={accept}
          multiple 
          onChange={handleChange} 
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 rounded-full ${isDragging ? 'bg-indigo-200' : 'bg-slate-100'}`}>
             <Icon className={`w-6 h-6 ${isDragging ? 'text-indigo-700' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-700 text-sm">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Drag & drop or click to browse</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded ${accept.includes('pdf') ? 'bg-red-100' : 'bg-indigo-100'}`}>
                  <FileType className={`w-4 h-4 ${accept.includes('pdf') ? 'text-red-600' : 'text-indigo-600'}`} />
                </div>
                <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
                className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentSubject,
  onSubjectChange,
  config,
  onConfigChange,
  submissions,
  onLogout,
  onResetData,
  availableSubjects,
  onAddSubject
}) => {
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // Filter submissions for current subject
  const subjectSubmissions = submissions.filter(s => s.subject === currentSubject);
  const avgScore = subjectSubmissions.length 
    ? Math.round(subjectSubmissions.reduce((acc, curr) => acc + curr.score, 0) / subjectSubmissions.length) 
    : 0;

  const handleFilesAdded = async (files: File[], target: 'qp' | 'ma') => {
      const newFiles: AttachedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const base64 = await fileToBase64(file);
          newFiles.push({
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
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

  const submitNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      onAddSubject(newSubjectName.trim());
      setNewSubjectName('');
      setIsAddingSubject(false);
    }
  };

  const handleExport = () => {
    if (subjectSubmissions.length === 0) {
      alert("No submissions to export.");
      return;
    }
    generateExcelReport(subjectSubmissions, currentSubject);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Teacher Portal</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
               onClick={handleExport}
               className="flex items-center gap-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-colors shadow-sm"
               title="Export Grades to Excel/CSV"
            >
               <Download className="w-4 h-4" />
               Export Excel
            </button>
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
          
          <div className="flex items-center gap-2">
            {!isAddingSubject ? (
              <>
                <div className="relative group">
                  <select 
                    value={currentSubject}
                    onChange={(e) => onSubjectChange(e.target.value as Subject)}
                    className="appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium w-64 cursor-pointer transition-all hover:border-indigo-300"
                  >
                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5 group-hover:text-indigo-500 transition-colors" />
                </div>
                <button 
                  onClick={() => setIsAddingSubject(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                  title="Add New Subject"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium text-sm">Add Subject</span>
                </button>
              </>
            ) : (
              <form onSubmit={submitNewSubject} className="flex items-center gap-2 animate-fade-in bg-white p-1 rounded-xl shadow-lg border border-indigo-100">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Enter subject name..."
                  className="bg-transparent text-slate-700 py-2 px-4 rounded-lg focus:outline-none w-48 font-medium"
                  autoFocus
                />
                <button 
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddingSubject(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Configuration Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Question Paper Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
               <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Question Paper
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Upload the question paper (PDF) for reference. The AI will use this to identify questions and max marks.
              </p>

              <DropZone 
                label="Upload Question Paper PDF" 
                files={config.questionPaperFiles}
                onFilesAdded={(f) => handleFilesAdded(f, 'qp')}
                onRemove={(id) => removeFile(id, 'qp')}
                accept="application/pdf"
                icon={CloudUpload}
              />
            </div>

            {/* Model Answer Configuration */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Model Answer Key
                </h3>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => onConfigChange({...config, modelAnswerType: 'text'})}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      config.modelAnswerType === 'text' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Text Input
                  </button>
                  <button
                    onClick={() => onConfigChange({...config, modelAnswerType: 'file'})}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
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
                  className="w-full h-64 p-4 text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none leading-relaxed"
                  placeholder="Type or paste the correct answer key here..."
                />
              ) : (
                <DropZone 
                  label="Upload Model Answer Key (PDF/Images)" 
                  files={config.modelAnswerFiles}
                  onFilesAdded={(f) => handleFilesAdded(f, 'ma')}
                  onRemove={(id) => removeFile(id, 'ma')}
                  accept="application/pdf,image/*"
                  icon={Upload}
                />
              )}
              
              <div className="mt-4 flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium transition-colors cursor-default">
                  <Save className="w-4 h-4" />
                  Changes Auto-saved
                </button>
              </div>
            </div>
          </div>

          {/* Right: Student Progress */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full sticky top-24">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Student Progress
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <div className="text-3xl font-bold text-blue-700">{subjectSubmissions.length}</div>
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mt-1">Submissions</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                  <div className="text-3xl font-bold text-purple-700">{avgScore}%</div>
                  <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mt-1">Avg Score</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Activity</h4>
                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {subjectSubmissions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <BarChart3 className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-400 italic">No submissions yet.</p>
                    </div>
                  ) : (
                    subjectSubmissions.map((sub) => (
                      <div key={sub.id} className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm text-slate-800">{sub.studentName}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            sub.score >= 80 ? 'bg-green-100 text-green-700' :
                            sub.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {sub.score}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex justify-between">
                          <span>{new Date(sub.timestamp).toLocaleDateString()}</span>
                          <span>{new Date(sub.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
