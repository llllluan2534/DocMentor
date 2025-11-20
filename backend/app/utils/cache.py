# backend/app/utils/cache.py
from typing import Any, Optional
import time

class SimpleCache:
    """In-memory cache đơn giản có TTL."""

    def __init__(self):
        self._cache = {}
        self._ttl = {}

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        self._cache[key] = value
        self._ttl[key] = time.time() + ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None

        if time.time() > self._ttl.get(key, 0):
            self.delete(key)
            return None

        return self._cache[key]

    def delete(self, key: str):
        self._cache.pop(key, None)
        self._ttl.pop(key, None)

    def clear(self):
        self._cache.clear()
        self._ttl.clear()

    def get_stats(self):
        return {
            "total_keys": len(self._cache),
            "keys": list(self._cache.keys())
        }

# GLOBAL CACHE INSTANCE
cache = SimpleCache()
