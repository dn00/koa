
import React, { useRef } from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  isSelected: boolean;
  onClick: () => void;
  onFocus?: (card: CardType) => void;
  onBlur?: () => void;
  disabled?: boolean;
  variant?: 'icon' | 'details'; // 'icon' is original small style, 'details' is full evidence style
}

// Display mapping for the "System Admin" theme
const TYPE_LABELS: Record<string, string> = {
    'ALIBI': 'TIMELINE',
    'DATA': 'SENSOR',
    'EXCUSE': 'VARIABLE',
    'WITNESS': 'ENTITY'
};

export const Card: React.FC<CardProps> = ({ 
  card, 
  isSelected, 
  onClick, 
  onFocus, 
  onBlur, 
  disabled, 
  variant = 'icon' 
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    if (disabled) return;
    timerRef.current = setTimeout(() => {
      onFocus?.(card);
    }, 200); 
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onBlur?.();
  };

  const handleTouchMove = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onBlur?.();
  };

  // --- STYLES ---
  const baseClasses = `
    relative w-full flex flex-col p-2 transition-all duration-200 border-2 select-none group rounded-[2px]
    ${isSelected 
      ? 'bg-white border-primary shadow-brutal translate-y-[-2px] z-10' 
      : 'bg-surface border-foreground hover:bg-white hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-0 active:shadow-none'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer shadow-brutal'}
  `;

  const typeColorClass = `
    ${card.type === 'ALIBI' ? 'bg-blue-100 text-blue-800 border-blue-900' : ''}
    ${card.type === 'DATA' ? 'bg-purple-100 text-purple-800 border-purple-900' : ''}
    ${card.type === 'EXCUSE' ? 'bg-orange-100 text-orange-800 border-orange-900' : ''}
    ${card.type === 'WITNESS' ? 'bg-green-100 text-green-800 border-green-900' : ''}
  `;

  const displayType = TYPE_LABELS[card.type] || card.type;

  // --- RENDER ICON VARIANT (Original Main Game + Mini Protocol Grid) ---
  if (variant === 'icon') {
    return (
      <div 
        onClick={() => !disabled && onClick()}
        onMouseEnter={() => !disabled && onFocus?.(card)}
        onMouseLeave={() => !disabled && onBlur?.()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className={`${baseClasses} items-center h-24 justify-between`}
      >
        {isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary animate-pulse z-10"></div>}

        <div className="w-full flex items-center justify-between gap-1">
            <span className={`text-[7px] font-mono font-bold px-1 py-0.5 rounded-[2px] uppercase tracking-wider border border-foreground text-center truncate ${!card.time ? 'w-full' : 'flex-1'} ${typeColorClass.replace(/border-\w+/g, '')}`}>
            {displayType}
            </span>
            {card.time && (
                <span className="text-[7px] font-mono font-bold text-foreground/80 bg-muted/10 px-1 py-0.5 rounded-[1px] border border-transparent shrink-0">
                    {card.time}
                </span>
            )}
        </div>

        <div className={`w-7 h-7 rounded-[2px] flex items-center justify-center text-base border border-foreground ${isSelected ? 'bg-primary text-white' : 'bg-background text-foreground'}`}>
            {card.icon}
        </div>

        <h3 className={`font-sans font-bold text-[9px] text-center leading-tight line-clamp-2 w-full ${isSelected ? 'text-primary' : 'text-foreground'}`}>
            {card.title}
        </h3>
      </div>
    );
  }

  // --- RENDER DETAILS VARIANT (Mini Protocol Comparison View) ---
  return (
    <div 
      onClick={() => !disabled && onClick()}
      onMouseEnter={() => !disabled && onFocus?.(card)}
      onMouseLeave={() => !disabled && onBlur?.()}
      className={`${baseClasses} items-start min-h-[100px] h-auto justify-between`}
    >
        {/* Header: Type & Time */}
        <div className="flex justify-between w-full mb-1">
            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] uppercase border ${typeColorClass}`}>
                {displayType}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">{card.time || '--:--'}</span>
        </div>

        {/* Body: Label & Location */}
        <div className="w-full mb-1">
            <h3 className={`font-sans font-bold text-xs leading-tight mb-0.5 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {card.title}
            </h3>
            <div className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                <span className="opacity-50">LOC:</span>
                {card.location || 'Unknown'}
            </div>
        </div>

        {/* Footer: Claim (Description) */}
        <div className="w-full border-t border-foreground/10 pt-1.5 mt-auto">
            <p className="text-[9px] leading-tight text-foreground/80 font-sans line-clamp-3">
                {card.description}
            </p>
        </div>

        {/* Selection Marker */}
        {isSelected && (
            <div className="absolute top-0 left-0 w-full h-full border-2 border-primary pointer-events-none rounded-[2px]"></div>
        )}
    </div>
  );
};
