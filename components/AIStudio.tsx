
import React, { useState } from 'react';
import { generateStudyAid } from '../services/geminiService';
import { Brain, Sparkles, BookOpen, ScrollText, Loader2 } from 'lucide-react';

interface AIStudioProps {
  currentTitle: string;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const AIStudio: React.FC<AIStudioProps> = ({ currentTitle, notes, onNotesChange }) => {
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'ai'>('notes');

  const handleGenerate = async (mode: 'plan' | 'quiz' | 'summary') => {
    if (!currentTitle) return;
    setLoading(true);
    setActiveTab('ai');
    const result = await generateStudyAid(currentTitle, notes, mode);
    setAiOutput(result);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <Brain size={20} />
          <h2 className="font-semibold text-white">AI Studio</h2>
        </div>
        <div className="flex bg-black/40 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'notes' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Notes
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'ai' ? 'bg-indigo-600/50 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            AI Output
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'notes' ? (
          <textarea
            className="flex-1 w-full bg-transparent p-4 text-sm text-zinc-300 focus:outline-none resize-none font-mono leading-relaxed"
            placeholder="Type your notes here... The AI can use these to help you summarize later."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-4 bg-zinc-900/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-xs animate-pulse">Consulting Gemini...</span>
              </div>
            ) : aiOutput ? (
              <div className="max-w-none">
                 <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-300 leading-relaxed border-none bg-transparent p-0 m-0">
                   {aiOutput}
                 </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                Select an AI tool below to begin.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-white/5 grid grid-cols-3 gap-2">
        <button 
          onClick={() => handleGenerate('plan')}
          disabled={!currentTitle || loading}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors border border-white/5"
        >
          <BookOpen size={16} className="text-emerald-400" />
          <span className="text-[10px] uppercase font-medium tracking-wider text-zinc-400">Study Plan</span>
        </button>
        <button 
          onClick={() => handleGenerate('quiz')}
          disabled={!currentTitle || loading}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors border border-white/5"
        >
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-[10px] uppercase font-medium tracking-wider text-zinc-400">Quiz Me</span>
        </button>
        <button 
          onClick={() => handleGenerate('summary')}
          disabled={!currentTitle || loading}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors border border-white/5"
        >
          <ScrollText size={16} className="text-blue-400" />
          <span className="text-[10px] uppercase font-medium tracking-wider text-zinc-400">Refine Notes</span>
        </button>
      </div>
    </div>
  );
};
