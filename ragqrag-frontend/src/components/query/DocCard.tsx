import type { RetrievedDoc } from '../../api/query';

type Props = {
  doc: RetrievedDoc;
  onClick: () => void;
};

const DocCard: React.FC<Props> = ({ doc, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card flex h-full flex-col rounded-2xl border border-bright-blue/30 bg-gradient-to-br from-bright-blue/5 to-bright-blue/10 p-4 text-left shadow-colorful transition-all hover:-translate-y-1 hover:shadow-bright hover:scale-[1.02]"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-semibold text-text-main">{doc.title || '[No title]'}</h3>
        <span className="rounded-full bg-gradient-to-r from-bright-blue to-primary px-2 py-0.5 text-xs font-mono text-white shadow-sm">
          {Number(doc.score).toFixed(4)}
        </span>
      </div>
      <p className="mb-3 line-clamp-3 text-xs text-text-muted">{doc.summary || '[No summary provided]'}</p>
      {doc.keywords && (
        <div className="mt-auto flex flex-wrap gap-1">
          {doc.keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
            .map((kw, index) => (
              <span
                key={kw}
                className={`rounded-full px-2 py-0.5 text-xs text-white shadow-sm ${
                  index % 4 === 0 
                    ? 'bg-gradient-to-r from-bright-blue to-primary'
                    : index % 4 === 1
                    ? 'bg-gradient-to-r from-bright-green to-secondary'
                    : index % 4 === 2
                    ? 'bg-gradient-to-r from-bright-purple to-accent'
                    : 'bg-gradient-to-r from-bright-orange to-bright-pink'
                }`}
              >
                {kw}
              </span>
            ))}
        </div>
      )}
    </button>
  );
};

export default DocCard;


