import type { AccessibilityAnalysis, A11yViolation } from '@/types';

export function analyzeAccessibility(htmlContent: string): AccessibilityAnalysis {
  const violations: A11yViolation[] = [];
  const passed: string[] = [];

  if (!htmlContent) {
    return {
      score: 0,
      violations: [],
      passed: [],
      wcagLevel: 'A',
      stats: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
    };
  }

  // 1. Check for lang attribute on html element
  const hasLang = /<html[^>]*lang=["'][^"']+["'][^>]*>/i.test(htmlContent);
  if (!hasLang) {
    violations.push({
      rule: 'html-has-lang',
      element: '<html>',
      severity: 'serious',
      message: 'HTML element is missing a lang attribute',
      wcagLevel: 'A',
      fix: '<html lang="en"> or appropriate language code',
    });
  } else {
    passed.push('HTML has lang attribute');
  }

  // 2. Check for title element
  const hasTitle = /<title>[^<]*<\/title>/i.test(htmlContent);
  if (!hasTitle) {
    violations.push({
      rule: 'document-title',
      element: '<title>',
      severity: 'serious',
      message: 'Document is missing a title element',
      wcagLevel: 'A',
      fix: '<title>Descriptive Page Title</title>',
    });
  } else {
    passed.push('Document has title element');
  }

  // 3. Check for meta viewport
  const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(htmlContent);
  if (!hasViewport) {
    violations.push({
      rule: 'meta-viewport',
      element: '<meta>',
      severity: 'critical',
      message: 'Missing viewport meta tag for mobile accessibility',
      wcagLevel: 'AA',
      fix: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    });
  } else {
    passed.push('Viewport meta tag is present');
  }

  // 4. Check images for alt text
  const imgRegex = /<img[^>]*>/gi;
  let match: RegExpExecArray | null;
  let imgCount = 0;
  let imgWithAlt = 0;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    imgCount++;
    const hasAlt = /alt=["'][^"']*["']/i.test(match[0]);
    const isDecorative = /alt=[""]/i.test(match[0]);

    if (!hasAlt) {
      const srcMatch = match[0].match(/src=["']([^"']+)["']/i);
      violations.push({
        rule: 'image-alt',
        element: `<img src="${srcMatch?.[1] || '...'}">`,
        severity: 'critical',
        message: 'Image is missing alt text',
        wcagLevel: 'A',
        fix: 'Add alt="Descriptive text" for meaningful images or alt="" for decorative images',
        code: match[0],
      });
    } else if (!isDecorative) {
      imgWithAlt++;
    }
  }

  if (imgCount > 0 && imgWithAlt > 0) {
    passed.push(`${imgWithAlt} of ${imgCount} images have alt text`);
  }

  // 5. Check heading hierarchy
  const h1Regex = /<h1[^>]*>/gi;
  const h1Count = (htmlContent.match(h1Regex) || []).length;

  if (h1Count === 0) {
    violations.push({
      rule: 'page-has-heading-one',
      element: '<h1>',
      severity: 'moderate',
      message: 'Page is missing a level 1 heading',
      wcagLevel: 'A',
      fix: '<h1>Main Page Title</h1>',
    });
  } else if (h1Count > 1) {
    violations.push({
      rule: 'page-has-one-heading-one',
      element: '<h1>',
      severity: 'moderate',
      message: `Page has ${h1Count} h1 elements (should have exactly one)`,
      wcagLevel: 'A',
      fix: 'Use only one <h1> per page, use <h2>-<h6> for subsections',
    });
  } else {
    passed.push('Page has exactly one h1 element');
  }

  // Check for skipped heading levels
  const headingRegex = /<h([1-6])[^>]*>/gi;
  const headings: number[] = [];
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    headings.push(parseInt(match[1], 10));
  }

  let skippedLevels = false;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      skippedLevels = true;
      break;
    }
  }

  if (skippedLevels) {
    violations.push({
      rule: 'heading-order',
      element: '<h1>-<h6>',
      severity: 'moderate',
      message: 'Heading levels are not properly nested (skipped levels)',
      wcagLevel: 'A',
      fix: 'Ensure heading levels are sequential (h1 -> h2 -> h3)',
    });
  } else if (headings.length > 0) {
    passed.push('Heading hierarchy is properly nested');
  }

  // 6. Check for form labels
  const inputRegex = /<input[^>]*>/gi;
  let inputCount = 0;
  let labeledInputs = 0;

  while ((match = inputRegex.exec(htmlContent)) !== null) {
    const input = match[0];
    // Skip submit, button, hidden, image inputs
    const typeMatch = input.match(/type=["']([^"']+)["']/i);
    const type = typeMatch?.[1].toLowerCase();

    if (type === 'submit' || type === 'button' || type === 'hidden' || type === 'image') {
      continue;
    }

    inputCount++;

    const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(input);
    const hasAriaLabelledBy = /aria-labelledby=["'][^"']+["']/i.test(input);
    const hasPlaceholder = /placeholder=["'][^"']+["']/i.test(input);
    const idMatch = input.match(/id=["']([^"']+)["']/i);

    let hasLabel = false;
    if (idMatch) {
      const labelRegex = new RegExp(`<label[^>]*for=["']${idMatch[1]}["'][^>]*>`, 'i');
      hasLabel = labelRegex.test(htmlContent);
    }

    if (hasLabel || hasAriaLabel || hasAriaLabelledBy) {
      labeledInputs++;
    } else if (!hasPlaceholder) {
      violations.push({
        rule: 'label',
        element: `<input${type ? ` type="${type}"` : ''}>`,
        severity: 'critical',
        message: 'Form input is missing a label',
        wcagLevel: 'A',
        fix: 'Add a <label for="inputId"> or aria-label attribute',
      });
    }
  }

  if (inputCount > 0 && labeledInputs === inputCount) {
    passed.push('All form inputs have labels');
  }

  // 7. Check for links without discernible text
  const linkRegex = /<a[^>]*>[\s\S]*?<\/a>/gi;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const link = match[0];
    const textContent = link.replace(/<[^>]+>/g, '').trim();
    const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(link);
    const hasImgWithAlt = /<img[^>]*alt=["'][^"]+["'][^>]*>/i.test(link);

    if (!textContent && !hasAriaLabel && !hasImgWithAlt) {
      const hrefMatch = link.match(/href=["']([^"']+)["']/i);
      violations.push({
        rule: 'link-name',
        element: `<a href="${hrefMatch?.[1] || '#'}">`,
        severity: 'serious',
        message: 'Link does not have discernible text',
        wcagLevel: 'A',
        fix: 'Add text content, aria-label, or image with alt text inside the link',
      });
    }
  }

  // 8. Check for button text
  const buttonRegex = /<button[^>]*>[\s\S]*?<\/button>/gi;
  while ((match = buttonRegex.exec(htmlContent)) !== null) {
    const button = match[0];
    const textContent = button.replace(/<[^>]+>/g, '').trim();
    const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(button);

    if (!textContent && !hasAriaLabel) {
      violations.push({
        rule: 'button-name',
        element: '<button>',
        severity: 'critical',
        message: 'Button does not have an accessible name',
        wcagLevel: 'A',
        fix: 'Add text content or aria-label to the button',
      });
    }
  }

  // 9. Check for landmark regions
  const hasMain = /<main[^>]*>/i.test(htmlContent);
  const hasNav = /<nav[^>]*>/i.test(htmlContent);
  const hasHeader = /<header[^>]*>/i.test(htmlContent);
  const hasFooter = /<footer[^>]*>/i.test(htmlContent);
  const hasAside = /<aside[^>]*>/i.test(htmlContent);
  
  // Use landmark variables to avoid unused warnings
  void hasNav;
  void hasHeader;
  void hasFooter;
  void hasAside;

  if (!hasMain) {
    violations.push({
      rule: 'landmark-one-main',
      element: '<main>',
      severity: 'moderate',
      message: 'Page is missing a main landmark',
      wcagLevel: 'A',
      fix: '<main>Main content here</main>',
    });
  } else {
    passed.push('Page has main landmark');
  }

  // 10. Check for skip link
  const hasSkipLink = /<a[^>]*href=["']#(main|content)["'][^>]*>\s*(skip|jump)/i.test(htmlContent);
  if (!hasSkipLink && hasMain) {
    violations.push({
      rule: 'skip-link',
      element: '<a>',
      severity: 'moderate',
      message: 'Page is missing a skip navigation link',
      wcagLevel: 'AA',
      fix: '<a href="#main" class="skip-link">Skip to main content</a>',
    });
  } else if (hasSkipLink) {
    passed.push('Page has skip navigation link');
  }

  // Calculate WCAG level achieved
  let wcagLevel: 'A' | 'AA' | 'AAA' = 'AAA';
  const criticalAndSerious = violations.filter(v => v.severity === 'critical' || v.severity === 'serious');
  const criticalAA = violations.filter(v => (v.severity === 'critical' || v.severity === 'serious') && v.wcagLevel === 'AA');

  if (criticalAndSerious.length > 0) {
    wcagLevel = 'A';
  } else if (criticalAA.length > 0) {
    wcagLevel = 'AA';
  }

  // Calculate score
  const stats = {
    total: violations.length,
    critical: violations.filter(v => v.severity === 'critical').length,
    serious: violations.filter(v => v.severity === 'serious').length,
    moderate: violations.filter(v => v.severity === 'moderate').length,
    minor: violations.filter(v => v.severity === 'minor').length,
  };

  let score = 100;
  score -= stats.critical * 15;
  score -= stats.serious * 10;
  score -= stats.moderate * 5;
  score -= stats.minor * 2;
  score += passed.length * 2; // Bonus for passed checks

  return {
    score: Math.max(0, Math.min(100, score)),
    violations,
    passed: [...new Set(passed)],
    wcagLevel,
    stats,
  };
}
