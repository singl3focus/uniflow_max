import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = '', style, onClick, ...props }: CardProps) {
  const isClickable = !!onClick;
  
  return (
    <div
      className={`max-ui-card ${className}`}
      style={{
        backgroundColor: 'var(--max-ui-surface, #ffffff)',
        borderRadius: 'var(--max-ui-radius-md, 12px)',
        padding: 'var(--max-ui-spacing-md, 16px)',
        boxShadow: 'var(--max-ui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
        border: '1px solid var(--max-ui-border, rgba(0, 0, 0, 0.1))',
        color: '#000000',
        cursor: isClickable ? 'pointer' : 'default',
        transition: isClickable ? 'transform 0.2s, box-shadow 0.2s' : 'none',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--max-ui-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--max-ui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

