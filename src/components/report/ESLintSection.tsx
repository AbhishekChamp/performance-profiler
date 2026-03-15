import { ESLintConfigGenerator } from '@/components/eslint';

export function ESLintSection(): React.ReactNode {
  return (
    <div className="h-full">
      <ESLintConfigGenerator />
    </div>
  );
}
