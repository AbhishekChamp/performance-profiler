import type { SecurityAnalysis, SecurityVulnerability } from '@/types';

// Patterns for security detection
const XSS_PATTERNS = [
  { pattern: /innerHTML\s*=/, name: 'innerHTML assignment' },
  { pattern: /outerHTML\s*=/, name: 'outerHTML assignment' },
  { pattern: /document\.write\s*\(/, name: 'document.write' },
  { pattern: /document\.writeln\s*\(/, name: 'document.writeln' },
  { pattern: /dangerouslySetInnerHTML\s*=/, name: 'React dangerouslySetInnerHTML' },
  { pattern: /\.html\s*\([^)]*\+/, name: 'jQuery html() with concatenation' },
];

const EVAL_PATTERNS = [
  { pattern: /eval\s*\(/, name: 'eval()' },
  { pattern: /new\s+Function\s*\(/, name: 'new Function()' },
  { pattern: /setTimeout\s*\(\s*["']/, name: 'setTimeout with string' },
  { pattern: /setInterval\s*\(\s*["']/, name: 'setInterval with string' },
];

const SECRET_PATTERNS = [
  { pattern: /api[_-]?key["']?\s*[:=]\s*["'][^"']{16,}["']/i, name: 'API Key' },
  { pattern: /api[_-]?secret["']?\s*[:=]\s*["'][^"']{16,}["']/i, name: 'API Secret' },
  { pattern: /password["']?\s*[:=]\s*["'][^"']{8,}["']/i, name: 'Hardcoded password' },
  { pattern: /token["']?\s*[:=]\s*["'][^"']{16,}["']/i, name: 'Token' },
  { pattern: /auth[_-]?token["']?\s*[:=]\s*["'][^"']{16,}["']/i, name: 'Auth Token' },
  { pattern: /private[_-]?key["']?\s*[:=]\s*["'][^"']{20,}["']/i, name: 'Private Key' },
  { pattern: /secret[_-]?key["']?\s*[:=]\s*["'][^"']{16,}["']/i, name: 'Secret Key' },
  { pattern: /aws[_-]?access[_-]?key["']?\s*[:=]\s*["'][^"']{16,}["']/i, name: 'AWS Access Key' },
  { pattern: /aws[_-]?secret["']?\s*[:=]\s*["'][^"']{16,}["']/i, name: 'AWS Secret' },
];

const HTTP_PATTERNS = [
  { pattern: /http:\/\/[^"'\s]+/g, name: 'HTTP URL' },
];

export function analyzeSecurity(
  files: { name: string; content: string }[],
  htmlContent?: string
): SecurityAnalysis {
  const vulnerabilities: SecurityVulnerability[] = [];

  // Analyze all files
  for (const file of files) {
    const lines = file.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comments for some checks
      const codeOnly = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//, '');

      // Check for XSS vulnerabilities
      for (const { pattern, name } of XSS_PATTERNS) {
        if (pattern.test(codeOnly)) {
          vulnerabilities.push({
            type: 'xss',
            file: file.name,
            line: lineNum,
            severity: 'high',
            message: `Potential XSS vulnerability: ${name}`,
            code: line.trim(),
            fix: 'Use textContent instead of innerHTML, or sanitize HTML before insertion',
          });
        }
      }

      // Check for eval and similar
      for (const { pattern, name } of EVAL_PATTERNS) {
        if (pattern.test(codeOnly)) {
          vulnerabilities.push({
            type: 'eval',
            file: file.name,
            line: lineNum,
            severity: 'critical',
            message: `Dangerous code execution: ${name}`,
            code: line.trim(),
            fix: 'Avoid using eval() or new Function(). Use safer alternatives like JSON.parse()',
          });
        }
      }

      // Check for hardcoded secrets
      for (const { pattern, name } of SECRET_PATTERNS) {
        // Reset lastIndex for global regex
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          vulnerabilities.push({
            type: 'hardcoded-secret',
            file: file.name,
            line: lineNum,
            severity: 'critical',
            message: `Potential hardcoded secret: ${name}`,
            code: line.trim().replace(/["'][^"']{10,}["']/g, '"***REDACTED***"'),
            fix: 'Use environment variables or a secure secret management system',
          });
        }
      }

      // Check for HTTP URLs (mixed content)
      for (const { pattern, name } of HTTP_PATTERNS) {
        pattern.lastIndex = 0;
        const matches = line.match(pattern);
        if (matches && !line.includes('localhost') && !line.includes('127.0.0.1')) {
          for (const _match of matches) {
            void _match; // Acknowledge match but we only need count
            vulnerabilities.push({
              type: 'mixed-content',
              file: file.name,
              line: lineNum,
              severity: 'medium',
              message: `Mixed content: ${name} found`,
              code: line.trim(),
              fix: 'Use HTTPS URLs instead of HTTP',
            });
          }
        }
      }
    }
  }

  // Analyze HTML for inline scripts and missing SRI
  if (htmlContent != null && htmlContent !== '') {
    // Check for inline scripts (CSP concern)
    const inlineScriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = inlineScriptRegex.exec(htmlContent)) !== null) {
      const scriptContent = match[1].trim();
      const hasSrc = /<script[^>]*src=/i.test(match[0]);

      if (scriptContent !== '' && !hasSrc) {
        vulnerabilities.push({
          type: 'inline-script',
          file: 'index.html',
          line: 0,
          severity: 'medium',
          message: 'Inline script detected (CSP concern)',
          code: `<script>${scriptContent.slice(0, 50)}${scriptContent.length > 50 ? '...' : ''}</script>`,
          fix: 'Move inline scripts to external files and use nonces or hashes in CSP',
        });
      }
    }

    // Check for inline event handlers
    const inlineEventRegex = /\s(on\w+)=["'][^"']*["']/gi;
    const eventMatches = htmlContent.match(inlineEventRegex);
    if (eventMatches) {
      for (const event of eventMatches.slice(0, 5)) { // Limit to first 5
        vulnerabilities.push({
          type: 'inline-script',
          file: 'index.html',
          line: 0,
          severity: 'medium',
          message: `Inline event handler: ${event.trim().split('=')[0]}`,
          code: event.trim(),
          fix: 'Use addEventListener instead of inline event handlers',
        });
      }
    }

    // Check for external resources without SRI
    const externalScriptRegex = /<script[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    while ((match = externalScriptRegex.exec(htmlContent)) !== null) {
      const src = match[1];
      const hasIntegrity = /integrity=["'][^"']+["']/i.test(match[0]);

      if (!hasIntegrity && !src.includes('localhost') && !src.includes('127.0.0.1')) {
        vulnerabilities.push({
          type: 'missing-sri',
          file: 'index.html',
          line: 0,
          severity: 'medium',
          message: `External script without Subresource Integrity: ${src.slice(0, 50)}...`,
          code: match[0],
          fix: 'Add integrity attribute with SHA hash and crossorigin="anonymous"',
        });
      }
    }

    const externalStyleRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    while ((match = externalStyleRegex.exec(htmlContent)) !== null) {
      const href = match[1];
      const hasIntegrity = /integrity=["'][^"']+["']/i.test(match[0]);

      if (!hasIntegrity && !href.includes('localhost') && !href.includes('127.0.0.1')) {
        vulnerabilities.push({
          type: 'missing-sri',
          file: 'index.html',
          line: 0,
          severity: 'medium',
          message: `External stylesheet without Subresource Integrity: ${href.slice(0, 50)}...`,
          code: match[0],
          fix: 'Add integrity attribute with SHA hash',
        });
      }
    }

    // Check for target="_blank" without rel="noopener"
    const blankTargetRegex = /<a[^>]*target=["']_blank["'][^>]*>/gi;
    while ((match = blankTargetRegex.exec(htmlContent)) !== null) {
      const hasNoopener = /rel=["'][^"']*noopener[^"']*["']/i.test(match[0]);
      const hasNoreferrer = /rel=["'][^"']*noreferrer[^"']*["']/i.test(match[0]);

      if (!hasNoopener && !hasNoreferrer) {
        vulnerabilities.push({
          type: 'xss',
          file: 'index.html',
          line: 0,
          severity: 'medium',
          message: 'Links with target="_blank" without rel="noopener"',
          code: match[0],
          fix: 'Add rel="noopener noreferrer" to prevent tabnabbing',
        });
      }
    }
  }

  // Calculate statistics
  const stats = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
  };

  // Generate recommendations
  const recommendations: string[] = [];

  if (stats.critical > 0) {
    recommendations.push(`Address ${stats.critical} critical security vulnerabilities immediately`);
  }

  if (stats.high > 0) {
    recommendations.push(`Fix ${stats.high} high-severity XSS or injection vulnerabilities`);
  }

  if (vulnerabilities.some(v => v.type === 'hardcoded-secret')) {
    recommendations.push('Remove all hardcoded secrets and use environment variables');
  }

  if (vulnerabilities.some(v => v.type === 'missing-sri')) {
    recommendations.push('Add Subresource Integrity (SRI) hashes to all external resources');
  }

  if (vulnerabilities.some(v => v.type === 'inline-script')) {
    recommendations.push('Implement Content Security Policy (CSP) to mitigate inline script risks');
  }

  if (vulnerabilities.some(v => v.type === 'mixed-content')) {
    recommendations.push('Update all HTTP URLs to HTTPS to prevent mixed content warnings');
  }

  if (recommendations.length === 0) {
    recommendations.push('No major security issues detected. Continue following security best practices.');
  }

  // Calculate score
  let score = 100;
  score -= stats.critical * 25;
  score -= stats.high * 15;
  score -= stats.medium * 5;
  score -= stats.low * 2;

  return {
    score: Math.max(0, Math.min(100, score)),
    vulnerabilities: vulnerabilities.slice(0, 100), // Limit to prevent overwhelming UI
    stats,
    recommendations,
  };
}
