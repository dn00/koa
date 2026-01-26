"""Game state representation and hashing for replay verification.

See spec: K00.1 §6-7, K01 §6
"""

from dataclasses import dataclass, field
from typing import Any

from neurosym.kernel.hash import canonical_json, compute_hash
from neurosym.kernel.types import CellId, EntityId, ItemId, ObjectId, WidgetId


@dataclass
class GameState:
    """Mutable game state during a run.

    Contains all state that affects game logic and must be hashed
    for determinism verification. Excludes UI preferences, LLM narration,
    and timestamps.

    Attributes:
        tick_id: Current tick number (included in hash)
        objects: Object states keyed by ObjectId
        items: Item states keyed by ItemId
        inventory: Entity inventories mapping EntityId to set of ItemIds
        widgets: Widget states keyed by WidgetId
        predicates: Boolean flags for game conditions
        examined: Objects examined by each entity
        actor_cell: Current cell location for each actor
    """

    tick_id: int
    objects: dict[ObjectId, Any] = field(default_factory=lambda: dict[ObjectId, Any]())
    items: dict[ItemId, Any] = field(default_factory=lambda: dict[ItemId, Any]())
    inventory: dict[EntityId, set[ItemId]] = field(
        default_factory=lambda: dict[EntityId, set[ItemId]]()
    )
    widgets: dict[WidgetId, Any] = field(default_factory=lambda: dict[WidgetId, Any]())
    predicates: dict[str, bool] = field(default_factory=lambda: dict[str, bool]())
    examined: dict[EntityId, set[ObjectId]] = field(
        default_factory=lambda: dict[EntityId, set[ObjectId]]()
    )
    actor_cell: dict[EntityId, CellId] = field(default_factory=lambda: dict[EntityId, CellId]())

    def _to_hashable_dict(self) -> dict[str, Any]:
        """Convert state to a deterministic dict for hashing.

        Ensures consistent ordering and JSON-serializable format.
        Sets are converted to sorted lists for determinism.
        """
        return {
            "tick_id": self.tick_id,
            "objects": dict(sorted(self.objects.items())),
            "items": dict(sorted(self.items.items())),
            "inventory": {k: sorted(v) for k, v in sorted(self.inventory.items())},
            "widgets": dict(sorted(self.widgets.items())),
            "predicates": dict(sorted(self.predicates.items())),
            "examined": {k: sorted(v) for k, v in sorted(self.examined.items())},
            "actor_cell": dict(sorted(self.actor_cell.items())),
        }

    def snapshot_hash(self) -> str:
        """Compute canonical hash of current state.

        Returns:
            64-character hex string (SHA-256 of canonical JSON)
        """
        snapshot = self._to_hashable_dict()
        return compute_hash(canonical_json(snapshot))


__all__ = ["GameState"]
