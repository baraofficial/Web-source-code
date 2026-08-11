import React, { useState, useMemo } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, ShieldAlert } from 'lucide-react';

interface LivePreviewProps {
  html: string;
  css: string;
  js: string;
  baseUrl: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ html, css, js, baseUrl }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);

  // Generate srcDoc containing full base tag, CSS and JS
  const srcDoc = useMemo(() => {
    // Inject <base href="..."> into head so relative images and assets resolve correctly
    let modifiedHtml = html;

    const baseTag = `<base href="${baseUrl}" />`;
    if (modifiedHtml.includes('<head>')) {
      modifiedHtml = modifiedHtml.replace('<head>', `<head>${baseTag}`);
    } else {
      modifiedHtml = `${baseTag}${modifiedHtml}`;
    }

    // Inject CSS
    const styleBlock = `<style>\n${css}\n</style>`;
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${styleBlock}</head>`);
    } else {
      modifiedHtml = `${styleBlock}${modifiedHtml}`;
    }

    // Inject JS
    const scriptBlock = `<script>\ntry {\n${js}\n} catch(e) { console.error('Preview Script Error:', e); }\n</script>`;
    if (modifiedHtml.includes('</body>')) {
      modifiedHtml = modifiedHtml.replace('</body>', `${scriptBlock}</body>`);
    } else {
      modifiedHtml += scriptBlock;
    }

    return modifiedHtml;
  }, [html, css, js, baseUrl, key]);

  const widthClass = {
    desktop: 'w-full h-[600px]',
    tablet: 'w-[768px] h-[600px] border-x border-purple-900/60 shadow-xl',
    mobile: 'w-[375px] h-[600px] border-x border-purple-900/60 shadow-xl'
  }[device];

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-purple-900/40 rounded-xl overflow-hidden">
      
      {/* Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-zinc-900 border-b border-purple-900/40 text-xs">
        
        <div className="flex items-center space-x-2 text-zinc-400">
          <span className="font-semibold text-purple-300">Live Render Sandbox</span>
          <span className="text-zinc-600">|</span>
          <span className="truncate max-w-[200px] text-zinc-500 font-mono text-[11px]">{baseUrl}</span>
        </div>

        {/* Device Switcher & Controls */}
        <div className="flex items-center space-x-2">
          
          <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-purple-900/40">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded flex items-center space-x-1 ${
                device === 'desktop' ? 'bg-purple-900 text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Desktop</span>
            </button>

            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded flex items-center space-x-1 ${
                device === 'tablet' ? 'bg-purple-900 text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Tablet</span>
            </button>

            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded flex items-center space-x-1 ${
                device === 'mobile' ? 'bg-purple-900 text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Mobile</span>
            </button>
          </div>

          <button
            onClick={() => setKey(prev => prev + 1)}
            className="p-1.5 text-zinc-400 hover:text-purple-300 bg-zinc-950 border border-purple-900/40 rounded hover:bg-purple-950 transition-colors"
            title="Reload Frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <a
            href={baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-zinc-400 hover:text-purple-300 bg-zinc-950 border border-purple-900/40 rounded hover:bg-purple-950 transition-colors"
            title="Buka Website Asli di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

        </div>

      </div>

      {/* Info Banner */}
      <div className="bg-purple-950/40 border-b border-purple-900/30 px-4 py-1.5 text-[11px] text-purple-300 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>Iframe dijalankan dalam Mode Sandbox Terisolasi. Beberapa script interaktif eksternal mungkin memerlukan domain asli.</span>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-zinc-950 flex items-center justify-center p-2 overflow-auto min-h-[500px]">
        <iframe
          key={key}
          title="Extracted Website Preview"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin"
          className={`bg-white rounded-md transition-all duration-300 ${widthClass}`}
        />
      </div>

    </div>
  );
};
