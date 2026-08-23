import React, { useState } from 'react';
import { ExtractedSource } from '../types';
import { 
  FileCode, Palette, FileText, Image, Eye, Copy, Download, 
  Check, Search, WrapText, Archive, Info, Sparkles, Layers, RefreshCw
} from 'lucide-react';
import JSZip from 'jszip';
import { LivePreview } from './LivePreview';
import { AssetsList } from './AssetsList';

interface CodeViewerProps {
  source: ExtractedSource;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ source }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'assets' | 'preview'>('html');
  const [selectedCssIndex, setSelectedCssIndex] = useState<number>(-1); // -1 means Combined CSS
  const [selectedJsIndex, setSelectedJsIndex] = useState<number>(-1); // -1 means Combined JS
  
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [isZipping, setIsZipping] = useState(false);

  // Get currently active code text
  const getActiveCode = (): { filename: string; code: string; type: string } => {
    if (activeTab === 'html') {
      return { filename: 'index.html', code: source.html, type: 'html' };
    }
    
    if (activeTab === 'css') {
      if (selectedCssIndex === -1) {
        return { filename: 'style.css', code: source.combinedCss, type: 'css' };
      } else {
        const file = source.cssFiles[selectedCssIndex];
        return { filename: file?.filename || 'style.css', code: file?.content || '', type: 'css' };
      }
    }

    if (activeTab === 'js') {
      if (selectedJsIndex === -1) {
        return { filename: 'script.js', code: source.combinedJs, type: 'javascript' };
      } else {
        const file = source.jsFiles[selectedJsIndex];
        return { filename: file?.filename || 'script.js', code: file?.content || '', type: 'javascript' };
      }
    }

    return { filename: '', code: '', type: '' };
  };

  const currentCodeData = getActiveCode();

  // Filter lines if search query present
  const lines = currentCodeData.code.split('\n');

  const copyCode = () => {
    navigator.clipboard.writeText(currentCodeData.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadSingleFile = () => {
    const blob = new Blob([currentCodeData.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentCodeData.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download entire website source code as ZIP
  const downloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // index.html
      zip.file('index.html', source.html);

      // style.css
      zip.file('style.css', source.combinedCss);

      // script.js
      zip.file('script.js', source.combinedJs);

      // Individual CSS files inside css/ folder
      if (source.cssFiles.length > 0) {
        const cssFolder = zip.folder('css');
        source.cssFiles.forEach(f => {
          cssFolder?.file(f.filename, f.content);
        });
      }

      // Individual JS files inside js/ folder
      if (source.jsFiles.length > 0) {
        const jsFolder = zip.folder('js');
        source.jsFiles.forEach(f => {
          jsFolder?.file(f.filename, f.content);
        });
      }

      // Metadata text file
      const metaInfo = `===========================================
WEBSITE SOURCE CODE EXTRACTION DETAILS
===========================================
Website URL    : ${source.url}
Title          : ${source.title}
Extracted At   : ${source.extractedAt}
Total Size     : ${(source.totalSize / 1024).toFixed(2)} KB
DOM Elements   : ${source.stats.domElementsCount}
CSS Files      : ${source.stats.externalStyleCount}
JS Files       : ${source.stats.externalScriptCount}
Images Found   : ${source.stats.imageCount}

Extracted by MaxSource App
`;
      zip.file('README.txt', metaInfo);

      const content = await zip.generateAsync({ type: 'blob' });
      const hostname = new URL(source.url).hostname.replace(/[^a-z0-9]/gi, '_');
      const filename = `${hostname}_source_code.zip`;

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error creating ZIP:', err);
      alert('Gagal membuat file ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-purple-900/40 rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Top Header Stats & Meta */}
      <div className="p-4 bg-zinc-950 border-b border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        <div className="flex items-center space-x-3 truncate">
          {source.favicon && (
            <img 
              src={source.favicon} 
              alt="Favicon" 
              className="w-6 h-6 rounded bg-zinc-900 p-0.5 border border-purple-900/40 shrink-0" 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          )}
          <div className="truncate">
            <h2 className="text-sm font-bold text-white truncate">{source.title}</h2>
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline font-mono truncate block"
            >
              {source.url}
            </a>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-zinc-900 text-purple-300 border border-purple-900/50 rounded-md font-mono">
            {source.stats.domElementsCount} DOM Elemen
          </span>
          <span className="px-2.5 py-1 bg-zinc-900 text-purple-300 border border-purple-900/50 rounded-md font-mono">
            {(source.totalSize / 1024).toFixed(1)} KB
          </span>
          
          <button
            onClick={downloadZip}
            disabled={isZipping}
            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-800 text-white font-semibold text-xs rounded-md border border-purple-500/50 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5 text-purple-200" />
            <span>{isZipping ? 'Membuat ZIP...' : 'Unduh Semua (.ZIP)'}</span>
          </button>
        </div>

      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-zinc-900 border-b border-purple-900/40">
        
        <div className="flex items-center space-x-1 overflow-x-auto text-xs py-1">
          
          {/* HTML Tab */}
          <button
            onClick={() => setActiveTab('html')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'html'
                ? 'bg-purple-900 text-purple-100 border border-purple-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-orange-400" />
            <span>HTML</span>
          </button>

          {/* CSS Tab */}
          <button
            onClick={() => setActiveTab('css')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'css'
                ? 'bg-purple-900 text-purple-100 border border-purple-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <span>CSS ({source.cssFiles.length + (source.stats.inlineStyleCount > 0 ? 1 : 0)})</span>
          </button>

          {/* JS Tab */}
          <button
            onClick={() => setActiveTab('js')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'js'
                ? 'bg-purple-900 text-purple-100 border border-purple-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-yellow-400" />
            <span>JS ({source.jsFiles.length + (source.stats.inlineScriptCount > 0 ? 1 : 0)})</span>
          </button>

          {/* Assets Tab */}
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'assets'
                ? 'bg-purple-900 text-purple-100 border border-purple-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <Image className="w-3.5 h-3.5 text-green-400" />
            <span>Asset & Gambar</span>
          </button>

          {/* Preview Tab */}
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'preview'
                ? 'bg-purple-900 text-purple-100 border border-purple-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>Live Render</span>
          </button>

        </div>

        {/* Code Editor Toolbar Actions (Copy, Download, Wrap) */}
        {['html', 'css', 'js'].includes(activeTab) && (
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setIsWordWrap(!isWordWrap)}
              className={`p-1.5 rounded border ${
                isWordWrap 
                  ? 'bg-purple-950 border-purple-700 text-purple-300' 
                  : 'bg-zinc-950 border-purple-900/40 text-zinc-400'
              }`}
              title="Toggle Word Wrap"
            >
              <WrapText className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={copyCode}
              className="px-2.5 py-1.5 bg-zinc-950 hover:bg-purple-950 text-zinc-200 border border-purple-900/50 rounded flex items-center space-x-1 transition-colors cursor-pointer"
              title="Copy Source Code"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>{isCopied ? 'Tersalin!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={downloadSingleFile}
              className="px-2.5 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/60 rounded flex items-center space-x-1 transition-colors cursor-pointer"
              title={`Unduh ${currentCodeData.filename}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{currentCodeData.filename}</span>
            </button>
          </div>
        )}

      </div>

      {/* Sub-file Selector for CSS and JS */}
      {activeTab === 'css' && source.cssFiles.length > 0 && (
        <div className="px-4 py-2 bg-zinc-950 border-b border-purple-900/30 flex items-center space-x-2 text-xs overflow-x-auto">
          <span className="text-zinc-500 font-medium shrink-0">Pilih File CSS:</span>
          
          <button
            onClick={() => setSelectedCssIndex(-1)}
            className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors shrink-0 ${
              selectedCssIndex === -1
                ? 'bg-purple-900 text-purple-200 border border-purple-600'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-purple-900/30'
            }`}
          >
            Gabungan Semua CSS (style.css)
          </button>

          {source.cssFiles.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCssIndex(idx)}
              className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors shrink-0 ${
                selectedCssIndex === idx
                  ? 'bg-purple-900 text-purple-200 border border-purple-600'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-purple-900/30'
              }`}
            >
              {file.filename} ({(file.size / 1024).toFixed(1)} KB)
            </button>
          ))}
        </div>
      )}

      {activeTab === 'js' && source.jsFiles.length > 0 && (
        <div className="px-4 py-2 bg-zinc-950 border-b border-purple-900/30 flex items-center space-x-2 text-xs overflow-x-auto">
          <span className="text-zinc-500 font-medium shrink-0">Pilih File JS:</span>
          
          <button
            onClick={() => setSelectedJsIndex(-1)}
            className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors shrink-0 ${
              selectedJsIndex === -1
                ? 'bg-purple-900 text-purple-200 border border-purple-600'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-purple-900/30'
            }`}
          >
            Gabungan Semua JS (script.js)
          </button>

          {source.jsFiles.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedJsIndex(idx)}
              className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors shrink-0 ${
                selectedJsIndex === idx
                  ? 'bg-purple-900 text-purple-200 border border-purple-600'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-purple-900/30'
              }`}
            >
              {file.filename} ({(file.size / 1024).toFixed(1)} KB)
            </button>
          ))}
        </div>
      )}

      {/* Code Editor View Container */}
      {['html', 'css', 'js'].includes(activeTab) && (
        <div className="relative bg-zinc-950 text-zinc-100 font-mono text-xs overflow-auto h-[600px] flex">
          
          {/* Line Numbers */}
          <div className="select-none py-4 px-3 bg-zinc-900/80 border-r border-purple-900/30 text-zinc-600 text-right min-w-[50px] font-mono text-[11px] leading-relaxed">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Text Area */}
          <div className="p-4 flex-1 overflow-x-auto leading-relaxed">
            <pre className={`font-mono text-[12px] text-purple-100 ${isWordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
              {currentCodeData.code}
            </pre>
          </div>

        </div>
      )}

      {/* Assets Tab View */}
      {activeTab === 'assets' && (
        <div className="p-4 bg-zinc-950">
          <AssetsList assets={source.assets} baseUrl={source.url} />
        </div>
      )}

      {/* Live Preview View */}
      {activeTab === 'preview' && (
        <div className="p-4 bg-zinc-950">
          <LivePreview 
            html={source.html} 
            css={source.combinedCss} 
            js={source.combinedJs} 
            baseUrl={source.url} 
          />
        </div>
      )}

    </div>
  );
};
