import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-primary to-bright-blue text-white hover:from-primary-hover hover:to-primary shadow-colorful hover:shadow-bright transform hover:scale-[1.02] active:scale-[0.98]',
  secondary: 'bg-gradient-to-r from-secondary/20 to-bright-green/20 text-secondary hover:from-secondary/30 hover:to-bright-green/30 border border-secondary/30',
  ghost: 'bg-transparent text-text-muted hover:bg-light-gray hover:text-text-main',
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', loading, children, className = '', ...rest }) => {
  return (
    <button
      className={`${baseClasses} ${variants[variant]} px-4 py-2 ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && <span className="inline-flex h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;


