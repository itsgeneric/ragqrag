import { useState } from 'react';
import { useQueryApi, type RetrievedDoc, type QueryResponse } from '../api/query';
import { useSessionStore } from '../hooks/useSessionStore';
import SearchBar from '../components/query/SearchBar';
import AnswerPanel from '../components/query/AnswerPanel';
import DocCard from '../components/query/DocCard';
import DocModal from '../components/query/DocModal';
import GraphPanel from '../components/graph/GraphPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';

const HomePage: React.FC = () => {
  const { mutateAsync, isPending, error } = useQueryApi();
  const setSession = useSessionStore((s) => s.setSession);
  const setLastResult = useSessionStore((s) => s.setLastResult);
  const setLastComparison = useSessionStore((s) => s.setLastComparison);
  const lastQuery = useSessionStore((s) => s.lastQuery);
  const lastDocs = useSessionStore((s) => s.lastDocs);
  const lastNodes = useSessionStore((s) => s.lastNodes);
  const lastEdges = useSessionStore((s) => s.lastEdges);
  const lastAnswer = useSessionStore((s) => s.lastAnswer);

  const [selectedDoc, setSelectedDoc] = useState<RetrievedDoc | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);

  const handleSubmit = async (query: string, k: number) => {
    const res: QueryResponse = await mutateAsync({ query, k });
    setSession(res.session_id, query);
    setLastResult(res.retrieved_docs, res.nodes, res.edges, res.answer);
    // Clear comparison data when a new session is created
    setLastComparison(null);
  };

  const openDoc = (doc: RetrievedDoc) => {
    setSelectedDoc(doc);
    setModalOpen(true);
  };

  const onSelectDocFromGraph = (docId: string) => {
    const doc = lastDocs.find((d) => d.id === docId);
    if (doc) {
      openDoc(doc);
    }
  };

  const hasDocs = lastDocs.length > 0;

  const baseGraphNodes =
    lastNodes.length > 0
      ? lastNodes
      : hasDocs
        ? lastDocs.map((doc) => ({
            id: `doc_${doc.id}`,
            label: doc.title || '[Doc]',
            group: 'Document',
            score: Number(doc.score) || 0,
          }))
        : [];
  const baseGraphEdges = lastNodes.length > 0 ? lastEdges : [];

  // Add a central DB node and connect all other nodes to it
  const centerId = 'db_center';
  const centerNode =
    baseGraphNodes.length > 0
      ? {
          id: centerId,
          label: 'DB',
          group: 'Center',
          score: 1,
        }
      : null;

  const graphNodes = centerNode ? [centerNode, ...baseGraphNodes] : baseGraphNodes;
  const graphEdges =
    centerNode && baseGraphNodes.length > 0
      ? [
          ...baseGraphEdges,
          ...baseGraphNodes.map((n) => ({
            from: centerId,
            to: n.id,
            relation: n.group === 'Document' ? 'CONTAINS' : 'LINKS',
          })),
        ]
      : baseGraphEdges;

  return (
    <div className="mx-auto flex w-full max-w-full min-h-[calc(100vh-8rem)] flex-col xl:flex-row gap-6 px-4 overflow-x-clip">
      {/* Left Side - All components except Knowledge Graph */}
      <div className="min-w-0 flex-1 flex flex-col gap-6 xl:pr-8 xl:border-r border-slate-200 px-6">
        {/* Fixed sections at top */}
        <div className="flex-shrink-0 space-y-6">
          <section className="space-y-3">
            <div className="p-4 rounded-2xl border border-bright-blue/30 bg-gradient-to-br from-bright-blue/5 to-bright-blue/10 shadow-colorful">
                 <SearchBar onSubmit={handleSubmit} initialQuery={lastQuery} loading={isPending} />
            </div>
          </section>

          {isPending && !hasDocs && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-bright-indigo/30 bg-gradient-to-br from-bright-indigo/5 to-bright-indigo/10">
              <LoadingSpinner label="Embedding → retrieval → KG extraction → answer…" />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl border border-error/30 bg-gradient-to-br from-error/5 to-error/10">
              <ErrorState message={error.message} />
            </div>
          )}

          <div className="p-4 rounded-2xl border border-bright-green/30 bg-gradient-to-br from-bright-green/5 to-bright-green/10 shadow-colorful">
            <AnswerPanel answer={lastAnswer} loading={isPending && !lastAnswer} />
          </div>
        </div>

        {/* Mobile-only Knowledge Graph Button */}
        {baseGraphNodes.length > 0 && (
          <div className="xl:hidden">
            <Button
              type="button"
              onClick={() => setGraphModalOpen(true)}
              className="w-full"
            >
              View Knowledge Graph (↗)
            </Button>
          </div>
        )}

        {/* Scrollable Retrieved Documents section */}
        <section className={`${hasDocs ? 'min-h-[24rem]' : 'min-h-0'} flex flex-col space-y-3`}>
          <header className="flex-shrink-0 flex items-center justify-between gap-2 p-3 rounded-2xl border border-bright-purple/30 bg-gradient-to-br from-bright-purple/5 to-bright-purple/10">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] bg-gradient-to-r from-bright-purple to-accent bg-clip-text text-transparent">Retrieved Documents</h2>
            </div>
          </header>
          {hasDocs ? (
            <div className="max-h-[28rem] overflow-y-auto pr-2 p-4 rounded-2xl border border-bright-purple/30 bg-gradient-to-br from-bright-purple/5 to-bright-purple/10 shadow-colorful custom-scrollbar">
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                {lastDocs.map((doc) => (
                  <DocCard key={doc.id} doc={doc} onClick={() => openDoc(doc)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-bright-purple/30 bg-gradient-to-br from-bright-purple/5 to-bright-purple/10">
              <p className="text-xs text-text-muted">Documents will appear here after you run a query.</p>
            </div>
          )}
        </section>
      </div>

      {/* Right Side - Knowledge Graph (Desktop only) */}
      <div className="hidden xl:block min-w-0 w-1/2 flex-shrink-0 px-6 min-h-[280px] h-[calc(100vh-10rem)] max-h-[44rem] self-start">
        <div className="h-full">
          <GraphPanel nodes={graphNodes} edges={graphEdges} onSelectDocument={onSelectDocFromGraph} />
        </div>
      </div>

      {/* Knowledge Graph Modal (Mobile) */}
      {graphModalOpen && (
        <div className="fixed inset-0 z-50 flex xl:hidden items-start justify-center p-4 bg-overlay backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl border border-bright-cyan/30 bg-gradient-to-br from-bright-cyan/5 to-bright-cyan/10 p-4 shadow-bright animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] bg-gradient-to-r from-bright-cyan to-primary bg-clip-text text-transparent">Knowledge Graph</h2>
              <button
                onClick={() => setGraphModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white/95 text-sm font-semibold text-slate-700 shadow-soft transition-colors hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <GraphPanel nodes={graphNodes} edges={graphEdges} onSelectDocument={onSelectDocFromGraph} />
            </div>
          </div>
        </div>
      )}

      <DocModal open={modalOpen} doc={selectedDoc} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default HomePage;
