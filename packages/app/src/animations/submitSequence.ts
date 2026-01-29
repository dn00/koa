/**
 * Submit & Resolve Sequence (Task 012)
 *
 * Orchestrates the animation sequence when player submits cards.
 * Based on D16 timing budgets and Balatro-inspired game feel.
 *
 * Requirements:
 * R10.1: T=0: button depress + haptic + SFX (immediate feedback)
 * R10.2: T=0-120ms: mechanics bars begin moving
 * R10.3: Cards fly to timeline (GSAP Flip plugin)
 * R10.4: Damage numbers count up
 * R10.5: Concern chips react (flash/dissolve)
 * R10.6: Count-up suspense: Don't show final damage instantly
 * R10.7: Threshold break: Visual "fire"/glow when resistance hits 0
 * R10.8: Card-by-card resolve: Each card contributes visibly in sequence
 */

import { gsap } from 'gsap';
import type { Card } from '@hsh/engine-core';

/**
 * Timing constants from D16
 */
export const TIMING = {
  /** Immediate response budget */
  IMMEDIATE: 50,
  /** Mechanics update budget */
  MECHANICS: 120,
  /** Micro animation duration */
  MICRO: { MIN: 80, MAX: 150 },
  /** Meso animation duration */
  MESO: { MIN: 180, MAX: 280 },
  /** Macro animation duration (skippable) */
  MACRO: { MIN: 600, MAX: 1200 },
  /** Delay between card resolves (stagger) */
  CARD_STAGGER: 200,
  /** Count-up duration per card */
  COUNT_UP: 300,
  /** Threshold break effect duration */
  THRESHOLD_BREAK: 400,
} as const;

/**
 * Easing presets for game feel
 */
export const EASE = {
  /** Quick snap for immediate feedback */
  SNAP: 'power3.out',
  /** Overshoot for spring feel */
  SPRING: 'back.out(1.7)',
  /** Smooth for counts */
  SMOOTH: 'power2.out',
  /** Elastic for celebrations */
  ELASTIC: 'elastic.out(1, 0.3)',
} as const;

/**
 * Configuration for the submit sequence
 */
export interface SubmitSequenceConfig {
  /** Cards being submitted */
  cards: Card[];
  /** Starting resistance value */
  startResistance: number;
  /** Final resistance value after damage */
  endResistance: number;
  /** Total damage dealt */
  totalDamage: number;
  /** Whether this wins the game (resistance hits 0) */
  isWin: boolean;
  /** IDs of concerns that were addressed */
  addressedConcerns: string[];
}

/**
 * DOM element references for animation targets
 */
export interface SubmitSequenceTargets {
  /** Submit button element */
  submitButton?: HTMLElement | null;
  /** Card elements by ID */
  cardElements: Map<string, HTMLElement>;
  /** Timeline container */
  timelineContainer?: HTMLElement | null;
  /** Resistance bar fill element */
  resistanceBarFill?: HTMLElement | null;
  /** Resistance value text element */
  resistanceValue?: HTMLElement | null;
  /** Damage counter element */
  damageCounter?: HTMLElement | null;
  /** Concern chip elements by ID */
  concernChips: Map<string, HTMLElement>;
}

/**
 * Callbacks for sequence events
 */
export interface SubmitSequenceCallbacks {
  /** Called when button depress animation starts */
  onButtonDepress?: () => void;
  /** Called when a card starts animating to timeline */
  onCardFlyStart?: (cardId: string, index: number) => void;
  /** Called when a card finishes animating */
  onCardFlyEnd?: (cardId: string, index: number) => void;
  /** Called during damage count-up with current value */
  onDamageUpdate?: (currentDamage: number) => void;
  /** Called when resistance threshold is crossed (win) */
  onThresholdBreak?: () => void;
  /** Called when a concern is addressed */
  onConcernAddressed?: (concernId: string) => void;
  /** Called when entire sequence completes */
  onComplete?: () => void;
  /** Called if sequence is skipped */
  onSkip?: () => void;
}

/**
 * Result of creating a submit sequence
 */
export interface SubmitSequenceResult {
  /** The master timeline */
  timeline: gsap.core.Timeline;
  /** Skip to the end of the sequence */
  skip: () => void;
  /** Kill the sequence (cleanup) */
  kill: () => void;
}

/**
 * Creates the submit & resolve animation sequence
 */
export function createSubmitSequence(
  config: SubmitSequenceConfig,
  targets: SubmitSequenceTargets,
  callbacks: SubmitSequenceCallbacks = {}
): SubmitSequenceResult {
  const master = gsap.timeline({
    onComplete: () => callbacks.onComplete?.(),
  });

  let canSkip = false;

  // ==========================================================================
  // T=0: Button Depress (R10.1)
  // ==========================================================================
  if (targets.submitButton) {
    master.call(() => callbacks.onButtonDepress?.(), [], 0);
    master.to(
      targets.submitButton,
      {
        scale: 0.95,
        duration: TIMING.IMMEDIATE / 1000,
        ease: 'power2.in',
      },
      0
    );
    master.to(
      targets.submitButton,
      {
        scale: 1,
        duration: TIMING.MICRO.MIN / 1000,
        ease: EASE.SPRING,
      },
      TIMING.IMMEDIATE / 1000
    );
  }

  // ==========================================================================
  // T=0-120ms: Resistance bar begins moving (R10.2)
  // ==========================================================================
  const resistanceStartTime = TIMING.IMMEDIATE / 1000;

  if (targets.resistanceBarFill) {
    const endPercent = (config.endResistance / config.startResistance) * 100;

    master.to(
      targets.resistanceBarFill,
      {
        width: `${endPercent}%`,
        duration: TIMING.MESO.MAX / 1000,
        ease: EASE.SNAP,
      },
      resistanceStartTime
    );
  }

  // ==========================================================================
  // Card-by-card resolve (R10.8) with cards flying to timeline (R10.3)
  // ==========================================================================
  let runningDamage = 0;
  const cardStartTime = resistanceStartTime + (TIMING.MECHANICS / 1000);

  config.cards.forEach((card, index) => {
    const cardElement = targets.cardElements.get(card.id);
    const staggerTime = cardStartTime + (index * TIMING.CARD_STAGGER / 1000);

    if (cardElement && targets.timelineContainer) {
      // Card fly animation
      master.call(() => callbacks.onCardFlyStart?.(card.id, index), [], staggerTime);

      // Scale down and move to timeline
      master.to(
        cardElement,
        {
          scale: 0.6,
          opacity: 0.8,
          duration: TIMING.MESO.MIN / 1000,
          ease: EASE.SNAP,
        },
        staggerTime
      );

      master.to(
        cardElement,
        {
          y: -100, // Move up toward timeline
          opacity: 0,
          duration: TIMING.MESO.MAX / 1000,
          ease: EASE.SPRING,
        },
        staggerTime + (TIMING.MESO.MIN / 1000) * 0.5
      );

      master.call(() => callbacks.onCardFlyEnd?.(card.id, index), [],
        staggerTime + (TIMING.MESO.MAX / 1000));
    }

    // ==========================================================================
    // Damage count-up with suspense (R10.4, R10.6)
    // ==========================================================================
    if (targets.damageCounter) {
      const damageUpdateTime = staggerTime + (TIMING.MESO.MIN / 1000);
      const targetDamage = runningDamage + card.strength;

      // Animate damage counter
      master.to(
        { value: runningDamage },
        {
          value: targetDamage,
          duration: TIMING.COUNT_UP / 1000,
          ease: EASE.SMOOTH,
          onUpdate: function() {
            const current = Math.round(this.targets()[0].value);
            if (targets.damageCounter) {
              targets.damageCounter.textContent = String(current);
            }
            callbacks.onDamageUpdate?.(current);
          },
        },
        damageUpdateTime
      );

      // Scale pulse on damage counter
      master.to(
        targets.damageCounter,
        {
          scale: 1.2,
          duration: 0.1,
          ease: 'power2.out',
        },
        damageUpdateTime
      );
      master.to(
        targets.damageCounter,
        {
          scale: 1,
          duration: 0.2,
          ease: EASE.SPRING,
        },
        damageUpdateTime + 0.1
      );

      runningDamage = targetDamage;
    }

    // Update resistance value text
    if (targets.resistanceValue) {
      const newResistance = Math.max(0, config.startResistance - runningDamage);
      master.call(() => {
        if (targets.resistanceValue) {
          targets.resistanceValue.textContent = String(newResistance);
        }
      }, [], staggerTime + (TIMING.COUNT_UP / 1000));
    }
  });

  // ==========================================================================
  // Concern chips react (R10.5)
  // ==========================================================================
  config.addressedConcerns.forEach((concernId, index) => {
    const chipElement = targets.concernChips.get(concernId);
    if (chipElement) {
      const concernTime = cardStartTime +
        (config.cards.length * TIMING.CARD_STAGGER / 1000) +
        (index * 100 / 1000);

      master.call(() => callbacks.onConcernAddressed?.(concernId), [], concernTime);

      // Flash and dissolve
      master.to(
        chipElement,
        {
          backgroundColor: '#10b981', // Green flash
          scale: 1.1,
          duration: 0.1,
          ease: 'power2.out',
        },
        concernTime
      );
      master.to(
        chipElement,
        {
          opacity: 0.5,
          scale: 0.9,
          filter: 'blur(2px)',
          duration: 0.2,
          ease: EASE.SMOOTH,
        },
        concernTime + 0.1
      );
    }
  });

  // ==========================================================================
  // Threshold break effect (R10.7)
  // ==========================================================================
  if (config.isWin) {
    const thresholdTime = cardStartTime +
      (config.cards.length * TIMING.CARD_STAGGER / 1000) +
      (TIMING.COUNT_UP / 1000);

    master.call(() => {
      canSkip = true; // Allow skipping after threshold
      callbacks.onThresholdBreak?.();
    }, [], thresholdTime);

    if (targets.resistanceBarFill) {
      // "Fire" glow effect
      master.to(
        targets.resistanceBarFill,
        {
          boxShadow: '0 0 30px #f59e0b, 0 0 60px #ef4444',
          backgroundColor: '#ef4444',
          duration: TIMING.THRESHOLD_BREAK / 1000,
          ease: EASE.ELASTIC,
        },
        thresholdTime
      );
    }

    if (targets.damageCounter) {
      // Victory scale effect
      master.to(
        targets.damageCounter,
        {
          scale: 1.5,
          color: '#10b981',
          duration: TIMING.THRESHOLD_BREAK / 1000,
          ease: EASE.ELASTIC,
        },
        thresholdTime
      );
    }
  }

  // ==========================================================================
  // Skip functionality (R11.3: skippable after 400ms)
  // ==========================================================================
  const skipDelay = setTimeout(() => {
    canSkip = true;
  }, 400);

  const skip = () => {
    if (canSkip) {
      clearTimeout(skipDelay);
      master.progress(1); // Jump to end
      callbacks.onSkip?.();
    }
  };

  const kill = () => {
    clearTimeout(skipDelay);
    master.kill();
  };

  return { timeline: master, skip, kill };
}

/**
 * Creates a simple button press animation
 * Used for submit button before sequence starts
 */
export function createButtonPressAnimation(
  button: HTMLElement,
  onComplete?: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete });

  tl.to(button, {
    scale: 0.92,
    duration: TIMING.IMMEDIATE / 1000,
    ease: 'power2.in',
  });

  tl.to(button, {
    scale: 1.02,
    duration: TIMING.MICRO.MIN / 1000,
    ease: EASE.SPRING,
  });

  tl.to(button, {
    scale: 1,
    duration: TIMING.MICRO.MIN / 2 / 1000,
    ease: 'power2.out',
  });

  return tl;
}

/**
 * Creates a damage number pop animation
 * Used when showing damage dealt by individual cards
 */
export function createDamagePopAnimation(
  element: HTMLElement,
  startValue: number,
  endValue: number,
  onUpdate?: (value: number) => void
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Count up animation
  tl.to(
    { value: startValue },
    {
      value: endValue,
      duration: TIMING.COUNT_UP / 1000,
      ease: EASE.SMOOTH,
      onUpdate: function() {
        const current = Math.round(this.targets()[0].value);
        element.textContent = String(current);
        onUpdate?.(current);
      },
    }
  );

  // Scale pulse
  tl.to(
    element,
    {
      scale: 1.3,
      duration: 0.08,
      ease: 'power2.out',
    },
    0
  );

  tl.to(
    element,
    {
      scale: 1,
      duration: 0.15,
      ease: EASE.SPRING,
    },
    0.08
  );

  return tl;
}
