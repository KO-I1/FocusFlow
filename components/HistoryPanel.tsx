import React from 'react';
import { VideoHistoryItem } from '../types';
import { PlayCircle, Trash2, Download, Upload, FileJson } from 'lucide-react';

interface HistoryPanelProps {
  history: VideoHistoryItem[];
  onSelect: (item: VideoHistoryItem) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  history, 
  onSelect, 
  onDelete, 
  onExport, 
  onImport 
}) => {
  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h2 className="text-lg font-semibold text-white">Watch History</h2>
        <div className="flex gap-2">
          <button 
            onClick={onExport} 
            title="Export History"
            className="p-2 hover:bg-white/10 rounded-lg text-emerald-400 transition-colors"
          >
            <Download size={18} />
          </button>
          <label 
            title="Import History"
            className="p-2 hover:bg-white/10 rounded-lg text-blue-400 cursor-pointer transition-colors"
          >
            <Upload size={18} />
            <input type="file" accept=".json" onChange={onImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center text-zinc-500 mt-10">
            <FileJson className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm">No history yet.</p>
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              className="group relative bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-primary/30 rounded-lg p-3 transition-all cursor-pointer"
            >
              <div onClick={() => onSelect(item)} className="flex items-start gap-3">
                <div className="mt-1 text-primary">
                  <PlayCircle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-zinc-200 truncate">{item.title || item.url}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1 flex-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(item.progress / (item.duration || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {Math.floor(item.progress / 60)}m
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};