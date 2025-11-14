interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
  className?: string;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  type = 'button',
  style = {},
  className = ''
}: ButtonProps) {
  const getClassName = () => {
    const base = 'btn';
    const variantClass = variant === 'primary' ? 'btn-primary' : 
                        variant === 'danger' ? 'btn-danger' : 
                        'btn-secondary';
    return `${base} ${variantClass} ${className}`.trim();
  };

  return (
    <button
      type={type}
      className={getClassName()}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
