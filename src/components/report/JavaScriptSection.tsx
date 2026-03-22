import { motion } from 'framer-motion';
import { Braces, FileCode } from 'lucide-react';
import { CardHeader, ModernCard } from '@/components/ui/ModernCard';
import { fadeUpVariants, staggerContainerVariants } from '@/utils/animations';
import type { JSFileAnalysis } from '@/types';

interface JavaScriptSectionProps {
  files?: JSFileAnalysis[];
}

export function JavaScriptSection({ files }: JavaScriptSectionProps): React.ReactNode {
  if (files === undefined || files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-[var(--dev-text-muted)]"
      >
        <Braces className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No JavaScript analysis data available</p>
      </motion.div>
    );
  }

  const totalLines = files.reduce((acc, f) => acc + f.lines, 0);
  const totalFunctions = files.reduce((acc, f) => acc + f.functions.length, 0);
  const allWarnings = files.flatMap(f => f.warnings);

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <ModernCard className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{files.length}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Files</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{totalLines.toLocaleString()}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Total Lines</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-surface-hover)]">
            <p className="text-2xl font-bold text-[var(--dev-text)]">{totalFunctions}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Functions</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[var(--dev-warning)]/10">
            <p className="text-2xl font-bold text-[var(--dev-warning)]">{allWarnings.length}</p>
            <p className="text-xs text-[var(--dev-text-muted)]">Warnings</p>
          </div>
        </ModernCard>
      </motion.div>

      <motion.div variants={fadeUpVariants}>
        <ModernCard
          header={
            <CardHeader
              title="JavaScript Files"
              subtitle={`${files.length} files analyzed`}
              icon={<FileCode className="w-5 h-5 text-[var(--dev-accent)]" />}
            />
          }
        >
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="p-3 rounded-lg bg-[var(--dev-surface-hover)]">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-[var(--dev-text)] truncate">{file.path}</code>
                  <span className="text-xs text-[var(--dev-text-muted)] ml-4">{file.lines} lines</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-[var(--dev-text-muted)]">
                  <span>{file.functions.length} functions</span>
                  <span>Complexity: {file.totalComplexity}</span>
                </div>
              </div>
            ))}
          </div>
        </ModernCard>
      </motion.div>
    </motion.section>
  );
}
