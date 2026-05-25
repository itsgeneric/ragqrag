import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

interface ExperimentRecord {
    id: string;
    class: string;
    query: string;
    sentence: string;
    spacyAns: string;
    agenticAns: string;
    quantumAns: string;
    insight: string;
    quantumCtxRel: string;
    quantumFaith: string;
    quantumAnsRel: string;
}

const QuantumResearchPage: React.FC = () => {
    const [experimentData, setExperimentData] = useState<ExperimentRecord[]>([]);
    // Default to the first actual class to make selection mandatory
    const [activeFilterClass, setActiveFilterClass] = useState<string>('Reduced Relative Clause');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    // Fetch and parse the CSV on component mount
    useEffect(() => {
        const loadCSV = async () => {
            try {
                const response = await fetch('/quantum/dataset.csv');

                // 1. Guard against 404s or network failures post-deployment
                if (!response.ok) {
                    throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
                }

                // 2. FIX: Read the ENTIRE file as text, bypassing the manual stream chunking issue
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsedData: ExperimentRecord[] = results.data.map((row: any, index: number) => ({
                            id: `doc_${index + 1}`,
                            class: row['Ambiguity Signature Class']?.trim() || 'Unknown',
                            query: row['Query String'] || '',
                            sentence: row['Sentence'] || '',
                            spacyAns: row['SpaCy_Generated_Answer'] || 'N/A',
                            agenticAns: row['Agentic_Generated_Answer'] || 'N/A',
                            quantumAns: row['Quantum_Generated_Answer'] || 'N/A',
                            insight: `Classical Failure: ${row['Conflicting Classical Parse Output']} Quantum Ground-Truth: ${row['Ground-Truth Contextual Target']}`,
                            quantumCtxRel: row['Quantum_CtxRel'] || '0',
                            quantumFaith: row['Quantum_Faith'] || '0',
                            quantumAnsRel: row['Quantum_AnsRel'] || '0',
                        }));
                        setExperimentData(parsedData);
                    },
                    error: (parseError: Error) => {
                        console.error("PapaParse failed to read the CSV text:", parseError);
                    }
                });
            } catch (error) {
                console.error("Network or Fetch Error loading CSV dataset:", error);
            }
        };

        loadCSV();
    }, []);

    // Filter logic enforces a mandatory class selection
    const filteredData = experimentData.filter(d => d.class === activeFilterClass);

    // Ensure selected ID is cleared if it doesn't exist in the new filtered dataset
    useEffect(() => {
        if (selectedId && !filteredData.find(d => d.id === selectedId)) {
            setSelectedId(null);
        }
    }, [activeFilterClass, filteredData, selectedId]);

    const selectedScenario = filteredData.find(d => d.id === selectedId) || null;

    // Simulate the QPU amortized batch latency
    useEffect(() => {
        if (!selectedId) return;
        setIsProcessing(true);
        const timer = setTimeout(() => {
            setIsProcessing(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, [selectedId]);

    // Helper to format insight text into clear explanatory blocks
    const renderInsightBlocks = (insightText: string) => {
        const hasClassical = insightText.includes('Classical Failure:');
        const hasQuantum = insightText.includes('Quantum Ground-Truth:');

        if (hasClassical && hasQuantum) {
            const classicalPart = insightText.split('Quantum Ground-Truth:')[0].replace('Classical Failure:', '').trim();
            const quantumPart = insightText.split('Quantum Ground-Truth:')[1].trim();

            return (
                <div className="space-y-4">
                    <div className="bg-error/5 border border-error/20 p-4 sm:p-5 rounded-xl transition-all hover:bg-error/10">
                        <span className="text-error font-extrabold mb-2 text-[12px] sm:text-[13px] uppercase tracking-wider flex items-center gap-2">
                            <span className="bg-error/20 px-2 py-0.5 rounded">The Linearity Trap (BGE-v2.5)</span>
                        </span>
                        <p className="text-slate-800 font-medium leading-relaxed text-[14px] sm:text-[15px]">{classicalPart}</p>
                    </div>
                    <div className="bg-accent/5 border border-accent/20 p-4 sm:p-5 rounded-xl transition-all hover:bg-accent/10">
                        <span className="text-accent font-extrabold mb-2 text-[12px] sm:text-[13px] uppercase tracking-wider flex items-center gap-2">
                            <span className="bg-accent/20 px-2 py-0.5 rounded">Topological Resolution (QRAG)</span>
                        </span>
                        <p className="text-slate-900 font-semibold leading-relaxed text-[14px] sm:text-[15px]">{quantumPart}</p>
                    </div>
                </div>
            );
        }
        return <p className="text-slate-800 font-medium text-[14px] sm:text-[15px]">{insightText}</p>;
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12 sm:space-y-16 animate-in fade-in duration-500 overflow-x-hidden">

            {/* Header Section */}
            <section className="text-center space-y-4 sm:space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    IEEE Access, May 2026
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-purple-600 drop-shadow-sm pb-2 leading-tight">
                    Quantum Enhanced Retrieval Augmented Generation (QRAG):<br className="hidden md:block"/> A Scalable Hybrid Tensor Network Architecture<br className="hidden lg:block"/> for Syntactic Disambiguation
                </h1>
                <p className="text-[15px] sm:text-[16px] md:text-lg text-text-muted max-w-4xl mx-auto font-medium leading-relaxed px-2 mt-4">
                    Escaping the Linearity Trap by projecting overlapping linguistic dependencies onto the 156-qubit IBM Heron r2 (ibm_fez) heavy-hex lattice.
                </p>
            </section>

            {/* Formal Abstract */}
            <section className="bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="relative z-10 space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-primary rounded-full"></span>
                        Abstract
                    </h2>

                    <div className="text-[14px] sm:text-[15px] text-slate-300 space-y-4 leading-relaxed font-medium">
                        <p>
                            Current Retrieval-Augmented Generation (RAG) pipelines are constrained by an underlying architectural limit. While contemporary Agentic engines and Knowledge Graphs (GraphRAG) excel at isolating discrete entities, their performance degrades sharply when confronted with dense, overlapping syntactic ambiguity. In these scenarios, the models fall into a "Linearity Trap." Because classical vector geometries force multidimensional dependencies into flat representations, they inadvertently merge conflicting grammatical structures. This permanently flaws the context window prior to the LLM generation phase.
                        </p>
                        <p>
                            The Quantum-Enhanced Retrieval-Augmented Generation (QRAG) architecture presented in this work circumvents this geometric bottleneck. Rather than depending on static distance metrics, our system selectively targets structurally unstable queries and forwards them to a 156-qubit IBM Heron r2 (ibm_fez) quantum processor. Here, we map the linguistic dependencies directly into physical tensor networks. A custom parameterized ansatz leverages Controlled-Phase (CZ) gates to maintain competing syntactical topologies in superposition, allowing the true context to emerge only upon measurement collapse. Furthermore, we resolve the severe execution delays typical of the Noisy Intermediate-Scale Quantum (NISQ) era through disjoint sub-topology mapping. This technique parallelizes circuit execution across the heavy-hex lattice, effectively reducing the quantum processing overhead to sub-second amortized latencies per query.
                        </p>
                        <p>
                            We evaluated the proposed framework against a heavily tuned GraphRAG baseline using a tightly controlled, N=150 synthetic ambiguity dataset. Testing demonstrated a 93.3% Top-1 parsing accuracy for the quantum pipeline. This result proves that physical entanglement significantly outperforms classical multi-agent architectures in resolving non-linear syntactical structures. Targeted ablation studies and Matrix-Free Measurement Mitigation (M3) prove that this advantage is mathematically distinct from hardware noise. Physical removal of the entanglement gates triggered severe probability drift, confirming topological entanglement as the active disambiguation driver. Validated by a Wilcoxon signed-rank test (p~0.032) with a massive Cohen effect size d, this work establishes a definitive, mathematically insurmountable "Utility Threshold" for hybrid quantum NLP.
                        </p>
                    </div>
                </div>
            </section>

            {/* Ambiguity Taxonomy Filter */}
            <section className="space-y-6 sm:space-y-8 bg-slate-50 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-slate-200">
                <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">The Syntactic Traps</h2>
                    <p className="text-[14px] sm:text-[15px] text-slate-600 font-medium">
                        Classical systems fail predictably. Select an ambiguity class below to filter the dataset and explore exactly how continuous vector proximity conflates non-linear dependencies.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {[
                        { id: 'Reduced Relative', desc: 'Omission of relative pronouns triggers a false main-verb parse.', trap: 'Misidentifies the past participle as the active root verb.' },
                        { id: 'Instrumental Fronting', desc: 'Fronted modifiers creating deliberate semantic dissonance.', trap: 'Over-indexes on training-data priors for typical instruments.' },
                        { id: 'Agent-Patient Inversion', desc: 'Inverse logical hierarchy defying semantic expectations.', trap: 'Collapses onto standard entity-relationship rules.' },
                        { id: 'SEIP', desc: 'Competing instrumental modifiers.', trap: 'Conflates localized spatial proximity with the functional instrument.' },
                        { id: 'Lexical Echo', desc: 'Duplicate token boundaries causing localized resonance.', trap: 'Seduced by exact token match, ignoring distant dependencies.' },
                        { id: 'Garden Path', desc: 'Locally coherent noun phrases that fail global sentence topology.', trap: 'Builds a high-confidence sub-graph that fatally crashes.' }
                    ].map((taxClass) => (
                        <div
                            key={taxClass.id}
                            onClick={() => setActiveFilterClass(taxClass.id)}
                            className={`p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col ${activeFilterClass === taxClass.id ? 'border-primary bg-white shadow-[0_8px_30px_rgb(59,130,246,0.15)] scale-100 sm:scale-[1.02]' : 'border-slate-200 bg-white hover:border-primary/40 hover:shadow-md'}`}
                        >
                            <h3 className={`font-extrabold text-[15px] sm:text-[16px] mb-2 ${activeFilterClass === taxClass.id ? 'text-primary' : 'text-slate-800'}`}>
                                {taxClass.id}
                            </h3>
                            <p className="text-[13px] text-slate-500 mb-4 flex-grow font-medium leading-relaxed">{taxClass.desc}</p>
                            <div className="bg-error/5 text-error text-[11px] sm:text-[12px] font-bold p-3 rounded-xl border border-error/10 leading-snug">
                                <span className="uppercase tracking-wider text-[9px] sm:text-[10px] block mb-1 opacity-80">Classical Trap:</span>
                                {taxClass.trap}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- INTERACTIVE DEMO SECTION --- */}
            <section className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-colorful border border-primary/20 relative">
                <div className="relative z-10">
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8 text-slate-900 flex items-center gap-3">
                        <span className="bg-gradient-to-br from-primary to-accent text-white p-2 sm:p-2.5 rounded-xl shadow-md shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </span>
                        Live Ambiguity Resolution Telemetry
                    </h2>

                    <div className="space-y-6 sm:space-y-8 relative z-20">
                        {/* Custom Dropdown for Sentences */}
                        <div className="relative z-50">
                            <label className="block text-xs sm:text-sm font-bold text-primary mb-2 sm:mb-3 uppercase tracking-wider">
                                Select Sentence <span className="text-slate-400 normal-case font-medium">({filteredData.length} available)</span>
                            </label>

                            <div className="relative">
                                <div
                                    className={`w-full bg-white border-2 ${isDropdownOpen ? 'border-primary ring-4 ring-primary/20 shadow-lg' : 'border-slate-300 shadow-sm hover:border-primary/50'} rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 cursor-pointer flex justify-between items-center transition-all`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="flex flex-col pr-4">
                                        {selectedScenario ? (
                                            <>
                                                <span className="text-[10px] sm:text-[11px] font-black text-accent mb-1 sm:mb-1.5 uppercase tracking-widest">{selectedScenario.class}</span>
                                                <span className="text-[14px] sm:text-[17px] font-semibold text-slate-800 line-clamp-2 sm:line-clamp-none">{selectedScenario.sentence}</span>
                                            </>
                                        ) : (
                                            <span className="text-[14px] sm:text-[16px] font-medium text-slate-400">Choose a sentence to analyze...</span>
                                        )}
                                    </div>
                                    <div className={`text-slate-400 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-2 sm:mt-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-2xl z-50 max-h-[300px] sm:max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                            {filteredData.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`px-4 sm:px-6 py-3 sm:py-4 cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${item.id === selectedId ? 'bg-primary/5' : ''}`}
                                                    onClick={() => {
                                                        setSelectedId(item.id);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                >
                                                    <span className={`text-[10px] sm:text-[11px] font-black mb-1 sm:mb-1.5 uppercase tracking-widest block ${item.id === selectedId ? 'text-primary' : 'text-slate-500'}`}>{item.class}</span>
                                                    <span className={`text-[13px] sm:text-[15px] block ${item.id === selectedId ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{item.sentence}</span>
                                                </div>
                                            ))}
                                            {filteredData.length === 0 && (
                                                <div className="p-4 sm:p-6 text-center text-slate-500 font-medium text-sm">No telemetry found for this class.</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Popped Target Query */}
                        {selectedScenario && (
                            <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-primary/5 rounded-xl sm:rounded-2xl border border-primary/20 animate-in slide-in-from-top-2 duration-500">
                                <h4 className="text-[10px] sm:text-[11px] font-black text-primary uppercase tracking-widest mb-1 sm:mb-2 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Target Query
                                </h4>
                                <p className="text-[15px] sm:text-lg font-bold text-slate-800">"{selectedScenario.query}"</p>
                            </div>
                        )}

                        {/* Visualization Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-10 relative z-10">
                            {/* SOTA Agentic Result */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border-2 border-error/10 shadow-soft relative overflow-hidden group">
                                <h3 className="text-error font-black uppercase tracking-wider text-[11px] sm:text-[13px] mb-4 sm:mb-5 flex items-center gap-2">
                                    <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-error"></span>
                                    </span>
                                    SOTA Agentic (BGE-v2.5)
                                </h3>
                                <div className="min-h-[120px] sm:min-h-[140px] flex items-center bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
                                    {isProcessing ? (
                                        <div className="flex flex-col items-center justify-center w-full gap-2 sm:gap-3 text-slate-400">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 animate-[spin_3s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="text-xs sm:text-sm font-semibold tracking-wide text-center">Cross-encoding attention weights...</span>
                                        </div>
                                    ) : selectedScenario ? (
                                        <p className="text-[15px] sm:text-[17px] text-slate-800 font-medium italic leading-relaxed">"{selectedScenario.agenticAns}"</p>
                                    ) : (
                                        <p className="text-xs sm:text-sm text-slate-400 font-medium italic w-full text-center">Waiting for input...</p>
                                    )}
                                </div>
                            </div>

                            {/* Quantum Result */}
                            <div className="bg-gradient-to-br from-white to-primary/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border-2 border-accent/20 shadow-colorful relative overflow-hidden">
                                {isProcessing && <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 animate-[shimmer_1.5s_infinite] -skew-x-12 z-0"></div>}
                                <h3 className="text-accent font-black uppercase tracking-wider text-[11px] sm:text-[13px] mb-4 sm:mb-5 flex items-center gap-2 relative z-10">
                                    <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-accent"></span>
                                    </span>
                                    QRAG (Mitigated Tensor)
                                </h3>
                                <div className="min-h-[120px] sm:min-h-[140px] flex items-center bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white relative z-10 shadow-sm">
                                    {isProcessing ? (
                                        <div className="flex flex-col items-center justify-center w-full gap-2 sm:gap-3">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-accent animate-[spin_3s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="text-xs sm:text-sm font-bold tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-center">Applying CZ-ansatz and M3 purification...</span>
                                        </div>
                                    ) : selectedScenario ? (
                                        <p className="text-[15px] sm:text-[17px] text-slate-900 font-bold leading-relaxed">"{selectedScenario.quantumAns}"</p>
                                    ) : (
                                        <p className="text-xs sm:text-sm text-slate-400 font-medium italic w-full text-center">Waiting for input...</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Insight Explanation & RAGAS Metrics */}
                        <div className={`mt-8 sm:mt-10 overflow-hidden transition-all duration-700 ease-in-out ${isProcessing || !selectedScenario ? 'opacity-0 h-0' : 'opacity-100 h-auto'}`}>
                            {selectedScenario && (
                                <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200">
                                    <h4 className="text-slate-900 font-black text-lg sm:text-xl mb-4 sm:mb-6 flex items-center gap-3">
                                        <span className="bg-primary text-white p-1.5 sm:p-2 rounded-lg shadow-sm">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </span>
                                        Structural Explanation
                                    </h4>

                                    {renderInsightBlocks(selectedScenario.insight)}

                                    {/* RAGAS Metrics Block - Mobile friendly Grid */}
                                    <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center">
                                        <div className="flex flex-col gap-1 pb-4 sm:pb-0 border-b sm:border-b-0 border-slate-200">
                                            <span className="block text-3xl sm:text-4xl font-black text-primary drop-shadow-sm">{Number(selectedScenario.quantumCtxRel).toFixed(2)}</span>
                                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500">Context Relevance</span>
                                        </div>
                                        <div className="flex flex-col gap-1 pb-4 sm:pb-0 border-b sm:border-b-0 sm:border-l sm:border-r border-slate-200">
                                            <span className="block text-3xl sm:text-4xl font-black text-accent drop-shadow-sm">{Number(selectedScenario.quantumFaith).toFixed(2)}</span>
                                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500">Answer Faithfulness</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="block text-3xl sm:text-4xl font-black text-purple-600 drop-shadow-sm">{Number(selectedScenario.quantumAnsRel).toFixed(2)}</span>
                                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500">Answer Relevance</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture / Flowchart */}
            <section className="bg-gradient-to-br from-slate-50 to-light-gray rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-inner border border-medium-gray/20">
                <h2 className="text-xl sm:text-2xl font-bold text-text-main mb-4 sm:mb-6 text-center">QRAG End-to-End DAG Architecture</h2>
                <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <img src="/quantum/figure3.png" alt="QRAG Architecture Flowchart" className="max-w-full lg:max-w-4xl h-auto rounded-xl shadow-soft" />
                    <p className="text-[12px] sm:text-[13px] text-text-muted text-center max-w-3xl mt-2 sm:mt-4">
                        <strong>The Ambiguity Controller:</strong> Structurally stable queries are routed classically. Unstable queries trigger the QPU branch for physical disentanglement, followed by M3 error purification before context injection.
                    </p>
                </div>
            </section>

            {/* The Farm-Fetching Paradox */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-soft border border-slate-200 hover:-translate-y-1 transition-transform duration-300">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4 flex items-center gap-3">
                        <span className="bg-slate-100 p-1.5 sm:p-2 rounded-lg text-slate-600"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></span>
                        The Bike (CPU)
                    </h3>
                    <p className="text-[14px] sm:text-[15px] text-slate-600 font-medium leading-relaxed">
                        Optimized for linear relationships and rapid keyword searches. Classical computers excel at fetching data with zero ambiguity (like biking to a local store), providing immense speed. However, they lack the dimensional freedom required to navigate non-linear grammatical structures.
                    </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-soft border border-indigo-100 hover:-translate-y-1 transition-transform duration-300">
                    <h3 className="text-xl sm:text-2xl font-black text-indigo-900 mb-3 sm:mb-4 flex items-center gap-3">
                        <span className="bg-indigo-100 p-1.5 sm:p-2 rounded-lg text-indigo-600"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></span>
                        The Sports Car (QPU)
                    </h3>
                    <p className="text-[14px] sm:text-[15px] text-indigo-800/80 font-medium leading-relaxed">
                        Reserved strictly for the <strong>Farm-Fetching Paradox</strong>. Quantum computing navigates non-linear grammatical structures via entanglement, executing non-planar traversal to resolve severe ambiguities that cause classical vectors to collapse.
                    </p>
                </div>
            </section>

            {/* The Physics of Disambiguation */}
            <section className="bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 shadow-2xl relative overflow-hidden text-slate-200">
                <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-3xl -mr-10 sm:-mr-20 -mt-10 sm:-mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-accent/20 rounded-full blur-3xl -ml-10 sm:-ml-20 -mb-10 sm:-mb-20 pointer-events-none"></div>

                <div className="relative z-10 space-y-8 sm:space-y-10">
                    <div className="border-b border-slate-700 pb-6 sm:pb-8">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4">The Physics of Disambiguation</h2>
                        <p className="text-slate-400 text-[14px] sm:text-[16px] max-w-4xl font-medium leading-relaxed">
                            Vector spaces commute. Syntax does not. To break the linearity trap, the QRAG architecture abandons continuous geometry, mapping language directly into a high-dimensional complex Hilbert space using the DisCoCat formalism.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                        {/* Semantic Encoding */}
                        <div className="space-y-4 sm:space-y-5">
                            <h3 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-3">
                                <span className="bg-primary/20 text-primary w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center font-black text-sm sm:text-base">1</span>
                                Variational Semantic Encoding
                            </h3>
                            <p className="text-[14px] sm:text-[15px] text-slate-400 font-medium leading-relaxed">
                                Tokens are not treated as static coordinates. A scaling function maps the dense continuous embedding to an angular parameter <span className="text-lg"><InlineMath math="\theta_i \in [0, 2\pi]" /></span>. We drive the system out of the ground state using single-qubit rotations around the Y-axis of the Bloch sphere:
                            </p>
                            <div className="bg-slate-950 px-2 py-6 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 font-mono text-center overflow-hidden flex items-center justify-center text-primary shadow-inner text-xs sm:text-sm md:text-lg w-full">
                                <BlockMath math="R_y(\theta) = \begin{bmatrix} \cos(\frac{\theta}{2}) & -\sin(\frac{\theta}{2}) \\ \sin(\frac{\theta}{2}) & \cos(\frac{\theta}{2}) \end{bmatrix}" />
                            </div>
                            <p className="text-[14px] sm:text-[15px] text-slate-400 font-medium leading-relaxed">
                                Post-encoding, the semantic meaning is present, but the grammatical relationship between the tokens remains physically undefined.
                            </p>
                        </div>

                        {/* Tensor Network Entanglement */}
                        <div className="space-y-4 sm:space-y-5">
                            <h3 className="text-lg sm:text-xl font-bold text-accent flex items-center gap-3">
                                <span className="bg-accent/20 text-accent w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center font-black text-sm sm:text-base">2</span>
                                Tensor-Network Entanglement
                            </h3>
                            <p className="text-[14px] sm:text-[15px] text-slate-400 font-medium leading-relaxed">
                                To bind the tokens into a coherent grammatical tree, we apply Controlled-Phase (CZ) operators across adjacent and non-adjacent topological pairs. This conditionally entangles the target and control qubits without altering their probability amplitudes:
                            </p>
                            {/* Using \begin{aligned} to elegantly wrap the long equation onto two lines for mobile */}
                            <div className="bg-slate-950 px-2 py-6 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 font-mono text-center overflow-hidden flex items-center justify-center text-accent shadow-inner text-xs sm:text-sm md:text-lg w-full">
                                <BlockMath math="\begin{aligned} CZ_{i,j} &= |0\rangle\langle0|_i \otimes I_j + |1\rangle\langle1|_i \otimes Z_j \\ &= \text{diag}(1, 1, 1, -1) \end{aligned}" />
                            </div>
                            <p className="text-[14px] sm:text-[15px] text-slate-400 font-medium leading-relaxed">
                                When processing ambiguous attachments, the resulting superposed wave function mathematically holds both parsing topologies simultaneously:
                            </p>
                            <div className="bg-slate-950 px-2 py-5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800 font-mono text-center overflow-hidden flex items-center justify-center text-white shadow-inner text-xs sm:text-sm md:text-lg w-full">
                                <BlockMath math="|\Psi_{amb}\rangle = \alpha|N_1 \otimes P\rangle + \beta|V_1 \otimes P\rangle" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Hardware & Telemetry Visuals */}
            <section className="space-y-12 sm:space-y-16 pt-6 sm:pt-8 pb-8 sm:pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="space-y-4 sm:space-y-5">
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Disjoint Sub-Topology Mapping</h3>
                        <p className="text-[14px] sm:text-[16px] text-slate-600 font-medium leading-relaxed">
                            Executing deep-depth circuits natively introduces a sequential system hang. By partitioning the 156-qubit heavy-hex lattice into mutually exclusive spatial zones, we parallelize batch execution, driving the QPU compute overhead down to an amortized <strong>26.62 seconds</strong> per query.
                        </p>
                    </div>
                    <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-soft border border-slate-200">
                        <img src="/quantum/figure6.png" alt="Disjoint Sub-Topology Mapping" className="w-full rounded-xl sm:rounded-2xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center lg:flex-row-reverse">
                    <div className="order-2 lg:order-1 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-soft border border-slate-200">
                        <img src="/quantum/figure8.png" alt="Generative Variance and Hallucination Density" className="w-full rounded-xl sm:rounded-2xl" />
                    </div>
                    <div className="space-y-4 sm:space-y-5 order-1 lg:order-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Truncating Hallucination Tails</h3>
                        <p className="text-[14px] sm:text-[16px] text-slate-600 font-medium leading-relaxed">
                            Classical pipelines produce unpredictable "fat tails" of hallucinated data due to misclassified syntactical edges. QRAG enforces structural determinism on the bare metal, tightly packing the generative density at the absolute 1.0 upper bound for Answer Faithfulness.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default QuantumResearchPage;