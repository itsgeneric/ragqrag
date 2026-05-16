import React, { useMemo, useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// Define the shape of our JSON data for better TypeScript support
interface HumanRatings {
  factual_accuracy: number;
  completeness: number;
  coherence: number;
  helpfulness: number;
  [key: string]: number;
}

interface AutomatedMetric {
  bleu: number;
  rouge_l: number;
}

interface MetricEntry {
  session_id: string;
  query: string;
  model_type: string;
  human_ratings: HumanRatings;
  calculated_metrics: {
    plain_llm?: AutomatedMetric;
    mongodb_rag?: AutomatedMetric;
    neo4j_kg_rag?: AutomatedMetric;
    [key: string]: AutomatedMetric | undefined;
  };
}

const MetricsPage: React.FC = () => {
  const [metricsData, setMetricsData] = useState<MetricEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const [modelFilter, setModelFilter] = useState<string>('all');
  const [minRating, setMinRating] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');

  // Fetch JSON data from public folder
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/metrics.json');
        if (!response.ok) {
          throw new Error(`Failed to load metrics data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setMetricsData(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Filter Data
  const filtered = useMemo(() => {
    if (!metricsData || metricsData.length === 0) return [];
    return metricsData.filter((entry) => {
      if (modelFilter !== 'all' && entry.model_type !== modelFilter) return false;
      const ratings = entry.human_ratings;
      if (!ratings || !minRating) return true;
      const vals = Object.values(ratings).filter((n): n is number => typeof n === 'number');
      if (!vals.length) return false;
      // For filtering purposes, we still use the average to see if it meets the "Minimum Rating" criteria
      const avg = vals.reduce((acc, v) => acc + v, 0) / vals.length;
      return avg >= minRating;
    });
  }, [metricsData, modelFilter, minRating]);

  // Aggregate Data for Graphs
  const { avgMetrics, radarData, automatedData } = useMemo(() => {
    let totalHuman = 0;
    let totalHumanCount = 0;
    let totalBleu = 0;
    let totalRouge = 0;
    let automatedCount = 0;

    const modelStats: Record<string, any> = {
      plain_llm: { name: 'Plain LLM', count: 0, factual: 0, completeness: 0, coherence: 0, helpfulness: 0, bleu: 0, rouge: 0 },
      mongodb_rag: { name: 'MongoDB RAG', count: 0, factual: 0, completeness: 0, coherence: 0, helpfulness: 0, bleu: 0, rouge: 0 },
      neo4j_kg_rag: { name: 'Neo4j KG RAG', count: 0, factual: 0, completeness: 0, coherence: 0, helpfulness: 0, bleu: 0, rouge: 0 }
    };

    filtered.forEach(entry => {
      const type = entry.model_type;
      if (!modelStats[type]) return;

      const ratings = entry.human_ratings;
      if (ratings) {
        modelStats[type].count += 1;
        modelStats[type].factual += ratings.factual_accuracy || 0;
        modelStats[type].completeness += ratings.completeness || 0;
        modelStats[type].coherence += ratings.coherence || 0;
        modelStats[type].helpfulness += ratings.helpfulness || 0;

        const valArray = Object.values(ratings);
        totalHuman += valArray.reduce((a, b) => a + (b as number), 0);
        totalHumanCount += valArray.length;
      }

      const auto = entry.calculated_metrics?.[type];
      if (auto) {
        modelStats[type].bleu += auto.bleu || 0;
        modelStats[type].rouge += auto.rouge_l || 0;
        totalBleu += auto.bleu || 0;
        totalRouge += auto.rouge_l || 0;
        automatedCount += 1;
      }
    });

    // Format Radar Data
    const rData = [
      { subject: 'Factual Accuracy', 'Plain LLM': 0, 'MongoDB RAG': 0, 'Neo4j KG RAG': 0 },
      { subject: 'Completeness', 'Plain LLM': 0, 'MongoDB RAG': 0, 'Neo4j KG RAG': 0 },
      { subject: 'Coherence', 'Plain LLM': 0, 'MongoDB RAG': 0, 'Neo4j KG RAG': 0 },
      { subject: 'Helpfulness', 'Plain LLM': 0, 'MongoDB RAG': 0, 'Neo4j KG RAG': 0 }
    ];

    ['plain_llm', 'mongodb_rag', 'neo4j_kg_rag'].forEach(type => {
      const stat = modelStats[type];
      const name = stat.name as 'Plain LLM' | 'MongoDB RAG' | 'Neo4j KG RAG';
      if (stat.count > 0) {
        rData[0][name] = stat.factual / stat.count;
        rData[1][name] = stat.completeness / stat.count;
        rData[2][name] = stat.coherence / stat.count;
        rData[3][name] = stat.helpfulness / stat.count;
      }
    });

    // Format Automated Data
    const aData = Object.values(modelStats)
      .filter(s => s.count > 0)
      .map(s => ({
        name: s.name,
        BLEU: Number((s.bleu / s.count).toFixed(4)),
        ROUGE: Number((s.rouge / s.count).toFixed(4))
      }));

    return {
      avgMetrics: {
        human: totalHumanCount ? (totalHuman / totalHumanCount).toFixed(2) : '0.00',
        bleu: automatedCount ? (totalBleu / automatedCount).toFixed(4) : '0.0000',
        rouge: automatedCount ? (totalRouge / automatedCount).toFixed(4) : '0.0000'
      },
      radarData: rData,
      automatedData: aData
    };
  }, [filtered]);

  // Export ONLY a single session
  const handleExportSession = (sessionData: MetricEntry) => {
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session_${sessionData.session_id.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 animate-in fade-in duration-500">

      {/* Header Section */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl border border-bright-blue/20 bg-white/50 backdrop-blur-md shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-bright-blue via-primary to-bright-purple bg-clip-text text-transparent">
            System Metrics & Analytics
          </h2>
          <p className="text-sm text-text-muted mt-1 font-medium">Evaluating LLM and RAG performance across human and automated benchmarks.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'table' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Raw Data
            </button>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="glass-card grid grid-cols-1 gap-6 rounded-3xl border border-medium-gray/30 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="flex-1 min-w-0 sm:min-w-[200px]">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Model Architecture</label>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all hover:border-bright-blue focus:border-bright-blue focus:ring-2 focus:ring-bright-blue/20 cursor-pointer"
          >
            <option value="all">All Models</option>
            <option value="plain_llm">Plain LLM</option>
            <option value="mongodb_rag">MongoDB Vector RAG</option>
            <option value="neo4j_kg_rag">Neo4j Knowledge Graph RAG</option>
          </select>
        </div>

        <div className="flex-1 min-w-0 sm:min-w-[250px]">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Minimum Human Rating (Avg)</label>
          <div className="w-full overflow-x-auto">
            <div className="inline-flex min-w-max items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 shadow-sm whitespace-nowrap">
              {[0, 1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${star === 0
                    ? minRating === 0 ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200'
                    : star <= minRating ? 'bg-amber-400 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-200'
                    }`}
                  onClick={() => setMinRating(star)}
                >
                  {star === 0 ? 'Any' : '★ ' + star}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-center px-1 sm:px-2 lg:items-end lg:px-4">
          <span className="text-3xl font-extrabold text-slate-800">{filtered.length}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Queries matching</span>
        </div>
      </section>

      {isLoading && (
        <div className="p-10 flex justify-center rounded-3xl border border-bright-indigo/30 bg-gradient-to-br from-bright-indigo/5 to-bright-indigo/10">
          <LoadingSpinner label="Compiling analytics..." />
        </div>
      )}

      {error && (
        <div className="p-6 rounded-3xl border border-error/30 bg-gradient-to-br from-error/5 to-error/10">
          <ErrorState message={error.message} />
        </div>
      )}

      {/* DASHBOARD TAB */}
      {!isLoading && !error && activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100 shadow-sm transform hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-amber-800 text-sm font-bold uppercase tracking-wider mb-2">Avg Overall Human Rating</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-amber-500">{avgMetrics.human}</span>
                <span className="text-amber-700/60 font-medium mb-1">/ 5.0</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100 shadow-sm transform hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-blue-800 text-sm font-bold uppercase tracking-wider mb-2">Avg BLEU Score</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-blue-500">{avgMetrics.bleu}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100 shadow-sm transform hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-purple-800 text-sm font-bold uppercase tracking-wider mb-2">Avg ROUGE-L Score</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-purple-500">{avgMetrics.rouge}</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-amber-400 rounded-full"></span>
                Human Evaluation Breakdown
              </h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8' }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Radar name="Plain LLM" dataKey="Plain LLM" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Radar name="MongoDB RAG" dataKey="MongoDB RAG" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Radar name="Neo4j KG RAG" dataKey="Neo4j KG RAG" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                Automated Text Quality (BLEU / ROUGE-L)
              </h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={automatedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="BLEU" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="ROUGE" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAW DATA TABLE TAB */}
      {!isLoading && !error && activeTab === 'table' && (
        <div className="max-h-[600px] overflow-auto rounded-3xl border border-slate-200 bg-white shadow-sm animate-in slide-in-from-bottom-4 duration-500">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Query ID / Query</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Architecture</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs min-w-[200px]">Human Ratings Breakdown</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Automated Metrics</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry, idx) => {
                const r = entry.human_ratings;
                const automated = entry.calculated_metrics;
                const modelMetrics = automated?.[entry.model_type];

                const modelStyles = entry.model_type === 'plain_llm'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : entry.model_type === 'mongodb_rag'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200';

                return (
                  <tr key={entry.session_id + entry.model_type + idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 max-w-[250px]">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                          {entry.session_id}
                        </span>
                        <span className="text-slate-700 font-medium truncate" title={entry.query}>
                          {entry.query}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap ${modelStyles}`}>
                        {entry.model_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between bg-slate-100 px-2 py-1 rounded">
                            <span className="text-slate-500 font-medium">Factual:</span>
                            <span className="font-bold text-slate-800">{r.factual_accuracy}/5</span>
                          </div>
                          <div className="flex justify-between bg-slate-100 px-2 py-1 rounded">
                            <span className="text-slate-500 font-medium">Complete:</span>
                            <span className="font-bold text-slate-800">{r.completeness}/5</span>
                          </div>
                          <div className="flex justify-between bg-slate-100 px-2 py-1 rounded">
                            <span className="text-slate-500 font-medium">Coherent:</span>
                            <span className="font-bold text-slate-800">{r.coherence}/5</span>
                          </div>
                          <div className="flex justify-between bg-slate-100 px-2 py-1 rounded">
                            <span className="text-slate-500 font-medium">Helpful:</span>
                            <span className="font-bold text-slate-800">{r.helpfulness}/5</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {modelMetrics ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap">
                            BLEU: {modelMetrics.bleu.toFixed(4)}
                          </span>
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap">
                            ROUGE: {modelMetrics.rouge_l.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleExportSession(entry)}
                        className="p-2 bg-white border border-slate-200 text-primary rounded-lg hover:bg-slate-50 hover:border-primary/50 transition-all shadow-sm flex items-center justify-center ml-auto"
                        title="Export Session JSON"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={5}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl mb-2">📊</span>
                      <span className="font-medium text-lg">No metrics found</span>
                      <span className="text-sm opacity-70">Adjust your filters to see more results.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MetricsPage;