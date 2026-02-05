/**
 * KOA Casefiles - Incident Blueprint System Types
 *
 * This module defines the parameterized blueprint system for generating
 * high-variety, funny, replayable cases through orthogonal variation knobs.
 *
 * Architecture:
 * - IncidentBlueprint: Intent-driven crime plans with method variants
 * - TopologyFamily: House layout patterns (hub_spokes, loop, gated_wing, etc.)
 * - CastRecipe: NPC archetype combinations
 * - ShenaniganPack: Comedy layer (separate from truth simulation)
 */

import type {
    NPCId,
    PlaceId,
    DeviceId,
    ItemId,
    WindowId,
    EventId,
    CrimeType,
    MethodId,
    MotiveType,
    EventType,
    DeviceType,
    EvidenceKind,
} from '../types.js';

// ============================================================================
// Incident Blueprint System
// ============================================================================

/**
 * IncidentBlueprint - A parameterized crime template
 *
 * An incident is a constrained event-chain with:
 * - Roles (culprit, target, witnesses)
 * - A goal (steal/swap/sabotage)
 * - A method (door spoof, alibi trick, item swap)
 * - Guaranteed evidence footprint
 */
export interface IncidentBlueprint {
    id: string;
    name: string;
    incidentType: IncidentType;

    // Roles
    roles: {
        required: RoleSpec[];
        optional: RoleSpec[];
    };

    // Requirements
    requiredProps: {
        items: ItemConstraint[];
        devices: DeviceConstraint[];
    };
    preconditions: Precondition[];

    // Intent-driven plan (not coordinates)
    planSteps: PlanStep[];
    fallbacks: FallbackRule[];

    // Method variants (3-6 per blueprint)
    methodVariants: MethodVariant[];

    // Evidence requirements
    evidenceBudget: EvidenceBudget;
    antiClimaxRules: AntiClimaxRule[];

    // Comedy hooks (references into ShenaniganPack)
    comedyTags: string[];
}

export type IncidentType =
    | 'theft'
    | 'sabotage'
    | 'disappearance'
    | 'prank'
    | 'swap';

// ============================================================================
// Roles & Constraints
// ============================================================================

export interface RoleSpec {
    id: RoleId;
    archetypeConstraints?: ArchetypeId[];  // Preferred archetypes
    requiredTraits?: string[];
}

export type RoleId =
    | 'culprit'
    | 'target'        // Victim/owner of targeted item
    | 'witnessA'
    | 'witnessB'
    | 'redHerring'
    | 'accomplice'
    | 'distractor';

export interface ItemConstraint {
    category?: ItemCategory;
    affordances?: ObjectAffordance[];
    excludeAffordances?: ObjectAffordance[];
}

export interface DeviceConstraint {
    type?: DeviceType;
    location?: PlaceConstraint;
    mustExist: boolean;
}

export interface PlaceConstraint {
    type?: PlaceType;
    adjacentTo?: PlaceId;
    notAdjacentTo?: PlaceId;
    hasDevice?: DeviceType;
}

export interface Precondition {
    type: PreconditionType;
    params: Record<string, unknown>;
}

export type PreconditionType =
    | 'role_has_access'       // "culprit can reach target place"
    | 'device_exists'         // "motion sensor in kitchen"
    | 'item_in_place'         // "target item is in accessible location"
    | 'npc_schedule_gap'      // "culprit has opportunity window"
    | 'visibility_low';       // "crime place has low observation"

// ============================================================================
// Plan Steps & Intents
// ============================================================================

/**
 * PlanStep - A single step in the crime choreography
 *
 * Steps are intent-driven (not coordinate-based) so they
 * adapt to different topologies and cast configurations.
 */
export interface PlanStep {
    id: string;
    intent: Intent;
    actor: RoleId;
    target?: string;          // place, item, device, or NPC role
    generateEvents: EventType[];
    optional?: boolean;       // Can be skipped if fallback triggers
}

export interface Intent {
    type: IntentType;
    params: Record<string, unknown>;
}

export type IntentType =
    | 'MOVE_TO'       // Go to a place
    | 'ACQUIRE'       // Pick up an item
    | 'SPOOF'         // Fake a device signal
    | 'SWAP'          // Replace item with another
    | 'HIDE'          // Conceal an item
    | 'DISTRACT'      // Create a diversion
    | 'WAIT'          // Wait for condition
    | 'TAMPER'        // Mess with a device
    | 'DROP'          // Leave item somewhere
    | 'OBSERVE';      // Watch/listen (for witnesses)

// ============================================================================
// Fallback Rules
// ============================================================================

/**
 * FallbackRule - What to do when a plan step can't execute
 *
 * Provides deterministic alternatives when:
 * - Door is locked
 * - Witness is present
 * - Item is missing
 * - Timeout occurs
 */
export interface FallbackRule {
    trigger: FallbackTrigger;
    actions: FallbackAction[];  // Ordered by priority
}

export type FallbackTrigger =
    | 'door_locked'
    | 'witness_present'
    | 'item_missing'
    | 'item_moved'
    | 'device_active'
    | 'timeout';

export type FallbackAction =
    | { type: 'wait'; ticks: number }
    | { type: 'alternate_route'; via: PlaceConstraint }
    | { type: 'create_distraction'; method: string }
    | { type: 'swap_method'; to: MethodId }
    | { type: 'abort' };

// ============================================================================
// Method Variants
// ============================================================================

/**
 * MethodVariant - A specific way to execute the blueprint
 *
 * Each blueprint has 3-6 method variants with different:
 * - Required conditions
 * - Evidence signatures
 * - Comedy hooks
 */
export interface MethodVariant {
    id: MethodId;
    name: string;
    planStepsOverride?: Partial<PlanStep>[];
    requiredConditions: MethodCondition[];
    evidenceSignature: EvidenceSignature[];
    comedyHooks: string[];
}

export interface MethodCondition {
    type: 'device_present' | 'route_exists' | 'item_property' | 'npc_trait';
    params: Record<string, unknown>;
}

export interface EvidenceSignature {
    kind: EvidenceKind;
    certainty: 'guaranteed' | 'likely' | 'possible';
    impliesChain: ChainTarget;
}

export type ChainTarget = 'who' | 'what' | 'how' | 'when' | 'where' | 'why';

// ============================================================================
// Evidence Budget
// ============================================================================

/**
 * EvidenceBudget - Minimum evidence requirements for solvability
 *
 * Ensures every case has enough clues without being too easy.
 */
export interface EvidenceBudget {
    whoChains: number;      // Min 2 independent chains for WHO
    whatChains: number;     // Min 1 chain for WHAT (crime type)
    howChains: number;      // Min 1 chain for HOW (method)
    whenChains: number;     // Min 1 chain for WHEN (window)
    whereChains: number;    // Min 1 chain for WHERE (location)
    whyChains: number;      // Min 1 chain for WHY (motive)
    requiredModalities: EvidenceKind[];
}

// ============================================================================
// Anti-Anticlimax Rules
// ============================================================================

export interface AntiClimaxRule {
    type: AntiClimaxRuleType;
    params: Record<string, unknown>;
}

export type AntiClimaxRuleType =
    | 'no_direct_witness'     // No one sees the crime directly
    | 'camera_ambiguous'      // Camera captures "human-shaped" not identity
    | 'occlusion_required'    // Must have visual blocker
    | 'testimony_indirect';   // Witnesses report observables, not identity

// ============================================================================
// Topology Families
// ============================================================================

/**
 * TopologyFamily - House layout pattern
 *
 * Different topologies create different investigation dynamics:
 * - hub_spokes: Central hub with radiating rooms (current)
 * - loop: Circular path, no dead ends
 * - gated_wing: Two sections with chokepoint
 * - split_level: Vertical layers with limited access
 * - open_plan: Few walls, high visibility
 */
export type TopologyId =
    | 'hub_spokes'
    | 'loop'
    | 'gated_wing'
    | 'split_level'
    | 'open_plan';

export interface TopologyFamily {
    id: TopologyId;
    name: string;
    description: string;

    placeCount: { min: number; max: number };
    connectivityRules: ConnectivityRule[];

    deviceStrategy: DevicePlacementStrategy;
    placeTemplates: PlaceTemplate[];

    // Graph properties
    expectedDiameter: number;    // Typical max distance between rooms
    chokepointCount: number;     // Bottleneck points for observation
}

export interface ConnectivityRule {
    type: 'must_connect' | 'cannot_connect' | 'hub_required' | 'loop_required';
    params: Record<string, unknown>;
}

export interface DevicePlacementStrategy {
    doorSensorCoverage: number;     // 0-1, fraction of doors monitored
    motionSensorPlacement: 'hub' | 'chokepoints' | 'random' | 'perimeter';
    cameraPlacement?: 'entrance' | 'hub' | 'none';
}

export interface PlaceTemplate {
    type: PlaceType;
    name: string;
    required: boolean;
    maxCount: number;
    typicalDevices: DeviceType[];
}

export type PlaceType =
    | 'social'      // Living room, kitchen - high traffic
    | 'private'     // Bedroom, office - low traffic
    | 'functional'  // Garage, utility - task-based visits
    | 'transition'; // Hallway, entrance - movement paths

// ============================================================================
// Cast Recipes
// ============================================================================

/**
 * ArchetypeId - NPC behavior patterns
 *
 * Archetypes define schedule tendencies, social traits, and comedy potential.
 */
export type ArchetypeId =
    // Work styles
    | 'workaholic'
    | 'slacker'
    | 'creative'
    | 'techie'
    // Sleep patterns
    | 'early_bird'
    | 'night_owl'
    | 'insomniac'
    // Social styles
    | 'social_butterfly'
    | 'introvert'
    | 'gossip'
    | 'peacemaker'
    | 'troublemaker'
    // Personality
    | 'paranoid'
    | 'oblivious'
    | 'nosy'
    | 'secretive';

export interface NPCArchetype {
    id: ArchetypeId;
    name: string;
    description: string;

    // Schedule generation hints
    schedulePattern: SchedulePattern;
    preferredPlaceTypes: PlaceType[];
    avoidedPlaceTypes: PlaceType[];

    // Distraction profile (affects witnessing)
    distractibility: number;           // 0-100
    peakAlertWindows: WindowId[];
    peakDistractedWindows: WindowId[];

    // Social traits (affects testimony/gossip)
    gossipTendency: number;            // 0-100
    witnessReliability: number;        // 0-100

    // Comedy traits
    embarrassmentThreshold: number;    // For embarrassment meter
    comedyTraits: string[];
}

export interface SchedulePattern {
    wakeBias: 'early' | 'normal' | 'late';
    socialBias: 'high' | 'medium' | 'low';
    movementFrequency: 'high' | 'medium' | 'low';
    routineRigidity: 'rigid' | 'flexible' | 'chaotic';
}

/**
 * CastRecipe - Rules for assembling NPC cast
 */
export interface CastRecipe {
    id: string;
    name: string;
    description: string;

    archetypePool: ArchetypeId[];
    minCastSize: number;
    maxCastSize: number;
    requiredArchetypes: ArchetypeId[];
    forbiddenCombinations: [ArchetypeId, ArchetypeId][];
    relationshipRules: RelationshipRule[];
}

export interface RelationshipRule {
    type: 'must_have' | 'cannot_have' | 'prefer';
    relationship: RelationshipType;
    between?: [ArchetypeId, ArchetypeId];
}

export type RelationshipType =
    | 'rivalry'
    | 'alliance'
    | 'grudge'
    | 'crush'
    | 'annoyance';

// ============================================================================
// Shenanigan Pack (Comedy Layer)
// ============================================================================

/**
 * ShenaniganObject - Items with comedy affordances
 *
 * The comedy layer is completely separate from truth simulation.
 * These objects skin the abstract items with funny properties.
 */
export interface ShenaniganObject {
    id: string;
    name: string;
    funnyName: string;           // "Sourdough starter 'Gerald'"
    category: ItemCategory;

    // Affordances (used by blueprints)
    affordances: ObjectAffordance[];

    // Comedy properties
    awkwardness: number;         // 0-100
    fragility: number;           // 0-100
    smelliness: number;          // 0-100
    noisiness: number;           // 0-100
    whyPeopleCare: string;       // "It's been in the family for 3 weeks"
}

export type ItemCategory =
    | 'food'
    | 'electronics'
    | 'collectible'
    | 'plant'
    | 'clothing'
    | 'document'
    | 'decoration'
    | 'tool';

export type ObjectAffordance =
    | 'swappable'      // Can be replaced with similar item
    | 'spillable'      // Can make a mess
    | 'squeaks'        // Makes noise when moved
    | 'needsFridge'    // Must be stored cold
    | 'leavesResidue'  // Leaves traces (glitter, crumbs)
    | 'fragile'        // Can break
    | 'smelly'         // Detectable by smell
    | 'embarrassing'   // Socially awkward to possess
    | 'valuable'       // Worth stealing
    | 'sentimental';   // Emotional attachment

/**
 * PettyMotive - Lightweight motive for comedy
 */
export interface PettyMotive {
    id: string;
    template: string;            // "Prove I'm right about {topic}"
    comedyTags: string[];
    compatibleIncidents: IncidentType[];
}

/**
 * BarkTemplate - Dialogue template with slots
 */
export interface BarkTemplate {
    id: string;
    template: string;            // "I saw {subjectHint} near {place} during {window}"
    tags: string[];
    context: BarkContext;
    koaMode?: KOAMode;
}

export interface BarkContext {
    situation: 'testimony' | 'observation' | 'gossip' | 'koa_comment' | 'accusation_response';
    tone: 'neutral' | 'suspicious' | 'defensive' | 'helpful' | 'snarky';
}

export type KOAMode =
    | 'corporate'           // Euphemisms, liability shielding
    | 'passive_aggressive'  // "Noted. Interesting choice."
    | 'overhelpful'         // "I filed your shame under 'Kitchen: Crimes'."
    | 'conspiracy';         // "Pattern match: 87% chance of petty revenge."

// ============================================================================
// Comedy Twist Rules
// ============================================================================

export type ComedyTwist =
    | 'well_intentioned_sabotage'   // Culprit thinks they're helping
    | 'overcorrection'              // Fix causes worse outcome
    | 'mistaken_identity'           // Same hoodie / phone name
    | 'device_misinterpretation'    // KOA hears wrong command
    | 'polite_lying'                // Fake compliment alibi
    | 'pet_factor';                 // Cat triggers sensor, steals item

// ============================================================================
// Embarrassment & Escalation Systems
// ============================================================================

export interface EmbarrassmentState {
    npcId: NPCId;
    level: number;           // 0-100
    triggers: string[];      // What caused it
}

export interface TestimonyModifier {
    lies?: boolean;
    avoids?: boolean;
    vague?: boolean;
    honest?: boolean;
}

export interface PettyEscalation {
    wrongedNpc: NPCId;
    wrongedBy: NPCId;
    retaliationType: 'passive_aggressive_note' | 'hide_item' | 'spread_rumor';
    tick: number;
}

// ============================================================================
// Instantiated Crime Plan
// ============================================================================

/**
 * CrimePlan - A fully instantiated blueprint ready for simulation
 *
 * Created by binding a blueprint to a specific world configuration.
 */
export interface CrimePlan {
    blueprintId: string;
    variantId: MethodId;

    // Bound roles
    culprit: NPCId;
    target?: NPCId;
    witnesses: NPCId[];
    redHerring?: NPCId;

    // Bound locations/items
    targetItem: ItemId;
    crimePlace: PlaceId;
    hidePlace: PlaceId;
    route: PlaceId[];

    // Timing
    crimeWindow: WindowId;
    crimeTick: number;

    // Resolved steps (with concrete IDs)
    resolvedSteps: ResolvedCrimeStep[];
}

export interface ResolvedCrimeStep {
    stepId: string;
    tick: number;
    actor: NPCId;
    place: PlaceId;
    intent: Intent;
    expectedEvents: EventType[];
}

// ============================================================================
// Generation Pipeline Types
// ============================================================================

/**
 * CaseFingerprint - For novelty detection
 */
export interface CaseFingerprint {
    topologyFamily: TopologyId;
    culpritArchetype: ArchetypeId;
    incidentType: IncidentType;
    methodId: MethodId;
    evidencePattern: string;       // Hash of evidence topology
    primaryContradictionType: string;
    absurdPropCategory: ItemCategory;
}

export interface CaseCandidate {
    result: unknown;  // SimulationResult - avoid circular import
    fingerprint: CaseFingerprint;
    score: number;
}

/**
 * ComedyRequirements - Validation for comedy content
 */
export interface ComedyRequirements {
    absurdProps: number;              // Min 1 absurd prop
    pettyMotiveImplied: boolean;      // Motive must be petty
    benignSuspiciousAct: number;      // Min 1 red herring
    directConfession: number;         // Must be 0
}

/**
 * AntiPatternRules - Rejection rules for repetition
 */
export interface AntiPatternRules {
    objectArchetypeCooldown: number;              // Don't repeat object type
    twistRuleCooldown: number;                    // Don't repeat twist
    methodCooldown: number;                       // Don't repeat method
    evidenceTopologySimilarityThreshold: number; // Max similarity score
}

// ============================================================================
// Registry Types
// ============================================================================

export interface BlueprintRegistry {
    blueprints: Map<string, IncidentBlueprint>;
    getByType(type: IncidentType): IncidentBlueprint[];
    getById(id: string): IncidentBlueprint | undefined;
}

export interface TopologyRegistry {
    families: Map<TopologyId, TopologyFamily>;
    getById(id: TopologyId): TopologyFamily | undefined;
}

export interface ArchetypeRegistry {
    archetypes: Map<ArchetypeId, NPCArchetype>;
    getById(id: ArchetypeId): NPCArchetype | undefined;
}

// ============================================================================
// Generated World Types (output of topology + cast generation)
// ============================================================================

export interface GeneratedTopology {
    familyId: TopologyId;
    places: GeneratedPlace[];
    connections: PlaceConnection[];
    devices: GeneratedDevice[];
}

export interface GeneratedPlace {
    id: PlaceId;
    name: string;
    type: PlaceType;
    templateId: string;
}

export interface PlaceConnection {
    from: PlaceId;
    to: PlaceId;
    hasDoor: boolean;
    doorSensorId?: DeviceId;
}

export interface GeneratedDevice {
    id: DeviceId;
    type: DeviceType;
    place: PlaceId;
    connectsTo?: PlaceId;
}

export interface GeneratedCast {
    npcs: GeneratedNPC[];
    relationships: GeneratedRelationship[];
}

export interface GeneratedNPC {
    id: NPCId;
    name: string;
    archetypeId: ArchetypeId;
    scheduleHints: ScheduleHint[];
}

export interface ScheduleHint {
    window: WindowId;
    preferredPlaceType: PlaceType;
    activity: string;
}

export interface GeneratedRelationship {
    from: NPCId;
    to: NPCId;
    type: RelationshipType;
    intensity: number;
    backstory: string;
}
