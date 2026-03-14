import type React from 'react';
import type { AnalysisSection } from './types';
import {
  Zap,
  Package,
  FileCode,
  Palette,
  Image,
  Type,
  Images,
  Braces,
  Component,
  Gauge,
  Globe,
  Accessibility,
  Search,
  FileType,
  Shield,
  ExternalLink,
  Brain,
  Layers,
  Network,
  Clock,
  AlertTriangle,
  DollarSign,
  LayoutTemplate,
  GitCompare,
  TrendingUp,
  Terminal,
  Code2,
  Waves,
  FileCheck,
} from 'lucide-react';

export const sections: { 
  id: AnalysisSection; 
  label: string; 
  icon: React.ElementType;
  shortcut: string;
}[] = [
  { id: 'overview', label: 'Overview', icon: Zap, shortcut: '1' },
  { id: 'bundle', label: 'Bundle Analysis', icon: Package, shortcut: '2' },
  { id: 'dom', label: 'DOM Complexity', icon: FileCode, shortcut: '3' },
  { id: 'css', label: 'CSS Analysis', icon: Palette, shortcut: '4' },
  { id: 'images', label: 'Images', icon: Image, shortcut: '5' },
  { id: 'fonts', label: 'Fonts', icon: Type, shortcut: '6' },
  { id: 'assets', label: 'Assets', icon: Images, shortcut: '7' },
  { id: 'javascript', label: 'JavaScript', icon: Braces, shortcut: '8' },
  { id: 'react', label: 'React', icon: Component, shortcut: '9' },
  { id: 'webvitals', label: 'Web Vitals', icon: Gauge, shortcut: '0' },
  { id: 'network', label: 'Network', icon: Globe, shortcut: '' },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility, shortcut: '' },
  { id: 'seo', label: 'SEO', icon: Search, shortcut: '' },
  { id: 'typescript', label: 'TypeScript', icon: FileType, shortcut: '' },
  { id: 'security', label: 'Security', icon: Shield, shortcut: '' },
  { id: 'thirdparty', label: 'Third-Party', icon: ExternalLink, shortcut: '' },
  { id: 'memory', label: 'Memory', icon: Brain, shortcut: '' },
  { id: 'imports', label: 'Imports', icon: Layers, shortcut: '' },
  { id: 'graph', label: 'Dependency Graph', icon: Network, shortcut: '' },
  { id: 'timeline', label: 'Timeline', icon: Clock, shortcut: '' },
  { id: 'risks', label: 'Risks', icon: AlertTriangle, shortcut: '' },
  { id: 'budget', label: 'Budget', icon: DollarSign, shortcut: '' },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, shortcut: '' },
  { id: 'compare', label: 'Compare', icon: GitCompare, shortcut: '' },
  { id: 'trends', label: 'Trends', icon: TrendingUp, shortcut: '' },
  { id: 'cicd', label: 'CI/CD Config', icon: Terminal, shortcut: '' },
  { id: 'playground', label: 'Code Playground', icon: Code2, shortcut: '' },
  { id: 'waterfall', label: 'Waterfall', icon: Waves, shortcut: '' },
  { id: 'eslint', label: 'ESLint Config', icon: FileCheck, shortcut: '' },
];

export const getSectionIndex = (sectionId: AnalysisSection): number => {
  return sections.findIndex(s => s.id === sectionId);
};

export const getSectionByIndex = (index: number): AnalysisSection | undefined => {
  return sections[index]?.id;
};

export const getNextSection = (currentSection: AnalysisSection): AnalysisSection | undefined => {
  const currentIndex = getSectionIndex(currentSection);
  return getSectionByIndex(currentIndex + 1);
};

export const getPreviousSection = (currentSection: AnalysisSection): AnalysisSection | undefined => {
  const currentIndex = getSectionIndex(currentSection);
  return getSectionByIndex(currentIndex - 1);
};
