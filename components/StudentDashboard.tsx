
import React, { useState } from 'react';
import { Upload, ChevronRight, AlertCircle, ChevronDown, UserCircle, X, FileText, Plus } from 'lucide-react';
import { fileToBase64, getMimeType } from '../services/utils';
import { assessAssignment } from '../services/gemini';
import { ProcessingPipeline } from './ProcessingPipeline';
import { ReportView } from './ReportView';
import { PipelineStep, AssessmentResult, Subject, Submission, SubjectConfig, AttachedFile } from '../types';

interface StudentDashboardProps {
  currentSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  config: SubjectConfig;
  onSubmissionComplete: (submission: Submission) => void;
  onLogout: () => void;
}

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
  onLogout
}) => {
  const subjects: Subject[] = ['Physics', 'History', 'Mathematics', 'Computer Science'];
  
  const [currentStep, setCurrentStep] = useState<PipelineStep>(PipelineStep.UPLOAD);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePreview[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Cast to File[] to ensure TS knows 'file' is of type File (Blob), preventing 'unknown' error in createObjectURL
      const newFiles = (Array.from(e.target.files) as File[]).map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const runPipeline = async () => {
    if (uploadedFiles.length === 0) return;
    
    // Validation: Check if teacher has provided a model answer
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
      // Prepare files early
      const studentFiles: AttachedFile[] = await Promise.all(
        uploadedFiles.map(async (item) => ({
          id: item.id,
          name: item.file.name,
          mimeType: getMimeType(item.file),
          data: await fileToBase64(item.file)
        }))
      );

      // Start pipeline animation
      const steps = [
        PipelineStep.PREPROCESSING,
        PipelineStep.OCR,
        PipelineStep.TEXT_PROCESSING,
        PipelineStep.SIMILARITY,
        PipelineStep.ML_SCORING
      ];
      
      // Animate through steps
      for (const step of steps) {
        setCurrentStep(step);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Execute Gemini Assessment with multiple files
      const result = await assessAssignment(studentFiles, config);

      setAssessmentResult(result);
      setCurrentStep(PipelineStep.REPORT);
      
      // Notify parent app to store submission
      onSubmissionComplete({
        id: Date.now().toString(),
        studentName: "Student User", // Hardcoded for demo
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-indigo-600 p-2 rounded-lg">
               <UserCircle className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-xl tracking-tight text-slate-800">
               Student<span className="text-indigo-600">Portal</span>
             </span>
          </div>
          <button onClick={onLogout} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {currentStep === PipelineStep.REPORT && assessmentResult ? (
          <ReportView result={assessmentResult} onReset={handleReset} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Column: Upload & Controls */}
            <div className="space-y-8">
              
              {/* Subject Selector */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold mb-4 text-slate-800">Select Subject</h2>
                 <div className="relative">
                    <select 
                      value={currentSubject}
                      onChange={(e) => onSubjectChange(e.target.value as Subject)}
                      disabled={isProcessing}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer disabled:opacity-50"
                    >
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5" />
                  </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-500" />
                    Upload Answer Sheet(s)
                  </h2>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    Multiple pages supported
                  </span>
                </div>
                
                {/* Upload Area */}
                <div className="mb-6">
                  <label className={`
                    border-2 border-dashed border-slate-300 rounded-xl p-8 text-center transition-all relative group block
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer'}
                  `}>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      disabled={isProcessing}
                    />
                    <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Click to add files or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                  </label>
                </div>

                {/* File List Grid */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">Selected Files ({uploadedFiles.length})</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {uploadedFiles.map((item) => (
                        <div key={item.id} className="relative aspect-square rounded-lg border border-slate-200 bg-slate-50 overflow-hidden group">
                           {item.file.type.startsWith('image/') ? (
                             <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                               <FileText className="w-8 h-8 mb-1" />
                               <span className="text-[10px] font-bold uppercase">PDF</span>
                             </div>
                           )}
                           
                           {/* Remove Button Overlay */}
                           {!isProcessing && (
                             <button 
                               onClick={() => removeFile(item.id)}
                               className="absolute top-1 right-1 bg-white/90 text-slate-500 hover:text-red-600 hover:bg-white p-1 rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                               title="Remove file"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           )}
                           
                           {/* Filename Overlay */}
                           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-[10px] text-white truncate text-center">{item.file.name}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Button */}
                <button
                  onClick={runPipeline}
                  disabled={isProcessing || uploadedFiles.length === 0}
                  className={`
                    w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all
                    ${(isProcessing || uploadedFiles.length === 0)
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200'
                    }
                  `}
                >
                  {isProcessing ? 'Processing...' : `Evaluate Assignment (${uploadedFiles.length})`}
                  {!isProcessing && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Right Column: Pipeline Status */}
            <div className={`transition-opacity duration-500 ${isProcessing || currentStep !== PipelineStep.UPLOAD ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
              <ProcessingPipeline isProcessing={isProcessing} currentStep={currentStep} />
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
