
import React from 'react';
import { Download } from 'lucide-react';
import { AuditHistoryItem, RiskLevel } from '../types';

interface Props {
  history: AuditHistoryItem[];
  onClear: () => void;
  onExport: () => void;
}

export const RiskTrendChart: React.FC<Props> = ({ history, onClear, onExport }) => {
  if (history.length < 1) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
        <p className="text-slate-500 text-sm">Perform more audits to see risk trends over time.</p>
      </div>
    );
  }

  const levelToValue = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.High: return 3;
      case RiskLevel.Medium: return 2;
      case RiskLevel.Low: return 1;
      default: return 0;
    }
  };

  const width = 800;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = history.length > 1 
    ? history.map((item, index) => {
        const x = padding + (index / (history.length - 1)) * chartWidth;
        const y = height - padding - ((levelToValue(item.riskLevel) - 1) / 2) * chartHeight;
        return { x, y, ...item };
      })
    : history.map((item) => {
        const x = width / 2;
        const y = height - padding - ((levelToValue(item.riskLevel) - 1) / 2) * chartHeight;
        return { x, y, ...item };
      });

  const pathD = history.length > 1 
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">Risk Level Trends</h3>
        <div className="flex items-center gap-4">
          <button 
            onClick={onExport}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 transition-colors uppercase font-bold tracking-widest"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors uppercase font-bold tracking-widest"
          >
            Clear History
          </button>
        </div>
      </div>
      
      <div className="relative w-full overflow-x-auto pb-4">
        {history.length > 1 ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[600px] w-full h-auto">
            {/* Grid lines */}
            {[1, 2, 3].map((val) => {
              const y = height - padding - ((val - 1) / 2) * chartHeight;
              return (
                <g key={val}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={padding - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-bold">
                    {val === 3 ? 'HIGH' : val === 2 ? 'MED' : 'LOW'}
                  </text>
                </g>
              );
            })}

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />

            {/* Area fill */}
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#trendGradient)"
              opacity="0.1"
            />

            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Points */}
            {points.map((p, i) => (
              <g key={i} className="group">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  className={`fill-white stroke-2 ${
                    p.riskLevel === RiskLevel.High ? 'stroke-red-500' : 
                    p.riskLevel === RiskLevel.Medium ? 'stroke-amber-500' : 'stroke-emerald-500'
                  }`}
                />
                <title>{`${p.projectName}: ${p.riskLevel}`}</title>
              </g>
            ))}
          </svg>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
             <TrendingUp className="text-slate-300 mb-2" size={32} />
             <p className="text-sm text-slate-500">Add at least 2 audits to view the trend line.</p>
             <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Current Project: {history[0].projectName}</p>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
        Audit sequence (oldest to newest)
      </p>
    </div>
  );
};

import { TrendingUp } from 'lucide-react';
