
import React from 'react';
import { Clock, Trash2, ChevronRight, Search, LayoutList, X } from 'lucide-react';
import { AuditHistoryItem, RiskLevel } from '../types';

interface Props {
  history: AuditHistoryItem[];
  onSelect: (item: AuditHistoryItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  activeId?: string;
}

export const Sidebar: React.FC<Props> = ({ history, onSelect, onDelete, onClose, activeId }) => {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.High: return 'bg-red-500';
      case RiskLevel.Medium: return 'bg-amber-500';
      case RiskLevel.Low: return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <aside className="w-80 h-full flex flex-col bg-slate-50 border-r border-slate-200 overflow-hidden shrink-0 animate-in slide-in-from-left duration-300">
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LayoutList className="text-indigo-600" size={20} />
            <h2 className="font-bold text-slate-800 tracking-tight">Audit History</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search audits..." 
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border-none rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Clock className="text-slate-300 mb-2" size={32} />
            <p className="text-xs text-slate-500">No past audits found. Start analyzing to build your history.</p>
          </div>
        ) : (
          [...history].reverse().map((item) => (
            <div 
              key={item.id}
              className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                activeId === item.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
              }`}
              onClick={() => onSelect(item)}
            >
              <div className={`w-1 h-8 rounded-full ${getRiskColor(item.riskLevel)}`} />
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold truncate ${activeId === item.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {item.projectName}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${
                    item.riskLevel === RiskLevel.High ? 'bg-red-100 text-red-700' :
                    item.riskLevel === RiskLevel.Medium ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.riskLevel}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 size={14} />
              </button>
              <ChevronRight size={14} className={`text-slate-300 ${activeId === item.id ? 'text-indigo-400' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
