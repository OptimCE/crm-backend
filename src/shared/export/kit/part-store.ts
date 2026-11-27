import type { Readable } from "node:stream";

/**
 * Where a service writes its part: the `exports` bucket, under `parts/<exportId>/<service>/`.
 *
 * Narrow on purpose: a service only creates, reads and deletes objects under its own prefix (its
 * MinIO account allows nothing else). Size and sha256 are computed while writing; the only object
 * read back is the small done marker (PART_DONE_MARKER).
 */
export interface PartStore {
  /** Streams `body` to `key`. Resolves once the object is complete in the bucket. */
  put(key: string, body: Readable, contentType: string): Promise<void>;
  /** The object's bytes, or undefined when there is none. For small objects only. */
  get(key: string): Promise<Buffer | undefined>;
  /** Deletes every object under `prefix`; resolves with how many there were. */
  deletePrefix(prefix: string): Promise<number>;
}

/** In-memory store for tests and the contract check. */
export class MemoryPartStore implements PartStore {
  readonly objects = new Map<string, { body: Buffer; contentType: string }>();
  /** Every key ever deleted, in order: lets a test prove a prefix was emptied first. */
  readonly deleted: string[] = [];

  async put(key: string, body: Readable, contentType: string): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of body) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
    this.objects.set(key, { body: Buffer.concat(chunks), contentType });
  }

  async get(key: string): Promise<Buffer | undefined> {
    return this.objects.get(key)?.body;
  }

  async deletePrefix(prefix: string): Promise<number> {
    let count = 0;
    for (const key of [...this.objects.keys()]) {
      if (key.startsWith(prefix)) {
        this.objects.delete(key);
        this.deleted.push(key);
        count++;
      }
    }
    return count;
  }

  text(key: string): string {
    const object = this.objects.get(key);
    if (!object) throw new Error(`no object ${key}`);
    return object.body.toString("utf8");
  }
}
