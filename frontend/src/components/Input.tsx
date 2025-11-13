import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Input as MaxInput } from '@maxhub/max-ui';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  labelColor?: string;
  mode?: 'primary' | 'secondary';
  iconAfter?: ReactNode;
  iconBefore?: ReactNode;
  disabled?: boolean;
  compact?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelColor, multiline, rows, className = '', style, required, ...props }, ref) => {
    if (multiline) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {label && (
            <label
              style={{
                fontSize: 'var(--max-ui-font-size-sm, 14px)',
                fontWeight: 'var(--max-ui-font-weight-medium, 500)',
                color: props.disabled
                  ? 'var(--max-ui-text-disabled)'
                  : labelColor || '#000000',
              }}
            >
              {label}
            </label>
          )}
          <textarea
            ref={ref as any}
            className={className}
            style={{
              width: '100%',
              padding: 'var(--max-ui-spacing-sm, 12px)',
              fontSize: 'var(--max-ui-font-size-base, 16px)',
              borderRadius: 'var(--max-ui-radius-md, 8px)',
              border: '1px solid var(--max-ui-border)',
              backgroundColor: props.disabled
                ? 'var(--max-ui-surface-disabled)'
                : 'var(--max-ui-surface, #ffffff)',
              color: props.disabled
                ? 'var(--max-ui-text-disabled)'
                : '#000000',
              outline: 'none',
              resize: 'vertical',
              minHeight: `${(rows || 3) * 24}px`,
              fontFamily: 'inherit',
              ...style,
            }}
            {...(props as any)}
          />
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {label && (
          <label
            style={{
              fontSize: 'var(--max-ui-font-size-sm, 14px)',
              fontWeight: 'var(--max-ui-font-weight-medium, 500)',
              color: props.disabled
                ? 'var(--max-ui-text-disabled)'
                : labelColor || '#000000',
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--max-ui-danger)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <MaxInput
          ref={ref}
          mode={props.mode}
          iconAfter={props.iconAfter}
          iconBefore={props.iconBefore}
          disabled={props.disabled}
          compact={props.compact}
          placeholder={props.placeholder}
          className={className}
          style={style}
          {...(props as any)}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

