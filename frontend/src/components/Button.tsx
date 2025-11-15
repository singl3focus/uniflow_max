import { triggerHaptic } from '../lib/maxBridge';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
  className?: string;
  haptic?: boolean; // Включить тактильный отклик
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  type = 'button',
  style = {},
  className = '',
  haptic = true,
}: ButtonProps) {
  const getClassName = () => {
    const base = 'btn';
    const variantClass = variant === 'primary' ? 'btn-primary' : 
                        variant === 'danger' ? 'btn-danger' : 
                        'btn-secondary';
    return `${base} ${variantClass} ${className}`.trim();
  };

  const handleClick = () => {
    if (haptic) {
      triggerHaptic('selection');
    }
    onClick?.();
  };

  return (
    <button
      type={type}
      className={getClassName()}
      onClick={handleClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
