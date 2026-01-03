
import React, { useEffect, useState } from 'react';
import { RiskLevel } from '../types';

interface Props {
  level: RiskLevel;
}

export const RiskMeter: React.FC<Props> = ({ level }) => {
  const [rotation, setRotation] = useState(-90); // Needle starts at left
  
  const getConfig = (lvl: RiskLevel) => {
    switch (lvl) {
      case RiskLevel.Low:
        // Map 0-100 to -90 to +90 degrees. Low ~ 15%
        return { 
          angle: -63, 
          color: 'text-emerald-500', 
          bgColor: 'bg-emerald-500', 
          label: 'Low Risk' 
        };
      case RiskLevel.Medium:
        // Medium ~ 50%
        return { 
          angle: 0, 
          color: 'text-amber-500', 
          bgColor: 'bg-amber-500', 
          label: 'Medium Risk' 
        };
      case RiskLevel.High:
        // High ~ 85%
        return { 
          angle: 63, 
          color: 'text-red-500', 
          bgColor: 'bg-red-500', 
          label: 'High Risk' 
        };
      default:
        return { angle: -90, color: 'text-slate-400', bgColor: 'bg-slate-400', label: 'Unknown' };
    }
  };

  const config = getConfig(level);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRotation(config.angle);
    }, 150);
    return () => clearTimeout(timer);
  }, [config.angle]);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
      {/* Gauge Container */}
      <div className="relative w-full aspect-[2/1] overflow-hidden">
        {/* Labels at top */}
        <div className="absolute top-0 left-0 right-0 flex justify-between px-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest z-10">
          <span>Safe</span>
          <span>Critical</span>
        </div>

        {/* SVG Arc Gauge */}
        <svg viewBox="0 0 100 50" className="w-full h-full mt-4">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" /> {/* Emerald-500 */}
              <stop offset="50%" stopColor="#f59e0b" /> {/* Amber-500 */}
              <stop offset="100%" stopColor="#ef4444" /> {/* Red-500 */}
            </linearGradient>
          </defs>
          
          {/* Background Track */}
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Color Gradient Track */}
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Needle / Indicator */}
          <g 
            transform={`rotate(${rotation}, 50, 45)`} 
            className="transition-transform duration-1000 ease-out"
          >
            <line 
              x1="50" y1="45" x2="50" y2="10" 
              stroke="#1e293b" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
            />
            <circle cx="50" cy="45" r="3" fill="#1e293b" />
          </g>
        </svg>
      </div>

      {/* Status Label */}
      <div className="flex items-center gap-1.5 -mt-2">
        <span className={`w-1.5 h-1.5 rounded-full ${config.bgColor} animate-pulse`}></span>
        <span className={`text-xs font-black tracking-tighter uppercase ${config.color}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
};
