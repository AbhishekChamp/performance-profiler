import { describe, expect, it } from 'vitest';
import { analyzeSecurity } from '../security';

describe('analyzeSecurity', () => {
  it('should detect eval usage', () => {
    const files = [
      {
        name: 'app.js',
        content: 'eval("console.log(\'test\')");',
        size: 100,
      },
    ];

    const result = analyzeSecurity(files);
    expect(result).toBeDefined();
    const evalVuln = result!.vulnerabilities.find(
      (v) => v.type === 'eval'
    );
    expect(evalVuln).toBeDefined();
  });

  it('should detect innerHTML usage', () => {
    const files = [
      {
        name: 'app.js',
        content: 'element.innerHTML = userInput;',
        size: 100,
      },
    ];

    const result = analyzeSecurity(files);
    expect(result).toBeDefined();
    const xssVuln = result!.vulnerabilities.find(
      (v) => v.type === 'xss'
    );
    expect(xssVuln).toBeDefined();
  });

  it('should detect hardcoded secrets', () => {
    const files = [
      {
        name: 'config.js',
        content: `
          const API_KEY = "sk-1234567890abcdef";
          const SECRET = "supersecret123";
        `,
        size: 200,
      },
    ];

    const result = analyzeSecurity(files);
    expect(result).toBeDefined();
    const secretVuln = result!.vulnerabilities.find(
      (v) => v.type === 'hardcoded-secret'
    );
    expect(secretVuln).toBeDefined();
  });

  it('should detect missing SRI in HTML', () => {
    const htmlContent = `
      <html>
        <head>
          <script src="https://example.com/script.js"></script>
          <link rel="stylesheet" href="https://example.com/style.css">
        </head>
      </html>
    `;

    const result = analyzeSecurity([], htmlContent);
    expect(result).toBeDefined();
    const sriVuln = result!.vulnerabilities.find(
      (v) => v.type === 'missing-sri'
    );
    expect(sriVuln).toBeDefined();
  });

  it('should calculate security score', () => {
    const files = [
      {
        name: 'app.js',
        content: 'console.log("Hello World");',
        size: 100,
      },
    ];

    const result = analyzeSecurity(files);
    expect(result).toBeDefined();
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(100);
  });

  it('should categorize vulnerabilities by severity', () => {
    const files = [
      {
        name: 'app.js',
        content: `
          eval(userInput);
          document.write(userInput);
        `,
        size: 200,
      },
    ];

    const result = analyzeSecurity(files);
    expect(result).toBeDefined();
    expect(result!.stats.critical).toBeGreaterThan(0);
  });

  it('should generate security recommendations', () => {
    const files = [
      {
        name: 'app.js',
        content: 'eval("test");',
        size: 100,
      },
    ];

    const result = analyzeSecurity(files);
    expect(result).toBeDefined();
    expect(result!.recommendations.length).toBeGreaterThan(0);
  });
});
