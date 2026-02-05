/**
 * Auto-Heist Domain Modules
 *
 * Complete grid-based stealth simulation from Auto-Heist.
 *
 * Structure:
 * - Core files: types, events, config, pack-types, rules-types, kernel, heist-kernel
 * - systems/: 15 systems (vision, alert, guard-movement, crew-behavior, etc.)
 * - reducers/: 13 reducers for all event types
 * - utils/: pathfinding (A* with costs), vision (LOS), perception, heat, noise
 * - adapters/: human (ASCII), agent (JSON), headless (testing)
 * - game/: GameSession wrapper and view types
 *
 * Key patterns:
 * - Detection accumulator (0-100 with gain/decay)
 * - Guard FSM (PATROL → INVESTIGATE → PURSUE → SWEEP → HOLD)
 * - Alert escalation (CALM → SUSPICIOUS → ALARM → LOCKDOWN)
 * - Directive cards with triggers, conditions, actions, charges, cooldowns
 * - Veto windows for player intervention
 *
 * NOTE: Imports point to Auto-Heist's structure (../types.js, etc.).
 * Update them for your game when adapting.
 */
