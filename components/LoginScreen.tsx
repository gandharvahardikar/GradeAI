import React, { useState } from 'react';
import { GraduationCap, Users, ArrowRight, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLogin: (role: UserRole, name: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError('Please select a role');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    onLogin(role, name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Side - Brand & Info */}
        <div className="md:w-5/12 bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-600/90 to-indigo-900/90"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">GradeAI</h1>
            </div>
            <p className="text-indigo-100 text-lg leading-relaxed font-light">
              Transforming handwritten assessments with the power of Generative AI.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-indigo-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Instant OCR Extraction</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Semantic Analysis</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Automated Grading</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-500 mb-8">Select your role to continue to the dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setRole('teacher'); setError(''); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${
                    role === 'teacher' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Users className={`w-6 h-6 ${role === 'teacher' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="font-medium">Teacher</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setRole('student'); setError(''); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${
                    role === 'student' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <GraduationCap className={`w-6 h-6 ${role === 'student' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="font-medium">Student</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
            >
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
