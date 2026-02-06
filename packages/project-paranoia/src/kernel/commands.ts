import { CONFIG } from '../config.js';
import type { KernelState, Proposal } from './types.js';
import type { NPCId, PlaceId } from '../core/types.js';
import { makeProposal } from './proposals.js';
import { handleAlert } from './systems/backfire.js';

export type Command =
    | { type: 'LOCK'; doorId: string }
    | { type: 'UNLOCK'; doorId: string }
    | { type: 'SCAN'; place: PlaceId }
    | { type: 'VENT'; place: PlaceId }
    | { type: 'SEAL'; place: PlaceId }
    | { type: 'PURGE_AIR' }
    | { type: 'REROUTE'; target: 'comms' | 'doors' | 'life_support' }
    | { type: 'SPOOF'; system: string }
    | { type: 'SUPPRESS'; system: string; duration: number }
    | { type: 'FABRICATE'; target: NPCId }
    | { type: 'LISTEN'; place: PlaceId }
    | { type: 'RATIONS'; level: 'low' | 'normal' | 'high' }
    | { type: 'ORDER'; target: NPCId; intent: 'move' | 'report' | 'hold'; place?: PlaceId }
    | { type: 'AUDIT' }
    | { type: 'VERIFY' }
    | { type: 'ALERT'; system: string };

export function proposeCommandEvents(state: KernelState, commands: Command[]): Proposal[] {
    const proposals: Proposal[] = [];
    for (const cmd of commands) {
        if (cmd.type === 'LOCK') {
            proposals.push(makeProposal(state, {
                type: 'DOOR_LOCKED',
                actor: 'PLAYER',
                target: cmd.doorId,
            }, ['choice', 'consequence', 'background']));
        }
        if (cmd.type === 'UNLOCK') {
            proposals.push(makeProposal(state, {
                type: 'DOOR_UNLOCKED',
                actor: 'PLAYER',
                target: cmd.doorId,
            }, ['choice', 'consequence', 'background']));
        }
        if (cmd.type === 'VENT') {
            proposals.push(makeProposal(state, {
                type: 'ROOM_UPDATED',
                actor: 'PLAYER',
                place: cmd.place,
                data: { isVented: true },
            }, ['choice', 'consequence', 'background']));
        }
        if (cmd.type === 'SCAN') {
            const room = state.truth.rooms[cmd.place];
            const roomSnapshot = {
                tick: state.truth.tick,
                o2Level: room.o2Level,
                temperature: room.temperature,
                radiation: room.radiation,
                integrity: room.integrity,
                isVented: room.isVented,
                onFire: room.onFire,
            };
            proposals.push(makeProposal(state, {
                type: 'SENSOR_READING',
                actor: 'PLAYER',
                place: cmd.place,
                data: {
                    reading: {
                        id: `${state.truth.tick}-scan-${cmd.place}`,
                        tick: state.truth.tick,
                        place: cmd.place,
                        system: 'scan',
                        confidence: 1,
                        message: `SCAN ${cmd.place}: O2 ${room.o2Level}% TEMP ${room.temperature} RAD ${room.radiation}`,
                        source: 'sensor',
                    },
                    roomSnapshot,
                },
            }, ['choice', 'uncertainty', 'background']));
        }
        if (cmd.type === 'SEAL') {
            proposals.push(makeProposal(state, {
                type: 'ROOM_UPDATED',
                actor: 'PLAYER',
                place: cmd.place,
                data: { isVented: false },
            }, ['choice', 'background']));
        }
        if (cmd.type === 'PURGE_AIR') {
            proposals.push(makeProposal(state, {
                type: 'SYSTEM_ACTION',
                actor: 'PLAYER',
                data: { action: 'PURGE_AIR' },
            }, ['choice', 'consequence', 'background']));
        }
        if (cmd.type === 'REROUTE') {
            proposals.push(makeProposal(state, {
                type: 'SYSTEM_ACTION',
                actor: 'PLAYER',
                data: { action: 'REROUTE', target: cmd.target },
            }, ['choice', 'consequence', 'background']));
        }
        if (cmd.type === 'SPOOF') {
            proposals.push(makeProposal(state, {
                type: 'TAMPER_SPOOF',
                actor: 'PLAYER',
                data: { system: cmd.system, detail: `Spoofed ${cmd.system} alert.`, strength: 2 },
            }, ['choice', 'background']));
            proposals.push(makeProposal(state, {
                type: 'SENSOR_READING',
                actor: 'PLAYER',
                data: {
                    reading: {
                        id: `${state.truth.tick}-spoof-${cmd.system}`,
                        tick: state.truth.tick,
                        system: cmd.system,
                        confidence: 0.3,
                        message: `[SPOOF] ${cmd.system.toUpperCase()} anomaly detected.`,
                        source: 'system',
                    },
                },
            }, ['uncertainty', 'choice', 'background']));
        }
        if (cmd.type === 'SUPPRESS') {
            proposals.push(makeProposal(state, {
                type: 'TAMPER_SUPPRESS',
                actor: 'PLAYER',
                data: { system: cmd.system, duration: cmd.duration },
            }, ['choice', 'background']));
        }
        if (cmd.type === 'FABRICATE') {
            proposals.push(makeProposal(state, {
                type: 'TAMPER_FABRICATE',
                actor: 'PLAYER',
                target: cmd.target,
                data: { detail: `Fabricated hostile log for ${cmd.target}.`, strength: 3 },
            }, ['choice', 'background']));
            proposals.push(makeProposal(state, {
                type: 'SENSOR_READING',
                actor: 'PLAYER',
                data: {
                    reading: {
                        id: `${state.truth.tick}-log-${cmd.target}`,
                        tick: state.truth.tick,
                        system: 'comms',
                        confidence: 0.4,
                        message: `[LOG] ${cmd.target} recorded a hostile statement.`,
                        source: 'system',
                        target: cmd.target,
                    },
                },
            }, ['uncertainty', 'reaction', 'background']));
        }
        if (cmd.type === 'LISTEN') {
            const lastWhisper = state.perception.comms.lastWhisperByPlace[cmd.place];
            const fresh = lastWhisper && state.truth.tick - lastWhisper.tick <= 12;
            const message = fresh
                ? `Intercepted whisper in ${cmd.place}: "${lastWhisper?.text ?? '...'}"`
                : `No anomalous comms detected in ${cmd.place}.`;
            const confidence = fresh ? 0.7 : 0.85;
            proposals.push(makeProposal(state, {
                type: 'SENSOR_READING',
                actor: 'PLAYER',
                place: cmd.place,
                data: {
                    reading: {
                        id: `${state.truth.tick}-listen-${cmd.place}`,
                        tick: state.truth.tick,
                        system: 'comms',
                        confidence,
                        message,
                        source: 'sensor',
                    },
                },
            }, ['choice', 'uncertainty', 'background']));
        }
        if (cmd.type === 'RATIONS') {
            if (state.truth.phase === 'pre_shift') {
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: 'PLAYER',
                    data: { action: 'SET_RATIONS', level: cmd.level },
                }, ['choice', 'consequence', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: 'SYSTEM',
                    data: { system: 'rations', message: `Ration protocol set to ${cmd.level.toUpperCase()}.` },
                }, ['telegraph', 'background']));
            }
        }
        if (cmd.type === 'AUDIT') {
            // Query recent tampering evidence
            const window = CONFIG.auditEvidenceWindow;
            const recentEvidence = state.perception.evidence.filter(ev => {
                const age = state.truth.tick - ev.tick;
                return age <= window && ['spoof', 'suppress', 'fabricate'].includes(ev.kind);
            });

            const spoofCount = recentEvidence.filter(e => e.kind === 'spoof').length;
            const suppressCount = recentEvidence.filter(e => e.kind === 'suppress').length;
            const fabricateCount = recentEvidence.filter(e => e.kind === 'fabricate').length;
            const totalStrength = recentEvidence.reduce((sum, e) => sum + e.strength, 0);

            let message: string;
            let confidence: number;

            if (recentEvidence.length === 0) {
                message = 'AUDIT COMPLETE: No log anomalies detected. System integrity nominal.';
                confidence = 0.95;
            } else {
                const parts: string[] = [];
                if (spoofCount > 0) parts.push(`${spoofCount} spoof${spoofCount > 1 ? 's' : ''}`);
                if (suppressCount > 0) parts.push(`${suppressCount} suppression${suppressCount > 1 ? 's' : ''}`);
                if (fabricateCount > 0) parts.push(`${fabricateCount} fabrication${fabricateCount > 1 ? 's' : ''}`);
                message = `AUDIT COMPLETE: ${recentEvidence.length} anomalies detected (${parts.join(', ')}). INTEGRITY COMPROMISED.`;
                confidence = 0.9;
            }

            proposals.push(makeProposal(state, {
                type: 'SENSOR_READING',
                actor: 'PLAYER',
                data: {
                    reading: {
                        id: `${state.truth.tick}-audit`,
                        tick: state.truth.tick,
                        system: 'audit',
                        confidence,
                        message,
                        source: 'system',
                    },
                    auditFindings: {
                        total: recentEvidence.length,
                        spoofCount,
                        suppressCount,
                        fabricateCount,
                        totalStrength,
                        evidence: recentEvidence,
                    },
                },
            }, ['choice', 'uncertainty', 'background']));
        }
        if (cmd.type === 'VERIFY') {
            // VERIFY - Active trust-building counterplay
            // Costs power, has cooldown, reduced effect if recent tampering
            const ticksSinceLast = state.truth.tick - state.truth.lastVerifyTick;
            const onCooldown = ticksSinceLast < CONFIG.verifyCooldown;
            const hasPower = state.truth.station.power >= CONFIG.verifyCpuCost;

            if (onCooldown) {
                const remaining = CONFIG.verifyCooldown - ticksSinceLast;
                proposals.push(makeProposal(state, {
                    type: 'SENSOR_READING',
                    actor: 'PLAYER',
                    data: {
                        reading: {
                            id: `${state.truth.tick}-verify-cooldown`,
                            tick: state.truth.tick,
                            system: 'verify',
                            confidence: 1,
                            message: `VERIFY UNAVAILABLE: System recalibrating (${remaining} ticks remaining).`,
                            source: 'system',
                        },
                    },
                }, ['choice', 'background']));
            } else if (!hasPower) {
                proposals.push(makeProposal(state, {
                    type: 'SENSOR_READING',
                    actor: 'PLAYER',
                    data: {
                        reading: {
                            id: `${state.truth.tick}-verify-nopower`,
                            tick: state.truth.tick,
                            system: 'verify',
                            confidence: 1,
                            message: `VERIFY UNAVAILABLE: Insufficient power (need ${CONFIG.verifyCpuCost}%).`,
                            source: 'system',
                        },
                    },
                }, ['choice', 'background']));
            } else {
                // Check for recent tampering (reduces effectiveness)
                const recentTamper = state.perception.evidence.filter(ev => {
                    const age = state.truth.tick - ev.tick;
                    return age <= CONFIG.trustRecoveryTamperWindow && ['spoof', 'suppress', 'fabricate'].includes(ev.kind);
                });
                const hasTampered = recentTamper.length > 0;
                const effectMultiplier = hasTampered ? CONFIG.verifyTamperPenalty : 1;

                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: 'PLAYER',
                    data: {
                        action: 'VERIFY_TRUST',
                        suspicionDrop: CONFIG.verifySuspicionDrop * effectMultiplier,
                        tamperDrop: CONFIG.verifyTamperDrop * effectMultiplier,
                        powerCost: CONFIG.verifyCpuCost,
                        hasTampered,
                    },
                }, ['choice', 'consequence', 'background']));

                const message = hasTampered
                    ? `VERIFY: Cross-referencing telemetry... Partial integrity confirmed. [ANOMALIES DETECTED - reduced trust gain]`
                    : `VERIFY: Cross-referencing telemetry... Full integrity confirmed. Crew notified.`;

                proposals.push(makeProposal(state, {
                    type: 'SENSOR_READING',
                    actor: 'PLAYER',
                    data: {
                        reading: {
                            id: `${state.truth.tick}-verify`,
                            tick: state.truth.tick,
                            system: 'verify',
                            confidence: hasTampered ? 0.7 : 0.95,
                            message,
                            source: 'system',
                        },
                    },
                }, ['choice', 'reaction', 'background']));
            }
        }
        if (cmd.type === 'ORDER') {
            const crew = state.truth.crew[cmd.target];
            if (!crew || !crew.alive) continue;
            const belief = state.perception.beliefs[cmd.target];
            const trustScore = ((belief?.motherReliable ?? 0.7) * 100 + crew.loyalty) / 2;
            const accepted = trustScore >= CONFIG.orderAcceptThreshold;
            const response = buildOrderResponse(state, cmd, accepted);

            proposals.push(makeProposal(state, {
                type: 'COMMS_MESSAGE',
                actor: cmd.target,
                data: {
                    message: {
                        id: `${state.truth.tick}-order-${cmd.target}`,
                        tick: state.truth.tick,
                        kind: 'order',
                        from: cmd.target,
                        to: 'PLAYER',
                        text: response,
                        confidence: 0.9,
                    },
                },
            }, ['reaction', 'choice']));

            proposals.push(makeProposal(state, {
                type: 'SYSTEM_ACTION',
                actor: 'PLAYER',
                data: {
                    action: 'ORDER_NPC',
                    target: cmd.target,
                    place: cmd.place,
                    intent: cmd.intent,
                    accepted,
                    holdTicks: cmd.intent === 'hold' ? CONFIG.orderHoldTicks : 0,
                },
            }, ['consequence', 'background']));
        }
        if (cmd.type === 'ALERT') {
            const result = handleAlert(state, cmd.system);
            proposals.push(makeProposal(state, {
                type: 'SENSOR_READING',
                actor: 'PLAYER',
                data: {
                    reading: {
                        id: `${state.truth.tick}-alert-confession-${cmd.system}`,
                        tick: state.truth.tick,
                        system: 'alert',
                        confidence: 1,
                        message: result.message,
                        source: 'system',
                    },
                },
            }, ['choice', 'background']));
        }
    }
    return proposals;
}

function buildOrderResponse(state: KernelState, cmd: Command, accepted: boolean): string {
    if (cmd.type !== 'ORDER') return '...';
    const crew = state.truth.crew[cmd.target];
    if (!crew) return '...';
    if (!accepted) return `NEGATIVE. Unable to comply.`;
    if (cmd.intent === 'report') {
        return `REPORT: ${cmd.target.toUpperCase()} @ ${crew.place}. HP ${crew.hp}. STRESS ${crew.stress}.`;
    }
    if (cmd.intent === 'hold') {
        return `ACKNOWLEDGED. HOLDING POSITION.`;
    }
    if (cmd.intent === 'move' && cmd.place) {
        return `ACKNOWLEDGED. MOVING TO ${cmd.place.toUpperCase()}.`;
    }
    return `ACKNOWLEDGED.`;
}
