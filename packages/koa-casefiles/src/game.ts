#!/usr/bin/env node
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { simulate } from './sim.js';
import { deriveEvidence } from './evidence.js';
import { PlayerSession } from './player.js';
import { performSearch, performInterview, checkLogs, compareEvidence, ActionResult, InterviewMode } from './actions.js';
import type { CrimeType, MotiveType, MethodId } from './types.js';
import { METHODS_BY_CRIME } from './types.js';

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
// Types & Args
// ============================================================================

interface GameArgs {
    seed: number;
    agentMode: boolean;
}

function parseArgs(): GameArgs {
    const args = process.argv.slice(2);
    let seed = Math.floor(Math.random() * 10000);
    let agentMode = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--seed' || args[i] === '-s') {
            seed = parseInt(args[++i], 10);
        } else if (args[i] === '--agent-mode') {
            agentMode = true;
        }
    }

    return { seed, agentMode };
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
        case 'physical':
            return `${e.detail}`;
        case 'motive':
            return `${e.gossipSource} says: "${e.hint}"`;
        default:
            return JSON.stringify(e);
    }
}

// ============================================================================
// Main Loop
// ============================================================================

async function main() {
    const args = parseArgs();

    // 1. Sim
    const result = simulate(args.seed);
    if (!result) {
        console.error('Failed to generate case.');
        process.exit(1);
    }

    // 2. Evidence
    const evidence = deriveEvidence(result.world, result.eventLog, result.config);

    // 3. Session
    const session = new PlayerSession(result.world, result.config, evidence);
    const rl = createInterface({ input, output });

    print(`
🕵️ KOA Casefiles - Interactive Mode (Seed: ${args.seed})
Type 'HELP' for commands.
_______________________________________________________
`, args.agentMode);

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
            console.log(`\n📅 DAY ${session.currentDay} | ⚡ AP: ${session.actionPoints}/${session.maxActionPoints}`);
            const answer = await rl.question('command> ');
            await handleCommand(answer.trim(), session, args.agentMode);
        }

        // In agent mode, we read line by line from stdin
        if (args.agentMode) {
            const answer = await rl.question('');
            await handleCommand(answer.trim(), session, args.agentMode);
        }

        if (session.isTimeUp()) {
            print('⏰ TIME UP! The trail has gone cold.', args.agentMode, { type: 'game_over', reason: 'timeout' });
            gameRunning = false;
        }
    }

    rl.close();

    async function handleCommand(cmdStr: string, session: PlayerSession, agentMode: boolean) {
        const parts = cmdStr.split(' ');
        const verb = parts[0].toUpperCase();
        const args = parts.slice(1);

        let result: ActionResult | undefined;

        try {
            switch (verb) {
                case 'SEARCH':
                    // SEARCH living W3
                    if (args.length < 2) throw new Error('Usage: SEARCH <place> <window>');
                    result = performSearch(session, args[0], args[1]);
                    break;

                case 'INTERVIEW': {
                    // INTERVIEW alice W2 testimony  OR  INTERVIEW alice gossip
                    // Gossip doesn't need a window (it's general household drama)
                    let interviewSuspect: string;
                    let interviewWindow: string;
                    let interviewMode: InterviewMode;

                    if (args.length >= 2 && args[1].toLowerCase() === 'gossip') {
                        // Short form: INTERVIEW <npc> gossip
                        interviewSuspect = args[0];
                        interviewWindow = ''; // unused for gossip
                        interviewMode = 'gossip';
                    } else if (args.length >= 3) {
                        // Full form: INTERVIEW <npc> <window> <mode>
                        interviewSuspect = args[0];
                        interviewWindow = args[1];
                        interviewMode = args[2].toLowerCase() as InterviewMode;
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
                    result = performInterview(session, interviewSuspect, interviewWindow, interviewMode);
                    break;
                }

                case 'COMPARE': {
                    // COMPARE evidence_id_1 evidence_id_2
                    if (args.length < 2) {
                        throw new Error('Usage: COMPARE <evidence_id_1> <evidence_id_2>');
                    }
                    const compareResult = compareEvidence(session, args[0], args[1]);
                    print(compareResult.message, agentMode, {
                        type: 'compare_result',
                        ...compareResult
                    });
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

                case 'COVERAGE': {
                    // Show coverage meter - what dimensions have evidence
                    const coverage = session.getCoverage();
                    const formatDim = (name: string, dim: { count: number; hints: string[] }) => {
                        const icon = dim.count > 0 ? '✓' : '?';
                        const hints = dim.hints.length > 0 ? dim.hints.slice(0, 3).join(', ') : 'none';
                        return `  ${icon} ${name.toUpperCase().padEnd(5)} (${dim.count} clues) ${dim.count > 0 ? `→ ${hints}` : ''}`;
                    };

                    const lines = [
                        '📊 COVERAGE METER',
                        '─────────────────',
                        formatDim('who', coverage.who),
                        formatDim('what', coverage.what),
                        formatDim('how', coverage.how),
                        formatDim('when', coverage.when),
                        formatDim('where', coverage.where),
                        formatDim('why', coverage.why),
                        '',
                        `Total: ${session.knownEvidence.length} evidence items`,
                    ].join('\n');

                    print(lines, agentMode, {
                        type: 'coverage',
                        coverage
                    });
                    return;
                }

                case 'LOGS':
                    // LOGS motion W1
                    if (args.length < 2) throw new Error('Usage: LOGS <device> <window>');
                    result = checkLogs(session, args[0], args[1]);
                    break;

                case 'NEXT_DAY':
                    if (session.nextDay()) {
                        print('You sleep. A new day begins.', agentMode, { type: 'event', message: 'New Day' });
                    } else {
                        print('Cannot advance day.', agentMode);
                    }
                    return;

                case 'ACCUSE': {
                    // Full accusation: WHO WHAT HOW WHEN WHERE WHY
                    // e.g., ACCUSE alice theft grabbed W3 garage revenge
                    if (args.length < 6) {
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

                    const [who, what, how, when, where, why] = args.map(a => a.toLowerCase());
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

                    if (allCorrect) {
                        const culpritName = session.world.npcs.find(n => n.id === config.culpritId)?.name ?? who;
                        print(
                            `🎉 CASE CLOSED!\n\n` +
                            `${culpritName} ${config.crimeMethod.description} in the ${config.crimePlace} during ${config.crimeWindow}.\n` +
                            `Method: ${config.crimeMethod.funnyMethod}\n` +
                            `Motive: ${config.motive.description}\n` +
                            `"${config.motive.funnyReason}"`,
                            agentMode,
                            { type: 'win', results, config: { culprit: config.culpritId, crimeType: config.crimeType, method: config.crimeMethod.methodId, crimeWindow: config.crimeWindow, crimePlace: config.crimePlace, motive: config.motive.type } }
                        );
                    } else {
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
                            { type: 'loss', correctCount, wrongParts, results }
                        );
                    }
                    process.exit(0);
                }

                case 'HELP':
                    print(`
INVESTIGATION (costs AP):
  SEARCH <place> <window>              (1 AP) - Look for physical clues
  INTERVIEW <npc> <window> testimony   (1 AP) - What did they see/hear?
  INTERVIEW <npc> gossip               (1 AP) - What drama do they know?
  LOGS <device> <window>               (1 AP) - Check device records
  NEXT_DAY                             - Rest and restore AP

DEDUCTION (free):
  COMPARE <evidence_id> <evidence_id>  - Check if two items contradict
  EVIDENCE                             - List collected evidence
  COVERAGE                             - See what dimensions have clues

ACCUSATION (ends game):
  ACCUSE <who> <what> <how> <when> <where> <why>

  Example: ACCUSE alice theft grabbed W3 garage revenge

  who:   alice, bob, carol, dan, eve
  what:  theft, sabotage, prank, disappearance
  how:   grabbed/pocketed/smuggled (theft)
         broke/unplugged/reprogrammed (sabotage)
         relocated/swapped/disguised (prank)
         hid/buried/donated (disappearance)
  when:  W1, W2, W3, W4, W5, W6
  where: kitchen, living, bedroom, office, garage
  why:   envy, embarrassment, cover_up, rivalry,
         attention, revenge, chaos
`, agentMode);
                    return;

                case 'EXIT':
                case 'QUIT':
                    process.exit(0);

                default:
                    print(`Unknown command: ${verb}`, agentMode, { type: 'error', message: 'Unknown command' });
                    return;
            }

            // Print Result
            if (result) {
                print(result.message, agentMode, {
                    type: 'action_result',
                    success: result.success,
                    message: result.message,
                    evidence: result.evidence
                });
            }

        } catch (e: any) {
            print(`Error: ${e.message}`, agentMode, { type: 'error', message: e.message });
        }
    }
}

main().catch(console.error);
