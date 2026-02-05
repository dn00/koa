/**
 * Gossip Ecology Module
 * 
 * Exports all gossip-related functionality for emergent simulation.
 */

// Types
export type {
    Affinity,
    GossipType,
    Gossip,
    Grudge,
    Alliance,
    CaseSummary,
    CaseHistory,
    GossipState,
} from './types.js';

export {
    NEUTRAL_AFFINITY,
    MIN_AFFINITY,
    MAX_AFFINITY,
    GOSSIP_CONSTANTS,
} from './types.js';

// Relationships
export {
    initializeAffinities,
    getAffinity,
    setAffinity,
    changeAffinity,
    tickProximity,
    tickAffinityDecay,
    getAllies,
    getEnemies,
    getWorstEnemy,
    getBestFriend,
} from './relationships.js';

// Rumors
export {
    createGossip,
    spawnDeedGossip,
    spawnIncidentGossip,
    spawnSecretGossip,
    findEligibleListeners,
    tickGossipPropagation,
    tickGossipDecay,
    getGossipAbout,
    getGossipKnownBy,
    getHottestGossip,
} from './rumors.js';

// History
export {
    createEmptyHistory,
    recordCase,
    createGrudge,
    decayGrudges,
    getGrudgesFrom,
    getGrudgesAgainst,
    createAlliance,
    areAllied,
    getAlliesOf,
    applyHistoryToAffinities,
    getCulpritCount,
    getWrongAccusedCount,
    getLastCrimeBy,
    narrateCaseSummary,
} from './history.js';

// Motives
export {
    deriveEmergentMotive,
} from './motives.js';

// Pre-simulation
export {
    initGossipState,
    runPreSimulation,
    generateSyntheticHistory,
    debugGossipState,
} from './presim.js';
