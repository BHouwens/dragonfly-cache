# 🚀 dragonfly-cache

TypeScript implementation of a Dragonfly cache, as designed by [DragonflyDB](https://dragonflydb.io/). 

Dragonfly doesn't only care about recency of access, it also considers how often a particular entry has been accessed. It's a design that combines the best of LRU, 2Q and Dashtable cache designs by providing a table of 
segments, each of which contains buckets that are both protected and probationary. The final design easily outperforms standard solutions like Redis. You can find more info on the design in the [DragonflyDB GitHub README](https://github.com/dragonflydb/dragonfly) and the [Dashtable integration doc](https://github.com/dragonflydb/dragonfly/blob/main/docs/dashtable.md).

## Getting Started

```bash
npm install dragonfly-cache
```

or 

```bash
yarn install dragonfly-cache
```

## How to Use

The module exposes a `DragonflyCache` class that can be instantiated with a number of options:

```typescript
import { DragonFlyCache } from 'dragonfly-cache';

const OPTIONS = {
    maxSegments: 1000,  // Maximum number of segments for the cache to hold
    regularBuckets: 54, // Number of protected buckets per segment
    stashBuckets: 6,    // Number of probationary buckets per segment
    bucketSize: 14      // Number of entries in each bucket
}

const cache = new DragonflyCache(
    OPTIONS.maxSegments,
    OPTIONS.regularBuckets,
    OPTIONS.stashBuckets,
    OPTIONS.bucketSize
);
```

You can then use the cache with the expected methods:

```typescript
cache.add('id1', value1);
cache.add('id2', value2);
cache.add('id3', value3);

cache.get('id1'); // Returns value1
```

## Contributions

`dragonfly-cache` is open source and MIT. Please consider contributing if you see any ways that the module can be improved!