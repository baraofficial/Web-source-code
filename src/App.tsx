import React, { useState, useEffect } from 'react';
import { ExtractedSource } from './types';
import { Header } from './components/Header';
import { UrlForm } from './components/UrlForm';
import { CodeViewer } from './components/CodeViewer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { 
  Code2, Sparkles, FileCode, Shield, Download, Cpu, 
  AlertCircle, ArrowRight, Layers, CheckCircle2, Terminal
} from 'lucide-react';

export default function App() {
  const [extractedSource, setExtractedSource] = useState<ExtractedSource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<ExtractedSource[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('maxsource_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  // Save history helper
  const saveToHistory = (item: ExtractedSource) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.url !== item.url);
      const updated = [item, ...filtered].slice(0, 15); // keep max 15
      try {
        localStorage.setItem('maxsource_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history:', e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('maxsource_history');
  };

  // Main Extraction Handler
  const handleExtract = async (url: string, fetchCss: boolean, fetchJs: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, fetchExternalCss: fetchCss, fetchExternalJs: fetchJs })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengekstrak source code dari URL tersebut.');
      }

      setExtractedSource(data);
      saveToHistory(data);

      // Scroll smoothly to code viewer
      setTimeout(() => {
        const viewer = document.getElementById('code-viewer-section');
        if (viewer) {
          viewer.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat mengekstrak website.');
      setExtractedSource(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-900 selection:text-purple-100">
      
      {/* Top Header */}
      <Header 
        onOpenHistory={() => setIsHistoryOpen(true)} 
        historyCount={history.length} 
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Video Banner (Persegi Panjang Tengah) */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-950 border-2 border-purple-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <video 
                src="https://www.image2url.com/r2/default/videos/1787455970497-964d06d4-be6d-4657-9de1-474f22d8272f.mp4" 
                controls 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Input Form Component */}
        <div className="max-w-4xl mx-auto">
          <UrlForm onExtract={handleExtract} isLoading={isLoading} />
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="max-w-4xl mx-auto p-4 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-300">Gagal Mengekstrak Website</h4>
              <p className="text-xs text-red-300/90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="max-w-4xl mx-auto p-10 bg-zinc-900 border border-purple-900/40 rounded-xl text-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-sm font-bold text-white">Sedang Mendownload & Parsing Source Code...</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Mengunduh dokumen HTML, file CSS eksternal, dan script JS. Harap tunggu sebentar.
              </p>
            </div>
          </div>
        )}

        {/* Extracted Code View */}
        {extractedSource && !isLoading && (
          <div id="code-viewer-section" className="space-y-4">
            <CodeViewer source={extractedSource} />
          </div>
        )}

        {/* Default Empty State / Features Section (Shown when no source code active) */}
        {!extractedSource && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-5 pt-6 border-t border-purple-900/30">
            
            <div className="p-5 bg-zinc-900 border border-purple-900/30 rounded-xl space-y-2">
              <div className="p-2.5 w-10 h-10 bg-purple-950 text-purple-400 border border-purple-800/60 rounded-lg flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Ekstraksi Lengkap HTML, CSS, JS</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Membongkar struktur HTML, menyatukan file CSS eksternal dan inline style, serta menangkap script JavaScript secara rapi.
              </p>
            </div>

            <div className="p-5 bg-zinc-900 border border-purple-900/30 rounded-xl space-y-2">
              <div className="p-2.5 w-10 h-10 bg-purple-950 text-purple-400 border border-purple-800/60 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Download Proyek File ZIP</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ekspor semua file kode ke dalam satu arsip `.zip` berisi index.html, style.css, script.js dan daftar aset lengkap dalam satu klik.
              </p>
            </div>

          </div>
        )}

      </main>

      {/* History Drawer Modal */}
      <HistoryDrawer 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history} 
        onSelectHistory={(item) => setExtractedSource(item)} 
        onClearHistory={clearHistory} 
      />

      {/* Clean Footer */}
      <footer className="border-t border-purple-900/30 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center space-x-1">
            <span className="font-semibold text-purple-400">MaxSource</span>
            <span>&copy; 2026 Bara Official</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
