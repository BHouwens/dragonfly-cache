interface DragonFlyCacheOptions {
  protectedBuckets?: number;
  probationaryBuckets?: number;
  bucketSlots?: number;
  bytesPerSlot?: number;
  segments: string[];
}

type Concrete<T> = {
  [Property in keyof T]-?: T[Property];
};

type CacheStructure<T> = {
    [key: string]: SegmentStructure<T>;
}

type SegmentStructure<T> = {
    'prot': T[][];
    'prob': T[][];
}

class DragonflyCache<T> {
  options: Concrete<DragonFlyCacheOptions>;
  cache: CacheStructure<T>;

  constructor(options: DragonFlyCacheOptions) {
    const defaultOptions = {
      protectedBuckets: 56,
      bucketSlots: 14,
      probationaryBuckets: 4,
      bytesPerSlot: 1024,
    };

    this.options = Object.assign(defaultOptions, options);
    this.cache = this.initCache();
  }

  initCache() {
    const { protectedBuckets, bucketSlots, probationaryBuckets, segments } =
      this.options;
    let cache = {};

    segments.forEach((segment) => {
      cache[segment] = {};
      cache[segment]["prot"] = new Array(protectedBuckets);
      cache[segment]["prob"] = new Array(probationaryBuckets);

      cache[segment]["prot"].forEach((bucket) => {
        cache[segment]["prot"][bucket] = new Array(bucketSlots);
      });

      cache[segment]["prob"].forEach((bucket) => {
        cache[segment]["prob"][bucket] = new Array(bucketSlots);
      });
    });

    return cache;
  }
}
