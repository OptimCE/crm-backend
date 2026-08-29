import { describe, expect, it } from "@jest/globals";
import {
  CHANNEL_PATTERN,
  communityChannel,
  Tier,
  tiersForRole,
  userChannel,
} from "../../../src/shared/realtime/realtime.channels.js";
import { Role } from "../../../src/shared/dtos/role.js";

describe("(Unit) realtime channels", () => {
  it("builds the exact wire strings the Python producers also build", () => {
    // These literals are the contract with core/realtime/channels.py. Changing
    // either side without the other silently stops delivery — there is no
    // handshake and no error, the events just go to a channel nobody listens on.
    expect(userChannel(4821)).toBe("notify:v1:u:4821");
    expect(communityChannel(12, Tier.MEMBER)).toBe("notify:v1:c:12:MEMBER");
    expect(communityChannel(12, Tier.MANAGER)).toBe("notify:v1:c:12:MANAGER");
  });

  it("uses a pattern that matches every channel it can build", () => {
    const matches = (channel: string): boolean =>
      new RegExp(`^${CHANNEL_PATTERN.replace(/\*/g, ".*")}$`).test(channel);
    expect(matches(userChannel(1))).toBe(true);
    expect(matches(communityChannel(1, Tier.MANAGER))).toBe(true);
  });

  it("gives a manager both tiers so 'everyone in the community' is ONE publish", () => {
    expect(tiersForRole(Role.GESTIONNAIRE)).toEqual([Tier.MEMBER, Tier.MANAGER]);
    expect(tiersForRole(Role.ADMIN)).toEqual([Tier.MEMBER, Tier.MANAGER]);
  });

  it("never gives a plain member the MANAGER tier", () => {
    // The whole safety argument for the community channel family rests on this:
    // a worker publishes to :MANAGER with no audience lookup, and only the
    // subscribe side keeps it from leaking.
    expect(tiersForRole(Role.MEMBER)).toEqual([Tier.MEMBER]);
    expect(tiersForRole(Role.MEMBER)).not.toContain(Tier.MANAGER);
  });
});
