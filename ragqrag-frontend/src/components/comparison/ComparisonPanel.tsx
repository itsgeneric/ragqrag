import type { ComparisonResponse } from '../../api/comparison';
import Button from '../common/Button';
import ReactMarkdown from 'react-markdown';

type Props = {
  data: ComparisonResponse;
};

type ColumnKey = 'plain_llm' | 'mongodb_rag' | 'neo4j_kg_rag';

const labelMap: Record<ColumnKey, string> = {
  plain_llm: 'Plain LLM',
  mongodb_rag: 'MongoDB RAG',
  neo4j_kg_rag: 'Neo4j KG RAG',
};

const ComparisonPanel: React.FC<Props> = ({ data }) => {
  const handleCopy = async (text: string) => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
  };

  const rows: { key: ColumnKey; answer: string }[] = [
    { key: 'plain_llm', answer: data.plain_llm_answer },
    { key: 'mongodb_rag', answer: data.mongodb_rag_answer },
    { key: 'neo4j_kg_rag', answer: data.neo4j_kg_rag_answer },
  ];

  return (
    <section className="glass-card rounded-2xl border border-slate-100 bg-card/80 p-4 shadow-soft">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          {/*<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">*/}
          {/*  Model Comparison*/}
          {/*</h2>*/}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map((row) => {
          const metric = data.calculated_metrics[row.key];
          const answer = row.answer ?? '';

          return (
            <div
              key={row.key}
              className={`flex flex-col rounded-2xl border p-3 text-sm h-[340px] ${
                row.key === 'plain_llm' 
                  ? 'border-bright-blue/30 bg-gradient-to-br from-bright-blue/5 to-bright-blue/10' 
                  : row.key === 'mongodb_rag'
                  ? 'border-bright-green/30 bg-gradient-to-br from-bright-green/5 to-bright-green/10'
                  : 'border-bright-purple/30 bg-gradient-to-br from-bright-purple/5 to-bright-purple/10'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-text-main">{labelMap[row.key]}</p>
                  <div className="mt-1 flex gap-1 text-xs text-text-muted">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-white ${
                      row.key === 'plain_llm' 
                        ? 'bg-gradient-to-r from-bright-blue to-primary' 
                        : row.key === 'mongodb_rag'
                        ? 'bg-gradient-to-r from-bright-green to-secondary'
                        : 'bg-gradient-to-r from-bright-purple to-accent'
                    }`}>
                      BLEU {metric?.bleu.toFixed(4) ?? '—'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-white ${
                      row.key === 'plain_llm' 
                        ? 'bg-gradient-to-r from-primary to-bright-indigo' 
                        : row.key === 'mongodb_rag'
                        ? 'bg-gradient-to-r from-secondary to-bright-green'
                        : 'bg-gradient-to-r from-accent to-bright-pink'
                    }`}>
                      ROUGE-L {metric?.rouge_l.toFixed(4) ?? '—'}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  onClick={() => handleCopy(answer)}
                  disabled={!answer}
                >
                  Copy
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto text-xs text-text-main custom-scrollbar p-1 rounded">
                {answer ? (
                  <ReactMarkdown>{answer}</ReactMarkdown>
                ) : (
                  <p className="text-text-muted">No answer available.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ComparisonPanel;
