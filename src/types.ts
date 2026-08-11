export interface ExternalResource {
  url: string;
  filename: string;
  content: string;
  size: number;
  error?: string;
}

export interface WebAssets {
  images: { src: string; alt: string; filename: string }[];
  links: { href: string; text: string }[];
  meta: { name?: string; property?: string; content?: string }[];
}

export interface ExtractedSource {
  url: string;
  title: string;
  favicon?: string;
  statusCode: number;
  extractedAt: string;
  totalSize: number;
  
  // Cleaned & combined code
  html: string;
  combinedCss: string;
  combinedJs: string;
  
  // Individual external resources
  cssFiles: ExternalResource[];
  jsFiles: ExternalResource[];
  
  // Extra metadata
  assets: WebAssets;
  stats: {
    domElementsCount: number;
    inlineStyleCount: number;
    externalStyleCount: number;
    inlineScriptCount: number;
    externalScriptCount: number;
    imageCount: number;
  };
}

export interface AiAnalysisResult {
  summary: string;
  techStack: string[];
  structureBreakdown: string[];
  recommendations: string[];
  securityNote?: string;
}
