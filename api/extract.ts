import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

const resolveUrl = (baseUrl: string, relativeUrl: string) => {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (e) {
    return relativeUrl;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url, fetchExternalCss = true, fetchExternalJs = true } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL harus diisi' });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Gagal memuat halaman: Status ${response.status} ${response.statusText}` });
    }

    const htmlContent = await response.text();
    const $ = cheerio.load(htmlContent);

    const extractedSource = {
      url: targetUrl,
      title: $('title').text() || 'Tanpa Judul',
      favicon: '',
      statusCode: response.status,
      extractedAt: new Date().toISOString(),
      html: htmlContent,
      combinedCss: '',
      combinedJs: '',
      cssFiles: [] as any[],
      jsFiles: [] as any[],
      assets: {
        images: [] as any[],
        links: [] as any[],
        meta: [] as any[]
      },
      stats: {
        domElementsCount: $('*').length,
        inlineStyleCount: $('style').length,
        externalStyleCount: 0,
        inlineScriptCount: $('script:not([src])').length,
        externalScriptCount: 0,
        imageCount: 0
      },
      totalSize: Buffer.byteLength(htmlContent, 'utf8')
    };

    const faviconHref = $('link[rel="icon"], link[rel="shortcut icon"]').first().attr('href');
    if (faviconHref) {
      extractedSource.favicon = resolveUrl(targetUrl, faviconHref);
    } else {
      extractedSource.favicon = resolveUrl(targetUrl, '/favicon.ico');
    }

    $('meta').each((_, el) => {
      extractedSource.assets.meta.push({
        name: $(el).attr('name') || '',
        property: $(el).attr('property') || '',
        content: $(el).attr('content') || ''
      });
    });

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        extractedSource.assets.links.push({
          href: resolveUrl(targetUrl, href),
          text: $(el).text().trim() || 'Link'
        });
      }
    });

    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        const absoluteUrl = resolveUrl(targetUrl, src);
        const filename = absoluteUrl.split('/').pop()?.split('?')[0] || 'image.jpg';
        extractedSource.assets.images.push({
          src: absoluteUrl,
          alt: $(el).attr('alt') || '',
          filename
        });
      }
    });
    extractedSource.stats.imageCount = extractedSource.assets.images.length;

    let combinedCssString = '';
    $('style').each((_, el) => {
      const cssText = $(el).html() || '';
      if (cssText.trim()) {
        combinedCssString += `/* Inline Style */\n${cssText}\n\n`;
      }
    });

    const cssLinks = $('link[rel="stylesheet"]');
    extractedSource.stats.externalStyleCount = cssLinks.length;

    if (fetchExternalCss && cssLinks.length > 0) {
      const cssPromises = cssLinks.map(async (idx, el) => {
        const href = $(el).attr('href');
        if (href) {
          const absoluteCssUrl = resolveUrl(targetUrl, href);
          try {
            const cssRes = await fetch(absoluteCssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (cssRes.ok) {
              const cssContent = await cssRes.text();
              const size = Buffer.byteLength(cssContent, 'utf8');
              let filename = href.split('/').pop()?.split('?')[0];
              if (!filename || !filename.endsWith('.css')) filename = `style-${idx + 1}.css`;
              return { filename, url: absoluteCssUrl, content: cssContent, size };
            }
          } catch (e) {
            console.error(`Failed to fetch CSS: ${absoluteCssUrl}`);
          }
        }
        return null;
      }).get();

      const fetchedCss = (await Promise.all(cssPromises)).filter(Boolean) as any[];
      
      fetchedCss.forEach((cssFile, idx) => {
        const isDuplicate = fetchedCss.some((f, i) => i !== idx && f.filename === cssFile.filename);
        if (isDuplicate) {
          cssFile.filename = cssFile.filename.replace('.css', `-${idx}.css`);
        }

        extractedSource.cssFiles.push(cssFile);
        extractedSource.totalSize += cssFile.size;
        combinedCssString += `/* Source: ${cssFile.url} */\n${cssFile.content}\n\n`;
        $(`link[href="${cssFile.url.replace(targetUrl, '')}"]`).attr('href', `css/${cssFile.filename}`);
        $(`link[href="${cssFile.url}"]`).attr('href', `css/${cssFile.filename}`);
      });
    }
    extractedSource.combinedCss = combinedCssString;

    let combinedJsString = '';
    $('script:not([src])').each((_, el) => {
      const jsText = $(el).html() || '';
      if (jsText.trim()) {
        combinedJsString += `/* Inline Script */\n${jsText}\n\n`;
      }
    });

    const scriptTags = $('script[src]');
    extractedSource.stats.externalScriptCount = scriptTags.length;

    if (fetchExternalJs && scriptTags.length > 0) {
      const jsPromises = scriptTags.map(async (idx, el) => {
        const src = $(el).attr('src');
        if (src) {
          const absoluteJsUrl = resolveUrl(targetUrl, src);
          try {
            const jsRes = await fetch(absoluteJsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (jsRes.ok) {
              const jsContent = await jsRes.text();
              const size = Buffer.byteLength(jsContent, 'utf8');
              let filename = src.split('/').pop()?.split('?')[0];
              if (!filename || !filename.endsWith('.js')) filename = `script-${idx + 1}.js`;
              return { filename, url: absoluteJsUrl, content: jsContent, size };
            }
          } catch (e) {
            console.error(`Failed to fetch JS: ${absoluteJsUrl}`);
          }
        }
        return null;
      }).get();

      const fetchedJs = (await Promise.all(jsPromises)).filter(Boolean) as any[];

      fetchedJs.forEach((jsFile, idx) => {
        const isDuplicate = fetchedJs.some((f, i) => i !== idx && f.filename === jsFile.filename);
        if (isDuplicate) {
          jsFile.filename = jsFile.filename.replace('.js', `-${idx}.js`);
        }

        extractedSource.jsFiles.push(jsFile);
        extractedSource.totalSize += jsFile.size;
        combinedJsString += `/* Source: ${jsFile.url} */\n${jsFile.content}\n\n`;
        $(`script[src="${jsFile.url.replace(targetUrl, '')}"]`).attr('src', `js/${jsFile.filename}`);
        $(`script[src="${jsFile.url}"]`).attr('src', `js/${jsFile.filename}`);
      });
    }
    extractedSource.combinedJs = combinedJsString;

    if ($('base').length === 0) {
      $('head').prepend(`<base href="${targetUrl}">`);
    }
    extractedSource.html = $.html();

    return res.status(200).json(extractedSource);

  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan saat memproses URL' });
  }
}
