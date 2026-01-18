
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HistoryPanel } from './components/HistoryPanel';
import { CustomControls } from './components/CustomControls';
import { AIStudio } from './components/AIStudio';
import { VideoHistoryItem } from './types';
import { Layout, Monitor, AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'focusflow_history';

/**
 * Strict 11-character YouTube video ID extraction.
 */
const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  // Robust regex that matches the 11-character ID after various YouTube path segments
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

function App() {
  const [urlInput, setUrlInput] = useState('');
  const [currentVideo, setCurrentVideo] = useState<VideoHistoryItem | null>(null);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  
  // UI states (held for compatibility with surrounding features)
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("Please paste a valid YouTube link.");
      setCurrentVideo(null);
      return;
    }

    setError(null);
    const existing = history.find(h => extractYoutubeId(h.url) === id);
    const newItem: VideoHistoryItem = existing || {
      id: crypto.randomUUID(),
      url: `https://www.youtube.com/watch?v=${id}`,
      title: 'Focus Session',
      lastPlayed: Date.now(),
      progress: 0,
      duration: 0,
      completed: false,
      notes: ''
    };
    
    setCurrentVideo(newItem);
    setPlayed(0);
    setPlaying(false);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVideoLoad(urlInput);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) setHistory(imported);
      } catch(err) {
        setError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "focusflow_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const activeVideoId = currentVideo ? extractYoutubeId(currentVideo.url) : null;

  return (
    <div className="h-screen w-screen bg-[#09090b] text-zinc-100 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-80 hidden md:flex flex-col p-4 border-r border-white/5 bg-[#0c0c0e]">
        <div className="mb-6 flex items-center gap-2 text-primary font-bold tracking-tight text-xl px-2">
           <Monitor className="text-primary" />
           <span>FocusFlow</span>
        </div>
        <HistoryPanel 
          history={history}
          onSelect={(item) => {
            handleVideoLoad(item.url);
            setUrlInput(item.url);
          }}
          onDelete={(id) => {
            setHistory(prev => prev.filter(i => i.id !== id));
            if (currentVideo?.id === id) setCurrentVideo(null);
          }}
          onExport={handleExport}
          onImport={handleImport}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* URL Input Area */}
        <div className="z-20 w-full max-w-3xl mx-auto mt-6 p-4 shrink-0">
          <form onSubmit={handleUrlSubmit} className="relative group">
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste YouTube Link to Focus..."
              className="w-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-zinc-100 pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-2xl transition-all"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 p-1.5 bg-zinc-800 hover:bg-primary text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Layout size={20} />
            </button>
          </form>
          {error && (
             <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
             </div>
          )}
        </div>

        {/* Video Player Display */}
        <div className="flex-1 p-4 flex gap-4 min-h-0 overflow-hidden z-10">
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {activeVideoId ? (
              <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 group">
                {/* 
                    EXACT FIX IMPLEMENTED: 
                    1. Constructed EXACTly as: https://www.youtube.com/embed/${activeVideoId}?autoplay=0&controls=1
                    2. No extra parameters.
                    3. No nocookie.
                    4. Proper allow attributes.
                */}
                <iframe
                  key={activeVideoId}
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=0&controls=1`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

                {/* UI Overlay (Kept non-blocking) */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <CustomControls 
                      visible={controlsVisible}
                      playing={playing}
                      played={played}
                      duration={duration}
                      muted={muted}
                      onPlayPause={() => {}}
                      onMute={() => {}}
                      onSeek={() => {}}
                      onRewind={() => {}}
                      onFastForward={() => {}}
                      onToggleFullscreen={() => {}}
                    />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                 <Monitor size={48} className="mb-4 opacity-50" />
                 <p className="text-lg font-medium text-zinc-300">No Video Loaded</p>
                 <p className="text-sm">Paste a valid YouTube URL above to start.</p>
              </div>
            )}
          </div>

          {/* AI Studio */}
          <div className="w-96 hidden xl:flex flex-col h-full">
             <AIStudio 
                currentTitle={currentVideo?.title || activeVideoId || ''} 
                notes={currentVideo?.notes || ''}
                onNotesChange={(text) => updateHistoryItem({ notes: text })}
             />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
