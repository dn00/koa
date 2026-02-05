/**
 * Adapters Module
 *
 * Provides adapters for different player types:
 * - HumanAdapter: ASCII rendering and keyboard input for humans
 * - AgentAdapter: JSON protocol for LLM agents
 * - HeadlessAdapter: Programmatic control for automated testing
 *
 * @see Task 003, 004, 005 (game-session-refactor)
 */

export { HumanAdapter, type HumanAdapterOptions } from './human.js';
export {
  AgentAdapter,
  type AgentAdapterOptions,
  type CardInfo,
  type SessionStartInfo,
} from './agent.js';
export {
  HeadlessAdapter,
  type PolicyCallback,
  type AgentObservation,
  type TokenPolicy,
  viewToObservation,
  wrapTokenPolicy,
} from './headless.js';
