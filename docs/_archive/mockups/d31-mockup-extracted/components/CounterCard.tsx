import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CounterEvidence } from '../types';

interface CounterCardProps {
  counter: CounterEvidence;
}

const CounterCard: React.FC<CounterCardProps> = ({ counter }) => (
  <div className={`
    p-3 rounded-lg border text-xs transition-all duration-300 relative overflow-hidden
    ${counter.refuted
      ? 'bg-gray-100 border-gray-200 text-gray-400 line-through'
      : 'bg-red-50 border-red-200 shadow-sm'}
  `}>
    <div className="flex items-center gap-2 mb-1 z-10 relative">
      {counter.refuted ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
      )}
      <span className={`font-bold uppercase tracking-wider ${counter.refuted ? 'text-gray-400' : 'text-gray-800'}`}>
        {counter.name}
      </span>
      {counter.refuted && (
        <span className="ml-auto text-green-600 font-bold text-[10px] no-underline bg-green-100 px-2 py-0.5 rounded-full">
          REFUTED
        </span>
      )}
    </div>
    <p className={`italic mb-1 ${counter.refuted ? 'text-gray-400' : 'text-gray-700'}`}>
      "{counter.claim}"
    </p>
    <p className={`${counter.refuted ? 'text-gray-300' : 'text-red-400'} font-medium`}>
      Challenges: {counter.targets.join(', ')}
    </p>
  </div>
);

export default CounterCard;