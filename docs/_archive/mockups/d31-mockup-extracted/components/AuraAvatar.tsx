import React from 'react';
import { AuraMood } from '../types';

interface AuraAvatarProps {
  mood: AuraMood;
  size?: 'sm' | 'md' | 'lg';
}

const AuraAvatar: React.FC<AuraAvatarProps> = ({ mood, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-6xl'
  };

  const moodStyles: Record<AuraMood, string> = {
    NEUTRAL: 'bg-gradient-to-br from-indigo-400 to-purple-500 shadow-indigo-500/50',
    CURIOUS: 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-500/50',
    SUSPICIOUS: 'bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-500/50 animate-pulse',
    BLOCKED: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50 animate-bounce',
    GRUDGING: 'bg-gradient-to-br from-gray-400 to-slate-500 shadow-gray-500/50',
    IMPRESSED: 'bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/50',
    RESIGNED: 'bg-gradient-to-br from-gray-500 to-slate-600 opacity-80',
    DEFEATED: 'bg-gradient-to-br from-teal-600 to-green-700 shadow-green-900/50',
    SMUG: 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-pink-500/50',
  };

  const moodEmoji: Record<AuraMood, string> = {
    NEUTRAL: '👁️',
    CURIOUS: '🔍',
    SUSPICIOUS: '🤨',
    BLOCKED: '🚫',
    GRUDGING: '😒',
    IMPRESSED: '😮',
    RESIGNED: '😔',
    DEFEATED: '😤',
    SMUG: '😏',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full ${moodStyles[mood]} flex items-center justify-center shadow-lg transition-all duration-500 ease-in-out border-4 border-white/10 backdrop-blur-sm`}>
      <span className="drop-shadow-md select-none transform transition-transform duration-300 hover:scale-110">
        {moodEmoji[mood]}
      </span>
    </div>
  );
};

export default AuraAvatar;