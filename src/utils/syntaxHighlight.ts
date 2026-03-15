/**
 * Simple syntax highlighting for config previews
 * No external dependencies - pure regex-based highlighting
 */

export type Language = 'yaml' | 'json' | 'javascript' | 'bash';

// interface Token {
//   type: string;
//   content: string;
// }

const TOKEN_TYPES: Record<string, string> = {
  keyword: 'color: #ff7b72;',
  string: 'color: #a5d6ff;',
  number: 'color: #79c0ff;',
  comment: 'color: #8b949e; font-style: italic;',
  operator: 'color: #ff7b72;',
  punctuation: 'color: #c9d1d9;',
  property: 'color: #7ee787;',
  function: 'color: #d2a8ff;',
};

/**
 * Highlight YAML code
 */
function highlightYAML(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Comments
    .replace(/(#.*$)/gm, `<span style="${  TOKEN_TYPES.comment  }">$1</span>`)
    // Keys (before colon)
    .replace(/^(\s*)([a-zA-Z_-][a-zA-Z0-9_-]*)(:)/gm, 
      `$1<span style="${  TOKEN_TYPES.property  }">$2</span><span style="${  TOKEN_TYPES.punctuation  }">$3</span>`)
    // Strings
    .replace(/(".*?"|'.*?')/g, `<span style="${  TOKEN_TYPES.string  }">$1</span>`)
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, `<span style="${  TOKEN_TYPES.number  }">$1</span>`)
    // Booleans
    .replace(/\b(true|false|yes|no)\b/g, `<span style="${  TOKEN_TYPES.keyword  }">$1</span>`)
    // Environment variables
    .replace(/(\$\{\{[^}]+\}\}|\$\w+|\$\{[^}]+\})/g, 
      `<span style="${  TOKEN_TYPES.function  }">$1</span>`)
}

/**
 * Highlight JSON code
 */
function highlightJSON(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Keys
    .replace(/(".*?")(\s*:)/g, `<span style="${  TOKEN_TYPES.property  }">$1</span><span style="${  TOKEN_TYPES.punctuation  }">$2</span>`)
    // Strings
    .replace(/: (".*?")/g, `: <span style="${  TOKEN_TYPES.string  }">$1</span>`)
    // Numbers
    .replace(/: (\d+\.?\d*)/g, `: <span style="${  TOKEN_TYPES.number  }">$1</span>`)
    // Booleans and null
    .replace(/: (true|false|null)/g, `: <span style="${  TOKEN_TYPES.keyword  }">$1</span>`)
    // Brackets and braces
    .replace(/([{}[\],])/g, `<span style="${  TOKEN_TYPES.punctuation  }">$1</span>`);
}

/**
 * Highlight JavaScript code
 */
function highlightJavaScript(code: string): string {
  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'if', 'else', 
    'for', 'while', 'return', 'import', 'export', 'from', 'default', 'class', 'extends',
    'try', 'catch', 'throw', 'new', 'typeof', 'instanceof', 'switch', 'case', 'break'];
  
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Comments
  result = result.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, 
    `<span style="${  TOKEN_TYPES.comment  }">$1</span>`);
  
  // Keywords
  const keywordRegex = new RegExp(`\\b(${  keywords.join('|')  })\\b`, 'g');
  result = result.replace(keywordRegex, `<span style="${  TOKEN_TYPES.keyword  }">$1</span>`);
  
  // Strings
  result = result.replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, `<span style="${  TOKEN_TYPES.string  }">$1</span>`);
  
  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, `<span style="${  TOKEN_TYPES.number  }">$1</span>`);
  
  // Functions
  result = result.replace(/(\w+)(\s*\()/g, `<span style="${  TOKEN_TYPES.function  }">$1</span>$2`);
  
  // Template literals (interpolated expressions)
  result = result.replace(/(\$\{[^}]+\})/g, `<span style="${  TOKEN_TYPES.function  }">$1</span>`);
  
  return result;
}

/**
 * Highlight Bash code
 */
function highlightBash(code: string): string {
  const keywords = ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 
    'case', 'esac', 'function', 'return', 'exit', 'export', 'source', 'echo'];
  
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Comments
  result = result.replace(/(#.*$)/gm, `<span style="${  TOKEN_TYPES.comment  }">$1</span>`);
  
  // Keywords
  const keywordRegex = new RegExp(`\\b(${  keywords.join('|')  })\\b`, 'g');
  result = result.replace(keywordRegex, `<span style="${  TOKEN_TYPES.keyword  }">$1</span>`);
  
  // Strings
  result = result.replace(/(".*?"|'.*?')/g, `<span style="${  TOKEN_TYPES.string  }">$1</span>`);
  
  // Variables
  result = result.replace(/(\$\w+|\$\{[^}]+\})/g, `<span style="${  TOKEN_TYPES.function  }">$1</span>`);
  
  // Commands (first word on line or after pipe)
  result = result.replace(/^(\s*)([a-zA-Z_-]+)/gm, `$1<span style="${  TOKEN_TYPES.function  }">$2</span>`);
  result = result.replace(/(\|)(\s*)([a-zA-Z_-]+)/g, `$1$2<span style="${  TOKEN_TYPES.function  }">$3</span>`);
  
  return result;
}

/**
 * Main highlight function
 * Alias: syntaxHighlight for backward compatibility
 */
export function highlightCode(code: string, language: Language): string {
  return syntaxHighlight(code, language);
}

/**
 * Syntax highlighting function (alias for highlightCode)
 */
export function syntaxHighlight(code: string, language: Language): string {
  switch (language) {
    case 'yaml':
      return highlightYAML(code);
    case 'json':
      return highlightJSON(code);
    case 'javascript':
      return highlightJavaScript(code);
    case 'bash':
      return highlightBash(code);
    default:
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
  }
}

/**
 * Create a highlighted code block HTML
 */
export function createCodeBlock(code: string, language: Language): string {
  const highlighted = highlightCode(code, language);
  
  return `<pre style="
    margin: 0;
    padding: 16px;
    background: #161b22;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #c9d1d9;
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
