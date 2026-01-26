"""Event types for the game kernel.

See spec: K00.1

Events are the source of truth. Every state change is recorded as an immutable event.
The hash chain ensures tamper-evident history.
"""

from collections.abc import Iterator
from dataclasses import dataclass, fields
from typing import TYPE_CHECKING, Any

from neurosym.kernel.hash import ZERO_HASH, hash_event

if TYPE_CHECKING:
    from neurosym.kernel.types import EntityId, RunId


# --- Event Base Class ---


@dataclass(frozen=True, slots=True)
class Event:
    """Base class for all events.

    All events have these common fields forming the event envelope.
    Events are immutable once created (frozen=True).
    """

    event_id: str
    run_id: "RunId"
    tick_id: int
    timestamp_ms: int  # Logical time, not wall clock
    prev_event_hash: str
    event_type: str

    def to_bytes(self) -> bytes:
        """Serialize event to canonical bytes for hashing.

        Uses a deterministic format: field_name=value pairs sorted alphabetically.
        """
        parts: list[str] = []
        for field in sorted(fields(self), key=lambda f: f.name):
            value = getattr(self, field.name)
            parts.append(f"{field.name}={value!r}")
        return "|".join(parts).encode()


# --- MVP Event Types (6 total) ---


@dataclass(frozen=True, slots=True)
class RunStartedEvent(Event):
    """Emitted when a run begins.

    See spec: K00.1 §2
    """

    pack_id: str
    seed_hash: str
    participant_ids: tuple[str, ...]

    def __post_init__(self) -> None:
        # Ensure event_type is set correctly (validation only, not mutation)
        if self.event_type != "RUN_STARTED":
            raise ValueError(
                f"RunStartedEvent must have event_type='RUN_STARTED', got '{self.event_type}'"
            )


@dataclass(frozen=True, slots=True)
class ActionCommittedEvent(Event):
    """Emitted when an action succeeds.

    See spec: K00.1 §2
    """

    action_type: str
    actor_id: "EntityId"
    target_id: str | None
    effects: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.event_type != "ACTION_COMMITTED":
            raise ValueError(
                f"ActionCommittedEvent must have event_type='ACTION_COMMITTED', got '{self.event_type}'"
            )


@dataclass(frozen=True, slots=True)
class ActionRejectedEvent(Event):
    """Emitted when an action fails validation.

    See spec: K00.1 §2
    """

    action_type: str
    actor_id: "EntityId"
    reason_code: str

    def __post_init__(self) -> None:
        if self.event_type != "ACTION_REJECTED":
            raise ValueError(
                f"ActionRejectedEvent must have event_type='ACTION_REJECTED', got '{self.event_type}'"
            )


@dataclass(frozen=True, slots=True)
class WidgetStateChangedEvent(Event):
    """Emitted when a widget's state changes.

    See spec: K00.1 §2
    """

    widget_id: str
    old_state: str
    new_state: str

    def __post_init__(self) -> None:
        if self.event_type != "WIDGET_STATE_CHANGED":
            raise ValueError(
                f"WidgetStateChangedEvent must have event_type='WIDGET_STATE_CHANGED', got '{self.event_type}'"
            )


@dataclass(frozen=True, slots=True)
class ItemTransferredEvent(Event):
    """Emitted when an item moves between locations.

    See spec: K00.1 §2
    """

    item_id: str
    from_location: str | None
    to_location: str | None

    def __post_init__(self) -> None:
        if self.event_type != "ITEM_TRANSFERRED":
            raise ValueError(
                f"ItemTransferredEvent must have event_type='ITEM_TRANSFERRED', got '{self.event_type}'"
            )


@dataclass(frozen=True, slots=True)
class RunEndedEvent(Event):
    """Emitted when a run ends.

    See spec: K00.1 §2
    """

    outcome: str  # "won", "lost", "abandoned"
    final_tick: int

    def __post_init__(self) -> None:
        if self.event_type != "RUN_ENDED":
            raise ValueError(
                f"RunEndedEvent must have event_type='RUN_ENDED', got '{self.event_type}'"
            )


@dataclass(frozen=True, slots=True)
class TickCommittedEvent(Event):
    """Emitted after each tick is processed.

    See spec: K01 §2
    Contains the state hash for determinism verification.
    """

    state_hash: str

    def __post_init__(self) -> None:
        if self.event_type != "TICK_COMMITTED":
            raise ValueError(
                f"TickCommittedEvent must have event_type='TICK_COMMITTED', got '{self.event_type}'"
            )


# --- Event Log ---


class EventLog:
    """Append-only event log with hash chaining.

    The event log is the source of truth for all state changes.
    Events can only be appended, never modified or removed.
    Each event's prev_event_hash must match the hash of the previous event.
    """

    def __init__(self) -> None:
        self._events: list[Event] = []
        self._head_hash: str = ZERO_HASH

    def append(self, event: Event) -> None:
        """Append an event to the log.

        Verifies that the event's prev_event_hash matches the current head hash.

        Args:
            event: The event to append

        Raises:
            ValueError: If prev_event_hash doesn't match the chain
        """
        if event.prev_event_hash != self._head_hash:
            raise ValueError(
                f"Chain broken: event.prev_event_hash={event.prev_event_hash!r} "
                f"!= head_hash={self._head_hash!r}"
            )
        self._events.append(event)
        self._head_hash = hash_event(event.to_bytes())

    @property
    def head_hash(self) -> str:
        """Current head hash of the chain."""
        return self._head_hash

    def __iter__(self) -> Iterator[Event]:
        """Iterate over all events in order."""
        return iter(self._events)

    def __len__(self) -> int:
        """Number of events in the log."""
        return len(self._events)

    def __getitem__(self, index: int) -> Event:
        """Get event by index."""
        return self._events[index]

    def recent_events(self, limit: int = 20) -> list[dict[str, Any]]:
        """Get the most recent events for late join.

        Returns a list of simplified event dictionaries suitable for
        client activity feeds.

        Args:
            limit: Maximum number of events to return.

        Returns:
            List of event dictionaries with essential fields.
        """
        events = self._events[-limit:] if len(self._events) > limit else self._events
        return [
            {
                "event_id": e.event_id,
                "event_type": e.event_type,
                "tick_id": e.tick_id,
                "timestamp_ms": e.timestamp_ms,
            }
            for e in events
        ]


__all__ = [
    "ActionCommittedEvent",
    "ActionRejectedEvent",
    "Event",
    "EventLog",
    "ItemTransferredEvent",
    "RunEndedEvent",
    "RunStartedEvent",
    "TickCommittedEvent",
    "WidgetStateChangedEvent",
]
