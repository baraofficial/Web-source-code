import React from 'react';
import { ExtractedSource } from '../types';
import { History, X, Trash2, ArrowUpRight, Clock, FileCode } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExtractedSource[];
  onSelectHistory: (item: ExtractedSource) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistory,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border-l border-purple-900/40 h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <History className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm">Riwayat Ekstraksi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p>Belum ada riwayat ekstraksi link.</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectHistory(item);
                  onClose();
                }}
                className="p-3 bg-zinc-900 hover:bg-purple-950/40 border border-purple-900/30 hover:border-purple-600/60 rounded-lg cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 truncate mr-2">
                    {item.favicon && (
                      <img src={item.favicon} alt="" className="w-4 h-4 rounded shrink-0" />
                    )}
                    <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-purple-300 truncate">
                      {item.title}
                    </h4>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 shrink-0" />
                </div>

                <p className="text-[11px] font-mono text-purple-400 truncate">{item.url}</p>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-purple-900/20">
                  <span>{new Date(item.extractedAt).toLocaleString('id-ID')}</span>
                  <span className="font-mono">{(item.totalSize / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {history.length > 0 && (
          <div className="p-4 bg-zinc-900 border-t border-purple-900/40">
            <button
              onClick={onClearHistory}
              className="w-full py-2 bg-red-950/50 hover:bg-red-900/80 text-red-300 border border-red-800/50 rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua Riwayat</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
