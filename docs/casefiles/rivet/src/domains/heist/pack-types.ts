/**
 * Heist Kernel - Pack Types
 *
 * Schemas for defining heist packs (facilities, objectives, guards).
 */

import type { Vec2, TileType, GuardState, CameraType, LightEmitter } from './types.js';
import type { SecurityProfile, TokenConfig, CrewConfig, HeistConfig } from './config.js';

// === FACILITY TEMPLATE ===

export interface RoomDef {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DoorDef {
  pos: Vec2;
  locked?: boolean;
  keyRequired?: string;
}

export interface SpecialTileDef {
  pos: Vec2;
  type: TileType;
}

export interface FacilityTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  rooms: RoomDef[];
  doors: DoorDef[];
  specialTiles: SpecialTileDef[];
  spawnPoints: {
    crew: Vec2[];
    guards: Vec2[];
  };
}

// === OBJECTIVE DEF ===

export interface ObjectiveDef {
  id: string;
  name: string;
  tileType: TileType;
  requiredTime: number;
  unlockedBy?: string; // previous objective id
  priority: number; // lower = earlier in sequence
}

// === GUARD SPAWN DEF ===

export interface PatrolRouteDef {
  waypoints: Vec2[];
}

export interface GuardSpawnDef {
  id: string;
  startPos: Vec2;
  initialState: GuardState;
  patrolRoute: PatrolRouteDef;
  visionRange?: number;
  visionAngle?: number;
}

// === FACILITY MODIFIER ===

export interface FacilityModifier {
  id: string;
  name: string;
  description: string;
  securityOverrides?: Partial<SecurityProfile>;
  extraGuards?: GuardSpawnDef[];
  lockedDoors?: Vec2[];
  // Future: additional modifiers for "boss blinds"
}

// === PACK TOKEN DEF ===

/**
 * Simple token definition for pack tokenPool.
 * Renamed from TokenDef to avoid conflict with rules-types.TokenDef (AH03 spec).
 */
export interface PackTokenDef {
  type: 'LIGHTS' | 'RADIO' | 'SMOKE' | 'DECOY';
  charges: number;
  duration: number;
  radius?: number;
  noiseLevel?: number;  // For DECOY tokens
}

// === PACK MANIFEST ===

/**
 * Pack manifest with integrity hash.
 */
export interface PackManifest {
  packId: string;
  version: string;
  contentHash: string; // sha256 of pack content (excluding this field)
}

// === HEIST PACK ===

/**
 * A heist pack defines a complete playable scenario.
 * Config overrides allow balance tuning without modifying defaults.
 */
export interface HeistPack {
  /** Pack identity and integrity */
  manifest: PackManifest;

  /** Facility layout with objectives, guards, spawn points */
  facility: FacilityDef;

  /** Security profile (guard behavior, alert thresholds) */
  security?: Partial<SecurityProfile>;

  /** Directive cards available for this heist */
  directivePool?: import('./rules-types.js').DirectiveCard[];

  /** Override cards (one-shot interventions) */
  overridePool?: import('./rules-types.js').DirectiveCard[];

  /** Relics (persistent upgrades) */
  relicPool?: unknown[];

  /** Module cards (passive effects per specss.md Section 13) */
  modulePool?: import('./rules-types.js').ModuleCard[];

  /** Token definitions */
  tokenPool?: PackTokenDef[];

  /** Full config override for balance tuning */
  config?: Partial<HeistConfig>;
}

/**
 * Legacy HeistPack for backward compatibility (without manifest).
 * Uses Omit to stay in sync with HeistPack changes.
 */
export type LegacyHeistPack = Omit<HeistPack, 'manifest'> & {
  packId: string;
  version: string;
};

/**
 * Type guard for legacy packs without manifest.
 */
export function isLegacyPack(pack: HeistPack | LegacyHeistPack): pack is LegacyHeistPack {
  return !('manifest' in pack);
}

// === CAMERA DEFINITION (perception-systems Task 002) ===

/**
 * Camera placement definition for facility config.
 */
export interface CameraDefinition {
  id: string;
  position: Vec2;
  cameraType: CameraType;
  facing: number;             // initial facing in degrees
  fovDegrees?: number;        // default from CameraConfig by type
  range?: number;             // default from CameraConfig by type
  sweepPattern?: {
    minFacing: number;
    maxFacing: number;
    degreesPerTick?: number;  // default from config
  };
}

/**
 * Facility definition (what's actually used by starter pack)
 */
export interface FacilityDef {
  width: number;
  height: number;
  tiles: import('./types.js').TileType[][];
  objectives: {
    id: string;
    type: string;
    pos: Vec2;
    workRequired: number;
    prerequisites: string[];
  }[];
  guardSpawns: {
    id: string;
    pos: Vec2;
    patrolRoute: Vec2[];
  }[];
  crewSpawn: Vec2;
  exitZone: Vec2[];
  /** Camera placements (perception-systems Task 002) */
  cameras?: CameraDefinition[];
  /** Light emitters (perception-systems Task 005) */
  lightEmitters?: LightEmitter[];
}
