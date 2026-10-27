/**
 * The in-app onboarding tours a user can be offered, and how the answer to an
 * offer may change. The frontend decides WHEN to offer a tour; this module only
 * stores the answer (one `user_onboarding` row per user and tour).
 *
 * The frontend mirrors this list in `features/onboarding/onboarding-tours.ts`.
 * A new tour needs a key here and there, but no migration: the database does
 * not constrain `tour_key`.
 */
export const ONBOARDING_TOUR_KEYS = ["welcome", "community_member", "community_manager", "community_admin"] as const;
export type OnboardingTourKey = (typeof ONBOARDING_TOUR_KEYS)[number];

/** Every outcome a row can hold. `backfilled` is written by the migration only. */
export const ONBOARDING_OUTCOMES = ["dismissed", "started", "completed", "abandoned", "backfilled"] as const;
export type OnboardingOutcome = (typeof ONBOARDING_OUTCOMES)[number];

/** The outcomes a client may send. */
export const ONBOARDING_API_OUTCOMES = ["dismissed", "started", "completed", "abandoned"] as const;
export type OnboardingApiOutcome = (typeof ONBOARDING_API_OUTCOMES)[number];

export function isOnboardingTourKey(value: unknown): value is OnboardingTourKey {
  return typeof value === "string" && (ONBOARDING_TOUR_KEYS as readonly string[]).includes(value);
}

/**
 * What writing `next` does to a row currently holding `current` (null = no row).
 *
 * - no row          -> `dismissed` | `started` insert it ("Later" / "Show me");
 * - `started`       -> `completed` | `abandoned` (what the tour reported);
 * - the same value  -> nothing, so a retried request is harmless;
 * - anything else   -> refused. A row is never deleted or moved backwards.
 */
export type OnboardingTransition = "insert" | "update" | "noop" | "forbidden";

export function onboardingTransition(current: OnboardingOutcome | null, next: OnboardingApiOutcome): OnboardingTransition {
  if (current === next) return "noop";
  if (current === null) return next === "dismissed" || next === "started" ? "insert" : "forbidden";
  if (current === "started") return next === "completed" || next === "abandoned" ? "update" : "forbidden";
  return "forbidden";
}
