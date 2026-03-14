import { ESLintConfigGenerator } from '@/components/eslint';

export function ESLintSection(): JSX.Element {
  return (
    <div className="h-full">
      <ESLintConfigGenerator />
    </div>
  );
}
