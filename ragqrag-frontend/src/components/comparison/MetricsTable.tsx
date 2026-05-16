import type { ComparisonMetrics } from '../../api/comparison';

type MetricsTableProps = {
  metrics: ComparisonMetrics;
};

const MetricsTable: React.FC<MetricsTableProps> = ({ metrics }) => {
  const rows = [
    { key: 'plain_llm', label: 'Plain LLM' },
    { key: 'mongodb_rag', label: 'MongoDB RAG' },
    { key: 'neo4j_kg_rag', label: 'Neo4j KG RAG' },
  ] as const;

  return (
    <div className="mt-3 mx-auto w-full max-w-full overflow-x-auto lg:flex lg:justify-center">
      <table className="mx-auto border-collapse text-left text-sm border border-slate-200 rounded-lg overflow-hidden min-w-[28rem]">
        <thead className="border-b border-slate-200">
          <tr>
            <th className="px-3 py-2 font-semibold w-32 text-text-main">Model</th>
            <th className="px-3 py-2 font-semibold w-20 text-center text-text-main border-l border-slate-200">BLEU</th>
            <th className="px-3 py-2 font-semibold w-24 text-center text-text-main border-l border-slate-200">ROUGE-L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const value = metrics[row.key];
            return (
              <tr key={row.key} className={`border-t border-slate-200 text-sm text-text-main ${
                row.key === 'plain_llm' 
                  ? 'bg-gradient-to-r from-bright-blue/5 to-bright-blue/10' 
                  : row.key === 'mongodb_rag'
                  ? 'bg-gradient-to-r from-bright-green/5 to-bright-green/10'
                  : 'bg-gradient-to-r from-bright-purple/5 to-bright-purple/10'
              }`}>
                <td className="px-3 py-2 font-medium">
                  <span className={`font-semibold ${
                    row.key === 'plain_llm' 
                      ? 'bg-gradient-to-r from-bright-blue to-primary bg-clip-text text-transparent'
                      : row.key === 'mongodb_rag'
                      ? 'bg-gradient-to-r from-bright-green to-secondary bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-bright-purple to-accent bg-clip-text text-transparent'
                  }`}>
                    {row.label}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sm text-center border-l border-slate-200">
                  <span className={`rounded-full px-2 py-0.5 text-white text-sm shadow-sm ${
                    row.key === 'plain_llm'
                      ? 'bg-gradient-to-r from-bright-blue to-primary'
                      : row.key === 'mongodb_rag'
                      ? 'bg-gradient-to-r from-bright-green to-secondary'
                      : 'bg-gradient-to-r from-bright-purple to-accent'
                  }`}>
                    {value ? value.bleu.toFixed(4) : '—'}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-sm text-center border-l border-slate-200">
                  <span className={`rounded-full px-2 py-0.5 text-white text-sm shadow-sm ${
                    row.key === 'plain_llm'
                      ? 'bg-gradient-to-r from-primary to-bright-indigo'
                      : row.key === 'mongodb_rag'
                      ? 'bg-gradient-to-r from-secondary to-bright-green'
                      : 'bg-gradient-to-r from-accent to-bright-pink'
                  }`}>
                    {value ? value.rouge_l.toFixed(4) : '—'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MetricsTable;


