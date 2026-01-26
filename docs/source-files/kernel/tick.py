"""Tick engine for processing game ticks.

See spec: K01 §2-3

The tick engine is the heart of the kernel. It's a pure function:
(state, actions) → (new_state, events)
"""

from copy import deepcopy
from dataclasses import dataclass

from neurosym.kernel.events import (
    ActionCommittedEvent,
    ActionRejectedEvent,
    Event,
    EventLog,
    TickCommittedEvent,
)
from neurosym.kernel.hash import derive_event_id, hash_event
from neurosym.kernel.state import GameState
from neurosym.kernel.types import Action, RunId


@dataclass(frozen=True, slots=True)
class ActionResult:
    """Result of resolving an action.

    Attributes:
        success: Whether the action was valid and executed
        effects: Tuple of effect descriptions (if success)
        reason: Why the action failed (if not success)
    """

    success: bool
    effects: tuple[str, ...] = ()
    reason: str = ""


@dataclass(frozen=True, slots=True)
class TickResult:
    """Result of processing a tick.

    Attributes:
        state: The new game state after the tick
        events: List of events emitted during the tick
    """

    state: GameState
    events: list[Event]


def resolve_action(state: GameState, action: Action) -> ActionResult:
    """Resolve an action against the current state.

    This is a stub implementation for MVP. Full validation
    will be implemented in task 005.

    For testing purposes:
    - Actions with type "INVALID" are rejected
    - All other actions succeed with empty effects

    Args:
        state: Current game state
        action: The action to resolve

    Returns:
        ActionResult indicating success/failure and effects
    """
    # State will be used for validation in task 005
    _ = state

    # For MVP, all actions succeed with no effects
    # Full validation is in actions/pipeline.py
    return ActionResult(success=True, effects=(f"{action.action_type.value}_executed",))


def process_tick(
    state: GameState,
    actions: list[Action],
    run_id: RunId,
    event_log: EventLog,
    timestamp_ms: int = 0,
) -> TickResult:
    """Process one tick: validate and execute actions, emit events.

    This is a pure function with no side effects. The event_log is only
    read (for prev_event_hash) not written.

    Args:
        state: Current game state (will not be mutated)
        actions: List of actions to process in order
        run_id: The run ID for event generation
        event_log: Event log to read head_hash from
        timestamp_ms: Logical timestamp for events

    Returns:
        TickResult containing new state and events to append
    """
    # Deep copy state to avoid mutation
    new_state = deepcopy(state)
    new_state.tick_id += 1

    events: list[Event] = []
    prev_hash = event_log.head_hash
    event_seq = 0

    # Process each action in canonical order (submission order for MVP)
    for action in actions:
        result = resolve_action(new_state, action)

        if result.success:
            # Create ActionCommitted event
            event: Event = ActionCommittedEvent(
                event_id=derive_event_id(run_id, new_state.tick_id, event_seq),
                run_id=run_id,
                tick_id=new_state.tick_id,
                timestamp_ms=timestamp_ms,
                prev_event_hash=prev_hash,
                event_type="ACTION_COMMITTED",
                action_type=action.action_type.value,
                actor_id=action.actor_id,
                target_id=action.target_id,
                effects=result.effects,
            )
        else:
            # Create ActionRejected event
            event = ActionRejectedEvent(
                event_id=derive_event_id(run_id, new_state.tick_id, event_seq),
                run_id=run_id,
                tick_id=new_state.tick_id,
                timestamp_ms=timestamp_ms,
                prev_event_hash=prev_hash,
                event_type="ACTION_REJECTED",
                action_type=action.action_type.value,
                actor_id=action.actor_id,
                reason_code=result.reason,
            )

        events.append(event)
        # Update prev_hash for next event in chain
        prev_hash = hash_event(event.to_bytes())
        event_seq += 1

    # Emit TickCommitted event with state hash
    tick_committed = TickCommittedEvent(
        event_id=derive_event_id(run_id, new_state.tick_id, event_seq),
        run_id=run_id,
        tick_id=new_state.tick_id,
        timestamp_ms=timestamp_ms,
        prev_event_hash=prev_hash,
        event_type="TICK_COMMITTED",
        state_hash=new_state.snapshot_hash(),
    )
    events.append(tick_committed)

    return TickResult(state=new_state, events=events)


__all__ = [
    "ActionResult",
    "TickResult",
    "process_tick",
    "resolve_action",
]
