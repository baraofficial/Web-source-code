import beautify from 'js-beautify';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

export function formatCode(code: string, type: 'html' | 'css' | 'javascript'): string {
  if (!code || !code.trim()) return code;
  try {
    if (type === 'html') {
      return beautify.html(code, {
        indent_size: 2,
        indent_char: ' ',
        max_preserve_newlines: 1,
        preserve_newlines: true,
        indent_inner_html: true,
        wrap_line_length: 0,
        extra_liners: []
      });
    } else if (type === 'css') {
      return beautify.css(code, {
        indent_size: 2,
        indent_char: ' ',
        max_preserve_newlines: 1,
        preserve_newlines: true
      });
    } else if (type === 'javascript') {
      return beautify.js(code, {
        indent_size: 2,
        indent_char: ' ',
        max_preserve_newlines: 1,
        preserve_newlines: true
      });
    }
  } catch (err) {
    console.error('Error beautifying code:', err);
  }
  return code;
}

export function highlightCode(code: string, type: 'html' | 'css' | 'javascript'): string {
  const grammar = type === 'html' ? Prism.languages.markup : type === 'css' ? Prism.languages.css : Prism.languages.javascript;
  if (!grammar) return code;
  return Prism.highlight(code, grammar, type === 'html' ? 'markup' : type);
}
