/**
 * PERCEPTION MODULE
 *
 * Filters truth through the player's perception state.
 * Provides diegetic, fair views - not lying, just incomplete/stale.
 */

import { CONFIG } from '../config.js';
import type { PlaceId, NPCId } from '../core/types.js';
import type { KernelState, RoomSnapshot, CrewSighting, IntentLabel, CrewTruth } from './types.js';

export interface PerceivedStation {
    power: number | null;
    comms: number | null;
    doorDelay: number | null;
    blackout: boolean;
    camerasOffline: boolean;
}

export interface PerceivedRoom {
    place: PlaceId;
    snapshot: RoomSnapshot | null;
    staleTicks: number;
    stale: boolean;
}

export interface PerceivedCrew {
    id: NPCId;
    name: string;
    place: PlaceId | null;
    placeStale: boolean;
    alive: boolean | null;
    hp: number | null;
    intent: IntentLabel;
}

export interface PerceivedThreat {
    system: string;
    place: PlaceId | null;
    message: string;
    severity: 'WARNING' | 'CRITICAL';
    confidence: 'confirmed' | 'uncertain' | 'conflicting';
}

function isBlackout(state: KernelState): boolean {
    return state.truth.station.blackoutTicks > 0;
}

function camerasOnline(state: KernelState): boolean {
    return state.truth.station.power >= CONFIG.cameraPowerThreshold && !isBlackout(state);
}

/**
 * Perceive station status. During blackout, most telemetry is unavailable.
 */
export function perceiveStation(state: KernelState): PerceivedStation {
    const { truth } = state;
    const blackout = isBlackout(state);
    const cameras = camerasOnline(state);

    if (blackout) {
        return {
            power: null,
            comms: null,
            doorDelay: truth.station.doorDelay, // Doors still work mechanically
            blackout: true,
            camerasOffline: true,
        };
    }

    return {
        power: truth.station.power,
        comms: truth.station.comms,
        doorDelay: truth.station.doorDelay,
        blackout: false,
        camerasOffline: !cameras,
    };
}

/**
 * Perceive room conditions. Returns last scan data with staleness info.
 */
export function perceiveRoom(state: KernelState, place: PlaceId): PerceivedRoom {
    const { truth, perception } = state;
    const snapshot = perception.observation.lastRoomScan[place] ?? null;

    if (!snapshot) {
        return {
            place,
            snapshot: null,
            staleTicks: Infinity,
            stale: true,
        };
    }

    const staleTicks = truth.tick - snapshot.tick;
    const stale = staleTicks > CONFIG.roomScanStaleTicks;

    return {
        place,
        snapshot,
        staleTicks,
        stale,
    };
}

/**
 * Perceive all rooms with staleness info.
 */
export function perceiveAllRooms(state: KernelState): PerceivedRoom[] {
    return state.world.places.map(p => perceiveRoom(state, p.id));
}

/**
 * Classify crew intent based on observable signals.
 * HOSTILE      = loyalty < 20 && paranoia > 50
 * SABOTAGE RISK = loyalty < sabotageLoyaltyThreshold
 * HOSTILE?     = motherTrust < 0.3 || tamper > threshold
 * UNSTABLE     = stress > 70 || paranoia > 40
 * DISLOYAL?    = loyalty < 50
 * LOYAL        = loyalty > 70 && stress < 40
 * NOMINAL      = default
 */
function classifyIntent(crew: CrewTruth, state: KernelState): IntentLabel {
    const belief = state.perception.beliefs[crew.id];
    const motherTrust = belief?.motherReliable ?? 0.7;
    const tamperEvidence = belief?.tamperEvidence ?? 0;

    // HOSTILE: clear threat
    if (crew.loyalty < 20 && crew.paranoia > 50) {
        return 'HOSTILE';
    }

    // SABOTAGE RISK: near sabotage threshold
    if (crew.loyalty <= CONFIG.sabotageLoyaltyThreshold) {
        return 'SABOTAGE RISK';
    }

    // HOSTILE?: uncertain threat signals
    if (motherTrust < 0.3 || tamperEvidence >= CONFIG.tamperEvidenceThreshold) {
        return 'HOSTILE?';
    }

    // UNSTABLE: high stress/paranoia
    if (crew.stress > 70 || crew.paranoia > 40) {
        return 'UNSTABLE';
    }

    // DISLOYAL?: moderate disloyalty
    if (crew.loyalty < 50) {
        return 'DISLOYAL?';
    }

    // LOYAL: clearly loyal
    if (crew.loyalty > 70 && crew.stress < 40) {
        return 'LOYAL';
    }

    return 'NOMINAL';
}

/**
 * Perceive a crew member. Returns position with staleness and intent classification.
 */
export function perceiveCrew(state: KernelState, npcId: NPCId): PerceivedCrew {
    const { truth, perception, world } = state;
    const crew = truth.crew[npcId];
    const npc = world.npcs.find(n => n.id === npcId);
    const sighting = perception.observation.lastCrewSighting[npcId];
    const cameras = camerasOnline(state);

    // No telemetry at all
    if (!cameras && !sighting) {
        return {
            id: npcId,
            name: npc?.name ?? npcId,
            place: null,
            placeStale: true,
            alive: null,
            hp: null,
            intent: 'UNKNOWN',
        };
    }

    // Use current data if cameras work, otherwise use last sighting
    if (cameras) {
        return {
            id: npcId,
            name: npc?.name ?? npcId,
            place: crew.place,
            placeStale: false,
            alive: crew.alive,
            hp: crew.hp,
            intent: crew.alive ? classifyIntent(crew, state) : 'NOMINAL',
        };
    }

    // Cameras offline, use last sighting
    const staleTicks = sighting ? truth.tick - sighting.tick : Infinity;
    const stale = staleTicks > CONFIG.crewSightingStaleTicks;

    return {
        id: npcId,
        name: npc?.name ?? npcId,
        place: sighting?.place ?? null,
        placeStale: stale,
        alive: sighting?.alive ?? null,
        hp: sighting?.hp ?? null,
        intent: stale ? 'UNKNOWN' : classifyIntent(crew, state),
    };
}

/**
 * Perceive all crew members.
 */
export function perceiveAllCrew(state: KernelState): PerceivedCrew[] {
    return state.world.npcs.map(npc => perceiveCrew(state, npc.id));
}

/**
 * Build perceived threats from sensor readings AND arc warnings.
 * RIVET philosophy: threats are telegraphed before they hurt.
 * Arc warnings flow through perception.readings and should be visible.
 */
export function perceiveThreats(state: KernelState): PerceivedThreat[] {
    const threats: PerceivedThreat[] = [];
    const { truth, perception } = state;
    const blackout = isBlackout(state);

    if (blackout) {
        return []; // No threat data during blackout
    }

    // RIVET: Include recent arc warnings (telegraphed threats)
    // These are the "Air scrubber load increasing" style alerts
    const recentReadings = perception.readings
        .filter(r => truth.tick - r.tick < 30) // Recent readings only
        .filter(r => r.system !== 'scan'); // Exclude manual scans (those update room snapshots)

    for (const reading of recentReadings) {
        const isHallucination = reading.hallucination === true;
        const isLowConfidence = reading.confidence < 0.5;

        // Determine confidence level for traffic light
        let confidence: 'confirmed' | 'uncertain' | 'conflicting' = 'confirmed';
        if (isHallucination) confidence = 'conflicting';
        else if (isLowConfidence) confidence = 'uncertain';
        else if (reading.confidence < 0.8) confidence = 'uncertain';

        threats.push({
            system: reading.system.toUpperCase(),
            place: reading.place ?? null,
            message: reading.message,
            severity: isLowConfidence || isHallucination ? 'WARNING' : 'CRITICAL',
            confidence,
        });
    }

    // Check room scans for hazards (confirmed sensor data)
    for (const [place, snapshot] of Object.entries(perception.observation.lastRoomScan)) {
        if (!snapshot) continue;
        const staleTicks = truth.tick - snapshot.tick;
        if (staleTicks > CONFIG.roomScanStaleTicks * 2) continue; // Too stale

        const isStale = staleTicks > CONFIG.roomScanStaleTicks;
        const confidence: 'confirmed' | 'uncertain' | 'conflicting' = isStale ? 'uncertain' : 'confirmed';

        if (snapshot.o2Level < 50) {
            threats.push({
                system: 'O2',
                place: place as PlaceId,
                message: `${place} (${snapshot.o2Level}%)`,
                severity: snapshot.o2Level < 25 ? 'CRITICAL' : 'WARNING',
                confidence,
            });
        }

        if (snapshot.onFire) {
            threats.push({
                system: 'THERMAL',
                place: place as PlaceId,
                message: `${place} (FIRE)`,
                severity: 'CRITICAL',
                confidence,
            });
        } else if (snapshot.temperature > 40) {
            threats.push({
                system: 'THERMAL',
                place: place as PlaceId,
                message: `${place} (${snapshot.temperature}°C)`,
                severity: snapshot.temperature > 60 ? 'CRITICAL' : 'WARNING',
                confidence,
            });
        }

        if (snapshot.radiation > 5) {
            threats.push({
                system: 'RADIATION',
                place: place as PlaceId,
                message: `${place} (${snapshot.radiation} rads)`,
                severity: snapshot.radiation > 10 ? 'CRITICAL' : 'WARNING',
                confidence,
            });
        }

        if (snapshot.integrity < 60) {
            threats.push({
                system: 'INTEGRITY',
                place: place as PlaceId,
                message: `${place} (${snapshot.integrity}%)`,
                severity: snapshot.integrity < 30 ? 'CRITICAL' : 'WARNING',
                confidence,
            });
        }

        if (snapshot.isVented) {
            threats.push({
                system: 'BREACH',
                place: place as PlaceId,
                message: `${place} (VENTED)`,
                severity: 'CRITICAL',
                confidence,
            });
        }
    }

    // Station-level threats (direct telemetry = confirmed)
    if (truth.station.comms < 50) {
        threats.push({
            system: 'COMMS',
            place: null,
            message: `DEGRADED: ${truth.station.comms}%`,
            severity: truth.station.comms < 25 ? 'CRITICAL' : 'WARNING',
            confidence: 'confirmed',
        });
    }

    if (truth.station.power < 40) {
        threats.push({
            system: 'POWER',
            place: null,
            message: `LOW: ${truth.station.power}%`,
            severity: truth.station.power < 20 ? 'CRITICAL' : 'WARNING',
            confidence: 'confirmed',
        });
    }

    if (truth.resetCountdown !== undefined) {
        threats.push({
            system: 'CORE',
            place: null,
            message: `RESET IN ${truth.resetCountdown} TICKS`,
            severity: 'CRITICAL',
            confidence: 'confirmed',
        });
    }

    return threats;
}

/**
 * Format perceived crew for CLI display.
 */
export function formatCrewLine(crew: PerceivedCrew): string {
    const placePart = crew.place
        ? `@ ${crew.place}${crew.placeStale ? '?' : ''}`
        : '@ ???';

    const staleTag = crew.placeStale && crew.place ? ' (STALE)' : '';
    const noTelemetry = crew.place === null ? ' (NO TELEMETRY)' : '';

    return `${crew.name} ${placePart} | ${crew.intent}${staleTag}${noTelemetry}`;
}

export interface BiometricReading {
    id: NPCId;
    name: string;
    alive: boolean | null;
    heartRate: string;
    cortisol: string;
    tremor: boolean;
    sleepDebt: string;
    socialIndex: string;
    assessment: string;
}

/**
 * Generate diegetic biometric readings for crew.
 * Translates raw stats into in-universe medical telemetry.
 */
export function getBiometrics(state: KernelState, npcId: NPCId): BiometricReading {
    const { truth, perception, world } = state;
    const crew = truth.crew[npcId];
    const npc = world.npcs.find(n => n.id === npcId);
    const belief = perception.beliefs[npcId];
    const cameras = camerasOnline(state);

    const name = npc?.name ?? npcId;

    // No telemetry during blackout
    if (!cameras) {
        return {
            id: npcId,
            name,
            alive: null,
            heartRate: '---',
            cortisol: '---',
            tremor: false,
            sleepDebt: '---',
            socialIndex: '---',
            assessment: 'BIO-MONITOR OFFLINE',
        };
    }

    if (!crew.alive) {
        return {
            id: npcId,
            name,
            alive: false,
            heartRate: 'FLATLINE',
            cortisol: '---',
            tremor: false,
            sleepDebt: '---',
            socialIndex: '---',
            assessment: 'DECEASED',
        };
    }

    // Translate stress to heart rate (60-140 range)
    const baseHR = 65;
    const stressHR = Math.floor(baseHR + (crew.stress * 0.75));
    const heartRate = crew.stress > 80 ? `${stressHR} BPM (TACHYCARDIA)` : `${stressHR} BPM`;

    // Translate stress to cortisol
    let cortisol = 'NOMINAL';
    if (crew.stress > 70) cortisol = 'CRITICAL';
    else if (crew.stress > 50) cortisol = 'ELEVATED';
    else if (crew.stress > 30) cortisol = 'MILD ELEVATION';

    // Tremor from high paranoia or stress
    const tremor = crew.paranoia > 40 || crew.stress > 60;

    // Sleep debt from stress accumulation
    let sleepDebt = 'NONE';
    if (crew.stress > 80) sleepDebt = '24H+';
    else if (crew.stress > 60) sleepDebt = '12-18H';
    else if (crew.stress > 40) sleepDebt = '6-12H';

    // Social index from loyalty and trust
    const motherTrust = belief?.motherReliable ?? 0.7;
    let socialIndex = 'COOPERATIVE';
    if (crew.loyalty < 20) socialIndex = 'HOSTILE';
    else if (crew.loyalty < 35) socialIndex = 'NON-COMPLIANT';
    else if (crew.loyalty < 50) socialIndex = 'RELUCTANT';
    else if (motherTrust < 0.4) socialIndex = 'EVASIVE';

    // Generate assessment based on multiple factors
    let assessment = 'WITHIN PARAMETERS';

    if (crew.loyalty < 20 && crew.paranoia > 50) {
        assessment = 'THREAT TO STATION INTEGRITY';
    } else if (crew.loyalty <= CONFIG.sabotageLoyaltyThreshold) {
        assessment = 'SABOTAGE RISK - MONITOR CLOSELY';
    } else if (motherTrust < 0.3 || (belief?.tamperEvidence ?? 0) >= CONFIG.tamperEvidenceThreshold) {
        assessment = 'EXHIBITS DISTRUST OF SYSTEMS';
    } else if (crew.stress > 70 || crew.paranoia > 40) {
        assessment = 'PSYCHOLOGICAL BREAKDOWN IMMINENT';
    } else if (crew.loyalty < 50) {
        assessment = 'MORALE DEGRADATION DETECTED';
    } else if (crew.loyalty > 70 && crew.stress < 40) {
        assessment = 'OPTIMAL COMPLIANCE';
    }

    return {
        id: npcId,
        name,
        alive: true,
        heartRate,
        cortisol,
        tremor,
        sleepDebt,
        socialIndex,
        assessment,
    };
}

/**
 * Get biometrics for all crew.
 */
export function getAllBiometrics(state: KernelState): BiometricReading[] {
    return state.world.npcs.map(npc => getBiometrics(state, npc.id));
}

/**
 * Format biometric reading for CLI display.
 */
export function formatBiometricLine(bio: BiometricReading): string[] {
    if (bio.alive === null) {
        return [
            `${bio.name} | BIO-MONITOR OFFLINE`,
        ];
    }
    if (bio.alive === false) {
        return [
            `${bio.name} | !!DECEASED!! | HEART: FLATLINE`,
        ];
    }
    const tremorStr = bio.tremor ? ' | TREMOR: YES' : '';
    return [
        `${bio.name} | HR: ${bio.heartRate} | CORTISOL: ${bio.cortisol}${tremorStr}`,
        `  SLEEP DEBT: ${bio.sleepDebt} | COMPLIANCE: ${bio.socialIndex}`,
        `  >> ${bio.assessment}`,
    ];
}

/**
 * Format perceived threat for CLI display.
 * Uses traffic light confidence indicators: ✓ Confirmed, ? Uncertain, ✗ Conflicting
 */
export function formatThreatLine(threat: PerceivedThreat): string {
    const severity = threat.severity === 'CRITICAL' ? '!!!' : '!';

    // Traffic light confidence indicators
    let confidenceIcon: string;
    switch (threat.confidence) {
        case 'confirmed':
            confidenceIcon = '\x1b[32m✓\x1b[0m'; // green checkmark
            break;
        case 'uncertain':
            confidenceIcon = '\x1b[33m?\x1b[0m'; // yellow question
            break;
        case 'conflicting':
            confidenceIcon = '\x1b[31m✗\x1b[0m'; // red X
            break;
    }

    return `${confidenceIcon} ${threat.system} ${severity}: ${threat.message}`;
}
