import React, { useState } from 'react';
import { AiAnalysisResult, ExtractedSource } from '../types';
import { Bot, Sparkles, Loader2, Cpu, CheckCircle2, AlertTriangle, Lightbulb, Code } from 'lucide-react';

interface AiAnalysisViewProps {
  source: ExtractedSource;
}

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({ source }) => {
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAiAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: source.url,
          title: source.title,
          html: source.html,
          css: source.combinedCss,
          js: source.combinedJs,
          stats: source.stats
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menganalisis kode.');
      }

      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan analisis AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-purple-900/40 rounded-xl p-5 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-900 border border-purple-900/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-950 border border-purple-700/60 rounded-lg text-purple-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Analisis Gemini AI</span>
              <span className="text-[10px] bg-purple-900/80 text-purple-300 border border-purple-700 px-2 py-0.5 rounded font-mono">
                gemini-3.6-flash
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Analisis struktur DOM, identifikasi Framework/Library, rekomendasi optimasi, dan catatan keamanan.
            </p>
          </div>
        </div>

        <button
          onClick={runAiAnalysis}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-800 text-white text-xs font-semibold rounded-lg border border-purple-500/50 flex items-center space-x-2 shrink-0 transition-colors cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
              <span>Menganalisis...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>{analysis ? 'Mulai Ulang Analisis AI' : 'Mulai Analisis AI Website'}</span>
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Initial state or results */}
      {!analysis && !isLoading && !error && (
        <div className="text-center py-12 px-4 border border-dashed border-purple-900/40 rounded-lg bg-zinc-900/40">
          <Cpu className="w-10 h-10 text-purple-500/60 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-zinc-200">Siap untuk dianalisis oleh Gemini AI</h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
            Klik tombol "Mulai Analisis AI Website" di atas untuk mendeteksi teknologi yang digunakan, rekomendasi struktur, dan optimasi performa.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-zinc-900 rounded-lg border border-purple-900/30"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-zinc-900 rounded-lg border border-purple-900/30"></div>
            <div className="h-32 bg-zinc-900 rounded-lg border border-purple-900/30"></div>
          </div>
        </div>
      )}

      {/* AI Analysis Output */}
      {analysis && !isLoading && (
        <div className="space-y-5">
          
          {/* Summary Box */}
          <div className="p-4 bg-zinc-900 border border-purple-900/40 rounded-lg space-y-2">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-purple-400" />
              <span>Ringkasan Website</span>
            </h4>
            <p className="text-xs text-zinc-200 leading-relaxed">{analysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tech Stack */}
            <div className="p-4 bg-zinc-900 border border-purple-900/40 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Code className="w-4 h-4 text-purple-400" />
                <span>Teknologi / Tech Stack Terdeteksi</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-purple-950 text-purple-200 border border-purple-700/60 rounded text-xs font-mono font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Structure Breakdown */}
            <div className="p-4 bg-zinc-900 border border-purple-900/40 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Struktur Komponen Halaman</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {analysis.structureBreakdown.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Recommendations & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 bg-zinc-900 border border-purple-900/40 rounded-lg space-y-2">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Saran Optimasi Kode</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-purple-400 font-bold">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {analysis.securityNote && (
              <div className="p-4 bg-zinc-900 border border-purple-900/40 rounded-lg space-y-2">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-purple-400" />
                  <span>Catatan Keamanan</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{analysis.securityNote}</p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
