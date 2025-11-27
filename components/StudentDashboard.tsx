
import React, { useState, useCallback } from 'react';
import { Upload, ChevronRight, AlertCircle, ChevronDown, UserCircle, X, FileText, Plus, History, Eye, ArrowUpRight } from 'lucide-react';
import { fileToBase64, getMimeType } from '../services/utils';
import { assessAssignment } from '../services/gemini';
import { ProcessingPipeline } from './ProcessingPipeline';
import { ReportView } from './ReportView';
import { PipelineStep, AssessmentResult, Subject, Submission, SubjectConfig, AttachedFile, StudentDashboardProps } from '../types';

interface UploadedFilePreview {
  id: string;
  file: File;
  previewUrl: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentSubject,
  onSubjectChange,
  config,
  onSubmissionComplete,
  onLogout,
  submissions,
  studentName,
  availableSubjects
}) => {
  const [currentStep, setCurrentStep] = useState<PipelineStep>(PipelineStep.UPLOAD);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePreview[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter submissions for this student
  const studentHistory = submissions.filter(s => s.studentName === studentName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const processFiles = (files: File[]) => {
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const runPipeline = async () => {
    if (uploadedFiles.length === 0) return;
    
    const hasModelAnswer = 
      (config.modelAnswerType === 'text' && config.modelAnswerText.trim().length > 0) ||
      (config.modelAnswerType === 'file' && config.modelAnswerFiles.length > 0);

    if (!hasModelAnswer) {
      setError("Teacher has not uploaded a model answer for this subject yet.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const studentFiles: AttachedFile[] = await Promise.all(
        uploadedFiles.map(async (item) => ({
          id: item.id,
          name: item.file.name,
          mimeType: getMimeType(item.file),
          data: await fileToBase64(item.file)
        }))
      );

      const steps = [
        PipelineStep.PREPROCESSING,
        PipelineStep.OCR,
        PipelineStep.TEXT_PROCESSING,
        PipelineStep.SIMILARITY,
        PipelineStep.ML_SCORING
      ];
      
      for (const step of steps) {
        setCurrentStep(step);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const result = await assessAssignment(studentFiles, config);

      setAssessmentResult(result);
      setCurrentStep(PipelineStep.REPORT);
      
      onSubmissionComplete({
        id: Date.now().toString(),
        studentName: studentName,
        subject: currentSubject,
        score: result.mlScore,
        timestamp: new Date(),
        result: result
      });

    } catch (err) {
      console.error(err);
      setError("An error occurred during assessment. Please try again.");
      setCurrentStep(PipelineStep.UPLOAD);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAssessmentResult(null);
    setUploadedFiles([]);
    setCurrentStep(PipelineStep.UPLOAD);
    setError(null);
  };

  const viewHistoryItem = (submission: Submission) => {
    setAssessmentResult(submission.result);
    setCurrentStep(PipelineStep.REPORT);
    onSubjectChange(submission.subject);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
               <UserCircle className="w-5 h-5 text-white" />
             </div>
             <div>
               <h1 className="font-bold text-xl tracking-tight text-slate-800 leading-none">
                 Student<span className="text-indigo-600">Portal</span>
               </h1>
               <p className="text-xs text-slate-500 font-medium mt-0.5">Welcome, {studentName}</p>
             </div>
          </div>
          <button onClick={onLogout} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:border-red-200">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {currentStep === PipelineStep.REPORT && assessmentResult ? (
          <ReportView result={assessmentResult} onReset={handleReset} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Upload & Controls (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Main Upload Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">New Assessment</h2>
                    <p className="text-sm text-slate-500">Upload your handwritten assignment for AI grading</p>
                  </div>
                  
                  {/* Subject Dropdown */}
                  <div className="relative">
                    <select 
                      value={currentSubject}
                      onChange={(e) => onSubjectChange(e.target.value as Subject)}
                      disabled={isProcessing}
                      className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-sm cursor-pointer disabled:opacity-50 min-w-[180px]"
                    >
                      {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                  </div>
                </div>

                <div className="p-6">
                  {/* Drag and Drop Area */}
                  <div 
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`
                      relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ease-in-out
                      ${isDragging 
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                      }
                      ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      disabled={isProcessing}
                    />
                    
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300
                      ${isDragging ? 'bg-indigo-200' : 'bg-indigo-50'}
                    `}>
                      <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-700' : 'text-indigo-600'}`} />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      {isDragging ? 'Drop files here' : 'Drag & drop your files here'}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">or click to browse from your computer</p>
                    
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                      <FileText className="w-3 h-3" />
                      Supports PDF, JPG, PNG
                    </div>
                  </div>

                  {/* File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-8 animate-fade-in">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">Attached Files ({uploadedFiles.length})</h3>
                        <button onClick={() => setUploadedFiles([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear All</button>
                      </div>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {uploadedFiles.map((item) => (
                          <div key={item.id} className="group relative aspect-[3/4] rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shadow-sm transition-transform hover:-translate-y-1">
                             {item.file.type.startsWith('image/') ? (
                               <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-white">
                                 <FileText className="w-8 h-8 mb-2 text-slate-300" />
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PDF Document</span>
                                </div>
                             )}
                             
                             {/* Remove Button */}
                             {!isProcessing && (
                               <button 
                                 onClick={() => removeFile(item.id)}
                                 className="absolute top-1 right-1 bg-white/95 text-slate-400 hover:text-red-600 p-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-200"
                               >
                                 <X className="w-3.5 h-3.5" />
                               </button>
                             )}
                             
                             <div className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-slate-100 p-2">
                                <p className="text-[10px] font-medium text-slate-600 truncate text-center">{item.file.name}</p>
                             </div>
                          </div>
                        ))}
                        
                        {/* Add More Button (Small) */}
                        <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all">
                          <input type="file" onChange={handleFileChange} multiple className="hidden" disabled={isProcessing} />
                          <Plus className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-bold uppercase">Add More</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Evaluate Button */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <button
                      onClick={runPipeline}
                      disabled={isProcessing || uploadedFiles.length === 0}
                      className={`
                        w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform
                        ${(isProcessing || uploadedFiles.length === 0)
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.01] shadow-xl shadow-indigo-200'
                        }
                      `}
                    >
                      {isProcessing ? (
                        <>Processing Assignment...</>
                      ) : (
                        <>
                          Run AI Assessment
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Submission History Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <History className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-800">Assessment History</h3>
                </div>
                
                <div className="overflow-x-auto">
                  {studentHistory.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No past submissions found.</p>
                      <p className="text-xs text-slate-400 mt-1">Your graded assignments will appear here.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Subject</th>
                          <th className="px-6 py-4 font-semibold">Date Submitted</th>
                          <th className="px-6 py-4 font-semibold">Grade</th>
                          <th className="px-6 py-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentHistory.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 font-medium text-slate-800">{sub.subject}</td>
                            <td className="px-6 py-4 text-slate-500">
                              {new Date(sub.timestamp).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`
                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                                ${sub.score >= 80 ? 'bg-green-100 text-green-800' :
                                  sub.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'}
                              `}>
                                {sub.score}/100
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => viewHistoryItem(sub)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View Report <ArrowUpRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Pipeline Status (4 cols) */}
            <div className={`lg:col-span-4 transition-all duration-500 ${isProcessing || currentStep !== PipelineStep.UPLOAD ? 'opacity-100 translate-x-0' : 'opacity-60 translate-x-4 grayscale lg:sticky lg:top-24'}`}>
              <ProcessingPipeline isProcessing={isProcessing} currentStep={currentStep} />
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
