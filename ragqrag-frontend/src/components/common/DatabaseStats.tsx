import { useDatabaseStats } from '../../api/database';

const DatabaseStats: React.FC = () => {
  const { data, isLoading, error } = useDatabaseStats();

  if (error) {
    return (
      <div className="hidden sm:block flex-shrink-0">
        <span className="rounded-full bg-gradient-to-r from-error to-red-600 px-3 py-1 text-xs font-medium text-white shadow-colorful">
          DB Error
        </span>
      </div>
    );
  }

  return (
    <div className="hidden sm:block flex-shrink-0">
      <span className="rounded-full bg-gradient-to-r from-bright-green to-secondary px-3 py-1 text-xs font-medium text-white shadow-colorful">
        Documents: {isLoading ? '...' : data?.total_documents?.toLocaleString() ?? '0'}
      </span>
    </div>
  );
};

export default DatabaseStats;
