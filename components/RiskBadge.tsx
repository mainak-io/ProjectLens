
import React from 'react';
import { RiskLevel } from '../types';

interface Props {
  level: RiskLevel;
}

export const RiskBadge: React.FC<Props> = ({ level }) => {
  const styles = {
    [RiskLevel.Low]: 'bg-green-100 text-green-800 border-green-200',
    [RiskLevel.Medium]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [RiskLevel.High]: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${styles[level]}`}>
      {level.toUpperCase()} RISK
    </span>
  );
};
