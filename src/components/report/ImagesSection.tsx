import { motion } from 'framer-motion';
import { CheckCircle, Image } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { ImageAnalysis } from '@/types';

interface ImagesSectionProps {
  analysis?: ImageAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function ImagesSection({ analysis }: ImagesSectionProps): React.ReactNode {
  if (analysis === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No image analysis data available</p>
      </motion.div>
    );
  }

  const { images, totalSize, optimizableSize, modernFormatPercentage, lazyLoadingPercentage, recommendations } = analysis;

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6">
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{images.length}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Total Images</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{formatBytes(totalSize)}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Total Size</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-success)]/10">
            <p className="text-2xl font-bold text-[var(--dev-success)]">{modernFormatPercentage.toFixed(0)}%</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Modern Format</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-info)]/10">
            <p className="text-2xl font-bold text-[var(--dev-info)]">{lazyLoadingPercentage.toFixed(0)}%</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Lazy Loaded</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
            <p className="text-2xl font-bold text-[var(--dev-warning)]">{formatBytes(optimizableSize)}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Optimizable</p>
          </div>
        </ModernCard>
      </motion.div>

      {recommendations.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Recommendations"
                subtitle="Image optimization suggestions"
                icon={<Image className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                  <CheckCircle className="w-5 h-5 text-[var(--dev-success)]" />
                  <span className="text-sm text-[var(--dev-text)]">{rec}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}
    </motion.section>
  );
}
