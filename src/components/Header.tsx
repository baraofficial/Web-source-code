import React from 'react';
import { Code2, Sparkles, History, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHistory, historyCount }) => {
  return (
    <header className="border-b border-purple-900/40 bg-zinc-950/90 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300">
            <Code2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-wide">MaxSource</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-mono">
                v24.04
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-purple-300 bg-zinc-900 px-3 py-1.5 rounded-md border border-purple-900/50">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Tema Hitam & Ungu</span>
          </div>

          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-purple-950 hover:text-purple-200 border border-purple-900/40 hover:border-purple-700/60 rounded-md transition-colors"
            title="Riwayat Ekstraksi"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Riwayat</span>
            {historyCount > 0 && (
              <span className="ml-1 bg-purple-800 text-purple-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {historyCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
