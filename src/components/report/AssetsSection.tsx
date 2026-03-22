import { motion } from 'framer-motion';
import { File, FileText, Film, FolderOpen, Image, Music } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants } from '@/utils/animations';
import type { AssetAnalysis } from '@/types';

interface AssetsSectionProps {
  analysis?: AssetAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function AssetsSection({ analysis }: AssetsSectionProps): React.ReactNode {
  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No assets analysis data available</p>
      </motion.div>
    );
  }

  const { breakdown, percentages, largestAssets } = analysis;

  const assetTypes = [
    { key: 'images', label: 'Images', icon: Image, color: 'var(--dev-accent)' },
    { key: 'fonts', label: 'Fonts', icon: FileText, color: 'var(--dev-success)' },
    { key: 'videos', label: 'Videos', icon: Film, color: 'var(--dev-warning)' },
    { key: 'audio', label: 'Audio', icon: Music, color: 'var(--dev-info)' },
    { key: 'other', label: 'Other', icon: File, color: 'var(--dev-text-muted)' },
  ] as const;

  const totalSize = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Total Size */}
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="text-center p-8">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-[var(--dev-accent)]" />
          <p className="text-4xl font-bold text-[var(--dev-text)]">{formatBytes(totalSize)}</p>
          <p className="text-sm text-[var(--dev-text-muted)]">Total Assets Size</p>
        </ModernCard>
      </motion.div>

      {/* By Type */}
      <motion.div variants={fadeUpVariants}>
        <ModernCard
          header={
            <CardHeader
              title="Assets by Type"
              subtitle="Breakdown by asset category"
              icon={<FolderOpen className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {assetTypes.map((type, index) => {
              const size = breakdown[type.key as keyof typeof breakdown] || 0;
              const percentage = percentages[type.key as keyof typeof percentages] || 0;
              return (
                <motion.div
                  key={type.key}
                  className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]"
                  variants={staggerItemVariants}
                  custom={index}
                  whileHover={{ scale: 1.02 }}
                >
                  <type.icon className="w-8 h-8 mx-auto mb-2" style={{ color: type.color }} />
                  <p className="text-lg font-semibold text-[var(--dev-text)]">{formatBytes(size)}</p>
                  <p className="text-xs text-[var(--dev-text-muted)]">{type.label}</p>
                  <p className="text-xs text-[var(--dev-text-subtle)]">{percentage.toFixed(1)}%</p>
                </motion.div>
              );
            })}
          </div>
        </ModernCard>
      </motion.div>

      {/* Largest Assets */}
      {largestAssets.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Largest Assets"
                subtitle={`Top ${largestAssets.length} largest files`}
                icon={<FolderOpen className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {largestAssets.map((asset, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <code className="text-sm text-[var(--dev-text)] truncate flex-1">{asset.path}</code>
                  <span className="text-sm text-[var(--dev-text-muted)] ml-4">{formatBytes(asset.size)}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
