import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
};

const Input: React.FC<InputProps> = ({ label, helperText, className = '', ...rest }) => {
  return (
    <label className="flex flex-col gap-1 text-xs text-text-main">
      {label && <span className="font-medium text-xs uppercase tracking-[0.18em] bg-gradient-to-r from-primary to-bright-blue bg-clip-text text-transparent">{label}</span>}
      <input
        className={`rounded-full border border-medium-gray/60 bg-gradient-to-r from-white to-light-gray px-3 py-2 text-sm text-text-main shadow-colorful outline-none transition-all placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-bright hover:shadow-colorful ${className}`}
        {...rest}
      />
      {helperText && <span className="text-xs text-text-muted">{helperText}</span>}
    </label>
  );
};

export default Input;


