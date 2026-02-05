/**
 * KOA Casefiles - Bark System
 *
 * Sparse, triggered commentary from KOA (6-10 barks per case).
 * KOA comments on PEOPLE/DRAMA, not CASE/STRATEGY.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { EvidenceKind } from './types.js';

// ============================================================================
// Types
// ============================================================================

export type BarkTrigger =
    | 'CASE_OPEN'
    | 'SHAPE_TELL'
    | 'FIRST_EVIDENCE'
    | 'CONTRADICTION'
    | 'VERDICT_WIN'
    | 'VERDICT_LOSE'
    | 'SEARCH_EMPTY'
    | 'SEARCH_GATED'
    | 'METHOD_FOUND'
    | 'CLOSE_TO_SOLVE';

export type CaseShape =
    | 'classic'
    | 'frame_job'
    | 'two_step'
    | 'collusion'
    | 'constraint'
    | '*';  // Wildcard - matches any shape

export type BarkTone = 'smug' | 'clinical' | 'snark' | 'playful' | 'ominous';

export interface Bark {
    id: string;
    trigger: BarkTrigger;
    shape?: CaseShape;
    category?: EvidenceKind;  // For FIRST_EVIDENCE
    tone: BarkTone;
    hintLevel: 0 | 1 | 2;
    text: string;
}

export interface BarkPack {
    packId: string;
    version: string;
    selectors: {
        maxPerCase: number;
        cooldownByKeySeconds: number;
    };
    barks: Bark[];
}

export interface BarkContext {
    shape?: CaseShape;
    category?: EvidenceKind;
    item?: string;
    turn?: number;
}

// ============================================================================
// Bark State (per-case tracking)
// ============================================================================

export class BarkState {
    private usedIds: Set<string> = new Set();
    private seenCategories: Set<EvidenceKind> = new Set();
    private totalBarks: number = 0;
    private maxPerCase: number;
    private shapeTellFired: boolean = false;

    constructor(maxPerCase: number = 10) {
        this.maxPerCase = maxPerCase;
    }

    canBark(): boolean {
        return this.totalBarks < this.maxPerCase;
    }

    recordBark(id: string): void {
        this.usedIds.add(id);
        this.totalBarks++;
    }

    hasUsed(id: string): boolean {
        return this.usedIds.has(id);
    }

    hasSeenCategory(category: EvidenceKind): boolean {
        return this.seenCategories.has(category);
    }

    markCategorySeen(category: EvidenceKind): void {
        this.seenCategories.add(category);
    }

    hasShapeTellFired(): boolean {
        return this.shapeTellFired;
    }

    markShapeTellFired(): void {
        this.shapeTellFired = true;
    }

    getBarkCount(): number {
        return this.totalBarks;
    }
}

// ============================================================================
// Bark Selector
// ============================================================================

let barkPack: BarkPack | null = null;

function loadBarkPack(): BarkPack {
    if (barkPack) return barkPack;

    try {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const path = join(__dirname, 'barks.json');
        const raw = readFileSync(path, 'utf-8');
        barkPack = JSON.parse(raw) as BarkPack;
        return barkPack;
    } catch (e) {
        // Fallback empty pack
        console.error('Failed to load barks.json:', e);
        return {
            packId: 'fallback',
            version: '0.0',
            selectors: { maxPerCase: 10, cooldownByKeySeconds: 120 },
            barks: []
        };
    }
}

/**
 * Select a bark matching the trigger and context.
 * Returns null if no suitable bark found or quota exceeded.
 */
export function selectBark(
    state: BarkState,
    trigger: BarkTrigger,
    context: BarkContext = {},
    rng: () => number = Math.random
): Bark | null {
    if (!state.canBark()) return null;

    const pack = loadBarkPack();

    // Filter by trigger
    let candidates = pack.barks.filter(b => b.trigger === trigger);

    // Filter by shape (if specified)
    if (context.shape) {
        candidates = candidates.filter(b =>
            !b.shape || b.shape === '*' || b.shape === context.shape
        );
    }

    // Filter by category (for FIRST_EVIDENCE)
    if (trigger === 'FIRST_EVIDENCE' && context.category) {
        // Prefer category-specific, fall back to general
        const categorySpecific = candidates.filter(b => b.category === context.category);
        if (categorySpecific.length > 0) {
            candidates = categorySpecific;
        }
    }

    // Filter by hint level based on turn
    // Turn 1-2: only hintLevel 0-1
    // Turn 3+: allow hintLevel 2
    const turn = context.turn ?? 1;
    const maxHint = turn < 3 ? 1 : 2;
    candidates = candidates.filter(b => b.hintLevel <= maxHint);

    // Exclude already used
    candidates = candidates.filter(b => !state.hasUsed(b.id));

    if (candidates.length === 0) return null;

    // Random selection
    const idx = Math.floor(rng() * candidates.length);
    return candidates[idx];
}

/**
 * Fire a bark - selects and records it.
 * Returns the bark text or null if none fired.
 */
export function fireBark(
    state: BarkState,
    trigger: BarkTrigger,
    context: BarkContext = {},
    rng: () => number = Math.random
): string | null {
    const bark = selectBark(state, trigger, context, rng);
    if (!bark) return null;

    state.recordBark(bark.id);

    // Variable substitution
    let text = bark.text;
    if (context.item) {
        text = text.replace(/\{item\}/g, context.item);
    }

    return text;
}

/**
 * Try to fire FIRST_EVIDENCE bark (only once per category).
 */
export function fireFirstEvidence(
    state: BarkState,
    category: EvidenceKind,
    context: BarkContext = {},
    rng: () => number = Math.random
): string | null {
    if (state.hasSeenCategory(category)) return null;

    state.markCategorySeen(category);
    return fireBark(state, 'FIRST_EVIDENCE', { ...context, category }, rng);
}

/**
 * Try to fire SHAPE_TELL bark (only once per case).
 */
export function fireShapeTell(
    state: BarkState,
    shape: CaseShape,
    context: BarkContext = {},
    rng: () => number = Math.random
): string | null {
    if (state.hasShapeTellFired()) return null;

    state.markShapeTellFired();
    return fireBark(state, 'SHAPE_TELL', { ...context, shape }, rng);
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format a bark for display.
 */
export function formatBark(text: string): string {
    return `\n🏠 KOA: "${text}"\n`;
}
