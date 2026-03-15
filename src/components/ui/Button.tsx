import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading,
      fullWidth,
      className = '',
      disabled,
      ...props
    },
    ref
  ): React.JSX.Element => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dev-bg disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary:
        'bg-dev-accent text-white hover:bg-dev-accent/90 focus:ring-dev-accent',
      secondary:
        'bg-dev-surface text-dev-text border border-dev-border hover:bg-dev-surface-hover focus:ring-dev-accent',
      danger:
        'bg-dev-danger text-white hover:bg-dev-danger/90 focus:ring-dev-danger',
      ghost:
        'bg-transparent text-dev-text hover:bg-dev-surface-hover focus:ring-dev-accent',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const widthClass = fullWidth === true ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        disabled={(disabled === true) || (isLoading === true)}
        {...props}
      >
        {(isLoading === true) && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {(isLoading !== true) && leftIcon}
        {children}
        {(isLoading !== true) && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
