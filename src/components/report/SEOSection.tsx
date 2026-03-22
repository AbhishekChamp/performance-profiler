import { motion } from 'framer-motion';
import { AlertTriangle, Globe, Heading, Search } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { SEOAnalysis } from '@/types';

interface SEOSectionProps {
  analysis?: SEOAnalysis;
}

export function SEOSection({ analysis }: SEOSectionProps): React.ReactNode {
  if (analysis === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No SEO analysis data available</p>
      </motion.div>
    );
  }

  const { score, meta, openGraph, headings, issues } = analysis;

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="flex flex-col md:flex-row items-center gap-8 p-6">
          <ScoreDisplay score={score} size="lg" label="SEO Score" animate />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{meta.title !== '' ? '✓' : '✗'}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Title</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{meta.description !== '' ? '✓' : '✗'}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Description</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{openGraph.title !== '' ? '✓' : '✗'}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Open Graph</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
              <p className="text-2xl font-bold text-[var(--dev-warning)]">{issues.length}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">Issues</p>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      <motion.div variants={fadeUpVariants}>
        <ModernCard
          header={
            <CardHeader
              title="Meta Tags"
              subtitle="SEO metadata status"
              icon={<Globe className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-xs text-[var(--dev-text-muted)] uppercase">Title</p>
              <p className="text-sm text-[var(--dev-text)] mt-1">{meta.title !== '' ? meta.title : 'Not set'}</p>
              <p className="text-xs text-[var(--dev-text-subtle)] mt-1">{meta.titleLength} chars</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-xs text-[var(--dev-text-muted)] uppercase">Description</p>
              <p className="text-sm text-[var(--dev-text)] mt-1">{meta.description !== '' ? meta.description : 'Not set'}</p>
              <p className="text-xs text-[var(--dev-text-subtle)] mt-1">{meta.descriptionLength} chars</p>
            </div>
          </div>
        </ModernCard>
      </motion.div>

      <motion.div variants={fadeUpVariants}>
        <ModernCard
          header={
            <CardHeader
              title="Heading Structure"
              subtitle="H1-H3 tag usage"
              icon={<Heading className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{headings.h1.length}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">H1 Tags</p>
              {headings.h1.length !== 1 && (
                <AnimatedBadge variant="warning" size="sm" className="mt-1">Should be 1</AnimatedBadge>
              )}
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{headings.h2.length}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">H2 Tags</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
              <p className="text-2xl font-bold text-[var(--dev-text)]">{headings.h3.length}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">H3 Tags</p>
            </div>
          </div>
          {!headings.hierarchyValid && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--dev-warning)]/10">
              <p className="text-sm text-[var(--dev-warning)]">Heading hierarchy issues detected</p>
            </div>
          )}
        </ModernCard>
      </motion.div>

      {issues.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="SEO Issues"
                subtitle={`${issues.length} improvements needed`}
                icon={<AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-warning)]/5">
                  <AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />
                  <span className="text-sm text-[var(--dev-text)]">{issue}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
