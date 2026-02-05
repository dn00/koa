import { CaseConfig, EvidenceItem, World, SimEvent } from './types.js';

// ============================================================================
// Action Tracking (for scoring & share artifact)
// ============================================================================

export type ActionType = 'search' | 'interview' | 'logs' | 'compare' | 'hint';

// ============================================================================
// Lead System
// ============================================================================

export interface Lead {
    id: string;
    scope: {
        place?: string;
        window?: string;
        npc?: string;
    };
    reason: string;  // Why this is a lead
    used: boolean;   // Has the free action been used?
}

export const MAX_LEADS = 2;

export interface ActionRecord {
    type: ActionType;
    day: number;
    apCost: number;
    target?: string;  // place, npc, device, etc.
}

/**
 * Represents the state of a single playthrough.
 */
export class PlayerSession {
    // Game State
    currentDay: number = 1;
    maxDays: number;
    actionPoints: number;
    maxActionPoints: number;

    // Knowledge
    knownEvidence: EvidenceItem[] = [];
    notebook: string[] = []; // Player notes

    // Scoring State (Spec 15)
    totalAPSpent: number = 0;
    contradictionsFound: number = 0;
    hintsUsed: number = 0;
    actionHistory: ActionRecord[] = [];

    // Lead System
    leads: Lead[] = [];
    compareSuggestUsed: boolean = false;

    // Cover-up System
    coverUpApplied: boolean = false;
    removedEvidenceIds: string[] = [];

    // The Truth (Hidden from direct access, used by Executors)
    readonly world: World;
    readonly config: CaseConfig;
    readonly allEvidence: EvidenceItem[]; // The full derived truth
    readonly eventLog: SimEvent[];  // For truth replay

    constructor(
        world: World,
        config: CaseConfig,
        allEvidence: EvidenceItem[],
        eventLog: SimEvent[] = [],
        maxDays = 4,
        apPerDay = 3
    ) {
        this.world = world;
        this.config = config;
        this.allEvidence = allEvidence;
        this.eventLog = eventLog;
        this.maxDays = maxDays;
        this.maxActionPoints = apPerDay;
        this.actionPoints = apPerDay;
    }

    /**
     * Spending AP. Returns true if successful.
     * Tracks total AP spent for scoring.
     */
    spendAP(cost: number, actionType?: ActionType, target?: string): boolean {
        if (this.actionPoints >= cost) {
            this.actionPoints -= cost;
            this.totalAPSpent += cost;

            // Record action for share artifact
            if (actionType) {
                this.actionHistory.push({
                    type: actionType,
                    day: this.currentDay,
                    apCost: cost,
                    target,
                });
            }
            return true;
        }
        return false;
    }

    /**
     * Record a contradiction found (for scoring)
     */
    recordContradiction(): void {
        this.contradictionsFound++;
    }

    /**
     * Record hint usage (for scoring penalty)
     */
    recordHint(): void {
        this.hintsUsed++;
        this.actionHistory.push({
            type: 'hint',
            day: this.currentDay,
            apCost: 0,
        });
    }

    /**
     * Advance to the next day, resetting AP.
     */
    nextDay(): boolean {
        if (this.currentDay < this.maxDays) {
            this.currentDay++;
            this.actionPoints = this.maxActionPoints;
            return true;
        }
        return false; // Game Over (Time out)
    }

    /**
     * Add evidence to the known set if not already known.
     */
    revealEvidence(evidence: EvidenceItem): void {
        // Simple dedupe by stringifying (or ID if we strictly used IDs)
        // For now, assuming EvidenceItem structure is stable enough
        const exists = this.knownEvidence.some(e => JSON.stringify(e) === JSON.stringify(evidence));
        if (!exists) {
            this.knownEvidence.push(evidence);
        }
    }

    /**
     * Check if game is over due to time
     */
    isTimeUp(): boolean {
        return this.currentDay >= this.maxDays && this.actionPoints === 0;
    }

    // =========================================================================
    // Lead System
    // =========================================================================

    /**
     * Add a lead. Returns false if max leads reached.
     */
    addLead(scope: Lead['scope'], reason: string): boolean {
        if (this.leads.length >= MAX_LEADS) return false;

        this.leads.push({
            id: `lead_${this.leads.length + 1}`,
            scope,
            reason,
            used: false,
        });
        return true;
    }

    /**
     * Check if an action matches an unused lead (gets free AP).
     */
    matchesLead(place?: string, window?: string, npc?: string): Lead | null {
        for (const lead of this.leads) {
            if (lead.used) continue;

            const matchesPlace = !lead.scope.place || lead.scope.place === place;
            const matchesWindow = !lead.scope.window || lead.scope.window === window;
            const matchesNpc = !lead.scope.npc || lead.scope.npc === npc;

            if (matchesPlace && matchesWindow && matchesNpc) {
                return lead;
            }
        }
        return null;
    }

    /**
     * Use a lead (mark as used).
     */
    useLead(lead: Lead): void {
        lead.used = true;
    }

    /**
     * Get active (unused) leads.
     */
    getActiveLeads(): Lead[] {
        return this.leads.filter(l => !l.used);
    }

    // =========================================================================
    // Cover-up System
    // =========================================================================

    /**
     * Apply cover-up: culprit removes/degrades one piece of evidence.
     * Called when advancing past day 2.
     */
    applyCoverUp(): EvidenceItem | null {
        if (this.coverUpApplied) return null;
        this.coverUpApplied = true;

        // Find a piece of evidence that points to culprit but isn't yet known
        const unknownEvidence = this.allEvidence.filter(e => {
            // Not yet discovered
            if (this.knownEvidence.some(k => k.id === e.id)) return false;

            // Points to culprit somehow
            if (e.kind === 'testimony') {
                return e.subjectHint?.toLowerCase() === this.config.culpritId;
            }
            if (e.kind === 'physical') {
                return e.place === this.config.crimePlace || e.place === this.config.hiddenPlace;
            }
            if (e.kind === 'motive') {
                return e.suspect === this.config.culpritId;
            }
            return false;
        });

        if (unknownEvidence.length === 0) return null;

        // Remove one piece of evidence (culprit covered their tracks)
        const removed = unknownEvidence[Math.floor(Math.random() * unknownEvidence.length)];
        this.removedEvidenceIds.push(removed.id);

        return removed;
    }

    /**
     * Check if evidence has been removed by cover-up.
     */
    isEvidenceRemoved(evidenceId: string): boolean {
        return this.removedEvidenceIds.includes(evidenceId);
    }

    /**
     * Compute coverage meter - what evidence dimensions have been explored.
     * Returns count of evidence items supporting each accusation dimension.
     */
    getCoverage(): CoverageMeter {
        const coverage: CoverageMeter = {
            who: { count: 0, hints: [] },
            what: { count: 0, hints: [] },
            how: { count: 0, hints: [] },
            when: { count: 0, hints: [] },
            where: { count: 0, hints: [] },
            why: { count: 0, hints: [] },
        };

        for (const e of this.knownEvidence) {
            switch (e.kind) {
                case 'presence':
                    // WHO: shows NPC at location
                    coverage.who.count++;
                    if (!coverage.who.hints.includes(e.npc)) {
                        coverage.who.hints.push(e.npc);
                    }
                    // WHERE: shows location activity
                    coverage.where.count++;
                    if (!coverage.where.hints.includes(e.place)) {
                        coverage.where.hints.push(e.place);
                    }
                    // WHEN: shows window
                    coverage.when.count++;
                    if (!coverage.when.hints.includes(e.window)) {
                        coverage.when.hints.push(e.window);
                    }
                    break;

                case 'device_log':
                    // WHEN: device logs have timestamps
                    coverage.when.count++;
                    if (!coverage.when.hints.includes(e.window)) {
                        coverage.when.hints.push(e.window);
                    }
                    // WHERE: device logs show place activity
                    coverage.where.count++;
                    if (!coverage.where.hints.includes(e.place)) {
                        coverage.where.hints.push(e.place);
                    }
                    // WHO: if actor is known
                    if (e.actor) {
                        coverage.who.count++;
                        if (!coverage.who.hints.includes(e.actor)) {
                            coverage.who.hints.push(e.actor);
                        }
                    }
                    break;

                case 'testimony':
                    // WHO: testimony may mention subjects
                    coverage.who.count++;
                    if (e.subjectHint && !coverage.who.hints.includes(e.subjectHint)) {
                        coverage.who.hints.push(e.subjectHint);
                    }
                    // WHEN: testimony tied to window
                    coverage.when.count++;
                    if (!coverage.when.hints.includes(e.window)) {
                        coverage.when.hints.push(e.window);
                    }
                    // WHERE: testimony about place
                    coverage.where.count++;
                    if (!coverage.where.hints.includes(e.place)) {
                        coverage.where.hints.push(e.place);
                    }
                    break;

                case 'physical':
                    // WHAT: physical evidence about the item/crime
                    coverage.what.count++;
                    coverage.what.hints.push(e.item);
                    // HOW: physical evidence may hint at method
                    if (e.detail.toLowerCase().includes('missing') ||
                        e.detail.toLowerCase().includes('found') ||
                        e.detail.toLowerCase().includes('hidden') ||
                        e.detail.toLowerCase().includes('broken')) {
                        coverage.how.count++;
                    }
                    // WHERE: shows location
                    coverage.where.count++;
                    if (!coverage.where.hints.includes(e.place)) {
                        coverage.where.hints.push(e.place);
                    }
                    break;

                case 'motive':
                    // WHY: motive evidence directly
                    coverage.why.count++;
                    coverage.why.hints.push(e.hint);
                    // WHO: motive evidence points at suspect
                    coverage.who.count++;
                    if (!coverage.who.hints.includes(e.suspect)) {
                        coverage.who.hints.push(e.suspect);
                    }
                    break;
            }
        }

        return coverage;
    }

    /**
     * Compute known whereabouts for each NPC across time windows.
     * Returns a map of NPC -> Window -> Location info
     */
    getWhereabouts(): WhereaboutsMap {
        const whereabouts: WhereaboutsMap = {};
        const windows = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

        // Initialize all NPCs with unknown locations
        for (const npc of this.config.suspects) {
            whereabouts[npc] = {};
            for (const w of windows) {
                whereabouts[npc][w] = { place: null, confidence: 'unknown', sources: [] };
            }
        }

        // Process known evidence to fill in whereabouts
        for (const e of this.knownEvidence) {
            switch (e.kind) {
                case 'testimony': {
                    // Testimony tells us where the WITNESS was
                    const witness = e.witness;
                    const window = e.window;
                    if (witness && window && whereabouts[witness]) {
                        const existing = whereabouts[witness][window];
                        // Only update if we don't have confirmed info
                        if (existing.confidence !== 'confirmed') {
                            whereabouts[witness][window] = {
                                place: e.place,
                                confidence: 'claimed',
                                sources: [...existing.sources, e.id],
                            };
                        }
                    }
                    // Also track SUBJECT if identified (who was seen)
                    if (e.subject && whereabouts[e.subject]) {
                        const subjectPlace = e.subjectPlace ?? e.place; // Default to witness location
                        const existing = whereabouts[e.subject][window];
                        // 'witnessed' is weaker than 'confirmed' but stronger than 'unknown'
                        if (existing.confidence === 'unknown') {
                            whereabouts[e.subject][window] = {
                                place: subjectPlace,
                                confidence: 'claimed', // Reported by witness
                                sources: [...existing.sources, e.id],
                            };
                        }
                    }
                    break;
                }

                case 'presence': {
                    // Presence is confirmed by device (motion sensor, etc)
                    const npc = e.npc;
                    const window = e.window;
                    if (npc && window && whereabouts[npc]) {
                        whereabouts[npc][window] = {
                            place: e.place,
                            confidence: 'confirmed',
                            sources: [...(whereabouts[npc][window]?.sources || []), e.id],
                        };
                    }
                    break;
                }

                case 'device_log': {
                    // Device logs with actor show confirmed presence
                    if (e.actor && whereabouts[e.actor]) {
                        const existing = whereabouts[e.actor][e.window];
                        if (existing.confidence !== 'confirmed') {
                            whereabouts[e.actor][e.window] = {
                                place: e.place,
                                confidence: 'confirmed',
                                sources: [...(existing?.sources || []), e.id],
                            };
                        }
                    }
                    break;
                }
            }
        }

        return whereabouts;
    }
}

export interface WhereaboutsEntry {
    place: string | null;
    confidence: 'unknown' | 'claimed' | 'confirmed';
    sources: string[];
}

export type WhereaboutsMap = {
    [npc: string]: {
        [window: string]: WhereaboutsEntry;
    };
};

export interface CoverageDimension {
    count: number;    // Number of evidence items
    hints: string[];  // Collected hints (NPCs, places, items, etc.)
}

export interface CoverageMeter {
    who: CoverageDimension;
    what: CoverageDimension;
    how: CoverageDimension;
    when: CoverageDimension;
    where: CoverageDimension;
    why: CoverageDimension;
}

// ============================================================================
// Scoring System (Spec 15)
// ============================================================================

export interface GameScore {
    daysUsed: number;
    totalAP: number;
    contradictions: number;
    hintsUsed: number;
    firstTrySolve: boolean;
    correctParts: number;  // 0-6 for WHO/WHAT/HOW/WHEN/WHERE/WHY
    totalScore: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * Calculate final score based on session performance.
 * Scoring formula:
 * - Base: 1000 points
 * - Days penalty: -100 per day used (after day 1)
 * - AP efficiency bonus: +50 per unused AP (from max 18)
 * - Contradictions bonus: +75 per contradiction found
 * - Hints penalty: -150 per hint used
 * - First-try solve bonus: +200
 * - Perfect solve bonus: +300 (all 6 parts correct)
 */
export function calculateScore(
    session: PlayerSession,
    correctParts: number,
    firstTrySolve: boolean
): GameScore {
    const BASE_SCORE = 1000;
    const DAY_PENALTY = 100;
    const UNUSED_AP_BONUS = 50;
    const CONTRADICTION_BONUS = 75;
    const HINT_PENALTY = 150;
    const FIRST_TRY_BONUS = 200;
    const PERFECT_SOLVE_BONUS = 300;

    const maxTotalAP = session.maxDays * session.maxActionPoints; // Usually 18

    let score = BASE_SCORE;

    // Days penalty (day 1 is free)
    score -= (session.currentDay - 1) * DAY_PENALTY;

    // AP efficiency bonus
    const unusedAP = maxTotalAP - session.totalAPSpent;
    score += unusedAP * UNUSED_AP_BONUS;

    // Contradictions bonus
    score += session.contradictionsFound * CONTRADICTION_BONUS;

    // Hints penalty
    score -= session.hintsUsed * HINT_PENALTY;

    // First-try solve bonus
    if (firstTrySolve && correctParts === 6) {
        score += FIRST_TRY_BONUS;
    }

    // Perfect solve bonus
    if (correctParts === 6) {
        score += PERFECT_SOLVE_BONUS;
    } else {
        // Partial solve penalty
        score -= (6 - correctParts) * 100;
    }

    // Floor at 0
    score = Math.max(0, score);

    // Calculate grade
    let grade: GameScore['grade'];
    if (score >= 1500) grade = 'S';
    else if (score >= 1200) grade = 'A';
    else if (score >= 900) grade = 'B';
    else if (score >= 600) grade = 'C';
    else if (score >= 300) grade = 'D';
    else grade = 'F';

    return {
        daysUsed: session.currentDay,
        totalAP: session.totalAPSpent,
        contradictions: session.contradictionsFound,
        hintsUsed: session.hintsUsed,
        firstTrySolve,
        correctParts,
        totalScore: score,
        grade,
    };
}

// ============================================================================
// Share Artifact (Spec 15.2)
// ============================================================================

const ACTION_EMOJI: Record<ActionType, string> = {
    search: '🔍',
    interview: '🗣️',
    logs: '📟',
    compare: '⚖️',
    hint: '💡',
};

/**
 * Generate a non-spoiler share artifact.
 * Format:
 * KOA #42 - 3/6 ✅
 * 📅 Day 1: 🗣️🔍📟
 * 📅 Day 2: 🗣️🗣️⚖️
 * ⚡ 2 contradictions
 * 🏆 Score: 1250 (A)
 */
export function generateShareArtifact(
    session: PlayerSession,
    score: GameScore,
    won: boolean,
    seed: number
): string {
    const lines: string[] = [];

    // Header
    const resultEmoji = won ? '✅' : '❌';
    lines.push(`KOA #${seed} - ${score.correctParts}/6 ${resultEmoji}`);

    // Action history by day
    const actionsByDay = new Map<number, ActionRecord[]>();
    for (const action of session.actionHistory) {
        const existing = actionsByDay.get(action.day) ?? [];
        existing.push(action);
        actionsByDay.set(action.day, existing);
    }

    for (let day = 1; day <= session.currentDay; day++) {
        const actions = actionsByDay.get(day) ?? [];
        const emojis = actions.map(a => ACTION_EMOJI[a.type]).join('');
        lines.push(`📅 Day ${day}: ${emojis || '💤'}`);
    }

    // Contradictions
    if (score.contradictions > 0) {
        lines.push(`⚡ ${score.contradictions} contradiction${score.contradictions > 1 ? 's' : ''}`);
    }

    // Score
    lines.push(`🏆 Score: ${score.totalScore} (${score.grade})`);

    return lines.join('\n');
}

// ============================================================================
// Truth Replay (Spec 18)
// ============================================================================

export interface ReplayEvent {
    window: string;
    tick: number;
    description: string;
    actors: string[];
    place?: string;
    isKeyEvent: boolean;  // Crime-related events
    evidenceHint?: string;  // What evidence this generated
}

/**
 * Generate the truth replay sequence from event log.
 * Shows what actually happened, chronologically.
 */
export function generateTruthReplay(session: PlayerSession): ReplayEvent[] {
    const replay: ReplayEvent[] = [];
    const config = session.config;
    const world = session.world;

    // Helper to get NPC name
    const getNpcName = (id: string) => world.npcs.find(n => n.id === id)?.name ?? id;
    const getItemName = (id: string) => world.items.find(i => i.id === id)?.funnyName ?? id;
    const getPlaceName = (id: string) => world.places.find(p => p.id === id)?.name ?? id;

    // Key event types to highlight
    const keyEventTypes = new Set(['ITEM_TAKEN', 'ITEM_HIDDEN', 'ITEM_SWAPPED', 'ITEM_DROPPED']);

    // Group events by window for better narrative flow
    let currentWindow = '';

    for (const event of session.eventLog) {
        const isKeyEvent = keyEventTypes.has(event.type) ||
            (event.actor === config.culpritId && event.window === config.crimeWindow);

        let description = '';
        let evidenceHint: string | undefined;

        switch (event.type) {
            case 'NPC_MOVE':
                description = `${getNpcName(event.actor!)} moved from ${getPlaceName(event.fromPlace!)} to ${getPlaceName(event.toPlace!)}`;
                evidenceHint = 'Motion sensors triggered';
                break;

            case 'DOOR_OPENED':
                description = `${getNpcName(event.actor!)} opened the door to ${getPlaceName(event.toPlace!)}`;
                evidenceHint = 'Door sensor logged';
                break;

            case 'DOOR_CLOSED':
                description = `${getNpcName(event.actor!)} closed the door`;
                break;

            case 'MOTION_DETECTED':
                description = `Motion detected in ${getPlaceName(event.place!)}`;
                evidenceHint = 'Motion sensor triggered';
                break;

            case 'CAMERA_SNAPSHOT':
                const carrying = event.data?.carrying ? ` carrying something` : '';
                description = `Camera captured a figure${carrying} in ${getPlaceName(event.place!)}`;
                evidenceHint = 'Camera snapshot recorded';
                break;

            case 'ITEM_TAKEN':
                description = `⚠️ ${getNpcName(event.actor!)} took ${getItemName(event.target as string)} from ${getPlaceName(event.place!)}`;
                evidenceHint = 'Item went missing from this location';
                break;

            case 'ITEM_HIDDEN':
                description = `⚠️ ${getNpcName(event.actor!)} hid ${getItemName(event.target as string)} in ${getPlaceName(event.place!)}`;
                evidenceHint = 'Item found here later';
                break;

            case 'ITEM_SWAPPED':
                description = `⚠️ ${getNpcName(event.actor!)} swapped ${getItemName(event.target as string)}`;
                evidenceHint = 'Decoy discovered';
                break;

            case 'ACTIVITY_STARTED':
                const activityDesc = (event.data as any)?.description ?? 'doing something suspicious';
                description = `${getNpcName(event.actor!)} was ${activityDesc} in ${getPlaceName(event.place!)}`;
                evidenceHint = 'Red herring activity';
                break;

            case 'TRACE_FOUND':
                const trace = (event.data as any)?.trace ?? 'evidence';
                description = `${trace} left in ${getPlaceName(event.place!)}`;
                evidenceHint = 'Physical evidence discoverable';
                break;

            default:
                // Skip uninteresting events
                continue;
        }

        // Add window transition marker
        if (event.window !== currentWindow) {
            currentWindow = event.window;
            replay.push({
                window: event.window,
                tick: event.tick,
                description: `═══ ${event.window} ═══`,
                actors: [],
                isKeyEvent: false,
            });
        }

        replay.push({
            window: event.window,
            tick: event.tick,
            description,
            actors: event.actor ? [getNpcName(event.actor)] : [],
            place: event.place ? getPlaceName(event.place) : undefined,
            isKeyEvent,
            evidenceHint: isKeyEvent ? evidenceHint : undefined,
        });
    }

    return replay;
}

/**
 * Format truth replay as readable text.
 */
export function formatTruthReplay(session: PlayerSession): string {
    const replay = generateTruthReplay(session);
    const config = session.config;
    const world = session.world;

    const lines: string[] = [];

    // Header
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║                    📼 TRUTH REPLAY                           ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');

    // Case summary
    const culprit = world.npcs.find(n => n.id === config.culpritId);
    const item = world.items.find(i => i.id === config.targetItem);
    lines.push(`The culprit was: ${culprit?.name ?? config.culpritId}`);
    lines.push(`The crime: ${config.crimeType} of ${item?.funnyName ?? config.targetItem}`);
    lines.push(`Method: ${config.crimeMethod.funnyMethod}`);
    lines.push(`Motive: ${config.motive.funnyReason}`);
    lines.push('');
    lines.push('Here\'s what really happened...');
    lines.push('');

    // Replay events (filter to key events only for readability)
    let lastWindow = '';
    for (const event of replay) {
        // Window headers
        if (event.description.startsWith('═══')) {
            if (event.window === config.crimeWindow) {
                lines.push('');
                lines.push(`${event.description} ⚠️ CRIME WINDOW ⚠️`);
            } else {
                lines.push('');
                lines.push(event.description);
            }
            lastWindow = event.window;
            continue;
        }

        // Only show key events and some context
        if (event.isKeyEvent) {
            lines.push(`  ${event.description}`);
            if (event.evidenceHint) {
                lines.push(`    └─ Evidence: ${event.evidenceHint}`);
            }
        } else if (event.window === config.crimeWindow) {
            // Show all events in crime window for context
            lines.push(`  ${event.description}`);
        }
    }

    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                      THE END');
    lines.push('───────────────────────────────────────────────────────────────');

    return lines.join('\n');
}
