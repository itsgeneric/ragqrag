const LoadingSpinner: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <div className="flex items-center gap-3 text-sm text-text-main">
      <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-transparent bg-gradient-to-r from-primary via-bright-purple to-bright-pink p-0.5">
        <span className="h-full w-full rounded-full bg-white" />
      </span>
      {label && <span className="bg-gradient-to-r from-primary to-bright-purple bg-clip-text text-transparent font-medium">{label}</span>}
    </div>
  );
};

export default LoadingSpinner;


