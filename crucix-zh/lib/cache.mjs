// Data Cache Manager
// Caches synthesized dashboard data to avoid waiting for sweeps
// Max total cache size: 500MB

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const MAX_CACHE_BYTES = 500 * 1024 * 1024; // 500MB

export class CacheManager {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this.currentFile = join(cacheDir, 'current.json');
    if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  }

  // Load latest cached data
  load() {
    try {
      if (!existsSync(this.currentFile)) return null;
      const data = JSON.parse(readFileSync(this.currentFile, 'utf8'));
      if (Date.now() - data._cachedAt > 3600000) return null; // stale after 1 hour
      delete data._cachedAt;
      return data;
    } catch { return null; }
  }

  // Save data to cache
  save(data) {
    try {
      const cached = { ...data, _cachedAt: Date.now() };
      writeFileSync(this.currentFile, JSON.stringify(cached));
      this.prune();
    } catch (e) { console.warn('[Cache] Save failed:', e.message); }
  }

  // Keep cache under 500MB: remove oldest files
  prune() {
    try {
      let totalSize = 0;
      const files = [];
      const items = readdirSync(this.cacheDir);
      for (const f of items) {
        const fp = join(this.cacheDir, f);
        const st = statSync(fp);
        totalSize += st.size;
        files.push({ path: fp, size: st.size, mtime: st.mtimeMs });
      }
      if (totalSize > MAX_CACHE_BYTES) {
        files.sort((a, b) => a.mtime - b.mtime);
        let removed = 0;
        for (const f of files) {
          if (totalSize <= MAX_CACHE_BYTES * 0.7) break;
          try { unlinkSync(f.path); totalSize -= f.size; removed++; } catch {}
        }
        if (removed > 0) console.log(`[Cache] Pruned ${removed} files, ${(totalSize/1024/1024).toFixed(1)}MB remaining`);
      }
    } catch {}
  }
}
