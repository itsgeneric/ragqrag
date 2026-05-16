type ErrorStateProps = {
  message: string;
};

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <div className="glass-card rounded-2xl border border-error/30 bg-gradient-to-br from-error/10 to-error/5 px-4 py-3 text-sm shadow-colorful">
      <p className="font-semibold bg-gradient-to-r from-error to-red-600 bg-clip-text text-transparent">Something went wrong</p>
      <p className="mt-1 text-xs text-error/80">{message}</p>
    </div>
  );
};

export default ErrorState;


