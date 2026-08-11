import React, { useState } from 'react';
import { Search, Globe, Settings2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

interface UrlFormProps {
  onExtract: (url: string, fetchCss: boolean, fetchJs: boolean) => void;
  isLoading: boolean;
}

const PRESET_URLS = [
  { name: 'Example Site', url: 'https://example.com', label: 'Simple HTML/CSS' },
  { name: 'Wikipedia ID', url: 'https://id.wikipedia.org', label: 'Rich DOM & CSS' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', label: 'Minimal Table Layout' },
  { name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com', label: 'API & Landing Page' }
];

export const UrlForm: React.FC<UrlFormProps> = ({ onExtract, isLoading }) => {
  const [urlInput, setUrlInput] = useState('');
  const [fetchCss, setFetchCss] = useState(true);
  const [fetchJs, setFetchJs] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onExtract(urlInput.trim(), fetchCss, fetchJs);
  };

  const handlePresetClick = (presetUrl: string) => {
    setUrlInput(presetUrl);
    onExtract(presetUrl, fetchCss, fetchJs);
  };

  return (
    <div className="bg-zinc-900/90 border border-purple-900/40 rounded-xl p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          
          {/* URL Input Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Masukkan link website (contoh: https://example.com atau wikipedia.org)..."
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-purple-900/60 focus:border-purple-500 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Controls & Submit */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`p-3 rounded-lg border text-sm flex items-center justify-center transition-colors ${
                showOptions
                  ? 'bg-purple-950 border-purple-600 text-purple-200'
                  : 'bg-zinc-950 border-purple-900/60 text-zinc-400 hover:text-purple-300'
              }`}
              title="Pengaturan Ekstraksi"
            >
              <Settings2 className="w-5 h-5" />
            </button>

            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="px-6 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-sm rounded-lg flex items-center justify-center space-x-2 border border-purple-500/50 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengekstrak...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Ubah ke Source Code</span>
                  <ArrowRight className="w-4 h-4 hidden sm:inline" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Extraction Settings Drawer */}
        {showOptions && (
          <div className="pt-3 border-t border-purple-900/30 flex flex-wrap items-center gap-4 text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-lg">
            <div className="font-semibold text-purple-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Opsi Ekstraksi:</span>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fetchCss}
                onChange={(e) => setFetchCss(e.target.checked)}
                className="rounded border-purple-900 bg-zinc-900 text-purple-600 focus:ring-purple-500/20"
              />
              <span>Unduh File CSS Eksternal (`&lt;link rel="stylesheet"&gt;`)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fetchJs}
                onChange={(e) => setFetchJs(e.target.checked)}
                className="rounded border-purple-900 bg-zinc-900 text-purple-600 focus:ring-purple-500/20"
              />
              <span>Unduh File JavaScript Eksternal (`&lt;script src="..."&gt;`)</span>
            </label>
          </div>
        )}

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-zinc-500 font-medium">Coba Contoh URL:</span>
          {PRESET_URLS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              onClick={() => handlePresetClick(preset.url)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-zinc-950 hover:bg-purple-950 text-zinc-300 hover:text-purple-300 border border-purple-900/40 rounded transition-colors text-[11px]"
            >
              {preset.name}
            </button>
          ))}
        </div>

      </form>
    </div>
  );
};
