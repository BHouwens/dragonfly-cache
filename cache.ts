class CacheNode<T> {
  public id: string;
  public value: T;
  public prev: CacheNode<T> | null;
  public next: CacheNode<T> | null;

  /**
   * @class CacheNode
   * @classdesc A node in a doubly linked list
   *
   * @param {string} id - The id of the node
   * @param {T} value - The value of the node
   */
  constructor(id: string, value: T) {
    this.id = id;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

export class LRUCache<T> {
  private head: CacheNode<T> | null;
  private tail: CacheNode<T> | null;
  private filled: number;
  private capacity: number;
  private addFromHead: boolean;

  /**
   * @class LRUCache
   * @classdesc An LRU cache implementation using a doubly linked list
   *
   * @param {number} capacity - The capacity of the cache
   * @param {boolean} addFromHead - Whether to add new entries to the head of the cache
   */
  public constructor(capacity: number, addFromHead: boolean) {
    this.head = null;
    this.tail = null;
    this.filled = 0;

    this.capacity = capacity;
    this.addFromHead = addFromHead;
  }

  /**
   * @description Adds a new entry to the cache
   *
   * @param {string} id - The id of the entry
   * @param {T} value - The value of the entry
   */
  public add(id: string, value: T) {
    let entry: CacheNode<T> = new CacheNode(id, value);

    if (this.reachedCapacity()) {
      this.ejectLRU();
    } else {
      this.filled++;
    }

    if (this.addFromHead && this.head) {
      this.addAsHead(entry);
    } else if (!this.addFromHead && this.tail) {
      this.addAsTail(entry);
    } else {
      this.head = entry;
      this.tail = entry;
    }
  }

  /**
   * @description Gets an entry by id
   *
   * @param {object} value - The value to get
   * @param {boolean} promote - Whether the entry should be promoted toward the head of the cache
   *
   */
  public get(id: string, promote: boolean = false) {
    let current = this.head;
    let prev: CacheNode<T> | null = null;

    while (current) {
      if (current.id === id) {
        if (promote) {
          this.promoteWithPrev(current, prev);
        } else {
          this.removeFromPosition(current);
        }

        return current.value;
      }

      prev = current;
      current = current.next;
    }

    return null;
  }

  /** Removes the least recently used entry from the cache */
  private ejectLRU() {
    if (this.addFromHead && this.head && this.head.next) {
      this.head = this.head.next;
      this.head.prev = null;
    } else if (this.tail && this.tail.prev && this.tail.next) {
      this.tail = this.tail.prev;
      this.tail.next = null;
    }
  }

  /**
   * @description Removes the entry from its current position in the cache
   *
   * @param {CacheNode} entry - The entry to remove
   */
  private removeFromPosition(entry: CacheNode<T>) {
    // If head is also tail
    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    }
    // If we're dealing with the head
    else if (!entry.prev && entry.next) {
      this.head = entry.next;
      this.head.prev = null;
    } else if (entry.next && entry.prev) {
      entry.prev.next = entry.next;
      entry.next.prev = entry.prev;
    }
  }

  /**
   * @description Promotes the entry toward the head of the cache, requiring
   * the previous entry as argument
   *
   * @param {CacheNode} entry - Current entry
   * @param {CacheNode | null} prev - Previous entry to the current
   */
  private promoteWithPrev(entry: CacheNode<T>, prev: CacheNode<T> | null) {
    if (prev) {
      const tempId = prev.id;
      const tempVal = prev.value;

      prev.id = entry.id;
      entry.id = tempId;
      prev.value = entry.value;
      entry.value = tempVal;
    }
  }

  /**
   * @description Promotes the entry toward the head of the cache
   *
   * @param {CacheNode} entry
   */
  private promote(entry: CacheNode<T>) {
    let current = this.head;
    let prev: CacheNode<T> | null = null;

    while (current && current.id != entry.id) {
      prev = current;
      current = current.next;
    }

    if (prev && current) {
      let tempVal = prev.value;
      let tempId = prev.id;
      prev.value = entry.value;
      prev.id = entry.id;
      current.value = tempVal;
      current.id = tempId;
    }
  }

  /**
   * @description Predicate for checking whether cache has reached capacity
   * @returns A boolean indicating whether the cache has reached capacity
   */
  private reachedCapacity() {
    return this.filled >= this.capacity;
  }

  /**
   * @description Adds a new entry to the head of the cache
   *
   * @param {CacheNode} entry - The entry to add to the head of the cache
   */
  private addAsHead(entry: CacheNode<T>) {
    if (this.head) {
      this.head.prev = entry;
      entry.next = this.head;
      this.head = entry;
    }
  }

  /**
   * @description Adds a new entry to the tail of the cache
   *
   * @param {CacheNode} entry - The entry to add to the tail of the cache
   */
  private addAsTail(entry: CacheNode<T>) {
    if (this.tail) {
      this.tail.next = entry;
      entry.prev = this.tail;
      this.tail = entry;
    }
  }
}