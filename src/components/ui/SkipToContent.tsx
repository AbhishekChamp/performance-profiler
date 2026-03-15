/**
 * Skip to content link for accessibility
 * Allows keyboard users to skip navigation and jump to main content
 */
export function SkipToContent(): React.ReactNode {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-[9999]
        px-4 py-3
        bg-dev-accent text-white
        rounded-lg shadow-lg
        font-medium text-sm
        focus:outline-none focus:ring-4 focus:ring-dev-accent/30
        transition-all
      "
    >
      Skip to main content
    </a>
  );
}
