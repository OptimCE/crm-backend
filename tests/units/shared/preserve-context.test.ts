import { describe, expect, it } from "@jest/globals";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { contextMiddleware, getContext, preserveContext } from "../../../src/shared/middlewares/context.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";

describe("(Unit) preserveContext", () => {
  it("restores AsyncLocalStorage store after async middleware completes", async () => {
    const app = express();
    app.use(contextMiddleware());

    const asyncMiddleware = (_req: Request, _res: Response, next: NextFunction): void => {
      setImmediate(() => next());
    };

    app.post("/upload", preserveContext(asyncMiddleware), (_req, res) => {
      res.json({ community_id: getContext().community_id });
    });

    const response = await request(app)
      .post("/upload")
      .set("x-user-id", "auth0|admin")
      .set("x-community-id", AUTH_COMMUNITY_1)
      .set("x-user-orgs", ORGS_ADMIN);

    expect(response.status).toBe(200);
    expect(response.body.community_id).toBe(AUTH_COMMUNITY_1);
  });
});
