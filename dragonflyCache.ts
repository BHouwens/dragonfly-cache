import farmhash from "farmhash";
import { LRUCache } from "./cache";
import * as crypto from "crypto";

const DEFAULTS = {
  regularBuckets: 54,
  stashBuckets: 6,
  bucketSize: 14,
  maxSegments: 1000,
};

/**
 * Converts a string or object into a hash-based integer value
 *
 * @param {string | object} input
 * @returns A number representing the hash of the input
 */
function generateKey<T>(input: T) {
  const hexDigest = crypto
    .createHash("md5")
    .update(JSON.stringify(input))
    .digest("hex");
  return farmhash.fingerprint32(hexDigest);
}

class Segment<T> {
  private regularBucketsSize: number;
  private stashBucketsSize: number;
  private bucketSize: number;
  public regularBuckets: LRUCache<T>[];
  public stashBuckets: LRUCache<T>[];

  /**
   * @class Segment
   * @classdesc Segment of a Dash Table
   *
   * @param {number} regularBuckets - Number of regular buckets
   * @param {number} stashBuckets - Number of stash buckets
   * @param {number} bucketSize - Number of entries in a bucket
   */
  public constructor(
    regularBuckets: number = DEFAULTS.regularBuckets,
    stashBuckets: number = DEFAULTS.stashBuckets,
    bucketSize: number = DEFAULTS.bucketSize
  ) {
    this.regularBucketsSize = regularBuckets;
    this.stashBucketsSize = stashBuckets;
    this.bucketSize = bucketSize;

    this.regularBuckets = this.constructBuckets(this.regularBucketsSize, false);
    this.stashBuckets = this.constructBuckets(this.stashBucketsSize, true);
  }

  /**
   * @description Adds a value to the segment, starting in the stash buckets
   *
   * @param {string} key - Key id for the value
   * @param {T} value - The value to save
   * @returns A boolean indicating whether the value was added to the stash successfully
   */
  public add(key: string, value: T) {
    const bucketKey = this.generateBucketKey(key, this.stashBucketsSize);
    const bucket = this.stashBuckets[bucketKey];
    if (!bucket) {
      throw new Error("Bucket does not exist");
    }

    bucket.add(key, value);
  }

  /**
   * @description Gets a value from the segment
   *
   * @param {string} key - Key id for the value
   * @returns The value if found, otherwise null
   */
  public get(key: string) {
    const stashKey = this.generateBucketKey(key, this.stashBucketsSize);
    const stashBucket = this.stashBuckets[stashKey];
    if (!stashBucket) {
      throw new Error("Stash bucket does not exist");
    }

    // Getting the entry will remove it from its stash cache
    const stashValue = stashBucket.get(key);

    const regularKey = this.generateBucketKey(key, this.regularBucketsSize);
    const regularBucket = this.regularBuckets[regularKey];
    if (!regularBucket) {
      throw new Error("Regular bucket does not exist");
    }

    // If it was in stash
    if (stashValue) {
      regularBucket.add(key, stashValue);
      return stashValue;
    }

    // Otherwise get from bucket (returns null if not present)
    return regularBucket.get(key, true);
  }

  /**
   * @description Generates a bucket specific key for a given value
   *
   * @param {T} input - The value to generate a key for
   * @param {number} bucketSize - The number of buckets in the destination
   * @returns
   */
  private generateBucketKey<T>(input: T, bucketSize: number) {
    const key = generateKey(input);
    return key % bucketSize;
  }

  /**
   * @description Constructs an array of buckets
   *
   * @param {number} size - Number of buckets to construct
   * @param {boolean} addAsHead - Whether new entries should be added to the head of the cache
   * @returns An array of buckets containing LRU caches
   */
  private constructBuckets(size: number, addAsHead: boolean) {
    const buckets: LRUCache<T>[] = [];

    for (let i = 0; i < size; i++) {
      buckets.push(new LRUCache(this.bucketSize, addAsHead));
    }

    return buckets;
  }
}

export class DragonflyCache<T> {
  public cache: Map<number, Segment<T>>;
  private segRegularBuckets: number;
  private segStashBuckets: number;
  private bucketSize: number;
  private maxSegments: number;

  /**
   * @class DragonflyCache
   * @classdesc A Dragonfly cache for storing and retrieving values
   *
   * @param {number} maxSegments - Maximum number of segments. Defaults to 1000
   * @param {number} segRegularBuckets - Number of regular buckets per segment
   * @param {number} segStashBuckets - Number of stash buckets per segment
   * @param {number} bucketSize - Number of entries in a bucket
   */
  public constructor(
    maxSegments: number = DEFAULTS.maxSegments,
    segRegularBuckets: number = DEFAULTS.regularBuckets,
    segStashBuckets: number = DEFAULTS.stashBuckets,
    bucketSize: number = DEFAULTS.bucketSize
  ) {
    this.cache = new Map();
    this.segRegularBuckets = segRegularBuckets;
    this.segStashBuckets = segStashBuckets;
    this.bucketSize = bucketSize;
    this.maxSegments = maxSegments;
  }

  /**
   * @description Adds a value to the cache
   *
   * @param {string} key - Key id for the value
   * @param {T} value
   */
  public add(key: string, value: T) {
    const segmentKey = this.generateSegmentKey(key as T);
    const segment = this.getSegment(segmentKey);

    if (segment) {
      segment.add(key, value);
    } else {
      this.addSegment(segmentKey);
      this.add(key, value);
    }
  }

  /**
   * @description Gets a value from cache
   *
   * @param {string} key - Key id for the value
   * @returns The value associated with the key, or null if not found
   */
  public get(key: string) {
    const segmentKey = this.generateSegmentKey(key as T);
    const segment = this.getSegment(segmentKey);

    if (segment) {
      return segment.get(key);
    }

    return null;
  }

  /**
   * @description Clears the cache
   */
  public clear() {
    this.cache.clear();
  }

  /**
   * @description Retrieves the segment associated with a given key
   *
   * @param {number} key - Key id for the segment
   * @returns The segment if found, otherwise null
   */
  private getSegment(key: number) {
    return this.cache.get(key);
  }

  /**
   * @description Adds a segment to the cache
   *
   * @param {number} key - Key id for the segment
   */
  private addSegment(key: number) {
    const segment = new Segment<T>(
      this.segRegularBuckets,
      this.segStashBuckets,
      this.bucketSize
    );
    this.cache.set(key, segment);
  }

  /**
   * @description Generates a segment specific key for a given value
   *
   * @param {T} input
   * @returns A segment key integer
   */
  private generateSegmentKey(input: T) {
    const key = generateKey(input);
    return key % this.maxSegments;
  }
}
