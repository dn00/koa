"""Core type definitions for the game kernel.

See spec: K00 §3-5
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, NewType

# --- ID Types (NewType for type safety without runtime overhead) ---

RunId = NewType("RunId", str)
CellId = NewType("CellId", str)
EntityId = NewType("EntityId", str)
ObjectId = NewType("ObjectId", str)
ItemId = NewType("ItemId", str)
WidgetId = NewType("WidgetId", str)


# --- Enums ---


class RunStatus(Enum):
    """Status of a game run."""

    PENDING = "pending"
    ACTIVE = "active"
    WON = "won"
    LOST = "lost"
    ABANDONED = "abandoned"


class ActionType(Enum):
    """Types of player actions."""

    EXAMINE = "examine"
    TAKE = "take"
    USE = "use"
    OPEN = "open"
    WIDGET_INPUT = "widget_input"
    WIDGET_SUBMIT = "widget_submit"


# --- Core Dataclasses (frozen for immutability, slots for efficiency) ---


@dataclass(frozen=True, slots=True)
class Run:
    """A game session.

    Represents a single playthrough of an escape room pack.
    """

    id: RunId
    seed: bytes
    pack_id: str
    tick_id: int
    status: RunStatus


@dataclass(frozen=True, slots=True)
class Cell:
    """A location in the game world.

    Contains references to objects that exist in this location.
    """

    id: CellId
    name: str
    object_ids: frozenset[ObjectId]


@dataclass(frozen=True, slots=True)
class Object:
    """An examinable thing in the game world.

    Objects can be examined but not taken. They may contain items
    or have associated widgets.
    """

    id: ObjectId
    name: str
    description: str
    examine_text: str
    visible: bool


@dataclass(frozen=True, slots=True)
class Item:
    """A takeable thing in the game world.

    Items can be picked up and placed in inventory or used on objects/widgets.
    """

    id: ItemId
    name: str
    description: str
    location: ObjectId | EntityId | None


@dataclass(frozen=True, slots=True)
class Action:
    """An action submitted by a player.

    Actions are validated and resolved during tick processing.
    See spec: K01 §2, K02 §3

    Attributes:
        action_type: The type of action (EXAMINE, TAKE, USE).
        actor_id: The entity performing the action.
        target_id: The target of the action (ObjectId, ItemId, or WidgetId).
        params: Additional parameters (e.g., use_with for USE actions).
    """

    action_type: ActionType
    actor_id: EntityId
    target_id: str
    params: dict[str, Any] = field(default_factory=lambda: dict[str, Any]())


__all__ = [
    "Action",
    "ActionType",
    "Cell",
    "CellId",
    "EntityId",
    "Item",
    "ItemId",
    "Object",
    "ObjectId",
    "Run",
    "RunId",
    "RunStatus",
    "WidgetId",
]
