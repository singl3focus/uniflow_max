import { SelectHTMLAttributes, ReactNode, useState } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  labelColor?: string;
  children: ReactNode;
}

export default function Select({ label, labelColor, children, className = '', style, disabled, ...props }: SelectProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <label
          style={{
            fontSize: 'var(--max-ui-font-size-sm, 14px)',
            fontWeight: 'var(--max-ui-font-weight-medium, 500)',
            color: disabled 
              ? 'var(--max-ui-text-disabled)' 
              : labelColor || '#000000',
          }}
        >
          {label}
        </label>
      )}
      <select
        className={`max-ui-select ${className}`}
        disabled={disabled}
        style={{
          width: '100%',
          padding: 'var(--max-ui-spacing-sm, 12px)',
          fontSize: 'var(--max-ui-font-size-base, 16px)',
          borderRadius: 'var(--max-ui-radius-md, 8px)',
          border: `1px solid ${isFocused && !disabled 
            ? 'var(--max-ui-primary)' 
            : 'var(--max-ui-border)'}`,
          backgroundColor: disabled 
            ? 'var(--max-ui-surface-disabled)' 
            : 'var(--max-ui-surface, #ffffff)',
          color: disabled 
            ? 'var(--max-ui-text-disabled)' 
            : '#000000',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: isFocused && !disabled ? '0 0 0 3px rgba(0, 122, 255, 0.1)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

