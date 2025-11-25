import React, { useEffect, useState } from 'react';
import { 
  ScanLine, 
  FileText, 
  Binary, 
  Scale, 
  GraduationCap, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { PipelineStep } from '../types';

interface ProcessingPipelineProps {
  isProcessing: boolean;
  currentStep: PipelineStep;
}

const steps = [
  { id: PipelineStep.PREPROCESSING, label: "Preprocessing & Enhancement", icon: ScanLine, desc: "Noise reduction, binarization" },
  { id: PipelineStep.OCR, label: "OCR Extraction", icon: FileText, desc: "Tesseract engine running..." },
  { id: PipelineStep.TEXT_PROCESSING, label: "Text Processing", icon: Binary, desc: "NLTK tokenization & stopword removal" },
  { id: PipelineStep.SIMILARITY, label: "Similarity Calculation", icon: Scale, desc: "Vector comparison with Model Answer" },
  { id: PipelineStep.ML_SCORING, label: "ML Scoring", icon: GraduationCap, desc: "Applying trained grading model" },
];

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({ isProcessing, currentStep }) => {
  const getStatusColor = (stepId: PipelineStep) => {
    // Find index of stepId and currentStep
    const stepIds = steps.map(s => s.id);
    const currentIndex = stepIds.indexOf(currentStep);
    const stepIndex = stepIds.indexOf(stepId);

    if (stepIndex < currentIndex) return "text-green-600 border-green-600 bg-green-50";
    if (stepIndex === currentIndex) return "text-blue-600 border-blue-600 bg-blue-50 ring-2 ring-blue-200 ring-offset-2";
    return "text-slate-400 border-slate-200 bg-white";
  };

  const getIcon = (StepIcon: React.ElementType, stepId: PipelineStep) => {
     const stepIds = steps.map(s => s.id);
    const currentIndex = stepIds.indexOf(currentStep);
    const stepIndex = stepIds.indexOf(stepId);

    if (stepIndex < currentIndex) return <CheckCircle2 className="w-6 h-6" />;
    if (stepIndex === currentIndex) return <Loader2 className="w-6 h-6 animate-spin" />;
    return <StepIcon className="w-6 h-6" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
        Processing Pipeline
      </h3>
      
      <div className="space-y-6 relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100 -z-10" />

        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-4 transition-all duration-300">
            <div className={`
              w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all duration-500
              ${getStatusColor(step.id)}
            `}>
              {getIcon(step.icon, step.id)}
            </div>
            <div className="pt-2">
              <h4 className={`font-semibold text-lg transition-colors ${step.id === currentStep ? 'text-blue-700' : 'text-slate-700'}`}>
                {step.label}
              </h4>
              <p className="text-sm text-slate-500">{step.desc}</p>
              {step.id === currentStep && isProcessing && (
                <div className="mt-2 h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite] w-[40%]"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};