import React from 'react';
import { MapPin, Eye, ShieldCheck, ShieldAlert, BadgeAlert } from 'lucide-react';
import { EvidenceCard } from '../types';

interface EvidenceCardProps {
  card: EvidenceCard;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showWarning?: boolean;
  warningType?: 'MINOR' | 'MAJOR';
  showStats: boolean;
}

const EvidenceCardComponent: React.FC<EvidenceCardProps> = ({
  card,
  selected,
  onClick,
  disabled,
  showWarning,
  warningType,
  showStats
}) => {
  const getPowerDisplay = () => {
    if (showStats) return card.power.toString();
    if (card.power >= 14) return '⭐⭐⭐';
    if (card.power >= 10) return '⭐⭐';
    return '⭐';
  };

  const getBorderColor = () => {
    if (showWarning && warningType === 'MAJOR') return 'border-red-500 ring-2 ring-red-200';
    if (showWarning && warningType === 'MINOR') return 'border-yellow-500 ring-2 ring-yellow-200';
    if (selected) return 'border-indigo-500 ring-2 ring-indigo-100';
    return 'border-gray-200 hover:border-gray-300';
  };

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative w-32 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-white
        ${getBorderColor()}
        ${selected ? 'shadow-lg -translate-y-1' : 'shadow-sm'}
        ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : ''}
      `}
    >
      {/* Warning Badge */}
      {showWarning && (
        <div className={`
          absolute -top-3 -right-3 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 z-20
          ${warningType === 'MAJOR' ? 'bg-red-500 text-white animate-bounce' : 'bg-yellow-400 text-yellow-900'}
        `}>
          {warningType === 'MAJOR' ? <BadgeAlert className="w-3 h-3"/> : <ShieldAlert className="w-3 h-3"/>}
          {warningType === 'MAJOR' ? 'BLOCKED' : 'RISKY'}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-mono font-bold ${showStats ? 'bg-gray-100 px-1.5 py-0.5 rounded text-gray-700' : 'text-yellow-500 tracking-tighter'}`}>
          {getPowerDisplay()}
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide
          ${card.trust === 'VERIFIED' ? 'bg-teal-50 text-teal-700' :
            card.trust === 'PLAUSIBLE' ? 'bg-gray-100 text-gray-600' :
            'bg-orange-50 text-orange-700'}`}>
          {card.trust}
        </span>
      </div>

      {/* Name */}
      <div className="text-[11px] font-bold text-gray-900 leading-tight mb-1 min-h-[2.5em]">
        {card.name}
      </div>

      {/* Source */}
      <div className="text-[9px] text-indigo-500 font-medium mb-2 truncate">
        {card.source}
      </div>

      {/* Claims */}
      <div className="flex flex-col gap-1 mb-2">
        {card.claims.location && (
          <span className="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded w-fit">
            <MapPin className="w-3 h-3" /> {card.claims.location}
          </span>
        )}
        {card.claims.state && (
          <span className="flex items-center gap-1 text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded w-fit">
            <Eye className="w-3 h-3" /> {card.claims.state}
          </span>
        )}
      </div>

      {/* Proves */}
      {card.proves.length > 0 && showStats && (
        <div className="text-[9px] text-gray-400 mb-1">
          Proves: {card.proves.join(', ')}
        </div>
      )}

      {/* Refutes */}
      {card.refutes && (
        <div className="flex items-center gap-1 text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-1 rounded mt-auto">
          <ShieldCheck className="w-3 h-3" /> REFUTES
        </div>
      )}
    </div>
  );
};

export default EvidenceCardComponent;