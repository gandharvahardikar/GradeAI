
import React from 'react';
import { AssessmentResult } from '../types';
import { 
  Trophy, 
  Target, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  BrainCircuit,
  Activity,
  ListChecks
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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

  const mlDetailsData = [
    { name: 'Correctness', value: result.mlScoreDetails?.correctness || 0, fill: '#10b981' }, // emerald
    { name: 'Completeness', value: result.mlScoreDetails?.completeness || 0, fill: '#3b82f6' }, // blue
    { name: 'Clarity', value: result.mlScoreDetails?.clarity || 0, fill: '#f59e0b' }, // amber
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header Badge */}
      <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-1">Assessment Complete</h2>
          <p className="text-indigo-200 text-sm">ML Pipeline Execution Successful</p>
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
           <div className="w-48 h-48 relative">
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
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-slate-800">{result.mlScore}</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">/ 100</span>
             </div>
           </div>
        </div>

        {/* ML Grading Logic Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 col-span-1 md:col-span-2">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-800 font-bold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-500" /> ML Scoring Model Breakdown
              </h3>
              <div className="flex gap-4 text-xs">
                 <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Correctness (40%)</span>
                 <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Completeness (40%)</span>
                 <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Clarity (20%)</span>
              </div>
           </div>
           
           <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mlDetailsData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#475569', fontWeight: 500}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#64748b', fontWeight: 600 }} background={{ fill: '#f1f5f9' }} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Question-wise Breakdown (New Feature) */}
        {result.questionGrades && result.questionGrades.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 md:col-span-3">
             <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-indigo-600" /> Question-wise Grading
             </h3>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                   <tr>
                     <th className="px-4 py-3 border-b border-slate-200">Q.No</th>
                     <th className="px-4 py-3 border-b border-slate-200">Max Marks</th>
                     <th className="px-4 py-3 border-b border-slate-200">Obtained</th>
                     <th className="px-4 py-3 border-b border-slate-200">Remarks</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {result.questionGrades.map((q, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/50">
                       <td className="px-4 py-3 font-semibold text-slate-700">{q.questionNumber}</td>
                       <td className="px-4 py-3 text-slate-500">{q.maxMarks}</td>
                       <td className="px-4 py-3">
                         <span className={`font-bold ${
                           q.obtainedMarks >= q.maxMarks * 0.8 ? 'text-green-600' : 
                           q.obtainedMarks >= q.maxMarks * 0.4 ? 'text-yellow-600' : 'text-red-600'
                         }`}>
                           {q.obtainedMarks}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-slate-600 italic">{q.remarks}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* Extracted Text (OCR) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 md:col-span-1 h-96 flex flex-col">
          <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" /> OCR Extracted Text
          </h3>
          <div className="flex-1 bg-slate-50 rounded-lg p-4 overflow-y-auto border border-slate-200 font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
            {result.extractedText}
          </div>
        </div>

        {/* Analysis & Feedback */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-800 font-bold">Concept Analysis</h3>
            <div className="flex items-center gap-2 text-sm text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
               <Activity className="w-4 h-4" /> Similarity Score: {result.similarityScore}%
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Concepts Identified
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
                <AlertCircle className="w-4 h-4" /> Missing Concepts
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
             <h4 className="font-semibold text-slate-800 mb-2">Detailed Feedback</h4>
             <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 italic text-sm leading-relaxed">
               "{result.feedback}"
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};
