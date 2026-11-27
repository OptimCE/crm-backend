import { connect, type NatsConnection } from "nats";
import logger from "../monitor/logger.js";
import { ensureExportsStream } from "./stream.js";

const RETRY_MS = 5_000;

/**
 * The API process's NATS connection for the data export. It announces new exports to the worker
 * (`export.job.requested`), and from phase 4 it also runs the `crm` part's consumer.
 *
 * It connects in the background and never holds up the API: a request made while NATS is away
 * leaves its job `pending`, and the worker's sweep picks it up. Once connected, the client
 * reconnects on its own; the stream is declared (or reconciled) on the first connection.
 */
export class ExportNats {
  private nc: NatsConnection | undefined;
  private started = false;
  private readonly stopped = new AbortController();
  private settleReady!: (nc: NatsConnection | undefined) => void;
  private readonly readyPromise = new Promise<NatsConnection | undefined>((resolve) => (this.settleReady = resolve));

  constructor(
    private readonly servers: string,
    private readonly name = "crm-backend-export",
  ) {}

  /** The connection, once it is up and the stream exists; undefined until then. */
  connection(): NatsConnection | undefined {
    return this.nc && !this.nc.isClosed() ? this.nc : undefined;
  }

  /** Resolves with the connection once it is ready, or with undefined if closed before. */
  whenReady(): Promise<NatsConnection | undefined> {
    return this.readyPromise;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    void this.run();
  }

  async close(): Promise<void> {
    this.stopped.abort();
    this.settleReady(undefined);
    const nc = this.nc;
    this.nc = undefined;
    if (nc && !nc.isClosed()) await nc.drain().catch(() => undefined);
  }

  private async run(): Promise<void> {
    let nc: NatsConnection | undefined;
    while (!this.stopped.signal.aborted && !nc) {
      try {
        nc = await connect({ servers: this.servers, name: this.name, maxReconnectAttempts: -1 });
      } catch (err) {
        logger.warn({ operation: "export:nats_connect", error: (err as Error).message }, "Export: NATS not reachable, retrying");
        await this.pause();
      }
    }
    if (!nc) {
      this.settleReady(undefined);
      return;
    }
    while (!this.stopped.signal.aborted) {
      try {
        await ensureExportsStream(await nc.jetstreamManager());
        break;
      } catch (err) {
        logger.warn({ operation: "export:stream", error: (err as Error).message }, "Export: EXPORTS stream not ready, retrying");
        await this.pause();
      }
    }
    if (this.stopped.signal.aborted) {
      this.settleReady(undefined);
      await nc.drain().catch(() => undefined);
      return;
    }
    this.nc = nc;
    this.settleReady(nc);
    logger.info({ operation: "export:nats_ready", servers: this.servers }, "Export: NATS ready");
  }

  private pause(): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(done, RETRY_MS);
      const signal = this.stopped.signal;
      function done(): void {
        clearTimeout(timer);
        signal.removeEventListener("abort", done);
        resolve();
      }
      signal.addEventListener("abort", done);
    });
  }
}
