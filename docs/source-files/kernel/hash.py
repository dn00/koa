"""Hashing utilities for state verification and determinism checks.

See spec: K00, K01 §6
"""

import hashlib
import json
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from neurosym.kernel.types import RunId

# Zero hash for the first event in a chain
ZERO_HASH = "0" * 64


def sha256_hex(data: bytes) -> str:
    """Compute SHA-256 hash of data and return as hex string."""
    return hashlib.sha256(data).hexdigest()


def canonical_json(obj: Any) -> str:
    """Encode object to canonical JSON for deterministic hashing.

    Produces a deterministic string representation:
    - Keys sorted alphabetically at all nesting levels
    - No extra whitespace (compact encoding)
    - ASCII-safe output

    Args:
        obj: Any JSON-serializable Python object

    Returns:
        Canonical JSON string
    """
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
    )


def compute_hash(data: str | bytes) -> str:
    """Compute SHA-256 hash and return as hex string.

    Args:
        data: String or bytes to hash. Strings are UTF-8 encoded.

    Returns:
        64-character hex string (SHA-256 digest)
    """
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def derive_event_id(run_id: "RunId", tick_id: int, seq: int) -> str:
    """Derive deterministic event ID from run context.

    Formula: H("EVv1" || run_id || tick_id || seq)

    Args:
        run_id: The run this event belongs to
        tick_id: The tick when this event occurred
        seq: Sequence number within the tick (0-indexed)

    Returns:
        64-character hex string event ID
    """
    preimage = f"EVv1{run_id}{tick_id}{seq}".encode()
    return sha256_hex(preimage)


def hash_event(event_bytes: bytes) -> str:
    """Compute hash of a serialized event for chain linking.

    Args:
        event_bytes: Canonical serialized form of the event

    Returns:
        64-character hex string hash
    """
    return sha256_hex(event_bytes)


__all__ = [
    "ZERO_HASH",
    "canonical_json",
    "compute_hash",
    "derive_event_id",
    "hash_event",
    "sha256_hex",
]
