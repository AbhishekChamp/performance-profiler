import type { ThirdPartyAnalysis, ThirdPartyScript } from '@/types';

// Known third-party script database
const KNOWN_SCRIPTS: Record<string, {
  name: string;
  category: ThirdPartyScript['category'];
  estimatedSize: number;
  privacyImpact: ThirdPartyScript['privacyImpact'];
  alternatives?: string[];
}> = {
  'google-analytics': {
    name: 'Google Analytics',
    category: 'analytics',
    estimatedSize: 45000,
    privacyImpact: 'high',
    alternatives: ['Plausible', 'Fathom', 'SimpleAnalytics'],
  },
  'googletagmanager': {
    name: 'Google Tag Manager',
    category: 'analytics',
    estimatedSize: 110000,
    privacyImpact: 'high',
    alternatives: ['Matomo', 'Plausible'],
  },
  'gtm.js': {
    name: 'Google Tag Manager',
    category: 'analytics',
    estimatedSize: 110000,
    privacyImpact: 'high',
    alternatives: ['Matomo', 'Plausible'],
  },
  'gtag': {
    name: 'Google Analytics (gtag)',
    category: 'analytics',
    estimatedSize: 45000,
    privacyImpact: 'high',
    alternatives: ['Plausible', 'Fathom'],
  },
  'facebook': {
    name: 'Facebook Pixel',
    category: 'advertising',
    estimatedSize: 75000,
    privacyImpact: 'high',
    alternatives: ['None (privacy concern)'],
  },
  'connect.facebook': {
    name: 'Facebook SDK',
    category: 'social',
    estimatedSize: 120000,
    privacyImpact: 'high',
  },
  'twitter': {
    name: 'Twitter Widget',
    category: 'social',
    estimatedSize: 65000,
    privacyImpact: 'medium',
  },
  'platform.twitter': {
    name: 'Twitter Platform',
    category: 'social',
    estimatedSize: 80000,
    privacyImpact: 'medium',
  },
  'hotjar': {
    name: 'Hotjar',
    category: 'analytics',
    estimatedSize: 95000,
    privacyImpact: 'high',
    alternatives: ['Microsoft Clarity'],
  },
  'intercom': {
    name: 'Intercom',
    category: 'widget',
    estimatedSize: 150000,
    privacyImpact: 'medium',
  },
  'drift': {
    name: 'Drift',
    category: 'widget',
    estimatedSize: 140000,
    privacyImpact: 'medium',
  },
  'zendesk': {
    name: 'Zendesk',
    category: 'widget',
    estimatedSize: 180000,
    privacyImpact: 'low',
  },
  'crisp': {
    name: 'Crisp Chat',
    category: 'widget',
    estimatedSize: 85000,
    privacyImpact: 'low',
  },
  'segment': {
    name: 'Segment',
    category: 'analytics',
    estimatedSize: 60000,
    privacyImpact: 'high',
  },
  'mixpanel': {
    name: 'Mixpanel',
    category: 'analytics',
    estimatedSize: 55000,
    privacyImpact: 'medium',
  },
  'amplitude': {
    name: 'Amplitude',
    category: 'analytics',
    estimatedSize: 70000,
    privacyImpact: 'medium',
  },
  'sentry': {
    name: 'Sentry',
    category: 'analytics',
    estimatedSize: 40000,
    privacyImpact: 'low',
  },
  'logrocket': {
    name: 'LogRocket',
    category: 'analytics',
    estimatedSize: 90000,
    privacyImpact: 'high',
  },
  'fullstory': {
    name: 'FullStory',
    category: 'analytics',
    estimatedSize: 85000,
    privacyImpact: 'high',
  },
  'googlemaps': {
    name: 'Google Maps',
    category: 'widget',
    estimatedSize: 200000,
    privacyImpact: 'medium',
  },
  'maps.googleapis': {
    name: 'Google Maps API',
    category: 'widget',
    estimatedSize: 200000,
    privacyImpact: 'medium',
  },
  'recaptcha': {
    name: 'Google reCAPTCHA',
    category: 'widget',
    estimatedSize: 100000,
    privacyImpact: 'high',
    alternatives: ['hCaptcha', 'Cloudflare Turnstile'],
  },
  'stripe': {
    name: 'Stripe',
    category: 'widget',
    estimatedSize: 120000,
    privacyImpact: 'low',
  },
  'paypal': {
    name: 'PayPal',
    category: 'widget',
    estimatedSize: 110000,
    privacyImpact: 'low',
  },
  'cloudflare': {
    name: 'Cloudflare',
    category: 'cdn',
    estimatedSize: 5000,
    privacyImpact: 'low',
  },
  'jsdelivr': {
    name: 'jsDelivr CDN',
    category: 'cdn',
    estimatedSize: 0, // Variable
    privacyImpact: 'low',
  },
  'unpkg': {
    name: 'unpkg CDN',
    category: 'cdn',
    estimatedSize: 0, // Variable
    privacyImpact: 'low',
  },
  'cdnjs': {
    name: 'CDNJS',
    category: 'cdn',
    estimatedSize: 0, // Variable
    privacyImpact: 'low',
  },
};

function identifyScript(url: string): ThirdPartyScript | null {
  const lowerUrl = url.toLowerCase();
  
  for (const [key, data] of Object.entries(KNOWN_SCRIPTS)) {
    if (lowerUrl.includes(key.toLowerCase())) {
      return {
        name: data.name,
        url,
        category: data.category,
        estimatedSize: data.estimatedSize,
        estimatedLoadTime: data.estimatedSize / 50000, // Rough estimate: 50KB/s
        hasAsync: false,
        hasDefer: false,
        privacyImpact: data.privacyImpact,
        blockingType: 'none',
        alternatives: data.alternatives,
      };
    }
  }
  
  return null;
}

export function analyzeThirdParty(
  htmlContent: string,
  jsFiles: { name: string; content: string }[]
): ThirdPartyAnalysis {
  const scripts: ThirdPartyScript[] = [];
  const detectedUrls = new Set<string>();
  
  if (!htmlContent) {
    return {
      scripts: [],
      totalSize: 0,
      totalLoadTime: 0,
      highPrivacyRisk: 0,
      renderBlocking: 0,
      recommendations: [],
    };
  }
  
  // Parse script tags in HTML
  const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const src = match[1];
    const fullTag = match[0];
    
    if (detectedUrls.has(src)) continue;
    detectedUrls.add(src);
    
    // Skip same-origin scripts
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (!src.startsWith('http') || src.includes(hostname || '')) {
      continue;
    }
    
    const identified = identifyScript(src);
    if (identified) {
      // Check for async/defer
      identified.hasAsync = /\sasync(?:\s|=|>)/i.test(fullTag);
      identified.hasDefer = /\sdefer(?:\s|=|>)/i.test(fullTag);
      
      // Determine blocking type
      if (!identified.hasAsync && !identified.hasDefer) {
        identified.blockingType = 'parser';
      } else if (!identified.hasAsync && identified.hasDefer) {
        identified.blockingType = 'none';
      } else {
        identified.blockingType = 'none';
      }
      
      scripts.push(identified);
    }
  }
  
  // Check JS files for third-party imports
  for (const file of jsFiles) {
    const importRegex = /import\s+.*?\s+from\s*["']([^"']+)["'];?/g;
    while ((match = importRegex.exec(file.content)) !== null) {
      const moduleName = match[1];
      
      // Check if it's a third-party module (not relative)
      if (!moduleName.startsWith('.') && !moduleName.startsWith('/')) {
        const packageName = moduleName.split('/')[0];
        const identified = identifyScript(packageName);
        
        if (identified && !detectedUrls.has(packageName)) {
          detectedUrls.add(packageName);
          identified.url = moduleName;
          identified.blockingType = 'none'; // Bundled
          scripts.push(identified);
        }
      }
    }
  }
  
  // Calculate totals
  const totalSize = scripts.reduce((sum, s) => sum + s.estimatedSize, 0);
  const totalLoadTime = scripts.reduce((sum, s) => sum + s.estimatedLoadTime, 0);
  const highPrivacyRisk = scripts.filter(s => s.privacyImpact === 'high').length;
  const renderBlocking = scripts.filter(s => s.blockingType !== 'none').length;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (scripts.length > 5) {
    recommendations.push(`Consider reducing the number of third-party scripts (${scripts.length} detected)`);
  }
  
  if (highPrivacyRisk > 0) {
    recommendations.push(`${highPrivacyRisk} scripts have high privacy impact - consider privacy-friendly alternatives`);
  }
  
  if (renderBlocking > 0) {
    recommendations.push(`${renderBlocking} scripts are render-blocking - add async/defer attributes`);
  }
  
  const analyticsScripts = scripts.filter(s => s.category === 'analytics');
  if (analyticsScripts.length > 2) {
    recommendations.push('Multiple analytics scripts detected - consider consolidating to one tool');
  }
  
  // Suggest alternatives for high-privacy-impact scripts
  scripts
    .filter(s => s.privacyImpact === 'high' && s.alternatives != null)
    .forEach(s => {
      recommendations.push(`Consider ${s.alternatives?.join(' or ')} as a privacy-friendly alternative to ${s.name}`);
    });
  
  return {
    scripts,
    totalSize,
    totalLoadTime,
    highPrivacyRisk,
    renderBlocking,
    recommendations: [...new Set(recommendations)],
  };
}
