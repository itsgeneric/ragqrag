import { useState, type FormEvent } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

type Props = {
  initialQuery?: string;
  onSubmit: (query: string, k: number) => void;
  loading?: boolean;
};

const SearchBar: React.FC<Props> = ({ initialQuery = '', onSubmit, loading }) => {
  const [query, setQuery] = useState(initialQuery);
  const [k, setK] = useState(5);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSubmit(trimmed, k);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card flex flex-col gap-4 rounded-2xl border border-medium-gray/60 bg-gradient-to-br from-card/90 to-light-gray/80 px-4 py-4 shadow-colorful"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <div className="min-w-0 flex-1">
          <Input
            label="Query"
            placeholder="Enter your search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" loading={loading} className="w-full md:w-auto md:min-w-[10.5rem]">
          {loading ? 'Running pipeline…' : 'Search'}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-main">
          Documents (k = {k})
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">2</span>
          <input
            type="range"
            min="2"
            max="20"
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="h-2 w-full max-w-sm cursor-pointer appearance-none rounded-lg bg-slate-200 slider"
            style={{
              background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((k-2)/(20-2))*100}%, #e2e8f0 ${((k-2)/(20-2))*100}%, #e2e8f0 100%)`
            }}
          />
          <span className="text-xs text-text-muted">20</span>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;


