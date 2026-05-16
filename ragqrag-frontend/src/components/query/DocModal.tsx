import type { RetrievedDoc } from '../../api/query';
import Button from '../common/Button';

type Props = {
  open: boolean;
  doc: RetrievedDoc | null;
  onClose: () => void;
};

const DocModal: React.FC<Props> = ({ open, doc, onClose }) => {
  if (!open || !doc) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-overlay backdrop-blur-sm">
      <div className="glass-card max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-bright-blue/30 bg-gradient-to-br from-bright-blue/5 to-bright-blue/10 p-5 shadow-bright animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header with title and score */}
        <div className="mb-3 flex items-center justify-between gap-3 p-3 rounded-2xl border border-bright-blue/20 bg-gradient-to-r from-bright-blue/10 to-primary/10">
          <h2 className="text-sm font-semibold bg-gradient-to-r from-bright-blue to-primary bg-clip-text text-transparent">{doc.title || '[No title]'}</h2>
          <span className="rounded-full bg-gradient-to-r from-bright-blue to-primary px-2 py-0.5 text-xs font-mono text-white shadow-sm">
            {Number(doc.score).toFixed(4)}
          </span>
        </div>

        {/* Content area */}
        <div className="mb-3 max-h-60 overflow-y-auto text-sm text-text-main p-3 rounded-2xl border border-light-gray bg-gradient-to-br from-white to-light-gray custom-scrollbar">
          <p>{doc.summary || '[No summary provided]'}</p>
        </div>

        {/* Keywords section */}
        <div className="mb-4 p-3 rounded-2xl border border-bright-purple/20 bg-gradient-to-br from-bright-purple/5 to-bright-purple/10">
          <div className="mb-2">
            <span className="text-xs font-medium bg-gradient-to-r from-bright-purple to-accent bg-clip-text text-transparent">Keywords</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {doc.keywords &&
              doc.keywords
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
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-medium-gray/30 bg-gradient-to-r from-light-gray/50 to-white/50">
          {/* ID in capsule on left */}
          <span className="rounded-full bg-slate-500 px-3 py-1 text-xs font-mono text-white shadow-sm">
            ID: {doc.id}
          </span>


          {/* Action buttons on right */}
          <div className="flex gap-2">
            {doc.url && (
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-gradient-to-r from-bright-indigo to-primary px-3 py-2 text-xs font-medium text-white hover:from-primary hover:to-bright-indigo shadow-colorful transition-all hover:scale-105"
              >
                Open source
              </a>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocModal;


