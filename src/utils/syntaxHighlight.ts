/**
 * Simple syntax highlighting for config previews
 * Supports both light and dark themes via CSS variables
 */

export type Language = 'yaml' | 'json' | 'javascript' | 'bash';

// Token colors using CSS variables for theme support
const TOKEN_TYPES: Record<string, string> = {
  keyword: 'color: var(--sh-keyword, #d73a49);',
  string: 'color: var(--sh-string, #032f62);',
  number: 'color: var(--sh-number, #005cc5);',
  comment: 'color: var(--sh-comment, #6a737d); font-style: italic;',
  operator: 'color: var(--sh-operator, #d73a49);',
  punctuation: 'color: var(--sh-punctuation, #24292e);',
  property: 'color: var(--sh-property, #005cc5);',
  function: 'color: var(--sh-function, #6f42c1);',
};

// Dark theme fallback colors (GitHub dark)
const DARK_TOKEN_TYPES: Record<string, string> = {
  keyword: 'color: var(--sh-keyword-dark, #ff7b72);',
  string: 'color: var(--sh-string-dark, #a5d6ff);',
  number: 'color: var(--sh-number-dark, #79c0ff);',
  comment: 'color: var(--sh-comment-dark, #8b949e); font-style: italic;',
  operator: 'color: var(--sh-operator-dark, #ff7b72);',
  punctuation: 'color: var(--sh-punctuation-dark, #c9d1d9);',
  property: 'color: var(--sh-property-dark, #7ee787);',
  function: 'color: var(--sh-function-dark, #d2a8ff);',
};

/**
 * Highlight YAML code
 */
function highlightYAML(code: string, isDark: boolean): string {
  const tokens = isDark ? DARK_TOKEN_TYPES : TOKEN_TYPES;
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Comments
    .replace(/(#.*$)/gm, `<span style="${tokens.comment}">$1</span>`)
    // Keys (before colon)
    .replace(/^(\s*)([a-zA-Z_-][a-zA-Z0-9_-]*)(:)/gm, 
      `$1<span style="${tokens.property}">$2</span><span style="${tokens.punctuation}">$3</span>`)
    // Strings
    .replace(/(".*?"|'.*?')/g, `<span style="${tokens.string}">$1</span>`)
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, `<span style="${tokens.number}">$1</span>`)
    // Booleans
    .replace(/\b(true|false|yes|no)\b/g, `<span style="${tokens.keyword}">$1</span>`)
    // Environment variables
    .replace(/(\$\{\{[^}]+\}\}|\$\w+|\$\{[^}]+\})/g, 
      `<span style="${tokens.function}">$1</span>`)
}

/**
 * Highlight JSON code
 */
function highlightJSON(code: string, isDark: boolean): string {
  const tokens = isDark ? DARK_TOKEN_TYPES : TOKEN_TYPES;
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Keys
    .replace(/(".*?")(\s*:)/g, `<span style="${tokens.property}">$1</span><span style="${tokens.punctuation}">$2</span>`)
    // Strings
    .replace(/: (".*?")/g, `: <span style="${tokens.string}">$1</span>`)
    // Numbers
    .replace(/: (\d+\.?\d*)/g, `: <span style="${tokens.number}">$1</span>`)
    // Booleans and null
    .replace(/: (true|false|null)/g, `: <span style="${tokens.keyword}">$1</span>`)
    // Brackets and braces
    .replace(/([{}[\],])/g, `<span style="${tokens.punctuation}">$1</span>`);
}

/**
 * Highlight JavaScript code
 */
function highlightJavaScript(code: string, isDark: boolean): string {
  const tokens = isDark ? DARK_TOKEN_TYPES : TOKEN_TYPES;
  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'if', 'else', 
    'for', 'while', 'return', 'import', 'export', 'from', 'default', 'class', 'extends',
    'try', 'catch', 'throw', 'new', 'typeof', 'instanceof', 'switch', 'case', 'break'];
  
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Comments
  result = result.replace(/(\/.*$|\/\*[\s\S]*?\*\/)/gm, 
    `<span style="${tokens.comment}">$1</span>`);
  
  // Keywords
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  result = result.replace(keywordRegex, `<span style="${tokens.keyword}">$1</span>`);
  
  // Strings
  result = result.replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, `<span style="${tokens.string}">$1</span>`);
  
  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, `<span style="${tokens.number}">$1</span>`);
  
  // Functions
  result = result.replace(/(\w+)(\s*\()/g, `<span style="${tokens.function}">$1</span>$2`);
  
  // Template literals (interpolated expressions)
  result = result.replace(/(\$\{[^}]+\})/g, `<span style="${tokens.function}">$1</span>`);
  
  return result;
}

/**
 * Highlight Bash code
 */
function highlightBash(code: string, isDark: boolean): string {
  const tokens = isDark ? DARK_TOKEN_TYPES : TOKEN_TYPES;
  const keywords = ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 
    'case', 'esac', 'function', 'return', 'exit', 'export', 'source', 'echo'];
  
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Comments
  result = result.replace(/(#.*$)/gm, `<span style="${tokens.comment}">$1</span>`);
  
  // Keywords
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  result = result.replace(keywordRegex, `<span style="${tokens.keyword}">$1</span>`);
  
  // Strings
  result = result.replace(/(".*?"|'.*?')/g, `<span style="${tokens.string}">$1</span>`);
  
  // Variables
  result = result.replace(/(\$\w+|\$\{[^}]+\})/g, `<span style="${tokens.function}">$1</span>`);
  
  // Commands (first word on line or after pipe)
  result = result.replace(/^(\s*)([a-zA-Z_-]+)/gm, `$1<span style="${tokens.function}">$2</span>`);
  result = result.replace(/(\|)(\s*)([a-zA-Z_-]+)/g, `$1$2<span style="${tokens.function}">$3</span>`);
  
  return result;
}

/**
 * Main highlight function
 */
export function highlightCode(code: string, language: Language, isDark = true): string {
  switch (language) {
    case 'yaml':
      return highlightYAML(code, isDark);
    case 'json':
      return highlightJSON(code, isDark);
    case 'javascript':
      return highlightJavaScript(code, isDark);
    case 'bash':
      return highlightBash(code, isDark);
    default:
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
  }
}

/**
 * Syntax highlighting function (alias for highlightCode)
 */
export function syntaxHighlight(code: string, language: Language, isDark = true): string {
  return highlightCode(code, language, isDark);
}

/**
 * Create a highlighted code block HTML with theme support
 */
export function createCodeBlock(code: string, language: Language, isDark = true): string {
  const highlighted = highlightCode(code, language, isDark);
  
  const bgColor = isDark ? '#161b22' : '#f6f8fa';
  const textColor = isDark ? '#c9d1d9' : '#24292e';
  const borderColor = isDark ? '#30363d' : '#e1e4e8';
  
  return `<pre style="
    margin: 0;
    padding: 16px;
    background: ${bgColor};
    border: 1px solid ${borderColor};
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: ${textColor};
  "><code>${highlighted}</code></pre>`;
}

/**
 * Get language from filename extension
 */
export function getLanguageFromFilename(filename: string): Language {
  if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
    return 'yaml';
  }
  if (filename.endsWith('.json')) {
    return 'json';
  }
  if (filename.endsWith('.js') || filename.endsWith('.ts')) {
    return 'javascript';
  }
  if (filename.endsWith('.sh') || filename.includes('bash')) {
    return 'bash';
  }
  return 'yaml';
}
