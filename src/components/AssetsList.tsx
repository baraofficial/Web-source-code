import React, { useState } from 'react';
import { WebAssets } from '../types';
import { Image, Link2, Tag, ExternalLink, Copy, Check, Search } from 'lucide-react';

interface AssetsListProps {
  assets: WebAssets;
  baseUrl: string;
}

export const AssetsList: React.FC<AssetsListProps> = ({ assets, baseUrl }) => {
  const [activeTab, setActiveTab] = useState<'images' | 'links' | 'meta'>('images');
  const [filter, setFilter] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredImages = assets.images.filter(img => 
    img.src.toLowerCase().includes(filter.toLowerCase()) || 
    img.alt.toLowerCase().includes(filter.toLowerCase()) ||
    img.filename.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredLinks = assets.links.filter(l => 
    l.href.toLowerCase().includes(filter.toLowerCase()) || 
    l.text.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredMeta = assets.meta.filter(m => 
    (m.name || m.property || '').toLowerCase().includes(filter.toLowerCase()) ||
    (m.content || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-zinc-950 border border-purple-900/40 rounded-xl overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-900 border-b border-purple-900/40">
        
        <div className="flex items-center space-x-2 bg-zinc-950 p-1 rounded-lg border border-purple-900/40 text-xs">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
              activeTab === 'images' ? 'bg-purple-900 text-purple-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Gambar ({assets.images.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
              activeTab === 'links' ? 'bg-purple-900 text-purple-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Link ({assets.links.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('meta')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
              activeTab === 'meta' ? 'bg-purple-900 text-purple-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Meta Tags ({assets.meta.length})</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari asset..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-purple-900/40 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
          />
        </div>

      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[600px]">
        
        {/* IMAGES TAB */}
        {activeTab === 'images' && (
          <div>
            {filteredImages.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-10">Tidak ada gambar ditemukan.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="group bg-zinc-900 border border-purple-900/30 hover:border-purple-600/60 rounded-lg overflow-hidden flex flex-col transition-all"
                  >
                    <div className="h-32 bg-zinc-950 flex items-center justify-center p-2 relative overflow-hidden">
                      <img
                        src={img.src}
                        alt={img.alt || 'Asset'}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        }}
                      />
                    </div>
                    <div className="p-2 text-[11px] flex-1 flex flex-col justify-between">
                      <p className="font-mono text-zinc-300 truncate" title={img.filename}>
                        {img.filename}
                      </p>
                      {img.alt && (
                        <p className="text-zinc-500 truncate text-[10px] italic">Alt: "{img.alt}"</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-purple-900/20 mt-1">
                        <button
                          onClick={() => copyToClipboard(img.src)}
                          className="text-purple-400 hover:text-purple-200 flex items-center space-x-1 text-[10px]"
                        >
                          {copiedUrl === img.src ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUrl === img.src ? 'Disalin' : 'Copy URL'}</span>
                        </button>

                        <a
                          href={img.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-purple-300"
                          title="Buka Gambar"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <div className="space-y-2">
            {filteredLinks.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-10">Tidak ada link ditemukan.</p>
            ) : (
              <div className="divide-y divide-purple-900/20 border border-purple-900/30 rounded-lg overflow-hidden bg-zinc-900">
                {filteredLinks.map((link, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-purple-950/30 text-xs transition-colors">
                    <div className="truncate mr-4">
                      <p className="text-purple-300 font-medium truncate">{link.text}</p>
                      <p className="text-zinc-500 font-mono text-[11px] truncate">{link.href}</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(link.href)}
                        className="p-1 text-zinc-400 hover:text-purple-300 bg-zinc-950 border border-purple-900/40 rounded"
                        title="Copy Link"
                      >
                        {copiedUrl === link.href ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-zinc-400 hover:text-purple-300 bg-zinc-950 border border-purple-900/40 rounded"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* META TAGS TAB */}
        {activeTab === 'meta' && (
          <div className="space-y-2">
            {filteredMeta.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-10">Tidak ada meta tag ditemukan.</p>
            ) : (
              <div className="divide-y divide-purple-900/20 border border-purple-900/30 rounded-lg overflow-hidden bg-zinc-900">
                {filteredMeta.map((m, idx) => (
                  <div key={idx} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="font-mono text-purple-400 font-medium shrink-0 min-w-[150px]">
                      {m.name ? `name="${m.name}"` : `property="${m.property}"`}
                    </div>
                    <div className="text-zinc-300 font-mono text-[11px] break-all bg-zinc-950 p-1.5 rounded border border-purple-900/30 flex-1">
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
