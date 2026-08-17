import express from "express";
import { container } from "../../../container/di-container.js";
import logger from "../../../shared/monitor/logger.js";
import type { IRealtimeHub } from "../../../shared/realtime/i-realtime.hub.js";

/**
 * THE ONE PATH THAT BYPASSES THE API GATEWAY.
 *
 * INVARIANT: this router contains EXACTLY ONE route, `GET /stream`, and it
 * carries NO `#swagger` annotation. That omission is the mechanism, not an
 * oversight: `src/swagger/generate-openfile.autogen.ts` feeds `swagger.yaml`,
 * which feeds `krakend.json`, so an un-annotated route can never appear at the
 * gateway. A contributor adding an annotation "for completeness" would create a
 * second, gateway-side path that buffers and times out after 3000ms.
 *
 * WHY THE BYPASS EXISTS, both reasons:
 *  1. `EventSource` cannot send an `Authorization` header, so nothing behind
 *     KrakenD's `auth/validator` is reachable by it at all.
 *  2. KrakenD buffers and JSON-decodes response bodies under a 3000ms global
 *     timeout, which a long-lived stream cannot survive.
 *
 * WHY IT IS SAFE. crm-backend performs ZERO authentication of its own — it
 * trusts `x-user-id` blindly (`shared/middlewares/context.ts`). Three things
 * keep that from being an authentication bypass here:
 *  - this router is mounted BEFORE `contextMiddleware()` in `app.ts`, so no
 *    authoritative-looking Context is ever built from a forged header;
 *  - the handler reads no `x-user-*` header, and nginx clears them on this
 *    location anyway;
 *  - the single-use ticket carries the resolved identity AND the exact channel
 *    list, so this leg performs no authorization at all. An endpoint that
 *    interprets no claims cannot be tricked into interpreting the wrong one.
 *
 * If `compression` is ever added to this app, this endpoint breaks silently.
 */
export const realtime_stream_routes = express.Router();

realtime_stream_routes.get("/stream", async (req, res) => {
  // The try/catch is required because of `res.flushHeaders()` below: once
  // headers are on the wire, an error reaching `errorHandler` would attempt
  // `res.status().json()` and surface as ERR_HTTP_HEADERS_SENT, masking the
  // real cause.
  try {
    const hub = container.isBound("RealtimeHub") ? container.get<IRealtimeHub>("RealtimeHub") : null;
    if (!hub) {
      res.status(503).set("Cache-Control", "no-store").end();
      return;
    }

    // Capacity BEFORE redemption: at the global cap, redeeming first would burn
    // the client's single-use credential and one of its rate-limited mints on a
    // connection we are about to refuse.
    if (!hub.hasCapacity()) {
      res.status(503).set("Cache-Control", "no-store").end();
      return;
    }

    // Unconditional, even for an empty token: redeemTicket() answers `""` with
    // `reason: "malformed_token"`, so every rejected request leaves exactly one
    // log line. Short-circuiting here would make a missing `?t=` the one failure
    // mode that logs nothing.
    const token = typeof req.query.t === "string" ? req.query.t : "";
    const claims = await hub.redeemTicket(token);
    if (!claims) {
      res.status(401).set("Cache-Control", "no-store").end();
      return;
    }

    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      // Belt and braces with nginx's `proxy_buffering off`, so the stream
      // survives someone editing the location block.
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
    });
    // MANDATORY: without it Node buffers the head until the first sizeable
    // write and the browser sits in `connecting`, never firing `onopen`.
    res.flushHeaders();
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true, 30_000);
    req.socket.setTimeout(0);

    // A slow floor only. Our own client closes and re-mints on error, because
    // EventSource's native retry would reuse this URL — i.e. an already-spent
    // single-use ticket — and 401 forever.
    res.write("retry: 30000\n\n");

    hub.attach(claims, req, res);
  } catch (err) {
    logger.error({ operation: "realtime:stream", err }, "SSE open failed");
    if (!res.headersSent) res.status(500).end();
    else res.end();
  }
});
