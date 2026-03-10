import { forwardRef, type SelectHTMLAttributes, type ReactNode, type ChangeEvent } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  children: ReactNode;
  className?: string;
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = '', onChange, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <select
        ref={ref}
        onChange={handleChange}
        className={`
          bg-dev-surface border border-dev-border rounded-lg
          px-3 py-2 text-sm text-dev-text
          focus:outline-none focus:ring-2 focus:ring-dev-accent/50 focus:border-dev-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

interface SelectItemProps extends OptionHTMLAttributes<HTMLOptionElement> {
  children: ReactNode;
  value: string;
}

import { type OptionHTMLAttributes } from 'react';

export const SelectItem = forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ children, ...props }, ref) => {
    return (
      <option ref={ref} {...props}>
        {children}
      </option>
    );
  }
);

SelectItem.displayName = 'SelectItem';
