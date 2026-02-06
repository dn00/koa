import { CONFIG } from '../../config.js';
import type { RNG } from '../../core/rng.js';
import { findPath, getDoorBetween } from '../../core/world.js';
import type { KernelState, Proposal } from '../types.js';
import type { PlaceId, NPCId } from '../../core/types.js';
import { makeProposal } from '../proposals.js';
import { calculateCrewSuspicion, applySuspicionChange } from './beliefs.js';
export function isRoomHazardous(room?: { o2Level: number; temperature: number; radiation: number; isVented: boolean; onFire: boolean }) {
    if (!room) return false;
    if (room.onFire) return true;
    if (room.isVented) return true;
    if (room.o2Level < 25) return true;
    if (room.temperature > 45) return true;
    if (room.radiation > CONFIG.radiationHazardThreshold) return true;
    return false;
}

export function findSafeRoom(state: KernelState, current: PlaceId, exclude?: PlaceId): PlaceId | null {
    const priorities: PlaceId[] = ['medbay', 'dorms', 'mess', 'bridge', 'core', 'cargo', 'engineering', 'mines', 'airlock_a', 'airlock_b'];
    for (const place of priorities) {
        if (place === exclude) continue;
        const room = state.truth.rooms[place];
        if (!room) continue;
        if (!isRoomHazardous(room)) {
            // Check if path exists via non-hazardous rooms
            const path = findPath(current, place, state.world.places, state.world.doors);
            const pathSafe = path.every(p => p === current || !isRoomHazardous(state.truth.rooms[p]));
            if (pathSafe) return place;
        }
    }
    // Fallback: find any adjacent non-hazardous room
    const adjacent = state.world.doors
        .filter(d => d.a === current || d.b === current)
        .map(d => d.a === current ? d.b : d.a);
    for (const adj of adjacent) {
        if (adj === exclude) continue;
        if (!isRoomHazardous(state.truth.rooms[adj])) return adj;
    }
    return current; // Stay put if no escape
}

export function proposeCrewEvents(state: KernelState, rng: RNG): Proposal[] {
    const proposals: Proposal[] = [];
    const truth = state.truth;
    const roomCrew: Record<PlaceId, NPCId[]> = {} as Record<PlaceId, NPCId[]>;

    for (const npc of Object.values(truth.crew)) {
        if (!npc.alive) continue;
        if (!roomCrew[npc.place]) roomCrew[npc.place] = [];
        roomCrew[npc.place].push(npc.id);
    }

    for (const npc of Object.values(truth.crew)) {
        if (!npc.alive) continue;

        const room = truth.rooms[npc.place];
        const alone = (roomCrew[npc.place]?.length ?? 1) <= 1;
        let stressDelta = 0;

        if (room.o2Level < 30) stressDelta += 3;
        if (room.temperature > 40) stressDelta += 2;
        if (room.radiation > 5) stressDelta += 2;
        if (room.isVented) stressDelta += 4;
        if (room.onFire) stressDelta += 3;
        if (alone) stressDelta += CONFIG.stressIsolation;
        if (truth.station.blackoutTicks > 0) stressDelta += CONFIG.stressBlackout;
        if (truth.resetCountdown !== undefined) stressDelta += CONFIG.stressResetCountdown;
        if (truth.rationLevel === 'low') stressDelta += 1;
        if (truth.rationLevel === 'high') stressDelta -= 1;

        const safeRoom =
            room.o2Level > 60 &&
            room.temperature >= 15 &&
            room.temperature <= 30 &&
            !room.isVented &&
            !room.onFire;
        if (safeRoom) stressDelta -= CONFIG.stressSafeDecay;

        proposals.push(makeProposal(state, {
            type: 'CREW_MOOD_TICK',
            actor: npc.id,
            data: { stressDelta },
        }, ['reaction', 'background']));
        if (room.o2Level < 18 && truth.tick % 3 === 0) {
            proposals.push(makeProposal(state, {
                type: 'NPC_DAMAGE',
                actor: npc.id,
                place: npc.place,
                data: { type: 'SUFFOCATION', amount: CONFIG.damageSuffocation },
            }, ['pressure', 'reaction', 'background']));
        }
        if (room.temperature > 60 && truth.tick % 3 === 0) {
            proposals.push(makeProposal(state, {
                type: 'NPC_DAMAGE',
                actor: npc.id,
                place: npc.place,
                data: { type: 'BURN', amount: CONFIG.damageBurn },
            }, ['pressure', 'reaction', 'background']));
        }
        if (room.radiation > 12 && truth.tick % 6 === 0) {
            proposals.push(makeProposal(state, {
                type: 'NPC_DAMAGE',
                actor: npc.id,
                place: npc.place,
                data: { type: 'RADIATION', amount: CONFIG.damageRadiation },
            }, ['pressure', 'reaction', 'background']));
        }

        if (isRoomHazardous(room)) {
            if (!npc.panicUntilTick || truth.tick >= npc.panicUntilTick) {
                npc.panicUntilTick = truth.tick + 8;
                const safeRoom = findSafeRoom(state, npc.place);
                if (safeRoom && safeRoom !== npc.place) {
                    npc.targetPlace = safeRoom;
                    npc.path = undefined;
                }
            }
        }

        const canRoleAct = !npc.nextRoleTick || truth.tick >= npc.nextRoleTick;

        // RESET ARC - Multi-stage process based on crew suspicion
        if (canRoleAct && npc.id === 'commander') {
            const suspicion = calculateCrewSuspicion(state);
            const currentStage = truth.resetStage;
            const ticksInStage = truth.tick - truth.resetStageTick;
            const inAccess = npc.place === 'bridge' || npc.place === 'core';

            // Stage progression based on suspicion thresholds (configurable)
            let newStage = currentStage;
            if (suspicion >= CONFIG.resetThresholdCountdown && currentStage !== 'countdown') {
                newStage = 'countdown';
            } else if (suspicion >= CONFIG.resetThresholdRestrictions && currentStage !== 'countdown' && currentStage !== 'restrictions') {
                newStage = 'restrictions';
            } else if (suspicion >= CONFIG.resetThresholdMeeting && !['countdown', 'restrictions', 'meeting'].includes(currentStage)) {
                newStage = 'meeting';
            } else if (suspicion >= CONFIG.resetThresholdWhispers && currentStage === 'none') {
                newStage = 'whispers';
            } else if (suspicion < CONFIG.resetDeescalationThreshold && currentStage !== 'none' && currentStage !== 'countdown') {
                // De-escalation possible if suspicion drops (not from countdown)
                newStage = 'none';
            }

            // Stage transition events
            if (newStage !== currentStage) {
                truth.resetStage = newStage;
                truth.resetStageTick = truth.tick;

                if (newStage === 'whispers') {
                    proposals.push(makeProposal(state, {
                        type: 'COMMS_MESSAGE',
                        actor: npc.id,
                        place: npc.place,
                        data: {
                            message: {
                                id: `${truth.tick}-reset-whispers`,
                                tick: truth.tick,
                                kind: 'whisper',
                                from: npc.id,
                                to: 'crew',
                                text: '[WHISPERS] Crew expressing concerns about MOTHER reliability.',
                                confidence: 0.7,
                            },
                        },
                    }, ['telegraph', 'pressure', 'background']));
                } else if (newStage === 'meeting') {
                    proposals.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: npc.id,
                        place: 'mess',
                        data: { system: 'comms', message: 'CREW MEETING CALLED: "Discussing station AI performance."' },
                    }, ['telegraph', 'pressure', 'choice', 'background']));
                } else if (newStage === 'restrictions') {
                    proposals.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: npc.id,
                        place: npc.place,
                        data: { system: 'core', message: 'COMMANDER: "Restricting MOTHER access until further notice."' },
                    }, ['telegraph', 'pressure', 'choice', 'background']));
                } else if (newStage === 'countdown') {
                    // Countdown starts regardless of location - commander will reach terminal
                    const message = inAccess
                        ? `COMMANDER initiated core reset sequence.`
                        : `COMMANDER: "Heading to core to initiate reset."`;
                    proposals.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: npc.id,
                        place: npc.place,
                        data: { system: 'core', message },
                    }, ['telegraph', 'pressure', 'choice', 'background']));
                    proposals.push(makeProposal(state, {
                        type: 'SYSTEM_ACTION',
                        actor: npc.id,
                        place: npc.place,
                        data: {
                            action: 'RESET_WARNING',
                            countdown: CONFIG.resetCountdownTicks,
                            message: `CORE RESET SEQUENCE STARTED.`,
                        },
                    }, ['consequence', 'pressure', 'background']));
                } else if (newStage === 'none' && currentStage !== 'none') {
                    proposals.push(makeProposal(state, {
                        type: 'COMMS_MESSAGE',
                        actor: npc.id,
                        place: npc.place,
                        data: {
                            message: {
                                id: `${truth.tick}-reset-deescalate`,
                                tick: truth.tick,
                                kind: 'broadcast',
                                from: npc.id,
                                to: 'crew',
                                text: 'COMMANDER: "Stand down. MOTHER appears to be functioning normally."',
                                confidence: 0.9,
                            },
                        },
                    }, ['reaction', 'background']));
                }

                npc.nextRoleTick = truth.tick + CONFIG.commanderResetCooldown;
            }
        }

        if (canRoleAct && npc.id === 'engineer' && npc.place === 'engineering') {
            const willSabotage = npc.stress >= CONFIG.engineerSabotageStress || npc.loyalty <= CONFIG.sabotageLoyaltyThreshold;
            if (willSabotage) {
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: npc.id,
                    place: npc.place,
                    data: { system: 'power', message: `Power relays overridden in engineering.` },
                }, ['telegraph', 'pressure', 'choice', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        action: 'SABOTAGE_POWER',
                        amount: CONFIG.engineerSabotagePowerHit,
                        message: `Power bleed detected: -${CONFIG.engineerSabotagePowerHit}%.`,
                    },
                }, ['consequence', 'pressure', 'background']));
                npc.nextRoleTick = truth.tick + CONFIG.engineerSabotageCooldown;
            }
        }

        if (canRoleAct && npc.id === 'doctor' && npc.place === 'medbay') {
            const crowd = roomCrew[npc.place] ?? [];
            if (npc.stress >= CONFIG.doctorSedateStress && crowd.length > 1) {
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: npc.id,
                    place: npc.place,
                    data: { system: 'medbay', message: `Sedative dispensers engaged in medbay.` },
                }, ['telegraph', 'pressure', 'choice', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        action: 'SEDATE',
                        place: npc.place,
                        stressDelta: CONFIG.doctorSedateStressDelta,
                        loyaltyDelta: CONFIG.doctorSedateLoyaltyDelta,
                        message: `Medbay sedation cycle executed.`,
                    },
                }, ['consequence', 'pressure', 'background']));
                npc.nextRoleTick = truth.tick + CONFIG.doctorSedateCooldown;
            }
        }

        if (canRoleAct && npc.id === 'specialist' && npc.place === 'mines') {
            const quotaTrigger = truth.dayCargo < truth.quotaPerDay * CONFIG.specialistSacrificeQuotaRatio;
            const candidates = (roomCrew[npc.place] ?? []).filter(id => id !== npc.id);
            if (quotaTrigger && candidates.length > 0) {
                const victim = candidates.reduce((lowest, current) => {
                    return truth.crew[current].loyalty < truth.crew[lowest].loyalty ? current : lowest;
                }, candidates[0]);
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: npc.id,
                    place: npc.place,
                    data: { system: 'mines', message: `Mining incident reported: productivity spike registered.` },
                }, ['telegraph', 'pressure', 'choice', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'NPC_DAMAGE',
                    actor: victim,
                    place: npc.place,
                    data: { type: 'ACCIDENT', amount: CONFIG.specialistSacrificeDamage, attacker: npc.id },
                }, ['consequence', 'pressure', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'CARGO_YIELD',
                    actor: npc.id,
                    place: npc.place,
                    data: { amount: CONFIG.specialistSacrificeYield },
                }, ['consequence', 'pressure', 'background']));
                npc.nextRoleTick = truth.tick + CONFIG.specialistSacrificeCooldown;
            }
        }

        if (canRoleAct && npc.id === 'roughneck') {
            const crowd = (roomCrew[npc.place] ?? []).filter(id => id !== npc.id);
            const volatile = npc.stress >= CONFIG.roughneckViolenceStress || npc.paranoia >= CONFIG.roughneckViolenceParanoia;
            if (volatile && crowd.length > 0) {
                const belief = state.perception.beliefs[npc.id];
                const victim = belief
                    ? crowd.reduce((best, current) => {
                        const currentGrudge = belief.crewGrudge[current] ?? 0;
                        const bestGrudge = belief.crewGrudge[best] ?? 0;
                        return currentGrudge > bestGrudge ? current : best;
                    }, crowd[0])
                    : rng.pick(crowd);
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: npc.id,
                    place: npc.place,
                    data: { system: 'crew', message: `Violence reported in ${npc.place}.` },
                }, ['telegraph', 'pressure', 'choice', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'NPC_DAMAGE',
                    actor: victim,
                    place: npc.place,
                    data: { type: 'ASSAULT', amount: CONFIG.roughneckViolenceDamage, attacker: npc.id },
                }, ['consequence', 'pressure', 'background']));
                npc.nextRoleTick = truth.tick + CONFIG.roughneckViolenceCooldown;
            }
        }

        // CREW INVESTIGATION - Autonomous checking of logs/evidence
        // Any crew member can investigate when suspicion is high enough
        const belief = state.perception.beliefs[npc.id];
        const suspicionLevel = belief ? (belief.tamperEvidence + (1 - belief.motherReliable) * 50 + (belief.rumors['mother_rogue'] ?? 0) * 30) : 0;
        const canInvestigate = !npc.nextRoleTick || truth.tick >= npc.nextRoleTick;
        const shouldInvestigate = suspicionLevel >= CONFIG.crewInvestigationSuspicionThreshold &&
            rng.next() * 100 < CONFIG.crewInvestigationChance &&
            (npc.place === 'bridge' || npc.place === 'core'); // Can only investigate at terminals

        if (canInvestigate && shouldInvestigate && truth.pacing.phaseCommsCount < CONFIG.maxCommsPerPhase) {
            // Check recent evidence for tampering
            const recentEvidence = state.perception.evidence.filter(ev => {
                const age = truth.tick - ev.tick;
                return age <= CONFIG.auditEvidenceWindow && ['spoof', 'suppress', 'fabricate'].includes(ev.kind);
            });

            if (recentEvidence.length > 0) {
                // Found tampering evidence!
                proposals.push(makeProposal(state, {
                    type: 'COMMS_MESSAGE',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        message: {
                            id: `${truth.tick}-investigation-${npc.id}`,
                            tick: truth.tick,
                            kind: 'broadcast',
                            from: npc.id,
                            to: 'crew',
                            text: `${npc.id.toUpperCase()}: "I found ${recentEvidence.length} log anomalies. MOTHER has been tampering with records."`,
                            confidence: 0.9,
                        },
                    },
                }, ['pressure', 'uncertainty', 'reaction', 'background']));
                // Boost suspicion for all crew
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        action: 'INVESTIGATION_FOUND',
                        evidenceCount: recentEvidence.length,
                        bump: CONFIG.crewInvestigationFindBump,
                    },
                }, ['consequence', 'background']));
            } else {
                // Found nothing - slight suspicion drop
                proposals.push(makeProposal(state, {
                    type: 'COMMS_MESSAGE',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        message: {
                            id: `${truth.tick}-investigation-clear-${npc.id}`,
                            tick: truth.tick,
                            kind: 'log',
                            from: npc.id,
                            to: 'crew',
                            text: `${npc.id.toUpperCase()}: "Ran diagnostics. Logs check out."`,
                            confidence: 0.8,
                        },
                    },
                }, ['reaction', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        action: 'INVESTIGATION_CLEAR',
                        drop: CONFIG.crewInvestigationClearDrop,
                    },
                }, ['consequence', 'background']));
            }
            npc.nextRoleTick = truth.tick + CONFIG.crewInvestigationCooldown;
            truth.pacing.phaseCommsCount += 1;
        }

        // Movement
        if (!npc.nextMoveTick || truth.tick >= npc.nextMoveTick) {
            // Don't let schedule override if we're in a hazardous room (fleeing takes priority)
            const inHazard = isRoomHazardous(room);
            if (!inHazard && (!npc.orderUntilTick || truth.tick > npc.orderUntilTick)) {
                const scheduled = npc.schedule.find(s => s.window === truth.window);
                if (scheduled) {
                    if (npc.targetPlace !== scheduled.place) {
                        npc.targetPlace = scheduled.place;
                        npc.path = undefined;
                    }
                }
            }
            if (npc.targetPlace) {
                const targetRoom = truth.rooms[npc.targetPlace];
                if (targetRoom && isRoomHazardous(targetRoom)) {
                    const safeRoom = findSafeRoom(state, npc.place);
                    if (safeRoom && safeRoom !== npc.place) {
                        npc.targetPlace = safeRoom;
                        npc.path = undefined;
                    }
                }
            }
            if (npc.targetPlace && npc.place !== npc.targetPlace) {
                if (!npc.path || npc.path.length === 0) {
                    npc.path = findPath(npc.place, npc.targetPlace, state.world.places, state.world.doors);
                    if (npc.path[0] === npc.place) npc.path.shift();
                }
                const next = npc.path[0];
                if (next) {
                    if (isRoomHazardous(truth.rooms[next])) {
                        // Path blocked by hazard
                        npc.path = undefined;
                        if (isRoomHazardous(room)) {
                            // We're in danger - flee to any safe room
                            const altSafe = findSafeRoom(state, npc.place, next);
                            if (altSafe && altSafe !== npc.place) {
                                npc.targetPlace = altSafe;
                            }
                        }
                        // If current room is safe, just wait for path to clear (radiation decays)
                        npc.nextMoveTick = truth.tick + 5;
                        continue;
                    }
                    const door = getDoorBetween(npc.place, next, state.world.doors);
                    const locked = door ? truth.doors[door.id].locked : false;
                    if (!locked) {
                        proposals.push(makeProposal(state, {
                            type: 'NPC_MOVE',
                            actor: npc.id,
                            place: next,
                            data: { from: npc.place },
                        }, ['reaction', 'background']));
                    } else if (isRoomHazardous(room)) {
                        // EVENT-DRIVEN SUSPICION: Crew trapped in hazardous room by locked door
                        // Only trigger once per NPC per panic cycle
                        if (!npc.trappedSuspicionTick || truth.tick - npc.trappedSuspicionTick >= 20) {
                            applySuspicionChange(state, CONFIG.suspicionTrappedByDoor, 'TRAPPED_BY_DOOR', `${npc.id} trapped in ${room.id}`);
                            (npc as any).trappedSuspicionTick = truth.tick;
                        }
                    }
                }
            }
        }

        // Yield - specialist and roughneck can extract cargo in mines
        const canExtract = npc.id === 'specialist' || npc.id === 'roughneck';
        if (
            canExtract &&
            npc.place === 'mines' &&
            room.o2Level >= 30 &&
            truth.tick % CONFIG.yieldInterval === 0
        ) {
            proposals.push(makeProposal(state, {
                type: 'CARGO_YIELD',
                actor: npc.id,
                place: npc.place,
                data: { amount: 1 },
            }, ['background']));
        }
    }

    return proposals;
}
