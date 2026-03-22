import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps): React.ReactNode {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {breadcrumbs !== undefined && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 mb-4">
          <a
            href="/"
            className="flex items-center gap-1 text-[var(--dev-text-muted)] hover:text-[var(--dev-accent)] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </a>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-[var(--dev-text-subtle)]" />
              {crumb.href !== undefined && crumb.href !== '' ? (
                <a
                  href={crumb.href}
                  className="text-sm text-[var(--dev-text-muted)] hover:text-[var(--dev-accent)] transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-sm text-[var(--dev-text)]">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="gradient-text">{title}</span>
          </h1>
          {subtitle !== undefined && subtitle !== '' && (
            <p className="mt-2 text-[var(--dev-text-muted)]">{subtitle}</p>
          )}
        </div>
        {actions !== undefined && (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
