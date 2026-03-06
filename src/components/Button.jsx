const variantStyles = {
  primary:
    'bg-accent text-black font-semibold hover:bg-accent-hover',
  secondary:
    'border border-accent text-accent bg-transparent hover:bg-accent-soft',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover',
  danger:
    'bg-danger text-white hover:opacity-90',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5',
  lg: 'px-8 py-3.5 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}) {
  return (
    <button
      className={`rounded-lg transition-all duration-200 cursor-pointer ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
