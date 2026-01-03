
import React, { useState, useEffect, useRef } from 'react';
import { analyzeProjectPlan } from './services/geminiService';
import { AuditReport, RiskLevel, AuditHistoryItem } from './types';
import { RiskMeter } from './components/RiskMeter';
import { RiskTrendChart } from './components/RiskTrendChart';
import { Sidebar } from './components/Sidebar';
import { SAMPLE_PLAN } from './components/SamplePlan';
import { 
  AlertTriangle, CheckCircle, Info, Send, RefreshCcw, 
  FileText, ShieldAlert, AlertCircle, ShieldEllipsis, TrendingUp, Tag,
  Menu, X
} from 'lucide-react';

const KEYWORDS = ['Objective', 'Timeline', 'Tasks', 'Team', 'Budget', 'Project', 'Constraint', 'Goal', 'Risk', 'Owner'];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [projectName, setProjectName] = useState('');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrends, setShowTrends] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeAuditId, setActiveAuditId] = useState<string | undefined>();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('projectlens_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Synchronize scrolling between textarea and backdrop
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const renderHighlightedText = (text: string) => {
    if (!text) return '';
    
    // Escape HTML and handle newlines
    let highlighted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n$/g, '\n\n'); // Ensures trailing newlines render correctly

    // Match keywords (case-insensitive, at start of word/line or after colon)
    const regex = new RegExp(`\\b(${KEYWORDS.join('|')}):?`, 'gi');
    
    return highlighted.replace(regex, (match) => {
      return `<span class="text-indigo-600 font-bold bg-indigo-50/50 rounded px-0.5 border-b border-indigo-200">${match}</span>`;
    });
  };

  const handleAudit = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    setActiveAuditId(undefined);

    try {
      const result = await analyzeProjectPlan(input);
      setReport(result);
      
      const finalName = projectName.trim() || result.suggestedProjectName || `Audit ${new Date().toLocaleDateString()}`;
      const auditId = crypto.randomUUID();
      
      const newHistoryItem: AuditHistoryItem = {
        id: auditId,
        timestamp: Date.now(),
        riskLevel: result.riskLevel,
        projectName: finalName,
        report: result,
        plan: input
      };
      
      const updatedHistory = [...history, newHistoryItem];
      setHistory(updatedHistory);
      setActiveAuditId(auditId);
      localStorage.setItem('projectlens_history', JSON.stringify(updatedHistory));
      
      if (!projectName.trim()) {
        setProjectName(result.suggestedProjectName);
      }
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear entire audit history? This cannot be undone.")) {
      setHistory([]);
      localStorage.removeItem('projectlens_history');
      setActiveAuditId(undefined);
    }
  };

  const handleDeleteAudit = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('projectlens_history', JSON.stringify(updatedHistory));
    if (activeAuditId === id) {
      setReport(null);
      setInput('');
      setProjectName('');
      setActiveAuditId(undefined);
    }
  };

  const handleSelectAudit = (item: AuditHistoryItem) => {
    setReport(item.report);
    setInput(item.plan);
    setProjectName(item.projectName);
    setActiveAuditId(item.id);
    setShowTrends(false);
  };

  const handleExportCSV = () => {
    if (history.length === 0) {
      alert("No history to export.");
      return;
    }

    const headers = ["Date", "Project Name", "Risk Level", "Justification"];
    const rows = history.map(item => [
      new Date(item.timestamp).toLocaleString(),
      item.projectName,
      item.riskLevel,
      item.report.riskJustification
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `projectlens_full_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSample = () => {
    setProjectName('');
    setInput(SAMPLE_PLAN);
  };

  const reset = () => {
    setReport(null);
    setInput('');
    setProjectName('');
    setActiveAuditId(undefined);
  };

  const getRiskStyles = (severity: RiskLevel) => {
    switch (severity) {
      case RiskLevel.High:
        return {
          icon: <ShieldAlert className="text-red-500" size={20} />,
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800'
        };
      case RiskLevel.Medium:
        return {
          icon: <AlertCircle className="text-amber-500" size={20} />,
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800'
        };
      case RiskLevel.Low:
        return {
          icon: <ShieldEllipsis className="text-emerald-500" size={20} />,
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800'
        };
      default:
        return {
          icon: <Info className="text-slate-500" size={20} />,
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
          badge: 'bg-slate-100 text-slate-800'
        };
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans antialiased text-slate-900">
      {/* History Sidebar */}
      {isSidebarOpen && (
        <Sidebar 
          history={history} 
          onSelect={handleSelectAudit} 
          onDelete={handleDeleteAudit} 
          onClose={() => setIsSidebarOpen(false)}
          activeId={activeAuditId}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navigation Bar */}
        <nav className="bg-slate-900 text-white h-16 flex-shrink-0 flex items-center justify-between px-6 z-10 shadow-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              title={isSidebarOpen ? "Hide History" : "Show History"}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-indigo-400 w-6 h-6" />
              <h1 className="leading-tight">
                <span className="block text-xl font-bold tracking-tight text-white">ProjectLens</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Expert Risk Analysis</span>
              </h1>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setShowTrends(!showTrends)}
              className={`text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-semibold ${
                showTrends ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <TrendingUp size={16} /> Trends
            </button>
            {!report ? (
              <button 
                onClick={handleSample}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Try Sample
              </button>
            ) : (
              <button 
                onClick={reset}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20 active:scale-95"
              >
                <RefreshCcw size={16} /> New Analysis
              </button>
            )}
          </div>
        </nav>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            
            {showTrends && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <RiskTrendChart 
                  history={history} 
                  onClear={handleClearHistory} 
                  onExport={handleExportCSV}
                />
              </div>
            )}

            {!report ? (
              <section className="space-y-6 animate-in fade-in duration-700">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <FileText size={24} className="text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Project Audit Form</h2>
                      <p className="text-sm text-slate-500">Define your project parameters for failure-point analysis.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="projectName" className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                        <Tag size={12} className="text-indigo-400" />
                        Project Identity
                      </label>
                      <input
                        id="projectName"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Leave blank for auto-generated name..."
                        className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-sans text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="projectPlan" className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                        <FileText size={12} className="text-indigo-400" />
                        Scope & Execution Details
                      </label>
                      
                      {/* Highlighted Textarea Wrapper */}
                      <div className="relative h-80 w-full group">
                        {/* Backdrop layer for highlighting */}
                        <div
                          ref={backdropRef}
                          className="absolute inset-0 p-5 rounded-xl border-2 border-transparent bg-white text-transparent pointer-events-none overflow-auto font-sans text-sm leading-relaxed whitespace-pre-wrap break-words"
                          aria-hidden="true"
                          dangerouslySetInnerHTML={{ __html: renderHighlightedText(input) }}
                        />
                        {/* Interactive Textarea layer */}
                        <textarea
                          ref={textareaRef}
                          id="projectPlan"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onScroll={handleScroll}
                          placeholder="Detail your goals, ownership, timeline, and dependencies..."
                          className="absolute inset-0 w-full h-full p-5 rounded-xl border-2 border-slate-100 bg-transparent text-slate-900 caret-indigo-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-sans text-sm leading-relaxed resize-none overflow-auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                    <div className="flex gap-2">
                      <div className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-full uppercase tracking-tighter">AI Analysis</div>
                      <div className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-full uppercase tracking-tighter">Risk Assessment</div>
                    </div>
                    <button
                      onClick={handleAudit}
                      disabled={isLoading || !input.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-indigo-200 flex items-center gap-3 transition-all active:scale-95 group"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                          Running Audit...
                        </>
                      ) : (
                        <>
                          <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          Launch Full Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-100 text-red-800 p-5 rounded-xl flex items-start gap-4 animate-bounce-short">
                    <AlertTriangle size={24} className="text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Critical Error Encountered</p>
                      <p className="text-xs opacity-80 leading-relaxed mt-1">{error}</p>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-12">
                {/* Result Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                  <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10 bg-gradient-to-br from-white to-slate-50 border-b border-slate-100">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          report.riskLevel === RiskLevel.High ? 'bg-red-500 animate-pulse' :
                          report.riskLevel === RiskLevel.Medium ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
                          {projectName || 'Analysis Result'}
                        </h2>
                      </div>
                      <div className="max-w-2xl bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                        <p className="text-slate-600 italic leading-relaxed text-lg font-medium">
                          "{report.riskJustification}"
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 scale-110">
                      <RiskMeter level={report.riskLevel as RiskLevel} />
                    </div>
                  </div>

                  {/* Risks Grid */}
                  <div className="p-8 sm:p-10 space-y-10">
                    <div>
                      <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-slate-50">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <AlertTriangle className="text-slate-500" size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Identified Weak Points</h3>
                      </div>
                      <div className="grid gap-8">
                        {report.topRisks.map((risk, idx) => {
                          const styles = getRiskStyles(risk.severity);
                          return (
                            <div key={idx} className={`relative flex gap-8 p-8 rounded-2xl border-2 ${styles.border} ${styles.bg} transition-all hover:shadow-lg`}>
                              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 text-slate-400 font-black text-xl">
                                0{idx + 1}
                              </div>
                              <div className="space-y-4 flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {styles.icon}
                                    <h4 className={`text-xl font-black tracking-tight ${styles.text}`}>{risk.name}</h4>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles.badge}`}>
                                    {risk.severity} Impact
                                  </span>
                                </div>
                                <p className="text-slate-700 leading-relaxed font-semibold text-base">{risk.why}</p>
                                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 shadow-inner">
                                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-2 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                    Source Reference
                                  </p>
                                  <p className="text-sm italic text-slate-600 font-medium leading-relaxed">"{risk.reference}"</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Suggestions Section */}
                    <div>
                      <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-slate-50">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                          <CheckCircle className="text-emerald-500" size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Mitigation Roadmap</h3>
                      </div>
                      <div className="grid gap-6">
                        {report.fixNowSuggestions.map((suggestion, idx) => (
                          <div key={idx} className="group flex gap-5 p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 transition-colors">
                            <div className="flex-shrink-0 mt-1 p-2 bg-white rounded-xl shadow-sm border border-emerald-50 text-emerald-600">
                              <div className="flex items-center justify-center w-full h-full"><Info size={20} /></div>
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Strategy for {suggestion.riskName}</p>
                              <p className="text-slate-800 font-bold leading-relaxed text-base">{suggestion.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={reset}
                    className="group bg-slate-900 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all hover:bg-indigo-600 shadow-xl shadow-slate-900/20 active:scale-95"
                  >
                    <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    New Project Audit
                  </button>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Audited {new Date().toLocaleTimeString()} • Powered by Gemini Pro
                  </p>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short { animation: bounce-short 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
