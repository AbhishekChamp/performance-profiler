import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Copy, 
  FileCode, 
  Layers,
  Package,
  TrendingUp
} from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { BundleAnalysis } from '@/types';

interface BundleSectionProps {
  analysis?: BundleAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function BundleSection({ analysis }: BundleSectionProps): React.ReactNode {
  if (analysis === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No bundle analysis data available</p>
      </motion.div>
    );
  }

  const { 
    totalSize, 
    gzippedSize, 
    moduleCount, 
    largestModules,
    duplicateLibraries,
    vendorSize,
    vendorPercentage,
    modules 
  } = analysis;

  const thirdPartyModules = modules.filter(m => m.type === 'vendor');
  const thirdPartySize = thirdPartyModules.reduce((acc, m) => acc + m.size, 0);

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={staggerContainerVariants}
      >
        {[
          { 
            label: 'Total Size', 
            value: formatBytes(totalSize), 
            subtext: `${formatBytes(gzippedSize)} gzipped`,
            icon: Package,
            color: 'text-[var(--dev-accent)]'
          },
          { 
            label: 'Modules', 
            value: moduleCount.toString(), 
            subtext: `${thirdPartyModules.length} vendor`,
            icon: FileCode,
            color: 'text-[var(--dev-info)]'
          },
          { 
            label: 'Vendor', 
            value: formatBytes(vendorSize), 
            subtext: formatPercentage(vendorPercentage),
            icon: Layers,
            color: vendorPercentage > 60 ? 'text-[var(--dev-warning)]' : 'text-[var(--dev-success)]'
          },
          { 
            label: 'Duplicate Libs', 
            value: duplicateLibraries.length.toString(), 
            subtext: duplicateLibraries.length > 0 ? 'Action needed' : 'Clean',
            icon: TrendingUp,
            color: duplicateLibraries.length > 0 ? 'text-[var(--dev-warning)]' : 'text-[var(--dev-success)]'
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ModernCard className="text-center p-4">
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-[var(--dev-text)]">{stat.value}</p>
              <p className="text-xs text-[var(--dev-text-muted)]">{stat.label}</p>
              <p className="text-xs text-[var(--dev-text-subtle)] mt-1">{stat.subtext}</p>
            </ModernCard>
          </motion.div>
        ))}
      </motion.div>

      {duplicateLibraries.length > 0 && (
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            className="border-l-4 border-l-[var(--dev-warning)]"
            header={
              <CardHeader
                title="Duplicate Libraries"
                subtitle={`${duplicateLibraries.length} duplicates found - consider deduplication`}
                icon={<Copy className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-3">
              {duplicateLibraries.map((lib, index) => (
                <motion.div
                  key={lib.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--dev-warning)]/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--dev-warning)]/10 flex items-center justify-center">
                      <Copy className="w-5 h-5 text-[var(--dev-warning)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--dev-text)]">{lib.name}</p>
                      <p className="text-xs text-[var(--dev-text-muted)]">
                        {lib.instances} instances • {formatBytes(lib.totalSize)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-1">
                      {lib.versions.map(v => (
                        <AnimatedBadge key={v} variant="warning" size="sm">{v}</AnimatedBadge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ModernCard>
        </motion.div>
      )}

      <motion.div variants={fadeUpVariants}>
        <ModernCard
          header={
            <CardHeader
              title="Largest Modules"
              subtitle={`Top ${Math.min(10, largestModules.length)} largest modules by size`}
              icon={<FileCode className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="space-y-2">
            {largestModules.slice(0, 10).map((module, index) => {
              const percentage = (module.size / totalSize) * 100;
              const isVendor = module.type === 'vendor';
              return (
                <motion.div
                  key={module.name}
                  className="group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--dev-surface-hover)] transition-colors">
                    <div className="relative w-24 h-8 bg-[var(--dev-bg)] rounded-lg overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 ${
                          isVendor ? 'bg-[var(--dev-warning)]' : 'bg-[var(--dev-accent)]'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage * 2, 100)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[var(--dev-text)]">
                        {formatPercentage(percentage)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--dev-text)] truncate">{module.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--dev-text-muted)]">{formatBytes(module.size)}</span>
                        {isVendor && (
                          <AnimatedBadge variant="warning" size="sm">Vendor</AnimatedBadge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ModernCard>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Code Distribution"
                subtitle="Vendor vs Application code"
                icon={<Layers className="w-5 h-5 text-[var(--dev-accent)]" />}
              />
            }
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--dev-text)]">Vendor Code</span>
                  <span className="text-[var(--dev-text-muted)]">{formatBytes(vendorSize)}</span>
                </div>
                <div className="h-4 bg-[var(--dev-bg)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--dev-warning)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${vendorPercentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <p className="text-xs text-[var(--dev-text-muted)] mt-1">{formatPercentage(vendorPercentage)} of total bundle</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--dev-text)]">Application Code</span>
                  <span className="text-[var(--dev-text-muted)]">{formatBytes(totalSize - vendorSize)}</span>
                </div>
                <div className="h-4 bg-[var(--dev-bg)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--dev-accent)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - vendorPercentage}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
                <p className="text-xs text-[var(--dev-text-muted)] mt-1">{formatPercentage(100 - vendorPercentage)} of total bundle</p>
              </div>
            </div>
          </ModernCard>
        </motion.div>

        <motion.div variants={fadeUpVariants}>
          <ModernCard
            header={
              <CardHeader
                title="Vendor Dependencies"
                subtitle={`${thirdPartyModules.length} external dependencies`}
                icon={<AlertTriangle className="w-5 h-5 text-[var(--dev-warning)]" />}
              />
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                <span className="text-[var(--dev-text-muted)]">Total Vendor Size</span>
                <span className="text-[var(--dev-text)]">{formatBytes(thirdPartySize)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                <span className="text-[var(--dev-text-muted)]">Percentage</span>
                <span className={thirdPartySize / totalSize > 0.5 ? 'text-[var(--dev-warning)]' : 'text-[var(--dev-success)]'}>
                  {formatPercentage((thirdPartySize / totalSize) * 100)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                <span className="text-[var(--dev-text-muted)]">Duplicates</span>
                <AnimatedBadge variant={duplicateLibraries.length > 0 ? 'warning' : 'success'}>
                  {duplicateLibraries.length > 0 ? `${duplicateLibraries.length} found` : 'None'}
                </AnimatedBadge>
              </div>
            </div>
          </ModernCard>
        </motion.div>
      </div>
    </motion.section>
  );
}
