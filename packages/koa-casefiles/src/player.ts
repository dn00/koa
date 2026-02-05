import { CaseConfig, EvidenceItem, World } from './types.js';

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

    // The Truth (Hidden from direct access, used by Executors)
    readonly world: World;
    readonly config: CaseConfig;
    readonly allEvidence: EvidenceItem[]; // The full derived truth

    constructor(
        world: World,
        config: CaseConfig,
        allEvidence: EvidenceItem[],
        maxDays = 5,
        apPerDay = 3
    ) {
        this.world = world;
        this.config = config;
        this.allEvidence = allEvidence;
        this.maxDays = maxDays;
        this.maxActionPoints = apPerDay;
        this.actionPoints = apPerDay;
    }

    /**
     * Spending AP. Returns true if successful.
     */
    spendAP(cost: number): boolean {
        if (this.actionPoints >= cost) {
            this.actionPoints -= cost;
            return true;
        }
        return false;
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
}

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
