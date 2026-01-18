import React, { useState, useEffect, useCallback } from 'react';
import { HistoryPanel } from './components/HistoryPanel';
import { CustomControls } from './components/CustomControls';
import { AIStudio } from './components/AIStudio';
import { VideoHistoryItem } from './types';
import { Layout, Monitor, AlertCircle, Timer, Zap, Target, ArrowRight } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'focusflow_history';

const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

function App() {
  const [urlInput, setUrlInput] = useState('');
  const [currentVideo, setCurrentVideo] = useState<VideoHistoryItem | null>(null);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Focus Session Logic
  const [focusTime, setFocusTime] = useState(0);
  const [isFocusing, setIsFocusing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let interval: any;
    if (isFocusing) {
      interval = setInterval(() => setFocusTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusing]);

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateHistoryItem = useCallback((updates: Partial<VideoHistoryItem>) => {
    if (!currentVideo) return;
    const updated = { ...currentVideo, ...updates, lastPlayed: Date.now() };
    setCurrentVideo(updated);
    setHistory(prev => {
      const filtered = prev.filter(p => p.id !== updated.id);
      return [updated, ...filtered];
    });
  }, [currentVideo]);

  const handleVideoLoad = (url: string) => {
    const id = extractYoutubeId(url);
    if (!id) {
      setError("Enter a specific educational link to stay focused.");
      setCurrentVideo(null);
      return;
    }

    setError(null);
    const existing = history.find(h => extractYoutubeId(h.url) === id);
    const newItem: VideoHistoryItem = existing || {
      id: crypto.randomUUID(),
      url: `https://www.youtube.com/watch?v=${id}`,
      title: 'Deep Work Session',
      lastPlayed: Date.now(),
      progress: 0,
      duration: 0,
      completed: false,
      notes: ''
    };
    
    setCurrentVideo(newItem);
    setIsFocusing(true);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVideoLoad(urlInput);
  };

  const activeVideoId = currentVideo ? extractYoutubeId(currentVideo.url) : null;

  return (
    <div className="h-screen w-screen bg-[#050507] text-zinc-100 flex overflow-hidden font-sans">
      {/* Navigation Sidebar */}
      <div className="w-80 hidden lg:flex flex-col p-5 border-r border-white/5 bg-[#08080a]">
        <div className="mb-8 flex items-center gap-3 px-2">
           <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
             <Zap size={22} className="text-primary fill-primary/20" />
           </div>
           <div>
             <h1 className="font-bold tracking-tight text-lg leading-none">FocusFlow</h1>
             <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">AI Study Lab</span>
           </div>
        </div>
        
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5">
           <div className="flex items-center justify-between mb-2">
             <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
               <Timer size={14} /> Active Session
             </span>
             <span className="text-xs font-mono text-primary">{formatFocusTime(focusTime)}</span>
           </div>
           <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-primary transition-all duration-1000" 
               style={{ width: `${Math.min((focusTime / 1500) * 100, 100)}%` }} // 25min goal
             />
           </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <HistoryPanel 
            history={history}
            onSelect={(item) => {
              handleVideoLoad(item.url);
              setUrlInput(item.url);
            }}
            onDelete={(id) => {
              setHistory(prev => prev.filter(i => i.id !== id));
              if (currentVideo?.id === id) {
                setCurrentVideo(null);
                setIsFocusing(false);
              }
            }}
            onExport={() => {}}
            onImport={() => {}}
          />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Header / URL Bar */}
        <header className="z-20 w-full p-4 flex justify-center border-b border-white/5 bg-black/20 backdrop-blur-md">
          <form onSubmit={handleUrlSubmit} className="relative w-full max-w-2xl">
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a specific lecture or tutorial link..."
              className="w-full bg-white/5 border border-white/10 text-zinc-100 pl-5 pr-14 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-3 bg-zinc-800 hover:bg-primary text-zinc-400 hover:text-white rounded-xl transition-all flex items-center gap-2 group"
            >
              <span className="text-xs font-semibold hidden sm:inline">Focus</span>
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            {error && (
               <div className="absolute -bottom-6 left-0 text-red-400 text-[11px] font-medium flex items-center gap-1.5 px-2">
                  <AlertCircle size={12} />
                  {error}
               </div>
            )}
          </form>
        </header>

        {/* Workspace Grid */}
        <main className="flex-1 p-6 flex gap-6 min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {activeVideoId ? (
              <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 focus-glow group">
                <iframe
                  key={activeVideoId}
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse-subtle">
                   <Target size={40} className="text-primary" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-3">Break the 10-Day Streak</h2>
                 <p className="text-zinc-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                   Paste only the content you truly need to learn. FocusFlow strips away the recommendations, comments, and algorithm triggers that keep you scrolling.
                 </p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                       <h3 className="text-xs font-bold text-primary uppercase tracking-tighter mb-1">Intentionality</h3>
                       <p className="text-xs text-zinc-500">Only watch what you planned to watch before opening this app.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                       <h3 className="text-xs font-bold text-accent uppercase tracking-tighter mb-1">AI Synthesis</h3>
                       <p className="text-xs text-zinc-500">Transform passive watching into active learning with AI Studio.</p>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* AI Side Studio */}
          <div className="w-[400px] hidden xl:flex flex-col h-full shrink-0">
             <AIStudio 
                currentTitle={currentVideo?.title || activeVideoId || ''} 
                notes={currentVideo?.notes || ''}
                onNotesChange={(text) => updateHistoryItem({ notes: text })}
             />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;