/**
 * Hook for managing submit sequence animation in RunScreen
 * Task 005: Run Screen integration with Task 012 Submit Sequence
 */

import { useRef, useCallback, useState } from 'react';
import type { RefObject } from 'react';
import type { EvidenceCard } from '@hsh/engine-core';
import {
  createSubmitSequence,
  type SubmitSequenceConfig,
  type SubmitSequenceTargets,
  type SubmitSequenceResult,
} from '../animations/index.js';

export interface UseSubmitSequenceOptions {
  /** Ref to submit button element */
  submitButtonRef: RefObject<HTMLButtonElement | null>;
  /** Ref to resistance bar fill element */
  resistanceBarFillRef: RefObject<HTMLDivElement | null>;
  /** Ref to resistance value text element */
  resistanceValueRef: RefObject<HTMLSpanElement | null>;
  /** Ref to damage counter element */
  damageCounterRef: RefObject<HTMLSpanElement | null>;
  /** Ref to timeline container element */
  timelineContainerRef: RefObject<HTMLDivElement | null>;
  /** Callback when sequence completes */
  onSequenceComplete?: () => void;
  /** Callback when threshold is broken (win) */
  onThresholdBreak?: () => void;
}

export interface UseSubmitSequenceReturn {
  /** Whether sequence is currently playing */
  isPlaying: boolean;
  /** Start the submit sequence animation */
  playSequence: (config: {
    cards: EvidenceCard[];
    startResistance: number;
    endResistance: number;
    totalDamage: number;
    isWin: boolean;
    addressedConcerns: string[];
    cardElements: Map<string, HTMLElement>;
    concernChipElements: Map<string, HTMLElement>;
  }) => void;
  /** Skip the current sequence */
  skipSequence: () => void;
  /** Cancel and cleanup the sequence */
  cancelSequence: () => void;
  /** Current damage value (for display during animation) */
  currentDamage: number;
}

/**
 * Hook for orchestrating submit sequence animation
 */
export function useSubmitSequence(
  options: UseSubmitSequenceOptions
): UseSubmitSequenceReturn {
  const {
    submitButtonRef,
    resistanceBarFillRef,
    resistanceValueRef,
    damageCounterRef,
    timelineContainerRef,
    onSequenceComplete,
    onThresholdBreak,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDamage, setCurrentDamage] = useState(0);
  const sequenceRef = useRef<SubmitSequenceResult | null>(null);

  const playSequence = useCallback(
    (config: {
      cards: EvidenceCard[];
      startResistance: number;
      endResistance: number;
      totalDamage: number;
      isWin: boolean;
      addressedConcerns: string[];
      cardElements: Map<string, HTMLElement>;
      concernChipElements: Map<string, HTMLElement>;
    }) => {
      // Cancel any existing sequence
      if (sequenceRef.current) {
        sequenceRef.current.kill();
      }

      setIsPlaying(true);
      setCurrentDamage(0);

      const targets: SubmitSequenceTargets = {
        submitButton: submitButtonRef.current,
        resistanceBarFill: resistanceBarFillRef.current,
        resistanceValue: resistanceValueRef.current,
        damageCounter: damageCounterRef.current,
        timelineContainer: timelineContainerRef.current,
        cardElements: config.cardElements,
        concernChips: config.concernChipElements,
      };

      const sequenceConfig: SubmitSequenceConfig = {
        cards: config.cards,
        startResistance: config.startResistance,
        endResistance: config.endResistance,
        totalDamage: config.totalDamage,
        isWin: config.isWin,
        addressedConcerns: config.addressedConcerns,
      };

      sequenceRef.current = createSubmitSequence(sequenceConfig, targets, {
        onDamageUpdate: (damage) => {
          setCurrentDamage(damage);
        },
        onThresholdBreak: () => {
          onThresholdBreak?.();
        },
        onComplete: () => {
          setIsPlaying(false);
          sequenceRef.current = null;
          onSequenceComplete?.();
        },
        onSkip: () => {
          setIsPlaying(false);
          setCurrentDamage(config.totalDamage);
          sequenceRef.current = null;
          onSequenceComplete?.();
        },
      });
    },
    [
      submitButtonRef,
      resistanceBarFillRef,
      resistanceValueRef,
      damageCounterRef,
      timelineContainerRef,
      onSequenceComplete,
      onThresholdBreak,
    ]
  );

  const skipSequence = useCallback(() => {
    sequenceRef.current?.skip();
  }, []);

  const cancelSequence = useCallback(() => {
    if (sequenceRef.current) {
      sequenceRef.current.kill();
      sequenceRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    playSequence,
    skipSequence,
    cancelSequence,
    currentDamage,
  };
}
