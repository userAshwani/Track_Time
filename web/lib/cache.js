const globalCache = globalThis.trackTimeCache || {
  store: new Map(),
};

globalThis.trackTimeCache = globalCache;

export async function getCache(key) {
  const entry = globalCache.store.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    globalCache.store.delete(key);
    return null;
  }

  return entry.value;
}

export async function setCache(key, value, ttlSeconds = 60) {
  globalCache.store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function deleteCache(...keys) {
  keys.forEach((key) => {
    globalCache.store.delete(key);
  });
}

export async function clearCacheByPrefix(prefix) {
  for (const key of globalCache.store.keys()) {
    if (key.startsWith(prefix)) {
      globalCache.store.delete(key);
    }
  }
}
