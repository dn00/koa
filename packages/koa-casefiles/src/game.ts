#!/usr/bin/env node
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { simulate } from './sim.js';
import { deriveEvidence } from './evidence.js';
import { PlayerSession, calculateScore, generateShareArtifact, formatTruthReplay, ActionType } from './player.js';
import { performSearch, performInterview, checkLogs, compareEvidence, ActionResult, InterviewMode } from './actions.js';
import { findContradictions, findKeystonePair } from './validators.js';
import type { CrimeType, MotiveType, MethodId, EvidenceItem, EvidenceKind } from './types.js';
import { METHODS_BY_CRIME } from './types.js';
import * as koa from './koa-voice.js';
import { BarkState, fireBark, fireFirstEvidence, fireShapeTell, formatBark, CaseShape } from './barks.js';

// ============================================================================
// State Persistence
// ============================================================================

interface SavedState {
    currentDay: number;
    actionPoints: number;
    knownEvidenceIds: string[];  // Store IDs, reconstruct from allEvidence
    // Scoring state
    totalAPSpent: number;
    contradictionsFound: number;
    hintsUsed: number;
    actionHistory: Array<{
        type: ActionType;
        day: number;
        apCost: number;
        target?: string;
    }>;
    // Bark state
    barkUsedIds?: string[];
    barkSeenCategories?: EvidenceKind[];
    barkShapeTellFired?: boolean;
    barkTotal?: number;
}

function getSaveFilePath(seed: number): string {
    return join(process.cwd(), `.koa-save-${seed}.json`);
}

function saveState(session: PlayerSession, seed: number, barkState?: BarkState): void {
    const state: SavedState = {
        currentDay: session.currentDay,
        actionPoints: session.actionPoints,
        knownEvidenceIds: session.knownEvidence.map(e => e.id),
        totalAPSpent: session.totalAPSpent,
        contradictionsFound: session.contradictionsFound,
        hintsUsed: session.hintsUsed,
        actionHistory: session.actionHistory,
    };
    // Note: BarkState internals are private, so we track separately if needed
    // For now, barks don't persist - they reset on reload (acceptable for MVP)
    writeFileSync(getSaveFilePath(seed), JSON.stringify(state, null, 2));
}

function loadState(session: PlayerSession, seed: number, barkState?: BarkState): boolean {
    const path = getSaveFilePath(seed);
    if (!existsSync(path)) return false;

    try {
        const state: SavedState = JSON.parse(readFileSync(path, 'utf-8'));
        session.currentDay = state.currentDay;
        session.actionPoints = state.actionPoints;

        // Reconstruct knownEvidence from IDs
        for (const id of state.knownEvidenceIds) {
            const evidence = session.allEvidence.find(e => e.id === id);
            if (evidence) {
                session.knownEvidence.push(evidence);
            }
        }

        // Restore scoring state (with defaults for older saves)
        session.totalAPSpent = state.totalAPSpent ?? 0;
        session.contradictionsFound = state.contradictionsFound ?? 0;
        session.hintsUsed = state.hintsUsed ?? 0;
        session.actionHistory = session.actionHistory ?? [];

        // Mark categories as seen for bark state (based on evidence we already have)
        if (barkState) {
            for (const e of session.knownEvidence) {
                barkState.markCategorySeen(e.kind);
            }
        }

        return true;
    } catch {
        return false;
    }
}

function resetState(seed: number): void {
    const path = getSaveFilePath(seed);
    if (existsSync(path)) {
        unlinkSync(path);
    }
}

// ============================================================================
// Valid Options (for accusation)
// ============================================================================

const VALID_CRIME_TYPES: CrimeType[] = ['theft', 'sabotage', 'prank', 'disappearance'];
const VALID_MOTIVES: MotiveType[] = ['envy', 'embarrassment', 'cover_up', 'rivalry', 'attention', 'revenge', 'chaos'];
const VALID_WINDOWS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
const VALID_PLACES = ['kitchen', 'living', 'bedroom', 'office', 'garage'];
const VALID_METHODS: MethodId[] = [
    'grabbed', 'pocketed', 'smuggled',      // theft
    'broke', 'unplugged', 'reprogrammed',   // sabotage
    'relocated', 'swapped', 'disguised',    // prank
    'hid', 'buried', 'donated',             // disappearance
];

// ============================================================================
// Shape Detection (heuristic for bark selection)
// ============================================================================

function detectCaseShape(config: import('./types.js').CaseConfig): CaseShape {
    // TODO: More sophisticated detection based on blueprint type
    // For now, use heuristics based on crime type and twists

    if (config.twist?.type === 'planted_evidence') return 'frame_job';
    if (config.twist?.type === 'accomplice') return 'collusion';
    if (config.twist?.type === 'tampered_device') return 'two_step';

    // Default based on crime complexity
    if (config.suspiciousActs.length >= 2) return 'constraint';

    return 'classic';
}

// ============================================================================
// Types & Args
// ============================================================================

interface GameArgs {
    seed: number;
    agentMode: boolean;
    cmd?: string;        // Single command mode
    reset?: boolean;     // Reset saved state
    houseId?: string;    // House layout to use
    castId?: string;     // Cast of NPCs to use
}

function parseArgs(): GameArgs {
    const args = process.argv.slice(2);
    let seed = Math.floor(Math.random() * 10000);
    let agentMode = false;
    let cmd: string | undefined;
    let reset = false;
    let houseId: string | undefined;
    let castId: string | undefined;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--seed' || args[i] === '-s') {
            seed = parseInt(args[++i], 10);
        } else if (args[i] === '--agent-mode') {
            agentMode = true;
        } else if (args[i] === '--cmd' || args[i] === '-c') {
            cmd = args[++i];
        } else if (args[i] === '--reset') {
            reset = true;
        } else if (args[i] === '--house') {
            houseId = args[++i];
        } else if (args[i] === '--cast') {
            castId = args[++i];
        }
    }

    return { seed, agentMode, cmd, reset, houseId, castId };
}

// ============================================================================
// Output Formatter
// ============================================================================

function print(msg: string, agentMode: boolean, json?: any) {
    if (agentMode) {
        if (json) {
            console.log(JSON.stringify(json));
        } else {
            // For simple messages in agent mode, wrap in JSON
            console.log(JSON.stringify({ type: 'info', message: msg }));
        }
    } else {
        console.log(msg);
    }
}

// ============================================================================
// Evidence Summary Helper
// ============================================================================

function summarizeEvidence(e: import('./types.js').EvidenceItem): string {
    switch (e.kind) {
        case 'presence':
            return `${e.npc} in ${e.place} during ${e.window}`;
        case 'device_log':
            return `${e.detail} at ${e.place} (${e.window})`;
        case 'testimony':
            return `${e.witness}: "${e.observable}" (${e.window}, ${e.place})`;
        case 'physical': {
            const methodHint = e.methodTag ? ` [HOW: ${e.methodTag}]` : '';
            return `${e.detail}${methodHint}`;
        }
        case 'motive':
            return `${e.gossipSource} says: "${e.hint}"`;
        default:
            return JSON.stringify(e);
    }
}

// Track if CLOSE_TO_SOLVE has fired (only once per session)
let closeToSolveFired = false;

/**
 * Check if player is close to solving (≥4/6 dimensions covered).
 * Fires CLOSE_TO_SOLVE bark once when threshold is reached.
 */
function checkCloseToSolve(
    session: PlayerSession,
    barkState: BarkState,
    agentMode: boolean
): void {
    if (closeToSolveFired) return;

    const coverage = session.getCoverage();
    let dimensionsCovered = 0;
    if (coverage.who.count > 0) dimensionsCovered++;
    if (coverage.what.count > 0) dimensionsCovered++;
    if (coverage.how.count > 0) dimensionsCovered++;
    if (coverage.when.count > 0) dimensionsCovered++;
    if (coverage.where.count > 0) dimensionsCovered++;
    if (coverage.why.count > 0) dimensionsCovered++;

    if (dimensionsCovered >= 4) {
        closeToSolveFired = true;
        const shape = detectCaseShape(session.config);
        const bark = fireBark(barkState, 'CLOSE_TO_SOLVE', { shape, turn: session.currentDay });
        if (bark) print(formatBark(bark), agentMode);
    }
}

// ============================================================================
// Main Loop
// ============================================================================

async function main() {
    const args = parseArgs();

    // Reset module-level state
    closeToSolveFired = false;

    // Handle reset
    if (args.reset) {
        resetState(args.seed);
        console.log(`Reset save state for seed ${args.seed}`);
        if (!args.cmd) process.exit(0);
    }

    // 1. Sim
    const result = simulate(args.seed, 2, {
        houseId: args.houseId,
        castId: args.castId,
    });
    if (!result) {
        console.error('Failed to generate case.');
        process.exit(1);
    }

    // 2. Evidence
    const evidence = deriveEvidence(result.world, result.eventLog, result.config);

    // 3. Session (include eventLog for truth replay)
    const session = new PlayerSession(result.world, result.config, evidence, result.eventLog);

    // 4. Bark state
    const barkState = new BarkState(10);

    // Load saved state if exists
    const hadSave = loadState(session, args.seed, barkState);

    // =========================================================================
    // Single Command Mode (--cmd)
    // =========================================================================
    if (args.cmd) {
        // Execute single command, save state, exit
        console.log(JSON.stringify({
            type: 'state',
            day: session.currentDay,
            ap: session.actionPoints,
            maxAp: session.maxActionPoints,
            resumed: hadSave
        }));

        await handleCommand(args.cmd.trim(), session, true, args.seed, barkState);

        // Save state after command
        saveState(session, args.seed, barkState);

        // Check for time up
        if (session.isTimeUp()) {
            console.log(JSON.stringify({ type: 'game_over', reason: 'timeout' }));
        }

        process.exit(0);
    }

    // =========================================================================
    // Interactive Mode
    // =========================================================================
    const rl = createInterface({ input, output });

    print(koa.formatIntroBanner(args.seed, hadSave), args.agentMode);

    // Fire CASE_OPEN bark (only on fresh start)
    if (!hadSave) {
        const shape = detectCaseShape(result.config);
        const itemName = result.world.items.find(i => i.id === result.config.targetItem)?.name ?? result.config.targetItem;
        const openBark = fireBark(barkState, 'CASE_OPEN', { shape, item: itemName });
        if (openBark) {
            print(formatBark(openBark), args.agentMode);
        }
    }

    // 4. Loop
    let gameRunning = true;
    while (gameRunning) {
        // Status Line
        if (args.agentMode) {
            console.log(JSON.stringify({
                type: 'state',
                day: session.currentDay,
                ap: session.actionPoints,
                maxAp: session.maxActionPoints
            }));
        } else {
            console.log(`\n${koa.formatStatusLine(session.currentDay, session.maxDays, session.actionPoints, session.maxActionPoints)}`);
            const answer = await rl.question('command> ');
            await handleCommand(answer.trim(), session, args.agentMode, args.seed, barkState);
            saveState(session, args.seed, barkState);  // Auto-save after each command
        }

        // In agent mode, we read line by line from stdin
        if (args.agentMode) {
            const answer = await rl.question('');
            await handleCommand(answer.trim(), session, args.agentMode, args.seed, barkState);
            saveState(session, args.seed, barkState);  // Auto-save after each command
        }

        if (session.isTimeUp()) {
            print('⏰ TIME UP! The trail has gone cold.', args.agentMode, { type: 'game_over', reason: 'timeout' });
            gameRunning = false;
        }
    }

    rl.close();

    async function handleCommand(cmdStr: string, session: PlayerSession, agentMode: boolean, gameSeed: number, barkState: BarkState) {
        const parts = cmdStr.split(' ');
        const verb = parts[0].toUpperCase();
        const cmdArgs = parts.slice(1);

        try {
            switch (verb) {
                case 'SEARCH': {
                    // SEARCH living W3
                    if (cmdArgs.length < 2) throw new Error('Usage: SEARCH <place> <window>');

                    // Check for lead discount
                    const searchLead = session.matchesLead(cmdArgs[0], cmdArgs[1]);
                    const searchFree = !!searchLead;
                    if (searchLead) {
                        session.useLead(searchLead);
                        print(`🎯 LEAD USED: ${searchLead.reason} (FREE action)`, agentMode);
                    }

                    const searchResult = performSearch(session, cmdArgs[0], cmdArgs[1], searchFree);
                    const searchEvidence = searchResult.evidence.filter(e => e.kind === 'physical') as import('./types.js').PhysicalEvidence[];
                    const gatedHint = searchResult.resultCode === 'GATED';
                    const formatted = koa.formatSearch(cmdArgs[0], cmdArgs[1], searchEvidence, gatedHint);
                    print(formatted, agentMode, {
                        type: 'action_result',
                        success: searchResult.success,
                        message: searchResult.message,
                        evidence: searchResult.evidence,
                        resultCode: searchResult.resultCode
                    });

                    // Fire reactive barks based on result
                    const shape = detectCaseShape(session.config);
                    if (searchResult.resultCode === 'EMPTY') {
                        const emptyBark = fireBark(barkState, 'SEARCH_EMPTY', { shape, turn: session.currentDay });
                        if (emptyBark) print(formatBark(emptyBark), agentMode);
                    } else if (searchResult.resultCode === 'GATED') {
                        const gatedBark = fireBark(barkState, 'SEARCH_GATED', { shape, turn: session.currentDay });
                        if (gatedBark) print(formatBark(gatedBark), agentMode);
                    }

                    // Fire FIRST_EVIDENCE and METHOD_FOUND barks if physical evidence found
                    if (searchEvidence.length > 0) {
                        const bark = fireFirstEvidence(barkState, 'physical', { shape, turn: session.currentDay });
                        if (bark) print(formatBark(bark), agentMode);

                        // Fire METHOD_FOUND if evidence has methodTag
                        const hasMethod = searchEvidence.some(e => e.methodTag);
                        if (hasMethod) {
                            const methodBark = fireBark(barkState, 'METHOD_FOUND', { shape, turn: session.currentDay });
                            if (methodBark) print(formatBark(methodBark), agentMode);
                        }

                        // Maybe fire SHAPE_TELL (early in game)
                        if (session.currentDay <= 2 && !barkState.hasShapeTellFired()) {
                            const shapeBark = fireShapeTell(barkState, shape, { turn: session.currentDay });
                            if (shapeBark) print(formatBark(shapeBark), agentMode);
                        }

                        // Offer lead if this is crime-related evidence
                        if (session.leads.length < 2) {
                            const isCrimeScene = searchEvidence.some(e =>
                                e.place === session.config.crimePlace ||
                                e.place === session.config.hiddenPlace
                            );
                            if (isCrimeScene) {
                                const leadAdded = session.addLead(
                                    { place: cmdArgs[0], window: cmdArgs[1] },
                                    `Found evidence at ${cmdArgs[0]}`
                                );
                                if (leadAdded) {
                                    print(`🎯 NEW LEAD: "${cmdArgs[0]}/${cmdArgs[1]}" - Your next action here is FREE`, agentMode);
                                }
                            }
                        }
                    }
                    checkCloseToSolve(session, barkState, agentMode);
                    return;
                }

                case 'INTERVIEW': {
                    // INTERVIEW alice W2 testimony  OR  INTERVIEW alice gossip
                    // Gossip doesn't need a window (it's general household drama)
                    let interviewSuspect: string;
                    let interviewWindow: string;
                    let interviewMode: InterviewMode;

                    if (cmdArgs.length >= 2 && cmdArgs[1].toLowerCase() === 'gossip') {
                        // Short form: INTERVIEW <npc> gossip
                        interviewSuspect = cmdArgs[0];
                        interviewWindow = ''; // unused for gossip
                        interviewMode = 'gossip';
                    } else if (cmdArgs.length >= 3) {
                        // Full form: INTERVIEW <npc> <window> <mode>
                        interviewSuspect = cmdArgs[0];
                        interviewWindow = cmdArgs[1];
                        interviewMode = cmdArgs[2].toLowerCase() as InterviewMode;
                        if (interviewMode !== 'testimony' && interviewMode !== 'gossip') {
                            throw new Error('Interview mode must be "testimony" or "gossip"');
                        }
                    } else {
                        throw new Error(
                            'Usage:\n' +
                            '  INTERVIEW <npc> <window> testimony  - What did they see/hear?\n' +
                            '  INTERVIEW <npc> gossip              - What drama do they know?'
                        );
                    }
                    // Check for lead discount
                    const interviewLead = session.matchesLead(undefined, interviewWindow, interviewSuspect);
                    const interviewFree = !!interviewLead;
                    if (interviewLead) {
                        session.useLead(interviewLead);
                        print(`🎯 LEAD USED: ${interviewLead.reason} (FREE action)`, agentMode);
                    }

                    const interviewResult = performInterview(session, interviewSuspect, interviewWindow, interviewMode, interviewFree);

                    // Format with KOA voice based on mode
                    let formatted: string;
                    if (interviewMode === 'gossip') {
                        const motiveEvidence = interviewResult.evidence.filter(e => e.kind === 'motive') as import('./types.js').MotiveEvidence[];
                        formatted = koa.formatGossip(interviewSuspect, motiveEvidence);
                    } else {
                        const testimonyEvidence = interviewResult.evidence.filter(e => e.kind === 'testimony') as import('./types.js').TestimonyEvidence[];
                        formatted = koa.formatTestimony(interviewSuspect, interviewWindow, testimonyEvidence);
                    }

                    print(formatted, agentMode, {
                        type: 'action_result',
                        success: interviewResult.success,
                        message: interviewResult.message,
                        evidence: interviewResult.evidence
                    });

                    // Fire FIRST_EVIDENCE bark based on evidence type
                    const shape = detectCaseShape(session.config);
                    if (interviewMode === 'gossip') {
                        const motiveEv = interviewResult.evidence.filter(e => e.kind === 'motive');
                        if (motiveEv.length > 0) {
                            const bark = fireFirstEvidence(barkState, 'motive', { shape, turn: session.currentDay });
                            if (bark) print(formatBark(bark), agentMode);
                        }
                    } else {
                        const testimonyEv = interviewResult.evidence.filter(e => e.kind === 'testimony');
                        if (testimonyEv.length > 0) {
                            const bark = fireFirstEvidence(barkState, 'testimony', { shape, turn: session.currentDay });
                            if (bark) print(formatBark(bark), agentMode);
                        }
                    }

                    // Maybe fire SHAPE_TELL
                    if (session.currentDay <= 2 && !barkState.hasShapeTellFired()) {
                        const shapeBark = fireShapeTell(barkState, shape, { turn: session.currentDay });
                        if (shapeBark) print(formatBark(shapeBark), agentMode);
                    }
                    checkCloseToSolve(session, barkState, agentMode);
                    return;
                }

                case 'COMPARE': {
                    // COMPARE evidence_id_1 evidence_id_2
                    if (cmdArgs.length < 2) {
                        throw new Error('Usage: COMPARE <evidence_id_1> <evidence_id_2>');
                    }
                    const compareResult = compareEvidence(session, cmdArgs[0], cmdArgs[1]);

                    // Track contradictions found (for scoring)
                    if (compareResult.success && compareResult.contradiction) {
                        session.recordContradiction();
                        // Also record the compare action
                        session.actionHistory.push({
                            type: 'compare',
                            day: session.currentDay,
                            apCost: 0,
                            target: `${cmdArgs[0]}:${cmdArgs[1]}`,
                        });
                    }

                    // Format with KOA voice
                    const isContradiction = compareResult.success && 'contradiction' in compareResult && compareResult.contradiction;
                    const explanation = isContradiction && 'rule' in compareResult ? compareResult.rule : '';
                    const formatted = koa.formatCompare(cmdArgs[0], cmdArgs[1], isContradiction, explanation);

                    print(formatted, agentMode, {
                        type: 'compare_result',
                        ...compareResult
                    });

                    // Fire CONTRADICTION bark
                    if (isContradiction) {
                        const shape = detectCaseShape(session.config);
                        const bark = fireBark(barkState, 'CONTRADICTION', { shape, turn: session.currentDay });
                        if (bark) print(formatBark(bark), agentMode);

                        // Offer lead on the implicated NPC
                        if (session.leads.length < 2 && 'implicated' in compareResult) {
                            const implicated = (compareResult as any).implicated;
                            if (implicated && implicated.length > 0) {
                                const leadAdded = session.addLead(
                                    { npc: implicated[0] },
                                    `${implicated[0]} has inconsistent story`
                                );
                                if (leadAdded) {
                                    print(`🎯 NEW LEAD: Interview "${implicated[0]}" - Your next interview with them is FREE`, agentMode);
                                }
                            }
                        }
                    }
                    return;
                }

                case 'EVIDENCE': {
                    // Show collected evidence
                    const known = session.knownEvidence;
                    if (known.length === 0) {
                        print('No evidence collected yet.', agentMode, { type: 'evidence_list', evidence: [] });
                    } else {
                        const summary = known.map(e => `${e.id}: [${e.kind}] ${summarizeEvidence(e)}`).join('\n');
                        print(`Collected evidence (${known.length} items):\n${summary}`, agentMode, {
                            type: 'evidence_list',
                            evidence: known
                        });
                    }
                    return;
                }

                case 'STATUS':
                case 'COVERAGE': {
                    // Show coverage meter - what dimensions have evidence
                    const coverage = session.getCoverage();
                    const formatted = koa.formatCoverage(coverage, session.knownEvidence.length);
                    print(formatted, agentMode, {
                        type: 'coverage',
                        coverage
                    });
                    return;
                }

                case 'HINT': {
                    // Give a hint (costs score, 1 per game)
                    if (session.hintsUsed >= 1) {
                        print(`┌─────────────────────────────────────────────────────┐
│ 💡 NO HINTS REMAINING                               │
├─────────────────────────────────────────────────────┤
│ KOA: You already used your hint. I'm not a charity. │
│      Figure it out yourself.                        │
└─────────────────────────────────────────────────────┘`, agentMode, {
                            type: 'hint_denied',
                            reason: 'already_used'
                        });
                        return;
                    }

                    session.recordHint();
                    const coverage = session.getCoverage();

                    // Generate suggestion based on what's missing
                    let suggestion = 'Check EVIDENCE and look for patterns.';
                    if (coverage.why.count === 0) {
                        suggestion = 'Try INTERVIEW <npc> gossip for motive.';
                    } else if (coverage.when.count === 0) {
                        suggestion = 'Try LOGS door <window> to track movement.';
                    } else if (coverage.who.count < 3) {
                        suggestion = 'Interview more people for testimony.';
                    } else if (coverage.where.count === 0) {
                        suggestion = 'Try SEARCH <place> <window> for physical evidence.';
                    }

                    const formatted = koa.formatHint(coverage, 0, suggestion);
                    print(formatted, agentMode, {
                        type: 'hint',
                        coverage,
                        suggestion,
                        hintsRemaining: 0
                    });
                    return;
                }

                case 'WHEREABOUTS': {
                    // Show where each NPC was per window based on collected evidence
                    const whereabouts = session.getWhereabouts();
                    const formatted = koa.formatWhereabouts(whereabouts, session.config.suspects);
                    print(formatted, agentMode, {
                        type: 'whereabouts',
                        whereabouts
                    });
                    return;
                }

                case 'LOGS': {
                    // LOGS motion W1
                    if (cmdArgs.length < 2) throw new Error('Usage: LOGS <device> <window>');

                    // Check for lead discount
                    const logsLead = session.matchesLead(undefined, cmdArgs[1]);
                    const logsFree = !!logsLead;
                    if (logsLead) {
                        session.useLead(logsLead);
                        print(`🎯 LEAD USED: ${logsLead.reason} (FREE action)`, agentMode);
                    }

                    const logsResult = checkLogs(session, cmdArgs[0], cmdArgs[1], logsFree);
                    const logEvidence = logsResult.evidence.filter(e => e.kind === 'device_log') as import('./types.js').DeviceLogEvidence[];

                    // Parse "more available" count from message
                    const moreMatch = logsResult.message.match(/\((\d+) more available\)/);
                    const moreAvailable = moreMatch ? parseInt(moreMatch[1], 10) : 0;

                    const formatted = koa.formatLogs(cmdArgs[0], cmdArgs[1], logEvidence, moreAvailable);
                    print(formatted, agentMode, {
                        type: 'action_result',
                        success: logsResult.success,
                        message: logsResult.message,
                        evidence: logsResult.evidence
                    });

                    // Fire FIRST_EVIDENCE bark for device logs
                    if (logEvidence.length > 0) {
                        const shape = detectCaseShape(session.config);
                        const bark = fireFirstEvidence(barkState, 'device_log', { shape, turn: session.currentDay });
                        if (bark) print(formatBark(bark), agentMode);

                        // Maybe fire SHAPE_TELL
                        if (session.currentDay <= 2 && !barkState.hasShapeTellFired()) {
                            const shapeBark = fireShapeTell(barkState, shape, { turn: session.currentDay });
                            if (shapeBark) print(formatBark(shapeBark), agentMode);
                        }
                    }
                    checkCloseToSolve(session, barkState, agentMode);
                    return;
                }

                case 'NEXT_DAY': {
                    const wasDay2 = session.currentDay === 2;
                    if (session.nextDay()) {
                        print('You sleep. A new day begins.', agentMode, { type: 'event', message: 'New Day' });

                        // Cover-up DISABLED: playtest showed it adds stress without adding fun
                        // (tuner confirmed 0 effect on playability, players felt punished for exploring)
                        // To re-enable for hard mode, uncomment below:
                        // if (wasDay2 && !session.coverUpApplied) {
                        //     const removed = session.applyCoverUp();
                        //     if (removed) {
                        //         const coverUpBark = `The culprit has been busy. Some evidence may no longer be available.`;
                        //         print(formatBark(coverUpBark), agentMode, {
                        //             type: 'cover_up',
                        //             message: 'Evidence degraded overnight',
                        //         });
                        //     }
                        // }
                    } else {
                        print('Cannot advance day.', agentMode);
                    }
                    return;
                }

                case 'SUGGEST':
                case 'COMPARE_SUGGEST': {
                    // KOA suggests a keystone comparison (once per game)
                    if (session.compareSuggestUsed) {
                        print(`KOA: I already gave you a hint. Figure it out yourself.`, agentMode, {
                            type: 'suggest_denied',
                            reason: 'already_used',
                        });
                        return;
                    }

                    // Need some evidence first
                    if (session.knownEvidence.length < 4) {
                        print(`KOA: Gather more evidence first. I need data to work with.`, agentMode, {
                            type: 'suggest_denied',
                            reason: 'not_enough_evidence',
                        });
                        return;
                    }

                    session.compareSuggestUsed = true;

                    // Find keystone pair from known evidence
                    const knownContradictions = findContradictions(session.knownEvidence, session.config);
                    const keystone = findKeystonePair(session.config, session.knownEvidence, knownContradictions);

                    if (keystone) {
                        print(
                            `┌─────────────────────────────────────────────────────┐\n` +
                            `│ 🔍 KOA ANALYSIS                                     │\n` +
                            `├─────────────────────────────────────────────────────┤\n` +
                            `│ I've detected two pieces of evidence that are...    │\n` +
                            `│ unusually incompatible.                             │\n` +
                            `│                                                     │\n` +
                            `│ Try: COMPARE ${keystone.evidenceA} ${keystone.evidenceB}\n` +
                            `│                                                     │\n` +
                            `│ "${keystone.description}"                           │\n` +
                            `└─────────────────────────────────────────────────────┘`,
                            agentMode,
                            {
                                type: 'compare_suggest',
                                evidenceA: keystone.evidenceA,
                                evidenceB: keystone.evidenceB,
                                hint: keystone.description,
                            }
                        );
                    } else {
                        // No contradiction in known evidence yet - hint at what to look for
                        print(
                            `┌─────────────────────────────────────────────────────┐\n` +
                            `│ 🔍 KOA ANALYSIS                                     │\n` +
                            `├─────────────────────────────────────────────────────┤\n` +
                            `│ I don't see an obvious contradiction yet.           │\n` +
                            `│ Someone's story should conflict with the logs...    │\n` +
                            `│ Keep investigating.                                 │\n` +
                            `└─────────────────────────────────────────────────────┘`,
                            agentMode,
                            { type: 'compare_suggest', noContradiction: true }
                        );
                    }
                    return;
                }

                case 'LEADS': {
                    // Show active leads
                    const activeLeads = session.getActiveLeads();
                    if (activeLeads.length === 0) {
                        print(`No active leads. Find suspicious evidence to generate leads.`, agentMode, {
                            type: 'leads',
                            leads: [],
                        });
                    } else {
                        const leadLines = activeLeads.map(l => {
                            const scope = [l.scope.place, l.scope.window, l.scope.npc].filter(Boolean).join('/');
                            return `  • ${l.id}: ${scope} - "${l.reason}" (FREE action available)`;
                        });
                        print(
                            `┌─────────────────────────────────────────────────────┐\n` +
                            `│ 🎯 ACTIVE LEADS (${activeLeads.length}/2)                             │\n` +
                            `├─────────────────────────────────────────────────────┤\n` +
                            leadLines.join('\n') + '\n' +
                            `└─────────────────────────────────────────────────────┘`,
                            agentMode,
                            { type: 'leads', leads: activeLeads }
                        );
                    }
                    return;
                }

                case 'ACCUSE': {
                    // Full accusation: WHO WHAT HOW WHEN WHERE WHY
                    // e.g., ACCUSE alice theft grabbed W3 garage revenge
                    if (cmdArgs.length < 6) {
                        throw new Error(
                            'Usage: ACCUSE <who> <what> <how> <when> <where> <why>\n' +
                            '  who:   alice, bob, carol, dan, eve\n' +
                            '  what:  theft, sabotage, prank, disappearance\n' +
                            '  how:   grabbed/pocketed/smuggled (theft)\n' +
                            '         broke/unplugged/reprogrammed (sabotage)\n' +
                            '         relocated/swapped/disguised (prank)\n' +
                            '         hid/buried/donated (disappearance)\n' +
                            '  when:  W1, W2, W3, W4, W5, W6\n' +
                            '  where: kitchen, living, bedroom, office, garage\n' +
                            '  why:   envy, embarrassment, cover_up, rivalry, attention, revenge, chaos'
                        );
                    }

                    const [who, what, how, when, where, why] = cmdArgs.map(a => a.toLowerCase());
                    const config = session.config;

                    // Validate inputs
                    if (!config.suspects.includes(who)) {
                        throw new Error(`Unknown suspect: ${who}. Valid: ${config.suspects.join(', ')}`);
                    }
                    if (!VALID_CRIME_TYPES.includes(what as CrimeType)) {
                        throw new Error(`Unknown crime type: ${what}. Valid: ${VALID_CRIME_TYPES.join(', ')}`);
                    }
                    if (!VALID_METHODS.includes(how as MethodId)) {
                        throw new Error(`Unknown method: ${how}. Valid: ${VALID_METHODS.join(', ')}`);
                    }
                    // Also check that method matches crime type
                    const validMethodsForCrime = METHODS_BY_CRIME[what as CrimeType];
                    if (!validMethodsForCrime.includes(how as MethodId)) {
                        throw new Error(`Method "${how}" doesn't match crime type "${what}". Valid for ${what}: ${validMethodsForCrime.join(', ')}`);
                    }
                    if (!VALID_WINDOWS.includes(when.toUpperCase())) {
                        throw new Error(`Unknown window: ${when}. Valid: ${VALID_WINDOWS.join(', ')}`);
                    }
                    if (!VALID_PLACES.includes(where)) {
                        throw new Error(`Unknown place: ${where}. Valid: ${VALID_PLACES.join(', ')}`);
                    }
                    if (!VALID_MOTIVES.includes(why as MotiveType)) {
                        throw new Error(`Unknown motive: ${why}. Valid: ${VALID_MOTIVES.join(', ')}`);
                    }

                    // Check each part
                    const results = {
                        who: who === config.culpritId,
                        what: what === config.crimeType,
                        how: how === config.crimeMethod.methodId,
                        when: when.toUpperCase() === config.crimeWindow,
                        where: where === config.crimePlace,
                        why: why === config.motive.type,
                    };

                    const correctCount = Object.values(results).filter(Boolean).length;
                    const allCorrect = correctCount === 6;

                    // Calculate score
                    const firstTrySolve = true; // TODO: Track failed accusations
                    const score = calculateScore(session, correctCount, firstTrySolve);

                    if (allCorrect) {
                        // Fire VERDICT_WIN bark
                        const winBark = fireBark(barkState, 'VERDICT_WIN', { shape: detectCaseShape(config) });
                        if (winBark) print(formatBark(winBark), agentMode);

                        const culpritName = session.world.npcs.find(n => n.id === config.culpritId)?.name ?? who;
                        print(
                            `🎉 CASE CLOSED!\n\n` +
                            `${culpritName} ${config.crimeMethod.description} in the ${config.crimePlace} during ${config.crimeWindow}.\n` +
                            `Method: ${config.crimeMethod.funnyMethod}\n` +
                            `Motive: ${config.motive.description}\n` +
                            `"${config.motive.funnyReason}"`,
                            agentMode,
                            { type: 'win', results, config: { culprit: config.culpritId, crimeType: config.crimeType, method: config.crimeMethod.methodId, crimeWindow: config.crimeWindow, crimePlace: config.crimePlace, motive: config.motive.type }, score }
                        );
                    } else {
                        // Fire VERDICT_LOSE bark
                        const loseBark = fireBark(barkState, 'VERDICT_LOSE', { shape: detectCaseShape(config) });
                        if (loseBark) print(formatBark(loseBark), agentMode);

                        // Give feedback on what was wrong (but not the answers!)
                        const wrongParts = Object.entries(results)
                            .filter(([_, correct]) => !correct)
                            .map(([part, _]) => part);

                        print(
                            `❌ NOT QUITE!\n\n` +
                            `You got ${correctCount}/6 correct.\n` +
                            `Wrong: ${wrongParts.join(', ')}\n\n` +
                            `The real culprit gets away with their shenanigans...`,
                            agentMode,
                            { type: 'loss', correctCount, wrongParts, results, score }
                        );
                    }

                    // Show score summary
                    print(
                        `\n` +
                        `📊 SCORE BREAKDOWN\n` +
                        `─────────────────\n` +
                        `Days Used: ${score.daysUsed}\n` +
                        `AP Spent: ${score.totalAP}\n` +
                        `Contradictions: ${score.contradictions}\n` +
                        `Hints Used: ${score.hintsUsed}\n` +
                        `─────────────────\n` +
                        `TOTAL: ${score.totalScore} (Grade: ${score.grade})`,
                        agentMode,
                        { type: 'score', score }
                    );

                    // Generate and show share artifact
                    const shareArtifact = generateShareArtifact(session, score, allCorrect, gameSeed);
                    print(
                        `\n` +
                        `📱 SHARE YOUR RESULT\n` +
                        `─────────────────────\n` +
                        shareArtifact,
                        agentMode,
                        { type: 'share', artifact: shareArtifact }
                    );

                    // Show truth replay
                    const truthReplay = formatTruthReplay(session);
                    print(`\n${truthReplay}`, agentMode, { type: 'truth_replay', content: truthReplay });

                    // Clean up save file after game ends
                    resetState(gameSeed);

                    process.exit(0);
                }

                case 'HELP':
                    print(koa.formatHelp(session.config.suspects), agentMode);
                    return;

                case 'EXIT':
                case 'QUIT':
                    process.exit(0);

                default:
                    print(`Unknown command: ${verb}`, agentMode, { type: 'error', message: 'Unknown command' });
                    return;
            }
        } catch (e: any) {
            print(`Error: ${e.message}`, agentMode, { type: 'error', message: e.message });
        }
    }
}

main().catch(console.error);
