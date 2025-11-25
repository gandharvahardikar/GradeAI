import React from 'react';
import { AssessmentResult } from '../types';
import { 
  Trophy, 
  Target, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Download
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface ReportViewProps {
  result: AssessmentResult;
  onReset: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ result, onReset }) => {
  
  const scoreData = [
    { name: 'Score', value: result.mlScore },
    { name: 'Remaining', value: 100 - result.mlScore },
  ];
  
  const COLORS = ['#4f46e5', '#e2e8f0'];

  const comparisonData = [
    { name: 'Similarity', value: result.similarityScore, fill: '#8b5cf6' },
    { name: 'Final Grade', value: result.mlScore, fill: '#4f46e5' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header Badge */}
      <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-1">Assessment Complete</h2>
          <p className="text-indigo-200 text-sm">Report Generated Successfully</p>
        </div>
        <button 
          onClick={onReset}
          className="px-6 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors border border-indigo-500"
        >
          Evaluate New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Score Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
           <h3 className="text-slate-500 font-medium mb-4 flex items-center gap-2">
             <Trophy className="w-5 h-5 text-yellow-500" /> Final Grade
           </h3>
           <div className="w-48 h-48">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" dy={-10} textAnchor="middle" fill="#1e293b" className="text-4xl font-bold">
                    {result.mlScore}
                  </text>
                  <text x="50%" y="50%" dy={15} textAnchor="middle" fill="#64748b" className="text-sm">
                    / 100
                  </text>
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 col-span-1 md:col-span-2">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-800 font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" /> Performance Metrics
              </h3>
              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">ID: #AS-2023-884</span>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fill: '#64748b' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                 <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <span className="text-purple-600 text-sm font-semibold block mb-1">Semantic Similarity</span>
                    <p className="text-slate-600 text-sm">
                      The student's answer is <strong>{result.similarityScore}%</strong> semantically similar to the model answer, indicating strong alignment in meaning.
                    </p>
                 </div>
                 <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <span className="text-indigo-600 text-sm font-semibold block mb-1">ML Confidence</span>
                    <p className="text-slate-600 text-sm">
                       The grading model has high confidence in this assessment based on keyword matching and sentence structure analysis.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Extracted Text */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 md:col-span-1 h-96 flex flex-col">
          <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" /> OCR Extraction
          </h3>
          <div className="flex-1 bg-slate-50 rounded-lg p-4 overflow-y-auto border border-slate-200 font-mono text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {result.extractedText}
          </div>
        </div>

        {/* Analysis & Feedback */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 md:col-span-2">
          <h3 className="text-slate-800 font-bold mb-4">Detailed Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Key Concepts Found
              </h4>
              <ul className="space-y-2">
                {result.keyConceptsFound.map((concept, i) => (
                  <li key={i} className="text-sm text-slate-600 bg-green-50 px-3 py-2 rounded border border-green-100 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span>
                    {concept}
                  </li>
                ))}
                {result.keyConceptsFound.length === 0 && <li className="text-sm text-slate-400 italic">No key concepts identified clearly.</li>}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Missed Concepts
              </h4>
              <ul className="space-y-2">
                {result.missedConcepts.map((concept, i) => (
                  <li key={i} className="text-sm text-slate-600 bg-red-50 px-3 py-2 rounded border border-red-100 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                    {concept}
                  </li>
                ))}
                {result.missedConcepts.length === 0 && <li className="text-sm text-slate-400 italic">All key concepts were covered!</li>}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
             <h4 className="font-semibold text-slate-800 mb-2">Automated Feedback</h4>
             <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 italic">
               "{result.feedback}"
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};