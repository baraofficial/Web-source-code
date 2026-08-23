import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to safely resolve relative URLs to absolute URLs
function resolveUrl(relative: string, base: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

// Fetch helper with timeout and custom User-Agent
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/css,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      },
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Format HTML indent simple helper
function formatHtml(html: string): string {
  let indent = 0;
  return html
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.match(/^<\//)) {
        indent = Math.max(0, indent - 1);
      }
      const indented = '  '.repeat(indent) + line;
      if (line.match(/^<[^\/!\?][^>]*[^\/]>$/) && !line.match(/^<(img|input|br|hr|link|meta|param|embed|source|col)/i)) {
        indent++;
      }
      return indented;
    })
    .filter(Boolean)
    .join('\n');
}

// API Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Extract Source Code
app.post('/api/extract', async (req, res) => {
  try {
    let { url, fetchExternalCss = true, fetchExternalJs = true } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL wajib diisi' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Format URL tidak valid. Gunakan format seperti https://example.com' });
    }

    // Fetch main page
    let pageRes: Response;
    try {
      pageRes = await fetchWithTimeout(parsedUrl.href, 12000);
    } catch (err: any) {
      return res.status(500).json({ 
        error: `Gagal mengakses website: ${err.message || 'Koneksi Waktu Habis (Timeout) atau URL tidak dapat dijangkau'}` 
      });
    }

    if (!pageRes.ok) {
      return res.status(pageRes.status).json({
        error: `Website mengembalikan kode status HTTP ${pageRes.status} ${pageRes.statusText}`
      });
    }

    const htmlContent = await pageRes.text();
    const $ = cheerio.load(htmlContent);

    // Extract Meta & Basic Info
    const title = $('title').text().trim() || parsedUrl.hostname;
    
    let favicon = $('link[rel*="icon"]').attr('href');
    if (favicon) {
      favicon = resolveUrl(favicon, parsedUrl.href);
    } else {
      favicon = `${parsedUrl.origin}/favicon.ico`;
    }

    // Extract Assets
    const images: { src: string; alt: string; filename: string }[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        const fullSrc = resolveUrl(src, parsedUrl.href);
        const filename = fullSrc.split('/').pop()?.split('?')[0] || 'image.png';
        images.push({
          src: fullSrc,
          alt: $(el).attr('alt') || '',
          filename
        });
      }
    });

    const links: { href: string; text: string }[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('javascript:')) {
        links.push({
          href: resolveUrl(href, parsedUrl.href),
          text: $(el).text().trim().substring(0, 50) || href
        });
      }
    });

    const meta: { name?: string; property?: string; content?: string }[] = [];
    $('meta').each((_, el) => {
      const name = $(el).attr('name');
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if ((name || property) && content) {
        meta.push({ name, property, content });
      }
    });

    // Extract Styles
    const inlineStyles: string[] = [];
    $('style').each((_, el) => {
      const text = $(el).text().trim();
      if (text) inlineStyles.push(text);
    });

    const externalCssFiles: { url: string; filename: string; content: string; size: number; error?: string }[] = [];
    const cssLinks: string[] = [];
    
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        cssLinks.push(resolveUrl(href, parsedUrl.href));
      }
    });

    if (fetchExternalCss) {
      // Limit to max 10 stylesheets to prevent overload
      const toFetch = cssLinks.slice(0, 10);
      for (const cssUrl of toFetch) {
        const filename = cssUrl.split('/').pop()?.split('?')[0] || 'style.css';
        try {
          const cssRes = await fetchWithTimeout(cssUrl, 5000);
          if (cssRes.ok) {
            const cssText = await cssRes.text();
            externalCssFiles.push({
              url: cssUrl,
              filename,
              content: cssText,
              size: Buffer.byteLength(cssText, 'utf8')
            });
          } else {
            externalCssFiles.push({
              url: cssUrl,
              filename,
              content: `/* Failed to fetch CSS (${cssRes.status}) */`,
              size: 0,
              error: `HTTP ${cssRes.status}`
            });
          }
        } catch (err: any) {
          externalCssFiles.push({
            url: cssUrl,
            filename,
            content: `/* Error loading CSS: ${err.message} */`,
            size: 0,
            error: err.message
          });
        }
      }
    }

    // Extract Scripts
    const inlineScripts: string[] = [];
    $('script:not([src])').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !text.includes('JSON.parse') && text.length > 5) {
        inlineScripts.push(text);
      }
    });

    const externalJsFiles: { url: string; filename: string; content: string; size: number; error?: string }[] = [];
    const jsSrcs: string[] = [];

    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        jsSrcs.push(resolveUrl(src, parsedUrl.href));
      }
    });

    if (fetchExternalJs) {
      // Fetch up to 10 JS files
      const toFetchJs = jsSrcs.slice(0, 10);
      for (const jsUrl of toFetchJs) {
        const filename = jsUrl.split('/').pop()?.split('?')[0] || 'script.js';
        try {
          const jsRes = await fetchWithTimeout(jsUrl, 5000);
          if (jsRes.ok) {
            const jsText = await jsRes.text();
            externalJsFiles.push({
              url: jsUrl,
              filename,
              content: jsText,
              size: Buffer.byteLength(jsText, 'utf8')
            });
          } else {
            externalJsFiles.push({
              url: jsUrl,
              filename,
              content: `// Failed to fetch JS (${jsRes.status})`,
              size: 0,
              error: `HTTP ${jsRes.status}`
            });
          }
        } catch (err: any) {
          externalJsFiles.push({
            url: jsUrl,
            filename,
            content: `// Error loading JS: ${err.message}`,
            size: 0,
            error: err.message
          });
        }
      }
    }

    // Combine CSS
    let combinedCss = `/* ==========================================\n   EXTRACTED CSS FROM: ${parsedUrl.href}\n   ========================================== */\n\n`;
    if (inlineStyles.length > 0) {
      combinedCss += `/* --- INLINE STYLES (${inlineStyles.length}) --- */\n` + inlineStyles.join('\n\n') + '\n\n';
    }
    if (externalCssFiles.length > 0) {
      externalCssFiles.forEach(file => {
        combinedCss += `/* --- EXTERNAL CSS: ${file.filename} (${file.url}) --- */\n${file.content}\n\n`;
      });
    }

    // Combine JS
    let combinedJs = `/* ==========================================\n   EXTRACTED JS FROM: ${parsedUrl.href}\n   ========================================== */\n\n`;
    if (inlineScripts.length > 0) {
      combinedJs += `// --- INLINE SCRIPTS (${inlineScripts.length}) ---\n` + inlineScripts.join('\n\n') + '\n\n';
    }
    if (externalJsFiles.length > 0) {
      externalJsFiles.forEach(file => {
        combinedJs += `// --- EXTERNAL SCRIPT: ${file.filename} (${file.url}) ---\n${file.content}\n\n`;
      });
    }

    // Format HTML Body / Document
    const formattedHtml = formatHtml(htmlContent);

    const domElementsCount = $('*').length;
    const totalBytes = Buffer.byteLength(htmlContent, 'utf8') + 
      Buffer.byteLength(combinedCss, 'utf8') + 
      Buffer.byteLength(combinedJs, 'utf8');

    res.json({
      url: parsedUrl.href,
      title,
      favicon,
      statusCode: pageRes.status,
      extractedAt: new Date().toISOString(),
      totalSize: totalBytes,
      html: formattedHtml,
      combinedCss,
      combinedJs,
      cssFiles: externalCssFiles,
      jsFiles: externalJsFiles,
      assets: {
        images,
        links: links.slice(0, 50),
        meta
      },
      stats: {
        domElementsCount,
        inlineStyleCount: inlineStyles.length,
        externalStyleCount: cssLinks.length,
        inlineScriptCount: inlineScripts.length,
        externalScriptCount: jsSrcs.length,
        imageCount: images.length
      }
    });

  } catch (err: any) {
    console.error('Extraction error:', err);
    res.status(500).json({ error: err.message || 'Terjadi kesalahan sistem saat mengekstrak website.' });
  }
});

// Setup Vite Development or Production Server
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server MaxSource berjalan pada http://localhost:${PORT}`);
  });
}

setupServer();
